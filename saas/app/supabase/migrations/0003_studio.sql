-- MySite : Studio de sites (maquettes express et sites sur mesure par l'IA), versions et quota de retouches IA.

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prospect_id uuid references public.prospects (id) on delete set null,
  type text not null check (type in ('express', 'ia')),
  donnees jsonb not null,
  etude jsonb,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
alter table public.sites enable row level security;
create policy "sites : les siens" on public.sites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index sites_user on public.sites (user_id, maj_le desc);
create index sites_prospect on public.sites (prospect_id);

-- Historique des versions (nombre conservé selon l'offre ; purge côté serveur)
create table public.sites_versions (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  donnees jsonb not null,
  libelle text,
  cree_le timestamptz not null default now()
);
alter table public.sites_versions enable row level security;
create policy "versions : les siennes" on public.sites_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index versions_site on public.sites_versions (site_id, cree_le desc);

-- Quota de retouches IA
alter table public.consommation add column retouches_ia int not null default 0;

create or replace function public.consommer_quota(p_user uuid, p_type text, p_n int, p_limite int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_mois text := to_char(now() at time zone 'Europe/Paris', 'YYYY-MM'); v_ok boolean;
begin
  if p_type not in ('prospects', 'messages_ia', 'sites_ia', 'retouches_ia') or p_n < 1 then raise exception 'type ou quantité invalide'; end if;
  insert into consommation (user_id, mois) values (p_user, v_mois) on conflict do nothing;
  execute format('update consommation set %1$I = %1$I + $1 where user_id = $2 and mois = $3 and %1$I + $1 <= $4 returning true', p_type)
    into v_ok using p_n, p_user, v_mois, p_limite;
  return coalesce(v_ok, false);
end $$;
revoke all on function public.consommer_quota(uuid, text, int, int) from public, anon, authenticated;

-- Remboursement d'une unité (échec de l'IA), sans jamais passer sous zéro
create function public.rembourser_quota(p_user uuid, p_type text) returns void language plpgsql security definer set search_path = public as $$
declare v_mois text := to_char(now() at time zone 'Europe/Paris', 'YYYY-MM');
begin
  if p_type not in ('prospects', 'messages_ia', 'sites_ia', 'retouches_ia') then raise exception 'type invalide'; end if;
  execute format('update consommation set %1$I = greatest(%1$I - 1, 0) where user_id = $1 and mois = $2', p_type) using p_user, v_mois;
end $$;
revoke all on function public.rembourser_quota(uuid, text) from public, anon, authenticated;

-- Stockage des photos des clients (offres Premium et Ultra). Ignoré hors Supabase (schéma storage absent).
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('studio', 'studio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;
