-- MySite SaaS : schéma initial.
-- Principe : chaque utilisateur ne voit et ne modifie QUE ses données (Row Level Security).
-- L'offre (plan) et les champs Stripe ne sont modifiables que par le serveur (clé service_role, webhook Stripe).

create extension if not exists pgcrypto;

-- ---------- Profils ----------
create table public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text,
  secteur text,                                  -- clé de lib/secteurs.ts
  departements text[] not null default '{}',     -- codes INSEE ("69", "2A"…)
  statut_utilisateur text check (statut_utilisateur in ('professionnel', 'particulier')),
  cgu_acceptees_le timestamptz,
  plan text not null default 'gratuit' check (plan in ('gratuit', 'pro', 'premium', 'ultra')),
  essai_premium_utilise boolean not null default false,
  essai_fin timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  abonnement_statut text,
  periode_fin timestamptz,
  cree_le timestamptz not null default now()
);
alter table public.profils enable row level security;
create policy "profil : lecture du sien" on public.profils for select using (auth.uid() = id);
create policy "profil : mise à jour du sien" on public.profils for update using (auth.uid() = id) with check (auth.uid() = id);
-- L'utilisateur ne peut modifier que ces colonnes ; plan et Stripe restent réservés au serveur.
revoke update on public.profils from authenticated;
grant update (prenom, secteur, departements, statut_utilisateur, cgu_acceptees_le) on public.profils to authenticated;

-- Création automatique du profil à l'inscription
create function public.creer_profil() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profils (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger apres_inscription after insert on auth.users for each row execute function public.creer_profil();

-- ---------- Prospects (propres à chaque utilisateur) ----------
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  siret text,
  siren text,
  nom text not null,
  enseigne text,
  naf text,
  metier text,
  adresse text,
  code_postal text,
  ville text,
  departement text,
  telephone text,
  email text,
  site_web text,
  source text not null,                          -- ex. "Sirene (INSEE), licence ouverte"
  indices text,
  statut text not null default 'nouveau',
  prochaine_action text,
  date_prochaine_action date,
  notes text,
  journal jsonb not null default '[]',
  dernier_echange timestamptz,
  cree_le timestamptz not null default now(),
  unique (user_id, siret)
);
alter table public.prospects enable row level security;
create policy "prospects : les siens" on public.prospects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index prospects_user on public.prospects (user_id, statut);

-- ---------- Consommation mensuelle (quotas) ----------
create table public.consommation (
  user_id uuid not null references auth.users (id) on delete cascade,
  mois text not null,                            -- "2026-11"
  prospects int not null default 0,
  messages_ia int not null default 0,
  sites_ia int not null default 0,
  primary key (user_id, mois)
);
alter table public.consommation enable row level security;
create policy "consommation : lecture de la sienne" on public.consommation for select using (auth.uid() = user_id);

-- Consommation atomique : n'incrémente que si la limite n'est pas dépassée. Appelée par le serveur uniquement.
create function public.consommer_quota(p_user uuid, p_type text, p_n int, p_limite int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_mois text := to_char(now() at time zone 'Europe/Paris', 'YYYY-MM'); v_ok boolean;
begin
  if p_type not in ('prospects', 'messages_ia', 'sites_ia') or p_n < 1 then raise exception 'type ou quantité invalide'; end if;
  insert into consommation (user_id, mois) values (p_user, v_mois) on conflict do nothing;
  execute format('update consommation set %1$I = %1$I + $1 where user_id = $2 and mois = $3 and %1$I + $1 <= $4 returning true', p_type)
    into v_ok using p_n, p_user, v_mois, p_limite;
  return coalesce(v_ok, false);
end $$;
revoke all on function public.consommer_quota(uuid, text, int, int) from public, anon, authenticated;

-- ---------- Liste d'opposition commune (RGPD) ----------
-- Une entreprise qui demande son retrait n'est plus proposée à AUCUN utilisateur.
-- On ne conserve que l'identifiant nécessaire à l'exclusion (SIREN/SIRET), la date et le canal.
create table public.opposition (
  id uuid primary key default gen_random_uuid(),
  siren text,
  siret text,
  telephone_hash text,                           -- sha256 du numéro normalisé, si fourni
  recue_le timestamptz not null default now(),
  canal text not null default 'formulaire'
);
alter table public.opposition enable row level security;  -- aucune politique : accès serveur uniquement
create index opposition_siren on public.opposition (siren);

-- ---------- Événements Stripe déjà traités (idempotence du webhook) ----------
create table public.evenements_stripe (
  id text primary key,
  type text not null,
  recu_le timestamptz not null default now()
);
alter table public.evenements_stripe enable row level security;  -- serveur uniquement

-- ---------- Durée de conservation : prospects sans échange depuis 3 ans ----------
-- À planifier (Supabase > Database > Cron) : select public.purger_prospects_anciens();
create function public.purger_prospects_anciens() returns int language sql security definer set search_path = public as $$
  with s as (delete from prospects where coalesce(dernier_echange, cree_le) < now() - interval '3 years' returning 1)
  select count(*)::int from s;
$$;
revoke all on function public.purger_prospects_anciens() from public, anon, authenticated;
