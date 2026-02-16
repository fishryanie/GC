import { InsightDonutChartCard, InsightHorizontalBarsCard, InsightLineChartCard } from '@/app/(admin)/components/insight-charts';
import { requireAuthSession } from 'lib/auth';
import { getCustomerDetailsPageData } from 'lib/data';
import { formatCurrency, formatDate, formatDateTime, formatKg } from 'lib/format';
import { ArrowLeft, Boxes, CheckCircle2, ClipboardList, Clock3, Coins, HandCoins, ShoppingCart, Truck, User, Users, Wallet } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CustomerMetricCard } from './components/customer-metric-card';

export default async function CustomerDetailsPage({ params }: { params: Promise<{ customerId: string }> | { customerId: string } }) {
  const { customerId } = await params;
  await requireAuthSession();

  const [t, tStatuses, details] = await Promise.all([getTranslations('customersPage'), getTranslations('statuses'), getCustomerDetailsPageData(customerId)]);

  if (!details.customer) {
    notFound();
  }

  const { customer, stats, monthlyPerformance, topProducts, sellerContributions, recentOrders } = details;
  const chartPalette = ['#22c55e', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'];
  const monthlySpentTrend = monthlyPerformance.map(point => ({
    label: `${String(point.month).padStart(2, '0')}/${point.year}`,
    value: point.totalSpentAmount,
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
  const collectionFlowBreakdown = [
    {
      label: tStatuses('collection.UNPAID'),
      value: stats.unpaidOrders,
      color: '#71717a',
    },
    {
      label: tStatuses('collection.PARTIALLY_PAID'),
      value: stats.partiallyPaidOrders,
      color: '#f59e0b',
    },
    {
      label: tStatuses('collection.PAID_IN_FULL'),
      value: stats.paidInFullOrders,
      color: '#22c55e',
    },
    {
      label: tStatuses('collection.REFUNDED'),
      value: stats.refundedOrders,
      color: '#ef4444',
    },
  ];
  const sellerContributionBars = sellerContributions.slice(0, 6).map((seller, index) => ({
    label: seller.sellerName,
    value: seller.totalSpentAmount,
    color: chartPalette[index % chartPalette.length]!,
  }));
  const topProductsBars = topProducts.slice(0, 6).map((product, index) => ({
    label: product.productName,
    value: product.totalSpentAmount,
    color: chartPalette[index % chartPalette.length]!,
  }));

  return (
    <div className='space-y-5'>
      <section className='rounded-2xl border border-primary-500/25 bg-[linear-gradient(135deg,rgba(34,197,94,0.14),rgba(15,23,42,0.14)_45%,rgba(10,10,10,1)_100%)] p-5'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <Link
            href='/customers?tab=customers'
            className='inline-flex items-center gap-1 rounded-lg border border-border bg-background-secondary/85 px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
            <ArrowLeft className='h-4 w-4' />
            {t('customers.details.backToCustomers')}
          </Link>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              customer.isActive ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-200' : 'border border-zinc-500/35 bg-zinc-500/20 text-zinc-300'
            }`}>
            {customer.isActive ? t('filters.active') : t('filters.inactive')}
          </span>
        </div>

        <p className='m-0 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted'>{t('customers.details.tag')}</p>
        <h1 className='m-0 mt-2 text-3xl font-bold text-foreground'>{customer.name}</h1>
        <p className='m-0 mt-1 text-sm text-foreground-secondary'>
          {customer.phone}
          {customer.email ? ` • ${customer.email}` : ''}
        </p>
        <p className='m-0 mt-2 text-xs text-foreground-muted'>
          {customer.lastOrderAt ? t('customers.item.lastOrder', { value: formatDateTime(customer.lastOrderAt) }) : t('customers.item.noOrder')}
        </p>
      </section>

      <section className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5'>
        <CustomerMetricCard
          label={t('customers.details.cards.totalOrders')}
          value={stats.totalOrders}
          hint={t('customers.details.cards.activeDays', { count: stats.daysActiveWithOrders })}
          icon={<ShoppingCart className='h-4 w-4 text-emerald-300' />}
          tone='emerald'
        />
        <CustomerMetricCard
          label={t('customers.details.cards.totalSpent')}
          value={formatCurrency(stats.totalSpentAmount)}
          hint={t('customers.details.cards.avgOrder', { amount: formatCurrency(stats.averageOrderAmount) })}
          icon={<Wallet className='h-4 w-4 text-sky-300' />}
          tone='sky'
        />
        <CustomerMetricCard
          label={t('customers.details.cards.totalWeight')}
          value={formatKg(stats.totalWeightKg)}
          hint={t('customers.details.cards.uniqueSellers', { count: stats.uniqueSellerCount })}
          icon={<Boxes className='h-4 w-4 text-amber-300' />}
          tone='amber'
        />
        <CustomerMetricCard
          label={t('customers.details.cards.profit')}
          value={formatCurrency(stats.totalProfitAmount)}
          hint={t('customers.details.cards.pendingApproval', { count: stats.pendingApprovalOrders })}
          icon={<Coins className='h-4 w-4 text-violet-300' />}
          tone='violet'
        />
        <CustomerMetricCard
          label={t('customers.details.cards.unpaid')}
          value={stats.unpaidOrders}
          hint={t('customers.details.cards.partiallyPaid', { count: stats.partiallyPaidOrders })}
          icon={<HandCoins className='h-4 w-4 text-zinc-200' />}
          tone='zinc'
        />
      </section>

      <section className='grid gap-4 xl:grid-cols-2'>
        <InsightLineChartCard
          title={t('customers.details.charts.spentTrendTitle')}
          subtitle={t('customers.details.charts.spentTrendHint')}
          data={monthlySpentTrend}
          color='#22c55e'
          valueFormatter={formatCurrency}
          emptyLabel={t('customers.details.charts.empty')}
        />
        <InsightLineChartCard
          title={t('customers.details.charts.profitTrendTitle')}
          subtitle={t('customers.details.charts.profitTrendHint')}
          data={monthlyProfitTrend}
          color='#38bdf8'
          valueFormatter={formatCurrency}
          emptyLabel={t('customers.details.charts.empty')}
        />
      </section>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <InsightDonutChartCard
          title={t('customers.details.orderFlowTitle')}
          subtitle={t('customers.details.charts.orderFlowHint')}
          data={orderFlowBreakdown}
          valueFormatter={value => value.toLocaleString('en-US')}
          emptyLabel={t('customers.details.charts.empty')}
        />
        <InsightDonutChartCard
          title={t('customers.details.collectionFlowTitle')}
          subtitle={t('customers.details.charts.collectionFlowHint')}
          data={collectionFlowBreakdown}
          valueFormatter={value => value.toLocaleString('en-US')}
          emptyLabel={t('customers.details.charts.empty')}
        />
        <InsightHorizontalBarsCard
          title={t('customers.details.sellerContributionTitle')}
          subtitle={t('customers.details.charts.sellerContributionHint')}
          data={sellerContributionBars}
          valueFormatter={formatCurrency}
          emptyLabel={t('customers.details.charts.empty')}
        />
        <InsightHorizontalBarsCard
          title={t('customers.details.topProductsTitle')}
          subtitle={t('customers.details.charts.topProductsHint')}
          data={topProductsBars}
          valueFormatter={formatCurrency}
          emptyLabel={t('customers.details.charts.empty')}
        />
      </section>

      <section className='grid gap-4 xl:grid-cols-2'>
        <article className='rounded-xl border border-border bg-background-secondary p-4'>
          <h3 className='m-0 mb-3 text-sm font-semibold text-foreground'>{t('customers.details.topProductsTitle')}</h3>
          {!topProducts.length ? (
            <p className='m-0 text-sm text-foreground-secondary'>{t('customers.details.emptyProducts')}</p>
          ) : (
            <div className='space-y-2'>
              {topProducts.map(product => (
                <div key={product.productId} className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <p className='m-0 text-sm font-medium text-foreground'>{product.productName}</p>
                  <div className='mt-1 flex flex-wrap gap-3 text-xs text-foreground-secondary'>
                    <span>{t('customers.details.orders', { count: product.orderCount })}</span>
                    <span>{formatKg(product.totalWeightKg)}</span>
                    <span>{formatCurrency(product.totalSpentAmount)}</span>
                    <span className='text-emerald-300'>{formatCurrency(product.totalProfitAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className='rounded-xl border border-border bg-background-secondary p-4'>
          <h3 className='m-0 mb-3 text-sm font-semibold text-foreground'>{t('customers.details.sellerContributionListTitle')}</h3>
          {!sellerContributions.length ? (
            <p className='m-0 text-sm text-foreground-secondary'>{t('customers.details.emptySellerContributions')}</p>
          ) : (
            <div className='space-y-2'>
              {sellerContributions.map(seller => (
                <div key={`${seller.sellerId}-${seller.sellerName}-full`} className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <p className='m-0 text-sm font-medium text-foreground'>{seller.sellerName}</p>
                    <span className='text-xs text-foreground-secondary'>{t('customers.details.orders', { count: seller.orderCount })}</span>
                  </div>
                  <div className='mt-1 flex flex-wrap gap-3 text-xs text-foreground-secondary'>
                    <span>{formatCurrency(seller.totalSpentAmount)}</span>
                    <span className='text-emerald-300'>{formatCurrency(seller.totalProfitAmount)}</span>
                    {seller.lastOrderAt ? <span>{formatDate(seller.lastOrderAt)}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className='rounded-xl border border-border bg-background-secondary p-4'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='m-0 text-sm font-semibold text-foreground'>{t('customers.details.recentOrdersTitle')}</h3>
          <Link
            href={`/orders?q=${encodeURIComponent(customer.name)}`}
            className='inline-flex items-center gap-1 rounded-lg border border-border bg-background-tertiary px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
            <ClipboardList className='h-4 w-4' />
            {t('customers.details.viewCustomerOrders')}
          </Link>
        </div>

        {!recentOrders.length ? (
          <p className='m-0 text-sm text-foreground-secondary'>{t('customers.details.emptyOrders')}</p>
        ) : (
          <div className='space-y-2'>
            {recentOrders.map(order => (
              <article key={order.id} className='rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div>
                    <p className='m-0 text-sm font-semibold text-foreground'>
                      {order.code} • {order.sellerName}
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
                    {t('customers.details.products', { count: order.items.length })}
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
                  <span className='inline-flex items-center gap-1'>
                    <User className='h-3.5 w-3.5' />
                    {order.sellerName}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className='rounded-xl border border-border bg-background-secondary p-4 text-xs text-foreground-muted'>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='inline-flex items-center gap-1'>
            <Users className='h-4 w-4' />
            {t('customers.details.cards.uniqueSellers', { count: stats.uniqueSellerCount })}
          </span>
          {stats.firstOrderAt ? <span>{t('customers.details.firstOrderAt', { value: formatDateTime(stats.firstOrderAt) })}</span> : null}
          {stats.lastOrderAt ? <span>{t('customers.details.lastOrderAt', { value: formatDateTime(stats.lastOrderAt) })}</span> : null}
        </div>
      </section>
    </div>
  );
}
