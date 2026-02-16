import { getAuthSession } from 'lib/auth';
import { createExcelXmlResponse, escapeRegex } from 'lib/excel-xml';
import { connectToDatabase } from 'lib/mongodb';
import { Customer } from 'models/customer';
import { Seller } from 'models/seller';
import { NextRequest, NextResponse } from 'next/server';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExportCustomerDocument = {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive?: boolean;
  orderCount?: number;
  totalSpentAmount?: number;
  lastOrderAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

type ExportSellerDocument = {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'SELLER';
  isEnabled?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

function getSearchValue(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() ?? '';
}

function createFileName(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-').replace('T', '-');
  return `${prefix}-${stamp}.xls`;
}

function normalizeTab(value: string) {
  return value === 'sellers' ? 'sellers' : 'customers';
}

function buildCustomersQuery({ status, search }: { status: string; search: string }) {
  const query: Record<string, unknown> = {};

  if (status === 'ACTIVE') {
    query.isActive = true;
  } else if (status === 'INACTIVE') {
    query.isActive = false;
  }

  if (search) {
    const keyword = { $regex: escapeRegex(search), $options: 'i' };
    query.$or = [{ name: keyword }, { phone: keyword }, { email: keyword }];
  }

  return query;
}

function buildSellersQuery({ role, status, search }: { role: string; status: string; search: string }) {
  const query: Record<string, unknown> = {};

  if (role === 'ADMIN' || role === 'SELLER') {
    query.role = role;
  }

  if (status === 'ENABLED') {
    query.isEnabled = true;
  } else if (status === 'DISABLED') {
    query.isEnabled = false;
  }

  if (search) {
    const keyword = { $regex: escapeRegex(search), $options: 'i' };
    query.$or = [{ name: keyword }, { email: keyword }];
  }

  return query;
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const params = request.nextUrl.searchParams;
  const tab = normalizeTab(getSearchValue(params, 'tab'));
  const search = getSearchValue(params, 'q');

  await connectToDatabase();

  if (tab === 'sellers') {
    const sellerRole = getSearchValue(params, 'sellerRole').toUpperCase();
    const sellerStatus = getSearchValue(params, 'sellerStatus').toUpperCase();
    const query = buildSellersQuery({
      role: sellerRole,
      status: sellerStatus,
      search,
    });

    const cursor = Seller.find(query, {
      name: 1,
      email: 1,
      role: 1,
      isEnabled: 1,
      mustChangePassword: 1,
      lastLoginAt: 1,
      createdAt: 1,
      updatedAt: 1,
    })
      .sort({ createdAt: -1 })
      .lean()
      .cursor({ batchSize: 500 });

    return createExcelXmlResponse({
      fileName: createFileName('sellers'),
      sheetName: 'Sellers',
      columns: [
        { key: 'name', header: 'Name', width: 180 },
        { key: 'email', header: 'Email', width: 220 },
        { key: 'role', header: 'Role', width: 90 },
        { key: 'isEnabled', header: 'Enabled', width: 80 },
        { key: 'mustChangePassword', header: 'Must Change Password', width: 140 },
        { key: 'lastLoginAt', header: 'Last Login At', width: 145 },
        { key: 'createdAt', header: 'Created At', width: 145 },
        { key: 'updatedAt', header: 'Updated At', width: 145 },
      ],
      writeRows: async writer => {
        let rowCount = 0;

        try {
          for await (const seller of cursor as AsyncIterable<ExportSellerDocument>) {
            await writer.addRow({
              name: seller.name || '',
              email: seller.email || '',
              role: seller.role || '',
              isEnabled: seller.isEnabled ? 'TRUE' : 'FALSE',
              mustChangePassword: seller.mustChangePassword ? 'TRUE' : 'FALSE',
              lastLoginAt: seller.lastLoginAt ?? null,
              createdAt: seller.createdAt ?? null,
              updatedAt: seller.updatedAt ?? null,
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

  const customerStatus = getSearchValue(params, 'customerStatus').toUpperCase();
  const query = buildCustomersQuery({
    status: customerStatus,
    search,
  });

  const cursor = Customer.find(query, {
    name: 1,
    phone: 1,
    email: 1,
    notes: 1,
    isActive: 1,
    orderCount: 1,
    totalSpentAmount: 1,
    lastOrderAt: 1,
    createdAt: 1,
    updatedAt: 1,
  })
    .sort({ createdAt: -1 })
    .lean()
    .cursor({ batchSize: 500 });

  return createExcelXmlResponse({
    fileName: createFileName('customers'),
    sheetName: 'Customers',
    columns: [
      { key: 'name', header: 'Name', width: 180 },
      { key: 'phone', header: 'Phone', width: 120 },
      { key: 'email', header: 'Email', width: 220 },
      { key: 'isActive', header: 'Active', width: 75 },
      { key: 'orderCount', header: 'Order Count', width: 95 },
      { key: 'totalSpentAmount', header: 'Total Spent Amount', width: 130 },
      { key: 'lastOrderAt', header: 'Last Order At', width: 145 },
      { key: 'createdAt', header: 'Created At', width: 145 },
      { key: 'updatedAt', header: 'Updated At', width: 145 },
      { key: 'notes', header: 'Notes', width: 280 },
    ],
    writeRows: async writer => {
      let rowCount = 0;

      try {
        for await (const customer of cursor as AsyncIterable<ExportCustomerDocument>) {
          await writer.addRow({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            isActive: customer.isActive ? 'TRUE' : 'FALSE',
            orderCount: Number(customer.orderCount || 0),
            totalSpentAmount: Number(customer.totalSpentAmount || 0),
            lastOrderAt: customer.lastOrderAt ?? null,
            createdAt: customer.createdAt ?? null,
            updatedAt: customer.updatedAt ?? null,
            notes: customer.notes || '',
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
