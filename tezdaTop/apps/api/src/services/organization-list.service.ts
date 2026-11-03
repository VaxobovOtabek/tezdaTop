/** Keep the unpaged response compatible with existing merchant/map consumers. */
export function organizationListOptions(query: Record<string, unknown>) {
  const paged = query.page !== undefined || query.limit !== undefined;
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? 20);
  const status = String(query.status || 'ALL');
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !['ALL','ACTIVE','SUSPENDED','DELETED'].includes(status)) {
    throw Object.assign(new Error('Sahifa yoki filtr qiymati noto‘g‘ri.'), { status: 400 });
  }
  const text = (key: string) => String(query[key] || '').trim().slice(0, 160);
  return { paged, page, limit, status, q: text('q'), region: text('region'), city: text('city') };
}

export type OrganizationListOptions = ReturnType<typeof organizationListOptions>;

export function paginateOrganizations(organizations: any[], stores: any[], users: any[], options: OrganizationListOptions) {
  const storesByOrg = new Map<string, any[]>();
  for (const store of stores) {
    const list = storesByOrg.get(store.organizationId) || [];
    list.push(store); storesByOrg.set(store.organizationId, list);
  }
  const userCounts = new Map<string, number>();
  for (const user of users) if (user.organizationId && user.status !== 'DELETED') userCounts.set(user.organizationId, (userCounts.get(user.organizationId) || 0) + 1);
  let items = organizations.map(org => ({ ...org, stores: storesByOrg.get(org.id) || [], userCount: userCounts.get(org.id) || 0 }));
  if (!options.paged) return { organizations: items };
  const contains = (value: unknown, q: string) => String(value || '').toLowerCase().includes(q.toLowerCase());
  const inRegion = (value: unknown) => value === options.region || (options.region === 'Toshkent shahri' && (!value || contains(value, 'Toshkent')));
  items = items.filter(org =>
    (options.status === 'ALL' ? org.status !== 'DELETED' : org.status === options.status) &&
    (!options.q || [org.name, org.inn, org.type, org.region, org.city].some(value => contains(value, options.q))) &&
    (!options.region || inRegion(org.region) || org.stores.some((store: any) => inRegion(store.region))) &&
    (!options.city || contains(org.city, options.city) || org.stores.some((store: any) => store.city === options.city || contains(store.address, options.city)))
  ).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id));
  const total = items.length, totalPages = Math.max(1, Math.ceil(total / options.limit));
  const page = Math.min(options.page, totalPages);
  return { organizations: items.slice((page - 1) * options.limit, page * options.limit), total, page, limit: options.limit, totalPages };
}
