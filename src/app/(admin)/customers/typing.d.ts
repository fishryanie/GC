export type CustomersTab = "customers" | "sellers";
export type CustomerStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type SellerRoleFilter = "ALL" | "ADMIN" | "SELLER";
export type SellerStatusFilter = "ALL" | "ENABLED" | "DISABLED";

export type CustomersPageSearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;
