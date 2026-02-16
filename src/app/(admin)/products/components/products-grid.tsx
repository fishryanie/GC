'use client';

import { Switch } from 'antd';
import { deleteProductAction, toggleProductStatusAction, upsertProductAction } from '../actions';
import { formatCurrency } from 'lib/format';
import { Edit2, Package, PauseCircle, PlayCircle, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ProductView } from 'types';

type ProductFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const FILTER_OPTIONS: Array<{
  value: ProductFilter;
  labelKey: 'all' | 'active' | 'inactive';
  icon: typeof Package;
}> = [
  { value: 'ALL', labelKey: 'all', icon: Package },
  { value: 'ACTIVE', labelKey: 'active', icon: PlayCircle },
  { value: 'INACTIVE', labelKey: 'inactive', icon: PauseCircle },
];

type ProductsGridProps = {
  products: ProductView[];
  productStats: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
  };
  activeFilter: ProductFilter;
  searchQuery: string;
  defaultSalePrices: Record<string, number>;
  exportHref: string;
};

type ModalMode = 'create' | 'edit';

export function ProductsGrid({
  products,
  productStats,
  activeFilter,
  searchQuery,
  defaultSalePrices,
  exportHref,
}: ProductsGridProps) {
  const t = useTranslations('products');
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductView | null>(null);

  const modalTitle = useMemo(() => {
    if (modalMode === 'edit') {
      return t('modal.editTitle');
    }

    return t('modal.createTitle');
  }, [modalMode, t]);

  function buildProductsHref(filter: ProductFilter) {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set('q', searchQuery);
    }

    if (filter !== 'ALL') {
      params.set('status', filter);
    }

    return params.toString() ? `/products?${params.toString()}` : '/products';
  }

  return (
    <>
      <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-xl font-bold text-foreground sm:text-2xl'>{t('title')}</h1>
          <p className='mt-1 text-sm text-foreground-secondary sm:text-base'>{t('subtitle')}</p>
        </div>

        <div className='grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end'>
          <Link
            href={exportHref}
            className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground sm:w-auto sm:justify-start'>
            {t('exportButton')}
          </Link>
          <button
            type='button'
            onClick={() => {
              setEditingProduct(null);
              setModalMode('create');
            }}
            className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 sm:w-auto sm:justify-start'>
            <Plus className='h-4 w-4' />
            {t('addProduct')}
          </button>
        </div>
      </div>

      <div className='mb-6 flex flex-col gap-3 lg:flex-row lg:items-center'>
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap'>
          {FILTER_OPTIONS.map(option => {
            const Icon = option.icon;
            const isActive = activeFilter === option.value;
            const count =
              option.value === 'ALL' ? productStats.totalProducts : option.value === 'ACTIVE' ? productStats.activeProducts : productStats.inactiveProducts;

            return (
              <Link
                key={option.value}
                href={buildProductsHref(option.value)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors sm:justify-start lg:w-auto ${
                  isActive
                    ? '!bg-[var(--primary-500)] !text-white'
                    : '!bg-[var(--background-secondary)] !text-[var(--foreground-secondary)] hover:!bg-[var(--background-hover)] hover:!text-[var(--foreground)]'
                }`}>
                <Icon className='h-4 w-4' />
                {t(`filters.${option.labelKey}`)} ({count})
              </Link>
            );
          })}
        </div>

        <form method='get' className='relative w-full lg:ml-auto lg:max-w-md'>
          {activeFilter !== 'ALL' ? <input type='hidden' name='status' value={activeFilter} /> : null}
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary' />
          <input
            type='text'
            name='q'
            defaultValue={searchQuery}
            placeholder={t('searchPlaceholder')}
            className='h-10 w-full rounded-lg border border-border bg-background-secondary pl-10 pr-4 text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary-500'
          />
        </form>
      </div>

      {!products.length ? (
        <div className='flex h-56 flex-col items-center justify-center rounded-xl border border-border bg-background-secondary text-foreground-secondary'>
          <Package className='mb-3 h-10 w-10 opacity-60' />
          <p className='m-0'>{t('empty')}</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {products.map(product => (
            <article key={product.id} className='rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:border-primary-500/50'>
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(34,197,94,0.2)]'>
                  <Package className='h-5 w-5 text-primary-500' />
                </div>
                <div className='flex flex-col justify-end items-end'>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setEditingProduct(product);
                        setModalMode('edit');
                      }}
                      className='rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-[var(--background-hover)] hover:text-foreground'
                      aria-label={t('editAria')}>
                      <Edit2 className='h-4 w-4' />
                    </button>

                    <form action={deleteProductAction}>
                      <input type='hidden' name='productId' value={product.id} />
                      <button
                        type='submit'
                        className='rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300'
                        aria-label={t('deleteAria')}>
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <h4 className='mb-1 mt-0 text-base font-medium text-foreground'>{product.name}</h4>
              <p className='mb-3 mt-0 text-sm text-foreground-secondary'>{product.description || t('noDescription')}</p>

              <div className='flex items-center justify-between'>
                <span className='font-semibold text-primary-500'>{formatCurrency(defaultSalePrices[product.id] ?? 0)}</span>
                <form action={toggleProductStatusAction} id={`toggle-product-${product.id}`}>
                  <input type='hidden' name='productId' value={product.id} />
                  <Switch
                    checked={product.isActive}
                    size='small'
                    onChange={() => {
                      const form = document.getElementById(`toggle-product-${product.id}`) as HTMLFormElement | null;
                      form?.requestSubmit();
                    }}
                  />
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalMode ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-xl border border-border bg-background-secondary shadow-xl'>
            <div className='flex items-center justify-between border-b border-border p-4'>
              <h3 className='m-0 text-lg font-semibold text-foreground'>{modalTitle}</h3>
              <button
                type='button'
                onClick={() => {
                  setModalMode(null);
                  setEditingProduct(null);
                }}
                className='rounded-lg p-2 transition-colors hover:bg-background-hover'
                aria-label={t('modal.closeAria')}>
                <X className='h-5 w-5' />
              </button>
            </div>

            <form key={`${modalMode}-${editingProduct?.id ?? 'new'}`} action={upsertProductAction} className='space-y-4 p-4'>
              {modalMode === 'edit' && editingProduct ? <input type='hidden' name='id' value={editingProduct.id} /> : null}

              <div>
                <label className='mb-1 block text-sm text-foreground-secondary'>{t('modal.name')}</label>
                <input
                  name='name'
                  required
                  defaultValue={editingProduct?.name ?? ''}
                  placeholder={t('modal.namePlaceholder')}
                  className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-foreground placeholder:text-foreground-muted'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm text-foreground-secondary'>{t('modal.description')}</label>
                <textarea
                  name='description'
                  defaultValue={editingProduct?.description ?? ''}
                  placeholder={t('modal.descriptionPlaceholder')}
                  rows={2}
                  maxLength={300}
                  className='focus-ring w-full resize-none rounded-lg border border-border bg-background-tertiary px-3 py-2 text-foreground placeholder:text-foreground-muted'
                />
              </div>

              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => {
                    setModalMode(null);
                    setEditingProduct(null);
                  }}
                  className='h-10 flex-1 rounded-lg border border-border bg-background-tertiary text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'>
                  {t('modal.cancel')}
                </button>
                <button
                  type='submit'
                  className='inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 text-sm font-medium text-white transition-colors hover:bg-primary-600'>
                  <Save className='h-4 w-4' />
                  {modalMode === 'edit' ? t('modal.submitUpdate') : t('modal.submitCreate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
