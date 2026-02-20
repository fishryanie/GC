'use client';

import { formatCurrency, formatKg } from '@/lib/format';
import { DatePicker, Modal, Radio } from 'antd';
import dayjs from 'dayjs';
import { Eye, Minus, Plus, Printer, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { submitPublicOrderAction } from '../actions';

type PublicSaleItem = {
  productId: string;
  productName: string;
  pricePerKg: number;
};

type PublicOrderBuilderProps = {
  token: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  sellerName: string;
  saleProfileName: string;
  saleItems: PublicSaleItem[];
};

type PaymentMethod = 'CASH' | 'BANK';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function roundWeight(value: number) {
  return Number(value.toFixed(3));
}

export function PublicOrderBuilder({ token, customer, sellerName, saleProfileName, saleItems }: PublicOrderBuilderProps) {
  const t = useTranslations('publicOrderPage');
  const formRef = useRef<HTMLFormElement | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [draftWeights, setDraftWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(saleItems.map(item => [item.productId, 1])),
  );
  const [cartWeights, setCartWeights] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState(() => dayjs());
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const saleItemMap = useMemo(() => new Map(saleItems.map(item => [item.productId, item])), [saleItems]);

  const filteredSaleItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return saleItems;
    }

    return saleItems.filter(item => item.productName.toLowerCase().includes(keyword));
  }, [saleItems, searchTerm]);

  const cartItems = useMemo(
    () =>
      Object.entries(cartWeights)
        .map(([productId, weightKg]) => {
          const saleItem = saleItemMap.get(productId);
          if (!saleItem) {
            return null;
          }

          if (!Number.isFinite(weightKg) || weightKg <= 0) {
            return null;
          }

          return {
            productId,
            productName: saleItem.productName,
            pricePerKg: saleItem.pricePerKg,
            weightKg: roundWeight(weightKg),
            lineTotal: saleItem.pricePerKg * weightKg,
          };
        })
        .filter(Boolean) as Array<{
        productId: string;
        productName: string;
        pricePerKg: number;
        weightKg: number;
        lineTotal: number;
      }>,
    [cartWeights, saleItemMap],
  );

  const totalWeight = useMemo(() => cartItems.reduce((total, item) => total + item.weightKg, 0), [cartItems]);
  const totalAmount = useMemo(() => cartItems.reduce((total, item) => total + item.lineTotal, 0), [cartItems]);

  const canSubmit = cartItems.length > 0 && Boolean(deliveryDate);

  const nowText = useMemo(
    () =>
      new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  );

  function upsertCartWeight(productId: string, nextWeight: number) {
    const safeWeight = roundWeight(nextWeight);

    setCartWeights(previous => {
      const next = { ...previous };

      if (!Number.isFinite(safeWeight) || safeWeight <= 0) {
        delete next[productId];
        return next;
      }

      next[productId] = safeWeight;
      return next;
    });
  }

  function addFromCatalog(productId: string) {
    const draftWeight = Number(draftWeights[productId] ?? 1);
    if (!Number.isFinite(draftWeight) || draftWeight <= 0) {
      return;
    }

    const current = cartWeights[productId] ?? 0;
    upsertCartWeight(productId, current + draftWeight);
  }

  function buildInvoiceHtml() {
    const rowsHtml = cartItems
      .map((item, index) => {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.productName)}</td>
            <td>${escapeHtml(formatKg(item.weightKg))}</td>
            <td>${escapeHtml(formatCurrency(item.pricePerKg))}</td>
            <td style="text-align:right">${escapeHtml(formatCurrency(item.lineTotal))}</td>
          </tr>
        `;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(t('invoiceTitle'))}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;padding:18px;font-family:Arial,sans-serif;background:#f5f5f5;color:#111827}
    .sheet{max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px}
    .title{font-size:28px;font-weight:800;text-align:center;letter-spacing:0.02em;margin:0}
    .sub{margin:6px 0 0;text-align:center;color:#4b5563;font-size:13px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;font-size:13px}
    .meta p{margin:0}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
    th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left}
    th{background:#f9fafb;font-weight:700}
    .summary{margin-top:12px;border-top:1px solid #111827;padding-top:10px}
    .summary .row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px}
    .summary .final{font-size:20px;font-weight:800}
    .thank{margin-top:14px;text-align:center;font-size:13px;color:#4b5563}
    @media print { body{padding:0;background:#fff} .sheet{border:none;border-radius:0;max-width:none;padding:0} }
  </style>
</head>
<body>
  <main class="sheet">
    <h1 class="title">${escapeHtml(t('invoiceTitle'))}</h1>
    <p class="sub">GC Flow</p>

    <section class="meta">
      <p><strong>${escapeHtml(t('invoiceCustomer'))}:</strong> ${escapeHtml(customer.name)} (${escapeHtml(customer.phone)})</p>
      <p><strong>${escapeHtml(t('invoiceSeller'))}:</strong> ${escapeHtml(sellerName)}</p>
      <p><strong>${escapeHtml(t('invoiceProfile'))}:</strong> ${escapeHtml(saleProfileName)}</p>
      <p><strong>${escapeHtml(t('invoiceTime'))}:</strong> ${escapeHtml(nowText)}</p>
      <p><strong>${escapeHtml(t('deliveryDate'))}:</strong> ${escapeHtml(deliveryDate.format('DD/MM/YYYY'))}</p>
      <p><strong>${escapeHtml(t('paymentMethod'))}:</strong> ${escapeHtml(paymentMethod === 'CASH' ? t('paymentCash') : t('paymentBank'))}</p>
    </section>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${escapeHtml(t('tableProduct'))}</th>
          <th>${escapeHtml(t('tableQty'))}</th>
          <th>${escapeHtml(t('tablePrice'))}</th>
          <th style="text-align:right">${escapeHtml(t('tableTotal'))}</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <section class="summary">
      <div class="row"><span>${escapeHtml(t('summaryWeight'))}</span><strong>${escapeHtml(formatKg(totalWeight))}</strong></div>
      <div class="row final"><span>${escapeHtml(t('summaryTotal'))}</span><strong>${escapeHtml(formatCurrency(totalAmount))}</strong></div>
    </section>

    <p class="thank">${escapeHtml(t('invoiceThanks'))}</p>
  </main>
</body>
</html>`;
  }

  function printInvoice() {
    const popup = window.open('', '_blank', 'width=900,height=760,noopener,noreferrer');
    if (!popup) {
      return;
    }

    popup.document.open();
    popup.document.write(buildInvoiceHtml());
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function handleConfirmSubmit() {
    if (!canSubmit) {
      return;
    }

    printInvoice();
    setInvoiceModalOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} id='public-order-form' action={submitPublicOrderAction} className='space-y-4'>
      <input type='hidden' name='token' value={token} />
      <input type='hidden' name='customerId' value={customer.id} />
      <input type='hidden' name='deliveryDate' value={deliveryDate.format('YYYY-MM-DD')} />
      <input
        type='hidden'
        name='itemsJson'
        value={JSON.stringify(
          cartItems.map(item => ({
            productId: item.productId,
            weightKg: item.weightKg,
          })),
        )}
      />

      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(450px,0.95fr)]'>
        <section className='rounded-xl border border-border bg-background-secondary p-4'>
          <div className='mb-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-background-tertiary px-3 py-2'>
            <p className='m-0 text-sm font-semibold text-foreground'>{t('catalogTitle')}</p>
            <p className='m-0 text-sm text-foreground-secondary'>{t('catalogAll')}</p>
          </div>

          <div className='relative mb-3'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted' />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className='focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary pl-9 pr-3 text-sm text-foreground'
            />
          </div>

          <div className='overflow-hidden rounded-lg border border-border'>
            <div className='max-h-[62vh] overflow-y-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-background-tertiary'>
                    <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>#</th>
                    <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tableProduct')}</th>
                    <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tablePrice')}</th>
                    <th className='px-3 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tableAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSaleItems.length ? (
                    filteredSaleItems.map((item, index) => {
                      const draftWeight = Number(draftWeights[item.productId] ?? 1);
                      return (
                        <tr key={item.productId} className='border-t border-border'>
                          <td className='px-3 py-2 text-sm text-foreground-secondary'>{index + 1}</td>
                          <td className='px-3 py-2 text-sm text-foreground'>{item.productName}</td>
                          <td className='px-3 py-2 text-sm font-semibold text-emerald-300'>{formatCurrency(item.pricePerKg)}</td>
                          <td className='px-3 py-2'>
                            <div className='flex items-center gap-1.5'>
                              <input
                                type='number'
                                min={0.1}
                                step={0.1}
                                value={draftWeight}
                                onChange={event => {
                                  const nextWeight = Number(event.target.value || 0);
                                  setDraftWeights(previous => ({
                                    ...previous,
                                    [item.productId]: nextWeight,
                                  }));
                                }}
                                className='focus-ring h-8 w-20 rounded-md border border-border bg-background px-2 text-xs text-foreground'
                              />
                              <button
                                type='button'
                                onClick={() => addFromCatalog(item.productId)}
                                className='inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary-500 text-white transition-colors hover:bg-primary-600'>
                                <Plus className='h-4 w-4' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className='px-3 py-8 text-center text-sm text-foreground-secondary'>
                        {t('noProductFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className='rounded-xl border border-border bg-background-secondary p-4 xl:sticky xl:top-[84px] xl:max-h-[calc(100vh-112px)] xl:self-start xl:overflow-hidden'>
          <div className='mb-3 border-b border-border pb-3'>
            <p className='m-0 text-xs uppercase tracking-[0.08em] text-foreground-muted'>{t('orderDetailTitle')}</p>
            <h3 className='m-0 mt-1 text-xl font-bold text-primary-500'>{customer.name}</h3>

            <div className='mt-2 grid gap-2 sm:grid-cols-2'>
              <div className='rounded-lg border border-border bg-background-tertiary px-3 py-2 text-sm text-foreground-secondary'>
                {customer.phone}
              </div>
              <DatePicker
                value={deliveryDate}
                onChange={value => setDeliveryDate(value || dayjs())}
                className='w-full'
                format='DD/MM/YYYY'
                allowClear={false}
              />
            </div>
          </div>

          <div className='overflow-hidden rounded-lg border border-border'>
            <div className='max-h-[36vh] overflow-y-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-background-tertiary'>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>#</th>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tableProduct')}</th>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tableQty')}</th>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tablePrice')}</th>
                    <th className='px-2 py-2 text-right text-xs font-semibold text-foreground-secondary'>{t('tableTotal')}</th>
                    <th className='px-2 py-2 text-right text-xs font-semibold text-foreground-secondary'> </th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length ? (
                    cartItems.map((item, index) => (
                      <tr key={item.productId} className='border-t border-border'>
                        <td className='px-2 py-2 text-xs text-foreground-secondary'>{index + 1}</td>
                        <td className='px-2 py-2 text-sm text-foreground'>{item.productName}</td>
                        <td className='px-2 py-2'>
                          <div className='flex items-center gap-1'>
                            <button
                              type='button'
                              onClick={() => upsertCartWeight(item.productId, item.weightKg - 0.1)}
                              className='inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-500/20 text-red-300 transition-colors hover:bg-red-500/30'>
                              <Minus className='h-3.5 w-3.5' />
                            </button>
                            <span className='min-w-[52px] text-center text-xs font-semibold text-foreground'>{formatKg(item.weightKg)}</span>
                            <button
                              type='button'
                              onClick={() => upsertCartWeight(item.productId, item.weightKg + 0.1)}
                              className='inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300 transition-colors hover:bg-emerald-500/30'>
                              <Plus className='h-3.5 w-3.5' />
                            </button>
                          </div>
                        </td>
                        <td className='px-2 py-2 text-sm text-foreground-secondary'>{formatCurrency(item.pricePerKg)}</td>
                        <td className='px-2 py-2 text-right text-sm font-semibold text-foreground'>{formatCurrency(item.lineTotal)}</td>
                        <td className='px-2 py-2 text-right'>
                          <button
                            type='button'
                            onClick={() => upsertCartWeight(item.productId, 0)}
                            className='inline-flex h-7 w-7 items-center justify-center rounded-md bg-background text-foreground-secondary transition-colors hover:text-red-300'>
                            <Trash2 className='h-3.5 w-3.5' />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className='px-3 py-8 text-center text-sm text-foreground-secondary'>
                        {t('cartEmpty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className='mt-3 space-y-2 border-t border-border pt-3'>
            <div className='flex items-center justify-between text-sm text-foreground-secondary'>
              <span>{t('summaryWeight')}</span>
              <strong className='text-foreground'>{formatKg(totalWeight)}</strong>
            </div>
            <div className='flex items-center justify-between text-sm text-foreground-secondary'>
              <span>{t('summaryTotal')}</span>
              <strong className='text-xl text-foreground'>{formatCurrency(totalAmount)}</strong>
            </div>
          </div>

          <div className='mt-4 grid gap-2 sm:grid-cols-2'>
            <button
              type='button'
              onClick={() => setCartWeights({})}
              className='inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background-tertiary px-3 text-sm font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
              {t('clear')}
            </button>
            <button
              type='button'
              disabled={!canSubmit}
              onClick={() => setInvoiceModalOpen(true)}
              className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60'>
              <Eye className='h-4 w-4' />
              {t('openInvoice')}
            </button>
          </div>
        </section>
      </div>

      <Modal open={invoiceModalOpen} onCancel={() => setInvoiceModalOpen(false)} footer={null} title={t('invoiceModalTitle')} destroyOnHidden width={680}>
        <div className='space-y-4'>
          <section className='rounded-lg border border-border bg-background p-4'>
            <h3 className='m-0 text-center text-2xl font-bold tracking-[0.06em] text-foreground'>{t('invoiceTitle')}</h3>
            <p className='m-0 mt-1 text-center text-sm text-foreground-secondary'>GC Flow</p>

            <div className='mt-3 grid gap-2 text-sm sm:grid-cols-2'>
              <p className='m-0 text-foreground-secondary'>
                <span className='font-semibold text-foreground'>{t('invoiceCustomer')}:</span> {customer.name} ({customer.phone})
              </p>
              <p className='m-0 text-foreground-secondary'>
                <span className='font-semibold text-foreground'>{t('invoiceSeller')}:</span> {sellerName}
              </p>
              <p className='m-0 text-foreground-secondary'>
                <span className='font-semibold text-foreground'>{t('invoiceProfile')}:</span> {saleProfileName}
              </p>
              <p className='m-0 text-foreground-secondary'>
                <span className='font-semibold text-foreground'>{t('invoiceTime')}:</span> {nowText}
              </p>
              <p className='m-0 text-foreground-secondary'>
                <span className='font-semibold text-foreground'>{t('deliveryDate')}:</span> {deliveryDate.format('DD/MM/YYYY')}
              </p>
            </div>

            <div className='mt-3 overflow-hidden rounded-lg border border-border'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='bg-background-tertiary'>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>#</th>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tableProduct')}</th>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tableQty')}</th>
                    <th className='px-2 py-2 text-left text-xs font-semibold text-foreground-secondary'>{t('tablePrice')}</th>
                    <th className='px-2 py-2 text-right text-xs font-semibold text-foreground-secondary'>{t('tableTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={item.productId} className='border-t border-border'>
                      <td className='px-2 py-2 text-xs text-foreground-secondary'>{index + 1}</td>
                      <td className='px-2 py-2 text-sm text-foreground'>{item.productName}</td>
                      <td className='px-2 py-2 text-sm text-foreground-secondary'>{formatKg(item.weightKg)}</td>
                      <td className='px-2 py-2 text-sm text-foreground-secondary'>{formatCurrency(item.pricePerKg)}</td>
                      <td className='px-2 py-2 text-right text-sm font-semibold text-foreground'>{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='mt-3 border-t border-border pt-3'>
              <div className='flex items-center justify-between text-sm text-foreground-secondary'>
                <span>{t('summaryWeight')}</span>
                <strong className='text-foreground'>{formatKg(totalWeight)}</strong>
              </div>
              <div className='mt-2 flex items-center justify-between text-lg font-bold text-foreground'>
                <span>{t('summaryTotal')}</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <p className='mb-0 mt-4 text-center text-sm italic text-foreground-secondary'>{t('invoiceThanks')}</p>
          </section>

          <section className='rounded-lg border border-border bg-background-tertiary p-3'>
            <p className='m-0 mb-2 text-sm font-semibold text-foreground'>{t('paymentMethod')}</p>
            <Radio.Group value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)}>
              <Radio value='CASH'>{t('paymentCash')}</Radio>
              <Radio value='BANK'>{t('paymentBank')}</Radio>
            </Radio.Group>
          </section>

          <div className='grid gap-2 sm:grid-cols-3'>
            <button
              type='button'
              onClick={() => setInvoiceModalOpen(false)}
              className='inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background-tertiary px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:text-foreground'>
              {t('close')}
            </button>
            <button
              type='button'
              onClick={printInvoice}
              className='inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary-500/50 bg-primary-500/10 px-4 text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-500/20'>
              <Printer className='h-4 w-4' />
              {t('printOnly')}
            </button>
            <button
              type='button'
              disabled={!canSubmit}
              onClick={handleConfirmSubmit}
              className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60'>
              <ShoppingCart className='h-4 w-4' />
              {t('printAndSubmit')}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
