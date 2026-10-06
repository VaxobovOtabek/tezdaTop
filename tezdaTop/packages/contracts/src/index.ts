import { z } from 'zod';

// ================= USER & AUTH =================
export const UserRoleSchema = z.enum([
  'GUEST',
  'CUSTOMER',
  'OWNER',
  'MANAGER',
  'OPERATOR',
  'MODERATOR',
  'SUPERADMIN'
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: UserRoleSchema,
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']),
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
  verificationMethod: z.enum(['TELEGRAM', 'SMS', 'NONE']).optional(),
  isVerified: z.boolean().optional(),
  verificationCode: z.string().optional(),
  plainPassword: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().min(1).optional(),
  login: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  password: z.string().min(1)
}).passthrough();
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().min(1),
  login: z.string().min(1).optional(),
  fullName: z.string().min(2),
  password: z.string().min(4),
  phone: z.string().optional()
}).passthrough();
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// ================= STORES & ORGANIZATIONS =================
export const OrganizationTypeSchema = z.enum(['RETAIL', 'WHOLESALE', 'MIXED']);
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

export const StoreStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'NEEDS_CHANGES',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED'
]);
export type StoreStatus = z.infer<typeof StoreStatusSchema>;

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const StoreHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0=Sunday, 1=Monday...
  openTime: z.string(), // "08:00"
  closeTime: z.string(), // "23:00"
  isClosed: z.boolean().default(false)
});
export type StoreHours = z.infer<typeof StoreHoursSchema>;

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  inn: z.string().optional(),
  type: OrganizationTypeSchema,
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  region: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  createdAt: z.string()
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const StoreSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  inn: z.string().optional(),
  address: z.string().min(1),
  region: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  phone: z.string().min(1),
  location: CoordinatesSchema,
  entranceLocation: CoordinatesSchema.optional(),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().nonnegative().default(0),
  isVerified: z.boolean().default(false),
  status: StoreStatusSchema,
  type: OrganizationTypeSchema,
  photoUrl: z.string().optional(),
  hours: z.array(StoreHoursSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Store = z.infer<typeof StoreSchema>;

// ================= PRODUCTS & OFFERS =================
export const PriceTierSchema = z.object({
  minQuantity: z.number().int().positive(),
  unitPrice: z.string() // Decimal string e.g. "7400.00"
});
export type PriceTier = z.infer<typeof PriceTierSchema>;

export const FreshnessStatusSchema = z.enum(['NEW', 'STALE', 'VERY_STALE', 'UNKNOWN']);
export type FreshnessStatus = z.infer<typeof FreshnessStatusSchema>;

export const VariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  title: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  packSize: z.string().optional(), // e.g. "50 g"
  packUnit: z.string().default('dona'), // "dona", "kg", "litr", "quti"
  barcode: z.string().optional(),
  sku: z.string().optional(),
  photoUrl: z.string().optional()
});
export type Variant = z.infer<typeof VariantSchema>;

export const OfferSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  variantId: z.string().uuid(),
  variant: VariantSchema,
  price: z.string(), // Decimal string e.g. "8000.00"
  minOrderQuantity: z.number().int().positive().default(1),
  stockOnHand: z.number().nonnegative().default(0),
  stockVerifiedAt: z.string().nullable().optional(),
  priceUpdatedAt: z.string(),
  freshness: FreshnessStatusSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']),
  wholesaleTiers: z.array(PriceTierSchema).default([]),
  version: z.number().int().default(1)
});
export type Offer = z.infer<typeof OfferSchema>;

// ================= SEARCH =================
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusM: z.number().int().min(50).max(3000).default(1000),
  openNow: z.boolean().optional(),
  inStock: z.boolean().optional(),
  freshOnly: z.boolean().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  type: OrganizationTypeSchema.optional(),
  minQuantity: z.number().int().positive().optional(),
  sort: z.enum(['relevance', 'distance', 'price', 'rating']).default('relevance'),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20)
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const StoreSearchResultSchema = z.object({
  store: StoreSchema,
  distanceM: z.number(), // straight-line metres
  isOpenNow: z.boolean(),
  bestOffer: OfferSchema,
  otherMatchingOfferCount: z.number().int().nonnegative().default(0),
  similarProducts: z.array(OfferSchema).default([])
});
export type StoreSearchResult = z.infer<typeof StoreSearchResultSchema>;

export const SearchResponseSchema = z.object({
  items: z.array(StoreSearchResultSchema),
  totalStores: z.number().int().nonnegative(),
  totalOffers: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean()
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export const MarkerItemSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string(),
  location: CoordinatesSchema,
  bestPrice: z.string(),
  productTitle: z.string(),
  isOpenNow: z.boolean()
});
export type MarkerItem = z.infer<typeof MarkerItemSchema>;

// ================= ROUTING =================
export const RouteRequestSchema = z.object({
  origin: CoordinatesSchema,
  destination: CoordinatesSchema,
  mode: z.enum(['walking', 'driving']).default('walking')
});
export type RouteRequest = z.infer<typeof RouteRequestSchema>;

export const RouteStepSchema = z.object({
  instruction: z.string(),
  distanceM: z.number(),
  durationSec: z.number()
});
export type RouteStep = z.infer<typeof RouteStepSchema>;

export const RouteResponseSchema = z.object({
  mode: z.enum(['walking', 'driving']),
  distanceM: z.number(),
  durationSec: z.number(),
  geometry: z.array(z.tuple([z.number(), z.number()])), // [ [lng, lat], ... ]
  steps: z.array(RouteStepSchema),
  provider: z.string(),
  isApproximateTraffic: z.boolean().default(true),
  externalMapUrl: z.string().optional()
});
export type RouteResponse = z.infer<typeof RouteResponseSchema>;

// ================= INVENTORY & LEDGER DOCUMENTS =================
export const DocumentTypeSchema = z.enum(['RECEIPT', 'SALE', 'RETURN', 'ADJUSTMENT']);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentStatusSchema = z.enum(['DRAFT', 'POSTED', 'REVERSED']);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const DocumentLineSchema = z.object({
  id: z.string().uuid().optional(),
  variantId: z.string().uuid(),
  variantTitle: z.string().optional(),
  quantity: z.string(), // Decimal string e.g. "10.000"
  unitPriceOrCost: z.string(), // Decimal string e.g. "5000.00"
  subtotal: z.string(), // Decimal string
  originalSaleLineId: z.string().uuid().optional(),
  isRestockable: z.boolean().default(true),
  reason: z.string().optional()
});
export type DocumentLine = z.infer<typeof DocumentLineSchema>;

export const StockDocumentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  docType: DocumentTypeSchema,
  status: DocumentStatusSchema,
  documentNumber: z.string(),
  date: z.string(),
  supplierOrCustomer: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD']).default('CASH'),
  totalAmount: z.string(),
  lines: z.array(DocumentLineSchema),
  notes: z.string().optional(),
  postedAt: z.string().nullable().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string()
});
export type StockDocument = z.infer<typeof StockDocumentSchema>;

// ================= REVIEWS & REPORTS =================
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(2000),
  status: z.enum(['PUBLISHED', 'HIDDEN']),
  merchantReply: z.string().optional(),
  merchantRepliedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Review = z.infer<typeof ReviewSchema>;

export const ReportReasonSchema = z.enum([
  'WRONG_PRICE',
  'UNAVAILABLE_PRODUCT',
  'WRONG_LOCATION',
  'CLOSED_STORE',
  'WRONG_HOURS',
  'WRONG_PHONE',
  'INAPPROPRIATE_REVIEW',
  'OTHER'
]);
export type ReportReason = z.infer<typeof ReportReasonSchema>;

export const ReportStatusSchema = z.enum([
  'OPEN',
  'IN_REVIEW',
  'WAITING_MERCHANT',
  'RESOLVED',
  'DISMISSED'
]);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const ReportSchema = z.object({
  id: z.string().uuid(),
  reporterUserId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
  offerId: z.string().uuid().optional(),
  reason: ReportReasonSchema,
  details: z.string().min(5),
  evidencePhotoUrl: z.string().optional(),
  status: ReportStatusSchema,
  resolutionNotes: z.string().optional(),
  createdAt: z.string(),
  resolvedAt: z.string().optional()
});
export type Report = z.infer<typeof ReportSchema>;

// ================= CORRECTION REQUESTS =================
export const CorrectionStatusSchema = z.enum(['OPEN', 'SUBMITTED', 'ACCEPTED', 'RETURNED']);
export type CorrectionStatus = z.infer<typeof CorrectionStatusSchema>;

export const CorrectionRequestSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  affectedFields: z.array(z.string()),
  message: z.string().min(5),
  deadline: z.string(),
  status: CorrectionStatusSchema,
  merchantResponse: z.string().optional(),
  merchantSubmittedAt: z.string().optional(),
  adminResolutionNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type CorrectionRequest = z.infer<typeof CorrectionRequestSchema>;

// ================= REPORTS & STATS =================
export const MerchantSummarySchema = z.object({
  date: z.string(),
  netSales: z.string(), // Decimal string
  grossProfit: z.string(),
  cogs: z.string(),
  operatingExpenses: z.string(),
  operatingResult: z.string(),
  lowStockCount: z.number().int().nonnegative(),
  staleCount: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  dailySalesChart: z.array(
    z.object({
      date: z.string(),
      label: z.string(),
      amount: z.string()
    })
  )
});
export type MerchantSummary = z.infer<typeof MerchantSummarySchema>;

// ================= CREDENTIAL CHANGE & ADMIN NOTIFICATIONS =================
export const CredentialRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type CredentialRequestStatus = z.infer<typeof CredentialRequestStatusSchema>;

export const CredentialChangeRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string(),
  userPhone: z.string().optional(),
  userRole: UserRoleSchema.optional(),
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
  requestedEmail: z.string().optional(),
  requestedPassword: z.string().optional(),
  requestedFullName: z.string().optional(),
  requestedPhone: z.string().optional(),
  reason: z.string().optional(),
  status: CredentialRequestStatusSchema,
  adminComment: z.string().optional(),
  createdAt: z.string(),
  resolvedAt: z.string().optional()
});
export type CredentialChangeRequest = z.infer<typeof CredentialChangeRequestSchema>;

export const InquiryPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
export type InquiryPriority = z.infer<typeof InquiryPrioritySchema>;

export const InquiryStatusSchema = z.enum(['PENDING', 'PENDING_MERCHANT_REPLY', 'MERCHANT_SUBMITTED', 'MERCHANT_REPLIED', 'RESOLVED', 'CLOSED']);
export type InquiryStatus = z.infer<typeof InquiryStatusSchema>;

export const AdminInquirySchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().optional(),
  storeName: z.string().optional(),
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
  senderUserId: z.string().optional(),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  senderEmail: z.string().optional(),
  category: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
  priority: InquiryPrioritySchema.default('NORMAL'),
  status: InquiryStatusSchema.default('PENDING'),
  merchantReply: z.string().optional(),
  merchantRepliedAt: z.string().optional(),
  merchantRepliedBy: z.string().optional(),
  adminReply: z.string().optional(),
  adminRepliedAt: z.string().optional(),
  adminResolutionNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AdminInquiry = z.infer<typeof AdminInquirySchema>;

export const UserNotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).default('INFO'),
  isRead: z.boolean().default(false),
  createdAt: z.string()
});
export type UserNotification = z.infer<typeof UserNotificationSchema>;

