-- Devis et factures : numérotation continue, documents émis non modifiables, avoirs, isolement ; publications ; progression.
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-0000000000a5', 'v@test.fr'), ('00000000-0000-0000-0000-0000000000b5', 'w@test.fr') on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a5', false);
insert into documents (id, user_id, type, client, lignes, total_ht) values
  ('aaaaaaaa-0000-0000-0000-000000000001', auth.uid(), 'facture', '{"nom":"Pizza Bella"}', '[{"designation":"Site vitrine","quantite":1,"prix_unitaire":490}]', 490),
  ('aaaaaaaa-0000-0000-0000-000000000002', auth.uid(), 'facture', '{"nom":"Snack Lyon"}', '[{"designation":"Site vitrine","quantite":1,"prix_unitaire":390}]', 390),
  ('aaaaaaaa-0000-0000-0000-000000000003', auth.uid(), 'devis', '{"nom":"Coiffure Zoé"}', '[{"designation":"Site vitrine","quantite":1,"prix_unitaire":590}]', 590);
do $$ begin
  begin perform emettre_document('aaaaaaaa-0000-0000-0000-000000000001'); raise notice 'ÉCHEC : émission sans identité du vendeur';
  exception when others then raise notice 'OK émission refusée tant que le vendeur n''est pas identifié (SIRET, adresse)'; end;
  begin update documents set numero = 'F-2026-9999' where id = 'aaaaaaaa-0000-0000-0000-000000000001'; raise notice 'ÉCHEC : numéro libre';
  exception when others then raise notice 'OK numéro jamais saisi à la main'; end;
  begin update documents set statut = 'payee' where id = 'aaaaaaaa-0000-0000-0000-000000000001'; raise notice 'ÉCHEC : brouillon marqué payé';
  exception when others then raise notice 'OK un brouillon ne change de statut que par l''émission'; end;
  begin insert into documents (user_id, type, numero, statut) values (auth.uid(), 'facture', 'F-1', 'emise'); raise notice 'ÉCHEC : facture créée déjà émise';
  exception when others then raise notice 'OK impossible de créer une facture déjà numérotée'; end;
end $$;
insert into entreprises (user_id, nom, siret, adresse) values (auth.uid(), 'Yanis Test', '12345678900011', '1 rue Test, 69000 Lyon');
select case when emettre_document('aaaaaaaa-0000-0000-0000-000000000001') ~ '^F-\d{4}-0001$' then 'OK première facture : F-AAAA-0001' else 'ÉCHEC numéro' end;
select case when emettre_document('aaaaaaaa-0000-0000-0000-000000000002') ~ '^F-\d{4}-0002$' then 'OK numérotation continue : F-AAAA-0002' else 'ÉCHEC continuité' end;
select case when emettre_document('aaaaaaaa-0000-0000-0000-000000000003') ~ '^D-\d{4}-0001$' then 'OK série distincte pour les devis' else 'ÉCHEC série devis' end;
select case when emetteur->>'siret' = '12345678900011' and date_emission is not null and statut = 'emise' then 'OK identité du vendeur figée à l''émission' else 'ÉCHEC' end from documents where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update entreprises set nom = 'Autre nom' where user_id = auth.uid();
select case when emetteur->>'nom' = 'Yanis Test' then 'OK changer son identité ne modifie pas les factures passées' else 'ÉCHEC' end from documents where id = 'aaaaaaaa-0000-0000-0000-000000000001';
do $$ begin
  begin update documents set total_ht = 1 where id = 'aaaaaaaa-0000-0000-0000-000000000001'; raise notice 'ÉCHEC : facture émise modifiée';
  exception when others then raise notice 'OK facture émise non modifiable'; end;
  begin delete from documents where id = 'aaaaaaaa-0000-0000-0000-000000000001';
    if exists (select 1 from documents where id = 'aaaaaaaa-0000-0000-0000-000000000001') then raise notice 'OK facture émise non supprimable'; else raise notice 'ÉCHEC : facture supprimée'; end if; end;
end $$;
update documents set statut = 'payee', paye_le = current_date where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update documents set statut = 'accepte' where id = 'aaaaaaaa-0000-0000-0000-000000000003';
select case when (select statut from documents where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'payee' and (select statut from documents where id = 'aaaaaaaa-0000-0000-0000-000000000003') = 'accepte' then 'OK paiement et acceptation enregistrés' else 'ÉCHEC statuts' end;
select case when annuler_facture('aaaaaaaa-0000-0000-0000-000000000002') is not null then 'OK annulation par avoir' else 'ÉCHEC' end;
select case when count(*) = 1 and min(numero) ~ '^A-\d{4}-0001$' then 'OK avoir numéroté A-AAAA-0001' else 'ÉCHEC avoir' end from documents where type = 'avoir';
select case when statut = 'annulee' then 'OK facture annulée conservée' else 'ÉCHEC' end from documents where id = 'aaaaaaaa-0000-0000-0000-000000000002';
insert into progression_cours (user_id, lecon, score) values (auth.uid(), 'demarrer-1', 100);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b5', false);
select case when count(*) = 0 then 'OK W ne voit pas les documents de V' else 'ÉCHEC isolement documents' end from documents;
select case when count(*) = 0 then 'OK W ne voit pas l''identité ni la progression de V' else 'ÉCHEC' end from (select 1 from entreprises union all select 1 from progression_cours) x;
do $$ begin
  begin perform emettre_document('aaaaaaaa-0000-0000-0000-000000000003'); raise notice 'ÉCHEC : W émet le document de V';
  exception when others then raise notice 'OK W ne peut pas émettre les documents de V'; end;
  begin perform annuler_facture('aaaaaaaa-0000-0000-0000-000000000001'); raise notice 'ÉCHEC : W annule la facture de V';
  exception when others then raise notice 'OK W ne peut pas annuler les factures de V'; end;
  begin perform 1 from compteurs_documents; raise notice 'OK compteurs : % ligne visible', (select count(*) from compteurs_documents);
  exception when insufficient_privilege then raise notice 'OK compteurs inaccessibles'; end;
end $$;
reset role;
insert into sites (id, user_id, type, donnees) values ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', 'ia', '{}');
do $$ begin
  begin insert into publications (site_id, user_id, slug, html, mentions) values ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', '-Mauvais_', 'x', '{}'); raise notice 'ÉCHEC : adresse invalide acceptée';
  exception when check_violation then raise notice 'OK adresse de site contrôlée'; end;
end $$;
insert into publications (site_id, user_id, slug, domaine, html, mentions) values ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', 'pizza-bella-lyon', 'pizzabella.fr', '<html></html>', '{}');
select 'OK publication sur pizza-bella-lyon et pizzabella.fr';
