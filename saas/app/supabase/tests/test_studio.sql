-- Studio : isolement des sites et des versions, quota de retouches, remboursement.
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-0000000000c1', 'c@test.fr'), ('00000000-0000-0000-0000-0000000000d1', 'd@test.fr') on conflict do nothing;
insert into sites (id, user_id, type, donnees) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000c1', 'express', '{"nom":"Site de C"}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000d1', 'ia', '{"nom":"Site de D"}');
insert into sites_versions (site_id, user_id, donnees, libelle) values ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000d1', '{}', 'v1');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
select case when count(*) = 1 and min(donnees->>'nom') = 'Site de C' then 'OK C ne voit que ses sites' else 'ÉCHEC isolement sites' end from sites;
select case when count(*) = 0 then 'OK C ne voit pas les versions de D' else 'ÉCHEC isolement versions' end from sites_versions;
update sites set donnees = '{"nom":"piraté"}' where id = '22222222-2222-2222-2222-222222222222';
delete from sites where id = '22222222-2222-2222-2222-222222222222';
do $$ begin
  begin insert into sites (user_id, type, donnees) values ('00000000-0000-0000-0000-0000000000d1', 'express', '{}'); raise notice 'ÉCHEC : site créé chez D';
  exception when insufficient_privilege or check_violation then raise notice 'OK C ne peut pas créer de site chez D'; end;
  begin insert into sites (user_id, type, donnees) values (auth.uid(), 'inconnu', '{}'); raise notice 'ÉCHEC : type libre accepté';
  exception when check_violation then raise notice 'OK type de site contrôlé'; end;
  begin perform rembourser_quota(auth.uid(), 'retouches_ia'); raise notice 'ÉCHEC : remboursement appelable par l''utilisateur';
  exception when insufficient_privilege then raise notice 'OK remboursement réservé au serveur'; end;
end $$;
reset role;
select case when donnees->>'nom' = 'Site de D' then 'OK C ne peut ni modifier ni supprimer le site de D' else 'ÉCHEC' end from sites where id = '22222222-2222-2222-2222-222222222222';
select case when consommer_quota('00000000-0000-0000-0000-0000000000c1', 'retouches_ia', 1, 1) then 'OK retouche 1/1 acceptée' else 'ÉCHEC' end;
select case when not consommer_quota('00000000-0000-0000-0000-0000000000c1', 'retouches_ia', 1, 1) then 'OK retouche 2/1 refusée' else 'ÉCHEC' end;
select rembourser_quota('00000000-0000-0000-0000-0000000000c1', 'retouches_ia');
select rembourser_quota('00000000-0000-0000-0000-0000000000c1', 'retouches_ia');
select case when retouches_ia = 0 then 'OK remboursement sans passer sous zéro' else 'ÉCHEC ' || retouches_ia end from consommation where user_id = '00000000-0000-0000-0000-0000000000c1';
delete from sites where id = '22222222-2222-2222-2222-222222222222';
select case when count(*) = 0 then 'OK versions supprimées avec le site' else 'ÉCHEC cascade' end from sites_versions;
