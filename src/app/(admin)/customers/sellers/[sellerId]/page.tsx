import { InsightDonutChartCard } from '@/app/(admin)/components/insight-charts';
import { requireAuthSession } from 'lib/auth';
import { getSellerDetailsPageData, getSellerTrendChartData } from 'lib/data';
import { formatCurrency, formatDateTime, formatKg } from 'lib/format';
import { ArrowLeft, BarChart3, ClipboardList, Coins, Shield, ShoppingCart, Wallet } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SellerMetricCard } from './components/seller-metric-card';
import { SellerRecentOrdersTable } from './components/seller-recent-orders-table';
import { SellerTopProductsCard } from './components/seller-top-products-card';
import { SellerTrendSection } from './components/seller-trend-section';

export default async function SellerDetailsPage({ params }: { params: Promise<{ sellerId: string }> | { sellerId: string } }) {
  const { sellerId } = await params;
  const session = await requireAuthSession();

  if (session.seller.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [t, tStatuses, details, initialTrendData] = await Promise.all([
    getTranslations('customersPage'),
    getTranslations('statuses'),
    getSellerDetailsPageData(sellerId),
    getSellerTrendChartData(sellerId, { granularity: 'DAILY' }),
  ]);

  if (!details.seller) {
    notFound();
  }

  const { seller, stats, topProducts, recentOrders, activeSaleProfiles, latestSaleProfiles } = details;
  const orderFlowBreakdown = [
    {
      label: tStatuses('fulfillment.PENDING_APPROVAL'),
      value: stats.pendingApprovalOrders,
      color: '#f59e0b',
    },
    {
      label: tStatuses('fulfillment.DELIVERING'),
      value: stats.deliveringOrders,
      color: '#6366f1',
    },
    {
      label: tStatuses('fulfillment.DELIVERED'),
      value: stats.deliveredOrders,
      color: '#22c55e',
    },
    {
      label: tStatuses('fulfillment.CANCELED'),
      value: stats.canceledOrders,
      color: '#ef4444',
    },
  ];
  const capitalFlowBreakdown = [
    {
      label: tStatuses('supplierPayment.UNPAID_SUPPLIER'),
      value: stats.unpaidSupplierOrders,
      color: '#f59e0b',
    },
    {
      label: tStatuses('supplierPayment.SUPPLIER_PAID'),
      value: stats.supplierPaidOrders,
      color: '#0ea5e9',
    },
    {
      label: tStatuses('supplierPayment.CAPITAL_CYCLE_COMPLETED'),
      value: stats.capitalCycleCompletedOrders,
      color: '#22c55e',
    },
  ];
  const collectionFlowBreakdown = [
    {
      label: tStatuses('collection.UNPAID'),
      value: stats.unpaidCollectionOrders,
      color: '#71717a',
    },
    {
      label: tStatuses('collection.PARTIALLY_PAID'),
      value: stats.partialCollectionOrders,
      color: '#f59e0b',
    },
    {
      label: tStatuses('collection.PAID_IN_FULL'),
      value: stats.paidCollectionOrders,
      color: '#22c55e',
    },
    {
      label: tStatuses('collection.REFUNDED'),
      value: stats.refundedOrders,
      color: '#ef4444',
    },
  ];
  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-primary-500/25 bg-[linear-gradient(135deg,rgba(34,197,94,0.16),rgba(15,23,42,0.15)_45%,rgba(10,10,10,1)_100%)] p-5'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <Link
            href='/customers?tab=sellers'
            className='inline-flex items-center gap-1 rounded-lg border border-border bg-background-secondary/85 px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
            <ArrowLeft className='h-4 w-4' />
            {t('sellers.details.backToSellers')}
          </Link>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              seller.isEnabled ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-200' : 'border border-zinc-500/35 bg-zinc-500/20 text-zinc-300'
            }`}>
            {seller.isEnabled ? t('filters.enabled') : t('filters.disabled')}
          </span>
        </div>

        <p className='m-0 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted'>{t('sellers.details.tag')}</p>
        <h1 className='m-0 mt-2 text-3xl font-bold text-foreground'>{seller.name}</h1>
        <p className='m-0 mt-1 text-sm text-foreground-secondary'>
          {seller.email} • {seller.role === 'ADMIN' ? t('filters.roleAdmin') : t('filters.roleSeller')}
        </p>
        <p className='m-0 mt-2 text-xs text-foreground-muted'>
          {seller.lastLoginAt ? t('sellers.lastLogin', { value: formatDateTime(seller.lastLoginAt) }) : t('sellers.noLogin')}
        </p>
      </section>

      <section className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5'>
        <SellerMetricCard
          label={t('sellers.details.cards.totalOrders')}
          value={stats.totalOrders}
          hint={t('sellers.details.cards.activeDays', { count: stats.daysActiveWithOrders })}
          icon={<ShoppingCart className='h-4 w-4 text-emerald-300' />}
          tone='emerald'
        />
        <SellerMetricCard
          label={t('sellers.details.cards.revenue')}
          value={formatCurrency(stats.totalSaleAmount)}
          hint={t('sellers.details.cards.avgOrder', { amount: formatCurrency(stats.averageOrderAmount) })}
          icon={<Wallet className='h-4 w-4 text-sky-300' />}
          tone='sky'
        />
        <SellerMetricCard
          label={t('sellers.details.cards.cost')}
          value={formatCurrency(stats.totalCostAmount)}
          hint={t('sellers.details.cards.weight', { value: formatKg(stats.totalWeightKg) })}
          icon={<Coins className='h-4 w-4 text-amber-300' />}
          tone='amber'
        />
        <SellerMetricCard
          label={t('sellers.details.cards.profit')}
          value={formatCurrency(stats.totalProfitAmount)}
          hint={t('sellers.details.cards.pendingApproval', { count: stats.pendingApprovalOrders })}
          icon={<BarChart3 className='h-4 w-4 text-violet-300' />}
          tone='violet'
        />
        <SellerMetricCard
          label={t('sellers.details.cards.discountRequests')}
          value={stats.discountRequestedOrders}
          hint={t('sellers.details.cards.discountApproved', { count: stats.discountApprovedOrders })}
          icon={<Shield className='h-4 w-4 text-zinc-200' />}
          tone='zinc'
        />
      </section>

      <section className='grid gap-4 xl:grid-cols-3'>
        <InsightDonutChartCard
          title={t('sellers.details.orderFlowTitle')}
          subtitle={t('sellers.details.charts.orderFlowHint')}
          data={orderFlowBreakdown}
          valueFormatter={value => value.toLocaleString('en-US')}
          emptyLabel={t('sellers.details.charts.empty')}
        />
        <InsightDonutChartCard
          title={t('sellers.details.capitalFlowTitle')}
          subtitle={t('sellers.details.charts.capitalFlowHint')}
          data={capitalFlowBreakdown}
          valueFormatter={value => value.toLocaleString('en-US')}
          emptyLabel={t('sellers.details.charts.empty')}
        />
        <InsightDonutChartCard
          title={t('sellers.details.collectionFlowTitle')}
          subtitle={t('sellers.details.charts.collectionFlowHint')}
          data={collectionFlowBreakdown}
          valueFormatter={value => value.toLocaleString('en-US')}
          emptyLabel={t('sellers.details.charts.empty')}
        />
      </section>

      <section className='grid items-stretch gap-4 xl:grid-cols-3'>
        <SellerTrendSection sellerId={seller.id} initialData={initialTrendData} className='xl:h-[24rem]' />
        <SellerTopProductsCard products={topProducts} className='xl:col-span-1 xl:h-[24rem]' />
      </section>

      <section className='grid gap-4'>
        <article className='rounded-xl border border-border bg-background-secondary p-4'>
          <h3 className='m-0 mb-3 text-sm font-semibold text-foreground'>{t('sellers.details.saleProfilesTitle')}</h3>
          {!activeSaleProfiles.length && !latestSaleProfiles.length ? (
            <p className='m-0 text-sm text-foreground-secondary'>{t('sellers.details.emptyProfiles')}</p>
          ) : (
            <div className='space-y-3'>
              <div>
                <p className='m-0 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground-muted'>{t('sellers.details.activeProfiles')}</p>
                {activeSaleProfiles.length ? (
                  <div className='space-y-2'>
                    {activeSaleProfiles.map(profile => (
                      <div key={profile.id} className='rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs'>
                        <p className='m-0 font-medium text-emerald-100'>{profile.name}</p>
                        <p className='m-0 mt-1 text-emerald-200'>{t('sellers.details.products', { count: profile.items.length })}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='m-0 text-xs text-foreground-secondary'>{t('sellers.details.noActiveProfiles')}</p>
                )}
              </div>

              <div>
                <p className='m-0 mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground-muted'>{t('sellers.details.latestProfiles')}</p>
                {latestSaleProfiles.length ? (
                  <div className='space-y-2'>
                    {latestSaleProfiles.map(profile => (
                      <div key={profile.id} className='rounded-lg border border-border bg-background-tertiary px-3 py-2 text-xs'>
                        <p className='m-0 font-medium text-foreground'>{profile.name}</p>
                        <p className='m-0 mt-1 text-foreground-secondary'>
                          {t('sellers.details.profileUpdated', { value: formatDateTime(profile.updatedAt) })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='m-0 text-xs text-foreground-secondary'>{t('sellers.details.emptyProfiles')}</p>
                )}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className='rounded-xl border border-border bg-background-secondary p-4'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='m-0 text-sm font-semibold text-foreground'>{t('sellers.details.recentOrdersTitle')}</h3>
          <Link
            href={`/orders?sellerId=${seller.id}`}
            className='inline-flex items-center gap-1 rounded-lg border border-border bg-background-tertiary px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
            <ClipboardList className='h-4 w-4' />
            {t('sellers.details.viewSellerOrders')}
          </Link>
        </div>

        {!recentOrders.length ? (
          <p className='m-0 text-sm text-foreground-secondary'>{t('sellers.details.emptyOrders')}</p>
        ) : (
          <SellerRecentOrdersTable orders={recentOrders} canViewCost />
        )}
      </section>
    </div>
  );
}
