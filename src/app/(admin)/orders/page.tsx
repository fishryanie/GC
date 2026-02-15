import {
  CheckCircle,
  Clock,
  Receipt,
  Search,
  TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { OrderStatusInlineForm } from "@/app/(admin)/orders/components/order-status-inline-form";
import { OrdersFilters } from "@/app/(admin)/orders/components/orders-filters";
import { reviewOrderApprovalAction } from "@/app/(admin)/orders/actions";
import { requireAuthSession } from "@/lib/auth";
import { getOrdersPageData } from "@/lib/data";
import {
  COLLECTION_STATUSES,
  ORDER_FULFILLMENT_STATUSES,
  SUPPLIER_PAYMENT_STATUSES,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime, formatKg } from "@/lib/format";
import { getFlashMessage } from "@/lib/flash";
import { resolveSearchParams } from "@/lib/search-params";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const flash = getFlashMessage(params);
  const tPage = await getTranslations("ordersPage");
  const session = await requireAuthSession();
  const isAdmin = session.seller.role === "ADMIN";
  const canViewCost = isAdmin;

  const fulfillmentStatusFilterRaw = getSearchValue(params.fulfillmentStatus);
  const supplierPaymentStatusFilterRaw = getSearchValue(params.supplierPaymentStatus);
  const collectionStatusFilterRaw = getSearchValue(params.collectionStatus);
  const deliveryYearFilterRaw = getSearchValue(params.deliveryYear);
  const deliveryMonthFilterRaw = getSearchValue(params.deliveryMonth);
  const deliveryDayFilterRaw = getSearchValue(params.deliveryDay);
  const searchQuery = getSearchValue(params.q).trim();

  const fulfillmentStatusFilter = ORDER_FULFILLMENT_STATUSES.includes(
    fulfillmentStatusFilterRaw as (typeof ORDER_FULFILLMENT_STATUSES)[number],
  )
    ? (fulfillmentStatusFilterRaw as (typeof ORDER_FULFILLMENT_STATUSES)[number])
    : "";

  const supplierPaymentStatusFilter = SUPPLIER_PAYMENT_STATUSES.includes(
    supplierPaymentStatusFilterRaw as (typeof SUPPLIER_PAYMENT_STATUSES)[number],
  )
    ? (supplierPaymentStatusFilterRaw as (typeof SUPPLIER_PAYMENT_STATUSES)[number])
    : "";

  const collectionStatusFilter = COLLECTION_STATUSES.includes(
    collectionStatusFilterRaw as (typeof COLLECTION_STATUSES)[number],
  )
    ? (collectionStatusFilterRaw as (typeof COLLECTION_STATUSES)[number])
    : "";

  const deliveryYearFilter = Number.parseInt(deliveryYearFilterRaw, 10);
  const deliveryMonthFilter = Number.parseInt(deliveryMonthFilterRaw, 10);
  const deliveryDayFilter = Number.parseInt(deliveryDayFilterRaw, 10);

  const normalizedYearFilter = Number.isFinite(deliveryYearFilter) ? deliveryYearFilter : undefined;
  const normalizedMonthFilter =
    Number.isFinite(deliveryMonthFilter) && deliveryMonthFilter >= 1 && deliveryMonthFilter <= 12
      ? deliveryMonthFilter
      : undefined;
  const normalizedDayFilter =
    Number.isFinite(deliveryDayFilter) && deliveryDayFilter >= 1 && deliveryDayFilter <= 31
      ? deliveryDayFilter
      : undefined;

  const {
    orders,
    totalSaleAmount,
    totalProfitAmount,
    filteredCount,
    totalCount,
    availableYears,
  } = await getOrdersPageData({
    fulfillmentStatus: fulfillmentStatusFilter || undefined,
    supplierPaymentStatus: supplierPaymentStatusFilter || undefined,
    collectionStatus: collectionStatusFilter || undefined,
    deliveryYear: normalizedYearFilter,
    deliveryMonth: normalizedMonthFilter,
    deliveryDay: normalizedDayFilter,
    search: searchQuery || undefined,
  });

  const activeFilterParams = new URLSearchParams();
  if (fulfillmentStatusFilter) {
    activeFilterParams.set("fulfillmentStatus", fulfillmentStatusFilter);
  }
  if (supplierPaymentStatusFilter) {
    activeFilterParams.set("supplierPaymentStatus", supplierPaymentStatusFilter);
  }
  if (collectionStatusFilter) {
    activeFilterParams.set("collectionStatus", collectionStatusFilter);
  }
  if (normalizedYearFilter) {
    activeFilterParams.set("deliveryYear", String(normalizedYearFilter));
  }
  if (normalizedMonthFilter) {
    activeFilterParams.set("deliveryMonth", String(normalizedMonthFilter));
  }
  if (normalizedDayFilter) {
    activeFilterParams.set("deliveryDay", String(normalizedDayFilter));
  }
  if (searchQuery) {
    activeFilterParams.set("q", searchQuery);
  }

  const returnTo = activeFilterParams.toString()
    ? `/orders?${activeFilterParams.toString()}`
    : "/orders";

  const paidOrdersCount = orders.filter((order) => order.collectionStatus === "PAID_IN_FULL")
    .length;
  const pendingOrdersCount = orders.filter(
    (order) => order.collectionStatus === "UNPAID",
  ).length;
  const pendingApprovalOrders = isAdmin
    ? orders.filter(
        (order) =>
          order.fulfillmentStatus === "PENDING_APPROVAL" &&
          order.approval.status === "PENDING",
      )
    : [];
  const pendingDiscountOrders = pendingApprovalOrders.filter(
    (order) => order.discountRequest.status === "PENDING" && order.discountRequest.requestedPercent > 0,
  );
  const pendingStandardOrders = pendingApprovalOrders.filter(
    (order) => !(order.discountRequest.status === "PENDING" && order.discountRequest.requestedPercent > 0),
  );

  return (
    <div className="flex h-full flex-col">
      <section className="mb-6 rounded-2xl border border-emerald-500/25 bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(16,185,129,0.06)_40%,rgba(10,10,10,1)_100%)] p-5">
        <p className="m-0 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/20 text-[13px]">
            🧾
          </span>
          {tPage("heroTag")}
        </p>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-foreground">{tPage("heroTitle")}</h1>
        <p className="m-0 text-sm text-foreground-secondary">
          {tPage("heroSubtitle")}
        </p>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/12 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-emerald-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
              <Receipt className="h-4 w-4 text-emerald-300" />
            </span>
            {tPage("cards.totalInvoices")}
          </div>
          <div className="text-2xl font-bold text-foreground">{filteredCount}</div>
          <div className="mt-1 text-xs text-foreground-muted">{tPage("cards.systemTotal", { count: totalCount })}</div>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-amber-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20">
              <Clock className="h-4 w-4 text-amber-300" />
            </span>
            {tPage("cards.awaitingCollection")}
          </div>
          <div className="text-2xl font-bold text-amber-200">{pendingOrdersCount}</div>
        </div>

        <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-sky-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20">
              <CheckCircle className="h-4 w-4 text-sky-300" />
            </span>
            {tPage("cards.fullyCollected")}
          </div>
          <div className="text-2xl font-bold text-sky-200">{paidOrdersCount}</div>
        </div>

        <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-violet-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20">
              <TrendingUp className="h-4 w-4 text-violet-300" />
            </span>
            {tPage("cards.revenue")}
          </div>
          <div className="text-2xl font-bold text-violet-200">{formatCurrency(totalSaleAmount)}</div>
          {canViewCost ? (
            <div className="mt-1 text-xs text-emerald-200">{tPage("cards.profit", { amount: formatCurrency(totalProfitAmount) })}</div>
          ) : null}
        </div>
      </div>

      {flash ? (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
            flash.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/40 bg-red-500/10 text-red-200"
          }`}
        >
          {flash.message}
        </div>
      ) : null}

      {isAdmin && pendingApprovalOrders.length > 0 ? (
        <section className="mb-6 rounded-2xl border border-amber-500/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(10,10,10,1)_80%)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-lg font-semibold text-foreground">{tPage("approvals.title")}</h3>
              <p className="m-0 mt-1 text-sm text-foreground-secondary">
                {tPage("approvals.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-1 text-amber-200">
                {tPage("approvals.pendingTotal", { count: pendingApprovalOrders.length })}
              </span>
              <span className="rounded-full border border-rose-500/35 bg-rose-500/15 px-2 py-1 text-rose-200">
                {tPage("approvals.pendingDiscount", { count: pendingDiscountOrders.length })}
              </span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {pendingApprovalOrders.map((order) => {
              const hasDiscountRequest =
                order.discountRequest.status === "PENDING" && order.discountRequest.requestedPercent > 0;
              const productNames = order.items.map((item) => item.productName).join(", ");
              const discountAmount = Math.max(order.baseSaleAmount - order.discountRequest.requestedSaleAmount, 0);
              const expectedProfit = order.discountRequest.requestedSaleAmount - order.totalCostAmount;

              return (
                <article
                  key={`approval-${order.id}`}
                  className={`rounded-xl border bg-background-secondary/90 p-4 ${
                    hasDiscountRequest ? "border-rose-500/35" : "border-amber-500/25"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="m-0 inline-flex rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 font-mono text-xs text-amber-200">
                        {order.code}
                      </p>
                      <p className="m-0 mt-1 text-sm text-foreground">
                        {order.customerName || order.buyerName}
                      </p>
                      <p className="m-0 mt-1 text-xs text-foreground-muted">
                        {tPage("table.seller", { name: order.sellerName })} • {formatDate(order.deliveryDate)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${
                        hasDiscountRequest
                          ? "border-rose-500/35 bg-rose-500/15 text-rose-200"
                          : "border-sky-500/35 bg-sky-500/15 text-sky-200"
                      }`}
                    >
                      {hasDiscountRequest ? tPage("approvals.discountRequested") : tPage("approvals.standard")}
                    </span>
                  </div>

                  <p className="line-clamp-1 m-0 text-xs text-foreground-secondary" title={productNames}>
                    {productNames}
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-background-tertiary px-2.5 py-2">
                      <p className="m-0 text-[11px] text-foreground-muted">{tPage("approvals.baseSale")}</p>
                      <p className="m-0 mt-1 text-sm font-semibold text-foreground">
                        {formatCurrency(order.baseSaleAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-rose-500/35 bg-rose-500/15 px-2.5 py-2">
                      <p className="m-0 text-[11px] text-rose-200">{tPage("approvals.requestedSale")}</p>
                      <p className="m-0 mt-1 text-sm font-semibold text-rose-100">
                        {formatCurrency(order.discountRequest.requestedSaleAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-500/35 bg-amber-500/15 px-2.5 py-2">
                      <p className="m-0 text-[11px] text-amber-200">{tPage("approvals.discount")}</p>
                      <p className="m-0 mt-1 text-sm font-semibold text-amber-100">
                        {order.discountRequest.requestedPercent.toFixed(1)}% ({formatCurrency(discountAmount)})
                      </p>
                    </div>
                  </div>

                  {canViewCost ? (
                    <div className="mt-2 text-xs text-foreground-secondary">
                      {tPage("approvals.costCompare", {
                        cost: formatCurrency(order.totalCostAmount),
                        profit: formatCurrency(expectedProfit),
                      })}
                    </div>
                  ) : null}

                  <form action={reviewOrderApprovalAction} className="mt-3 space-y-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />

                    <input
                      type="text"
                      name="note"
                      placeholder={tPage("approvals.notePlaceholder")}
                      className="h-9 w-full rounded-lg border border-border bg-background-tertiary px-3 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    {hasDiscountRequest ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          type="submit"
                          name="decision"
                          value="APPROVE_WITH_DISCOUNT"
                          className="h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                          {tPage("approvals.approveDiscount")}
                        </button>
                        <button
                          type="submit"
                          name="decision"
                          value="APPROVE_WITHOUT_DISCOUNT"
                          className="h-9 rounded-lg border border-sky-500/35 bg-sky-500/15 px-3 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/20"
                        >
                          {tPage("approvals.approveWithoutDiscount")}
                        </button>
                        <button
                          type="submit"
                          name="decision"
                          value="REJECT_ORDER"
                          className="h-9 rounded-lg border border-red-500/35 bg-red-500/15 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                        >
                          {tPage("approvals.rejectOrder")}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="submit"
                          name="decision"
                          value="APPROVE_ORDER"
                          className="h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                          {tPage("approvals.approveOrder")}
                        </button>
                        <button
                          type="submit"
                          name="decision"
                          value="REJECT_ORDER"
                          className="h-9 rounded-lg border border-red-500/35 bg-red-500/15 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                        >
                          {tPage("approvals.rejectOrder")}
                        </button>
                      </div>
                    )}
                  </form>
                </article>
              );
            })}
          </div>

          {pendingStandardOrders.length > 0 ? (
            <div className="mt-3 text-xs text-foreground-muted">
              {tPage("approvals.standardHint", { count: pendingStandardOrders.length })}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mb-6 rounded-2xl border border-border bg-background-secondary/80 p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
          <OrdersFilters
            availableYears={availableYears}
            initialValues={{
              fulfillmentStatus: fulfillmentStatusFilter || undefined,
              supplierPaymentStatus: supplierPaymentStatusFilter || undefined,
              collectionStatus: collectionStatusFilter || undefined,
              deliveryYear: normalizedYearFilter ? String(normalizedYearFilter) : undefined,
              deliveryMonth: normalizedMonthFilter ? String(normalizedMonthFilter) : undefined,
              deliveryDay: normalizedDayFilter ? String(normalizedDayFilter) : undefined,
            }}
          />

          <form method="get" className="relative h-fit">
            {fulfillmentStatusFilter ? (
              <input type="hidden" name="fulfillmentStatus" value={fulfillmentStatusFilter} />
            ) : null}
            {supplierPaymentStatusFilter ? (
              <input type="hidden" name="supplierPaymentStatus" value={supplierPaymentStatusFilter} />
            ) : null}
            {collectionStatusFilter ? (
              <input type="hidden" name="collectionStatus" value={collectionStatusFilter} />
            ) : null}
            {normalizedYearFilter ? (
              <input type="hidden" name="deliveryYear" value={normalizedYearFilter} />
            ) : null}
            {normalizedMonthFilter ? (
              <input type="hidden" name="deliveryMonth" value={normalizedMonthFilter} />
            ) : null}
            {normalizedDayFilter ? (
              <input type="hidden" name="deliveryDay" value={normalizedDayFilter} />
            ) : null}

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200/80" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder={tPage("searchPlaceholder")}
              className="h-10 w-full rounded-xl border border-emerald-500/25 bg-[linear-gradient(135deg,rgba(34,197,94,0.1),rgba(23,23,23,0.95)_45%)] pl-10 pr-4 text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </form>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {totalCount === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-foreground-secondary">
            <Receipt className="mb-4 h-12 w-12 opacity-50" />
            <p>{tPage("emptyOrders")}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-foreground-secondary">
            <Search className="mb-4 h-12 w-12 opacity-50" />
            <p>{tPage("emptyFiltered")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-background-secondary shadow-[0_24px_40px_rgba(0,0,0,0.24)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px]">
                <thead>
                  <tr className="border-b border-emerald-500/20 bg-[linear-gradient(90deg,rgba(34,197,94,0.18),rgba(23,23,23,1)_70%)]">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tPage("table.invoiceCode")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tPage("table.buyer")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tPage("table.products")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tPage("table.profiles")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tPage("table.totals")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tPage("table.deliveryDate")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      {tPage("table.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const productNames = order.items.map((item) => item.productName).join(", ");

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-border/40 transition-colors hover:bg-background-hover ${
                          order.fulfillmentStatus === "PENDING_APPROVAL"
                            ? "bg-amber-500/5"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1">
                            <div className="inline-flex rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-200">
                              {order.code}
                            </div>
                            <div className="text-xs text-foreground-muted">
                              {tPage("table.created", { datetime: formatDateTime(order.createdAt) })}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="text-foreground">{order.customerName || order.buyerName}</div>
                          {order.sellerName ? (
                            <div className="mt-1 text-xs text-foreground-muted">
                              {tPage("table.seller", { name: order.sellerName })}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div
                            className="line-clamp-2 max-w-[280px] text-sm leading-[1.4] text-foreground"
                            title={productNames}
                          >
                            {productNames}
                          </div>
                          <div className="mt-1 text-xs text-foreground-secondary">
                            {formatKg(order.totalWeightKg)}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1 text-xs">
                            <div className="text-foreground-secondary">
                              {tPage("table.saleProfile", { name: order.saleProfile.profileName })}
                            </div>
                            {canViewCost ? (
                              <div className="text-foreground-secondary">
                                {tPage("table.costProfile", { name: order.costProfile.profileName })}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1 text-xs">
                            <div className="text-foreground-secondary">
                              {tPage("table.bill", { amount: formatCurrency(order.totalSaleAmount) })}
                            </div>
                            {order.discountRequest.status === "PENDING" ? (
                              <div className="text-rose-300">
                                {tPage("table.discountPending", {
                                  percent: order.discountRequest.requestedPercent.toFixed(1),
                                  requested: formatCurrency(order.discountRequest.requestedSaleAmount),
                                })}
                              </div>
                            ) : null}
                            {canViewCost ? (
                              <>
                                <div className="text-foreground-secondary">
                                  {tPage("table.baseSale", { amount: formatCurrency(order.baseSaleAmount) })}
                                </div>
                                <div className="text-foreground-secondary">
                                  {tPage("table.cost", { amount: formatCurrency(order.totalCostAmount) })}
                                </div>
                                <div className="font-semibold text-emerald-300">
                                  {tPage("table.profit", { amount: formatCurrency(order.totalProfitAmount) })}
                                </div>
                              </>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top text-sm text-foreground-secondary">
                          {formatDate(order.deliveryDate)}
                        </td>

                        <td className="px-4 py-3 align-top">
                          {order.fulfillmentStatus === "PENDING_APPROVAL" ? (
                            <div className="mb-2 inline-flex rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
                              {tPage("approvals.needsReview")}
                            </div>
                          ) : null}
                          <OrderStatusInlineForm
                            orderId={order.id}
                            returnTo={returnTo}
                            fulfillmentStatus={order.fulfillmentStatus}
                            supplierPaymentStatus={order.supplierPaymentStatus}
                            collectionStatus={order.collectionStatus}
                            readOnly={!isAdmin || order.fulfillmentStatus === "PENDING_APPROVAL"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
