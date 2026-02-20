'use client';

import type { OrderLinkStatusFilter } from '@/app/(admin)/order-links/typing';
import type { CustomerOrderLinksPageData } from '@/lib/data';
import { formatDateTime } from '@/lib/format';
import type { PriceProfileView, SellerView } from '@/types';
import { App, DatePicker, Modal, Segmented, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { Copy, Link2, QrCode, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createCustomerOrderLinkAction, toggleCustomerOrderLinkStatusAction } from '../actions';

type OrderLinksBoardProps = {
  linksData: CustomerOrderLinksPageData;
  saleProfiles: PriceProfileView[];
  sellers: SellerView[];
  isAdmin: boolean;
  currentSellerId: string;
  statusFilter: OrderLinkStatusFilter;
  searchQuery: string;
  sellerFilter: string;
};

function buildOrderLinksHref(status: OrderLinkStatusFilter, searchQuery: string, sellerId: string) {
  const params = new URLSearchParams();

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  if (sellerId) {
    params.set('sellerId', sellerId);
  }

  const queryString = params.toString();
  return queryString ? `/order-links?${queryString}` : '/order-links';
}

function getStatusStyle(isActive: boolean, isExpired: boolean) {
  if (isExpired) {
    return 'border-red-500/40 bg-red-500/15 text-red-200';
  }

  if (!isActive) {
    return 'border-zinc-500/35 bg-zinc-500/15 text-zinc-200';
  }

  return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';
}

export function OrderLinksBoard({
  linksData,
  saleProfiles,
  sellers,
  isAdmin,
  currentSellerId,
  statusFilter,
  searchQuery,
  sellerFilter,
}: OrderLinksBoardProps) {
  const t = useTranslations('orderLinksPage');
  const router = useRouter();
  const { message } = App.useApp();
  const [sellerFilterValue, setSellerFilterValue] = useState<string>(sellerFilter);
  const [createSellerId, setCreateSellerId] = useState<string>(() => {
    if (!isAdmin) {
      return currentSellerId;
    }

    if (sellerFilter) {
      return sellerFilter;
    }

    return sellers[0]?.id ?? '';
  });
  const [createSaleProfileId, setCreateSaleProfileId] = useState<string>('');
  const [createExpiresAt, setCreateExpiresAt] = useState<Dayjs>(() => dayjs().add(2, 'hour'));
  const [origin, setOrigin] = useState('');
  const [qrToken, setQrToken] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      {
        label: `${t('filters.all')} (${linksData.totalCount})`,
        value: 'ALL',
      },
      {
        label: `${t('filters.active')} (${linksData.activeCount})`,
        value: 'ACTIVE',
      },
      {
        label: `${t('filters.expired')} (${linksData.expiredCount})`,
        value: 'EXPIRED',
      },
      {
        label: `${t('filters.inactive')} (${linksData.inactiveCount})`,
        value: 'INACTIVE',
      },
    ],
    [linksData.activeCount, linksData.expiredCount, linksData.inactiveCount, linksData.totalCount, t],
  );

  const filteredSaleProfiles = useMemo(() => {
    if (!isAdmin) {
      return saleProfiles;
    }

    if (!createSellerId) {
      return saleProfiles.filter(profile => !profile.sellerId);
    }

    return saleProfiles.filter(profile => !profile.sellerId || profile.sellerId === createSellerId);
  }, [createSellerId, isAdmin, saleProfiles]);

  const createSaleProfileOptions = useMemo(
    () =>
      filteredSaleProfiles.map(profile => {
        const isSystemProfile = !profile.sellerId;

        return {
          value: profile.id,
          label: (
            <div className='flex items-center justify-between gap-2'>
              <span className='truncate'>{profile.name}</span>
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${
                  isSystemProfile ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200' : 'border-sky-500/40 bg-sky-500/15 text-sky-200'
                }`}>
                {isSystemProfile ? t('systemProfile') : t('sellerProfile')}
              </span>
            </div>
          ),
        };
      }),
    [filteredSaleProfiles, t],
  );

  const sellerFilterOptions = useMemo(
    () => [
      { value: '', label: t('sellerFilter.all') },
      ...sellers.map(seller => ({
        value: seller.id,
        label: seller.name,
      })),
    ],
    [sellers, t],
  );

  const createSellerOptions = useMemo(
    () =>
      sellers.map(seller => ({
        value: seller.id,
        label: seller.name,
      })),
    [sellers],
  );

  const selectedQrPath = qrToken ? `/o/${qrToken}` : '';
  const selectedQrUrl = qrToken && origin ? `${origin}${selectedQrPath}` : '';

  useEffect(() => {
    setSellerFilterValue(sellerFilter);
  }, [sellerFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!createSellerId && isAdmin) {
      setCreateSaleProfileId('');
      return;
    }

    if (!filteredSaleProfiles.length) {
      setCreateSaleProfileId('');
      return;
    }

    const hasCurrent = filteredSaleProfiles.some(profile => profile.id === createSaleProfileId);
    if (!hasCurrent) {
      setCreateSaleProfileId(filteredSaleProfiles[0]?.id ?? '');
    }
  }, [createSaleProfileId, createSellerId, filteredSaleProfiles, isAdmin]);

  return (
    <div className='space-y-6'>
      <section className='rounded-2xl border border-emerald-500/25 bg-[linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.08)_42%,rgba(10,10,10,1)_100%)] p-5'>
        <p className='m-0 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200'>
          <span className='inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20'>
            🔗
          </span>
          {t('tag')}
        </p>
        <h1 className='mb-1 mt-2 text-2xl font-bold text-foreground'>{t('title')}</h1>
        <p className='m-0 text-sm text-foreground-secondary'>{t('subtitle')}</p>
      </section>

      <div className='grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]'>
        <section className='rounded-xl border border-border bg-background-secondary p-4 xl:sticky xl:top-[84px] xl:self-start'>
          <h2 className='m-0 text-base font-semibold text-foreground'>{t('create.title')}</h2>
          <p className='mb-4 mt-1 text-sm text-foreground-secondary'>{t('create.subtitle')}</p>

          <form action={createCustomerOrderLinkAction} className='space-y-3'>
            <input type='hidden' name='sellerId' value={createSellerId} />
            <input type='hidden' name='saleProfileId' value={createSaleProfileId} />
            <input type='hidden' name='expiresAt' value={createExpiresAt.toISOString()} />

            {isAdmin ? (
              <label className='block space-y-1.5'>
                <span className='text-sm text-foreground-secondary'>{t('create.seller')}</span>
                <Select
                  value={createSellerId || undefined}
                  onChange={value => setCreateSellerId(String(value))}
                  className='w-full'
                  options={createSellerOptions}
                  placeholder={t('create.sellerPlaceholder')}
                />
              </label>
            ) : null}

            <label className='block space-y-1.5'>
              <span className='text-sm text-foreground-secondary'>{t('create.profile')}</span>
              <Select
                value={createSaleProfileId || undefined}
                onChange={value => setCreateSaleProfileId(String(value))}
                className='w-full'
                options={createSaleProfileOptions}
                placeholder={t('create.profilePlaceholder')}
                disabled={!createSaleProfileOptions.length}
              />
            </label>

            <label className='block space-y-1.5'>
              <span className='text-sm text-foreground-secondary'>{t('create.expiry')}</span>
              <DatePicker
                className='w-full'
                showTime
                value={createExpiresAt}
                onChange={value => {
                  if (!value) {
                    return;
                  }
                  setCreateExpiresAt(value);
                }}
                disabledDate={current => (current ? current.isBefore(dayjs().startOf('day')) : false)}
              />
            </label>

            <button
              type='submit'
              disabled={!createSaleProfileId || !createExpiresAt}
              className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60'>
              <Link2 className='h-4 w-4' />
              {t('create.submit')}
            </button>

            <p className='m-0 text-xs text-foreground-muted'>{t('create.policy')}</p>
          </form>
        </section>

        <section className='space-y-4'>
          <div className='rounded-xl border border-border bg-background-secondary p-4'>
            <div className='mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
              <Segmented
                size='large'
                options={statusOptions}
                value={statusFilter}
                onChange={value => {
                  const nextStatus = String(value) as OrderLinkStatusFilter;
                  router.push(buildOrderLinksHref(nextStatus, searchQuery, sellerFilterValue));
                }}
              />

              <form method='get' className='flex w-full max-w-[520px] items-center gap-2'>
                {statusFilter !== 'ALL' ? <input type='hidden' name='status' value={statusFilter} /> : null}
                {sellerFilterValue ? <input type='hidden' name='sellerId' value={sellerFilterValue} /> : null}
                <div className='relative min-w-0 flex-1'>
                  <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted' />
                  <input
                    type='text'
                    name='q'
                    defaultValue={searchQuery}
                    placeholder={t('filters.searchPlaceholder')}
                    className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary pl-9 pr-3 text-sm text-foreground'
                  />
                </div>
                <button
                  type='submit'
                  className='inline-flex h-10 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600'>
                  {t('filters.apply')}
                </button>
              </form>
            </div>

            {isAdmin ? (
              <div className='mt-2 max-w-[320px]'>
                <Select
                  value={sellerFilterValue || ''}
                  onChange={value => {
                    const nextSeller = String(value);
                    setSellerFilterValue(nextSeller);
                    router.push(buildOrderLinksHref(statusFilter, searchQuery, nextSeller));
                  }}
                  className='w-full'
                  options={sellerFilterOptions}
                />
              </div>
            ) : null}
          </div>

          {!linksData.links.length ? (
            <div className='flex h-52 flex-col items-center justify-center rounded-xl border border-border bg-background-secondary text-sm text-foreground-secondary'>
              <QrCode className='mb-2 h-10 w-10 opacity-60' />
              {t('empty')}
            </div>
          ) : (
            <div className='grid gap-3'>
              {linksData.links.map(link => {
                const path = `/o/${link.token}`;
                const fullUrl = origin ? `${origin}${path}` : path;
                const statusLabel = link.isExpired ? t('status.expired') : link.isActive ? t('status.active') : t('status.inactive');

                return (
                  <article
                    key={link.id}
                    className='rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:border-primary-500/40'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='mb-1 flex flex-wrap items-center gap-2'>
                          <h3 className='m-0 text-base font-semibold text-foreground'>{link.sellerName}</h3>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusStyle(link.isActive, link.isExpired)}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className='m-0 text-sm text-foreground-secondary'>
                          {t('item.profile')}: <span className='text-foreground'>{link.saleProfileName}</span>
                        </p>
                        <p className='m-0 mt-1 text-sm text-foreground-secondary'>
                          {t('item.expiresAt')}: <span className='text-foreground'>{formatDateTime(link.expiresAt)}</span>
                        </p>
                        <p className='m-0 mt-1 text-sm text-foreground-secondary'>
                          {t('item.usage')}: <span className='text-foreground'>{link.usageCount}</span>
                        </p>
                        <p className='m-0 mt-1 max-w-full truncate text-xs text-foreground-muted'>{path}</p>
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(fullUrl);
                              message.success(t('item.copied'));
                            } catch {
                              message.error(t('item.copyFailed'));
                            }
                          }}
                          className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary transition-colors hover:text-foreground'
                          aria-label={t('item.copyAria')}>
                          <Copy className='h-4 w-4' />
                        </button>

                        <button
                          type='button'
                          onClick={() => setQrToken(link.token)}
                          className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary transition-colors hover:text-foreground'
                          aria-label={t('item.qrAria')}>
                          <QrCode className='h-4 w-4' />
                        </button>

                        <form action={toggleCustomerOrderLinkStatusAction}>
                          <input type='hidden' name='linkId' value={link.id} />
                          <button
                            type='submit'
                            className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold transition-colors ${
                              link.isActive
                                ? 'bg-zinc-500/15 text-zinc-200 hover:bg-zinc-500/25'
                                : 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                            }`}>
                            {link.isActive ? t('item.deactivate') : t('item.activate')}
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(qrToken)}
        onCancel={() => setQrToken(null)}
        footer={null}
        title={t('qrModal.title')}
        destroyOnHidden>
        <div className='flex flex-col items-center gap-3 py-2'>
          {selectedQrUrl ? <QRCodeSVG value={selectedQrUrl} size={220} bgColor='transparent' fgColor='#22c55e' /> : null}
          <p className='m-0 max-w-full break-all text-center text-xs text-foreground-secondary'>{selectedQrUrl || selectedQrPath}</p>
          <button
            type='button'
            onClick={async () => {
              if (!selectedQrUrl) {
                return;
              }

              try {
                await navigator.clipboard.writeText(selectedQrUrl);
                message.success(t('item.copied'));
              } catch {
                message.error(t('item.copyFailed'));
              }
            }}
            className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600'>
            <Copy className='h-4 w-4' />
            {t('qrModal.copy')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
