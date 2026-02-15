import { FlashAlert } from "@/app/components/flash-alert";
import { CustomersSellersBoard } from "@/app/(admin)/customers/components/customers-sellers-board";
import {
  resetSellerPasswordAction,
  toggleCustomerStatusAction,
  toggleSellerStatusAction,
  upsertCustomerAction,
  upsertSellerAction,
} from "@/app/(admin)/customers/actions";
import { requireAuthSession } from "@/lib/auth";
import { getCustomersPageData, getSellersPageData } from "@/lib/data";
import { getFlashMessage } from "@/lib/flash";
import { resolveSearchParams } from "@/lib/search-params";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeTab(value: string): "customers" | "sellers" {
  return value === "sellers" ? "sellers" : "customers";
}

function normalizeCustomerStatus(value: string): "ALL" | "ACTIVE" | "INACTIVE" {
  if (value === "ACTIVE" || value === "INACTIVE") {
    return value;
  }

  return "ALL";
}

function normalizeSellerRole(value: string): "ALL" | "ADMIN" | "SELLER" {
  if (value === "ADMIN" || value === "SELLER") {
    return value;
  }

  return "ALL";
}

function normalizeSellerStatus(value: string): "ALL" | "ENABLED" | "DISABLED" {
  if (value === "ENABLED" || value === "DISABLED") {
    return value;
  }

  return "ALL";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const session = await requireAuthSession();
  const flash = getFlashMessage(params);

  const activeTab = normalizeTab(getSearchValue(params.tab));
  const searchQuery = getSearchValue(params.q).trim();
  const customerStatus = normalizeCustomerStatus(getSearchValue(params.customerStatus).toUpperCase());
  const sellerRoleFilter = normalizeSellerRole(getSearchValue(params.sellerRole).toUpperCase());
  const sellerStatus = normalizeSellerStatus(getSearchValue(params.sellerStatus).toUpperCase());

  const [customersData, sellersData] = await Promise.all([
    getCustomersPageData({
      search: searchQuery || undefined,
      status: customerStatus,
    }),
    getSellersPageData({
      search: searchQuery || undefined,
      role: sellerRoleFilter === "ALL" ? undefined : sellerRoleFilter,
      status: sellerStatus,
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      {flash ? <FlashAlert type={flash.type} message={flash.message} /> : null}

      <CustomersSellersBoard
        activeTab={activeTab}
        searchQuery={searchQuery}
        customerStatus={customerStatus}
        sellerRoleFilter={sellerRoleFilter}
        sellerStatus={sellerStatus}
        customersData={customersData}
        sellersData={sellersData}
        isAdmin={session.seller.role === "ADMIN"}
        currentSellerId={session.seller.id}
        upsertCustomerAction={upsertCustomerAction}
        toggleCustomerStatusAction={toggleCustomerStatusAction}
        upsertSellerAction={upsertSellerAction}
        toggleSellerStatusAction={toggleSellerStatusAction}
        resetSellerPasswordAction={resetSellerPasswordAction}
      />
    </div>
  );
}
