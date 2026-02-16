import { InsightDonutChartCard, InsightHorizontalBarsCard, InsightLineChartCard } from '@/app/(admin)/components/insight-charts';
import { reviewOrderApprovalAction } from '@/app/(admin)/orders/actions';
import { OrderDetailsModal } from '@/app/(admin)/orders/components/order-details-modal';
import { OrderStatusInlineForm } from '@/app/(admin)/orders/components/order-status-inline-form';
import { OrdersFilters } from '@/app/(admin)/orders/components/orders-filters';
import { requireAuthSession } from 'lib/auth';
import { COLLECTION_STATUSES, ORDER_FULFILLMENT_STATUSES, SUPPLIER_PAYMENT_STATUSES } from 'lib/constants';
import { getOrdersPageData, listSellers } from 'lib/data';
import { formatCurrency, formatDate } from 'lib/format';
import { resolveSearchParams } from 'lib/search-params';
import { CheckCircle, Clock, Download, Receipt, Search, TrendingUp } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await resolveSearchParams(searchParams);
  const tPage = await getTranslations('ordersPage');
  const session = await requireAuthSession();
  const isAdmin = session.seller.role === 'ADMIN';
  const canViewCost = isAdmin;

  const fulfillmentStatusFilterRaw = getSearchValue(params.fulfillmentStatus);
  const supplierPaymentStatusFilterRaw = getSearchValue(params.supplierPaymentStatus);
  const collectionStatusFilterRaw = getSearchValue(params.collectionStatus);
  const sellerFilterRaw = getSearchValue(params.sellerId);
  const deliveryYearFilterRaw = getSearchValue(params.deliveryYear);
  const deliveryMonthFilterRaw = getSearchValue(params.deliveryMonth);
  const deliveryDayFilterRaw = getSearchValue(params.deliveryDay);
  const searchQuery = getSearchValue(params.q).trim();

  const fulfillmentStatusFilter = ORDER_FULFILLMENT_STATUSES.includes(fulfillmentStatusFilterRaw as (typeof ORDER_FULFILLMENT_STATUSES)[number])
    ? (fulfillmentStatusFilterRaw as (typeof ORDER_FULFILLMENT_STATUSES)[number])
    : '';

  const supplierPaymentStatusFilter = SUPPLIER_PAYMENT_STATUSES.includes(supplierPaymentStatusFilterRaw as (typeof SUPPLIER_PAYMENT_STATUSES)[number])
    ? (supplierPaymentStatusFilterRaw as (typeof SUPPLIER_PAYMENT_STATUSES)[number])
    : '';

  const collectionStatusFilter = COLLECTION_STATUSES.includes(collectionStatusFilterRaw as (typeof COLLECTION_STATUSES)[number])
    ? (collectionStatusFilterRaw as (typeof COLLECTION_STATUSES)[number])
    : '';

  const deliveryYearFilter = Number.parseInt(deliveryYearFilterRaw, 10);
  const deliveryMonthFilter = Number.parseInt(deliveryMonthFilterRaw, 10);
  const deliveryDayFilter = Number.parseInt(deliveryDayFilterRaw, 10);

  const normalizedYearFilter = Number.isFinite(deliveryYearFilter) ? deliveryYearFilter : undefined;
  const normalizedMonthFilter = Number.isFinite(deliveryMonthFilter) && deliveryMonthFilter >= 1 && deliveryMonthFilter <= 12 ? deliveryMonthFilter : undefined;
  const normalizedDayFilter = Number.isFinite(deliveryDayFilter) && deliveryDayFilter >= 1 && deliveryDayFilter <= 31 ? deliveryDayFilter : undefined;
  const sellerFilter = isAdmin ? sellerFilterRaw : '';

  const [ordersPageData, sellerOptions] = await Promise.all([
    getOrdersPageData({
      fulfillmentStatus: fulfillmentStatusFilter || undefined,
      supplierPaymentStatus: supplierPaymentStatusFilter || undefined,
      collectionStatus: collectionStatusFilter || undefined,
      sellerId: sellerFilter || undefined,
      deliveryYear: normalizedYearFilter,
      deliveryMonth: normalizedMonthFilter,
      deliveryDay: normalizedDayFilter,
      search: searchQuery || undefined,
    }),
    isAdmin ? listSellers({ status: 'ALL' }) : Promise.resolve([]),
  ]);

  const { orders, totalSaleAmount, totalProfitAmount, filteredCount, totalCount, availableYears } = ordersPageData;

  const activeFilterParams = new URLSearchParams();
  if (fulfillmentStatusFilter) {
    activeFilterParams.set('fulfillmentStatus', fulfillmentStatusFilter);
  }
  if (supplierPaymentStatusFilter) {
    activeFilterParams.set('supplierPaymentStatus', supplierPaymentStatusFilter);
  }
  if (collectionStatusFilter) {
    activeFilterParams.set('collectionStatus', collectionStatusFilter);
  }
  if (sellerFilter) {
    activeFilterParams.set('sellerId', sellerFilter);
  }
  if (normalizedYearFilter) {
    activeFilterParams.set('deliveryYear', String(normalizedYearFilter));
  }
  if (normalizedMonthFilter) {
    activeFilterParams.set('deliveryMonth', String(normalizedMonthFilter));
  }
  if (normalizedDayFilter) {
    activeFilterParams.set('deliveryDay', String(normalizedDayFilter));
  }
  if (searchQuery) {
    activeFilterParams.set('q', searchQuery);
  }

  const returnTo = activeFilterParams.toString() ? `/orders?${activeFilterParams.toString()}` : '/orders';
  const exportHref = activeFilterParams.toString() ? `/orders/export?${activeFilterParams.toString()}` : '/orders/export';

  const paidOrdersCount = orders.filter(order => order.collectionStatus === 'PAID_IN_FULL').length;
  const pendingOrdersCount = orders.filter(order => order.collectionStatus === 'UNPAID').length;
  const pendingApprovalOrders = isAdmin ? orders.filter(order => order.fulfillmentStatus === 'PENDING_APPROVAL' && order.approval.status === 'PENDING') : [];
  const pendingDiscountOrders = pendingApprovalOrders.filter(order => order.discountRequest.status === 'PENDING' && order.discountRequest.requestedPercent > 0);
  const pendingStandardOrders = pendingApprovalOrders.filter(
    order => !(order.discountRequest.status === 'PENDING' && order.discountRequest.requestedPercent > 0),
  );
  const trendMap = new Map<string, { label: string; value: number }>();
  const sellerSalesMap = new Map<string, { label: string; value: number }>();
  const productSalesMap = new Map<string, { label: string; value: number }>();

  for (const order of orders) {
    const deliveryDate = new Date(order.deliveryDate);
    const year = deliveryDate.getFullYear();
    const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
    const day = String(deliveryDate.getDate()).padStart(2, '0');
    const trendKey = `${year}-${month}-${day}`;
    const trendBucket = trendMap.get(trendKey);
    if (trendBucket) {
      trendBucket.value += order.totalSaleAmount;
    } else {
      trendMap.set(trendKey, { label: `${day}/${month}`, value: order.totalSaleAmount });
    }

    if (isAdmin) {
      const sellerKey = order.sellerId || order.sellerName || 'system';
      const sellerLabel = order.sellerName || tPage('table.systemSeller');
      const sellerBucket = sellerSalesMap.get(sellerKey);
      if (sellerBucket) {
        sellerBucket.value += order.totalSaleAmount;
      } else {
        sellerSalesMap.set(sellerKey, { label: sellerLabel, value: order.totalSaleAmount });
      }
    } else {
      for (const item of order.items) {
        const productBucket = productSalesMap.get(item.productId);
        if (productBucket) {
          productBucket.value += item.lineSaleTotal;
        } else {
          productSalesMap.set(item.productId, {
            label: item.productName,
            value: item.lineSaleTotal,
          });
        }
      }
    }
  }

  const chartPalette = ['#22c55e', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'];
  const deliveryTrendData = Array.from(trendMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-8)
    .map(([, value]) => value);
  const fulfillmentBreakdownData = [
    {
      label: tPage('charts.fulfillment.pendingApproval'),
      value: orders.filter(order => order.fulfillmentStatus === 'PENDING_APPROVAL').length,
      color: '#f59e0b',
    },
    {
      label: tPage('charts.fulfillment.confirmed'),
      value: orders.filter(order => order.fulfillmentStatus === 'CONFIRMED').length,
      color: '#0ea5e9',
    },
    {
      label: tPage('charts.fulfillment.picked'),
      value: orders.filter(order => order.fulfillmentStatus === 'PICKED').length,
      color: '#6366f1',
    },
    {
      label: tPage('charts.fulfillment.delivering'),
      value: orders.filter(order => order.fulfillmentStatus === 'DELIVERING').length,
      color: '#14b8a6',
    },
    {
      label: tPage('charts.fulfillment.delivered'),
      value: orders.filter(order => order.fulfillmentStatus === 'DELIVERED').length,
      color: '#22c55e',
    },
    {
      label: tPage('charts.fulfillment.canceled'),
      value: orders.filter(order => order.fulfillmentStatus === 'CANCELED').length,
      color: '#ef4444',
    },
  ].filter(item => item.value > 0);
  const collectionBreakdownData = [
    {
      label: tPage('charts.collection.unpaid'),
      value: orders.filter(order => order.collectionStatus === 'UNPAID').length,
      color: '#71717a',
    },
    {
      label: tPage('charts.collection.partiallyPaid'),
      value: orders.filter(order => order.collectionStatus === 'PARTIALLY_PAID').length,
      color: '#f59e0b',
    },
    {
      label: tPage('charts.collection.paidInFull'),
      value: orders.filter(order => order.collectionStatus === 'PAID_IN_FULL').length,
      color: '#22c55e',
    },
    {
      label: tPage('charts.collection.refunded'),
      value: orders.filter(order => order.collectionStatus === 'REFUNDED').length,
      color: '#ef4444',
    },
  ].filter(item => item.value > 0);
  const performanceBarsData = (isAdmin ? Array.from(sellerSalesMap.values()) : Array.from(productSalesMap.values()))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6)
    .map((item, index) => ({
      ...item,
      color: chartPalette[index % chartPalette.length]!,
    }));

  return (
    <div className='flex h-full flex-col'>
      <section className='mb-6 rounded-2xl border border-emerald-500/25 bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(16,185,129,0.06)_40%,rgba(10,10,10,1)_100%)] p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <p className='m-0 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200'>
              <span className='inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/20 text-[13px]'>
                🧾
              </span>
              {tPage('heroTag')}
            </p>
            <h1 className='mb-1 mt-2 text-2xl font-bold text-foreground'>{tPage('heroTitle')}</h1>
            <p className='m-0 text-sm text-foreground-secondary'>{tPage('heroSubtitle')}</p>
          </div>
          <a
            href={exportHref}
            download
            className='inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 text-sm font-medium text-foreground-secondary transition-colors hover:border-primary-500/40 hover:text-foreground'>
            <Download className='h-4 w-4' />
            {tPage('exportButton')}
          </a>
        </div>
      </section>

      <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <div className='rounded-xl border border-emerald-500/25 bg-emerald-500/12 p-4'>
          <div className='mb-2 flex items-center gap-2 text-sm text-emerald-100'>
            <span className='inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20'>
              <Receipt className='h-4 w-4 text-emerald-300' />
            </span>
            {tPage('cards.totalInvoices')}
          </div>
          <div className='text-2xl font-bold text-foreground'>{filteredCount}</div>
          <div className='mt-1 text-xs text-foreground-muted'>{tPage('cards.systemTotal', { count: totalCount })}</div>
        </div>

        <div className='rounded-xl border border-amber-500/25 bg-amber-500/10 p-4'>
          <div className='mb-2 flex items-center gap-2 text-sm text-amber-100'>
            <span className='inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20'>
              <Clock className='h-4 w-4 text-amber-300' />
            </span>
            {tPage('cards.awaitingCollection')}
          </div>
          <div className='text-2xl font-bold text-amber-200'>{pendingOrdersCount}</div>
        </div>

        <div className='rounded-xl border border-sky-500/25 bg-sky-500/10 p-4'>
          <div className='mb-2 flex items-center gap-2 text-sm text-sky-100'>
            <span className='inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20'>
              <CheckCircle className='h-4 w-4 text-sky-300' />
            </span>
            {tPage('cards.fullyCollected')}
          </div>
          <div className='text-2xl font-bold text-sky-200'>{paidOrdersCount}</div>
        </div>

        <div className='rounded-xl border border-violet-500/25 bg-violet-500/10 p-4'>
          <div className='mb-2 flex items-center gap-2 text-sm text-violet-100'>
            <span className='inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20'>
              <TrendingUp className='h-4 w-4 text-violet-300' />
            </span>
            {tPage('cards.revenue')}
          </div>
          <div className='text-2xl font-bold text-violet-200'>{formatCurrency(totalSaleAmount)}</div>
          {canViewCost ? <div className='mt-1 text-xs text-emerald-200'>{tPage('cards.profit', { amount: formatCurrency(totalProfitAmount) })}</div> : null}
        </div>
      </div>

      {isAdmin && pendingApprovalOrders.length > 0 ? (
        <section className='mb-6 rounded-2xl border border-amber-500/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(10,10,10,1)_80%)] p-4'>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h3 className='m-0 text-lg font-semibold text-foreground'>{tPage('approvals.title')}</h3>
              <p className='m-0 mt-1 text-sm text-foreground-secondary'>{tPage('approvals.subtitle')}</p>
            </div>
            <div className='flex flex-wrap gap-2 text-xs'>
              <span className='rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-1 text-amber-200'>
                {tPage('approvals.pendingTotal', { count: pendingApprovalOrders.length })}
              </span>
              <span className='rounded-full border border-rose-500/35 bg-rose-500/15 px-2 py-1 text-rose-200'>
                {tPage('approvals.pendingDiscount', { count: pendingDiscountOrders.length })}
              </span>
            </div>
          </div>

          <div className='grid gap-3 lg:grid-cols-2'>
            {pendingApprovalOrders.map(order => {
              const hasDiscountRequest = order.discountRequest.status === 'PENDING' && order.discountRequest.requestedPercent > 0;
              const productNames = order.items.map(item => item.productName).join(', ');
              const discountAmount = Math.max(order.baseSaleAmount - order.discountRequest.requestedSaleAmount, 0);
              const expectedProfit = order.discountRequest.requestedSaleAmount - order.totalCostAmount;

              return (
                <article
                  key={`approval-${order.id}`}
                  className={`rounded-xl border bg-background-secondary/90 p-4 ${hasDiscountRequest ? 'border-rose-500/35' : 'border-amber-500/25'}`}>
                  <div className='mb-2 flex items-start justify-between gap-3'>
                    <div>
                      <p className='m-0 inline-flex rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 font-mono text-xs text-amber-200'>
                        {order.code}
                      </p>
                      <p className='m-0 mt-1 text-sm text-foreground'>{order.customerName || order.buyerName}</p>
                      <p className='m-0 mt-1 text-xs text-foreground-muted'>
                        {tPage('table.seller', { name: order.sellerName })} • {formatDate(order.deliveryDate)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${
                        hasDiscountRequest ? 'border-rose-500/35 bg-rose-500/15 text-rose-200' : 'border-sky-500/35 bg-sky-500/15 text-sky-200'
                      }`}>
                      {hasDiscountRequest ? tPage('approvals.discountRequested') : tPage('approvals.standard')}
                    </span>
                  </div>

                  <p className='line-clamp-1 m-0 text-xs text-foreground-secondary' title={productNames}>
                    {productNames}
                  </p>

                  <div className='mt-3 grid gap-2 sm:grid-cols-3'>
                    <div className='rounded-lg border border-border bg-background-tertiary px-2.5 py-2'>
                      <p className='m-0 text-[11px] text-foreground-muted'>{tPage('approvals.baseSale')}</p>
                      <p className='m-0 mt-1 text-sm font-semibold text-foreground'>{formatCurrency(order.baseSaleAmount)}</p>
                    </div>
                    <div className='rounded-lg border border-rose-500/35 bg-rose-500/15 px-2.5 py-2'>
                      <p className='m-0 text-[11px] text-rose-200'>{tPage('approvals.requestedSale')}</p>
                      <p className='m-0 mt-1 text-sm font-semibold text-rose-100'>{formatCurrency(order.discountRequest.requestedSaleAmount)}</p>
                    </div>
                    <div className='rounded-lg border border-amber-500/35 bg-amber-500/15 px-2.5 py-2'>
                      <p className='m-0 text-[11px] text-amber-200'>{tPage('approvals.discount')}</p>
                      <p className='m-0 mt-1 text-sm font-semibold text-amber-100'>
                        {order.discountRequest.requestedPercent.toFixed(1)}% ({formatCurrency(discountAmount)})
                      </p>
                    </div>
                  </div>

                  {canViewCost ? (
                    <div className='mt-2 text-xs text-foreground-secondary'>
                      {tPage('approvals.costCompare', {
                        cost: formatCurrency(order.totalCostAmount),
                        profit: formatCurrency(expectedProfit),
                      })}
                    </div>
                  ) : null}

                  <form action={reviewOrderApprovalAction} className='mt-3 space-y-2'>
                    <input type='hidden' name='orderId' value={order.id} />
                    <input type='hidden' name='returnTo' value={returnTo} />

                    <input
                      type='text'
                      name='note'
                      placeholder={tPage('approvals.notePlaceholder')}
                      className='h-9 w-full rounded-lg border border-border bg-background-tertiary px-3 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary-500'
                    />

                    {hasDiscountRequest ? (
                      <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                        <button
                          type='submit'
                          name='decision'
                          value='APPROVE_WITH_DISCOUNT'
                          className='h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-600'>
                          {tPage('approvals.approveDiscount')}
                        </button>
                        <button
                          type='submit'
                          name='decision'
                          value='APPROVE_WITHOUT_DISCOUNT'
                          className='h-9 rounded-lg border border-sky-500/35 bg-sky-500/15 px-3 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/20'>
                          {tPage('approvals.approveWithoutDiscount')}
                        </button>
                        <button
                          type='submit'
                          name='decision'
                          value='REJECT_ORDER'
                          className='h-9 rounded-lg border border-red-500/35 bg-red-500/15 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20'>
                          {tPage('approvals.rejectOrder')}
                        </button>
                      </div>
                    ) : (
                      <div className='grid grid-cols-2 gap-2'>
                        <button
                          type='submit'
                          name='decision'
                          value='APPROVE_ORDER'
                          className='h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-600'>
                          {tPage('approvals.approveOrder')}
                        </button>
                        <button
                          type='submit'
                          name='decision'
                          value='REJECT_ORDER'
                          className='h-9 rounded-lg border border-red-500/35 bg-red-500/15 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20'>
                          {tPage('approvals.rejectOrder')}
                        </button>
                      </div>
                    )}
                  </form>
                </article>
              );
            })}
          </div>

          {pendingStandardOrders.length > 0 ? (
            <div className='mt-3 text-xs text-foreground-muted'>{tPage('approvals.standardHint', { count: pendingStandardOrders.length })}</div>
          ) : null}
        </section>
      ) : null}

      <div className='mb-6 rounded-2xl border border-border bg-background-secondary p-4'>
        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]'>
          <OrdersFilters
            key={[
              fulfillmentStatusFilter || 'ALL',
              supplierPaymentStatusFilter || 'ALL',
              collectionStatusFilter || 'ALL',
              sellerFilter || 'ALL',
              normalizedYearFilter || 'ALL',
              normalizedMonthFilter || 'ALL',
              normalizedDayFilter || 'ALL',
            ].join('|')}
            availableYears={availableYears}
            initialValues={{
              fulfillmentStatus: fulfillmentStatusFilter || undefined,
              supplierPaymentStatus: supplierPaymentStatusFilter || undefined,
              collectionStatus: collectionStatusFilter || undefined,
              sellerId: sellerFilter || undefined,
              deliveryYear: normalizedYearFilter ? String(normalizedYearFilter) : undefined,
              deliveryMonth: normalizedMonthFilter ? String(normalizedMonthFilter) : undefined,
              deliveryDay: normalizedDayFilter ? String(normalizedDayFilter) : undefined,
            }}
            showSellerFilter={isAdmin}
            sellerOptions={sellerOptions.map(seller => ({ id: seller.id, name: seller.name }))}
          />

          <form method='get' className='relative h-fit'>
            {fulfillmentStatusFilter ? <input type='hidden' name='fulfillmentStatus' value={fulfillmentStatusFilter} /> : null}
            {supplierPaymentStatusFilter ? <input type='hidden' name='supplierPaymentStatus' value={supplierPaymentStatusFilter} /> : null}
            {collectionStatusFilter ? <input type='hidden' name='collectionStatus' value={collectionStatusFilter} /> : null}
            {sellerFilter ? <input type='hidden' name='sellerId' value={sellerFilter} /> : null}
            {normalizedYearFilter ? <input type='hidden' name='deliveryYear' value={normalizedYearFilter} /> : null}
            {normalizedMonthFilter ? <input type='hidden' name='deliveryMonth' value={normalizedMonthFilter} /> : null}
            {normalizedDayFilter ? <input type='hidden' name='deliveryDay' value={normalizedDayFilter} /> : null}

            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary' />
            <input
              type='text'
              name='q'
              defaultValue={searchQuery}
              placeholder={tPage('searchPlaceholder')}
              className='h-10 w-full rounded-lg border border-border bg-background-secondary pl-10 pr-4 text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary-500'
            />
          </form>
        </div>
      </div>

      <section className='mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'>
        <InsightLineChartCard
          title={tPage('charts.deliveryTrendTitle')}
          subtitle={tPage('charts.deliveryTrendHint')}
          data={deliveryTrendData}
          color='#22c55e'
          valueFormatter={formatCurrency}
          emptyLabel={tPage('charts.empty')}
        />

        <div className='grid gap-4 sm:grid-cols-2'>
          <InsightDonutChartCard
            title={tPage('charts.fulfillmentTitle')}
            subtitle={tPage('charts.fulfillmentHint')}
            data={fulfillmentBreakdownData}
            valueFormatter={value => value.toLocaleString('en-US')}
            emptyLabel={tPage('charts.empty')}
          />
          <InsightDonutChartCard
            title={tPage('charts.collectionTitle')}
            subtitle={tPage('charts.collectionHint')}
            data={collectionBreakdownData}
            valueFormatter={value => value.toLocaleString('en-US')}
            emptyLabel={tPage('charts.empty')}
          />
        </div>
      </section>

      <section className='mb-6'>
        <InsightHorizontalBarsCard
          title={isAdmin ? tPage('charts.sellerBarsTitle') : tPage('charts.productBarsTitle')}
          subtitle={isAdmin ? tPage('charts.sellerBarsHint') : tPage('charts.productBarsHint')}
          data={performanceBarsData}
          valueFormatter={formatCurrency}
          emptyLabel={tPage('charts.empty')}
        />
      </section>

      <div className='flex-1 overflow-auto'>
        {totalCount === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-foreground-secondary'>
            <Receipt className='mb-4 h-12 w-12 opacity-50' />
            <p>{tPage('emptyOrders')}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-foreground-secondary'>
            <Search className='mb-4 h-12 w-12 opacity-50' />
            <p>{tPage('emptyFiltered')}</p>
          </div>
        ) : (
          <div className='overflow-hidden rounded-xl border border-border bg-background-secondary shadow-[0_14px_28px_rgba(0,0,0,0.2)]'>
            <div className='overflow-auto'>
              <table className='w-full min-w-[980px] border-collapse'>
                <thead className='sticky top-0 z-[5] bg-background-tertiary/95 backdrop-blur'>
                  <tr className='border-b border-border'>
                    <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground-muted'>
                      {tPage('table.invoiceSeller')}
                    </th>
                    <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground-muted'>{tPage('table.timeline')}</th>
                    <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground-muted'>
                      {tPage('table.customerProducts')}
                    </th>
                    <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground-muted'>{tPage('table.totals')}</th>
                    <th className='px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-foreground-muted'>{tPage('table.status')}</th>
                    <th className='px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-foreground-muted'>{tPage('details.open')}</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map(order => {
                    const previewItems = order.items.slice(0, 2);
                    const moreProducts = Math.max(order.items.length - previewItems.length, 0);
                    const hasDiscountRequest = order.discountRequest.status === 'PENDING' && order.discountRequest.requestedPercent > 0;
                    const rowToneClass = order.fulfillmentStatus === 'PENDING_APPROVAL' ? (hasDiscountRequest ? 'bg-amber-500/5' : 'bg-sky-500/5') : '';

                    return (
                      <tr key={order.id} className={`border-b border-border/70 align-top transition-colors hover:bg-background-tertiary/50 ${rowToneClass}`}>
                        <td className='px-3 py-2.5'>
                          <p className='m-0 inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/12 px-2 py-0.5 font-mono text-[11px] text-emerald-200'>
                            {order.code}
                          </p>
                          {order.fulfillmentStatus === 'PENDING_APPROVAL' ? (
                            <p className='m-0 mt-1 inline-flex rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200'>
                              {tPage('approvals.needsReview')}
                            </p>
                          ) : null}
                          <p className='m-0 mt-1 text-[11px] text-sky-100'>
                            {tPage('table.seller', {
                              name: order.sellerName || tPage('table.systemSeller'),
                            })}
                          </p>
                        </td>

                        <td className='px-3 py-2.5'>
                          <p className='m-0 text-[11px] text-foreground-muted'>{tPage('table.created', { datetime: formatDate(order.createdAt) })}</p>
                          <p className='m-0 mt-1 text-[11px] text-foreground-secondary'>
                            {tPage('table.deliveryDate')}: {formatDate(order.deliveryDate)}
                          </p>
                        </td>

                        <td className='px-3 py-2.5'>
                          <p className='m-0 text-sm font-medium text-foreground'>{order.customerName || order.buyerName}</p>
                          <p className='m-0 mt-0.5 text-xs text-foreground-secondary'>
                            {previewItems.map(item => item.productName).join(', ')}
                            {moreProducts > 0 ? ` ${tPage('details.moreProducts', { count: moreProducts })}` : ''}
                          </p>
                          <p className='m-0 mt-0.5 text-[11px] text-foreground-muted'>{order.totalWeightKg.toFixed(2)} kg</p>
                          {hasDiscountRequest ? (
                            <p className='m-0 mt-1 text-[11px] text-amber-200'>
                              {tPage('table.discountPending', {
                                percent: order.discountRequest.requestedPercent.toFixed(1),
                                requested: formatCurrency(order.discountRequest.requestedSaleAmount),
                              })}
                            </p>
                          ) : null}
                        </td>

                        <td className='px-3 py-2.5'>
                          <p className='m-0 text-xs font-medium text-violet-100'>{tPage('table.bill', { amount: formatCurrency(order.totalSaleAmount) })}</p>
                          {canViewCost ? (
                            <>
                              <p className='m-0 mt-0.5 text-[11px] text-foreground-muted'>
                                {tPage('table.cost', { amount: formatCurrency(order.totalCostAmount) })}
                              </p>
                              <p className='m-0 mt-0.5 text-[11px] text-emerald-200'>
                                {tPage('table.profit', { amount: formatCurrency(order.totalProfitAmount) })}
                              </p>
                            </>
                          ) : (
                            <p className='m-0 mt-0.5 text-[11px] text-foreground-muted'>
                              {tPage('table.baseSale', { amount: formatCurrency(order.baseSaleAmount) })}
                            </p>
                          )}
                        </td>

                        <td className='min-w-[300px] px-3 py-2.5'>
                          <OrderStatusInlineForm
                            key={`${order.id}-${order.fulfillmentStatus}-${order.supplierPaymentStatus}-${order.collectionStatus}`}
                            orderId={order.id}
                            returnTo={returnTo}
                            fulfillmentStatus={order.fulfillmentStatus}
                            supplierPaymentStatus={order.supplierPaymentStatus}
                            collectionStatus={order.collectionStatus}
                            readOnly={!isAdmin || order.fulfillmentStatus === 'PENDING_APPROVAL'}
                            compact
                          />
                        </td>

                        <td className='px-3 py-2.5 text-right'>
                          <OrderDetailsModal order={order} canViewCost={canViewCost} isAdmin={isAdmin} compact />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
