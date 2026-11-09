-- MySite : conformité légale de l'abonnement et des contenus publiés.
-- 1. Suivi de l'abonnement (reconduction, résiliation, rétractation).
-- 2. Journal de conformité : preuves des résiliations, rétractations, suppressions de compte (conservé même après suppression du compte).
-- 3. Signalements de contenus illicites sur les sites publiés (règlement européen DSA, art. 16 ; LCEN art. 6).

-- 1. Abonnement (écrit uniquement par le serveur, via le webhook Stripe)
alter table public.profils
  add column periode text check (periode in ('mensuel', 'annuel')),
  add column abonnement_debut timestamptz,
  add column resiliation_prevue boolean not null default false,
  add column rappel_reconduction_pour timestamptz,
  add column retractation_le timestamptz;

-- 2. Journal de conformité (serveur uniquement : aucune politique RLS)
create table public.journal_conformite (
  id bigint generated always as identity primary key,
  user_id uuid,                 -- pas de clé étrangère : la preuve survit à la suppression du compte
  email text,
  type text not null check (type in ('resiliation', 'reprise', 'retractation', 'suppression_compte', 'export_donnees', 'rappel_reconduction', 'changement_cgu')),
  details jsonb not null default '{}',
  cree_le timestamptz not null default now()
);
alter table public.journal_conformite enable row level security;
create index journal_conformite_user on public.journal_conformite (user_id, cree_le desc);

-- 3. Signalements (déposés par le public via le serveur ; traités par l'éditeur de MySite)
create table public.signalements (
  id uuid primary key default gen_random_uuid(),
  url text not null check (char_length(url) <= 500),
  motif text not null check (motif in ('contrefacon', 'trompeur', 'illicite', 'donnees', 'usurpation', 'autre')),
  description text not null check (char_length(description) between 10 and 3000),
  nom text check (char_length(nom) <= 120),
  email text check (char_length(email) <= 200),
  bonne_foi boolean not null default false,
  statut text not null default 'recu' check (statut in ('recu', 'en_cours', 'retire', 'rejete')),
  decision text,                -- motivation communiquée (DSA, art. 17)
  traite_le timestamptz,
  cree_le timestamptz not null default now()
);
alter table public.signalements enable row level security;  -- aucune politique : écriture et lecture par le serveur uniquement
create index signalements_statut on public.signalements (statut, cree_le desc);
