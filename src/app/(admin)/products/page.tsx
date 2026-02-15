import { FlashAlert } from "@/app/components/flash-alert";
import { ProductsGrid } from "@/app/(admin)/products/components/products-grid";
import {
  deleteProductAction,
  toggleProductStatusAction,
  upsertProductAction,
} from "@/app/(admin)/products/actions";
import { requireAuthSession } from "@/lib/auth";
import { getDefaultSalePrices, getProductStats, listProducts } from "@/lib/data";
import { getFlashMessage } from "@/lib/flash";
import { resolveSearchParams } from "@/lib/search-params";

type ProductFilter = "ALL" | "ACTIVE" | "INACTIVE";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeFilter(value: string): ProductFilter {
  const uppercase = value.toUpperCase();

  if (uppercase === "ACTIVE" || uppercase === "INACTIVE") {
    return uppercase;
  }

  return "ALL";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const flash = getFlashMessage(params);
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

  return (
    <div className="flex flex-col gap-4">
      {flash ? <FlashAlert type={flash.type} message={flash.message} /> : null}

      <ProductsGrid
        products={products}
        productStats={productStats}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        defaultSalePrices={defaultSalePrices}
        upsertAction={upsertProductAction}
        toggleStatusAction={toggleProductStatusAction}
        deleteAction={deleteProductAction}
      />
    </div>
  );
}
