-- Conformité : journal et signalements inaccessibles aux utilisateurs ; colonnes d'abonnement non modifiables par eux.
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-0000000000c9', 'z@test.fr') on conflict do nothing;
insert into journal_conformite (user_id, email, type, details) values ('00000000-0000-0000-0000-0000000000c9', 'z@test.fr', 'resiliation', '{"fin":"2026-12-01"}');
insert into signalements (url, motif, description, bonne_foi) values ('https://pizza.mysite.site', 'contrefacon', 'Photo copiée de mon site sans autorisation.', true);
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c9', false);
do $$ begin
  begin perform 1 from journal_conformite; if (select count(*) from journal_conformite) = 0 then raise notice 'OK journal de conformité invisible pour l''utilisateur'; else raise notice 'ÉCHEC journal visible'; end if;
  exception when insufficient_privilege then raise notice 'OK journal de conformité invisible pour l''utilisateur'; end;
  begin perform 1 from signalements; if (select count(*) from signalements) = 0 then raise notice 'OK signalements invisibles pour l''utilisateur'; else raise notice 'ÉCHEC signalements visibles'; end if;
  exception when insufficient_privilege then raise notice 'OK signalements invisibles pour l''utilisateur'; end;
  begin update profils set resiliation_prevue = true, retractation_le = now() where id = auth.uid(); raise notice 'ÉCHEC : statut d''abonnement modifié par l''utilisateur';
  exception when insufficient_privilege then raise notice 'OK statut d''abonnement réservé au serveur'; end;
end $$;
reset role;
delete from auth.users where id = '00000000-0000-0000-0000-0000000000c9';
select case when count(*) = 1 then 'OK la preuve de résiliation survit à la suppression du compte' else 'ÉCHEC' end from journal_conformite where email = 'z@test.fr';
do $$ begin
  begin insert into signalements (url, motif, description) values ('x', 'nimporte', 'trop court'); raise notice 'ÉCHEC : signalement invalide accepté';
  exception when check_violation then raise notice 'OK signalement contrôlé (motif, longueur)'; end;
end $$;
