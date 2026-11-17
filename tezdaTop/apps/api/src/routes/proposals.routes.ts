import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db } from '../db/in-memory-db.js';
import { Offer } from '@yaqintop/contracts';
import { getCurrentUser } from '../middleware/auth.middleware.js';
import { findStoreByParam } from './stores.routes.js';
import {
  persistItemProposalToSupabase,
  persistPhotoProposalToSupabase,
  syncAllToSupabase,
  isSupabaseConfigured,
  supabase
} from '../db/supabase.js';

export const proposalsRouter = Router();

// Helper to check if user can manage a store (Admin, Moderator, or Store Owner)
function canUserManageStoreProposals(user: any, storeId: string): boolean {
  if (!user) return false;
  if (['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) return true;
  const store = db.stores.get(storeId);
  if (!store) return false;
  if ((store as any).ownerId === user.id) return true;
  const isMember = Array.from(db.memberships.values()).some(
    (m) => m.userId === user.id && m.organizationId === store.organizationId && m.status === 'ACTIVE'
  );
  return isMember;
}

// 1. Foydalanuvchi do'konga tovar yoki xizmat taklif qilishi
proposalsRouter.post('/api/v1/stores/:storeId/proposals', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tovar yoki xizmat taklif qilish uchun iltimos, tizimga kiring' });
    return;
  }

  const { storeId } = req.params;
  const store = findStoreByParam(storeId) || db.stores.get(storeId);
  if (!store || store.status !== 'ACTIVE') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const {
    title,
    type = 'PRODUCT',
    category = 'Boshqa',
    price = 0,
    stockOnHand = 1,
    packUnit = 'dona',
    barcode,
    description,
    photoUrl
  } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    res.status(400).json({ code: 'INVALID_INPUT', message: 'Tovar yoki xizmat nomi kamida 2 ta belgidan iborat bo‘lishi kerak' });
    return;
  }

  const numPrice = Math.max(0, Math.round(Number(price) || 0));
  const numStock = Math.max(1, Math.round(Number(stockOnHand) || 1));
  const cleanTitle = title.trim();
  const itemType: 'PRODUCT' | 'SERVICE' = type === 'SERVICE' ? 'SERVICE' : 'PRODUCT';
  const cleanUnit = (packUnit || (itemType === 'SERVICE' ? 'xizmat' : 'dona')).trim();
  const cleanCategory = (category || (itemType === 'SERVICE' ? 'Xizmatlar' : 'Oziq-ovqat')).trim();
  const cleanBarcode = barcode && typeof barcode === 'string' && barcode.trim() ? barcode.trim() : undefined;

  // Normalized title for consensus matching
  const normalizedTitle = cleanTitle.toLowerCase().replace(/[^a-z0-9а-яёўқғҳ]+/gi, ' ').replace(/\s+/g, ' ').trim();
  const consensusGroupKey = cleanBarcode
    ? `${store.id}_bc_${cleanBarcode}`
    : `${store.id}_${itemType}_${normalizedTitle}`;

  const now = new Date().toISOString();

  // Check if THIS user already submitted a pending proposal for this item
  let existingUserProposal = Array.from(db.itemProposals.values()).find(
    (p) => p.storeId === store.id && p.consensusGroupKey === consensusGroupKey && p.userId === user.id && p.status === 'PENDING'
  );

  let proposalId: string;
  if (existingUserProposal) {
    // Update existing proposal values
    existingUserProposal.title = cleanTitle;
    existingUserProposal.price = numPrice;
    existingUserProposal.stockOnHand = numStock;
    existingUserProposal.category = cleanCategory;
    existingUserProposal.packUnit = cleanUnit;
    if (description) existingUserProposal.description = description.trim();
    if (photoUrl) existingUserProposal.photoUrl = photoUrl.trim();
    existingUserProposal.updatedAt = now;
    proposalId = existingUserProposal.id;
    db.itemProposals.set(proposalId, existingUserProposal);
  } else {
    // Create new proposal
    proposalId = uuidv4();
    const newProposal = {
      id: proposalId,
      storeId: store.id,
      userId: user.id,
      userFullName: user.fullName || user.email.split('@')[0],
      userPhone: user.phone || '',
      title: cleanTitle,
      normalizedTitle,
      type: itemType,
      category: cleanCategory,
      price: numPrice,
      stockOnHand: numStock,
      packUnit: cleanUnit,
      barcode: cleanBarcode,
      photoUrl: photoUrl && typeof photoUrl === 'string' ? photoUrl.trim() : undefined,
      description: description && typeof description === 'string' ? description.trim() : undefined,
      status: 'PENDING' as const,
      consensusGroupKey,
      createdAt: now,
      updatedAt: now
    };
    db.itemProposals.set(proposalId, newProposal);
  }

  // Calculate consensus: find all PENDING proposals for this consensusGroupKey
  const matchingPending = Array.from(db.itemProposals.values()).filter(
    (p) => p.storeId === store.id && p.consensusGroupKey === consensusGroupKey && p.status === 'PENDING'
  );

  // Group by distinct user
  const distinctUserProposals = new Map<string, any>();
  for (const p of matchingPending) {
    distinctUserProposals.set(p.userId, p);
  }

  const distinctCount = distinctUserProposals.size;

  // RULE: If 3 or more distinct users proposed the same item -> AUTO APPROVE!
  if (distinctCount >= 3) {
    const list = Array.from(distinctUserProposals.values());
    const avgPrice = Math.round(list.reduce((sum, p) => sum + Number(p.price), 0) / list.length);
    const avgStock = Math.round(list.reduce((sum, p) => sum + Number(p.stockOnHand), 0) / list.length);

    const chosenPhotoUrl = list.find((p) => p.photoUrl)?.photoUrl || (typeof photoUrl === 'string' ? photoUrl.trim() : undefined);

    // Find or create variant
    let variantId = uuidv4();
    if (cleanBarcode) {
      const existingV = Array.from(db.variants.values()).find((v) => v.barcode === cleanBarcode);
      if (existingV) variantId = existingV.id;
    }
    if (!db.variants.has(variantId)) {
      const existingByName = Array.from(db.variants.values()).find(
        (v) => (v.title || (v as any).name || '').toLowerCase().trim() === cleanTitle.toLowerCase()
      );
      if (existingByName) {
        variantId = existingByName.id;
        if (!existingByName.photoUrl && chosenPhotoUrl) {
          existingByName.photoUrl = chosenPhotoUrl;
          (existingByName as any).imageUrl = chosenPhotoUrl;
        }
      } else {
        db.variants.set(variantId, {
          id: variantId,
          productId: uuidv4(),
          sku: cleanBarcode || `SKU-${Date.now().toString(36).toUpperCase()}`,
          barcode: cleanBarcode,
          title: cleanTitle,
          name: cleanTitle,
          category: cleanCategory,
          packUnit: cleanUnit,
          photoUrl: chosenPhotoUrl,
          imageUrl: chosenPhotoUrl,
          ...({ createdAt: now, updatedAt: now } as any)
        });
      }
    } else if (chosenPhotoUrl) {
      const v = db.variants.get(variantId);
      if (v && !v.photoUrl) {
        v.photoUrl = chosenPhotoUrl;
        (v as any).imageUrl = chosenPhotoUrl;
      }
    }

    // Check if store already has an offer for this variant
    let targetOffer = Array.from(db.offers.values()).find(
      (o) => o.storeId === store.id && o.variantId === variantId
    );

    let newOfferId: string;
    if (targetOffer) {
      targetOffer.price = avgPrice.toString();
      targetOffer.stockOnHand = avgStock;
      targetOffer.status = 'ACTIVE';
      if (chosenPhotoUrl) {
        targetOffer.variant.photoUrl = chosenPhotoUrl;
        (targetOffer.variant as any).imageUrl = chosenPhotoUrl;
        const v = db.variants.get(variantId);
        if (v) {
          v.photoUrl = chosenPhotoUrl;
          (v as any).imageUrl = chosenPhotoUrl;
        }
      }
      targetOffer.priceUpdatedAt = now;
      newOfferId = targetOffer.id;
    } else {
      newOfferId = uuidv4();
      const variantObj = db.variants.get(variantId)!;
      if (chosenPhotoUrl && !variantObj.photoUrl) {
        variantObj.photoUrl = chosenPhotoUrl;
        (variantObj as any).imageUrl = chosenPhotoUrl;
      }
      const newOffer: Offer = {
        id: newOfferId,
        storeId: store.id,
        variantId,
        price: avgPrice.toString(),
        minOrderQuantity: 1,
        stockOnHand: avgStock,
        freshness: 'NEW',
        status: 'ACTIVE',
        priceUpdatedAt: now,
        wholesaleTiers: [],
        version: 1,
        variant: variantObj
      };
      db.offers.set(newOfferId, newOffer);
    }

    // Update balances
    db.balances.set(newOfferId, {
      offerId: newOfferId,
      onHand: new Decimal(avgStock),
      averageUnitCost: new Decimal(Math.round(avgPrice * 0.7)),
      lastVerifiedAt: new Date(),
      version: 1
    });

    // Mark all matching proposals as AUTO_APPROVED
    for (const p of list) {
      p.status = 'AUTO_APPROVED';
      p.approvedBy = 'CONSENSUS_3_USERS';
      p.createdOfferId = newOfferId;
      p.updatedAt = now;
      db.itemProposals.set(p.id, p);
      await persistItemProposalToSupabase(p);
    }

    db.saveToFile();
    db.scheduleSave();
    await syncAllToSupabase(db);

    res.json({
      success: true,
      autoApproved: true,
      offerId: newOfferId,
      avgPrice,
      avgStock,
      message: `Tabriklaymiz! 3 ta mustaqil foydalanuvchi bir xil ${itemType === 'SERVICE' ? 'xizmat' : 'tovar'}ni kiritgani sababli, u o‘rtacha narxi (${avgPrice.toLocaleString('uz-UZ')} so‘m) va soni (${avgStock} ${cleanUnit}) bilan avtomatik tasdiqlanib, do‘kon sahifasiga qo‘shildi!`
    });
    return;
  }

  // Not yet 3 distinct users -> remains PENDING
  const currentProp = existingUserProposal || db.itemProposals.get(proposalId);
  if (currentProp) {
    await persistItemProposalToSupabase(currentProp);
  }
  db.saveToFile();
  db.scheduleSave();
  const remaining = 3 - distinctCount;
  res.json({
    success: true,
    autoApproved: false,
    proposalId,
    pendingCount: distinctCount,
    remainingForAutoApproval: remaining,
    message: `Taklifingiz muvaffaqiyatli qabul qilindi! Admin, moderator yoki do‘kon egasi tasdiqlaganidan so‘ng do‘kon sahifasida paydo bo‘ladi. (Eslatma: agar yana ${remaining} ta mustaqil foydalanuvchi xuddi shu ${itemType === 'SERVICE' ? 'xizmat' : 'tovar'}ni kiritsa, tizim o‘rtacha narx va soni bilan avtomatik tasdiqlaydi).`
  });
});

// 2. Do'kon bo'yicha takliflarni olish
proposalsRouter.get('/api/v1/stores/:storeId/proposals', (req: Request, res: Response) => {
  const { storeId } = req.params;
  const store = findStoreByParam(storeId) || db.stores.get(storeId);
  const targetId = store ? store.id : storeId;

  const proposals = Array.from(db.itemProposals.values())
    .filter((p) => p.storeId === targetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Attach consensus counts
  const enriched = proposals.map((p) => {
    const distinctUsers = new Set(
      Array.from(db.itemProposals.values())
        .filter((x) => x.storeId === p.storeId && x.consensusGroupKey === p.consensusGroupKey)
        .map((x) => x.userId)
    );
    return {
      ...p,
      consensusCount: distinctUsers.size
    };
  });

  res.json({ items: enriched, total: enriched.length });
});

// 3. Admin / Moderator / Merchant uchun barcha takliflarni olish
proposalsRouter.get('/api/v1/admin/item-proposals', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }

  let proposals = Array.from(db.itemProposals.values());

  // If merchant/owner, only show proposals for their stores
  if (!['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
    const userOrgs = new Set(
      Array.from(db.memberships.values())
        .filter((m) => m.userId === user.id && m.status === 'ACTIVE')
        .map((m) => m.organizationId)
    );
    const storeIds = new Set(
      Array.from(db.stores.values())
        .filter((s) => (s as any).ownerId === user.id || userOrgs.has(s.organizationId))
        .map((s) => s.id)
    );
    proposals = proposals.filter((p) => storeIds.has(p.storeId));
  }

  // Filter by status if requested
  const statusFilter = req.query.status as string;
  if (statusFilter && statusFilter !== 'ALL') {
    proposals = proposals.filter((p) => p.status === statusFilter);
  }

  // Attach storeName & consensusCount
  const enriched = proposals
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((p) => {
      const store = db.stores.get(p.storeId);
      const distinctUsers = new Set(
        Array.from(db.itemProposals.values())
          .filter((x) => x.storeId === p.storeId && x.consensusGroupKey === p.consensusGroupKey)
          .map((x) => x.userId)
      );
      return {
        ...p,
        storeName: store?.name || 'Do‘kon',
        storeAddress: store?.address || '',
        consensusCount: distinctUsers.size
      };
    });

  res.json({ items: enriched, total: enriched.length });
});

// 4. Taklifni tasdiqlash (Admin, Moderator yoki Do'kon egasi)
proposalsRouter.post('/api/v1/admin/item-proposals/:id/approve', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }

  const requestedId = req.params.id;
  let proposal: any = db.itemProposals.get(requestedId);

  // Fallback 1: match by start of ID in memory
  if (!proposal) {
    proposal = Array.from(db.itemProposals.values()).find(
      (p) =>
        p.id === requestedId ||
        p.id.startsWith(requestedId) ||
        requestedId.startsWith(p.id) ||
        requestedId.startsWith(p.id.slice(0, 8))
    );
  }

  // Fallback 2: pull from Supabase reports table
  if (!proposal && isSupabaseConfigured() && supabase) {
    try {
      const { data: rep } = await supabase
        .from('reports')
        .select('*')
        .eq('id', requestedId)
        .eq('target_type', 'ITEM_PROPOSAL')
        .maybeSingle();
      if (rep && rep.details) {
        const parsed = typeof rep.details === 'string' ? JSON.parse(rep.details) : rep.details;
        if (parsed) {
          proposal = { ...parsed, id: rep.id, status: rep.status || parsed.status || 'PENDING' };
          db.itemProposals.set(proposal.id, proposal);
        }
      }
      if (!proposal) {
        const { data: reps } = await supabase.from('reports').select('*').eq('target_type', 'ITEM_PROPOSAL');
        const match = reps?.find(
          (r) => r.id === requestedId || r.id.startsWith(requestedId) || requestedId.startsWith(r.id.slice(0, 8))
        );
        if (match && match.details) {
          const parsed = typeof match.details === 'string' ? JSON.parse(match.details) : match.details;
          if (parsed) {
            proposal = { ...parsed, id: match.id, status: match.status || parsed.status || 'PENDING' };
            db.itemProposals.set(proposal.id, proposal);
          }
        }
      }
    } catch (e) {
      console.error('[Supabase Item Proposal Lookup Error]', e);
    }
  }

  if (!proposal) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Taklif topilmadi' });
    return;
  }

  if (!canUserManageStoreProposals(user, proposal.storeId)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ushbu do‘kon takliflarini tasdiqlash huquqingiz yo‘q' });
    return;
  }

  const store = db.stores.get(proposal.storeId);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const now = new Date().toISOString();

  // Create or find variant
  let variantId = uuidv4();
  if (proposal.barcode) {
    const existingV = Array.from(db.variants.values()).find((v) => v.barcode === proposal.barcode);
    if (existingV) variantId = existingV.id;
  }
  if (!db.variants.has(variantId)) {
    const existingByName = Array.from(db.variants.values()).find(
      (v) => (v.title || (v as any).name || '').toLowerCase().trim() === proposal.title.toLowerCase().trim()
    );
    if (existingByName) {
      variantId = existingByName.id;
      if (!existingByName.photoUrl && proposal.photoUrl) {
        existingByName.photoUrl = proposal.photoUrl;
        (existingByName as any).imageUrl = proposal.photoUrl;
      }
    } else {
      db.variants.set(variantId, {
        id: variantId,
        productId: uuidv4(),
        sku: proposal.barcode || `SKU-${Date.now().toString(36).toUpperCase()}`,
        barcode: proposal.barcode,
        title: proposal.title,
        name: proposal.title,
        category: proposal.category,
        packUnit: proposal.packUnit,
        photoUrl: proposal.photoUrl,
        imageUrl: proposal.photoUrl,
        ...({ createdAt: now, updatedAt: now } as any)
      });
    }
  } else if (proposal.photoUrl) {
    const v = db.variants.get(variantId);
    if (v && !v.photoUrl) {
      v.photoUrl = proposal.photoUrl;
      (v as any).imageUrl = proposal.photoUrl;
    }
  }

  // Create or update offer
  let targetOffer = Array.from(db.offers.values()).find(
    (o) => o.storeId === store.id && o.variantId === variantId
  );

  let offerId: string;
  if (targetOffer) {
    targetOffer.price = proposal.price.toString();
    targetOffer.stockOnHand = proposal.stockOnHand;
    targetOffer.status = 'ACTIVE';
    if (proposal.photoUrl) {
      targetOffer.variant.photoUrl = proposal.photoUrl;
      (targetOffer.variant as any).imageUrl = proposal.photoUrl;
      const v = db.variants.get(variantId);
      if (v) {
        v.photoUrl = proposal.photoUrl;
        (v as any).imageUrl = proposal.photoUrl;
      }
    }
    targetOffer.priceUpdatedAt = now;
    offerId = targetOffer.id;
  } else {
    offerId = uuidv4();
    const variantObj = db.variants.get(variantId)!;
    if (proposal.photoUrl && !variantObj.photoUrl) {
      variantObj.photoUrl = proposal.photoUrl;
      (variantObj as any).imageUrl = proposal.photoUrl;
    }
    const newOffer: Offer = {
      id: offerId,
      storeId: store.id,
      variantId,
      price: proposal.price.toString(),
      minOrderQuantity: 1,
      stockOnHand: proposal.stockOnHand,
      freshness: 'NEW',
      status: 'ACTIVE',
      priceUpdatedAt: now,
      wholesaleTiers: [],
      version: 1,
      variant: variantObj
    };
    db.offers.set(offerId, newOffer);
  }

  // Update inventory balance
  db.balances.set(offerId, {
    offerId,
    onHand: new Decimal(proposal.stockOnHand),
    averageUnitCost: new Decimal(Math.round(proposal.price * 0.7)),
    lastVerifiedAt: new Date(),
    version: 1
  });

  proposal.status = 'APPROVED';
  proposal.approvedBy = `${user.fullName || user.email} (${user.role})`;
  proposal.createdOfferId = offerId;
  proposal.updatedAt = now;
  db.itemProposals.set(proposal.id, proposal);

  await persistItemProposalToSupabase(proposal);
  await syncAllToSupabase(db);
  db.saveToFile();
  db.scheduleSave();

  res.json({
    success: true,
    message: `"${proposal.title}" muvaffaqiyatli tasdiqlandi va do‘konga qo‘shildi!`,
    offerId
  });
});

// 5. Taklifni rad etish
proposalsRouter.post('/api/v1/admin/item-proposals/:id/reject', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }

  const requestedId = req.params.id;
  let proposal: any = db.itemProposals.get(requestedId);

  // Fallback 1: match by start of ID in memory
  if (!proposal) {
    proposal = Array.from(db.itemProposals.values()).find(
      (p) =>
        p.id === requestedId ||
        p.id.startsWith(requestedId) ||
        requestedId.startsWith(p.id) ||
        requestedId.startsWith(p.id.slice(0, 8))
    );
  }

  // Fallback 2: pull from Supabase
  if (!proposal && isSupabaseConfigured() && supabase) {
    try {
      const { data: rep } = await supabase
        .from('reports')
        .select('*')
        .eq('id', requestedId)
        .eq('target_type', 'ITEM_PROPOSAL')
        .maybeSingle();
      if (rep && rep.details) {
        const parsed = typeof rep.details === 'string' ? JSON.parse(rep.details) : rep.details;
        if (parsed) {
          proposal = { ...parsed, id: rep.id, status: rep.status || parsed.status || 'PENDING' };
          db.itemProposals.set(proposal.id, proposal);
        }
      }
      if (!proposal) {
        const { data: reps } = await supabase.from('reports').select('*').eq('target_type', 'ITEM_PROPOSAL');
        const match = reps?.find(
          (r) => r.id === requestedId || r.id.startsWith(requestedId) || requestedId.startsWith(r.id.slice(0, 8))
        );
        if (match && match.details) {
          const parsed = typeof match.details === 'string' ? JSON.parse(match.details) : match.details;
          if (parsed) {
            proposal = { ...parsed, id: match.id, status: match.status || parsed.status || 'PENDING' };
            db.itemProposals.set(proposal.id, proposal);
          }
        }
      }
    } catch (e) {
      console.error('[Supabase Item Proposal Lookup Error]', e);
    }
  }

  if (!proposal) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Taklif topilmadi' });
    return;
  }

  if (!canUserManageStoreProposals(user, proposal.storeId)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ushbu do‘kon takliflarini rad etish huquqingiz yo‘q' });
    return;
  }

  proposal.status = 'REJECTED';
  proposal.approvedBy = `${user.fullName || user.email} (${user.role})`;
  proposal.updatedAt = new Date().toISOString();
  db.itemProposals.set(proposal.id, proposal);

  await persistItemProposalToSupabase(proposal);
  db.saveToFile();
  db.scheduleSave();

  res.json({
    success: true,
    message: `"${proposal.title}" taklifi rad etildi.`
  });
});

// ================= PHOTO CHANGE PROPOSALS =================
proposalsRouter.post('/api/v1/stores/:storeId/photo-proposals', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Rasm taklif qilish uchun iltimos, tizimga kiring' });
    return;
  }

  const { storeId } = req.params;
  const store = findStoreByParam(storeId) || db.stores.get(storeId);
  if (!store || store.status !== 'ACTIVE') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const { targetType = 'STORE', variantId, photoUrl, comment } = req.body;

  if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.trim()) {
    res.status(400).json({ code: 'INVALID_INPUT', message: 'Rasm kiritilishi shart' });
    return;
  }

  let productTitle: string | undefined;
  if (targetType === 'PRODUCT') {
    if (!variantId) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Tovar tanlanishi shart' });
      return;
    }
    const variant = db.variants.get(variantId);
    if (!variant) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Mahsulot varianti topilmadi' });
      return;
    }
    productTitle = variant.title;
  }

  const now = new Date().toISOString();
  const proposalId = uuidv4();
  const proposal: any = {
    id: proposalId,
    targetType: targetType === 'PRODUCT' ? 'PRODUCT' : 'STORE',
    storeId: store.id,
    storeName: store.name,
    variantId: targetType === 'PRODUCT' ? variantId : undefined,
    productTitle,
    photoUrl: photoUrl.trim(),
    comment: comment && typeof comment === 'string' ? comment.trim() : undefined,
    userId: user.id,
    userFullName: user.fullName || user.email.split('@')[0],
    userPhone: user.phone || '',
    status: 'PENDING',
    createdAt: now,
    updatedAt: now
  };

  db.photoProposals.set(proposalId, proposal);
  await persistPhotoProposalToSupabase(proposal);
  db.saveToFile();
  db.scheduleSave();

  res.status(201).json({
    success: true,
    message: 'Rasm moderatsiyaga muvaffaqiyatli yuborildi. Moderator tasdiqlaganidan so‘ng yangilanadi.',
    proposal
  });
});

proposalsRouter.get('/api/v1/stores/:storeId/photo-proposals', (req: Request, res: Response) => {
  const { storeId } = req.params;
  const store = findStoreByParam(storeId) || db.stores.get(storeId);
  const targetId = store ? store.id : storeId;

  const proposals = Array.from(db.photoProposals.values())
    .filter((p) => p.storeId === targetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ items: proposals, total: proposals.length });
});

proposalsRouter.get('/api/v1/user/photo-proposals', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }
  const userId =
    ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role) && req.query.userId
      ? String(req.query.userId)
      : user.id;

  const proposals = Array.from(db.photoProposals.values())
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ items: proposals, total: proposals.length });
});

proposalsRouter.get('/api/v1/admin/photo-proposals', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }

  let proposals = Array.from(db.photoProposals.values());

  // Non-staff can only see photo proposals for stores they manage
  if (!['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
    const userOrgs = new Set(
      Array.from(db.memberships.values())
        .filter((m) => m.userId === user.id && m.status === 'ACTIVE')
        .map((m) => m.organizationId)
    );
    const storeIds = new Set(
      Array.from(db.stores.values())
        .filter((s) => (s as any).ownerId === user.id || userOrgs.has(s.organizationId))
        .map((s) => s.id)
    );
    proposals = proposals.filter((p) => storeIds.has(p.storeId));
  }

  const statusFilter = req.query.status as string;
  if (statusFilter && statusFilter !== 'ALL') {
    proposals = proposals.filter((p) => p.status === statusFilter);
  }

  proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items: proposals, total: proposals.length });
});

proposalsRouter.post('/api/v1/admin/photo-proposals/:id/approve', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }

  const requestedId = req.params.id;
  let proposal: any = db.photoProposals.get(requestedId);

  // Fallback 1: match in memory by prefix
  if (!proposal) {
    proposal = Array.from(db.photoProposals.values()).find(
      (p) =>
        p.id === requestedId ||
        p.id.startsWith(requestedId) ||
        requestedId.startsWith(p.id) ||
        requestedId.startsWith(p.id.slice(0, 8))
    );
  }

  // Fallback 2: pull from Supabase
  if (!proposal && isSupabaseConfigured() && supabase) {
    try {
      const { data: rep } = await supabase
        .from('reports')
        .select('*')
        .eq('id', requestedId)
        .eq('target_type', 'PHOTO_PROPOSAL')
        .maybeSingle();
      if (rep && rep.details) {
        const parsed = typeof rep.details === 'string' ? JSON.parse(rep.details) : rep.details;
        if (parsed) {
          proposal = { ...parsed, id: rep.id, status: rep.status || parsed.status || 'PENDING' };
          db.photoProposals.set(proposal.id, proposal);
        }
      }
      if (!proposal) {
        const { data: reps } = await supabase.from('reports').select('*').eq('target_type', 'PHOTO_PROPOSAL');
        const match = reps?.find(
          (r) => r.id === requestedId || r.id.startsWith(requestedId) || requestedId.startsWith(r.id.slice(0, 8))
        );
        if (match && match.details) {
          const parsed = typeof match.details === 'string' ? JSON.parse(match.details) : match.details;
          if (parsed) {
            proposal = { ...parsed, id: match.id, status: match.status || parsed.status || 'PENDING' };
            db.photoProposals.set(proposal.id, proposal);
          }
        }
      }
    } catch (e) {
      console.error('[Supabase Photo Proposal Lookup Error]', e);
    }
  }

  if (!proposal) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Rasm so‘rovi topilmadi' });
    return;
  }

  if (!canUserManageStoreProposals(user, proposal.storeId)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ushbu do‘kon/tashkilot rasmini tasdiqlash huquqingiz yo‘q' });
    return;
  }

  const now = new Date().toISOString();

  if (proposal.targetType === 'STORE') {
    const store = db.stores.get(proposal.storeId);
    if (store) {
      store.photoUrl = proposal.photoUrl;
      store.updatedAt = now;
      db.stores.set(store.id, store);
    }
  } else if (proposal.targetType === 'PRODUCT' && proposal.variantId) {
    const variant = db.variants.get(proposal.variantId);
    if (variant) {
      variant.photoUrl = proposal.photoUrl;
      (variant as any).updatedAt = now;
      db.variants.set(variant.id, variant);
    }
    for (const off of db.offers.values()) {
      if (off.variantId === proposal.variantId) {
        off.variant.photoUrl = proposal.photoUrl;
        off.priceUpdatedAt = now;
        db.offers.set(off.id, off);
      }
    }
  }

  proposal.status = 'APPROVED';
  proposal.reviewedBy = `${user.fullName || user.email} (${user.role})`;
  proposal.updatedAt = now;
  db.photoProposals.set(proposal.id, proposal);

  await persistPhotoProposalToSupabase(proposal);
  await syncAllToSupabase(db);
  db.saveToFile();
  db.scheduleSave();

  res.json({
    success: true,
    message:
      proposal.targetType === 'STORE'
        ? 'Tashkilot rasmi muvaffaqiyatli tasdiqlandi va yangilandi!'
        : 'Tovar rasmi muvaffaqiyatli tasdiqlandi va yangilandi!',
    proposal
  });
});

proposalsRouter.post('/api/v1/admin/photo-proposals/:id/reject', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }

  const requestedId = req.params.id;
  let proposal: any = db.photoProposals.get(requestedId);

  // Fallback 1: match in memory by prefix
  if (!proposal) {
    proposal = Array.from(db.photoProposals.values()).find(
      (p) =>
        p.id === requestedId ||
        p.id.startsWith(requestedId) ||
        requestedId.startsWith(p.id) ||
        requestedId.startsWith(p.id.slice(0, 8))
    );
  }

  // Fallback 2: pull from Supabase
  if (!proposal && isSupabaseConfigured() && supabase) {
    try {
      const { data: rep } = await supabase
        .from('reports')
        .select('*')
        .eq('id', requestedId)
        .eq('target_type', 'PHOTO_PROPOSAL')
        .maybeSingle();
      if (rep && rep.details) {
        const parsed = typeof rep.details === 'string' ? JSON.parse(rep.details) : rep.details;
        if (parsed) {
          proposal = { ...parsed, id: rep.id, status: rep.status || parsed.status || 'PENDING' };
          db.photoProposals.set(proposal.id, proposal);
        }
      }
      if (!proposal) {
        const { data: reps } = await supabase.from('reports').select('*').eq('target_type', 'PHOTO_PROPOSAL');
        const match = reps?.find(
          (r) => r.id === requestedId || r.id.startsWith(requestedId) || requestedId.startsWith(r.id.slice(0, 8))
        );
        if (match && match.details) {
          const parsed = typeof match.details === 'string' ? JSON.parse(match.details) : match.details;
          if (parsed) {
            proposal = { ...parsed, id: match.id, status: match.status || parsed.status || 'PENDING' };
            db.photoProposals.set(proposal.id, proposal);
          }
        }
      }
    } catch (e) {
      console.error('[Supabase Photo Proposal Lookup Error]', e);
    }
  }

  if (!proposal) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Rasm so‘rovi topilmadi' });
    return;
  }

  const now = new Date().toISOString();
  proposal.status = 'REJECTED';
  proposal.reviewedBy = `${user.fullName || user.email} (${user.role})`;
  proposal.reviewNotes = req.body?.notes || 'Moderator tomonidan qabul qilinmadi';
  proposal.updatedAt = now;
  db.photoProposals.set(proposal.id, proposal);

  await persistPhotoProposalToSupabase(proposal);
  db.saveToFile();
  db.scheduleSave();

  res.json({
    success: true,
    message: 'Rasm so‘rovi rad etildi.',
    proposal
  });
});
