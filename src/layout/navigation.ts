import { BarChart3, Calendar, FileText, LayoutDashboard, Lock, Package, QrCode, ShoppingCart, Users, type LucideIcon } from "lucide-react";
import { appLocales } from "i18n/config";
import menuConfig from "./menu.json";
import type { NavigationLabelKey } from "./types";

type IconName = "BarChart3" | "Calendar" | "FileText" | "LayoutDashboard" | "Lock" | "Package" | "QrCode" | "ShoppingCart" | "Users";

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
  Lock,
  Package,
  QrCode,
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

function normalizePath(pathname: string) {
  const rawPath = pathname.split("?")[0].split("#")[0];
  const trimmedPath = rawPath === "/" ? "/" : rawPath.replace(/\/+$/, "");
  const segments = trimmedPath.split("/").filter(Boolean);

  if (segments.length > 0 && appLocales.includes(segments[0] as (typeof appLocales)[number])) {
    const withoutLocale = `/${segments.slice(1).join("/")}`;
    return withoutLocale === "/" ? "/" : withoutLocale;
  }

  return trimmedPath || "/";
}

export function isPathActive(pathname: string, href: string) {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (targetPath === "/dashboard") {
    return currentPath === "/dashboard";
  }

  if (targetPath === "/orders/new") {
    return currentPath === "/orders/new";
  }

  if (targetPath === "/orders") {
    return currentPath === "/orders";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}
