import { BarChart3, Calendar, FileText, LayoutDashboard, Package, ShoppingCart, Users, type LucideIcon } from "lucide-react";
import menuConfig from "./menu.json";
import type { NavigationLabelKey } from "./types";

type IconName = "BarChart3" | "Calendar" | "FileText" | "LayoutDashboard" | "Package" | "ShoppingCart" | "Users";

type NavigationConfigItem = {
  href: string;
  labelKey: NavigationLabelKey;
  icon: IconName;
};

export type NavigationItem = {
  href: string;
  labelKey: NavigationLabelKey;
  icon: LucideIcon;
};

const ICON_MAP: Record<IconName, LucideIcon> = {
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
};

function buildNavigationItems(items: NavigationConfigItem[]): NavigationItem[] {
  return items.map((item) => ({
    href: item.href,
    labelKey: item.labelKey,
    icon: ICON_MAP[item.icon],
  }));
}

const typedConfig = menuConfig as {
  desktop: NavigationConfigItem[];
  mobile: NavigationConfigItem[];
};

export const desktopNavigationItems = buildNavigationItems(typedConfig.desktop);
export const mobileNavigationItems = buildNavigationItems(typedConfig.mobile);

export function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/orders/new") {
    return pathname === "/orders/new";
  }

  if (href === "/orders") {
    return pathname === "/orders";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

