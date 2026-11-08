\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-00000000000a', 'a@test.fr'), ('00000000-0000-0000-0000-00000000000b', 'b@test.fr');
-- A réserve 3 entreprises
select case when count(*) = 3 then 'OK A réserve 3 entreprises' else 'ÉCHEC réservation A' end from reserver_prospects('00000000-0000-0000-0000-00000000000a', array['S1','S2','S3'], array['69','69','69']);
-- B tente S2, S3 et S4 : seule S4 lui revient
select case when array_agg(s) = array['S4'] then 'OK B n''obtient que S4 (S2 et S3 sont à A)' else 'ÉCHEC exclusivité' end from reserver_prospects('00000000-0000-0000-0000-00000000000b', array['S2','S3','S4'], array['69','69','69']) as s;
insert into prospects (user_id, siret, nom, source) values ('00000000-0000-0000-0000-00000000000a', 'S1', 'Un', 't'), ('00000000-0000-0000-0000-00000000000a', 'S2', 'Deux', 't');
-- A supprime S2 : elle redevient disponible, B peut l'obtenir
delete from prospects where siret = 'S2';
select case when count(*) = 1 then 'OK après suppression par A, B obtient S2' else 'ÉCHEC libération' end from reserver_prospects('00000000-0000-0000-0000-00000000000b', array['S2'], array['69']);
-- Un changement de statut date le dernier échange
update prospects set statut = 'contacte' where siret = 'S1';
select case when dernier_echange is not null then 'OK le suivi date le dernier échange' else 'ÉCHEC date' end from prospects where siret = 'S1';
-- Statut inconnu refusé
do $$ begin
  begin update prospects set statut = 'nimporte' where siret = 'S1'; raise notice 'ÉCHEC statut libre';
  exception when check_violation then raise notice 'OK statut hors pipeline refusé'; end;
end $$;
-- Anti-accaparement : prospect jamais contacté depuis 61 jours → retiré et libéré
insert into prospects (user_id, siret, nom, source, cree_le) values ('00000000-0000-0000-0000-00000000000a', 'S3', 'Dormant', 't', now() - interval '61 days');
select case when liberer_reservations_dormantes() = 1 then 'OK prospect dormant retiré' else 'ÉCHEC dormant' end;
select case when not exists (select 1 from attributions where siret = 'S3') then 'OK S3 de nouveau disponible' else 'ÉCHEC S3 toujours réservé' end;
select case when exists (select 1 from prospects where siret = 'S1') then 'OK le prospect contacté reste réservé' else 'ÉCHEC' end;
-- L'utilisateur ne peut ni lire ni réserver directement
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  begin perform reserver_prospects(auth.uid(), array['S9'], array['69']); raise notice 'ÉCHEC réservation directe';
  exception when insufficient_privilege then raise notice 'OK réservation réservée au serveur'; end;
end $$;
select case when count(*) = 0 then 'OK attributions invisibles pour l''utilisateur' else 'ÉCHEC fuite attributions' end from attributions;
