import { getAuthSession } from 'lib/auth';
import { COLLECTION_STATUSES, ORDER_FULFILLMENT_STATUSES, SUPPLIER_PAYMENT_STATUSES } from 'lib/constants';
import { createExcelXmlResponse, escapeRegex } from 'lib/excel-xml';
import { connectToDatabase } from 'lib/mongodb';
import { Order } from 'models/order';
import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExportOrderDocument = {
  code?: string;
  createdAt?: Date;
  deliveryDate?: Date;
  buyerName?: string;
  customerName?: string;
  sellerName?: string;
  fulfillmentStatus?: string;
  supplierPaymentStatus?: string;
  collectionStatus?: string;
  approval?: {
    status?: string;
    requiresAdminApproval?: boolean;
  };
  discountRequest?: {
    status?: string;
    requestedPercent?: number;
    requestedSaleAmount?: number;
  };
  costProfile?: {
    profileName?: string;
  };
  saleProfile?: {
    profileName?: string;
  };
  totalWeightKg?: number;
  baseSaleAmount?: number;
  totalSaleAmount?: number;
  totalCostAmount?: number;
  totalProfitAmount?: number;
  items?: Array<{
    productName?: string;
  }>;
};

function getSearchValue(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() ?? '';
}

function parseIntFilter(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeStatus<T extends readonly string[]>(value: string, accepted: T) {
  return accepted.includes(value as T[number]) ? (value as T[number]) : '';
}

function buildOrdersExportQuery({
  fulfillmentStatus,
  supplierPaymentStatus,
  collectionStatus,
  sellerId,
  deliveryYear,
  deliveryMonth,
  deliveryDay,
  search,
}: {
  fulfillmentStatus?: string;
  supplierPaymentStatus?: string;
  collectionStatus?: string;
  sellerId?: string;
  deliveryYear?: number;
  deliveryMonth?: number;
  deliveryDay?: number;
  search?: string;
}) {
  const query: Record<string, unknown> = {};

  if (fulfillmentStatus) {
    query.fulfillmentStatus = fulfillmentStatus;
  }

  if (supplierPaymentStatus) {
    query.supplierPaymentStatus = supplierPaymentStatus;
  }

  if (collectionStatus) {
    query.collectionStatus = collectionStatus;
  }

  if (sellerId) {
    if (Types.ObjectId.isValid(sellerId)) {
      query.sellerId = new Types.ObjectId(sellerId);
    } else {
      query._id = { $exists: false };
    }
  }

  if (search) {
    const keyword = { $regex: escapeRegex(search), $options: 'i' };
    query.$or = [{ code: keyword }, { buyerName: keyword }, { customerName: keyword }, { sellerName: keyword }, { 'items.productName': keyword }];
  }

  const dateExpr: Record<string, unknown>[] = [];
  if (typeof deliveryYear === 'number') {
    dateExpr.push({ $eq: [{ $year: '$deliveryDate' }, deliveryYear] });
  }
  if (typeof deliveryMonth === 'number') {
    dateExpr.push({ $eq: [{ $month: '$deliveryDate' }, deliveryMonth] });
  }
  if (typeof deliveryDay === 'number') {
    dateExpr.push({ $eq: [{ $dayOfMonth: '$deliveryDate' }, deliveryDay] });
  }

  if (dateExpr.length === 1) {
    query.$expr = dateExpr[0];
  } else if (dateExpr.length > 1) {
    query.$expr = { $and: dateExpr };
  }

  return query;
}

function createFileName(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-').replace('T', '-');
  return `${prefix}-${stamp}.xls`;
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const params = request.nextUrl.searchParams;
  const search = getSearchValue(params, 'q');
  const fulfillmentStatus = normalizeStatus(getSearchValue(params, 'fulfillmentStatus'), ORDER_FULFILLMENT_STATUSES);
  const supplierPaymentStatus = normalizeStatus(getSearchValue(params, 'supplierPaymentStatus'), SUPPLIER_PAYMENT_STATUSES);
  const collectionStatus = normalizeStatus(getSearchValue(params, 'collectionStatus'), COLLECTION_STATUSES);
  const rawSellerId = getSearchValue(params, 'sellerId');
  const deliveryYear = parseIntFilter(getSearchValue(params, 'deliveryYear'));
  const deliveryMonth = parseIntFilter(getSearchValue(params, 'deliveryMonth'));
  const deliveryDay = parseIntFilter(getSearchValue(params, 'deliveryDay'));
  const sellerId = session.seller.role === 'ADMIN' ? rawSellerId : undefined;

  const query = buildOrdersExportQuery({
    fulfillmentStatus: fulfillmentStatus || undefined,
    supplierPaymentStatus: supplierPaymentStatus || undefined,
    collectionStatus: collectionStatus || undefined,
    sellerId: sellerId || undefined,
    deliveryYear,
    deliveryMonth: typeof deliveryMonth === 'number' && deliveryMonth >= 1 && deliveryMonth <= 12 ? deliveryMonth : undefined,
    deliveryDay: typeof deliveryDay === 'number' && deliveryDay >= 1 && deliveryDay <= 31 ? deliveryDay : undefined,
    search: search || undefined,
  });

  await connectToDatabase();

  const cursor = Order.find(query, {
    code: 1,
    createdAt: 1,
    deliveryDate: 1,
    buyerName: 1,
    customerName: 1,
    sellerName: 1,
    fulfillmentStatus: 1,
    supplierPaymentStatus: 1,
    collectionStatus: 1,
    approval: 1,
    discountRequest: 1,
    costProfile: 1,
    saleProfile: 1,
    totalWeightKg: 1,
    baseSaleAmount: 1,
    totalSaleAmount: 1,
    totalCostAmount: 1,
    totalProfitAmount: 1,
    items: 1,
  })
    .sort({ createdAt: -1 })
    .lean()
    .cursor({ batchSize: 500 });

  return createExcelXmlResponse({
    fileName: createFileName('orders'),
    sheetName: 'Orders',
    columns: [
      { key: 'code', header: 'Order Code', width: 120 },
      { key: 'createdAt', header: 'Created At', width: 145 },
      { key: 'deliveryDate', header: 'Delivery Date', width: 120 },
      { key: 'buyerName', header: 'Buyer Name', width: 160 },
      { key: 'customerName', header: 'Customer Name', width: 160 },
      { key: 'sellerName', header: 'Seller Name', width: 140 },
      { key: 'fulfillmentStatus', header: 'Fulfillment', width: 120 },
      { key: 'supplierPaymentStatus', header: 'Supplier Payment', width: 140 },
      { key: 'collectionStatus', header: 'Collection', width: 120 },
      { key: 'approvalStatus', header: 'Approval Status', width: 120 },
      { key: 'discountStatus', header: 'Discount Status', width: 120 },
      { key: 'discountPercent', header: 'Discount %', width: 90 },
      { key: 'discountRequestedSale', header: 'Discount Requested Sale', width: 160 },
      { key: 'costProfile', header: 'Cost Profile', width: 160 },
      { key: 'saleProfile', header: 'Sale Profile', width: 160 },
      { key: 'weightKg', header: 'Weight (kg)', width: 100 },
      { key: 'baseSaleAmount', header: 'Base Sale Amount', width: 130 },
      { key: 'saleAmount', header: 'Sale Amount', width: 120 },
      { key: 'costAmount', header: 'Cost Amount', width: 120 },
      { key: 'profitAmount', header: 'Profit Amount', width: 120 },
      { key: 'itemCount', header: 'Item Count', width: 90 },
      { key: 'products', header: 'Products', width: 420 },
    ],
    writeRows: async writer => {
      let rowCount = 0;

      try {
        for await (const order of cursor as AsyncIterable<ExportOrderDocument>) {
          const items = Array.isArray(order.items) ? order.items : [];
          const products = items
            .map(item => item.productName?.trim())
            .filter((name): name is string => Boolean(name))
            .join(', ');

          await writer.addRow({
            code: order.code || '',
            createdAt: order.createdAt ?? null,
            deliveryDate: order.deliveryDate ?? null,
            buyerName: order.buyerName || '',
            customerName: order.customerName || '',
            sellerName: order.sellerName || '',
            fulfillmentStatus: order.fulfillmentStatus || '',
            supplierPaymentStatus: order.supplierPaymentStatus || '',
            collectionStatus: order.collectionStatus || '',
            approvalStatus: order.approval?.status || '',
            discountStatus: order.discountRequest?.status || '',
            discountPercent: Number(order.discountRequest?.requestedPercent || 0),
            discountRequestedSale: Number(order.discountRequest?.requestedSaleAmount || 0),
            costProfile: order.costProfile?.profileName || '',
            saleProfile: order.saleProfile?.profileName || '',
            weightKg: Number(order.totalWeightKg || 0),
            baseSaleAmount: Number(order.baseSaleAmount || 0),
            saleAmount: Number(order.totalSaleAmount || 0),
            costAmount: Number(order.totalCostAmount || 0),
            profitAmount: Number(order.totalProfitAmount || 0),
            itemCount: items.length,
            products,
          });

          rowCount += 1;
          if (rowCount % 1000 === 0) {
            await yieldToEventLoop();
          }
        }
      } finally {
        await cursor.close();
      }
    },
  });
}
