import { getAuthSession } from 'lib/auth';
import { createExcelXmlResponse, escapeRegex } from 'lib/excel-xml';
import { connectToDatabase } from 'lib/mongodb';
import { Product } from 'models/product';
import { NextRequest, NextResponse } from 'next/server';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExportProductDocument = {
  name?: string;
  description?: string;
  unit?: string;
  isActive?: boolean;
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

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const params = request.nextUrl.searchParams;
  const search = getSearchValue(params, 'q');
  const status = getSearchValue(params, 'status').toUpperCase();

  const query: Record<string, unknown> = {};
  if (status === 'ACTIVE') {
    query.isActive = true;
  } else if (status === 'INACTIVE') {
    query.isActive = false;
  }

  if (search) {
    const keyword = { $regex: escapeRegex(search), $options: 'i' };
    query.$or = [{ name: keyword }, { description: keyword }];
  }

  await connectToDatabase();

  const cursor = Product.find(query, {
    name: 1,
    description: 1,
    unit: 1,
    isActive: 1,
    createdAt: 1,
    updatedAt: 1,
  })
    .sort({ name: 1 })
    .lean()
    .cursor({ batchSize: 500 });

  return createExcelXmlResponse({
    fileName: createFileName('products'),
    sheetName: 'Products',
    columns: [
      { key: 'name', header: 'Product Name', width: 180 },
      { key: 'description', header: 'Description', width: 320 },
      { key: 'unit', header: 'Unit', width: 70 },
      { key: 'isActive', header: 'Active', width: 80 },
      { key: 'createdAt', header: 'Created At', width: 145 },
      { key: 'updatedAt', header: 'Updated At', width: 145 },
    ],
    writeRows: async writer => {
      let rowCount = 0;

      try {
        for await (const product of cursor as AsyncIterable<ExportProductDocument>) {
          await writer.addRow({
            name: product.name || '',
            description: product.description || '',
            unit: product.unit || 'kg',
            isActive: product.isActive ? 'TRUE' : 'FALSE',
            createdAt: product.createdAt ?? null,
            updatedAt: product.updatedAt ?? null,
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
