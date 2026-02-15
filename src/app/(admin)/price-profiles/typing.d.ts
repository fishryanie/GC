export type PriceProfileStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type PriceProfilesPageSearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;
