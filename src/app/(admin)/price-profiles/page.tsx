import { requireAuthSession } from 'lib/auth';
import { getPriceProfileStats, listPriceProfiles, listProducts, listSellers } from 'lib/data';
import { resolveSearchParams } from 'lib/search-params';
import { getSearchValue } from 'lib/search-value';
import { Types } from 'mongoose';
import { PriceProfilesBoard } from './components/price-profiles-board';

type PriceProfileFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type PriceProfileOwnerFilter = 'ALL' | 'SYSTEM' | string;

function normalizeFilter(value: string): PriceProfileFilter {
  const upper = value.toUpperCase();
  if (upper === 'ACTIVE' || upper === 'INACTIVE') {
    return upper;
  }

  return 'ALL';
}

function normalizeOwnerFilter(value: string): PriceProfileOwnerFilter {
  if (!value) {
    return 'ALL';
  }

  const upper = value.toUpperCase();
  if (upper === 'SYSTEM') {
    return 'SYSTEM';
  }

  if (Types.ObjectId.isValid(value)) {
    return value;
  }

  return 'ALL';
}

export default async function PriceProfilesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const session = await requireAuthSession();
  const isAdmin = session.seller.role === 'ADMIN';
  const statusFilter = normalizeFilter(getSearchValue(params.status));
  const searchQuery = getSearchValue(params.q).trim();
  const ownerFilter = isAdmin ? normalizeOwnerFilter(getSearchValue(params.owner)) : 'ALL';

  const [products, costProfiles, saleProfiles, profileStats, sellers] = await Promise.all([
    listProducts(),
    isAdmin
      ? listPriceProfiles({
          type: 'COST',
          status: statusFilter,
          search: searchQuery || undefined,
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof listPriceProfiles>>),
    listPriceProfiles({
      type: 'SALE',
      sellerId: isAdmin ? undefined : session.seller.id,
      createdBy: isAdmin && ownerFilter !== 'ALL' ? ownerFilter : undefined,
      status: statusFilter,
      search: searchQuery || undefined,
    }),
    getPriceProfileStats({
      type: isAdmin ? undefined : 'SALE',
      sellerId: isAdmin ? undefined : session.seller.id,
    }),
    isAdmin ? listSellers({ role: 'SELLER' }) : Promise.resolve([]),
  ]);
  const exportParams = new URLSearchParams();
  if (searchQuery) {
    exportParams.set('q', searchQuery);
  }
  if (statusFilter !== 'ALL') {
    exportParams.set('status', statusFilter);
  }
  if (isAdmin && ownerFilter !== 'ALL') {
    exportParams.set('owner', ownerFilter);
  }
  const exportHref = exportParams.toString() ? `/price-profiles/export?${exportParams.toString()}` : '/price-profiles/export';

  return (
    <div className='flex flex-col gap-4'>
      <PriceProfilesBoard
        key={[statusFilter, ownerFilter, searchQuery || '-'].join('|')}
        products={products}
        costProfiles={costProfiles}
        saleProfiles={saleProfiles}
        profileStats={profileStats}
        isAdmin={isAdmin}
        ownerFilter={ownerFilter}
        ownerOptions={sellers.map(seller => ({ value: seller.id, label: seller.name }))}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        exportHref={exportHref}
      />
    </div>
  );
}
