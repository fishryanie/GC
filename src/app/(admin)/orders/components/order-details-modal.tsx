'use client';

import { formatCurrency, formatDate, formatDateTime, formatKg } from 'lib/format';
import { Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { OrderView } from 'types';

type OrderDetailsModalProps = {
  order: OrderView;
  canViewCost: boolean;
  isAdmin: boolean;
  compact?: boolean;
};

export function OrderDetailsModal({ order, canViewCost, isAdmin, compact = false }: OrderDetailsModalProps) {
  const t = useTranslations('ordersPage');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        title={t('details.open')}
        aria-label={t('details.open')}
        className={`inline-flex h-8 items-center rounded-lg border border-border bg-background-tertiary text-xs font-semibold text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground ${
          compact ? 'w-8 justify-center px-0' : 'gap-1 px-2.5'
        }`}>
        <Eye className='h-3.5 w-3.5' />
        {compact ? null : t('details.open')}
      </button>

      {open ? (
        <div className='fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 p-4'>
          <article className='w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-background-secondary shadow-2xl'>
            <header className='flex items-start justify-between gap-3 border-b border-border bg-background-tertiary px-4 py-3'>
              <div>
                <p className='m-0 inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-200'>
                  {order.code}
                </p>
                <h4 className='m-0 mt-1 text-base font-semibold text-foreground'>{t('details.title')}</h4>
                <p className='m-0 mt-1 text-xs text-foreground-secondary'>{t('details.subtitle', { createdAt: formatDateTime(order.createdAt) })}</p>
              </div>

              <button
                type='button'
                onClick={() => setOpen(false)}
                className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-secondary text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                aria-label={t('details.close')}>
                <X className='h-4 w-4' />
              </button>
            </header>

            <div className='max-h-[80vh] overflow-auto p-4'>
              <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-5'>
                <article className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <p className='m-0 text-[11px] text-foreground-muted'>{t('table.buyer')}</p>
                  <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{order.customerName || order.buyerName}</p>
                </article>

                {isAdmin ? (
                  <article className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                    <p className='m-0 text-[11px] text-foreground-muted'>{t('table.sellerColumn')}</p>
                    <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{order.sellerName || t('table.systemSeller')}</p>
                  </article>
                ) : null}

                <article className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <p className='m-0 text-[11px] text-foreground-muted'>{t('table.deliveryDate')}</p>
                  <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{formatDate(order.deliveryDate)}</p>
                </article>

                <article className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <p className='m-0 text-[11px] text-foreground-muted'>{t('details.labels.saleProfile')}</p>
                  <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{order.saleProfile.profileName}</p>
                </article>

                <article className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <p className='m-0 text-[11px] text-foreground-muted'>{t('details.labels.costProfile')}</p>
                  <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{order.costProfile.profileName}</p>
                </article>
              </div>

              <div className='mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <article className='rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2'>
                  <p className='m-0 text-[11px] text-violet-200'>{t('details.labels.bill')}</p>
                  <p className='m-0 mt-1 text-sm font-semibold text-violet-100'>{formatCurrency(order.totalSaleAmount)}</p>
                </article>

                <article className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <p className='m-0 text-[11px] text-foreground-muted'>{t('details.labels.baseSale')}</p>
                  <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{formatCurrency(order.baseSaleAmount)}</p>
                </article>

                {canViewCost ? (
                  <>
                    <article className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                      <p className='m-0 text-[11px] text-foreground-muted'>{t('details.labels.cost')}</p>
                      <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{formatCurrency(order.totalCostAmount)}</p>
                    </article>

                    <article className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2'>
                      <p className='m-0 text-[11px] text-emerald-200'>{t('details.labels.profit')}</p>
                      <p className='m-0 mt-1 text-sm font-semibold text-emerald-100'>{formatCurrency(order.totalProfitAmount)}</p>
                    </article>
                  </>
                ) : null}
              </div>

              {order.discountRequest.status === 'PENDING' ? (
                <p className='m-0 mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200'>
                  {t('table.discountPending', {
                    percent: order.discountRequest.requestedPercent.toFixed(1),
                    requested: formatCurrency(order.discountRequest.requestedSaleAmount),
                  })}
                </p>
              ) : null}

              <div className='mt-4 overflow-hidden rounded-lg border border-border'>
                <table className='w-full min-w-[760px] border-collapse'>
                  <thead>
                    <tr className='border-b border-border bg-background-tertiary'>
                      <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('table.products')}</th>
                      <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('details.labels.weightKg')}</th>
                      <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('details.labels.lineTotal')}</th>
                      {canViewCost ? (
                        <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('details.labels.profit')}</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={`${order.id}-${item.productId}`} className='border-b border-border/70 last:border-b-0'>
                        <td className='px-3 py-2'>
                          <p className='m-0 text-sm text-foreground'>{item.productName}</p>
                          <p className='m-0 mt-0.5 text-[11px] text-foreground-muted'>{formatCurrency(item.salePricePerKg)} / kg</p>
                        </td>
                        <td className='px-3 py-2 text-sm text-foreground-secondary'>{formatKg(item.weightKg)}</td>
                        <td className='px-3 py-2 text-sm text-foreground'>{formatCurrency(item.lineSaleTotal)}</td>
                        {canViewCost ? <td className='px-3 py-2 text-sm text-emerald-300'>{formatCurrency(item.lineProfit)}</td> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
