-- Banque de photos personnelle : isolement entre utilisateurs, portée contrôlée, libération à la suppression du prospect.
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-0000000000e1', 'e@test.fr'), ('00000000-0000-0000-0000-0000000000f1', 'f@test.fr') on conflict do nothing;
insert into prospects (id, user_id, siret, nom, source) values ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-0000000000e1', '900', 'Pizza E', 'test');
insert into photos_perso (user_id, prospect_id, chemin, url, legende, portee) values
  ('00000000-0000-0000-0000-0000000000e1', '33333333-3333-3333-3333-333333333333', 'e/1.jpg', 'https://x/e1.jpg', 'Devanture', 'commerce'),
  ('00000000-0000-0000-0000-0000000000f1', null, 'f/1.jpg', 'https://x/f1.jpg', 'Four', 'tous');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
select case when count(*) = 1 and min(legende) = 'Devanture' then 'OK E ne voit que sa banque' else 'ÉCHEC isolement banque' end from photos_perso;
update photos_perso set legende = 'piraté' where chemin = 'f/1.jpg';
delete from photos_perso where chemin = 'f/1.jpg';
do $$ begin
  begin insert into photos_perso (user_id, chemin, url) values ('00000000-0000-0000-0000-0000000000f1', 'x', 'y'); raise notice 'ÉCHEC : photo ajoutée chez F';
  exception when insufficient_privilege or check_violation then raise notice 'OK E ne peut pas écrire dans la banque de F'; end;
  begin update photos_perso set portee = 'partout' where chemin = 'e/1.jpg'; raise notice 'ÉCHEC : portée libre';
  exception when check_violation then raise notice 'OK portée contrôlée'; end;
end $$;
reset role;
select case when legende = 'Four' then 'OK E ne peut ni modifier ni supprimer la banque de F' else 'ÉCHEC' end from photos_perso where chemin = 'f/1.jpg';
delete from prospects where id = '33333333-3333-3333-3333-333333333333';
select case when prospect_id is null and portee = 'commerce' then 'OK prospect retiré : la photo reste réservée (jamais rendue générique)' else 'ÉCHEC' end from photos_perso where chemin = 'e/1.jpg';
