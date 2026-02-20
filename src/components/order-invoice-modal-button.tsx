'use client';

import { Tooltip } from 'antd';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { OrderView } from 'types';
import { OrderDetailsModal } from '@/components/order-details-modal';

type OrderInvoiceModalButtonProps = {
  order: OrderView;
  canViewCost: boolean;
  tooltip?: string;
  ariaLabel?: string;
  compact?: boolean;
};

export function OrderInvoiceModalButton({ order, canViewCost, tooltip, ariaLabel, compact = false }: OrderInvoiceModalButtonProps) {
  const tOrders = useTranslations('ordersPage');
  const title = tooltip ?? tOrders('details.open');

  return (
    <OrderDetailsModal
      order={order}
      canViewCost={canViewCost}
      renderTrigger={open => (
        <Tooltip title={title}>
          <button
            type='button'
            onClick={open}
            aria-label={ariaLabel ?? title}
            className={`inline-flex items-center justify-center border border-primary-500/35 bg-primary-500/10 text-primary-200 transition-colors hover:border-primary-500/50 hover:bg-primary-500/15 hover:text-primary-100 ${
              compact ? 'h-5 w-5 rounded' : 'h-7 w-7 rounded-md'
            }`}>
            <FileText className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </button>
        </Tooltip>
      )}
    />
  );
}
