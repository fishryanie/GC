"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { appLocales, defaultLocale, isAppLocale, type AppLocale } from "@/i18n/config";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function getNextLocale(locale: AppLocale): AppLocale {
  const [first, second] = appLocales;
  return locale === first ? second : first;
}

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const locale = isAppLocale(currentLocale) ? currentLocale : defaultLocale;
  const nextLocale = getNextLocale(locale);
  const router = useRouter();
  const tCommon = useTranslations("common");

  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `NEXT_LOCALE=${nextLocale}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
        router.refresh();
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground"
      aria-label={tCommon("languageSwitcherAria")}
      title={tCommon("languageSwitcherAria")}
    >
      <Languages className="h-4 w-4" />
      <span>{locale.toUpperCase()}</span>
    </button>
  );
}
