-- Croissance : provenance des inscriptions, offre visée à l'inscription, e-mails liés à l'essai Premium.
alter table public.profils
  add column source text,                                   -- d'où vient l'inscription ("tiktok", "instagram"…), sans cookie
  add column offre_voulue text check (offre_voulue in ('pro', 'premium', 'ultra')),
  add column emails_essai boolean not null default true,    -- e-mails d'information sur l'essai (désactivables dans « Mon compte »)
  add column mail_essai_j2_le timestamptz,                  -- rappel envoyé 2 jours avant la fin de l'essai
  add column mail_essai_fin_le timestamptz;                 -- message envoyé à la fin de l'essai
grant update (emails_essai) on public.profils to authenticated;

-- Le profil reprend la provenance et l'offre visée, transmises à l'inscription (valeurs nettoyées : jamais de texte libre).
create or replace function public.creer_profil() returns trigger language plpgsql security definer set search_path = public as $$
declare
  src text := nullif(left(regexp_replace(lower(coalesce(new.raw_user_meta_data->>'source', '')), '[^a-z0-9_-]', '', 'g'), 40), '');
  offre text := new.raw_user_meta_data->>'offre';
begin
  insert into public.profils (id, source, offre_voulue)
  values (new.id, src, case when offre in ('pro', 'premium', 'ultra') then offre end)
  on conflict do nothing;
  return new;
end $$;
