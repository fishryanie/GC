'use client';

import { formatCurrency, formatDate, formatDateTime, formatKg } from 'lib/format';
import { Download, Eye, Printer, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { OrderView } from 'types';
import { openOrderInvoiceWindow } from './order-invoice-template';

type OrderDetailsModalProps = {
  order: OrderView;
  canViewCost: boolean;
  compact?: boolean;
};

export function OrderDetailsModal({ order, canViewCost, compact = false }: OrderDetailsModalProps) {
  const t = useTranslations('ordersPage');
  const tCommon = useTranslations('common');
  const tStatuses = useTranslations('statuses');
  const [open, setOpen] = useState(false);

  const statusLabels = {
    fulfillment: tStatuses(`fulfillment.${order.fulfillmentStatus}`),
    collection: tStatuses(`collection.${order.collectionStatus}`),
    supplier: tStatuses(`supplierPayment.${order.supplierPaymentStatus}`),
    approval: tStatuses(`approval.${order.approval.status}`),
    discount: tStatuses(`discount.${order.discountRequest.status}`),
  };
  const invoiceLabels = {
    invoiceTitle: t('details.billViewTitle'),
    appName: tCommon('appName'),
    appSubtitle: t('details.billAppSubtitle'),
    invoiceCode: t('table.invoiceCode'),
    createdAt: t('table.createdLabel'),
    deliveryDate: t('table.deliveryDate'),
    buyer: t('table.buyer'),
    product: t('table.products'),
    seller: t('table.sellerColumn'),
    saleProfile: t('details.labels.saleProfile'),
    costProfile: t('details.labels.costProfile'),
    weightKg: t('details.labels.weightKg'),
    salePerKg: t('details.labels.salePerKg'),
    lineTotal: t('details.labels.lineTotal'),
    costPerKg: t('details.labels.costPerKg'),
    costTotal: t('details.labels.cost'),
    profit: t('details.labels.profit'),
    bill: t('details.labels.bill'),
    baseSale: t('details.labels.baseSale'),
    totalCost: t('details.labels.cost'),
    totalProfit: t('details.labels.profit'),
    totalWeight: t('details.labels.totalWeight'),
    collectionStatus: t('details.labels.collectionStatus'),
    fulfillmentStatus: t('details.labels.fulfillmentStatus'),
    supplierStatus: t('details.labels.supplierStatus'),
    approvalStatus: t('details.labels.approvalStatus'),
    discountStatus: t('details.labels.discountStatus'),
    generatedAt: t('details.generatedAt'),
    savePdfHint: t('details.savePdfHint'),
    noData: t('details.noData'),
    discountRequest: t('details.discountRequest'),
    requestedAmount: t('details.requestedAmount'),
    requestedPercent: t('details.requestedPercent'),
    reason: t('details.reason'),
    systemSeller: t('table.systemSeller'),
    printButton: t('details.printBill'),
    closeButton: t('details.close'),
  };

  function handleOpenInvoicePreview() {
    openOrderInvoiceWindow({
      order,
      canViewCost,
      statusLabels,
      mode: 'preview',
      labels: invoiceLabels,
    });
  }

  function handlePrintInvoice() {
    openOrderInvoiceWindow({
      order,
      canViewCost,
      statusLabels,
      mode: 'print',
      labels: invoiceLabels,
    });
  }

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
              <div className='min-w-0'>
                <p className='m-0 inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-200'>
                  {order.code}
                </p>
                <h4 className='m-0 mt-1 text-base font-semibold text-foreground'>{t('details.title')}</h4>
                <p className='m-0 mt-1 text-xs text-foreground-secondary'>{t('details.subtitle', { createdAt: formatDateTime(order.createdAt) })}</p>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={handleOpenInvoicePreview}
                  className='inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background-secondary px-2.5 text-xs font-semibold text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'>
                  <Download className='h-3.5 w-3.5' />
                  {t('details.openPdf')}
                </button>

                <button
                  type='button'
                  onClick={handlePrintInvoice}
                  className='inline-flex h-8 items-center gap-1 rounded-lg border border-primary-500/35 bg-primary-500/10 px-2.5 text-xs font-semibold text-primary-200 transition-colors hover:border-primary-500/50 hover:bg-primary-500/15 hover:text-primary-100'>
                  <Printer className='h-3.5 w-3.5' />
                  {t('details.printBill')}
                </button>

                <button
                  type='button'
                  onClick={() => setOpen(false)}
                  className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-secondary text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                  aria-label={t('details.close')}>
                  <X className='h-4 w-4' />
                </button>
              </div>
            </header>

            <div className='max-h-[80vh] overflow-auto p-4'>
              <div className='mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm md:p-6'>
                <div className='flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-zinc-300 pb-4'>
                  <div>
                    <p className='m-0 text-2xl font-bold tracking-[0.03em]'>{tCommon('appName')}</p>
                    <p className='m-0 mt-1 text-xs text-zinc-500'>{t('details.billAppSubtitle')}</p>
                  </div>
                  <div className='text-right'>
                    <p className='m-0 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500'>{t('details.billViewTitle')}</p>
                    <p className='m-0 mt-1 font-mono text-sm font-semibold text-emerald-700'>#{order.code}</p>
                    <p className='m-0 mt-1 text-xs text-zinc-600'>
                      {t('table.createdLabel')}: {formatDateTime(order.createdAt)}
                    </p>
                    <p className='m-0 mt-0.5 text-xs text-zinc-600'>
                      {t('table.deliveryDate')}: {formatDate(order.deliveryDate)}
                    </p>
                  </div>
                </div>

                <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                  <StatusBadge label={t('details.labels.fulfillmentStatus')} value={statusLabels.fulfillment} />
                  <StatusBadge label={t('details.labels.collectionStatus')} value={statusLabels.collection} />
                  <StatusBadge label={t('details.labels.supplierStatus')} value={statusLabels.supplier} />
                  <StatusBadge label={t('details.labels.approvalStatus')} value={statusLabels.approval} />
                </div>

                <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                  <BillInfoCard label={t('table.buyer')} value={order.customerName || order.buyerName || t('details.noData')} />
                  <BillInfoCard label={t('table.sellerColumn')} value={order.sellerName || t('table.systemSeller')} />
                  <BillInfoCard label={t('details.labels.saleProfile')} value={order.saleProfile.profileName} />
                  <BillInfoCard label={t('details.labels.costProfile')} value={order.costProfile.profileName} />
                </div>

                <div className='mt-4 overflow-x-auto rounded-xl border border-zinc-200'>
                  <table className='w-full min-w-[760px] border-collapse'>
                    <thead>
                      <tr className='border-b border-zinc-200 bg-zinc-50'>
                        <th className='px-3 py-2 text-left text-xs font-semibold text-zinc-700'>{t('table.products')}</th>
                        <th className='px-3 py-2 text-left text-xs font-semibold text-zinc-700'>{t('details.labels.weightKg')}</th>
                        <th className='px-3 py-2 text-left text-xs font-semibold text-zinc-700'>{t('details.labels.salePerKg')}</th>
                        <th className='px-3 py-2 text-right text-xs font-semibold text-zinc-700'>{t('details.labels.lineTotal')}</th>
                        {canViewCost ? (
                          <>
                            <th className='px-3 py-2 text-left text-xs font-semibold text-zinc-700'>{t('details.labels.costPerKg')}</th>
                            <th className='px-3 py-2 text-left text-xs font-semibold text-zinc-700'>{t('details.labels.cost')}</th>
                            <th className='px-3 py-2 text-right text-xs font-semibold text-zinc-700'>{t('details.labels.profit')}</th>
                          </>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(item => (
                        <tr key={`${order.id}-${item.productId}`} className='border-b border-zinc-100 last:border-b-0'>
                          <td className='px-3 py-2 text-sm text-zinc-900'>{item.productName}</td>
                          <td className='px-3 py-2 text-sm text-zinc-700'>{formatKg(item.weightKg)}</td>
                          <td className='px-3 py-2 text-sm text-zinc-700'>{formatCurrency(item.salePricePerKg)}</td>
                          <td className='px-3 py-2 text-right text-sm font-medium text-zinc-900'>{formatCurrency(item.lineSaleTotal)}</td>
                          {canViewCost ? (
                            <>
                              <td className='px-3 py-2 text-sm text-zinc-700'>{formatCurrency(item.costPricePerKg)}</td>
                              <td className='px-3 py-2 text-sm text-zinc-700'>{formatCurrency(item.lineCostTotal)}</td>
                              <td className='px-3 py-2 text-right text-sm font-medium text-emerald-700'>{formatCurrency(item.lineProfit)}</td>
                            </>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className='mt-4 ml-auto w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2'>
                  <BillTotalRow label={t('details.labels.totalWeight')} value={formatKg(order.totalWeightKg)} />
                  <BillTotalRow label={t('details.labels.baseSale')} value={formatCurrency(order.baseSaleAmount)} />
                  <BillTotalRow label={t('details.labels.bill')} value={formatCurrency(order.totalSaleAmount)} bold />
                  {canViewCost ? (
                    <>
                      <BillTotalRow label={t('details.labels.cost')} value={formatCurrency(order.totalCostAmount)} />
                      <BillTotalRow label={t('details.labels.profit')} value={formatCurrency(order.totalProfitAmount)} accent />
                    </>
                  ) : null}
                </div>

                {order.discountRequest.status !== 'NONE' ? (
                  <div className='mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                    <p className='m-0'>
                      <strong>{t('details.discountRequest')}:</strong> {statusLabels.discount}
                    </p>
                    <p className='m-0 mt-1'>
                      {t('details.requestedPercent')}: {order.discountRequest.requestedPercent.toFixed(1)}%
                    </p>
                    <p className='m-0 mt-1'>
                      {t('details.requestedAmount')}: {formatCurrency(order.discountRequest.requestedSaleAmount)}
                    </p>
                    {order.discountRequest.reason ? (
                      <p className='m-0 mt-1'>
                        {t('details.reason')}: {order.discountRequest.reason}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className='mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-zinc-300 pt-2 text-[11px] text-zinc-500'>
                  <span>
                    {t('details.generatedAt')}: {formatDateTime(order.updatedAt || order.createdAt)}
                  </span>
                  <span>{t('details.savePdfHint')}</span>
                </div>
              </div>

              {order.discountRequest.status === 'PENDING' ? (
                <p className='m-0 mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200'>
                  {t('table.discountPending', {
                    percent: order.discountRequest.requestedPercent.toFixed(1),
                    requested: formatCurrency(order.discountRequest.requestedSaleAmount),
                  })}
                </p>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <article className='rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2'>
      <p className='m-0 text-[11px] uppercase tracking-[0.04em] text-zinc-500'>{label}</p>
      <p className='m-0 mt-1 text-sm font-semibold text-zinc-900'>{value}</p>
    </article>
  );
}

function BillInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className='rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2'>
      <p className='m-0 text-[11px] uppercase tracking-[0.04em] text-zinc-500'>{label}</p>
      <p className='m-0 mt-1 text-sm font-semibold text-zinc-900'>{value}</p>
    </article>
  );
}

function BillTotalRow({ label, value, bold = false, accent = false }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className='mb-1.5 flex items-center justify-between text-sm last:mb-0'>
      <span className='text-zinc-600'>{label}</span>
      <strong className={`${bold ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-800'} ${accent ? '!text-emerald-700' : ''}`}>{value}</strong>
    </div>
  );
}
