import { FlashAlert } from "@/app/components/flash-alert";
import { PriceProfilesBoard } from "./components/price-profiles-board";
import {
  clonePriceProfileAction,
  createPriceProfileAction,
  togglePriceProfileStatusAction,
} from "@/app/(admin)/price-profiles/actions";
import { requireAuthSession } from "@/lib/auth";
import { getPriceProfileStats, listPriceProfiles, listProducts } from "@/lib/data";
import { getFlashMessage } from "@/lib/flash";
import { resolveSearchParams } from "@/lib/search-params";
import { getSearchValue } from "@/lib/search-value";

type PriceProfileFilter = "ALL" | "ACTIVE" | "INACTIVE";

function normalizeFilter(value: string): PriceProfileFilter {
  const upper = value.toUpperCase();
  if (upper === "ACTIVE" || upper === "INACTIVE") {
    return upper;
  }

  return "ALL";
}

export default async function PriceProfilesPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const flash = getFlashMessage(params);
  const session = await requireAuthSession();
  const isAdmin = session.seller.role === "ADMIN";
  const statusFilter = normalizeFilter(getSearchValue(params.status));
  const searchQuery = getSearchValue(params.q).trim();

  const [products, costProfiles, saleProfiles, profileStats] = await Promise.all([
    listProducts(),
    isAdmin
      ? listPriceProfiles({
          type: "COST",
          status: statusFilter,
          search: searchQuery || undefined,
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof listPriceProfiles>>),
    listPriceProfiles({
      type: "SALE",
      sellerId: isAdmin ? undefined : session.seller.id,
      status: statusFilter,
      search: searchQuery || undefined,
    }),
    getPriceProfileStats({
      type: isAdmin ? undefined : "SALE",
      sellerId: isAdmin ? undefined : session.seller.id,
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      {flash ? <FlashAlert type={flash.type} message={flash.message} /> : null}

      <PriceProfilesBoard
        products={products}
        costProfiles={costProfiles}
        saleProfiles={saleProfiles}
        profileStats={profileStats}
        isAdmin={isAdmin}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        createAction={createPriceProfileAction}
        toggleAction={togglePriceProfileStatusAction}
        cloneAction={clonePriceProfileAction}
      />
    </div>
  );
}
