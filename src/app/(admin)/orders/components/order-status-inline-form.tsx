'use client';

import { Select } from 'antd';
import { updateOrderStatusesAction } from '@/app/(admin)/orders/actions';
import type { CollectionStatus, OrderFulfillmentStatus, SupplierPaymentStatus } from 'lib/constants';
import { COLLECTION_STATUSES, ORDER_FULFILLMENT_STATUSES, SUPPLIER_PAYMENT_STATUSES } from 'lib/constants';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type OrderStatusInlineFormProps = {
  orderId: string;
  returnTo: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  supplierPaymentStatus: SupplierPaymentStatus;
  collectionStatus: CollectionStatus;
  readOnly?: boolean;
  compact?: boolean;
};

type OrderWorkflowStatus = 'NEEDS_APPROVAL' | 'CONFIRMED' | 'IN_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELED';

const WORKFLOW_BADGE_CLASS: Record<OrderWorkflowStatus, string> = {
  NEEDS_APPROVAL: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
  CONFIRMED: 'border-sky-500/35 bg-sky-500/15 text-sky-300',
  IN_DELIVERY: 'border-indigo-500/35 bg-indigo-500/15 text-indigo-300',
  DELIVERED: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
  COMPLETED: 'border-teal-500/35 bg-teal-500/15 text-teal-200',
  CANCELED: 'border-red-500/35 bg-red-500/15 text-red-300',
};

const SUPPLIER_BADGE_CLASS: Record<SupplierPaymentStatus, string> = {
  UNPAID_SUPPLIER: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  SUPPLIER_PAID: 'border-blue-500/25 bg-blue-500/10 text-blue-200',
  CAPITAL_CYCLE_COMPLETED: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
};

const COLLECTION_BADGE_CLASS: Record<CollectionStatus, string> = {
  UNPAID: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-200',
  PARTIALLY_PAID: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
  PAID_IN_FULL: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  REFUNDED: 'border-red-500/25 bg-red-500/10 text-red-200',
};

function resolveWorkflowStatus(
  fulfillmentStatus: OrderFulfillmentStatus,
  supplierPaymentStatus: SupplierPaymentStatus,
  collectionStatus: CollectionStatus,
): OrderWorkflowStatus {
  if (fulfillmentStatus === 'PENDING_APPROVAL') {
    return 'NEEDS_APPROVAL';
  }

  if (fulfillmentStatus === 'CANCELED') {
    return 'CANCELED';
  }

  if (fulfillmentStatus === 'DELIVERED') {
    const collectionClosed = collectionStatus === 'PAID_IN_FULL' || collectionStatus === 'REFUNDED';
    if (collectionClosed && supplierPaymentStatus === 'CAPITAL_CYCLE_COMPLETED') {
      return 'COMPLETED';
    }
    return 'DELIVERED';
  }

  if (fulfillmentStatus === 'PICKED' || fulfillmentStatus === 'DELIVERING') {
    return 'IN_DELIVERY';
  }

  return 'CONFIRMED';
}

export function OrderStatusInlineForm({
  orderId,
  returnTo,
  fulfillmentStatus,
  supplierPaymentStatus,
  collectionStatus,
  readOnly = false,
  compact = false,
}: OrderStatusInlineFormProps) {
  const tStatuses = useTranslations('statuses');
  const tStatusForm = useTranslations('orderStatusForm');
  const [fulfillmentStatusValue, setFulfillmentStatusValue] = useState<OrderFulfillmentStatus>(fulfillmentStatus);
  const [supplierPaymentStatusValue, setSupplierPaymentStatusValue] = useState<SupplierPaymentStatus>(supplierPaymentStatus);
  const [collectionStatusValue, setCollectionStatusValue] = useState<CollectionStatus>(collectionStatus);
  const [showEditor, setShowEditor] = useState(!compact && !readOnly);

  useEffect(() => {
    setFulfillmentStatusValue(fulfillmentStatus);
  }, [fulfillmentStatus]);

  useEffect(() => {
    setSupplierPaymentStatusValue(supplierPaymentStatus);
  }, [supplierPaymentStatus]);

  useEffect(() => {
    setCollectionStatusValue(collectionStatus);
  }, [collectionStatus]);

  useEffect(() => {
    if (readOnly) {
      setShowEditor(false);
    }
  }, [readOnly]);

  const workflowStatus = resolveWorkflowStatus(fulfillmentStatus, supplierPaymentStatus, collectionStatus);

  return (
    <form action={updateOrderStatusesAction} className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <input type='hidden' name='orderId' value={orderId} />
      <input type='hidden' name='returnTo' value={returnTo} />
      <input type='hidden' name='fulfillmentStatus' value={fulfillmentStatusValue} />
      <input type='hidden' name='supplierPaymentStatus' value={supplierPaymentStatusValue} />
      <input type='hidden' name='collectionStatus' value={collectionStatusValue} />

      <div className='space-y-1.5'>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${WORKFLOW_BADGE_CLASS[workflowStatus]}`}>
          {tStatusForm(`workflow.${workflowStatus}`)}
        </span>

        <div className='inline-flex flex-wrap gap-1.5'>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${COLLECTION_BADGE_CLASS[collectionStatus]}`}>
            {tStatusForm('collectionInline', { status: tStatuses(`collection.${collectionStatus}`) })}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${SUPPLIER_BADGE_CLASS[supplierPaymentStatus]}`}>
            {tStatusForm('supplierInline', { status: tStatuses(`supplierPayment.${supplierPaymentStatus}`) })}
          </span>
        </div>

        {readOnly && !compact ? <div className='text-xs text-foreground-muted'>{tStatusForm('readOnlyHint')}</div> : null}

        {!readOnly && compact ? (
          <button
            type='button'
            onClick={() => setShowEditor(previous => !previous)}
            className='inline-flex h-7 items-center rounded-md border border-border bg-background-tertiary px-2.5 text-[11px] font-medium text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'>
            {showEditor ? tStatusForm('hideEditor') : tStatusForm('editStatuses')}
          </button>
        ) : null}

        {!readOnly && showEditor ? (
          <>
            {compact ? <p className='m-0 text-[11px] text-foreground-muted'>{tStatusForm('editorHint')}</p> : null}
            <div className='grid grid-cols-1 gap-1.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px]'>
              <Select
                size='small'
                value={fulfillmentStatusValue}
                onChange={value => setFulfillmentStatusValue(value as OrderFulfillmentStatus)}
                className='w-full'
                options={ORDER_FULFILLMENT_STATUSES.filter(status => status !== 'PENDING_APPROVAL').map(status => ({
                  value: status,
                  label: tStatuses(`fulfillment.${status}`),
                }))}
              />

              <Select
                size='small'
                value={supplierPaymentStatusValue}
                onChange={value => setSupplierPaymentStatusValue(value as SupplierPaymentStatus)}
                className='w-full'
                options={SUPPLIER_PAYMENT_STATUSES.map(status => ({
                  value: status,
                  label: tStatuses(`supplierPayment.${status}`),
                }))}
              />

              <Select
                size='small'
                value={collectionStatusValue}
                onChange={value => setCollectionStatusValue(value as CollectionStatus)}
                className='w-full'
                options={COLLECTION_STATUSES.map(status => ({
                  value: status,
                  label: tStatuses(`collection.${status}`),
                }))}
              />

              <button type='submit' className='h-8 rounded-md bg-primary-500 px-2 text-xs font-medium text-white transition-colors hover:bg-primary-600'>
                {tStatusForm('save')}
              </button>
            </div>
          </>
        ) : null}
      </div>

      {readOnly && compact ? (
        <span className='inline-flex items-center rounded-full border border-border bg-background-tertiary px-2 py-0.5 text-[11px] text-foreground-muted'>
          {tStatusForm('readOnlyCompact')}
        </span>
      ) : null}
    </form>
  );
}
