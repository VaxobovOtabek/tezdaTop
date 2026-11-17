BEGIN;
SET LOCAL lock_timeout='5s';
CREATE UNIQUE INDEX IF NOT EXISTS users_one_active_superadmin ON public.users(role) WHERE role='SUPERADMIN' AND status='ACTIVE';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='users_password_is_scrypt') THEN ALTER TABLE public.users ADD CONSTRAINT users_password_is_scrypt CHECK(password_hash IS NOT NULL AND password_hash LIKE 'scrypt:%'); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='stores_org_pair_unique') THEN ALTER TABLE public.stores ADD CONSTRAINT stores_org_pair_unique UNIQUE(id,organization_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='stock_document_tenant_fkey') THEN ALTER TABLE public.stock_documents ADD CONSTRAINT stock_document_tenant_fkey FOREIGN KEY(store_id,organization_id) REFERENCES public.stores(id,organization_id) ON DELETE CASCADE; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='expense_tenant_fkey') THEN ALTER TABLE public.expenses ADD CONSTRAINT expense_tenant_fkey FOREIGN KEY(store_id,organization_id) REFERENCES public.stores(id,organization_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='offers_identity_unique') THEN ALTER TABLE public.offers ADD CONSTRAINT offers_identity_unique UNIQUE(id,store_id,variant_id); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='inventory_offer_identity_fkey') THEN ALTER TABLE public.inventory_balances ADD CONSTRAINT inventory_offer_identity_fkey FOREIGN KEY(id,store_id,variant_id) REFERENCES public.offers(id,store_id,variant_id) ON DELETE CASCADE; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.preserve_last_administrator() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF OLD.role='SUPERADMIN' AND OLD.status='ACTIVE' AND (TG_OP='DELETE' OR NEW.role<>'SUPERADMIN' OR NEW.status<>'ACTIVE') AND NOT EXISTS(SELECT 1 FROM public.users WHERE id<>OLD.id AND role='SUPERADMIN' AND status='ACTIVE') THEN RAISE EXCEPTION 'The last active administrator must be preserved' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.preserve_last_administrator() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.preserve_last_administrator() TO service_role;
DROP TRIGGER IF EXISTS preserve_last_administrator ON public.users;
CREATE TRIGGER preserve_last_administrator BEFORE UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.preserve_last_administrator();
NOTIFY pgrst,'reload schema';
COMMIT;
