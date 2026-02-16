'use client';

import { appLocales, type AppLocale } from 'i18n/config';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function HeaderLanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const tCommon = useTranslations('common');
  const [isPending, startTransition] = useTransition();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchLocale = async (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    setIsSwitching(true);
    try {
      const response = await fetch('/api/locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: nextLocale }),
      });

      if (!response.ok) {
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      className='inline-flex h-9 items-center rounded-lg border border-border bg-background-tertiary p-0.5'
      aria-label={tCommon('languageSwitcherAria')}>
      {appLocales.map(item => {
        const active = item === locale;
        return (
          <button
            key={item}
            type='button'
            disabled={active || isPending || isSwitching}
            onClick={() => {
              void handleSwitchLocale(item);
            }}
            className={`inline-flex h-8 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold uppercase tracking-[0.04em] transition-colors ${
              active
                ? 'bg-primary-500 text-white'
                : 'text-foreground-secondary hover:bg-background-hover hover:text-foreground'
            } disabled:cursor-default disabled:opacity-100`}>
            {item}
          </button>
        );
      })}
    </div>
  );
}
