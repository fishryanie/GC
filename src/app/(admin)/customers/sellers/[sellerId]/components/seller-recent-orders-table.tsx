'use client';

import { OrderInvoiceModalButton } from '@/components/order-invoice-modal-button';
import { OrderProductsModalButton } from '@/components/order-products-modal-button';
import { formatCurrency, formatDate, formatKg } from 'lib/format';
import { useTranslations } from 'next-intl';
import type { OrderView } from 'types';

type SellerRecentOrdersTableProps = {
  orders: OrderView[];
  canViewCost: boolean;
};

export function SellerRecentOrdersTable({ orders, canViewCost }: SellerRecentOrdersTableProps) {
  const t = useTranslations('customersPage');
  const tStatuses = useTranslations('statuses');
  const tOrders = useTranslations('ordersPage');

  return (
    <div className='overflow-x-auto rounded-xl border border-border'>
      <table className='w-full min-w-[980px] border-collapse text-xs'>
        <thead className='bg-background-tertiary/70 text-foreground-muted'>
          <tr className='border-b border-border'>
            <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{tOrders('table.buyer')}</th>
            <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.recentTable.delivery')}</th>
            <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.cards.revenue')}</th>
            <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.cards.profit')}</th>
            <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.recentTable.itemsWeight')}</th>
            <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{tOrders('table.status')}</th>
            <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{t('sellers.details.recentTable.actions')}</th>
          </tr>
        </thead>
        <tbody className='bg-background-tertiary/30'>
          {orders.map(order => (
            <tr key={order.id} className='border-b border-border align-middle last:border-b-0 hover:bg-background-tertiary/50'>
              <td className='min-w-[260px] align-middle px-3 py-2'>
                <p className='m-0 truncate font-medium text-foreground'>{order.customerName || order.buyerName}</p>
              </td>
              <td className='whitespace-nowrap align-middle px-3 py-2 text-foreground-secondary'>{formatDate(order.deliveryDate)}</td>
              <td className='whitespace-nowrap align-middle px-3 py-2 text-right font-medium text-amber-200'>{formatCurrency(order.totalSaleAmount)}</td>
              <td className='whitespace-nowrap align-middle px-3 py-2 text-right font-semibold text-primary-500'>{formatCurrency(order.totalProfitAmount)}</td>
              <td className='whitespace-nowrap align-middle px-3 py-2 text-right text-foreground-secondary'>
                {t('sellers.details.recentTable.itemsSummary', { count: order.items.length })} • {formatKg(order.totalWeightKg)}
              </td>
              <td className='min-w-[250px] align-middle px-3 py-2'>
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
              <td className='whitespace-nowrap align-middle px-3 py-2'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-[11px] text-foreground-muted'>{t('sellers.details.recentTable.itemsSummary', { count: order.items.length })}</span>
                  <OrderProductsModalButton
                    order={order}
                    canViewCost={canViewCost}
                    tooltip={t('sellers.details.recentTable.viewDetails')}
                    ariaLabel={t('sellers.details.recentTable.viewDetails')}
                    compact
                  />
                  <OrderInvoiceModalButton
                    order={order}
                    canViewCost={canViewCost}
                    tooltip={t('sellers.details.recentTable.exportInvoice')}
                    ariaLabel={t('sellers.details.recentTable.exportInvoice')}
                    compact
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
