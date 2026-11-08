-- MySite : de la prospection à l'encaissement.
--  1. Carte : coordonnées GPS des prospects.
--  2. Mise en ligne des sites finaux (sous-domaine MySite ou nom de domaine du client).
--  3. Devis, factures et avoirs : numérotation chronologique continue, factures non modifiables une fois émises.
--  4. Assistant de livraison (suivi par prospect) et progression dans l'Académie.

-- 1. Carte ----------------------------------------------------------------------------------------
alter table public.prospects add column latitude double precision, add column longitude double precision;

-- 2. Mise en ligne --------------------------------------------------------------------------------
create table public.publications (
  site_id uuid primary key references public.sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  domaine text unique check (domaine is null or domaine ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$'),
  html text not null,
  mentions jsonb not null,
  publie_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
alter table public.publications enable row level security;
create policy "publications : les siennes" on public.publications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index publications_user on public.publications (user_id);

-- 3. Devis et factures ----------------------------------------------------------------------------
-- Identité de l'utilisateur en tant que vendeur (mentions obligatoires des devis et factures)
create table public.entreprises (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nom text not null default '',                 -- nom et prénom, ou raison sociale
  siret text not null default '',
  adresse text not null default '',
  email text not null default '',
  telephone text not null default '',
  tva text not null default 'franchise',        -- 'franchise' (art. 293 B du CGI) ou numéro de TVA intracommunautaire
  taux_tva numeric(5,2) not null default 0,
  iban text not null default '',
  conditions text not null default '',          -- conditions de paiement personnalisées
  maj_le timestamptz not null default now()
);
alter table public.entreprises enable row level security;
create policy "entreprise : la sienne" on public.entreprises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prospect_id uuid references public.prospects (id) on delete set null,
  type text not null check (type in ('devis', 'facture', 'avoir')),
  numero text,                                   -- attribué à l'émission, jamais avant
  statut text not null default 'brouillon' check (statut in ('brouillon', 'envoye', 'accepte', 'refuse', 'emise', 'payee', 'annulee')),
  client jsonb not null default '{}',            -- {nom, adresse, siret, email}
  emetteur jsonb,                                -- copie figée de l'identité du vendeur à l'émission
  lignes jsonb not null default '[]',            -- [{designation, quantite, prix_unitaire}] en euros HT
  total_ht numeric(12,2) not null default 0,
  taux_tva numeric(5,2) not null default 0,
  date_emission date,
  date_echeance date,                            -- validité du devis, ou échéance de paiement de la facture
  conditions text not null default '',
  origine_id uuid references public.documents (id) on delete set null,  -- devis d'origine d'une facture, facture annulée par un avoir
  paye_le date,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  unique (user_id, numero)
);
alter table public.documents enable row level security;
create policy "documents : lecture des siens" on public.documents for select using (auth.uid() = user_id);
create policy "documents : création des siens" on public.documents for insert with check (auth.uid() = user_id and numero is null and statut = 'brouillon');
create policy "documents : modification des siens" on public.documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents : suppression des brouillons" on public.documents for delete using (auth.uid() = user_id and numero is null);
create index documents_user on public.documents (user_id, cree_le desc);
create index documents_prospect on public.documents (prospect_id);

-- Un document émis ne se modifie plus (seuls le paiement et l'annulation par avoir changent son statut).
create function public.proteger_document() returns trigger language plpgsql as $$
begin
  if old.numero is not null then
    if new.numero is distinct from old.numero or new.client is distinct from old.client or new.lignes is distinct from old.lignes
       or new.total_ht is distinct from old.total_ht or new.taux_tva is distinct from old.taux_tva or new.emetteur is distinct from old.emetteur
       or new.date_emission is distinct from old.date_emission or new.type is distinct from old.type or new.user_id is distinct from old.user_id then
      raise exception 'Document émis : il ne peut plus être modifié (créez un avoir pour annuler une facture).';
    end if;
    if old.type in ('facture', 'avoir') and new.statut not in ('emise', 'payee', 'annulee') then raise exception 'Statut invalide pour une facture émise'; end if;
    if old.type = 'devis' and new.statut not in ('envoye', 'accepte', 'refuse') then raise exception 'Statut invalide pour un devis émis'; end if;
  -- Brouillon : seul emettre_document() (exécutée avec les droits du propriétaire) attribue le numéro et le statut.
  elsif current_user in ('authenticated', 'anon') and (new.numero is not null or new.statut <> 'brouillon') then
    raise exception 'Un brouillon devient un document uniquement par l''émission.';
  end if;
  new.maj_le := now();
  return new;
end $$;
create trigger avant_maj_document before update on public.documents for each row execute function public.proteger_document();

-- Compteurs : une série par utilisateur, par type et par année (F-2026-0001, D-2026-0001, A-2026-0001)
create table public.compteurs_documents (
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  annee int not null,
  dernier int not null default 0,
  primary key (user_id, type, annee)
);
alter table public.compteurs_documents enable row level security;  -- aucune politique : uniquement via les fonctions

-- Émission : numéro chronologique sans trou, identité du vendeur figée, dates.
create function public.emettre_document(p_id uuid) returns text language plpgsql security definer set search_path = public as $$
declare d documents; e entreprises; v_annee int := extract(year from (now() at time zone 'Europe/Paris'))::int; v_n int; v_num text;
begin
  select * into d from documents where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'Document introuvable'; end if;
  if d.numero is not null then return d.numero; end if;
  if jsonb_array_length(d.lignes) = 0 then raise exception 'Ajoutez au moins une ligne'; end if;
  if coalesce(d.client->>'nom', '') = '' then raise exception 'Indiquez le client'; end if;
  select * into e from entreprises where user_id = auth.uid();
  if not found or e.nom = '' or e.siret = '' or e.adresse = '' then raise exception 'Complétez d''abord votre identité de vendeur (nom, SIRET, adresse)'; end if;
  insert into compteurs_documents (user_id, type, annee, dernier) values (auth.uid(), d.type, v_annee, 1)
    on conflict (user_id, type, annee) do update set dernier = compteurs_documents.dernier + 1
    returning dernier into v_n;
  v_num := case d.type when 'facture' then 'F' when 'devis' then 'D' else 'A' end || '-' || v_annee || '-' || lpad(v_n::text, 4, '0');
  update documents set numero = v_num, emetteur = to_jsonb(e) - 'user_id' - 'maj_le', date_emission = (now() at time zone 'Europe/Paris')::date,
    statut = case when d.type = 'devis' then 'envoye' else 'emise' end
    where id = p_id;
  return v_num;
end $$;
revoke all on function public.emettre_document(uuid) from public, anon;
grant execute on function public.emettre_document(uuid) to authenticated;

-- Annulation d'une facture émise : avoir du même montant, émis immédiatement, et facture marquée annulée.
create function public.annuler_facture(p_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare f documents; v_avoir uuid;
begin
  select * into f from documents where id = p_id and user_id = auth.uid() and type = 'facture' and numero is not null for update;
  if not found then raise exception 'Facture émise introuvable'; end if;
  if f.statut = 'annulee' then raise exception 'Facture déjà annulée'; end if;
  insert into documents (user_id, prospect_id, type, client, lignes, total_ht, taux_tva, conditions, origine_id)
    values (f.user_id, f.prospect_id, 'avoir', f.client, f.lignes, f.total_ht, f.taux_tva, 'Avoir annulant la facture ' || f.numero || '.', f.id)
    returning id into v_avoir;
  perform emettre_document(v_avoir);
  update documents set statut = 'annulee' where id = p_id;
  return v_avoir;
end $$;
revoke all on function public.annuler_facture(uuid) from public, anon;
grant execute on function public.annuler_facture(uuid) to authenticated;

-- 4. Livraison et Académie ------------------------------------------------------------------------
create table public.livraisons (
  prospect_id uuid primary key references public.prospects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  etapes jsonb not null default '{}',            -- {cle_etape: "AAAA-MM-JJ"}
  domaine text,
  maj_le timestamptz not null default now()
);
alter table public.livraisons enable row level security;
create policy "livraisons : les siennes" on public.livraisons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.progression_cours (
  user_id uuid not null references auth.users (id) on delete cascade,
  lecon text not null check (char_length(lecon) <= 60),
  score int not null default 0 check (score between 0 and 100),
  termine_le timestamptz not null default now(),
  primary key (user_id, lecon)
);
alter table public.progression_cours enable row level security;
create policy "progression : la sienne" on public.progression_cours for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fin d'abonnement : les sites en ligne d'un compte revenu à l'offre Gratuite sont retirés après 15 jours de grâce
-- (annoncé dans les CGV ; les sites restent dans le Studio et peuvent être téléchargés). À planifier chaque nuit.
create function public.retirer_publications_hors_offre() returns int language sql security definer set search_path = public as $$
  with s as (
    delete from publications pu using profils pr
    where pr.id = pu.user_id and pr.plan = 'gratuit'
      and coalesce(greatest(pr.periode_fin, pr.essai_fin), '-infinity'::timestamptz) < now() - interval '15 days'
    returning 1
  ) select count(*)::int from s;
$$;
revoke all on function public.retirer_publications_hors_offre() from public, anon, authenticated;
