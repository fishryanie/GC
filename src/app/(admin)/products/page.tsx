import { requireAuthSession } from 'lib/auth';
import { getDefaultSalePrices, getProductStats, listProducts } from 'lib/data';
import { resolveSearchParams } from 'lib/search-params';
import { deleteProductAction, toggleProductStatusAction, upsertProductAction } from './actions';
import { ProductsGrid } from './components/products-grid';

type ProductFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function normalizeFilter(value: string): ProductFilter {
  const uppercase = value.toUpperCase();

  if (uppercase === 'ACTIVE' || uppercase === 'INACTIVE') {
    return uppercase;
  }

  return 'ALL';
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const searchQuery = getSearchValue(params.q).trim();
  const activeFilter = normalizeFilter(getSearchValue(params.status));
  const session = await requireAuthSession();

  const [products, productStats, defaultSalePrices] = await Promise.all([
    listProducts({
      search: searchQuery || undefined,
      status: activeFilter,
    }),
    getProductStats(),
    getDefaultSalePrices({ sellerId: session.seller.id }),
  ]);
  const exportParams = new URLSearchParams();
  if (searchQuery) {
    exportParams.set('q', searchQuery);
  }
  if (activeFilter !== 'ALL') {
    exportParams.set('status', activeFilter);
  }
  const exportHref = exportParams.toString() ? `/products/export?${exportParams.toString()}` : '/products/export';

  return (
    <div className='flex flex-col gap-4'>
      <ProductsGrid
        products={products}
        productStats={productStats}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        defaultSalePrices={defaultSalePrices}
        exportHref={exportHref}
        upsertAction={upsertProductAction}
        toggleStatusAction={toggleProductStatusAction}
        deleteAction={deleteProductAction}
      />
    </div>
  );
}
