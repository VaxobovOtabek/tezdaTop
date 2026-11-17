-- Preserve the RPC response shape while avoiding JSONB aggregation and rewrites for every offer.
BEGIN;
SET LOCAL lock_timeout = '3s';
DROP FUNCTION public.read_database_snapshot();
CREATE OR REPLACE FUNCTION public.read_database_snapshot()
 RETURNS json
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 SELECT json_build_object('version',(SELECT version FROM public.app_persistence_state WHERE id),'tables',json_build_object(
 'organizations',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.organizations r),
 'users',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.users r),
 'memberships',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.memberships r),
 'stores',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.stores r),
 'variants',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.variants r),
 'offers',(SELECT coalesce(json_agg(r),'[]'::json) FROM (SELECT id, store_id, variant_id, price::text, original_price::text, in_stock, stock_count::text, is_available, updated_at, currency, stock_on_hand::text, stock_verified_at, app_data FROM public.offers) r),
 'inventory_balances',(SELECT coalesce(json_agg(to_jsonb(r)||jsonb_build_object('quantity',r.quantity::text,'average_unit_cost',r.average_unit_cost::text)),'[]'::json) FROM public.inventory_balances r),
 'stock_documents',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.stock_documents r),
 'expenses',(SELECT coalesce(json_agg(to_jsonb(r)||jsonb_build_object('amount',r.amount::text)),'[]'::json) FROM public.expenses r),
 'reviews',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.reviews r),
 'reports',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.reports r),
 'corrections',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.corrections r),
 'inquiries',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.inquiries r),
 'credential_requests',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.credential_requests r),
 'bookmarks',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.bookmarks r),
 'notifications',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.notifications r),
 'audit_logs',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.audit_logs r),
 'application_records',(SELECT coalesce(json_agg(r),'[]'::json) FROM public.application_records r)
 ));
$function$;
REVOKE ALL ON FUNCTION public.read_database_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_database_snapshot() TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
