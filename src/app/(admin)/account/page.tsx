import { changePasswordAction } from '@/app/(admin)/account/actions';
import { getTranslations } from 'next-intl/server';

export default async function AccountPage() {
  const t = await getTranslations('accountPage');

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
      <section className='rounded-2xl border border-border bg-background-secondary p-5'>
        <p className='m-0 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted'>{t('tag')}</p>
        <h1 className='mb-1 mt-2 text-2xl font-bold text-foreground'>{t('title')}</h1>
        <p className='m-0 text-sm text-foreground-secondary'>{t('subtitle')}</p>
      </section>

      <form action={changePasswordAction} className='space-y-4 rounded-2xl border border-border bg-background-secondary p-5'>
        <label className='block space-y-1.5'>
          <span className='text-sm font-medium text-foreground'>{t('currentPassword')}</span>
          <input
            type='password'
            name='currentPassword'
            required
            className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
          />
        </label>

        <label className='block space-y-1.5'>
          <span className='text-sm font-medium text-foreground'>{t('newPassword')}</span>
          <input
            type='password'
            name='newPassword'
            required
            className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
          />
        </label>

        <label className='block space-y-1.5'>
          <span className='text-sm font-medium text-foreground'>{t('confirmPassword')}</span>
          <input
            type='password'
            name='confirmPassword'
            required
            className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
          />
        </label>

        <button
          type='submit'
          className='inline-flex h-10 items-center justify-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600'>
          {t('submit')}
        </button>
      </form>
    </div>
  );
}
