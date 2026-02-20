import { requireAuthSession } from 'lib/auth';
import { getCustomerOrderLinksPageData, listPriceProfiles, listSellers } from 'lib/data';
import { resolveSearchParams } from 'lib/search-params';
import { getSearchValue } from 'lib/search-value';
import { Types } from 'mongoose';
import { OrderLinksBoard } from './components/order-links-board';
import type { OrderLinkStatusFilter } from './typing';

function normalizeStatus(value: string): OrderLinkStatusFilter {
  const upper = value.toUpperCase();
  if (upper === 'ACTIVE' || upper === 'EXPIRED' || upper === 'INACTIVE') {
    return upper;
  }

  return 'ALL';
}

function normalizeSellerFilter(value: string) {
  if (!value) {
    return '';
  }

  if (!Types.ObjectId.isValid(value)) {
    return '';
  }

  return value;
}

export default async function OrderLinksPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const session = await requireAuthSession();
  const isAdmin = session.seller.role === 'ADMIN';

  const statusFilter = normalizeStatus(getSearchValue(params.status));
  const searchQuery = getSearchValue(params.q).trim();
  const sellerFilter = isAdmin ? normalizeSellerFilter(getSearchValue(params.sellerId)) : session.seller.id;

  const [linksData, saleProfiles, sellers] = await Promise.all([
    getCustomerOrderLinksPageData({
      sellerId: sellerFilter || undefined,
      status: statusFilter,
      search: searchQuery || undefined,
    }),
    listPriceProfiles({
      type: 'SALE',
      activeOnly: true,
      sellerId: isAdmin ? undefined : session.seller.id,
    }),
    isAdmin ? listSellers({ role: 'SELLER', status: 'ENABLED' }) : Promise.resolve([]),
  ]);

  return (
    <OrderLinksBoard
      linksData={linksData}
      saleProfiles={saleProfiles}
      sellers={sellers}
      isAdmin={isAdmin}
      currentSellerId={session.seller.id}
      statusFilter={statusFilter}
      searchQuery={searchQuery}
      sellerFilter={sellerFilter}
    />
  );
}
