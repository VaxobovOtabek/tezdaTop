import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Decimal from 'decimal.js';
import type { InMemoryDatabase } from './in-memory-db.js';
import { SEED_IDS } from './seed.js';
import { serviceCompletionFromDocument } from '../services/service-business.service.js';
import type { User } from '@yaqintop/contracts';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yvxjqimfxlfifhomduox.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2eGpxaW1meGxmaWZob21kdW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjQyOTAsImV4cCI6MjEwNjg0MDI5MH0.5IwdUmzpuvXvIuX6kENo4oNBWeMhrsAa5NNUIAzKRk4';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('[Supabase] Client successfully initialized for:', supabaseUrl);
  } catch (err) {
    console.error('[Supabase] Failed to initialize Supabase client:', err);
  }
}

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

export async function insertRegisteredCustomer(user: User & { passwordHash: string }): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('users').insert({
    id: user.id, email: user.email, full_name: user.fullName, phone: user.phone,
    role: 'CUSTOMER', status: 'ACTIVE', password_hash: user.passwordHash,
    created_at: user.createdAt, updated_at: user.updatedAt
  });
  if (error) throw error;
}

/**
 * Push all in-memory database records to Supabase in structured batches
 */
export async function syncAllToSupabase(db: InMemoryDatabase): Promise<boolean> {
  if (!supabase) {
    console.warn('[Supabase Sync] Supabase client is not configured.');
    return false;
  }

  try {
    console.log('[Supabase Sync] Starting full push to Supabase...');

    // 1. Organizations
    if (db.organizations.size > 0) {
      const orgRows = Array.from(db.organizations.values()).map(o => ({
        id: o.id,
        name: o.name,
        legal_name: o.name,
        inn: o.inn || null,
        type: o.type || 'RETAIL',
        status: o.status || 'ACTIVE',
        region: o.region || null,
        city: o.city || null,
        district: o.district || null,
        created_at: o.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('organizations').upsert(orgRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing organizations:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${orgRows.length} organizations`);
    }

    // 2. Users
    if (db.users.size > 0) {
      const userRows = Array.from(db.users.values()).map(u => ({
        id: u.id,
        phone: u.phone || '+998900000000',
        email: u.email || null,
        full_name: u.fullName || 'Foydalanuvchi',
        role: u.role || 'CUSTOMER',
        status: u.status || 'ACTIVE',
        password_hash: (u as any).passwordHash || null,
        created_at: u.createdAt || new Date().toISOString(),
        updated_at: u.updatedAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('users').upsert(userRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing users:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${userRows.length} users`);
    }

    // 3. Memberships
    if (db.memberships.size > 0) {
      const memberRows = Array.from(db.memberships.values()).map(m => ({
        id: m.id,
        user_id: m.userId,
        organization_id: m.organizationId,
        role: m.role,
        status: m.status || 'ACTIVE'
      }));
      const { error } = await supabase.from('memberships').upsert(memberRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing memberships:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${memberRows.length} memberships`);
    }

    // 4. Stores
    if (db.stores.size > 0) {
      const storeRows = Array.from(db.stores.values()).map(s => {
        const lat = (s.location as any)?.lat ?? (s.location as any)?.latitude ?? 41.311081;
        const lng = (s.location as any)?.lng ?? (s.location as any)?.longitude ?? 69.240562;
        const score = typeof s.rating === 'number' ? s.rating : ((s.rating as any)?.score ?? 5.0);
        const count = s.reviewCount ?? ((s.rating as any)?.count ?? 0);

        return {
          id: s.id,
          organization_id: s.organizationId || SEED_IDS.navbahorOrgId,
          name: s.name,
          address: s.address,
          latitude: Number(lat),
          longitude: Number(lng),
          phone: s.phone || null,
          telegram: (s as any).telegram || null,
          working_hours: (s as any).hours || (s as any).workingHours || null,
          photos: (s as any).photos || ((s as any).photoUrl ? [(s as any).photoUrl] : []),
          is_active: s.status === 'ACTIVE',
          status: s.status || 'ACTIVE',
          region: s.region || null,
          district: s.district || null,
          rating: Number(score),
          review_count: Number(count),
          created_at: s.createdAt || new Date().toISOString(),
          updated_at: s.updatedAt || new Date().toISOString()
        };
      });
      const { error } = await supabase.from('stores').upsert(storeRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing stores:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${storeRows.length} stores`);
    }

    // 5. Variants
    if (db.variants.size > 0) {
      const defaultOrgId = db.organizations.keys().next().value || SEED_IDS.navbahorOrgId;
      const variantRows = Array.from(db.variants.values()).map(v => ({
        id: v.id,
        organization_id: (v as any).organizationId || defaultOrgId,
        name: (v as any).name || (v as any).title || 'Mahsulot',
        barcode: v.barcode || null,
        sku: v.sku || null,
        category: v.category || 'Boshqa',
        unit: (v as any).packUnit || (v as any).unit || 'dona',
        image_url: (v as any).imageUrl || null,
        description: (v as any).description || null,
        attributes: { brand: (v as any).brand, packSize: (v as any).packSize, aliases: (v as any).aliases, kind: v.kind, durationMinutes: v.durationMinutes },
        created_at: (v as any).createdAt || new Date().toISOString(),
        updated_at: (v as any).updatedAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('variants').upsert(variantRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing variants:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${variantRows.length} variants`);
    }

    // 6. Offers
    if (db.offers.size > 0) {
      const offerRows = Array.from(db.offers.values()).map(o => ({
        id: o.id,
        store_id: o.storeId,
        variant_id: o.variantId,
        price: Number(o.price) || 0,
        original_price: (o as any).originalPrice ? Number((o as any).originalPrice) : null,
        currency: (o as any).currency || 'UZS',
        in_stock: (o.stockOnHand || 0) > 0,
        stock_count: Number(o.stockOnHand) || 0,
        stock_on_hand: Number(o.stockOnHand) || 0,
        stock_verified_at: o.stockVerifiedAt || null,
        is_available: (o as any).isAvailable !== false && (o.status as any) !== 'SUSPENDED' && (o.status as any) !== 'INACTIVE',
        updated_at: (o as any).priceUpdatedAt || (o as any).updatedAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('offers').upsert(offerRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing offers:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${offerRows.length} offers`);
    }

    // 7. Inventory Balances
    if (db.balances.size > 0) {
      const balRows = Array.from(db.balances.values()).map(b => {
        const off = db.offers.get(b.offerId);
        return {
          id: b.offerId,
          store_id: off?.storeId || SEED_IDS.navbahorStoreId,
          variant_id: off?.variantId || SEED_IDS.snickers50gVariantId,
          quantity: Number(b.onHand) || 0,
          updated_at: b.lastVerifiedAt ? new Date(b.lastVerifiedAt).toISOString() : new Date().toISOString()
        };
      });
      const { error } = await supabase.from('inventory_balances').upsert(balRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing inventory_balances:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${balRows.length} inventory balances`);
    }

    // 8. Stock Documents
    if (db.stockDocuments.size > 0) {
      const defaultOrgId = db.organizations.keys().next().value || SEED_IDS.navbahorOrgId;
      const docRows = Array.from(db.stockDocuments.values()).map(d => ({
        id: d.id,
        organization_id: (d as any).organizationId || defaultOrgId,
        store_id: d.storeId,
        type: (d as any).docType || (d as any).type || 'SALE',
        document_number: (d as any).docNumber || (d as any).documentNumber || `DOC-${d.id.slice(0, 6)}`,
        lines: d.lines || [],
        note: (d as any).notes || (d as any).note || null,
        created_by: (d as any).createdBy || null,
        created_at: (d as any).createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('stock_documents').upsert(docRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing stock_documents:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${docRows.length} stock documents`);
    }

    // 9. Expenses
    if (db.expenses.size > 0) {
      const expRows = Array.from(db.expenses.values()).map(e => ({
        id: e.id,
        organization_id: e.organizationId,
        store_id: e.storeId || null,
        amount: Number(e.amount) || 0,
        category: e.category,
        note: (e as any).description || (e as any).note || null,
        date: e.date ? e.date.split('T')[0] : new Date().toISOString().split('T')[0],
        created_at: e.createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('expenses').upsert(expRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing expenses:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${expRows.length} expenses`);
    }

    // 10. Reviews
    if (db.reviews.size > 0) {
      const reviewRows = Array.from(db.reviews.values()).map(r => ({
        id: r.id,
        store_id: r.storeId,
        user_id: (r as any).userId || (r as any).reviewerUserId || null,
        user_name: (r as any).userName || (r as any).reviewerName || 'Foydalanuvchi',
        rating: r.rating || 5,
        comment: r.comment || null,
        created_at: (r as any).createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('reviews').upsert(reviewRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing reviews:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${reviewRows.length} reviews`);
    }

    // 11. Reports
    if (db.reports.size > 0) {
      const repRows = Array.from(db.reports.values()).map(r => ({
        id: r.id,
        target_id: (r as any).targetId || (r as any).storeId || 'target',
        target_type: (r as any).targetType || 'STORE',
        user_id: (r as any).userId || (r as any).reporterUserId || null,
        reason: r.reason || 'GENERAL',
        details: r.details || null,
        status: r.status || 'PENDING',
        created_at: (r as any).createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('reports').upsert(repRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing reports:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${repRows.length} reports`);
    }

    // 12. Corrections
    if (db.corrections.size > 0) {
      const corrRows = Array.from(db.corrections.values()).map(c => ({
        id: c.id,
        target_id: (c as any).targetId || (c as any).storeId || 'store',
        target_type: (c as any).targetType || 'STORE',
        user_id: (c as any).userId || null,
        proposed_data: (c as any).proposedData || { affectedFields: (c as any).affectedFields, message: (c as any).message },
        status: c.status || 'PENDING',
        created_at: (c as any).createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('corrections').upsert(corrRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing corrections:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${corrRows.length} corrections`);
    }

    // 13. Inquiries
    if (db.inquiries.size > 0) {
      const inqRows = Array.from(db.inquiries.values()).map(i => ({
        id: i.id,
        name: (i as any).name || (i as any).storeName || (i as any).organizationName || 'Tashkilot',
        phone: (i as any).phone || '+998900000000',
        message: (i as any).message || (i as any).subject || 'Murojaat',
        status: i.status || 'NEW',
        created_at: (i as any).createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('inquiries').upsert(inqRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing inquiries:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${inqRows.length} inquiries`);
    }

    // 14. Credential Requests
    if (db.credentialRequests.size > 0) {
      const credRows = Array.from(db.credentialRequests.values()).map(c => ({
        id: c.id,
        organization_id: (c as any).organizationId || SEED_IDS.navbahorOrgId,
        user_id: c.userId,
        reason: (c as any).reason || (c as any).type || 'CREDENTIAL_CHANGE',
        status: c.status || 'PENDING',
        created_at: (c as any).createdAt || new Date().toISOString()
      }));
      const { error } = await supabase.from('credential_requests').upsert(credRows, { onConflict: 'id' });
      if (error) console.error('[Supabase Sync] Error syncing credential_requests:', error.message);
      else console.log(`[Supabase Sync] ✅ Synced ${credRows.length} credential requests`);
    }

    console.log('[Supabase Sync] Full database sync to Supabase completed successfully!');
    return true;
  } catch (err) {
    console.error('[Supabase Sync] Unexpected error during sync to Supabase:', err);
    return false;
  }
}

/**
 * Pull all data from Supabase Cloud and hydrate in-memory DB
 */
export async function syncAllFromSupabase(db: InMemoryDatabase): Promise<boolean> {
  if (!supabase) return false;

  try {
    console.log('[Supabase Sync] Pulling tables from Supabase Cloud...');

    // 1. Organizations
    const { data: orgs, error: orgErr } = await supabase.from('organizations').select('*');
    if (!orgErr && orgs && orgs.length > 0) {
      for (const o of orgs) {
        db.organizations.set(o.id, {
          id: o.id,
          name: o.name,
          inn: o.inn || o.tin || undefined,
          type: o.type || 'RETAIL',
          status: o.status || 'ACTIVE',
          region: o.region || undefined,
          city: o.city || undefined,
          district: o.district || undefined,
          createdAt: o.created_at
        });
      }
    }

    // 2. Users
    const { data: users, error: userErr } = await supabase.from('users').select('*');
    if (!userErr && users && users.length > 0) {
      for (const u of users) {
        db.users.set(u.id, {
          id: u.id,
          phone: u.phone,
          email: u.email || `${u.phone.replace(/[^0-9]/g, '')}@yaqintop.uz`,
          fullName: u.full_name,
          role: u.role as any,
          status: u.status || 'ACTIVE',
          passwordHash: u.password_hash || 'DemoPass123!',
          createdAt: u.created_at,
          updatedAt: u.updated_at
        });
      }
    }

    // 3. Stores
    const { data: stores, error: storeErr } = await supabase.from('stores').select('*');
    if (!storeErr && stores && stores.length > 0) {
      for (const s of stores) {
        db.stores.set(s.id, {
          id: s.id,
          organizationId: s.organization_id,
          type: db.organizations.get(s.organization_id)?.type || 'RETAIL',
          name: s.name,
          address: s.address,
          location: {
            lat: s.latitude,
            lng: s.longitude
          },
          phone: s.phone || undefined,
          telegram: s.telegram || undefined,
          hours: s.working_hours || {
            open: '08:00',
            close: '22:00',
            is24Hours: false,
            days: [1, 2, 3, 4, 5, 6, 7]
          },
          photos: s.photos || [],
          status: s.status || (s.is_active ? 'ACTIVE' : 'SUSPENDED'),
          rating: s.rating || 5.0,
          reviewCount: s.review_count || 0,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        } as any);
      }
    }

    // 4. Variants
    const { data: variants, error: varErr } = await supabase.from('variants').select('*');
    if (!varErr && variants && variants.length > 0) {
      for (const v of variants) {
        db.variants.set(v.id, {
          id: v.id,
          organizationId: v.organization_id,
          title: v.name,
          name: v.name,
          barcode: v.barcode || undefined,
          sku: v.sku || undefined,
          category: v.category || 'Boshqa',
          packUnit: v.unit || 'dona',
          unit: v.unit || 'dona',
          imageUrl: v.image_url || undefined,
          description: v.description || undefined,
          brand: (v.attributes as any)?.brand || '',
          packSize: (v.attributes as any)?.packSize || '1 dona',
          aliases: (v.attributes as any)?.aliases || [],
          kind: (v.attributes as any)?.kind,
          durationMinutes: (v.attributes as any)?.durationMinutes,
          createdAt: v.created_at,
          updatedAt: v.updated_at
        } as any);
      }
    }

    // 5. Offers
    const { data: offers, error: offErr } = await supabase.from('offers').select('*');
    if (!offErr && offers && offers.length > 0) {
      for (const o of offers) {
        const stockOnHand = o.stock_on_hand ?? o.stock_count ?? (o.in_stock ? 10 : 0);
        const variant = db.variants.get(o.variant_id);
        db.offers.set(o.id, {
          id: o.id,
          storeId: o.store_id,
          variantId: o.variant_id,
          variant: variant as any,
          price: String(o.price),
          originalPrice: o.original_price ? String(o.original_price) : undefined,
          currency: o.currency || 'UZS',
          stockOnHand: Number(stockOnHand),
          stockVerifiedAt: o.stock_verified_at || o.updated_at || new Date().toISOString(),
          freshness: db.computeFreshness(o.stock_verified_at || o.updated_at),
          status: o.is_available ? 'ACTIVE' : 'INACTIVE',
          version: 1
        } as any);
      }
    }

    // Restore service billing records without applying any inventory movements.
    const { data: serviceDocuments, error: serviceDocumentError } = await supabase.from('stock_documents').select('*').like('document_number', 'SRV-%');
    if (!serviceDocumentError && serviceDocuments) {
      for (const row of serviceDocuments) {
        const document = {
          id: row.id, organizationId: row.organization_id, storeId: row.store_id,
          docType: 'SALE' as const, status: 'POSTED' as const, documentNumber: row.document_number,
          date: row.created_at, createdAt: row.created_at, createdBy: row.created_by,
          notes: row.note, lines: row.lines || [], totalAmount: '0', paymentMethod: 'CASH' as const
        };
        const completion = serviceCompletionFromDocument(document);
        if (completion) db.stockDocuments.set(document.id, { ...document, totalAmount: completion.totalAmount, paymentMethod: completion.paymentMethod, supplierOrCustomer: completion.customerName });
      }
    }
    console.log(`[Supabase Sync] Successfully loaded: ${db.organizations.size} orgs, ${db.users.size} users, ${db.stores.size} stores, ${db.variants.size} variants, ${db.offers.size} offers.`);
    return true;
  } catch (err) {
    console.error('[Supabase Sync] Failed to pull data from Supabase Cloud:', err);
    return false;
  }
}
