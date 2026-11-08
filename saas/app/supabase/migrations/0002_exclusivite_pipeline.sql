-- MySite : exclusivité des prospects et suivi commercial.
-- Règle : une entreprise (SIRET) n'est attribuée qu'à UN SEUL utilisateur à la fois.
--  - elle est réservée dès qu'elle entre dans son cockpit ;
--  - elle est libérée si l'utilisateur la supprime, ou si elle n'a jamais été contactée 60 jours après l'attribution (anti-accaparement) ;
--  - une entreprise contactée reste réservée tant que l'utilisateur la suit (purge des 3 ans : voir 0001).

create table public.attributions (
  siret text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  departement text,
  attribue_le timestamptz not null default now()
);
alter table public.attributions enable row level security;  -- aucune politique : serveur uniquement
create index attributions_dep on public.attributions (departement);
create index attributions_user on public.attributions (user_id);

-- Réservation atomique : renvoie uniquement les SIRET effectivement obtenus (les autres sont déjà pris).
create function public.reserver_prospects(p_user uuid, p_sirets text[], p_departements text[])
returns setof text language sql security definer set search_path = public as $$
  insert into attributions (siret, user_id, departement)
  select s, p_user, d from unnest(p_sirets, p_departements) as t(s, d)
  on conflict (siret) do nothing
  returning siret;
$$;
revoke all on function public.reserver_prospects(uuid, text[], text[]) from public, anon, authenticated;

-- Suppression d'un prospect par l'utilisateur : l'entreprise redevient disponible.
create function public.liberer_attribution() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from attributions where siret = old.siret and user_id = old.user_id;
  return old;
end $$;
create trigger apres_suppression_prospect after delete on public.prospects for each row execute function public.liberer_attribution();

-- Tout changement de suivi date le dernier échange (sert à la purge et à l'anti-accaparement).
create function public.dater_echange() returns trigger language plpgsql as $$
begin
  if new.statut is distinct from old.statut or new.notes is distinct from old.notes or new.journal is distinct from old.journal then
    new.dernier_echange := now();
  end if;
  return new;
end $$;
create trigger avant_maj_prospect before update on public.prospects for each row execute function public.dater_echange();

-- Anti-accaparement : prospects jamais contactés depuis 60 jours → retirés et rendus disponibles. À planifier chaque nuit.
create function public.liberer_reservations_dormantes() returns int language sql security definer set search_path = public as $$
  with s as (
    delete from prospects where statut = 'nouveau' and dernier_echange is null and cree_le < now() - interval '60 days' returning 1
  ) select count(*)::int from s;
$$;
revoke all on function public.liberer_reservations_dormantes() from public, anon, authenticated;

-- Étapes du pipeline autorisées
alter table public.prospects add constraint statut_valide check (statut in ('nouveau', 'contacte', 'repondu', 'rdv', 'devis', 'gagne', 'perdu', 'refus'));
