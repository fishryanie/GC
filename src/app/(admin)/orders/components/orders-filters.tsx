'use client';

import { Select } from 'antd';
import { COLLECTION_STATUSES, ORDER_FULFILLMENT_STATUSES, SUPPLIER_PAYMENT_STATUSES } from 'lib/constants';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

type OrdersFiltersProps = {
  initialValues: {
    fulfillmentStatus?: string;
    supplierPaymentStatus?: string;
    collectionStatus?: string;
    sellerId?: string;
    deliveryYear?: string;
    deliveryMonth?: string;
    deliveryDay?: string;
  };
  availableYears: number[];
  showSellerFilter?: boolean;
  sellerOptions?: Array<{ id: string; name: string }>;
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

export function OrdersFilters({ initialValues, availableYears, showSellerFilter = false, sellerOptions = [] }: OrdersFiltersProps) {
  const t = useTranslations('ordersFilters');
  const tStatuses = useTranslations('statuses');
  const [fulfillmentStatusValue, setFulfillmentStatusValue] = useState(initialValues.fulfillmentStatus || '');
  const [supplierPaymentStatusValue, setSupplierPaymentStatusValue] = useState(initialValues.supplierPaymentStatus || '');
  const [collectionStatusValue, setCollectionStatusValue] = useState(initialValues.collectionStatus || '');
  const [sellerIdValue, setSellerIdValue] = useState(initialValues.sellerId || '');
  const [deliveryYearValue, setDeliveryYearValue] = useState(initialValues.deliveryYear || '');
  const [deliveryMonthValue, setDeliveryMonthValue] = useState(initialValues.deliveryMonth || '');
  const [deliveryDayValue, setDeliveryDayValue] = useState(initialValues.deliveryDay || '');

  return (
    <form method='get' className='space-y-3'>
      {fulfillmentStatusValue ? <input type='hidden' name='fulfillmentStatus' value={fulfillmentStatusValue} /> : null}
      {supplierPaymentStatusValue ? <input type='hidden' name='supplierPaymentStatus' value={supplierPaymentStatusValue} /> : null}
      {collectionStatusValue ? <input type='hidden' name='collectionStatus' value={collectionStatusValue} /> : null}
      {showSellerFilter && sellerIdValue ? <input type='hidden' name='sellerId' value={sellerIdValue} /> : null}
      {deliveryYearValue ? <input type='hidden' name='deliveryYear' value={deliveryYearValue} /> : null}
      {deliveryMonthValue ? <input type='hidden' name='deliveryMonth' value={deliveryMonthValue} /> : null}
      {deliveryDayValue ? <input type='hidden' name='deliveryDay' value={deliveryDayValue} /> : null}

      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-3 ${showSellerFilter ? '2xl:grid-cols-7' : '2xl:grid-cols-6'}`}>
        <label className='space-y-1'>
          <span className='text-sm text-foreground-secondary'>{t('orderStatus')}</span>
          <Select
            value={fulfillmentStatusValue || undefined}
            onChange={value => setFulfillmentStatusValue(value ? String(value) : '')}
            allowClear
            placeholder={t('all')}
            className='w-full'
            options={ORDER_FULFILLMENT_STATUSES.map(status => ({
              value: status,
              label: tStatuses(`fulfillment.${status}`),
            }))}
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm text-foreground-secondary'>{t('capitalCycleStatus')}</span>
          <Select
            value={supplierPaymentStatusValue || undefined}
            onChange={value => setSupplierPaymentStatusValue(value ? String(value) : '')}
            allowClear
            placeholder={t('all')}
            className='w-full'
            options={SUPPLIER_PAYMENT_STATUSES.map(status => ({
              value: status,
              label: tStatuses(`supplierPayment.${status}`),
            }))}
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm text-foreground-secondary'>{t('collectionStatus')}</span>
          <Select
            value={collectionStatusValue || undefined}
            onChange={value => setCollectionStatusValue(value ? String(value) : '')}
            allowClear
            placeholder={t('all')}
            className='w-full'
            options={COLLECTION_STATUSES.map(status => ({
              value: status,
              label: tStatuses(`collection.${status}`),
            }))}
          />
        </label>

        {showSellerFilter ? (
          <label className='space-y-1'>
            <span className='text-sm text-foreground-secondary'>{t('seller')}</span>
            <Select
              value={sellerIdValue || undefined}
              onChange={value => setSellerIdValue(value ? String(value) : '')}
              allowClear
              placeholder={t('allSellers')}
              className='w-full'
              options={sellerOptions.map(seller => ({
                value: seller.id,
                label: seller.name,
              }))}
            />
          </label>
        ) : null}

        <label className='space-y-1'>
          <span className='text-sm text-foreground-secondary'>{t('deliveryYear')}</span>
          <Select
            value={deliveryYearValue || undefined}
            onChange={value => setDeliveryYearValue(value ? String(value) : '')}
            allowClear
            placeholder={t('allYears')}
            className='w-full'
            options={availableYears.map(year => ({
              value: String(year),
              label: String(year),
            }))}
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm text-foreground-secondary'>{t('deliveryMonth')}</span>
          <Select
            value={deliveryMonthValue || undefined}
            onChange={value => setDeliveryMonthValue(value ? String(value) : '')}
            allowClear
            placeholder={t('allMonths')}
            className='w-full'
            options={MONTH_OPTIONS.map(month => ({
              value: String(month),
              label: t('monthLabel', { value: month }),
            }))}
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm text-foreground-secondary'>{t('deliveryDay')}</span>
          <Select
            value={deliveryDayValue || undefined}
            onChange={value => setDeliveryDayValue(value ? String(value) : '')}
            allowClear
            placeholder={t('allDays')}
            className='w-full'
            options={DAY_OPTIONS.map(day => ({
              value: String(day),
              label: t('dayLabel', { value: day }),
            }))}
          />
        </label>
      </div>

      <div className='flex items-center gap-2'>
        <button
          type='submit'
          className='inline-flex h-9 items-center rounded-lg bg-[linear-gradient(90deg,#22c55e,#16a34a)] px-3 text-sm font-medium text-white transition-opacity hover:opacity-90'>
          {t('apply')}
        </button>
        <Link
          href='/orders'
          className='inline-flex h-9 items-center rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/15'>
          {t('clear')}
        </Link>
      </div>
    </form>
  );
}
