-- Provenance et offre visée : reprises à l'inscription, nettoyées ; l'utilisateur ne peut pas les modifier.
\set ON_ERROR_STOP on
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@ex.fr', '{"source":"TikTok <script>","offre":"pro"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'b@ex.fr', '{"offre":"admin"}'),
  ('00000000-0000-0000-0000-0000000000a3', 'c@ex.fr', null);
do $$ declare p record; begin
  select * into p from public.profils where id = '00000000-0000-0000-0000-0000000000a1';
  assert p.source = 'tiktokscript' and p.offre_voulue = 'pro', 'provenance nettoyée et offre reprise';
  raise notice 'OK 1 : provenance nettoyée, offre visée reprise';
  select * into p from public.profils where id = '00000000-0000-0000-0000-0000000000a2';
  assert p.source is null and p.offre_voulue is null, 'offre inconnue ignorée';
  raise notice 'OK 2 : offre inconnue ignorée';
  select * into p from public.profils where id = '00000000-0000-0000-0000-0000000000a3';
  assert p.id is not null and p.emails_essai, 'profil créé sans métadonnées';
  raise notice 'OK 3 : inscription sans métadonnées';
end $$;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
update public.profils set emails_essai = false where id = auth.uid();
do $$ begin
  begin update public.profils set source = 'x' where id = auth.uid(); raise exception 'aurait dû échouer';
  exception when insufficient_privilege then raise notice 'OK 4 : provenance non modifiable par l''utilisateur'; end;
  begin update public.profils set mail_essai_fin_le = now() where id = auth.uid(); raise exception 'aurait dû échouer';
  exception when insufficient_privilege then raise notice 'OK 5 : dates d''envoi réservées au serveur'; end;
end $$;
reset role;
do $$ begin assert (select not emails_essai from public.profils where id = '00000000-0000-0000-0000-0000000000a1'); raise notice 'OK 6 : préférence e-mails modifiable'; end $$;
