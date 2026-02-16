import { Bell, ChevronDown, Plus, Search, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { HeaderLanguageSwitcher } from './header-language-switcher';
import type { CurrentSeller } from '../types';

type AppHeaderProps = {
  currentSeller: CurrentSeller;
};

export function AppHeader({ currentSeller }: AppHeaderProps) {
  const tCommon = useTranslations('common');

  return (
    <header className='flex h-16 items-center justify-between border-b border-border bg-background-secondary px-4 md:px-6'>
      <div className='flex items-center gap-2 md:hidden'>
        <Image src='/gc-mark.svg' alt={tCommon('appName')} width={32} height={32} className='h-8 w-8 rounded-lg' />
      </div>

      <div className='hidden w-80 md:block'>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted' />
          <input
            placeholder={tCommon('searchPlaceholder')}
            className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary pl-9 pr-3 text-sm text-foreground-secondary placeholder:text-foreground-muted'
          />
        </div>
      </div>

      <div className='flex items-center gap-2 md:gap-4'>
        <button
          type='button'
          className='hidden items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 py-2 text-sm text-foreground-secondary transition-colors hover:text-foreground sm:inline-flex'>
          <span className='hidden lg:inline'>{tCommon('appName')}</span>
          <span className='lg:hidden'>Admin</span>
          <ChevronDown className='h-4 w-4' />
        </button>

        <HeaderLanguageSwitcher />

        <Link
          href='/orders/new'
          aria-label={tCommon('newOrderAria')}
          className='relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-tertiary !text-white transition-colors hover:!text-white md:hidden'>
          <ShoppingCart className='h-[17px] w-[17px]' />
          <span className='absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white'>
            <Plus className='h-2.5 w-2.5' />
          </span>
        </Link>

        <button
          type='button'
          className='relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary transition-colors hover:text-foreground'
          aria-label={tCommon('notificationsAria')}>
          <Bell className='h-[18px] w-[18px]' />
          <span className='absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-500' />
        </button>

        <div className='flex items-center gap-3 border-l border-border pl-2 md:pl-4'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-sm font-medium text-primary-500'>
            {currentSeller.name.charAt(0).toUpperCase()}
          </div>
          <div className='hidden lg:block'>
            <p className='text-sm font-medium text-foreground'>{currentSeller.name}</p>
            <p className='text-xs text-foreground-muted'>{currentSeller.role === 'ADMIN' ? tCommon('roleAdmin') : tCommon('roleSeller')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
