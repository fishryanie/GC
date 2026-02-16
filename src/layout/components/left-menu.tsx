'use client';

import { logoutAction } from 'actions/common';
import { Lock, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { desktopNavigationItems, isPathActive } from '../navigation';

type LeftMenuProps = {
  pathname: string;
};

export function LeftMenu({ pathname }: LeftMenuProps) {
  const tCommon = useTranslations('common');
  const tShell = useTranslations('shell');

  return (
    <aside className='hidden w-64 flex-col border-r border-border bg-background-secondary md:flex'>
      <div className='flex h-16 items-center gap-2 border-b border-border px-6'>
        <Image src='/gc-mark.svg' alt={tCommon('appName')} width={32} height={32} className='h-8 w-8 rounded-lg' />
        <span className='text-xl font-bold text-primary-500'>{tCommon('appName')}</span>
      </div>

      <nav className='flex-1 space-y-1 overflow-y-auto px-3 py-4'>
        {desktopNavigationItems.map(item => {
          const active = isPathActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`gc-menu-link ${active ? 'gc-menu-link-active' : ''}`}>
              <Icon className='h-5 w-5' />
              {tShell(`nav.${item.labelKey}`)}
            </Link>
          );
        })}
      </nav>

      <div className='space-y-1 border-t border-border p-3'>
        <Link href='/account' className='gc-menu-link'>
          <Lock className='h-5 w-5' />
          {tCommon('changePassword')}
        </Link>
        <form action={logoutAction}>
          <button
            type='submit'
            className='gc-menu-link w-full hover:!bg-red-500/10 hover:!text-red-400'>
            <LogOut className='h-5 w-5' />
            {tCommon('signOut')}
          </button>
        </form>
      </div>
    </aside>
  );
}
