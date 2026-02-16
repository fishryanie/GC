import { InsightDonutChartCard, InsightHorizontalBarsCard, InsightLineChartCard } from '@/app/(admin)/components/insight-charts';
import { requireAuthSession } from 'lib/auth';
import { getSellerDetailsPageData } from 'lib/data';
import { formatCurrency, formatDate, formatDateTime, formatKg } from 'lib/format';
import { ArrowLeft, BarChart3, Boxes, CheckCircle2, ClipboardList, Clock3, Coins, Shield, ShoppingCart, Truck, Wallet } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SellerMetricCard } from './components/seller-metric-card';

export default async function SellerDetailsPage({ params }: { params: Promise<{ sellerId: string }> | { sellerId: string } }) {
  const { sellerId } = await params;
  const session = await requireAuthSession();

  if (session.seller.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [t, tStatuses, details] = await Promise.all([getTranslations('customersPage'), getTranslations('statuses'), getSellerDetailsPageData(sellerId)]);

  if (!details.seller) {
    notFound();
  }

  const { seller, stats, monthlyPerformance, topProducts, recentOrders, activeSaleProfiles, latestSaleProfiles } = details;
  const productChartPalette = ['#22c55e', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'];
  const monthlyRevenueTrend = monthlyPerformance.map(point => ({
    label: `${String(point.month).padStart(2, '0')}/${point.year}`,
    value: point.totalSaleAmount,
  }));
  const monthlyProfitTrend = monthlyPerformance.map(point => ({
    label: `${String(point.month).padStart(2, '0')}/${point.year}`,
    value: point.totalProfitAmount,
  }));
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
  const topProductsBars = topProducts.slice(0, 6).map((product, index) => ({
    label: product.productName,
    value: product.totalSaleAmount,
    color: productChartPalette[index % productChartPalette.length]!,
  }));

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

      <section className='grid gap-4 xl:grid-cols-2'>
        <InsightLineChartCard
          title={t('sellers.details.charts.revenueTrendTitle')}
          subtitle={t('sellers.details.charts.revenueTrendHint')}
          data={monthlyRevenueTrend}
          color='#22c55e'
          valueFormatter={formatCurrency}
          emptyLabel={t('sellers.details.charts.empty')}
        />
        <InsightLineChartCard
          title={t('sellers.details.charts.profitTrendTitle')}
          subtitle={t('sellers.details.charts.profitTrendHint')}
          data={monthlyProfitTrend}
          color='#38bdf8'
          valueFormatter={formatCurrency}
          emptyLabel={t('sellers.details.charts.empty')}
        />
      </section>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
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
        <InsightHorizontalBarsCard
          title={t('sellers.details.topProductsTitle')}
          subtitle={t('sellers.details.charts.topProductsHint')}
          data={topProductsBars}
          valueFormatter={formatCurrency}
          emptyLabel={t('sellers.details.charts.empty')}
        />
      </section>

      <section className='grid gap-4 xl:grid-cols-2'>
        <article className='rounded-xl border border-border bg-background-secondary p-4'>
          <h3 className='m-0 mb-3 text-sm font-semibold text-foreground'>{t('sellers.details.topProductsTitle')}</h3>
          {!topProducts.length ? (
            <p className='m-0 text-sm text-foreground-secondary'>{t('sellers.details.emptyProducts')}</p>
          ) : (
            <div className='space-y-2'>
              {topProducts.map(product => (
                <div key={product.productId} className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <p className='m-0 text-sm font-medium text-foreground'>{product.productName}</p>
                  <div className='mt-1 flex flex-wrap gap-3 text-xs text-foreground-secondary'>
                    <span>{t('sellers.details.orders', { count: product.orderCount })}</span>
                    <span>{formatKg(product.totalWeightKg)}</span>
                    <span>{formatCurrency(product.totalSaleAmount)}</span>
                    <span className='text-emerald-300'>{formatCurrency(product.totalProfitAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

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
          <div className='space-y-2'>
            {recentOrders.map(order => (
              <article key={order.id} className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div>
                    <p className='m-0 text-sm font-semibold text-foreground'>
                      {order.code} • {order.customerName}
                    </p>
                    <p className='m-0 mt-1 text-xs text-foreground-secondary'>
                      {formatDate(order.deliveryDate)} • {formatKg(order.totalWeightKg)} • {formatCurrency(order.totalSaleAmount)}
                    </p>
                  </div>

                  <div className='flex flex-wrap gap-1 text-[11px]'>
                    <span className='rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-200'>
                      {tStatuses(`fulfillment.${order.fulfillmentStatus}`)}
                    </span>
                    <span className='rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-200'>
                      {tStatuses(`supplierPayment.${order.supplierPaymentStatus}`)}
                    </span>
                    <span className='rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2 py-0.5 text-zinc-200'>
                      {tStatuses(`collection.${order.collectionStatus}`)}
                    </span>
                  </div>
                </div>

                <div className='mt-2 flex flex-wrap gap-2 text-[11px] text-foreground-muted'>
                  <span className='inline-flex items-center gap-1'>
                    <Clock3 className='h-3.5 w-3.5' />
                    {formatDateTime(order.createdAt)}
                  </span>
                  <span className='inline-flex items-center gap-1'>
                    <Truck className='h-3.5 w-3.5' />
                    {t('sellers.details.products', { count: order.items.length })}
                  </span>
                  <span className='inline-flex items-center gap-1'>
                    <Boxes className='h-3.5 w-3.5' />
                    {order.items
                      .slice(0, 2)
                      .map(item => item.productName)
                      .join(', ')}
                    {order.items.length > 2 ? '...' : ''}
                  </span>
                  <span className='inline-flex items-center gap-1 text-emerald-300'>
                    <CheckCircle2 className='h-3.5 w-3.5' />
                    {formatCurrency(order.totalProfitAmount)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
