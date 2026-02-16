'use client';

import { Button, Drawer, Segmented, Select, Switch } from 'antd';
import { formatCurrency } from 'lib/format';
import { BarChart3, CheckCircle2, Copy, Plus, Save, Search, Sparkles, WalletCards } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PriceProfileView, ProductView } from 'types';
import { clonePriceProfileAction, togglePriceProfileStatusAction } from '../actions';
import { PriceProfileCreateForm, type PriceProfileCreateFormHandle, type PriceProfileSubmitState } from './price-profile-create-form';

type PriceProfileStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type PriceProfileOwnerFilter = 'ALL' | 'SYSTEM' | string;

type PriceProfilesBoardProps = {
  products: ProductView[];
  costProfiles: PriceProfileView[];
  saleProfiles: PriceProfileView[];
  profileStats: {
    totalProfiles: number;
    activeProfiles: number;
    pricedProductsCount: number;
    averageProductsPerProfile: number;
  };
  isAdmin: boolean;
  ownerFilter: PriceProfileOwnerFilter;
  ownerOptions: Array<{ value: string; label: string }>;
  statusFilter: PriceProfileStatusFilter;
  searchQuery: string;
  exportHref: string;
};

const FILTER_OPTIONS: Array<{
  value: PriceProfileStatusFilter;
  labelKey: 'all' | 'active' | 'inactive';
}> = [
  { value: 'ALL', labelKey: 'all' },
  { value: 'ACTIVE', labelKey: 'active' },
  { value: 'INACTIVE', labelKey: 'inactive' },
];
const CREATE_PROFILE_FORM_ID = 'price-profile-create-form';

function getPriceRange(profile: PriceProfileView) {
  if (!profile.items.length) {
    return null;
  }

  const minPrice = Math.min(...profile.items.map(item => item.pricePerKg));
  const maxPrice = Math.max(...profile.items.map(item => item.pricePerKg));
  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
}

function buildPriceProfilesHref(status: PriceProfileStatusFilter, searchQuery: string, ownerFilter: PriceProfileOwnerFilter) {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (ownerFilter !== 'ALL') {
    params.set('owner', ownerFilter);
  }

  return params.toString() ? `/price-profiles?${params.toString()}` : '/price-profiles';
}

type ProfileSectionProps = {
  title: string;
  emptyMessage: string;
  profiles: PriceProfileView[];
  tone: 'cost' | 'sale';
  isAdminView: boolean;
  t: ReturnType<typeof useTranslations<'priceProfilesPage'>>;
};

function isSystemSaleProfile(profile: PriceProfileView) {
  return !profile.sellerId;
}

function ProfileSection({ title, emptyMessage, profiles, tone, isAdminView, t }: ProfileSectionProps) {
  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between rounded-xl border border-border bg-background-secondary px-4 py-3'>
        <h3 className='m-0 text-base font-semibold text-foreground'>
          {title} ({profiles.length})
        </h3>
      </div>

      {!profiles.length ? (
        <div className='rounded-xl border border-border bg-background-secondary p-5 text-sm text-foreground-secondary'>{emptyMessage}</div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {profiles.map(profile => {
            const range = getPriceRange(profile);
            const lockCostActive = tone === 'cost' && profile.isActive;
            const isSystemOwner = tone === 'sale' ? isSystemSaleProfile(profile) : false;
            const ownerTagLabel =
              tone !== 'sale'
                ? ''
                : isSystemOwner
                  ? t('ownerTag.system')
                  : isAdminView
                    ? t('ownerTag.seller', { name: profile.sellerName || t('ownerTag.sellerFallback') })
                    : t('ownerTag.mine');
            const ownerTagClassName =
              tone !== 'sale'
                ? ''
                : isSystemOwner
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                  : isAdminView
                    ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
                    : 'border-sky-500/35 bg-sky-500/10 text-sky-200';

            return (
              <article key={profile.id} className='rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:border-primary-500/50'>
                <div className='mb-3 flex items-start justify-between gap-3'>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      tone === 'cost' ? 'bg-sky-500/15 text-sky-300' : 'bg-amber-500/15 text-amber-300'
                    }`}>
                    {tone === 'cost' ? <WalletCards className='h-5 w-5' /> : <Sparkles className='h-5 w-5' />}
                  </div>

                  <div className='flex items-center gap-2'>
                    <form action={clonePriceProfileAction}>
                      <input type='hidden' name='profileId' value={profile.id} />
                      <button
                        type='submit'
                        className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary transition-colors hover:text-foreground'
                        aria-label={t('cloneButton')}>
                        <Copy className='h-4 w-4' />
                      </button>
                    </form>

                    <form action={togglePriceProfileStatusAction} id={`toggle-profile-${profile.id}`}>
                      <input type='hidden' name='profileId' value={profile.id} />
                      <Switch
                        checked={profile.isActive}
                        disabled={lockCostActive}
                        onChange={() => {
                          const form = document.getElementById(`toggle-profile-${profile.id}`) as HTMLFormElement | null;
                          form?.requestSubmit();
                        }}
                      />
                    </form>
                  </div>
                </div>

                <h4 className='mb-1 mt-0 text-base font-semibold text-foreground'>{profile.name}</h4>
                {tone === 'sale' ? (
                  <div className='mb-2 mt-1 flex items-center gap-2'>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] ${ownerTagClassName}`}>
                      {ownerTagLabel}
                    </span>
                  </div>
                ) : null}
                <p className='mb-2 mt-1 text-sm text-foreground-secondary'>{profile.notes || t('noNotes')}</p>

                <div className='mt-3 flex items-center justify-between rounded-lg border border-border bg-background-tertiary px-2.5 py-2 text-xs'>
                  <span className='text-foreground-secondary'>{t('productsCount', { count: profile.items.length })}</span>
                  <span className='font-medium text-foreground'>{range || t('noPrices')}</span>
                </div>

                <details className='mt-3 text-sm text-foreground-secondary'>
                  <summary className='cursor-pointer'>{t('viewPriceTable', { count: profile.items.length })}</summary>
                  <div className='mt-2 max-h-48 overflow-auto rounded-lg border border-border'>
                    <table className='w-full border-collapse'>
                      <thead>
                        <tr>
                          <th className='border-b border-border bg-background-tertiary px-2 py-1.5 text-left text-xs text-foreground-muted'>
                            {t('table.product')}
                          </th>
                          <th className='border-b border-border bg-background-tertiary px-2 py-1.5 text-left text-xs text-foreground-muted'>
                            {t('table.pricePerKg')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.items.map(item => (
                          <tr key={`${profile.id}-${item.productId}`}>
                            <td className='border-b border-border px-2 py-1.5 text-sm text-foreground'>{item.productName}</td>
                            <td className='border-b border-border px-2 py-1.5 text-sm text-foreground-secondary'>{formatCurrency(item.pricePerKg)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatsCard({
  label,
  value,
  icon,
  toneClass,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  toneClass: string;
}) {
  return (
    <article className='rounded-xl border border-border bg-background-secondary p-4'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <p className='m-0 text-xs font-semibold uppercase tracking-[0.08em] text-foreground-muted'>{label}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>{icon}</span>
      </div>
      <p className='m-0 text-2xl font-bold text-foreground'>{value}</p>
    </article>
  );
}

export function PriceProfilesBoard({
  products,
  costProfiles,
  saleProfiles,
  profileStats,
  isAdmin,
  ownerFilter,
  ownerOptions,
  statusFilter,
  searchQuery,
  exportHref,
}: PriceProfilesBoardProps) {
  const t = useTranslations('priceProfilesPage');
  const tForm = useTranslations('priceProfileForm');
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const createFormRef = useRef<PriceProfileCreateFormHandle | null>(null);
  const [createSubmitState, setCreateSubmitState] = useState<PriceProfileSubmitState>({
    canSubmit: false,
    isSubmitting: false,
  });
  const [ownerFilterValue, setOwnerFilterValue] = useState<PriceProfileOwnerFilter>(ownerFilter);

  const inactiveCount = useMemo(
    () => Math.max(profileStats.totalProfiles - profileStats.activeProfiles, 0),
    [profileStats.activeProfiles, profileStats.totalProfiles],
  );
  const systemSaleProfilesCount = useMemo(() => saleProfiles.filter(profile => isSystemSaleProfile(profile)).length, [saleProfiles]);
  const sellerSaleProfilesCount = useMemo(
    () => Math.max(saleProfiles.length - systemSaleProfilesCount, 0),
    [saleProfiles.length, systemSaleProfilesCount],
  );
  const statusSegmentOptions = useMemo(
    () =>
      FILTER_OPTIONS.map(option => {
        const count = option.value === 'ALL' ? profileStats.totalProfiles : option.value === 'ACTIVE' ? profileStats.activeProfiles : inactiveCount;
        return {
          label: `${t(`filters.${option.labelKey}`)} (${count})`,
          value: option.value,
        };
      }),
    [inactiveCount, profileStats.activeProfiles, profileStats.totalProfiles, t],
  );
  const statsCards = useMemo(() => {
    if (isAdmin) {
      return [
        {
          label: t('stats.costLaneProfiles'),
          value: String(costProfiles.length),
          icon: <WalletCards className='h-4 w-4 text-sky-200' />,
          toneClass: 'bg-sky-500/15',
        },
        {
          label: t('stats.saleLaneProfiles'),
          value: String(saleProfiles.length),
          icon: <Sparkles className='h-4 w-4 text-amber-200' />,
          toneClass: 'bg-amber-500/15',
        },
        {
          label: t('stats.systemSuggestedSale'),
          value: String(systemSaleProfilesCount),
          icon: <CheckCircle2 className='h-4 w-4 text-emerald-200' />,
          toneClass: 'bg-emerald-500/15',
        },
        {
          label: t('stats.sellerSaleProfiles'),
          value: String(sellerSaleProfilesCount),
          icon: <BarChart3 className='h-4 w-4 text-violet-200' />,
          toneClass: 'bg-violet-500/15',
        },
      ];
    }

    return [
      {
        label: t('stats.mySaleProfiles'),
        value: String(sellerSaleProfilesCount),
        icon: <Sparkles className='h-4 w-4 text-sky-200' />,
        toneClass: 'bg-sky-500/15',
      },
      {
        label: t('stats.systemSuggestedSale'),
        value: String(systemSaleProfilesCount),
        icon: <CheckCircle2 className='h-4 w-4 text-emerald-200' />,
        toneClass: 'bg-emerald-500/15',
      },
      {
        label: t('stats.pricedProducts'),
        value: String(profileStats.pricedProductsCount),
        icon: <WalletCards className='h-4 w-4 text-amber-200' />,
        toneClass: 'bg-amber-500/15',
      },
      {
        label: t('stats.avgProductsPerProfile'),
        value: profileStats.averageProductsPerProfile.toFixed(1),
        icon: <BarChart3 className='h-4 w-4 text-violet-200' />,
        toneClass: 'bg-violet-500/15',
      },
    ];
  }, [
    costProfiles.length,
    isAdmin,
    profileStats.averageProductsPerProfile,
    profileStats.pricedProductsCount,
    saleProfiles.length,
    sellerSaleProfilesCount,
    systemSaleProfilesCount,
    t,
  ]);

  const hasAnyProfiles = isAdmin ? costProfiles.length > 0 || saleProfiles.length > 0 : saleProfiles.length > 0;

  useEffect(() => {
    setOwnerFilterValue(ownerFilter);
  }, [ownerFilter]);

  return (
    <>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='m-0 text-2xl font-bold text-foreground'>{t('title')}</h1>
          <p className='mt-1 text-sm text-foreground-secondary'>{t('subtitle')}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Segmented
            size='large'
            options={statusSegmentOptions}
            defaultValue={statusFilter}
            styles={{
              root: { padding: 4, minHeight: 40, height: 40 },
              item: { height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
              label: { fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', lineHeight: 1 },
            }}
            onChange={value => {
              const nextStatus = String(value) as PriceProfileStatusFilter;
              router.push(buildPriceProfilesHref(nextStatus, searchQuery, ownerFilterValue));
            }}
          />
          {/* <Link
            href={exportHref}
            className='inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground'>
            {t('exportButton')}
          </Link> */}
        </div>
      </div>

      <div className='mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {statsCards.map(card => (
          <StatsCard key={card.label} label={card.label} value={card.value} icon={card.icon} toneClass={card.toneClass} />
        ))}
      </div>

      <div className='mb-6 flex flex-wrap items-start gap-4'>
        {isAdmin ? (
          <Select
            value={ownerFilterValue}
            onChange={value => {
              const nextOwner = String(value) as PriceProfileOwnerFilter;
              setOwnerFilterValue(nextOwner);
              router.push(buildPriceProfilesHref(statusFilter, searchQuery, nextOwner));
            }}
            size='large'
            allowClear
            showSearch
            showScrollBar
            styles={{
              content: { color: '#fff' },
              root: { paddingInline: 12, paddingBlock: 4, minHeight: 40, height: 40, width: 300, backgroundColor: '#171717' },
              item: { height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
              suffix: { color: '#fff' },
              clear: { color: '#fff', backgroundColor: '#171717' },
            }}
            options={[
              { value: 'ALL', label: t('ownerFilter.all') },
              { value: 'SYSTEM', label: t('ownerFilter.system') },
              ...ownerOptions.map(option => ({
                value: option.value,
                label: option.label,
              })),
            ]}
          />
        ) : null}
        <div className='flex-1'>
          <form method='get' className='relative flex-1 max-w-md'>
            {statusFilter !== 'ALL' ? <input type='hidden' name='status' value={statusFilter} /> : null}
            {isAdmin && ownerFilterValue !== 'ALL' ? <input type='hidden' name='owner' value={ownerFilterValue} /> : null}
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary' />
              <input
                type='text'
                name='q'
                defaultValue={searchQuery}
                placeholder={t('searchPlaceholder')}
                className='h-10 w-full rounded-lg border border-border bg-background-secondary pl-10 pr-4 text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
            </div>
          </form>
        </div>

        <button
          type='button'
          onClick={() => setDrawerOpen(true)}
          className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-600'>
          <Plus className='h-4 w-4' />
          {t('addButton')}
        </button>
      </div>

      {!hasAnyProfiles ? (
        <div className='flex h-56 flex-col items-center justify-center rounded-xl border border-border bg-background-secondary text-foreground-secondary'>
          <WalletCards className='mb-3 h-10 w-10 opacity-60' />
          <p className='m-0'>{t('empty')}</p>
        </div>
      ) : (
        <div className='space-y-5'>
          {isAdmin ? (
            <ProfileSection title={t('lanes.cost')} emptyMessage={t('emptyCost')} profiles={costProfiles} tone='cost' isAdminView={isAdmin} t={t} />
          ) : null}

          <ProfileSection title={t('lanes.sale')} emptyMessage={t('emptySale')} profiles={saleProfiles} tone='sale' isAdminView={isAdmin} t={t} />
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement='right'
        size={460}
        closable={{ placement: 'end' }}
        destroyOnHidden
        title={
          <div>
            <h3 className='m-0 text-lg font-semibold text-foreground'>{t('drawerTitle')}</h3>
            <p className='m-0 text-xs text-foreground-secondary'>{t('drawerHint')}</p>
          </div>
        }
        footer={
          <div className='grid grid-cols-2 gap-2'>
            <Button
              type='default'
              onClick={() => createFormRef.current?.generateTestData()}
              disabled={createSubmitState.isSubmitting}
              className='!border-border !bg-background-secondary !text-foreground-secondary hover:!border-primary-500/40 hover:!text-foreground'>
              {tForm('generateTestData')}
            </Button>
            <Button
              type='primary'
              htmlType='submit'
              form={CREATE_PROFILE_FORM_ID}
              disabled={!createSubmitState.canSubmit}
              loading={createSubmitState.isSubmitting}
              icon={<Save className='h-4 w-4' />}
              className='!border-primary-500 !bg-primary-500 !text-white hover:!border-primary-600 hover:!bg-primary-600'>
              {tForm('submit')}
            </Button>
          </div>
        }>
        <PriceProfileCreateForm
          ref={createFormRef}
          formId={CREATE_PROFILE_FORM_ID}
          products={products}
          canManageCost={isAdmin}
          onSubmitStateChange={setCreateSubmitState}
          onCreated={() => setDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
}
