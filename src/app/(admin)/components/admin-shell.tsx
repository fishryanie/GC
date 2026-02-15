"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Package,
  Search,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/(admin)/actions";
import { LocaleSwitcher } from "@/app/(admin)/components/locale-switcher";

type AdminShellProps = {
  children: ReactNode;
  dbError?: string;
  currentSeller: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "SELLER";
  };
};

type NavigationItem = {
  href: string;
  labelKey:
    | "dashboard"
    | "products"
    | "priceProfiles"
    | "newOrder"
    | "orders"
    | "customers"
    | "home"
    | "profileShort";
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    labelKey: "dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/products",
    labelKey: "products",
    icon: Package,
  },
  {
    href: "/price-profiles",
    labelKey: "priceProfiles",
    icon: BarChart3,
  },
  {
    href: "/orders/new",
    labelKey: "newOrder",
    icon: ShoppingCart,
  },
  {
    href: "/orders",
    labelKey: "orders",
    icon: FileText,
  },
  {
    href: "/customers",
    labelKey: "customers",
    icon: Users,
  },
];

const mobileNavItems = [
  {
    href: "/dashboard",
    labelKey: "home",
    icon: LayoutDashboard,
  },
  {
    href: "/products",
    labelKey: "products",
    icon: Package,
  },
  {
    href: "/orders/new",
    labelKey: "newOrder",
    icon: ShoppingCart,
  },
  {
    href: "/orders",
    labelKey: "orders",
    icon: Calendar,
  },
  {
    href: "/customers",
    labelKey: "customers",
    icon: Users,
  },
] satisfies NavigationItem[];

function isPathActive(pathname: string, href: string) {
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

export function AdminShell({ children, dbError, currentSeller }: AdminShellProps) {
  const pathname = usePathname();
  const tCommon = useTranslations("common");
  const tShell = useTranslations("shell");

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="hidden w-64 flex-col border-r border-border bg-background-secondary md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Image
            src="/gc-mark.svg"
            alt={tCommon("appName")}
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-xl font-bold text-primary-500">{tCommon("appName")}</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => {
            const active = isPathActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "!bg-[rgba(34,197,94,0.16)] !text-[#22c55e]"
                    : "!bg-transparent !text-[#a3a3a3] hover:!bg-[#262626] hover:!text-[#fafafa]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tShell(`nav.${item.labelKey}`)}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-3">
          <Link
            href="/account"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            <Lock className="h-5 w-5" />
            {tCommon("changePassword")}
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-5 w-5" />
              {tCommon("signOut")}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background-secondary px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Image
              src="/gc-mark.svg"
              alt={tCommon("appName")}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
          </div>

          <div className="hidden w-80 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <input
                placeholder={tCommon("searchPlaceholder")}
                className="focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary pl-9 pr-3 text-sm text-foreground-secondary placeholder:text-foreground-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              className="hidden items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 py-2 text-sm text-foreground-secondary transition-colors hover:text-foreground sm:inline-flex"
            >
              <span className="hidden lg:inline">{tCommon("appName")}</span>
              <span className="lg:hidden">Admin</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            <LocaleSwitcher />

            <button
              type="button"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary transition-colors hover:text-foreground"
              aria-label={tCommon("notificationsAria")}
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-500" />
            </button>

            <div className="flex items-center gap-3 border-l border-border pl-2 md:pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-sm font-medium text-primary-500">
                {currentSeller.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-foreground">{currentSeller.name}</p>
                <p className="text-xs text-foreground-muted">
                  {currentSeller.role === "ADMIN" ? tCommon("roleAdmin") : tCommon("roleSeller")}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background p-4 pb-16 md:p-6 md:pb-6">
          {dbError ? (
            <div className="mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p className="font-medium">{tShell("dbNotConnectedTitle")}</p>
              <p className="mt-1 text-amber-100/90">
                {tShell("dbNotConnectedDesc", { message: dbError })}
              </p>
            </div>
          ) : null}

          <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col">{children}</div>
        </main>
      </div>

      <nav className="safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-secondary md:hidden">
        <div className="flex h-16 items-center justify-around">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-full flex-1 flex-col items-center justify-center py-2 transition-colors ${
                  active ? "!text-[#22c55e]" : "!text-[#737373] hover:!text-[#fafafa]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-[11px] font-medium">{tShell(`nav.${item.labelKey}`)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
