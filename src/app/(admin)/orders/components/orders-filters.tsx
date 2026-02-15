import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  COLLECTION_STATUSES,
  ORDER_FULFILLMENT_STATUSES,
  SUPPLIER_PAYMENT_STATUSES,
} from "@/lib/constants";

type OrdersFiltersProps = {
  initialValues: {
    fulfillmentStatus?: string;
    supplierPaymentStatus?: string;
    collectionStatus?: string;
    deliveryYear?: string;
    deliveryMonth?: string;
    deliveryDay?: string;
  };
  availableYears: number[];
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

export function OrdersFilters({ initialValues, availableYears }: OrdersFiltersProps) {
  const t = useTranslations("ordersFilters");
  const tStatuses = useTranslations("statuses");

  return (
    <form method="get" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <label className="space-y-1">
          <span className="text-sm text-foreground-secondary">{t("orderStatus")}</span>
          <select
            name="fulfillmentStatus"
            defaultValue={initialValues.fulfillmentStatus || ""}
            className="h-10 w-full rounded-lg border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(34,197,94,0.09),rgba(23,23,23,0.95))] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t("all")}</option>
            {ORDER_FULFILLMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tStatuses(`fulfillment.${status}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-foreground-secondary">{t("capitalCycleStatus")}</span>
          <select
            name="supplierPaymentStatus"
            defaultValue={initialValues.supplierPaymentStatus || ""}
            className="h-10 w-full rounded-lg border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(34,197,94,0.09),rgba(23,23,23,0.95))] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t("all")}</option>
            {SUPPLIER_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tStatuses(`supplierPayment.${status}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-foreground-secondary">{t("collectionStatus")}</span>
          <select
            name="collectionStatus"
            defaultValue={initialValues.collectionStatus || ""}
            className="h-10 w-full rounded-lg border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(34,197,94,0.09),rgba(23,23,23,0.95))] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t("all")}</option>
            {COLLECTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tStatuses(`collection.${status}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-foreground-secondary">{t("deliveryYear")}</span>
          <select
            name="deliveryYear"
            defaultValue={initialValues.deliveryYear || ""}
            className="h-10 w-full rounded-lg border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(34,197,94,0.09),rgba(23,23,23,0.95))] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t("allYears")}</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-foreground-secondary">{t("deliveryMonth")}</span>
          <select
            name="deliveryMonth"
            defaultValue={initialValues.deliveryMonth || ""}
            className="h-10 w-full rounded-lg border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(34,197,94,0.09),rgba(23,23,23,0.95))] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t("allMonths")}</option>
            {MONTH_OPTIONS.map((month) => (
              <option key={month} value={month}>
                {t("monthLabel", { value: month })}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-foreground-secondary">{t("deliveryDay")}</span>
          <select
            name="deliveryDay"
            defaultValue={initialValues.deliveryDay || ""}
            className="h-10 w-full rounded-lg border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(34,197,94,0.09),rgba(23,23,23,0.95))] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t("allDays")}</option>
            {DAY_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {t("dayLabel", { value: day })}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg bg-[linear-gradient(90deg,#22c55e,#16a34a)] px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t("apply")}
        </button>
        <Link
          href="/orders"
          className="inline-flex h-9 items-center rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/15"
        >
          {t("clear")}
        </Link>
      </div>
    </form>
  );
}
