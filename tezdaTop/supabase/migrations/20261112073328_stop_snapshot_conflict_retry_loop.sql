CREATE OR REPLACE FUNCTION public.commit_database_snapshot(expected_version bigint, changes jsonb, deleted jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE current_version bigint; tbl text; item jsonb; cols text; selected_cols text; assignments text; allowed text[]:=ARRAY['organizations','users','memberships','stores','variants','offers','inventory_balances','stock_documents','expenses','reviews','reports','corrections','inquiries','credential_requests','bookmarks','notifications','audit_logs','application_records'];
BEGIN
 SELECT version INTO current_version FROM public.app_persistence_state WHERE id FOR UPDATE;
 IF current_version<>expected_version THEN
  -- Keep the API error code for deployed clients without raising a retryable SQLSTATE.
  RAISE SQLSTATE 'PGRST' USING
    MESSAGE = '{"code":"40001","message":"Concurrent database modification","details":null,"hint":null}',
    DETAIL = '{"status":409,"headers":{}}';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(changes) k WHERE NOT k=ANY(allowed)) OR EXISTS(SELECT 1 FROM jsonb_object_keys(deleted) k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION 'Invalid table'; END IF;
 PERFORM set_config('yaqintop.atomic_commit','on',true);
 FOREACH tbl IN ARRAY ARRAY['application_records','audit_logs','notifications','bookmarks','credential_requests','inquiries','corrections','reports','reviews','expenses','stock_documents','inventory_balances','offers','variants','stores','memberships','users','organizations'] LOOP
   EXECUTE format('DELETE FROM public.%I WHERE id IN (SELECT jsonb_array_elements_text($1))',tbl) USING coalesce(deleted->tbl,'[]'::jsonb);
 END LOOP;
 FOREACH tbl IN ARRAY allowed LOOP
  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(changes->tbl,'[]'::jsonb)) LOOP
   IF EXISTS(SELECT 1 FROM jsonb_object_keys(item) k WHERE NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute a WHERE a.attrelid=to_regclass('public.'||tbl) AND a.attname=k AND a.attnum>0 AND NOT a.attisdropped AND a.attgenerated='')) THEN RAISE EXCEPTION 'Invalid column for %',tbl; END IF;
   SELECT string_agg(format('%I',k),','),string_agg(format('r.%I',k),','),string_agg(format('%I=EXCLUDED.%I',k,k),',') FILTER(WHERE k<>'id') INTO cols,selected_cols,assignments FROM jsonb_object_keys(item) k;
   EXECUTE format('INSERT INTO public.%I(%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) r ON CONFLICT(id) DO UPDATE SET %s',tbl,cols,selected_cols,tbl,assignments) USING item;
  END LOOP;
 END LOOP;
 UPDATE public.app_persistence_state SET version=version+1 WHERE id RETURNING version INTO current_version;
 RETURN current_version;
END $$;
