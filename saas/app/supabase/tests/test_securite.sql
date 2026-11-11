-- Durcissement 0008 : publications écrites uniquement par le serveur ; limitation de débit.
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-0000000000c7', 'pirate@test.fr') on conflict do nothing;
insert into sites (id, user_id, type, donnees) values ('cccccccc-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c7', 'ia', '{}');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c7', false);
do $$ begin
  begin insert into publications (site_id, user_id, slug, html, mentions) values ('cccccccc-0000-0000-0000-000000000001', auth.uid(), 'site-pirate', '<script>x</script>', '{}');
    raise notice 'ÉCHEC : publication directe acceptée';
  exception when insufficient_privilege then raise notice 'OK publication directe refusée (serveur uniquement)'; end;
  begin perform limiter_requete('x', 1, 60); raise notice 'ÉCHEC : limiter_requete appelable par un utilisateur';
  exception when insufficient_privilege then raise notice 'OK limitation réservée au serveur'; end;
  begin perform 1 from limites_requetes; raise notice 'OK limites : % ligne visible', (select count(*) from limites_requetes);
  exception when insufficient_privilege then raise notice 'OK limites inaccessibles'; end;
end $$;
reset role;
insert into publications (site_id, user_id, slug, html, mentions) values ('cccccccc-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c7', 'site-serveur', '<html></html>', '{}');
set role authenticated;
select case when count(*) = 1 then 'OK le propriétaire lit sa publication' else 'ÉCHEC lecture' end from publications where site_id = 'cccccccc-0000-0000-0000-000000000001';
do $$ begin
  update publications set html = '<script>x</script>' where site_id = 'cccccccc-0000-0000-0000-000000000001'; raise notice 'ÉCHEC : modification directe acceptée';
exception when insufficient_privilege then raise notice 'OK modification directe refusée'; end $$;
delete from publications where site_id = 'cccccccc-0000-0000-0000-000000000001';
select case when count(*) = 0 then 'OK le propriétaire peut retirer son site' else 'ÉCHEC retrait' end from publications where site_id = 'cccccccc-0000-0000-0000-000000000001';
reset role;
select case when limiter_requete('t', 2, 3600) and limiter_requete('t', 2, 3600) and not limiter_requete('t', 2, 3600) then 'OK limitation : 3e requête refusée' else 'ÉCHEC limitation' end;
