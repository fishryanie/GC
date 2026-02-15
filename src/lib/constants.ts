export const PRICE_PROFILE_TYPES = ["COST", "SALE"] as const;

export type PriceProfileType = (typeof PRICE_PROFILE_TYPES)[number];

export const PRICE_PROFILE_TYPE_LABEL: Record<PriceProfileType, string> = {
  COST: "Cost Price",
  SALE: "Sale Price",
};

export const ORDER_FULFILLMENT_STATUSES = [
  "PENDING_APPROVAL",
  "CONFIRMED",
  "PICKED",
  "DELIVERING",
  "DELIVERED",
  "CANCELED",
] as const;

export type OrderFulfillmentStatus =
  (typeof ORDER_FULFILLMENT_STATUSES)[number];

export const ORDER_FULFILLMENT_LABEL: Record<OrderFulfillmentStatus, string> = {
  PENDING_APPROVAL: "Pending Approval",
  CONFIRMED: "Confirmed",
  PICKED: "Picked Up",
  DELIVERING: "Delivering",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
};

export const ORDER_APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export type OrderApprovalStatus = (typeof ORDER_APPROVAL_STATUSES)[number];

export const ORDER_APPROVAL_LABEL: Record<OrderApprovalStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const ORDER_DISCOUNT_STATUSES = ["NONE", "PENDING", "APPROVED", "REJECTED"] as const;

export type OrderDiscountStatus = (typeof ORDER_DISCOUNT_STATUSES)[number];

export const ORDER_DISCOUNT_LABEL: Record<OrderDiscountStatus, string> = {
  NONE: "No Request",
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const SUPPLIER_PAYMENT_STATUSES = [
  "UNPAID_SUPPLIER",
  "SUPPLIER_PAID",
  "CAPITAL_CYCLE_COMPLETED",
] as const;

export type SupplierPaymentStatus = (typeof SUPPLIER_PAYMENT_STATUSES)[number];

export const SUPPLIER_PAYMENT_LABEL: Record<SupplierPaymentStatus, string> = {
  UNPAID_SUPPLIER: "Supplier Unpaid",
  SUPPLIER_PAID: "Supplier Paid in Full",
  CAPITAL_CYCLE_COMPLETED: "Capital Cycle Completed",
};

export const COLLECTION_STATUSES = [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID_IN_FULL",
  "REFUNDED",
] as const;

export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export const COLLECTION_STATUS_LABEL: Record<CollectionStatus, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID_IN_FULL: "Paid in Full",
  REFUNDED: "Refunded",
};

export const INITIAL_PRODUCTS: Array<{ name: string; defaultCost: number }> = [
  { name: "Lụa", defaultCost: 130_000 },
  { name: "Thủ", defaultCost: 130_000 },
  { name: "Quế", defaultCost: 100_000 },
  { name: "Chiên", defaultCost: 100_000 },
  { name: "Thì là", defaultCost: 100_000 },
  { name: "Gân", defaultCost: 100_000 },
  { name: "Giò sống", defaultCost: 100_000 },
  { name: "Khô gà", defaultCost: 220_000 },
  { name: "Da bao", defaultCost: 125_000 },
  { name: "Nem chua", defaultCost: 130_000 },
  { name: "Bò", defaultCost: 160_000 },
];
