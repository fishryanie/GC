export const appLocales = ["vi", "en"] as const;

export type AppLocale = (typeof appLocales)[number];

export const defaultLocale: AppLocale = "en";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return appLocales.includes(value as AppLocale);
}
