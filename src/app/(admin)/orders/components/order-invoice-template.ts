import { formatCurrency, formatDate, formatDateTime, formatKg } from 'lib/format';
import type { OrderView } from 'types';

type InvoiceWindowMode = 'preview' | 'print';

type OrderInvoiceLabels = {
  invoiceTitle: string;
  appName: string;
  appSubtitle: string;
  invoiceCode: string;
  createdAt: string;
  deliveryDate: string;
  buyer: string;
  product: string;
  seller: string;
  saleProfile: string;
  costProfile: string;
  weightKg: string;
  salePerKg: string;
  lineTotal: string;
  costPerKg: string;
  costTotal: string;
  profit: string;
  bill: string;
  baseSale: string;
  totalCost: string;
  totalProfit: string;
  totalWeight: string;
  collectionStatus: string;
  fulfillmentStatus: string;
  supplierStatus: string;
  approvalStatus: string;
  discountStatus: string;
  generatedAt: string;
  savePdfHint: string;
  noData: string;
  discountRequest: string;
  requestedAmount: string;
  requestedPercent: string;
  reason: string;
  systemSeller: string;
  printButton: string;
  closeButton: string;
};

type OpenOrderInvoiceWindowArgs = {
  order: OrderView;
  canViewCost: boolean;
  labels: OrderInvoiceLabels;
  statusLabels: {
    fulfillment: string;
    collection: string;
    supplier: string;
    approval: string;
    discount: string;
  };
  mode: InvoiceWindowMode;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function openOrderInvoiceWindow({ order, canViewCost, labels, statusLabels, mode }: OpenOrderInvoiceWindowArgs) {
  const rowsHtml = order.items
    .map(item => {
      const baseColumns = `
        <td>${escapeHtml(item.productName)}</td>
        <td>${formatKg(item.weightKg)}</td>
        <td>${formatCurrency(item.salePricePerKg)}</td>
        <td class="text-right">${formatCurrency(item.lineSaleTotal)}</td>
      `;

      const costColumns = canViewCost
        ? `
            <td>${formatCurrency(item.costPricePerKg)}</td>
            <td>${formatCurrency(item.lineCostTotal)}</td>
            <td class="text-right">${formatCurrency(item.lineProfit)}</td>
          `
        : '';

      return `<tr>${baseColumns}${costColumns}</tr>`;
    })
    .join('');

  const discountHtml =
    order.discountRequest.status !== 'NONE'
      ? `
      <div class="note-block">
        <p><strong>${escapeHtml(labels.discountRequest)}:</strong> ${escapeHtml(statusLabels.discount)}</p>
        <p>${escapeHtml(labels.requestedPercent)}: ${order.discountRequest.requestedPercent.toFixed(1)}%</p>
        <p>${escapeHtml(labels.requestedAmount)}: ${formatCurrency(order.discountRequest.requestedSaleAmount)}</p>
        ${
          order.discountRequest.reason
            ? `<p>${escapeHtml(labels.reason)}: ${escapeHtml(order.discountRequest.reason)}</p>`
            : ''
        }
      </div>
    `
      : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(labels.invoiceTitle)} ${escapeHtml(order.code)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: "Be Vietnam Pro", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 20px;
    }
    .actions {
      max-width: 960px;
      margin: 0 auto 14px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .actions button {
      border: 1px solid #d1d5db;
      border-radius: 10px;
      height: 38px;
      padding: 0 14px;
      background: #fff;
      color: #111827;
      font-size: 13px;
      cursor: pointer;
    }
    .actions .primary {
      background: #22c55e;
      border-color: #22c55e;
      color: #fff;
    }
    .invoice {
      max-width: 960px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      background: #fff;
      padding: 28px 28px 22px;
      box-shadow: 0 14px 28px rgba(17, 24, 39, 0.08);
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      border-bottom: 1px dashed #d1d5db;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .brand-title {
      margin: 0 0 6px;
      font-size: 24px;
      line-height: 1.15;
      letter-spacing: 0.02em;
    }
    .brand-subtitle {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1.2;
    }
    .invoice-code {
      margin-top: 4px;
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 14px;
      color: #16a34a;
      font-weight: 600;
    }
    .meta-line {
      margin-top: 4px;
      font-size: 13px;
      color: #4b5563;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 14px;
    }
    .status-item {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.35;
      background: #fafafa;
    }
    .status-label {
      color: #6b7280;
      display: block;
      margin-bottom: 2px;
    }
    .status-value {
      color: #111827;
      font-weight: 600;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }
    .info-card {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .info-card .label {
      margin: 0;
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.04em;
    }
    .info-card .value {
      margin: 4px 0 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      line-height: 1.3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 14px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    thead th {
      background: #f9fafb;
      color: #374151;
      font-size: 12px;
      font-weight: 600;
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody td {
      font-size: 13px;
      color: #111827;
      padding: 10px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: min(380px, 100%);
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 12px;
      background: #fafafa;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #374151;
      margin-bottom: 7px;
    }
    .totals-row:last-child {
      margin-bottom: 0;
    }
    .totals-row strong {
      color: #111827;
    }
    .totals-row.final {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #d1d5db;
      font-size: 16px;
      font-weight: 700;
    }
    .totals-row.final strong {
      color: #16a34a;
    }
    .note-block {
      margin-top: 12px;
      border: 1px solid #fde68a;
      border-radius: 10px;
      background: #fffbeb;
      padding: 10px 12px;
      font-size: 12px;
      color: #92400e;
    }
    .note-block p {
      margin: 0 0 4px;
    }
    .note-block p:last-child {
      margin-bottom: 0;
    }
    .footer {
      margin-top: 16px;
      border-top: 1px dashed #d1d5db;
      padding-top: 10px;
      font-size: 11px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    @media print {
      body {
        padding: 0;
        background: #fff;
      }
      .no-print {
        display: none !important;
      }
      .invoice {
        max-width: none;
        border: none;
        border-radius: 0;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button type="button" onclick="window.close()">${escapeHtml(labels.closeButton)}</button>
    <button type="button" class="primary" onclick="window.print()">${escapeHtml(labels.printButton)}</button>
  </div>

  <article class="invoice">
    <header class="header">
      <div>
        <h1 class="brand-title">${escapeHtml(labels.appName)}</h1>
        <p class="brand-subtitle">${escapeHtml(labels.appSubtitle)}</p>
      </div>
      <div class="invoice-meta">
        <h2>${escapeHtml(labels.invoiceTitle)}</h2>
        <p class="invoice-code">#${escapeHtml(order.code)}</p>
        <p class="meta-line">${escapeHtml(labels.createdAt)}: ${formatDateTime(order.createdAt)}</p>
        <p class="meta-line">${escapeHtml(labels.deliveryDate)}: ${formatDate(order.deliveryDate)}</p>
      </div>
    </header>

    <section class="status-grid">
      <div class="status-item">
        <span class="status-label">${escapeHtml(labels.fulfillmentStatus)}</span>
        <span class="status-value">${escapeHtml(statusLabels.fulfillment)}</span>
      </div>
      <div class="status-item">
        <span class="status-label">${escapeHtml(labels.collectionStatus)}</span>
        <span class="status-value">${escapeHtml(statusLabels.collection)}</span>
      </div>
      <div class="status-item">
        <span class="status-label">${escapeHtml(labels.supplierStatus)}</span>
        <span class="status-value">${escapeHtml(statusLabels.supplier)}</span>
      </div>
      <div class="status-item">
        <span class="status-label">${escapeHtml(labels.approvalStatus)}</span>
        <span class="status-value">${escapeHtml(statusLabels.approval)}</span>
      </div>
    </section>

    <section class="info-grid">
      <article class="info-card">
        <p class="label">${escapeHtml(labels.buyer)}</p>
        <p class="value">${escapeHtml(order.customerName || order.buyerName || labels.noData)}</p>
      </article>
      <article class="info-card">
        <p class="label">${escapeHtml(labels.seller)}</p>
        <p class="value">${escapeHtml(order.sellerName || labels.systemSeller)}</p>
      </article>
      <article class="info-card">
        <p class="label">${escapeHtml(labels.saleProfile)}</p>
        <p class="value">${escapeHtml(order.saleProfile.profileName)}</p>
      </article>
      <article class="info-card">
        <p class="label">${escapeHtml(labels.costProfile)}</p>
        <p class="value">${escapeHtml(order.costProfile.profileName)}</p>
      </article>
    </section>

    <table>
      <thead>
        <tr>
          <th>${escapeHtml(labels.product)}</th>
          <th>${escapeHtml(labels.weightKg)}</th>
          <th>${escapeHtml(labels.salePerKg)}</th>
          <th class="text-right">${escapeHtml(labels.lineTotal)}</th>
          ${
            canViewCost
              ? `
                <th>${escapeHtml(labels.costPerKg)}</th>
                <th>${escapeHtml(labels.costTotal)}</th>
                <th class="text-right">${escapeHtml(labels.profit)}</th>
              `
              : ''
          }
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <section class="totals">
      <div class="totals-row">
        <span>${escapeHtml(labels.totalWeight)}</span>
        <strong>${formatKg(order.totalWeightKg)}</strong>
      </div>
      <div class="totals-row">
        <span>${escapeHtml(labels.baseSale)}</span>
        <strong>${formatCurrency(order.baseSaleAmount)}</strong>
      </div>
      <div class="totals-row">
        <span>${escapeHtml(labels.bill)}</span>
        <strong>${formatCurrency(order.totalSaleAmount)}</strong>
      </div>
      ${
        canViewCost
          ? `
            <div class="totals-row">
              <span>${escapeHtml(labels.totalCost)}</span>
              <strong>${formatCurrency(order.totalCostAmount)}</strong>
            </div>
            <div class="totals-row final">
              <span>${escapeHtml(labels.totalProfit)}</span>
              <strong>${formatCurrency(order.totalProfitAmount)}</strong>
            </div>
          `
          : ''
      }
    </section>

    ${discountHtml}

    <footer class="footer">
      <span>${escapeHtml(labels.generatedAt)}: ${formatDateTime(order.updatedAt || order.createdAt)}</span>
      <span>${escapeHtml(labels.savePdfHint)}</span>
    </footer>
  </article>

  <script>
    window.addEventListener('load', function() {
      ${mode === 'print' ? 'setTimeout(function() { window.print(); }, 240);' : ''}
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    return;
  }

  win.document.write(html);
  win.document.close();
  win.focus();
}
