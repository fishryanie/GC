import { updateOrderStatusesAction } from "@/app/(admin)/orders/actions";
import { useTranslations } from "next-intl";
import {
  COLLECTION_STATUSES,
  ORDER_FULFILLMENT_STATUSES,
  SUPPLIER_PAYMENT_STATUSES,
} from "@/lib/constants";
import type {
  CollectionStatus,
  OrderFulfillmentStatus,
  SupplierPaymentStatus,
} from "@/lib/constants";

type OrderStatusInlineFormProps = {
  orderId: string;
  returnTo: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  supplierPaymentStatus: SupplierPaymentStatus;
  collectionStatus: CollectionStatus;
  readOnly?: boolean;
};

const FULFILLMENT_BADGE_CLASS: Record<OrderFulfillmentStatus, string> = {
  PENDING_APPROVAL: "border-amber-500/35 bg-amber-500/15 text-amber-300",
  CONFIRMED: "border-sky-500/35 bg-sky-500/15 text-sky-300",
  PICKED: "border-cyan-500/35 bg-cyan-500/15 text-cyan-300",
  DELIVERING: "border-indigo-500/35 bg-indigo-500/15 text-indigo-300",
  DELIVERED: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
  CANCELED: "border-red-500/35 bg-red-500/15 text-red-300",
};

const SUPPLIER_BADGE_CLASS: Record<SupplierPaymentStatus, string> = {
  UNPAID_SUPPLIER: "border-amber-500/35 bg-amber-500/15 text-amber-300",
  SUPPLIER_PAID: "border-blue-500/35 bg-blue-500/15 text-blue-300",
  CAPITAL_CYCLE_COMPLETED: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
};

const COLLECTION_BADGE_CLASS: Record<CollectionStatus, string> = {
  UNPAID: "border-zinc-500/35 bg-zinc-500/15 text-zinc-300",
  PARTIALLY_PAID: "border-amber-500/35 bg-amber-500/15 text-amber-300",
  PAID_IN_FULL: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
  REFUNDED: "border-red-500/35 bg-red-500/15 text-red-300",
};

export function OrderStatusInlineForm({
  orderId,
  returnTo,
  fulfillmentStatus,
  supplierPaymentStatus,
  collectionStatus,
  readOnly = false,
}: OrderStatusInlineFormProps) {
  const tStatuses = useTranslations("statuses");
  const tStatusForm = useTranslations("orderStatusForm");

  return (
    <form action={updateOrderStatusesAction} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="inline-flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${FULFILLMENT_BADGE_CLASS[fulfillmentStatus]}`}
        >
          {tStatuses(`fulfillment.${fulfillmentStatus}`)}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SUPPLIER_BADGE_CLASS[supplierPaymentStatus]}`}
        >
          {tStatuses(`supplierPayment.${supplierPaymentStatus}`)}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${COLLECTION_BADGE_CLASS[collectionStatus]}`}
        >
          {tStatuses(`collection.${collectionStatus}`)}
        </span>
      </div>

      {readOnly ? (
        <div className="text-xs text-foreground-muted">{tStatusForm("readOnlyHint")}</div>
      ) : (
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px]">
        <select
          name="fulfillmentStatus"
          defaultValue={fulfillmentStatus}
          className="h-8 rounded-md border border-border bg-background-tertiary px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {ORDER_FULFILLMENT_STATUSES.filter((status) => status !== "PENDING_APPROVAL").map((status) => (
            <option key={status} value={status}>
              {tStatuses(`fulfillment.${status}`)}
            </option>
          ))}
        </select>

        <select
          name="supplierPaymentStatus"
          defaultValue={supplierPaymentStatus}
          className="h-8 rounded-md border border-border bg-background-tertiary px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {SUPPLIER_PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tStatuses(`supplierPayment.${status}`)}
            </option>
          ))}
        </select>

        <select
          name="collectionStatus"
          defaultValue={collectionStatus}
          className="h-8 rounded-md border border-border bg-background-tertiary px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {COLLECTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tStatuses(`collection.${status}`)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="h-8 rounded-md bg-primary-500 px-2 text-xs font-medium text-white transition-colors hover:bg-primary-600"
        >
          {tStatusForm("save")}
        </button>
      </div>
      )}
    </form>
  );
}
