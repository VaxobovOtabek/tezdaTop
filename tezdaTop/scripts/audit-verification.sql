SELECT jsonb_build_object(
  'users',(SELECT count(*) FROM public.users),
  'organizations',(SELECT count(*) FROM public.organizations),
  'stores',(SELECT count(*) FROM public.stores),
  'offers',(SELECT count(*) FROM public.offers),
  'balances',(SELECT count(*) FROM public.inventory_balances),
  'duplicate_balances',(SELECT count(*) FROM(SELECT store_id,variant_id FROM public.inventory_balances GROUP BY 1,2 HAVING count(*)>1)t),
  'duplicate_memberships',(SELECT count(*) FROM(SELECT user_id,organization_id FROM public.memberships GROUP BY 1,2 HAVING count(*)>1)t),
  'unhashed_passwords',(SELECT count(*) FROM public.users WHERE password_hash IS NULL OR password_hash NOT LIKE 'scrypt:%'),
  'active_administrator',(SELECT count(*) FROM public.users WHERE role='SUPERADMIN' AND status='ACTIVE'),
  'retired_demo_rows',(SELECT count(*) FROM public.retired_demo_records),
  'check_constraints',(SELECT count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace AND contype='c'),
  'indexes',(SELECT count(*) FROM pg_indexes WHERE schemaname='public'),
  'user_self_role_update',has_column_privilege('authenticated','public.users','role','UPDATE'),
  'snapshot_rpc_public',has_function_privilege('anon','public.read_database_snapshot()','EXECUTE'),
  'commit_rpc_public',has_function_privilege('anon','public.commit_database_snapshot(bigint,jsonb,jsonb)','EXECUTE')
) AS audit;
