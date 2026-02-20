'use client';

import { Tooltip } from 'antd';
import { formatCurrency, formatKg } from 'lib/format';
import { Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { OrderView } from 'types';

type OrderProductsModalButtonProps = {
  order: OrderView;
  canViewCost: boolean;
  tooltip?: string;
  ariaLabel?: string;
  compact?: boolean;
};

export function OrderProductsModalButton({ order, canViewCost, tooltip, ariaLabel, compact = false }: OrderProductsModalButtonProps) {
  const tOrders = useTranslations('ordersPage');
  const [open, setOpen] = useState(false);
  const title = tooltip ?? tOrders('details.viewProducts');

  return (
    <>
      <Tooltip title={title}>
        <button
          type='button'
          onClick={() => setOpen(true)}
          aria-label={ariaLabel ?? title}
          className={`inline-flex items-center justify-center border border-border bg-background-secondary text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground ${
            compact ? 'h-5 w-5 rounded' : 'h-7 w-7 rounded-md'
          }`}>
          <Eye className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      </Tooltip>

      {open ? (
        <div className='fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 p-4'>
          <article className='w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background-secondary shadow-2xl'>
            <header className='flex items-start justify-between gap-3 border-b border-border bg-background-tertiary px-4 py-3'>
              <div className='min-w-0'>
                <h4 className='m-0 text-base font-semibold text-foreground'>{tOrders('details.itemsModalTitle')}</h4>
                <p className='m-0 mt-1 text-xs text-foreground-secondary'>
                  {tOrders('details.itemsModalSubtitle', {
                    code: order.code,
                    customer: order.customerName || order.buyerName,
                  })}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-secondary text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                aria-label={tOrders('details.close')}>
                <X className='h-4 w-4' />
              </button>
            </header>

            <div className='max-h-[70vh] overflow-auto p-4'>
              <div className='overflow-x-auto rounded-xl border border-border'>
                <table className='w-full min-w-[640px] border-collapse text-xs'>
                  <thead className='bg-background-tertiary/70 text-foreground-muted'>
                    <tr className='border-b border-border'>
                      <th className='px-3 py-2 text-left font-semibold uppercase tracking-[0.06em]'>{tOrders('table.products')}</th>
                      <th className='px-3 py-2 text-right font-semibold tracking-[0.06em]'>{tOrders('table.weight')}</th>
                      <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{tOrders('details.labels.salePerKg')}</th>
                      <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{tOrders('details.labels.lineTotal')}</th>
                      {canViewCost ? (
                        <>
                          <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{tOrders('details.labels.costPerKg')}</th>
                          <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{tOrders('details.labels.cost')}</th>
                          <th className='px-3 py-2 text-right font-semibold uppercase tracking-[0.06em]'>{tOrders('details.labels.profit')}</th>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className='bg-background-tertiary/30'>
                    {order.items.map(item => (
                      <tr key={`${order.id}-${item.productId}`} className='border-b border-border last:border-b-0'>
                        <td className='px-3 py-2 text-foreground'>{item.productName}</td>
                        <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatKg(item.weightKg)}</td>
                        <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatCurrency(item.salePricePerKg)}</td>
                        <td className='whitespace-nowrap px-3 py-2 text-right font-medium text-amber-200'>{formatCurrency(item.lineSaleTotal)}</td>
                        {canViewCost ? (
                          <>
                            <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatCurrency(item.costPricePerKg)}</td>
                            <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatCurrency(item.lineCostTotal)}</td>
                            <td className='whitespace-nowrap px-3 py-2 text-right font-medium text-primary-500'>{formatCurrency(item.lineProfit)}</td>
                          </>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className='bg-background-secondary/85 text-foreground'>
                    <tr className='border-t border-border/80'>
                      <td className='px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em]'>{tOrders('details.summary')}</td>
                      <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>{formatKg(order.totalWeightKg)}</td>
                      <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>-</td>
                      <td className='whitespace-nowrap px-3 py-2 text-right font-semibold text-amber-200'>{formatCurrency(order.totalSaleAmount)}</td>
                      {canViewCost ? (
                        <>
                          <td className='whitespace-nowrap px-3 py-2 text-right text-foreground-secondary'>-</td>
                          <td className='whitespace-nowrap px-3 py-2 text-right font-semibold text-foreground-secondary'>
                            {formatCurrency(order.totalCostAmount)}
                          </td>
                          <td className='whitespace-nowrap px-3 py-2 text-right font-semibold text-primary-500'>
                            {formatCurrency(order.totalProfitAmount)}
                          </td>
                        </>
                      ) : null}
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
