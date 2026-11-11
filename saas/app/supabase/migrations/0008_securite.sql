-- MySite : durcissement de sécurité (audit du 11/11/2026).
--  1. Mise en ligne : un utilisateur ne peut plus écrire lui-même dans « publications » avec sa clé de session.
--     Seul le serveur (après vérification de l'offre, des mentions légales, de l'adresse et du domaine) publie.
--     Avant : un appel direct à l'API Supabase permettait de mettre en ligne n'importe quel HTML, sur n'importe
--     quelle adresse libre, sans abonnement.
--  2. Limitation du nombre de requêtes des formulaires publics (signalement, opposition), contre les abus.

-- 1. Publications : lecture et retrait par le propriétaire ; écriture réservée au serveur (clé service_role).
drop policy if exists "publications : les siennes" on public.publications;
create policy "publications : lecture des siennes" on public.publications for select using (auth.uid() = user_id);
create policy "publications : retrait des siennes" on public.publications for delete using (auth.uid() = user_id);
revoke insert, update on public.publications from anon, authenticated;

-- 2. Limitation de débit : une ligne par clé (ex. « signaler:<empreinte IP> ») et par fenêtre de temps.
create table if not exists public.limites_requetes (
  cle text not null,
  fenetre timestamptz not null,
  nombre int not null default 0,
  primary key (cle, fenetre)
);
alter table public.limites_requetes enable row level security;  -- aucune politique : serveur uniquement

-- Renvoie true si la requête est autorisée (moins de p_max requêtes dans la fenêtre de p_secondes).
create or replace function public.limiter_requete(p_cle text, p_max int, p_secondes int) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  f timestamptz := to_timestamp(floor(extract(epoch from now()) / p_secondes) * p_secondes);
  n int;
begin
  insert into public.limites_requetes (cle, fenetre, nombre) values (left(p_cle, 200), f, 1)
  on conflict (cle, fenetre) do update set nombre = public.limites_requetes.nombre + 1
  returning nombre into n;
  -- Ménage occasionnel des anciennes fenêtres
  if random() < 0.01 then delete from public.limites_requetes where fenetre < now() - interval '2 days'; end if;
  return n <= p_max;
end $$;
revoke all on function public.limiter_requete(text, int, int) from public, anon, authenticated;
