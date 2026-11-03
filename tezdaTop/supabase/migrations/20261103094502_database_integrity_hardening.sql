BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- Existing application columns are retained. New fields preserve complete domain records.
CREATE TABLE IF NOT EXISTS public.application_records (id text PRIMARY KEY, collection text NOT NULL, record_id text NOT NULL, payload jsonb NOT NULL, UNIQUE(collection,record_id));
ALTER TABLE public.application_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.application_records FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.application_records TO service_role;
CREATE TABLE IF NOT EXISTS public.app_persistence_state (id boolean PRIMARY KEY DEFAULT true CHECK(id), version bigint NOT NULL DEFAULT 0);
INSERT INTO public.app_persistence_state(id) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE public.app_persistence_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_persistence_state FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.app_persistence_state TO service_role;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.inventory_balances ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.stock_documents ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.corrections ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.credential_requests ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS app_data jsonb;
ALTER TABLE public.inventory_balances ADD COLUMN IF NOT EXISTS average_unit_cost numeric(24,6) NOT NULL DEFAULT 0;
ALTER TABLE public.inventory_balances ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 1;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS merchant_reply text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS merchant_replied_at timestamptz;
ALTER TABLE public.credential_requests ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'CUSTOMER';
-- Never combine duplicate inventory quantities: these are replicated snapshots.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.inventory_balances b JOIN public.offers o ON o.store_id=b.store_id AND o.variant_id=b.variant_id WHERE b.quantity IS DISTINCT FROM o.stock_on_hand) THEN RAISE EXCEPTION 'Conflicting inventory snapshots require manual reconciliation'; END IF;
END $$;
DELETE FROM public.inventory_balances b USING public.offers o WHERE b.store_id=o.store_id AND b.variant_id=o.variant_id AND b.id<>o.id;
DELETE FROM public.memberships m USING (SELECT id,row_number() OVER(PARTITION BY user_id,organization_id ORDER BY (status='ACTIVE') DESC,created_at DESC NULLS LAST,id) n FROM public.memberships) d WHERE m.id=d.id AND d.n>1;
ALTER TABLE public.offers ALTER COLUMN price TYPE numeric(24,6) USING price::numeric(24,6);
ALTER TABLE public.offers ALTER COLUMN original_price TYPE numeric(24,6) USING original_price::numeric(24,6);
ALTER TABLE public.offers ALTER COLUMN stock_count TYPE numeric(24,6) USING stock_count::numeric(24,6);
ALTER TABLE public.offers ALTER COLUMN stock_on_hand TYPE numeric(24,6) USING stock_on_hand::numeric(24,6);
ALTER TABLE public.inventory_balances ALTER COLUMN quantity TYPE numeric(24,6) USING quantity::numeric(24,6);
ALTER TABLE public.expenses ALTER COLUMN amount TYPE numeric(24,6) USING amount::numeric(24,6);
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='offers_nonnegative' AND conrelid='public.offers'::regclass) THEN ALTER TABLE public.offers ADD CONSTRAINT offers_nonnegative CHECK(price >= 0 AND price < 'Infinity'::numeric AND stock_on_hand >= 0 AND stock_on_hand < 'Infinity'::numeric AND stock_count >= 0 AND stock_count < 'Infinity'::numeric AND (original_price IS NULL OR original_price >= 0)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='inventory_nonnegative' AND conrelid='public.inventory_balances'::regclass) THEN ALTER TABLE public.inventory_balances ADD CONSTRAINT inventory_nonnegative CHECK(quantity >= 0 AND quantity < 'Infinity'::numeric AND average_unit_cost >= 0 AND average_unit_cost < 'Infinity'::numeric AND version > 0); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='expenses_nonnegative' AND conrelid='public.expenses'::regclass) THEN ALTER TABLE public.expenses ADD CONSTRAINT expenses_nonnegative CHECK(amount >= 0 AND amount < 'Infinity'::numeric); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='reviews_valid_rating' AND conrelid='public.reviews'::regclass) THEN ALTER TABLE public.reviews ADD CONSTRAINT reviews_valid_rating CHECK(rating BETWEEN 1 AND 5); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='stores_valid_location' AND conrelid='public.stores'::regclass) THEN ALTER TABLE public.stores ADD CONSTRAINT stores_valid_location CHECK(latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='users_valid_role' AND conrelid='public.users'::regclass) THEN ALTER TABLE public.users ADD CONSTRAINT users_valid_role CHECK(role IN ('CUSTOMER','OWNER','MANAGER','OPERATOR','MODERATOR','ADMIN','SUPERADMIN','DEALER','DEALER_AGENT')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='users_valid_status' AND conrelid='public.users'::regclass) THEN ALTER TABLE public.users ADD CONSTRAINT users_valid_status CHECK(status IN ('ACTIVE','PENDING','SUSPENDED','DELETED')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='offers_store_variant_unique' AND conrelid='public.offers'::regclass) THEN ALTER TABLE public.offers ADD CONSTRAINT offers_store_variant_unique UNIQUE(store_id,variant_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='inventory_store_variant_unique' AND conrelid='public.inventory_balances'::regclass) THEN ALTER TABLE public.inventory_balances ADD CONSTRAINT inventory_store_variant_unique UNIQUE(store_id,variant_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='inventory_offer_id_fkey' AND conrelid='public.inventory_balances'::regclass) THEN ALTER TABLE public.inventory_balances ADD CONSTRAINT inventory_offer_id_fkey FOREIGN KEY(id) REFERENCES public.offers(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='memberships_user_org_unique' AND conrelid='public.memberships'::regclass) THEN ALTER TABLE public.memberships ADD CONSTRAINT memberships_user_org_unique UNIQUE(user_id,organization_id); END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS users_login_unique ON public.users(lower(btrim(email))) WHERE email IS NOT NULL AND btrim(email)<>'';
CREATE INDEX IF NOT EXISTS offers_variant_idx ON public.offers(variant_id);
CREATE INDEX IF NOT EXISTS stores_org_idx ON public.stores(organization_id);
CREATE INDEX IF NOT EXISTS variants_org_idx ON public.variants(organization_id);
CREATE INDEX IF NOT EXISTS stock_documents_store_date_idx ON public.stock_documents(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS expenses_org_date_idx ON public.expenses(organization_id,date DESC);
CREATE INDEX IF NOT EXISTS reports_target_status_idx ON public.reports(target_id,status);
CREATE INDEX IF NOT EXISTS reviews_store_date_idx ON public.reviews(store_id,created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_date_idx ON public.audit_logs(created_at DESC);
-- Index all FK columns that do not already lead an index.
DO $$ DECLARE r record; BEGIN FOR r IN SELECT DISTINCT c.conrelid::regclass AS tbl,a.attname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1] WHERE c.contype='f' AND c.connamespace='public'::regnamespace AND NOT EXISTS(SELECT 1 FROM pg_index i WHERE i.indrelid=c.conrelid AND i.indkey[0]=a.attnum) LOOP EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s(%I)',replace(r.tbl::text,'.','_')||'_'||r.attname||'_idx',r.tbl,r.attname); END LOOP; END $$;
-- Custom application sessions are managed by the backend, not by Supabase Auth.
REVOKE INSERT,UPDATE,DELETE ON public.organizations FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.users FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.memberships FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.stores FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.variants FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.offers FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.inventory_balances FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.stock_documents FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.expenses FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.reviews FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.reports FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.corrections FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.inquiries FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.credential_requests FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.bookmarks FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.notifications FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.audit_logs FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.application_records FROM anon,authenticated;
REVOKE ALL ON public.users FROM anon,authenticated;
REVOKE ALL ON public.sessions FROM anon,authenticated;
REVOKE ALL ON public.memberships FROM anon,authenticated;
REVOKE ALL ON public.expenses FROM anon,authenticated;
REVOKE ALL ON public.audit_logs FROM anon,authenticated;
REVOKE ALL ON public.credential_requests FROM anon,authenticated;
REVOKE ALL ON public.inventory_balances FROM anon,authenticated;
REVOKE ALL ON public.corrections FROM anon,authenticated;
REVOKE ALL ON public.notifications FROM anon,authenticated;
REVOKE ALL ON public.bookmarks FROM anon,authenticated;
REVOKE ALL ON public.inquiries FROM anon,authenticated;
REVOKE ALL ON public.reports FROM anon,authenticated;
DROP POLICY IF EXISTS users_owner_update ON public.users;
DROP POLICY IF EXISTS stores_public_select ON public.stores;
CREATE POLICY stores_public_select ON public.stores FOR SELECT TO anon,authenticated USING(status='ACTIVE' AND EXISTS(SELECT 1 FROM public.organizations o WHERE o.id=organization_id AND o.status='ACTIVE'));
DROP POLICY IF EXISTS organizations_public_select ON public.organizations;
CREATE POLICY organizations_public_select ON public.organizations FOR SELECT TO anon,authenticated USING(status='ACTIVE');
DROP POLICY IF EXISTS offers_public_select ON public.offers;
CREATE POLICY offers_public_select ON public.offers FOR SELECT TO anon,authenticated USING(is_available AND EXISTS(SELECT 1 FROM public.stores s WHERE s.id=store_id AND s.status='ACTIVE'));
DROP POLICY IF EXISTS variants_public_select ON public.variants;
CREATE POLICY variants_public_select ON public.variants FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.organizations o WHERE o.id=organization_id AND o.status='ACTIVE'));
DROP POLICY IF EXISTS reviews_public_select ON public.reviews;
CREATE POLICY reviews_public_select ON public.reviews FOR SELECT TO anon,authenticated USING(status='PUBLISHED' AND EXISTS(SELECT 1 FROM public.stores s WHERE s.id=store_id AND s.status='ACTIVE'));
-- Atomic, consistent reads do not have PostgREST's per-table pagination ceiling.
CREATE OR REPLACE FUNCTION public.read_database_snapshot() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('version',(SELECT version FROM public.app_persistence_state WHERE id),'tables',jsonb_build_object(
 'organizations',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.organizations r),
 'users',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.users r),
 'memberships',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.memberships r),
 'stores',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.stores r),
 'variants',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.variants r),
 'offers',(SELECT coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('price',r.price::text,'original_price',r.original_price::text,'stock_on_hand',r.stock_on_hand::text,'stock_count',r.stock_count::text)),'[]'::jsonb) FROM public.offers r),
 'inventory_balances',(SELECT coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('quantity',r.quantity::text,'average_unit_cost',r.average_unit_cost::text)),'[]'::jsonb) FROM public.inventory_balances r),
 'stock_documents',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.stock_documents r),
 'expenses',(SELECT coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('amount',r.amount::text)),'[]'::jsonb) FROM public.expenses r),
 'reviews',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.reviews r),
 'reports',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.reports r),
 'corrections',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.corrections r),
 'inquiries',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.inquiries r),
 'credential_requests',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.credential_requests r),
 'bookmarks',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.bookmarks r),
 'notifications',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.notifications r),
 'audit_logs',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.audit_logs r),
 'application_records',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) FROM public.application_records r)
 ));
$$;
REVOKE ALL ON FUNCTION public.read_database_snapshot() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_database_snapshot() TO service_role;
CREATE OR REPLACE FUNCTION public.commit_database_snapshot(expected_version bigint, changes jsonb, deleted jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE current_version bigint; tbl text; item jsonb; cols text; selected_cols text; assignments text; allowed text[]:=ARRAY['organizations','users','memberships','stores','variants','offers','inventory_balances','stock_documents','expenses','reviews','reports','corrections','inquiries','credential_requests','bookmarks','notifications','audit_logs','application_records'];
BEGIN
 SELECT version INTO current_version FROM public.app_persistence_state WHERE id FOR UPDATE;
 IF current_version<>expected_version THEN RAISE EXCEPTION 'Concurrent database modification' USING ERRCODE='40001'; END IF;
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
REVOKE ALL ON FUNCTION public.commit_database_snapshot(bigint,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_database_snapshot(bigint,jsonb,jsonb) TO service_role;
-- Legacy writers and administrative edits also invalidate stale snapshots.
CREATE OR REPLACE FUNCTION public.bump_persistence_version() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN IF current_setting('yaqintop.atomic_commit',true) IS DISTINCT FROM 'on' THEN UPDATE public.app_persistence_state SET version=version+1 WHERE id; END IF; RETURN NULL; END $$;
REVOKE ALL ON FUNCTION public.bump_persistence_version() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bump_persistence_version() TO service_role;
DROP TRIGGER IF EXISTS persistence_version_changed ON public.organizations; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.organizations FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.users; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.memberships; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.memberships FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.stores; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.stores FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.variants; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.variants FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.offers; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.offers FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.inventory_balances; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.inventory_balances FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.stock_documents; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.stock_documents FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.expenses; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.reviews; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.reports; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.reports FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.corrections; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.corrections FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.inquiries; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.inquiries FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.credential_requests; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.credential_requests FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.bookmarks; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.bookmarks FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.notifications; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.notifications FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.audit_logs; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.audit_logs FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
DROP TRIGGER IF EXISTS persistence_version_changed ON public.application_records; CREATE TRIGGER persistence_version_changed AFTER INSERT OR UPDATE OR DELETE ON public.application_records FOR EACH STATEMENT EXECUTE FUNCTION public.bump_persistence_version();
CREATE TABLE IF NOT EXISTS public.retired_demo_records(table_name text NOT NULL,record_id text NOT NULL,retired_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(table_name,record_id));
ALTER TABLE public.retired_demo_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.retired_demo_records FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.retired_demo_records TO service_role;
CREATE OR REPLACE FUNCTION public.protect_retired_demo_records() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.retired_demo_records WHERE table_name=TG_TABLE_NAME AND record_id=NEW.id) THEN
  IF current_setting('yaqintop.atomic_commit',true)='on' THEN RAISE EXCEPTION 'Retired demo record cannot be recreated'; END IF;
  RETURN NULL;
 END IF;
 IF TG_TABLE_NAME='users' AND TG_OP='UPDATE' AND current_setting('yaqintop.atomic_commit',true) IS DISTINCT FROM 'on' THEN
  IF OLD.password_hash LIKE 'scrypt:%' AND coalesce(NEW.password_hash,'') NOT LIKE 'scrypt:%' THEN NEW.password_hash:=OLD.password_hash; END IF;
  IF (OLD.app_data->>'credentialsProtected')::boolean IS TRUE THEN NEW.email:=OLD.email; NEW.password_hash:=OLD.password_hash; NEW.app_data:=OLD.app_data; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_retired_demo_records() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.protect_retired_demo_records() TO service_role;
DROP TRIGGER IF EXISTS protect_retired_demo ON public.organizations; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.users; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.memberships; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.stores; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.variants; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.variants FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.offers; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.inventory_balances; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.inventory_balances FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.stock_documents; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.stock_documents FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.expenses; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.reviews; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.reports; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.corrections; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.corrections FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.inquiries; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.credential_requests; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.credential_requests FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.bookmarks; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.notifications; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
DROP TRIGGER IF EXISTS protect_retired_demo ON public.audit_logs; CREATE TRIGGER protect_retired_demo BEFORE INSERT OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.protect_retired_demo_records();
NOTIFY pgrst,'reload schema';
DO $$ BEGIN
 IF (SELECT count(*) FROM public.inventory_balances)<>(SELECT count(*) FROM public.offers) THEN RAISE EXCEPTION 'Inventory reconciliation failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.memberships GROUP BY user_id,organization_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Membership reconciliation failed'; END IF;
END $$;
COMMIT;
