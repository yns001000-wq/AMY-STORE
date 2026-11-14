-- MySite : parrainage.
-- Règle : « Invite un ami : il a -20 % sur son 1er paiement, et toi tu gagnes 29 € de crédit dès qu'il paie son 2e mois. »
-- Principe : chaque utilisateur ne lit que ses propres lignes (RLS). Toutes les écritures passent par le serveur (clé service_role),
-- sauf l'enregistrement du parrain, fait par la base elle-même à l'inscription. Une récompense est unique par parrainage (clé unique) :
-- un webhook rejoué ne peut jamais créditer deux fois.

alter table public.profils
  add column parrain_id uuid references auth.users (id) on delete set null,  -- fixé à l'inscription, ne change plus
  add column pro_offert_jusqu timestamptz,                                    -- jours de Pro offerts (parrain en offre Gratuite)
  add column a_deja_paye boolean not null default false,                      -- au moins une facture payée : plus de remise de filleul
  add column carte_parrainage_le timestamptz;                                 -- dernière proposition de parrainage (au plus une par semaine)

-- ---------- Codes personnels ----------
create table public.codes_parrainage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z]{2,10}-[2-9]{4}$'),
  cree_le timestamptz not null default now()
);
alter table public.codes_parrainage enable row level security;
create policy "code : lecture du sien" on public.codes_parrainage for select using (auth.uid() = user_id);

-- ---------- Parrainages ----------
create table public.parrainages (
  id uuid primary key default gen_random_uuid(),
  parrain_id uuid not null references auth.users (id) on delete cascade,
  filleul_id uuid not null unique references auth.users (id) on delete cascade,   -- un seul parrain par compte
  statut text not null default 'inscrit' check (statut in ('inscrit', 'paye', 'valide', 'annule')),
  periode text check (periode in ('mensuel', 'annuel')),
  paiements int not null default 0,
  factures text[] not null default '{}',          -- factures Stripe déjà comptées (idempotence)
  premier_paiement_le timestamptz,
  validation_prevue_le timestamptz,               -- filleul annuel : 14 jours après le paiement
  valide_le timestamptz,
  annule_le timestamptz,
  motif_annulation text,
  apporte_centimes int not null default 0,        -- chiffre d'affaires encaissé auprès du filleul (remboursements déduits)
  cree_le timestamptz not null default now(),
  check (parrain_id <> filleul_id)
);
alter table public.parrainages enable row level security;
create policy "parrainages : ceux dont je suis le parrain" on public.parrainages for select using (auth.uid() = parrain_id);
create index parrainages_parrain on public.parrainages (parrain_id, statut);
create index parrainages_echeance on public.parrainages (validation_prevue_le) where statut = 'paye';

-- ---------- Récompenses ----------
create table public.recompenses_parrainage (
  id uuid primary key default gen_random_uuid(),
  parrainage_id uuid not null unique references public.parrainages (id) on delete cascade,
  parrain_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('credit', 'pro_offert', 'hors_limite')),
  montant_centimes int not null default 0,
  jours int not null default 0,
  annee int not null,
  statut text not null check (statut in ('a_crediter', 'credite', 'accorde', 'sans_objet')),
  stripe_transaction_id text,
  cree_le timestamptz not null default now()
);
alter table public.recompenses_parrainage enable row level security;
create policy "récompenses : les miennes" on public.recompenses_parrainage for select using (auth.uid() = parrain_id);
create index recompenses_parrain_annee on public.recompenses_parrainage (parrain_id, annee);

-- ---------- Historique ----------
create table public.historique_parrainage (
  id bigint generated always as identity primary key,
  parrain_id uuid not null references auth.users (id) on delete cascade,
  parrainage_id uuid references public.parrainages (id) on delete cascade,
  evenement text not null,
  details jsonb not null default '{}',
  cree_le timestamptz not null default now()
);
alter table public.historique_parrainage enable row level security;
create policy "historique : le mien" on public.historique_parrainage for select using (auth.uid() = parrain_id);

revoke insert, update, delete on public.codes_parrainage, public.parrainages, public.recompenses_parrainage, public.historique_parrainage from anon, authenticated;

-- E-mail comparable (même règle que lib/parrainage.ts) : minuscules, sans « +étiquette », sans les points pour Gmail.
create or replace function public.normaliser_email(e text) returns text language sql immutable as $$
  select case when position('@' in coalesce(e, '')) = 0 then lower(coalesce(e, '')) else
    (case when d in ('gmail.com', 'googlemail.com') then replace(l, '.', '') else l end) || '@' || (case when d = 'googlemail.com' then 'gmail.com' else d end)
  end
  from (select split_part(split_part(lower(trim(e)), '@', 1), '+', 1) as l, split_part(lower(trim(e)), '@', 2) as d) x
$$;

-- Le profil reprend la provenance, l'offre visée et, s'il est valable, le parrain (code transmis à l'inscription, depuis le cookie du lien).
-- Le parrainage ne peut jamais empêcher une inscription : toute erreur de cette partie est ignorée.
create or replace function public.creer_profil() returns trigger language plpgsql security definer set search_path = public as $$
declare
  src text := nullif(left(regexp_replace(lower(coalesce(new.raw_user_meta_data->>'source', '')), '[^a-z0-9_-]', '', 'g'), 40), '');
  offre text := new.raw_user_meta_data->>'offre';
  v_code text := upper(left(coalesce(new.raw_user_meta_data->>'parrain', ''), 20));
  v_parrain uuid; v_email text; v_id uuid;
begin
  insert into public.profils (id, source, offre_voulue)
  values (new.id, src, case when offre in ('pro', 'premium', 'ultra') then offre end)
  on conflict do nothing;
  if v_code <> '' then
    begin
      select user_id into v_parrain from public.codes_parrainage where code = v_code;
      if v_parrain is not null and v_parrain <> new.id then
        select email into v_email from auth.users where id = v_parrain;
        if public.normaliser_email(v_email) <> public.normaliser_email(new.email) then
          update public.profils set parrain_id = v_parrain where id = new.id and parrain_id is null;
          insert into public.parrainages (parrain_id, filleul_id) values (v_parrain, new.id) on conflict do nothing returning id into v_id;
          if v_id is not null then
            insert into public.historique_parrainage (parrain_id, parrainage_id, evenement) values (v_parrain, v_id, 'inscription');
          end if;
        end if;
      end if;
    exception when others then null;
    end;
  end if;
  return new;
end $$;

-- Récompense du parrain, de façon atomique (appelée par le serveur au moment de la validation) :
-- verrouille le profil du parrain pour compter ses récompenses de l'année sans course, ne crée jamais deux récompenses pour un parrainage,
-- passe le parrainage en « validé » et, si le parrain est en Gratuit, prolonge ses jours de Pro offerts.
create or replace function public.recompenser_parrainage(p_parrainage uuid, p_abonne_payant boolean, p_limite int default 12, p_credit int default 2900, p_jours int default 30)
returns table (recompense_id uuid, type text, statut text, deja boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v public.parrainages; r public.recompenses_parrainage;
  v_annee int := extract(year from now() at time zone 'Europe/Paris')::int; v_nb int; v_type text;
begin
  select * into v from public.parrainages where id = p_parrainage for update;
  if not found then raise exception 'parrainage introuvable'; end if;
  select * into r from public.recompenses_parrainage where parrainage_id = p_parrainage;
  if found then return query select r.id, r.type, r.statut, true; return; end if;
  if v.statut not in ('paye', 'valide') then raise exception 'parrainage non validable (%)', v.statut; end if;
  perform 1 from public.profils where id = v.parrain_id for update;
  select count(*) into v_nb from public.recompenses_parrainage where parrain_id = v.parrain_id and annee = v_annee and type in ('credit', 'pro_offert');
  v_type := case when v_nb >= p_limite then 'hors_limite' when p_abonne_payant then 'credit' else 'pro_offert' end;
  insert into public.recompenses_parrainage (parrainage_id, parrain_id, type, montant_centimes, jours, annee, statut)
  values (p_parrainage, v.parrain_id, v_type,
          case when v_type = 'credit' then p_credit else 0 end, case when v_type = 'pro_offert' then p_jours else 0 end, v_annee,
          case v_type when 'credit' then 'a_crediter' when 'pro_offert' then 'accorde' else 'sans_objet' end)
  returning * into r;
  if v_type = 'pro_offert' then
    update public.profils set pro_offert_jusqu = greatest(coalesce(pro_offert_jusqu, now()), now()) + make_interval(days => p_jours) where id = v.parrain_id;
  end if;
  update public.parrainages set statut = 'valide', valide_le = now() where id = p_parrainage;
  insert into public.historique_parrainage (parrain_id, parrainage_id, evenement, details)
  values (v.parrain_id, p_parrainage, 'validation', jsonb_build_object('recompense', v_type));
  return query select r.id, r.type, r.statut, false;
end $$;
revoke all on function public.recompenser_parrainage(uuid, boolean, int, int, int) from public, anon, authenticated;
