import { getAuthSession } from 'lib/auth';
import { createExcelXmlResponse, escapeRegex } from 'lib/excel-xml';
import { connectToDatabase } from 'lib/mongodb';
import { PriceProfile } from 'models/price-profile';
import { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExportPriceProfileDocument = {
  type?: 'COST' | 'SALE';
  name?: string;
  sellerName?: string;
  sellerId?: Types.ObjectId | null;
  isActive?: boolean;
  effectiveFrom?: Date;
  updatedAt?: Date;
  notes?: string;
  items?: Array<{
    productName?: string;
    pricePerKg?: number;
  }>;
};

type PriceProfileStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type PriceProfileOwnerFilter = 'ALL' | 'SYSTEM' | string;

function getSearchValue(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() ?? '';
}

function normalizeStatusFilter(value: string): PriceProfileStatusFilter {
  const upper = value.toUpperCase();
  if (upper === 'ACTIVE' || upper === 'INACTIVE') {
    return upper;
  }

  return 'ALL';
}

function normalizeOwnerFilter(value: string): PriceProfileOwnerFilter {
  if (!value) {
    return 'ALL';
  }

  const upper = value.toUpperCase();
  if (upper === 'SYSTEM') {
    return 'SYSTEM';
  }

  if (Types.ObjectId.isValid(value)) {
    return value;
  }

  return 'ALL';
}

function buildSaleOwnershipClause(sellerId: string) {
  if (!Types.ObjectId.isValid(sellerId)) {
    return null;
  }

  return [{ sellerId: new Types.ObjectId(sellerId) }, { sellerId: { $exists: false } }, { sellerId: null }] as Array<Record<string, unknown>>;
}

function createFileName(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-').replace('T', '-');
  return `${prefix}-${stamp}.xls`;
}

function buildExportQuery({
  isAdmin,
  sellerId,
  statusFilter,
  ownerFilter,
  searchQuery,
}: {
  isAdmin: boolean;
  sellerId: string;
  statusFilter: PriceProfileStatusFilter;
  ownerFilter: PriceProfileOwnerFilter;
  searchQuery: string;
}) {
  const baseQuery: Record<string, unknown> = {};

  if (statusFilter === 'ACTIVE') {
    baseQuery.isActive = true;
  } else if (statusFilter === 'INACTIVE') {
    baseQuery.isActive = false;
  }

  if (searchQuery) {
    baseQuery.name = { $regex: escapeRegex(searchQuery), $options: 'i' };
  }

  if (!isAdmin) {
    const ownershipClause = buildSaleOwnershipClause(sellerId);
    if (!ownershipClause) {
      return { _id: { $exists: false } };
    }

    return {
      ...baseQuery,
      type: 'SALE',
      $or: ownershipClause,
    };
  }

  if (ownerFilter === 'ALL') {
    return baseQuery;
  }

  const saleBranch: Record<string, unknown> = { ...baseQuery, type: 'SALE' };

  if (ownerFilter === 'SYSTEM') {
    saleBranch.$or = [{ sellerId: { $exists: false } }, { sellerId: null }];
  } else if (Types.ObjectId.isValid(ownerFilter)) {
    saleBranch.sellerId = new Types.ObjectId(ownerFilter);
  } else {
    return { _id: { $exists: false } };
  }

  return {
    $or: [{ ...baseQuery, type: 'COST' }, saleBranch],
  };
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isAdmin = session.seller.role === 'ADMIN';
  const params = request.nextUrl.searchParams;
  const statusFilter = normalizeStatusFilter(getSearchValue(params, 'status'));
  const searchQuery = getSearchValue(params, 'q');
  const ownerFilter = isAdmin ? normalizeOwnerFilter(getSearchValue(params, 'owner')) : 'ALL';

  const query = buildExportQuery({
    isAdmin,
    sellerId: session.seller.id,
    statusFilter,
    ownerFilter,
    searchQuery,
  });

  await connectToDatabase();

  const cursor = PriceProfile.find(query, {
    type: 1,
    name: 1,
    sellerId: 1,
    sellerName: 1,
    isActive: 1,
    effectiveFrom: 1,
    updatedAt: 1,
    notes: 1,
    items: 1,
  })
    .sort({ type: 1, createdAt: -1, updatedAt: -1 })
    .lean()
    .cursor({ batchSize: 250 });

  return createExcelXmlResponse({
    fileName: createFileName('price-profiles'),
    sheetName: 'Price Profiles',
    columns: [
      { key: 'profileType', header: 'Profile Type', width: 90 },
      { key: 'profileName', header: 'Profile Name', width: 180 },
      { key: 'owner', header: 'Owner', width: 140 },
      { key: 'active', header: 'Active', width: 70 },
      { key: 'effectiveFrom', header: 'Effective From', width: 145 },
      { key: 'updatedAt', header: 'Updated At', width: 145 },
      { key: 'productCount', header: 'Product Count', width: 95 },
      { key: 'productName', header: 'Product', width: 180 },
      { key: 'pricePerKg', header: 'Price / kg', width: 105 },
      { key: 'notes', header: 'Notes', width: 280 },
    ],
    writeRows: async writer => {
      let rowCount = 0;

      try {
        for await (const profile of cursor as AsyncIterable<ExportPriceProfileDocument>) {
          const items = Array.isArray(profile.items) ? profile.items : [];
          const owner = profile.sellerName || 'SYSTEM';
          const sharedRow = {
            profileType: profile.type || '',
            profileName: profile.name || '',
            owner,
            active: profile.isActive ? 'TRUE' : 'FALSE',
            effectiveFrom: profile.effectiveFrom ?? null,
            updatedAt: profile.updatedAt ?? null,
            productCount: items.length,
            notes: profile.notes || '',
          };

          if (!items.length) {
            await writer.addRow({
              ...sharedRow,
              productName: '',
              pricePerKg: '',
            });
            rowCount += 1;
          } else {
            for (const item of items) {
              await writer.addRow({
                ...sharedRow,
                productName: item.productName || '',
                pricePerKg: Number(item.pricePerKg || 0),
              });
              rowCount += 1;
            }
          }

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
