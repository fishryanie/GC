export type OrdersPageSearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

export type OrderApprovalDecision =
  | "APPROVE_ORDER"
  | "APPROVE_WITH_DISCOUNT"
  | "APPROVE_WITHOUT_DISCOUNT"
  | "REJECT_ORDER";
