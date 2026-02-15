export type ProductFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type ProductsPageSearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;
