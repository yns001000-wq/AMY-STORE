-- Tests de sécurité : chaque ligne doit afficher OK. Toute erreur arrête le script (ON_ERROR_STOP).
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-00000000000a', 'a@test.fr'), ('00000000-0000-0000-0000-00000000000b', 'b@test.fr');
select case when count(*) = 2 then 'OK profils créés automatiquement' else 'ÉCHEC profils' end from profils;
insert into prospects (user_id, siret, nom, source) values ('00000000-0000-0000-0000-00000000000a', '1', 'Prospect de A', 'test'), ('00000000-0000-0000-0000-00000000000b', '2', 'Prospect de B', 'test');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select case when count(*) = 1 and min(nom) = 'Prospect de A' then 'OK A ne voit que ses prospects' else 'ÉCHEC isolement prospects' end from prospects;
select case when count(*) = 1 then 'OK A ne voit que son profil' else 'ÉCHEC isolement profils' end from profils;
update prospects set nom = 'piraté' where siret = '2';
select case when (select count(*) from prospects where nom = 'piraté') = 0 then 'OK A ne peut pas modifier les prospects de B' else 'ÉCHEC' end;
update profils set secteur = 'restauration' where id = auth.uid();
select case when secteur = 'restauration' then 'OK A peut choisir son secteur' else 'ÉCHEC' end from profils;
do $$ begin
  begin update profils set plan = 'ultra' where id = auth.uid(); raise notice 'ÉCHEC : A a pu se donner l''offre Ultra';
  exception when insufficient_privilege then raise notice 'OK A ne peut pas changer son offre lui-même'; end;
  begin perform consommer_quota(auth.uid(), 'prospects', 1, 999999); raise notice 'ÉCHEC : quota appelable par l''utilisateur';
  exception when insufficient_privilege then raise notice 'OK quota réservé au serveur'; end;
  begin perform 1 from opposition; raise notice 'OK lecture opposition : % ligne(s) visibles', (select count(*) from opposition);
  exception when insufficient_privilege then raise notice 'OK opposition inaccessible'; end;
end $$;
insert into prospects (user_id, siret, nom, source) values ('00000000-0000-0000-0000-00000000000a', '3', 'Nouveau', 'test');
do $$ begin
  begin insert into prospects (user_id, siret, nom, source) values ('00000000-0000-0000-0000-00000000000b', '4', 'Injecté chez B', 'test'); raise notice 'ÉCHEC : écriture chez B';
  exception when insufficient_privilege or check_violation then raise notice 'OK A ne peut pas écrire chez B'; end;
end $$;

reset role;
select case when consommer_quota('00000000-0000-0000-0000-00000000000a', 'prospects', 10, 15) then 'OK 10/15 accepté' else 'ÉCHEC' end;
select case when not consommer_quota('00000000-0000-0000-0000-00000000000a', 'prospects', 6, 15) then 'OK 16/15 refusé (rien consommé)' else 'ÉCHEC dépassement' end;
select case when consommer_quota('00000000-0000-0000-0000-00000000000a', 'prospects', 5, 15) then 'OK 15/15 accepté' else 'ÉCHEC' end;
select case when prospects = 15 then 'OK compteur exact : 15' else 'ÉCHEC compteur ' || prospects end from consommation where user_id = '00000000-0000-0000-0000-00000000000a';
insert into evenements_stripe values ('evt_1', 'test');
do $$ begin
  begin insert into evenements_stripe values ('evt_1', 'test'); raise notice 'ÉCHEC idempotence';
  exception when unique_violation then raise notice 'OK événement Stripe traité une seule fois'; end;
end $$;
select case when purger_prospects_anciens() = 0 then 'OK purge 3 ans (rien à purger)' else 'ÉCHEC purge' end;
