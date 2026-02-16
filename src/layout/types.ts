export type CurrentSeller = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SELLER";
};

export type NavigationLabelKey =
  | "dashboard"
  | "products"
  | "priceProfiles"
  | "newOrder"
  | "orders"
  | "customers"
  | "home"
  | "profileShort";
