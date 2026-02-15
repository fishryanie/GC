import { getTranslations } from "next-intl/server";
import { FlashAlert } from "@/app/components/flash-alert";
import { OrderBuilder } from "@/app/(admin)/orders/new/components/order-builder";
import { createOrderAction } from "@/app/(admin)/orders/actions";
import { requireAuthSession } from "@/lib/auth";
import { getActiveCostProfile, listCustomers, listPriceProfiles, listProducts } from "@/lib/data";
import { getFlashMessage } from "@/lib/flash";
import { resolveSearchParams } from "@/lib/search-params";
import { getSearchValue } from "@/lib/search-value";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const flash = getFlashMessage(params);
  const t = await getTranslations("ordersNewPage");
  const selectedCustomerId = getSearchValue(params.customerId).trim();
  const session = await requireAuthSession();
  const canViewCost = session.seller.role === "ADMIN";

  const [products, saleProfiles, customers, activeCostProfile] = await Promise.all([
    listProducts({ activeOnly: true }),
    listPriceProfiles({
      type: "SALE",
      activeOnly: true,
      sellerId: session.seller.role === "ADMIN" ? undefined : session.seller.id,
    }),
    listCustomers({ activeOnly: true }),
    getActiveCostProfile(),
  ]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-background-secondary p-5">
        <p className="m-0 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background-tertiary text-[13px]"
            aria-hidden
          >
            🛒
          </span>
          {t("tag")}
        </p>
        <h2 className="mb-1 mt-2 text-3xl font-bold leading-tight text-foreground">
          {t("title")}
        </h2>
        <p className="m-0 text-foreground-secondary">
          {t("subtitle")}
        </p>
      </section>

      {flash ? <FlashAlert type={flash.type} message={flash.message} /> : null}

      <OrderBuilder
        products={products}
        customers={customers}
        saleProfiles={saleProfiles}
        activeCostProfile={canViewCost ? activeCostProfile : null}
        hasActiveCostProfile={Boolean(activeCostProfile)}
        canViewCost={canViewCost}
        initialCustomerId={selectedCustomerId}
        action={createOrderAction}
      />
    </div>
  );
}
