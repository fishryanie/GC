'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isPathActive, mobileNavigationItems } from '../navigation';

export function MobileBottomNav() {
  const pathname = usePathname();
  const tShell = useTranslations('shell');

  return (
    <nav id='mobile-bottom-nav' className='safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-secondary md:hidden'>
      <div className='flex h-16 items-stretch px-1.5'>
        {mobileNavigationItems.map(item => {
          const Icon = item.icon;
          const active = isPathActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-lg px-1 py-2 transition-colors ${
                active ? '!bg-primary-500/10 !text-primary-500' : '!text-foreground-muted hover:!bg-background-tertiary hover:!text-foreground'
              }`}>
              <Icon className='h-5 w-5' />
              <span className='mt-1 w-full truncate px-0.5 text-center text-[10px] font-medium leading-none'>{tShell(`nav.${item.labelKey}`)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
