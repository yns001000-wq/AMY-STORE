-- MySite : améliorations de conversion (22/11/2026).
--  1. Démo publique de la page d'accueil : cache des comptages par code postal (24 h). Aucune donnée personnelle :
--     uniquement des totaux, une répartition par métier et des points arrondis (environ 1 km).
--  2. Score de priorité des prospects : date de création et tranche d'effectif issues de la base Sirene.
--  3. E-mails de relance (J+1, J+3, J+6) : désinscription et mémoire des envois (jamais deux fois le même).

-- 1. Cache de la démo (lecture et écriture par le serveur uniquement).
create table if not exists public.demo_cache (
  code_postal text primary key,
  resultat jsonb not null,
  cree_le timestamptz not null default now()
);
alter table public.demo_cache enable row level security;  -- aucune politique : serveur uniquement

-- 2. Données Sirene utiles au score (remplies pour les nouveaux prospects ; l'année de création des anciens est relue dans « indices »).
alter table public.prospects add column if not exists date_creation date;
alter table public.prospects add column if not exists tranche_effectif text;

-- 3. Relances par e-mail.
alter table public.profils add column if not exists relances_desinscrit boolean not null default false;
alter table public.profils add column if not exists relances_envoyees jsonb not null default '{}'::jsonb;  -- ex. {"j1": "2026-11-23T08:00:00Z"}
