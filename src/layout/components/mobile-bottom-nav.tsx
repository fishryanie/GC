'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { isPathActive, mobileNavigationItems } from '../navigation';

type MobileBottomNavProps = {
  pathname: string;
};

export function MobileBottomNav({ pathname }: MobileBottomNavProps) {
  const tShell = useTranslations('shell');

  return (
    <nav className='safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-secondary md:hidden'>
      <div className='flex h-16 items-center justify-around'>
        {mobileNavigationItems.map(item => {
          const Icon = item.icon;
          const active = isPathActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`gc-mobile-nav-link flex h-full flex-1 flex-col items-center justify-center py-2 ${
                active ? 'gc-mobile-nav-link-active' : ''
              }`}>
              <Icon className='h-5 w-5' />
              <span className='mt-1 text-[11px] font-medium'>{tShell(`nav.${item.labelKey}`)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
