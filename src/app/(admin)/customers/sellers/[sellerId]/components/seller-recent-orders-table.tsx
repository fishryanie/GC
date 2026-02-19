'use client';

import { OrderDetailsModal } from '@/components/order-details-modal';
import { Tooltip } from 'antd';
import { formatCurrency, formatDate, formatKg } from 'lib/format';
import { FileText } from 'lucide-react';
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
    <>
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
              <tr key={order.id} className='border-b border-border align-top last:border-b-0 hover:bg-background-tertiary/50'>
                <td className='min-w-[260px] px-3 py-2'>
                  <p className='m-0 truncate font-medium text-foreground'>{order.customerName || order.buyerName}</p>
                  <p className='m-0 mt-0.5 text-[11px] text-foreground-muted'>{t('sellers.details.recentTable.itemsSummary', { count: order.items.length })}</p>
                </td>
                <td className='whitespace-nowrap px-3 py-2 text-foreground-secondary'>{formatDate(order.deliveryDate)}</td>
                <td className='whitespace-nowrap px-3 py-2 text-right font-medium text-amber-200'>{formatCurrency(order.totalSaleAmount)}</td>
                <td className='whitespace-nowrap px-3 py-2 text-right font-semibold text-emerald-300'>{formatCurrency(order.totalProfitAmount)}</td>
                <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>
                  {t('sellers.details.recentTable.itemsSummary', { count: order.items.length })} • {formatKg(order.totalWeightKg)}
                </td>
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
                  <div className='flex items-center'>
                    <OrderDetailsModal
                      order={order}
                      canViewCost={canViewCost}
                      renderTrigger={open => (
                        <Tooltip title={t('sellers.details.recentTable.exportInvoice')}>
                          <button
                            type='button'
                            onClick={open}
                            aria-label={t('sellers.details.recentTable.exportInvoice')}
                            className='inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary-500/35 bg-primary-500/10 text-primary-200 transition-colors hover:border-primary-500/50 hover:bg-primary-500/15 hover:text-primary-100'>
                            <FileText className='h-3.5 w-3.5' />
                          </button>
                        </Tooltip>
                      )}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
