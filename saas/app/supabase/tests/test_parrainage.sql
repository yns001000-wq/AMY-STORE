-- Parrainage : enregistrement à l'inscription, refus de l'auto-parrainage, RLS, récompense unique, limite de 12 par an, Pro offert cumulable.
\set ON_ERROR_STOP on
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000b001', 'Lea.Martin@gmail.com', null);
insert into public.codes_parrainage (user_id, code) values ('00000000-0000-0000-0000-00000000b001', 'LEA-4827');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000b002', 'tom@ex.fr', '{"parrain":"lea-4827"}'),                -- filleul valable (code en minuscules)
  ('00000000-0000-0000-0000-00000000b003', 'leamartin+2@googlemail.com', '{"parrain":"LEA-4827"}'), -- même e-mail que la marraine
  ('00000000-0000-0000-0000-00000000b004', 'zoe@ex.fr', '{"parrain":"INCONNU-2222"}'),               -- code inconnu
  ('00000000-0000-0000-0000-00000000b005', 'max@ex.fr', '{"parrain":"x'' or 1=1 --"}');              -- code farfelu
do $$ declare p record; n int; begin
  select * into p from public.profils where id = '00000000-0000-0000-0000-00000000b002';
  assert p.parrain_id = '00000000-0000-0000-0000-00000000b001', 'parrain enregistré';
  select count(*) into n from public.parrainages where filleul_id = '00000000-0000-0000-0000-00000000b002' and statut = 'inscrit';
  assert n = 1, 'parrainage créé';
  raise notice 'OK 1 : parrain enregistré à l''inscription';
  select * into p from public.profils where id = '00000000-0000-0000-0000-00000000b003';
  assert p.parrain_id is null and p.id is not null, 'même e-mail refusé, inscription faite';
  raise notice 'OK 2 : auto-parrainage par le même e-mail (Gmail, +étiquette) refusé, inscription faite';
  select count(*) into n from public.profils where id in ('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000b005') and parrain_id is null;
  assert n = 2, 'codes invalides ignorés';
  raise notice 'OK 3 : code inconnu ou farfelu ignoré, inscription faite';
end $$;

-- RLS : la marraine voit son parrainage ; le filleul et un tiers ne voient rien ; personne ne peut écrire.
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000b001';
do $$ declare n int; begin
  select count(*) into n from public.parrainages; assert n = 1, 'marraine : 1 parrainage visible';
  select count(*) into n from public.codes_parrainage; assert n = 1, 'son code visible';
  raise notice 'OK 4 : la marraine voit ses données';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000b002';
do $$ declare n int; begin
  select count(*) into n from public.parrainages; assert n = 0, 'filleul : rien';
  select count(*) into n from public.codes_parrainage; assert n = 0, 'code d''autrui invisible';
  begin update public.profils set parrain_id = null where id = auth.uid(); assert false, 'parrain modifiable';
  exception when insufficient_privilege then null; end;
  begin insert into public.recompenses_parrainage (parrainage_id, parrain_id, type, annee, statut) select id, parrain_id, 'credit', 2026, 'credite' from public.parrainages; assert false, 'récompense insérable';
  exception when insufficient_privilege then null; end;
  begin update public.parrainages set statut = 'valide'; assert false, 'statut modifiable';
  exception when insufficient_privilege then null; end;
  begin perform public.recompenser_parrainage(gen_random_uuid(), true); assert false, 'fonction de récompense appelable';
  exception when insufficient_privilege then null; end;
  raise notice 'OK 5 : un utilisateur ne voit que ses données et ne peut rien écrire (parrain figé)';
end $$;
reset role;

-- Récompense : refusée avant paiement, unique (webhook rejoué), Pro offert cumulable, limite de 12 par an.
do $$ declare pid uuid; r record; f record; j1 timestamptz; begin
  select id into pid from public.parrainages where filleul_id = '00000000-0000-0000-0000-00000000b002';
  begin perform public.recompenser_parrainage(pid, false); assert false, 'récompense avant paiement';
  exception when raise_exception then null; end;
  raise notice 'OK 6 : pas de récompense tant que le filleul n''a pas payé';
  update public.parrainages set statut = 'paye' where id = pid;
  select * into r from public.recompenser_parrainage(pid, false);
  assert r.type = 'pro_offert' and not r.deja, 'marraine en Gratuit : Pro offert';
  select pro_offert_jusqu into j1 from public.profils where id = '00000000-0000-0000-0000-00000000b001';
  assert j1 between now() + interval '29 days' and now() + interval '31 days', '30 jours';
  select * into r from public.recompenser_parrainage(pid, false);
  assert r.deja, 'rejoué : déjà fait';
  select pro_offert_jusqu into f from public.profils where id = '00000000-0000-0000-0000-00000000b001';
  assert f.pro_offert_jusqu = j1, 'pas de double récompense';
  assert (select count(*) from public.recompenses_parrainage where parrainage_id = pid) = 1, 'une seule ligne';
  assert (select statut from public.parrainages where id = pid) = 'valide', 'validé';
  raise notice 'OK 7 : marraine en Gratuit → 30 jours de Pro ; un appel rejoué ne récompense pas deux fois';
end $$;

do $$ declare i int; u uuid; pid uuid; r record; begin
  for i in 1..12 loop
    u := gen_random_uuid();
    insert into auth.users (id, email, raw_user_meta_data) values (u, 'f' || i || '@ex.fr', '{"parrain":"LEA-4827"}');
    select id into pid from public.parrainages where filleul_id = u;
    update public.parrainages set statut = 'paye' where id = pid;
    select * into r from public.recompenser_parrainage(pid, true);
    if i <= 11 then assert r.type = 'credit' and r.statut = 'a_crediter', 'crédit ' || i;
    else assert r.type = 'hors_limite' and r.statut = 'sans_objet', '13e : hors limite'; end if;
  end loop;
  assert (select pro_offert_jusqu from public.profils where id = '00000000-0000-0000-0000-00000000b001') < now() + interval '31 days', 'pas de Pro en plus';
  raise notice 'OK 8 : 12 récompenses par an (1 Pro offert + 11 crédits), la 13e est comptée sans récompense';
end $$;

do $$ begin
  assert public.normaliser_email('Lea.Martin+pub@GMAIL.com') = 'leamartin@gmail.com';
  assert public.normaliser_email('lea.martin@orange.fr') = 'lea.martin@orange.fr';
  raise notice 'OK 9 : e-mails normalisés comme dans lib/parrainage.ts';
end $$;
