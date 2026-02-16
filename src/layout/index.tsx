import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { AppHeader } from './components/app-header';
import { LeftMenu } from './components/left-menu';
import { MobileBottomNav } from './components/mobile-bottom-nav';
import type { CurrentSeller } from './types';

type AdminLayoutShellProps = {
  children: ReactNode;
  dbError?: string;
  currentSeller: CurrentSeller;
};

export function AdminLayoutShell({ children, dbError, currentSeller }: AdminLayoutShellProps) {
  const tShell = useTranslations('shell');

  return (
    <div className='flex h-screen bg-background text-foreground'>
      <LeftMenu />

      <div className='flex flex-1 flex-col overflow-hidden'>
        <AppHeader currentSeller={currentSeller} />

        <main className='flex-1 overflow-auto bg-background p-4 pb-16 md:p-6 md:pb-6'>
          {dbError ? (
            <div className='mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm text-amber-200'>
              <p className='font-medium'>{tShell('dbNotConnectedTitle')}</p>
              <p className='mt-1 text-amber-100/90'>{tShell('dbNotConnectedDesc', { message: dbError })}</p>
            </div>
          ) : null}

          <div className='mx-auto flex min-h-full w-full max-w-[1280px] flex-col'>{children}</div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
