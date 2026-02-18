'use client';

import type { SellerDetailsTopProduct } from 'lib/data';
import { formatCurrency, formatKg } from 'lib/format';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

const DEFAULT_VISIBLE_COUNT = 5;
const BAR_COLORS = ['#22c55e', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'];
type SellerTopProductsSort = 'REVENUE' | 'ORDERS' | 'WEIGHT';

type SellerTopProductsCardProps = {
  products: SellerDetailsTopProduct[];
  className?: string;
};

function resolveClassName(value?: string) {
  return value ? ` ${value}` : '';
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatCompactKg(weight: number) {
  const normalized = Number.isFinite(weight) ? weight : 0;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(normalized)}kg`;
}

function getSortMetricValue(item: SellerDetailsTopProduct, sortBy: SellerTopProductsSort) {
  if (sortBy === 'ORDERS') {
    return item.orderCount;
  }
  if (sortBy === 'WEIGHT') {
    return item.totalWeightKg;
  }
  return item.totalSaleAmount;
}

export function SellerTopProductsCard({ products, className }: SellerTopProductsCardProps) {
  const t = useTranslations('customersPage');
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SellerTopProductsSort>('REVENUE');

  const sortedProducts = useMemo(() => {
    const next = [...products].sort((a, b) => {
      const metricDiff = getSortMetricValue(b, sortBy) - getSortMetricValue(a, sortBy);
      if (metricDiff !== 0) {
        return metricDiff;
      }
      if (b.totalSaleAmount !== a.totalSaleAmount) {
        return b.totalSaleAmount - a.totalSaleAmount;
      }
      return a.productName.localeCompare(b.productName);
    });
    return next.map((product, index) => ({
      ...product,
      color: BAR_COLORS[index % BAR_COLORS.length]!,
    }));
  }, [products, sortBy]);

  const maxMetricValue = useMemo(
    () => sortedProducts.reduce((current, item) => Math.max(current, getSortMetricValue(item, sortBy)), 0),
    [sortedProducts, sortBy],
  );

  const visibleProducts = isExpanded ? sortedProducts : sortedProducts.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <article className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background-secondary p-4${resolveClassName(className)}`}>
      <h3 className='m-0 text-sm font-semibold text-foreground'>{t('sellers.details.topProductsTitle')}</h3>
      <p className='m-0 mt-1 text-xs text-foreground-secondary'>{t('sellers.details.charts.topProductsHint')}</p>

      {!sortedProducts.length ? (
        <div className='mt-3 flex h-28 items-center justify-center rounded-lg border border-border bg-background-tertiary text-xs text-foreground-muted'>
          {t('sellers.details.emptyProducts')}
        </div>
      ) : (
        <>
          <div className='mt-2 flex items-center gap-1.5 overflow-x-auto pb-1'>
            <span className='shrink-0 text-[11px] text-foreground-muted'>{t('sellers.details.charts.sortByLabel')}</span>
            {([
              ['REVENUE', t('sellers.details.charts.sortRevenue')],
              ['ORDERS', t('sellers.details.charts.sortOrders')],
              ['WEIGHT', t('sellers.details.charts.sortWeight')],
            ] as const).map(([value, label]) => {
              const active = sortBy === value;
              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => setSortBy(value)}
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    active
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                      : 'border-border bg-background-tertiary text-foreground-secondary hover:text-foreground'
                  }`}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className='mt-3 min-h-0 flex-1 overflow-y-auto pr-1'>
            <div className='space-y-2.5'>
              {visibleProducts.map(item => {
                const widthPercent = maxMetricValue > 0 ? (getSortMetricValue(item, sortBy) / maxMetricValue) * 100 : 0;
                return (
                  <div key={item.productId}>
                    <div className='mb-1 flex min-w-0 items-center gap-2 overflow-x-auto text-[11px]'>
                      <span className='min-w-[88px] flex-1 truncate font-medium text-foreground'>{item.productName}</span>
                      <span className='shrink-0 whitespace-nowrap text-[10px] text-foreground-muted'>
                        {locale === 'vi' ? `${item.orderCount} đơn` : `${item.orderCount} orders`}
                      </span>
                      <span className='shrink-0 whitespace-nowrap text-[10px] text-sky-200' title={formatKg(item.totalWeightKg)}>
                        {formatCompactKg(item.totalWeightKg)}
                      </span>
                      <span className='shrink-0 whitespace-nowrap font-medium tracking-tight text-amber-200' title={formatCurrency(item.totalSaleAmount)}>
                        {formatCompactCurrency(item.totalSaleAmount)}
                      </span>
                      <span className='shrink-0 whitespace-nowrap font-semibold tracking-tight text-emerald-300' title={formatCurrency(item.totalProfitAmount)}>
                        {formatCompactCurrency(item.totalProfitAmount)}
                      </span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-background-tertiary'>
                      <div className='h-full rounded-full transition-[width]' style={{ width: `${widthPercent}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {sortedProducts.length > DEFAULT_VISIBLE_COUNT ? (
            <div className='mt-3 border-t border-border pt-3'>
              <button
                type='button'
                onClick={() => setIsExpanded(value => !value)}
                className='rounded-md border border-border bg-background-tertiary px-2.5 py-1 text-xs font-medium text-foreground-secondary transition-colors hover:text-foreground'>
                {isExpanded
                  ? t('sellers.details.charts.showTopProducts', { count: DEFAULT_VISIBLE_COUNT })
                  : t('sellers.details.charts.showAllProducts', { count: sortedProducts.length })}
              </button>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
