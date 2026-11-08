-- MySite : banque de photos personnelle (offres Premium et Ultra).
-- Chaque photo envoyée peut être gardée pour les prochains sites :
--  - portée « commerce » : réservée aux sites du commerce photographié (on ne montre jamais la devanture ou les plats
--    d'un commerce sur le site d'un autre : ce serait trompeur) ;
--  - portée « tous » : photo dont l'utilisateur détient les droits et sans élément propre à un commerce.
create table public.photos_perso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prospect_id uuid references public.prospects (id) on delete set null,
  chemin text not null,
  url text not null,
  legende text not null default '' check (char_length(legende) <= 120),
  portee text not null default 'commerce' check (portee in ('commerce', 'tous')),
  cree_le timestamptz not null default now()
);
alter table public.photos_perso enable row level security;
create policy "photos : les siennes" on public.photos_perso for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index photos_perso_user on public.photos_perso (user_id, cree_le desc);
create index photos_perso_prospect on public.photos_perso (prospect_id);
