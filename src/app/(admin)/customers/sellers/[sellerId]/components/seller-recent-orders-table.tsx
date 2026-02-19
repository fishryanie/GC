'use client';

import { openOrderInvoiceWindow } from '@/app/(admin)/orders/components/order-invoice-template';
import { Tooltip } from 'antd';
import { formatCurrency, formatDate, formatKg } from 'lib/format';
import { Eye, FileText, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { OrderView } from 'types';

type SellerRecentOrdersTableProps = {
  orders: OrderView[];
  canViewCost: boolean;
};

export function SellerRecentOrdersTable({ orders, canViewCost }: SellerRecentOrdersTableProps) {
  const t = useTranslations('customersPage');
  const tCommon = useTranslations('common');
  const tStatuses = useTranslations('statuses');
  const tOrders = useTranslations('ordersPage');
  const [selectedOrder, setSelectedOrder] = useState<OrderView | null>(null);

  const invoiceLabels = useMemo(
    () => ({
      invoiceTitle: tOrders('details.billViewTitle'),
      appName: tCommon('appName'),
      appSubtitle: tOrders('details.billAppSubtitle'),
      invoiceCode: tOrders('table.invoiceCode'),
      createdAt: tOrders('table.createdLabel'),
      deliveryDate: tOrders('table.deliveryDate'),
      buyer: tOrders('table.buyer'),
      product: tOrders('table.products'),
      seller: tOrders('table.sellerColumn'),
      saleProfile: tOrders('details.labels.saleProfile'),
      costProfile: tOrders('details.labels.costProfile'),
      weightKg: tOrders('details.labels.weightKg'),
      salePerKg: tOrders('details.labels.salePerKg'),
      lineTotal: tOrders('details.labels.lineTotal'),
      costPerKg: tOrders('details.labels.costPerKg'),
      costTotal: tOrders('details.labels.cost'),
      profit: tOrders('details.labels.profit'),
      bill: tOrders('details.labels.bill'),
      baseSale: tOrders('details.labels.baseSale'),
      totalCost: tOrders('details.labels.cost'),
      totalProfit: tOrders('details.labels.profit'),
      totalWeight: tOrders('details.labels.totalWeight'),
      collectionStatus: tOrders('details.labels.collectionStatus'),
      fulfillmentStatus: tOrders('details.labels.fulfillmentStatus'),
      supplierStatus: tOrders('details.labels.supplierStatus'),
      approvalStatus: tOrders('details.labels.approvalStatus'),
      discountStatus: tOrders('details.labels.discountStatus'),
      generatedAt: tOrders('details.generatedAt'),
      savePdfHint: tOrders('details.savePdfHint'),
      noData: tOrders('details.noData'),
      discountRequest: tOrders('details.discountRequest'),
      requestedAmount: tOrders('details.requestedAmount'),
      requestedPercent: tOrders('details.requestedPercent'),
      reason: tOrders('details.reason'),
      systemSeller: tOrders('table.systemSeller'),
      printButton: tOrders('details.printBill'),
      closeButton: tOrders('details.close'),
    }),
    [tCommon, tOrders],
  );

  function handleExportInvoice(order: OrderView) {
    openOrderInvoiceWindow({
      order,
      canViewCost,
      labels: invoiceLabels,
      statusLabels: {
        fulfillment: tStatuses(`fulfillment.${order.fulfillmentStatus}`),
        collection: tStatuses(`collection.${order.collectionStatus}`),
        supplier: tStatuses(`supplierPayment.${order.supplierPaymentStatus}`),
        approval: tStatuses(`approval.${order.approval.status}`),
        discount: tStatuses(`discount.${order.discountRequest.status}`),
      },
      mode: 'print',
    });
  }

  return (
    <>
      <div className='overflow-x-auto rounded-xl border border-border'>
        <table className='w-full min-w-[980px] border-collapse text-xs'>
          <thead className='bg-background-tertiary/70 text-foreground-muted'>
            <tr className='border-b border-border'>
              <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{tOrders('table.buyer')}</th>
              <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.recentTable.delivery')}</th>
              <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.cards.revenue')}</th>
              <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.cards.profit')}</th>
              <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.recentTable.weight')}</th>
              <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{tOrders('table.status')}</th>
              <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.recentTable.actions')}</th>
            </tr>
          </thead>
          <tbody className='bg-background-tertiary/30'>
            {orders.map(order => (
              <tr key={order.id} className='border-b border-border align-top last:border-b-0 hover:bg-background-tertiary/50'>
                <td className='min-w-[260px] px-3 py-2'>
                  <p className='m-0! truncate font-medium text-foreground'>{order.customerName || order.buyerName}</p>
                </td>
                <td className='whitespace-nowrap px-3 py-2 text-foreground-secondary'>{formatDate(order.deliveryDate)}</td>
                <td className='whitespace-nowrap px-3 py-2 text-right font-medium text-amber-200'>{formatCurrency(order.totalSaleAmount)}</td>
                <td className='whitespace-nowrap px-3 py-2 text-right font-semibold text-primary-500'>{formatCurrency(order.totalProfitAmount)}</td>
                <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatKg(order.totalWeightKg)}</td>
                <td className='min-w-[250px] px-3 py-2'>
                  <div className='flex flex-wrap gap-1'>
                    <span className='inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-200'>
                      {tStatuses(`fulfillment.${order.fulfillmentStatus}`)}
                    </span>
                    <span className='inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-200'>
                      {tStatuses(`supplierPayment.${order.supplierPaymentStatus}`)}
                    </span>
                    <span className='inline-flex items-center rounded-full border border-zinc-500/30 bg-zinc-500/10 px-1.5 py-0.5 text-[10px] text-zinc-200'>
                      {tStatuses(`collection.${order.collectionStatus}`)}
                    </span>
                  </div>
                </td>
                <td className='whitespace-nowrap px-3 py-2'>
                  <div className='flex items-center gap-1'>
                    <div className='mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground-muted'>
                      <span>{t('sellers.details.recentTable.itemsSummary', { count: order.items.length })}</span>
                      <Tooltip title={t('sellers.details.recentTable.viewDetails')}>
                        <button
                          type='button'
                          onClick={() => setSelectedOrder(order)}
                          aria-label={t('sellers.details.recentTable.viewDetails')}
                          className='inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-background-secondary text-foreground-secondary transition-colors hover:text-foreground'>
                          <Eye className='h-3.5 w-3.5' />
                        </button>
                      </Tooltip>
                    </div>
                    <Tooltip title={t('sellers.details.recentTable.exportInvoice')}>
                      <button
                        type='button'
                        onClick={() => handleExportInvoice(order)}
                        aria-label={t('sellers.details.recentTable.exportInvoice')}
                        className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-500/35 bg-primary-500/10 text-primary-200 transition-colors hover:border-primary-500/50 hover:bg-primary-500/15 hover:text-primary-100'>
                        <FileText className='h-3.5 w-3.5' />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder ? (
        <div className='fixed inset-0 z-1300 flex items-center justify-center bg-black/70 p-4'>
          <article className='w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background-secondary shadow-2xl'>
            <header className='flex items-start justify-between gap-3 border-b border-border bg-background-tertiary px-4 py-3'>
              <div className='min-w-0'>
                <h4 className='m-0 text-base font-semibold text-foreground'>{t('sellers.details.recentTable.itemsModalTitle')}</h4>
                <p className='m-0 mt-1 text-xs text-foreground-secondary'>
                  {t('sellers.details.recentTable.itemsModalSubtitle', {
                    code: selectedOrder.code,
                    customer: selectedOrder.customerName || selectedOrder.buyerName,
                  })}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSelectedOrder(null)}
                className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-secondary text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                aria-label={t('sellers.details.recentTable.close')}>
                <X className='h-4 w-4' />
              </button>
            </header>

            <div className='max-h-[70vh] overflow-auto p-4'>
              <div className='overflow-x-auto rounded-xl border border-border'>
                <table className='w-full min-w-[640px] border-collapse text-xs'>
                  <thead className='bg-background-tertiary/70 text-foreground-muted'>
                    <tr className='border-b border-border'>
                      <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{tOrders('table.products')}</th>
                      <th className='px-3 py-2 text-right font-semibold tracking-[0.06em]'>{t('sellers.details.recentTable.weight')}</th>
                      <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{tOrders('details.labels.salePerKg')}</th>
                      <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{tOrders('details.labels.lineTotal')}</th>
                    </tr>
                  </thead>
                  <tbody className='bg-background-tertiary/30'>
                    {selectedOrder.items.map(item => (
                      <tr key={`${selectedOrder.id}-${item.productId}`} className='border-b border-border last:border-b-0'>
                        <td className='px-3 py-2 text-foreground'>{item.productName}</td>
                        <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatKg(item.weightKg)}</td>
                        <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatCurrency(item.salePricePerKg)}</td>
                        <td className='whitespace-nowrap px-3 py-2 text-right font-medium text-amber-200'>{formatCurrency(item.lineSaleTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className='bg-background-tertiary/70 text-foreground'>
                    <tr className='border-t border-border'>
                      <td className='px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.recentTable.summary')}</td>
                      <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatKg(selectedOrder.totalWeightKg)}</td>
                      <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>-</td>
                      <td className='whitespace-nowrap px-3 py-2 text-right font-semibold text-amber-200'>{formatCurrency(selectedOrder.totalSaleAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
