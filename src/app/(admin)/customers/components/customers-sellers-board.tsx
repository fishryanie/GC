'use client';

import { Select } from 'antd';
import type { CustomersPageData, SellersPageData } from 'lib/data';
import { formatCurrency, formatDateTime } from 'lib/format';
import { CheckCircle2, Eye, KeyRound, Lock, Mail, Pencil, Phone, Plus, Search, Shield, User, UserRound, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CustomerView, SellerRole, SellerView } from 'types';

type CustomersSellersBoardProps = {
  activeTab: 'customers' | 'sellers';
  searchQuery: string;
  customerStatus: 'ALL' | 'ACTIVE' | 'INACTIVE';
  sellerRoleFilter: 'ALL' | SellerRole;
  sellerStatus: 'ALL' | 'ENABLED' | 'DISABLED';
  customersData: CustomersPageData;
  sellersData: SellersPageData;
  isAdmin: boolean;
  currentSellerId: string;
  exportHref: string;
  upsertCustomerAction: (formData: FormData) => Promise<void>;
  toggleCustomerStatusAction: (formData: FormData) => Promise<void>;
  upsertSellerAction: (formData: FormData) => Promise<void>;
  toggleSellerStatusAction: (formData: FormData) => Promise<void>;
  resetSellerPasswordAction: (formData: FormData) => Promise<void>;
};

const CUSTOMER_STATUS_OPTIONS: Array<{
  value: 'ALL' | 'ACTIVE' | 'INACTIVE';
  labelKey: 'all' | 'active' | 'inactive';
}> = [
  { value: 'ALL', labelKey: 'all' },
  { value: 'ACTIVE', labelKey: 'active' },
  { value: 'INACTIVE', labelKey: 'inactive' },
];

const SELLER_ROLE_OPTIONS: Array<{
  value: 'ALL' | SellerRole;
  labelKey: 'allRoles' | 'roleAdmin' | 'roleSeller';
}> = [
  { value: 'ALL', labelKey: 'allRoles' },
  { value: 'ADMIN', labelKey: 'roleAdmin' },
  { value: 'SELLER', labelKey: 'roleSeller' },
];

const SELLER_STATUS_OPTIONS: Array<{
  value: 'ALL' | 'ENABLED' | 'DISABLED';
  labelKey: 'all' | 'enabled' | 'disabled';
}> = [
  { value: 'ALL', labelKey: 'all' },
  { value: 'ENABLED', labelKey: 'enabled' },
  { value: 'DISABLED', labelKey: 'disabled' },
];

export function CustomersSellersBoard({
  activeTab,
  searchQuery,
  customerStatus,
  sellerRoleFilter,
  sellerStatus,
  customersData,
  sellersData,
  isAdmin,
  currentSellerId,
  exportHref,
  upsertCustomerAction,
  toggleCustomerStatusAction,
  upsertSellerAction,
  toggleSellerStatusAction,
  resetSellerPasswordAction,
}: CustomersSellersBoardProps) {
  const t = useTranslations('customersPage');

  const [customerModalMode, setCustomerModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerView | null>(null);

  const [sellerModalMode, setSellerModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingSeller, setEditingSeller] = useState<SellerView | null>(null);
  const [sellerRoleDraft, setSellerRoleDraft] = useState<SellerRole>('SELLER');

  const [resetTarget, setResetTarget] = useState<SellerView | null>(null);
  const [customerStatusValue, setCustomerStatusValue] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(customerStatus);
  const [sellerRoleFilterValue, setSellerRoleFilterValue] = useState<'ALL' | SellerRole>(sellerRoleFilter);
  const [sellerStatusValue, setSellerStatusValue] = useState<'ALL' | 'ENABLED' | 'DISABLED'>(sellerStatus);

  const customerModalTitle = useMemo(() => {
    if (customerModalMode === 'edit') {
      return t('customers.modal.editTitle');
    }

    return t('customers.modal.createTitle');
  }, [customerModalMode, t]);

  const sellerModalTitle = useMemo(() => {
    if (sellerModalMode === 'edit') {
      return t('sellers.modal.editTitle');
    }

    return t('sellers.modal.createTitle');
  }, [sellerModalMode, t]);

  useEffect(() => {
    setCustomerStatusValue(customerStatus);
  }, [customerStatus]);

  useEffect(() => {
    setSellerRoleFilterValue(sellerRoleFilter);
  }, [sellerRoleFilter]);

  useEffect(() => {
    setSellerStatusValue(sellerStatus);
  }, [sellerStatus]);

  return (
    <>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>{t('title')}</h1>
          <p className='text-foreground-secondary'>{t('subtitle')}</p>
        </div>

        <div className='flex items-center gap-2'>
          <Link
            href={exportHref}
            className='inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground'>
            {t('exportButton')}
          </Link>

          {activeTab === 'customers' ? (
            <button
              type='button'
              onClick={() => {
                setEditingCustomer(null);
                setCustomerModalMode('create');
              }}
              className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-600'>
              <Plus className='h-4 w-4' />
              {t('customers.addButton')}
            </button>
          ) : isAdmin ? (
            <button
              type='button'
              onClick={() => {
                setEditingSeller(null);
                setSellerRoleDraft('SELLER');
                setSellerModalMode('create');
              }}
              className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-600'>
              <Plus className='h-4 w-4' />
              {t('sellers.addButton')}
            </button>
          ) : null}
        </div>
      </div>

      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <Link
          href='/customers?tab=customers'
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'customers' ? '!bg-[#22c55e] !text-white' : '!bg-[#171717] !text-[#a3a3a3] hover:!bg-[#262626] hover:!text-[#fafafa]'
          }`}>
          <Users className='h-4 w-4' />
          {t('tabs.customers', { count: customersData.filteredCount })}
        </Link>
        <Link
          href='/customers?tab=sellers'
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sellers' ? '!bg-[#22c55e] !text-white' : '!bg-[#171717] !text-[#a3a3a3] hover:!bg-[#262626] hover:!text-[#fafafa]'
          }`}>
          <Shield className='h-4 w-4' />
          {t('tabs.sellers', { count: sellersData.filteredCount })}
        </Link>
      </div>

      <form method='get' className='mb-6 grid gap-3 rounded-xl border border-border bg-background-secondary p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]'>
        <input type='hidden' name='tab' value={activeTab} />
        {activeTab === 'customers' ? <input type='hidden' name='customerStatus' value={customerStatusValue} /> : null}
        {activeTab === 'sellers' ? <input type='hidden' name='sellerRole' value={sellerRoleFilterValue} /> : null}
        {activeTab === 'sellers' ? <input type='hidden' name='sellerStatus' value={sellerStatusValue} /> : null}
        <label className='space-y-1.5'>
          <span className='text-sm text-foreground-secondary'>{t('filters.search')}</span>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted' />
            <input
              name='q'
              defaultValue={searchQuery}
              placeholder={t('filters.searchPlaceholder')}
              className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary pl-9 pr-3 text-sm text-foreground'
            />
          </div>
        </label>

        {activeTab === 'customers' ? (
          <label className='space-y-1.5'>
            <span className='text-sm text-foreground-secondary'>{t('filters.customerStatus')}</span>
            <Select
              value={customerStatusValue}
              onChange={value => setCustomerStatusValue(value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className='w-full'
              options={CUSTOMER_STATUS_OPTIONS.map(option => ({
                value: option.value,
                label: t(`filters.${option.labelKey}`),
              }))}
            />
          </label>
        ) : (
          <>
            <label className='space-y-1.5'>
              <span className='text-sm text-foreground-secondary'>{t('filters.sellerRole')}</span>
              <Select
                value={sellerRoleFilterValue}
                onChange={value => setSellerRoleFilterValue(value as 'ALL' | SellerRole)}
                className='w-full'
                options={SELLER_ROLE_OPTIONS.map(option => ({
                  value: option.value,
                  label: t(`filters.${option.labelKey}`),
                }))}
              />
            </label>

            <label className='space-y-1.5'>
              <span className='text-sm text-foreground-secondary'>{t('filters.sellerStatus')}</span>
              <Select
                value={sellerStatusValue}
                onChange={value => setSellerStatusValue(value as 'ALL' | 'ENABLED' | 'DISABLED')}
                className='w-full'
                options={SELLER_STATUS_OPTIONS.map(option => ({
                  value: option.value,
                  label: t(`filters.${option.labelKey}`),
                }))}
              />
            </label>
          </>
        )}

        <div className='flex items-end gap-2'>
          <button
            type='submit'
            className='inline-flex h-10 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600'>
            {t('filters.apply')}
          </button>
          <Link
            href={activeTab === 'customers' ? '/customers?tab=customers' : '/customers?tab=sellers'}
            className='inline-flex h-10 items-center rounded-lg border border-border bg-background-tertiary px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
            {t('filters.clear')}
          </Link>
        </div>
      </form>

      {activeTab === 'customers' ? (
        <section className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard
              label={t('customers.stats.total')}
              value={customersData.totalCount}
              icon={<Users className='h-4 w-4 text-emerald-300' />}
              tone='emerald'
            />
            <StatCard
              label={t('customers.stats.active')}
              value={customersData.activeCount}
              icon={<CheckCircle2 className='h-4 w-4 text-sky-300' />}
              tone='sky'
            />
            <StatCard
              label={t('customers.stats.withOrders')}
              value={customersData.customersWithOrders}
              icon={<UserRound className='h-4 w-4 text-violet-300' />}
              tone='violet'
            />
            <StatCard
              label={t('customers.stats.spent')}
              value={formatCurrency(customersData.totalSpentAmount)}
              icon={<Shield className='h-4 w-4 text-amber-300' />}
              tone='amber'
            />
          </div>

          {!customersData.customers.length ? (
            <EmptyState icon={<Users className='h-10 w-10 opacity-50' />} message={t('customers.empty')} />
          ) : (
            <div className='grid gap-3'>
              {customersData.customers.map(customer => (
                <article
                  key={customer.id}
                  className='rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:border-primary-500/40'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex min-w-0 gap-3'>
                      <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500/20'>
                        <User className='h-5 w-5 text-primary-500' />
                      </div>
                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h4 className='m-0 text-base font-semibold text-foreground'>{customer.name}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              customer.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-300'
                            }`}>
                            {customer.isActive ? t('filters.active') : t('filters.inactive')}
                          </span>
                        </div>
                        <div className='mt-1 flex flex-wrap items-center gap-3 text-sm text-foreground-secondary'>
                          <span className='inline-flex items-center gap-1'>
                            <Phone className='h-3.5 w-3.5' />
                            {customer.phone}
                          </span>
                          {customer.email ? (
                            <span className='inline-flex items-center gap-1'>
                              <Mail className='h-3.5 w-3.5' />
                              {customer.email}
                            </span>
                          ) : null}
                        </div>
                        <div className='mt-2 flex flex-wrap items-center gap-4 text-xs text-foreground-muted'>
                          <span>{t('customers.item.orders', { count: customer.orderCount })}</span>
                          <span>{t('customers.item.spent', { amount: formatCurrency(customer.totalSpentAmount) })}</span>
                          <span>
                            {customer.lastOrderAt
                              ? t('customers.item.lastOrder', { value: formatDateTime(customer.lastOrderAt) })
                              : t('customers.item.noOrder')}
                          </span>
                        </div>
                        {customer.notes ? <p className='mt-2 text-sm text-foreground-secondary'>{customer.notes}</p> : null}
                      </div>
                    </div>

                    <div className='flex items-center gap-1'>
                      <Link
                        href={`/customers/customers/${customer.id}`}
                        className='rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                        aria-label={t('customers.viewDetailsAria', { name: customer.name })}>
                        <Eye className='h-4 w-4' />
                      </Link>
                      <button
                        type='button'
                        onClick={() => {
                          setEditingCustomer(customer);
                          setCustomerModalMode('edit');
                        }}
                        className='rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                        aria-label={t('customers.editAria')}>
                        <Pencil className='h-4 w-4' />
                      </button>
                      <form action={toggleCustomerStatusAction}>
                        <input type='hidden' name='customerId' value={customer.id} />
                        <button
                          type='submit'
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            customer.isActive
                              ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                          }`}>
                          {customer.isActive ? t('customers.pause') : t('customers.enable')}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard label={t('sellers.stats.total')} value={sellersData.totalCount} icon={<Users className='h-4 w-4 text-emerald-300' />} tone='emerald' />
            <StatCard label={t('sellers.stats.enabled')} value={sellersData.enabledCount} icon={<CheckCircle2 className='h-4 w-4 text-sky-300' />} tone='sky' />
            <StatCard label={t('sellers.stats.disabled')} value={sellersData.disabledCount} icon={<Lock className='h-4 w-4 text-amber-300' />} tone='amber' />
            <StatCard label={t('sellers.stats.admins')} value={sellersData.adminCount} icon={<Shield className='h-4 w-4 text-violet-300' />} tone='violet' />
          </div>

          {sellersData.topSellers30d.length > 0 ? (
            <section className='rounded-xl border border-border bg-background-secondary p-4'>
              <h3 className='mb-3 mt-0 text-sm font-semibold text-foreground'>{t('sellers.top30d')}</h3>
              <div className='grid gap-2 lg:grid-cols-2'>
                {sellersData.topSellers30d.map(item => (
                  <div key={item.sellerId} className='flex items-center justify-between rounded-lg border border-border bg-background-tertiary px-3 py-2'>
                    <span className='text-sm text-foreground'>{item.sellerName}</span>
                    <span className='text-xs text-foreground-secondary'>
                      {t('sellers.top30dItem', {
                        orders: item.totalOrders,
                        amount: formatCurrency(item.totalSaleAmount),
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {!sellersData.sellers.length ? (
            <EmptyState icon={<Shield className='h-10 w-10 opacity-50' />} message={t('sellers.empty')} />
          ) : (
            <div className='grid gap-3'>
              {sellersData.sellers.map(seller => {
                const isCurrent = seller.id === currentSellerId;
                return (
                  <article
                    key={seller.id}
                    className='rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:border-primary-500/40'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex min-w-0 gap-3'>
                        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500/20'>
                          <Shield className='h-5 w-5 text-primary-500' />
                        </div>
                        <div className='min-w-0'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h4 className='m-0 text-base font-semibold text-foreground'>{seller.name}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                seller.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'
                              }`}>
                              {seller.role === 'ADMIN' ? t('filters.roleAdmin') : t('filters.roleSeller')}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                seller.isEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-300'
                              }`}>
                              {seller.isEnabled ? t('filters.enabled') : t('filters.disabled')}
                            </span>
                            {isCurrent ? (
                              <span className='rounded-full bg-primary-500/20 px-2 py-0.5 text-xs font-medium text-primary-500'>{t('sellers.current')}</span>
                            ) : null}
                          </div>

                          <p className='mt-1 text-sm text-foreground-secondary'>{seller.email}</p>
                          <p className='mt-1 text-xs text-foreground-muted'>
                            {seller.lastLoginAt ? t('sellers.lastLogin', { value: formatDateTime(seller.lastLoginAt) }) : t('sellers.noLogin')}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-1'>
                        <Link
                          href={`/customers/sellers/${seller.id}`}
                          className='rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                          aria-label={t('sellers.viewDetailsAria', { name: seller.name })}>
                          <Eye className='h-4 w-4' />
                        </Link>

                        {isAdmin ? (
                          <>
                            <button
                              type='button'
                              onClick={() => {
                                setEditingSeller(seller);
                                setSellerRoleDraft(seller.role);
                                setSellerModalMode('edit');
                              }}
                              className='rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                              aria-label={t('sellers.editAria')}>
                              <Pencil className='h-4 w-4' />
                            </button>

                            {seller.role === 'SELLER' ? (
                              <button
                                type='button'
                                onClick={() => setResetTarget(seller)}
                                className='rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'
                                aria-label={t('sellers.resetPasswordAria')}>
                                <KeyRound className='h-4 w-4' />
                              </button>
                            ) : null}

                            <form action={toggleSellerStatusAction}>
                              <input type='hidden' name='sellerId' value={seller.id} />
                              <button
                                type='submit'
                                disabled={isCurrent}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                  seller.isEnabled
                                    ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                    : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                }`}>
                                {seller.isEnabled ? t('sellers.disable') : t('sellers.enable')}
                              </button>
                            </form>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {customerModalMode ? (
        <ModalShell
          title={customerModalTitle}
          onClose={() => {
            setCustomerModalMode(null);
            setEditingCustomer(null);
          }}>
          <form key={`${customerModalMode}-${editingCustomer?.id ?? 'new'}`} action={upsertCustomerAction} className='space-y-3'>
            {customerModalMode === 'edit' && editingCustomer ? <input type='hidden' name='id' value={editingCustomer.id} /> : null}
            <Field label={t('customers.modal.name')}>
              <input
                name='name'
                required
                defaultValue={editingCustomer?.name ?? ''}
                className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
              />
            </Field>
            <Field label={t('customers.modal.phone')}>
              <input
                name='phone'
                required
                defaultValue={editingCustomer?.phone ?? ''}
                className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
              />
            </Field>
            <Field label={t('customers.modal.email')}>
              <input
                type='email'
                name='email'
                defaultValue={editingCustomer?.email ?? ''}
                className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
              />
            </Field>
            <Field label={t('customers.modal.notes')}>
              <textarea
                name='notes'
                rows={3}
                defaultValue={editingCustomer?.notes ?? ''}
                className='focus-ring w-full rounded-lg border border-border bg-background-tertiary px-3 py-2 text-sm text-foreground'
              />
            </Field>
            <ModalActions
              cancelLabel={t('modal.cancel')}
              submitLabel={customerModalMode === 'edit' ? t('customers.modal.submitEdit') : t('customers.modal.submitCreate')}
              onCancel={() => {
                setCustomerModalMode(null);
                setEditingCustomer(null);
              }}
            />
          </form>
        </ModalShell>
      ) : null}

      {sellerModalMode && isAdmin ? (
        <ModalShell
          title={sellerModalTitle}
          onClose={() => {
            setSellerModalMode(null);
            setEditingSeller(null);
          }}>
          <form key={`${sellerModalMode}-${editingSeller?.id ?? 'new'}`} action={upsertSellerAction} className='space-y-3'>
            {sellerModalMode === 'edit' && editingSeller ? <input type='hidden' name='id' value={editingSeller.id} /> : null}

            <Field label={t('sellers.modal.name')}>
              <input
                name='name'
                required
                defaultValue={editingSeller?.name ?? ''}
                className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
              />
            </Field>

            <Field label={t('sellers.modal.email')}>
              <input
                type='email'
                name='email'
                required
                defaultValue={editingSeller?.email ?? ''}
                className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
              />
            </Field>

            <Field label={t('sellers.modal.role')}>
              <input type='hidden' name='role' value={sellerRoleDraft} />
              <Select
                value={sellerRoleDraft}
                onChange={value => setSellerRoleDraft(value as SellerRole)}
                className='w-full'
                options={[
                  { value: 'SELLER', label: t('filters.roleSeller') },
                  { value: 'ADMIN', label: t('filters.roleAdmin') },
                ]}
              />
            </Field>

            <Field label={t('sellers.modal.password')}>
              <input
                type='password'
                name='password'
                placeholder={sellerModalMode === 'edit' ? t('sellers.modal.passwordOptional') : ''}
                className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
              />
            </Field>

            <ModalActions
              cancelLabel={t('modal.cancel')}
              submitLabel={sellerModalMode === 'edit' ? t('sellers.modal.submitEdit') : t('sellers.modal.submitCreate')}
              onCancel={() => {
                setSellerModalMode(null);
                setEditingSeller(null);
              }}
            />
          </form>
        </ModalShell>
      ) : null}

      {resetTarget && isAdmin ? (
        <ModalShell title={t('sellers.resetModal.title', { name: resetTarget.name })} onClose={() => setResetTarget(null)}>
          <form action={resetSellerPasswordAction} className='space-y-3'>
            <input type='hidden' name='sellerId' value={resetTarget.id} />
            <Field label={t('sellers.resetModal.newPassword')}>
              <input
                type='password'
                name='newPassword'
                required
                className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
              />
            </Field>
            <ModalActions cancelLabel={t('modal.cancel')} submitLabel={t('sellers.resetModal.submit')} onCancel={() => setResetTarget(null)} />
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string | number; icon: ReactNode; tone: 'emerald' | 'sky' | 'amber' | 'violet' }) {
  const toneClass = {
    emerald: 'border-emerald-500/25 bg-emerald-500/10',
    sky: 'border-sky-500/25 bg-sky-500/10',
    amber: 'border-amber-500/25 bg-amber-500/10',
    violet: 'border-violet-500/25 bg-violet-500/10',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className='mb-2 flex items-center gap-2 text-sm text-foreground-secondary'>
        <span className='inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/20'>{icon}</span>
        {label}
      </div>
      <p className='m-0 text-2xl font-bold text-foreground'>{value}</p>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className='flex h-56 flex-col items-center justify-center rounded-xl border border-border bg-background-secondary text-foreground-secondary'>
      {icon}
      <p className='mt-3'>{message}</p>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4'>
      <div className='w-full max-w-lg rounded-xl border border-border bg-background-secondary p-4 shadow-2xl'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='m-0 text-lg font-semibold text-foreground'>{title}</h3>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground'>
            <X className='h-4 w-4' />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className='block space-y-1.5'>
      <span className='text-sm text-foreground-secondary'>{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ cancelLabel, submitLabel, onCancel }: { cancelLabel: string; submitLabel: string; onCancel: () => void }) {
  return (
    <div className='flex justify-end gap-2 pt-2'>
      <button
        type='button'
        onClick={onCancel}
        className='inline-flex h-10 items-center rounded-lg border border-border bg-background-tertiary px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
        {cancelLabel}
      </button>
      <button
        type='submit'
        className='inline-flex h-10 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600'>
        {submitLabel}
      </button>
    </div>
  );
}
