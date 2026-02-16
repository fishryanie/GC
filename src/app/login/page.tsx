import { ensureDefaultAdminAccount, getAuthSession } from 'lib/auth';
import { resolveSearchParams } from 'lib/search-params';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { LoginForm } from './components/login-form';

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureDefaultAdminAccount();
  const session = await getAuthSession();

  if (session) {
    redirect('/dashboard');
  }

  const params = await resolveSearchParams(searchParams);
  const returnTo = getSearchValue(params.returnTo);
  const normalizedReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard';
  const t = await getTranslations('loginPage');

  return (
    <div className='relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_16%_16%,rgba(34,197,94,0.32),transparent_45%),radial-gradient(circle_at_92%_24%,rgba(16,185,129,0.22),transparent_48%),linear-gradient(160deg,#052e1b,#0f172a)]'>
      <div className='pointer-events-none absolute inset-0 opacity-75'>
        <div className='absolute -left-14 top-8 h-48 w-48 rounded-full border border-emerald-100/20' />
        <div className='absolute -right-14 bottom-8 h-56 w-56 rounded-full border border-emerald-100/15' />
      </div>

      <main className='relative z-10 mx-auto flex h-full w-full max-w-3xl items-center justify-center px-[clamp(12px,4vw,24px)] py-[clamp(12px,3dvh,24px)]'>
        <section className='w-full max-w-[460px] overflow-hidden rounded-[28px] border border-emerald-200/20 bg-background-secondary/92 shadow-[0_24px_64px_rgba(2,6,23,0.56)] backdrop-blur'>
          <header className='border-b border-emerald-200/15 bg-[linear-gradient(145deg,rgba(34,197,94,0.24),rgba(15,23,42,0.32)_55%,rgba(10,10,10,0.45))] px-[clamp(16px,4.5vw,28px)] py-[clamp(14px,2.8vh,22px)]'>
            <div className='mb-3 flex items-center gap-2.5'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 shadow-[0_8px_20px_rgba(34,197,94,0.35)]'>
                <span className='text-xs font-bold text-white'>GC</span>
              </div>
              <span className='text-[clamp(1.2rem,4.8vw,1.6rem)] font-bold text-foreground'>GC</span>
            </div>

            <h1 className='mb-1.5 text-[clamp(1.3rem,6vw,1.8rem)] font-bold leading-tight text-foreground'>{t('heroTitle')}</h1>
            <p className='m-0 text-[clamp(0.8rem,3.2vw,0.96rem)] leading-relaxed text-foreground-secondary'>{t('heroSubtitle')}</p>
          </header>

          <div className='space-y-4 px-[clamp(16px,4.5vw,28px)] py-[clamp(14px,2.8vh,22px)]'>
            <div>
              <h2 className='text-[clamp(1.15rem,5vw,1.45rem)] font-bold text-foreground'>{t('title')}</h2>
              <p className='mt-1.5 text-[clamp(0.78rem,3.1vw,0.92rem)] text-foreground-secondary'>{t('subtitle')}</p>
            </div>

            <LoginForm returnTo={normalizedReturnTo} />

            <div className='rounded-lg border border-emerald-300/20 bg-emerald-500/12 px-3 py-2.5'>
              <p className='mb-2 text-xs text-foreground-muted'>{t('demoTitle')}</p>
              <p className='m-0 text-xs text-foreground'>{t('demoAdmin')}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
