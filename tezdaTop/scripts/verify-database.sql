-- Exercises production constraints and RPCs without retaining test changes.
BEGIN;
SET LOCAL statement_timeout='30s';
DO $$
DECLARE v bigint; offer_row jsonb; original_price numeric; offer_id text;
BEGIN
  SELECT version INTO v FROM public.app_persistence_state WHERE id;
  SELECT to_jsonb(o),o.price,o.id INTO offer_row,original_price,offer_id FROM public.offers o LIMIT 1;
  IF offer_id IS NULL THEN RAISE EXCEPTION 'No offer available for verification'; END IF;
  v:=public.commit_database_snapshot(v,jsonb_build_object('offers',jsonb_build_array(offer_row||jsonb_build_object('price',(original_price+1)::text))),'{}');
  IF (SELECT price FROM public.offers WHERE id=offer_id)<>original_price+1 THEN RAISE EXCEPTION 'RPC upsert failed'; END IF;
  BEGIN
    PERFORM public.commit_database_snapshot(v-1,'{}','{}');
    RAISE EXCEPTION 'Stale writer was accepted';
  EXCEPTION WHEN SQLSTATE 'PGRST' THEN
    IF (SQLERRM::jsonb)->>'code' IS DISTINCT FROM '40001' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.commit_database_snapshot(v,jsonb_build_object(
      'offers',jsonb_build_array(offer_row||jsonb_build_object('price',(original_price+2)::text)),
      'expenses',jsonb_build_array(jsonb_build_object('id','audit-rollback-only','organization_id',(SELECT id FROM public.organizations LIMIT 1),'category','AUDIT','amount','-1'))),'{}');
    RAISE EXCEPTION 'Invalid expense was accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF (SELECT price FROM public.offers WHERE id=offer_id)<>original_price+1 THEN RAISE EXCEPTION 'Partial write escaped rollback'; END IF;
  IF (SELECT version FROM public.app_persistence_state WHERE id)<>v THEN RAISE EXCEPTION 'Failed transaction changed version'; END IF;
  IF has_table_privilege('authenticated','public.users','UPDATE') THEN RAISE EXCEPTION 'User privilege escalation remains'; END IF;
  IF has_function_privilege('anon','public.commit_database_snapshot(bigint,jsonb,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'RPC is exposed'; END IF;
END $$;
ROLLBACK;
