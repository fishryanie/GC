import type {
  CollectionStatus,
  OrderApprovalStatus,
  OrderDiscountStatus,
  OrderFulfillmentStatus,
  PriceProfileType,
  SupplierPaymentStatus,
} from 'lib/constants';
import { connectToDatabase } from 'lib/mongodb';
import { Customer } from 'models/customer';
import { Order } from 'models/order';
import { PriceProfile } from 'models/price-profile';
import { Product } from 'models/product';
import { Seller } from 'models/seller';
import { Types } from 'mongoose';
import { unstable_noStore as noStore } from 'next/cache';
import type { CustomerView, DashboardStats, OrderView, PriceProfileView, ProductView, SellerRole, SellerView } from 'types';

function toIsoString(value: Date | string | null | undefined) {
  return new Date(value ?? Date.now()).toISOString();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSaleOwnershipClause(sellerId: string) {
  if (!Types.ObjectId.isValid(sellerId)) {
    return null;
  }

  return [{ sellerId: new Types.ObjectId(sellerId) }, { sellerId: { $exists: false } }, { sellerId: null }] as Array<Record<string, unknown>>;
}

function toOrderView(doc: {
  _id: unknown;
  code: string;
  buyerName: string;
  customerId?: unknown;
  customerName?: string;
  sellerId?: unknown;
  sellerName?: string;
  deliveryDate: Date | string;
  fulfillmentStatus: OrderFulfillmentStatus;
  approval?: {
    requiresAdminApproval?: boolean;
    status?: OrderApprovalStatus;
    requestedAt?: Date | string;
    reviewedAt?: Date | string | null;
    reviewedBySellerId?: unknown;
    reviewedBySellerName?: string | null;
    note?: string | null;
  };
  discountRequest?: {
    status?: OrderDiscountStatus;
    requestedPercent?: number;
    requestedAmount?: number;
    requestedSaleAmount?: number;
    reason?: string | null;
    reviewedAt?: Date | string | null;
    reviewedBySellerId?: unknown;
    reviewedBySellerName?: string | null;
    reviewNote?: string | null;
  };
  supplierPaymentStatus: SupplierPaymentStatus;
  collectionStatus: CollectionStatus;
  totalWeightKg: number;
  totalCostAmount: number;
  baseSaleAmount?: number;
  totalSaleAmount: number;
  totalProfitAmount: number;
  costProfile: {
    profileId: unknown;
    profileName: string;
    effectiveFrom: Date | string;
  };
  saleProfile: {
    profileId: unknown;
    profileName: string;
    effectiveFrom: Date | string;
  };
  items: Array<{
    productId: unknown;
    productName: string;
    weightKg: number;
    costPricePerKg: number;
    salePricePerKg: number;
    baseSalePricePerKg?: number;
    lineCostTotal: number;
    lineSaleTotal: number;
    baseLineSaleTotal?: number;
    lineProfit: number;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}): OrderView {
  return {
    id: String(doc._id),
    code: doc.code,
    buyerName: doc.buyerName,
    customerId: doc.customerId ? String(doc.customerId) : '',
    customerName: doc.customerName || doc.buyerName,
    sellerId: doc.sellerId ? String(doc.sellerId) : '',
    sellerName: doc.sellerName || '',
    deliveryDate: toIsoString(doc.deliveryDate),
    fulfillmentStatus: doc.fulfillmentStatus,
    approval: {
      requiresAdminApproval: doc.approval?.requiresAdminApproval ?? false,
      status: doc.approval?.status ?? (doc.fulfillmentStatus === 'PENDING_APPROVAL' ? 'PENDING' : 'APPROVED'),
      requestedAt: toIsoString(doc.approval?.requestedAt ?? doc.createdAt),
      reviewedAt: doc.approval?.reviewedAt ? toIsoString(doc.approval.reviewedAt) : undefined,
      reviewedBySellerId: doc.approval?.reviewedBySellerId ? String(doc.approval.reviewedBySellerId) : undefined,
      reviewedBySellerName: doc.approval?.reviewedBySellerName || undefined,
      note: doc.approval?.note || undefined,
    },
    discountRequest: {
      status: doc.discountRequest?.status ?? 'NONE',
      requestedPercent: doc.discountRequest?.requestedPercent ?? 0,
      requestedAmount: doc.discountRequest?.requestedAmount ?? 0,
      requestedSaleAmount: doc.discountRequest?.requestedSaleAmount ?? doc.baseSaleAmount ?? doc.totalSaleAmount,
      reason: doc.discountRequest?.reason || undefined,
      reviewedAt: doc.discountRequest?.reviewedAt ? toIsoString(doc.discountRequest.reviewedAt) : undefined,
      reviewedBySellerId: doc.discountRequest?.reviewedBySellerId ? String(doc.discountRequest.reviewedBySellerId) : undefined,
      reviewedBySellerName: doc.discountRequest?.reviewedBySellerName || undefined,
      reviewNote: doc.discountRequest?.reviewNote || undefined,
    },
    supplierPaymentStatus: doc.supplierPaymentStatus,
    collectionStatus: doc.collectionStatus,
    totalWeightKg: doc.totalWeightKg,
    totalCostAmount: doc.totalCostAmount,
    baseSaleAmount: doc.baseSaleAmount ?? doc.totalSaleAmount,
    totalSaleAmount: doc.totalSaleAmount,
    totalProfitAmount: doc.totalProfitAmount,
    costProfile: {
      profileId: String(doc.costProfile.profileId),
      profileName: doc.costProfile.profileName,
      effectiveFrom: toIsoString(doc.costProfile.effectiveFrom),
    },
    saleProfile: {
      profileId: String(doc.saleProfile.profileId),
      profileName: doc.saleProfile.profileName,
      effectiveFrom: toIsoString(doc.saleProfile.effectiveFrom),
    },
    items: doc.items.map(item => ({
      productId: String(item.productId),
      productName: item.productName,
      weightKg: item.weightKg,
      costPricePerKg: item.costPricePerKg,
      salePricePerKg: item.salePricePerKg,
      baseSalePricePerKg: item.baseSalePricePerKg ?? item.salePricePerKg,
      lineCostTotal: item.lineCostTotal,
      lineSaleTotal: item.lineSaleTotal,
      baseLineSaleTotal: item.baseLineSaleTotal ?? item.lineSaleTotal,
      lineProfit: item.lineProfit,
    })),
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
}

function toCustomerView(doc: {
  _id: unknown;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  isActive: boolean;
  orderCount?: number;
  totalSpentAmount?: number;
  lastOrderAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}): CustomerView {
  return {
    id: String(doc._id),
    name: doc.name,
    phone: doc.phone,
    email: doc.email ?? '',
    notes: doc.notes ?? '',
    isActive: doc.isActive,
    orderCount: doc.orderCount ?? 0,
    totalSpentAmount: doc.totalSpentAmount ?? 0,
    lastOrderAt: doc.lastOrderAt ? toIsoString(doc.lastOrderAt) : undefined,
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
}

function toSellerView(doc: {
  _id: unknown;
  name: string;
  email: string;
  role: SellerRole;
  isEnabled: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}): SellerView {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isEnabled: doc.isEnabled,
    mustChangePassword: Boolean(doc.mustChangePassword),
    lastLoginAt: doc.lastLoginAt ? toIsoString(doc.lastLoginAt) : undefined,
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
}

function toPriceProfileView(doc: {
  _id: unknown;
  name: string;
  type: PriceProfileType;
  sellerId?: unknown;
  sellerName?: string | null;
  effectiveFrom: Date | string;
  notes?: string | null;
  isActive: boolean;
  items?: Array<{
    productId: unknown;
    productName: string;
    pricePerKg: number;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}): PriceProfileView {
  return {
    id: String(doc._id),
    name: doc.name,
    type: doc.type,
    sellerId: doc.sellerId ? String(doc.sellerId) : undefined,
    sellerName: doc.sellerName || undefined,
    effectiveFrom: toIsoString(doc.effectiveFrom),
    notes: doc.notes ?? undefined,
    isActive: doc.isActive,
    items: (doc.items ?? []).map(item => ({
      productId: String(item.productId),
      productName: item.productName,
      pricePerKg: item.pricePerKg,
    })),
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
}

export type OrderFilters = {
  fulfillmentStatus?: OrderFulfillmentStatus;
  supplierPaymentStatus?: SupplierPaymentStatus;
  collectionStatus?: CollectionStatus;
  sellerId?: string;
  deliveryYear?: number;
  deliveryMonth?: number;
  deliveryDay?: number;
  search?: string;
};

export type SellerOrderStats = {
  sellerId: string;
  sellerName: string;
  orderCount: number;
  totalSaleAmount: number;
  totalCostAmount: number;
  totalProfitAmount: number;
  averageOrderAmount: number;
  pendingApprovalCount: number;
  deliveringCount: number;
  deliveredCount: number;
};

export type OrdersPageData = {
  orders: OrderView[];
  totalSaleAmount: number;
  totalProfitAmount: number;
  filteredCount: number;
  totalCount: number;
  availableYears: number[];
};

export type SellerPerformanceOverview = {
  sellers: SellerOrderStats[];
  sellerCount: number;
  totalOrders: number;
  totalSaleAmount: number;
  totalCostAmount: number;
  totalProfitAmount: number;
};

export type SellerDetailsStats = {
  totalOrders: number;
  totalSaleAmount: number;
  totalCostAmount: number;
  totalProfitAmount: number;
  totalWeightKg: number;
  averageOrderAmount: number;
  pendingApprovalOrders: number;
  deliveringOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
  discountRequestedOrders: number;
  discountApprovedOrders: number;
  discountRejectedOrders: number;
  unpaidCollectionOrders: number;
  partialCollectionOrders: number;
  paidCollectionOrders: number;
  refundedOrders: number;
  unpaidSupplierOrders: number;
  supplierPaidOrders: number;
  capitalCycleCompletedOrders: number;
  firstOrderAt?: string;
  lastOrderAt?: string;
  daysActiveWithOrders: number;
};

export type SellerDetailsMonthlyPoint = {
  year: number;
  month: number;
  orderCount: number;
  totalSaleAmount: number;
  totalCostAmount: number;
  totalProfitAmount: number;
};

export type SellerDetailsTopProduct = {
  productId: string;
  productName: string;
  orderCount: number;
  totalWeightKg: number;
  totalSaleAmount: number;
  totalProfitAmount: number;
};

export type SellerDetailsPageData = {
  seller: SellerView | null;
  stats: SellerDetailsStats;
  monthlyPerformance: SellerDetailsMonthlyPoint[];
  topProducts: SellerDetailsTopProduct[];
  recentOrders: OrderView[];
  activeSaleProfiles: PriceProfileView[];
  latestSaleProfiles: PriceProfileView[];
};

export type SellerTrendGranularity = 'DAILY' | 'MONTHLY' | 'YEARLY';

export type SellerTrendChartPoint = {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type SellerTrendChartData = {
  granularity: SellerTrendGranularity;
  points: SellerTrendChartPoint[];
  appliedStartDate?: string;
  appliedEndDate?: string;
  appliedYear?: number;
};

export type CustomerDetailsStats = {
  totalOrders: number;
  totalSpentAmount: number;
  totalCostAmount: number;
  totalProfitAmount: number;
  totalWeightKg: number;
  averageOrderAmount: number;
  pendingApprovalOrders: number;
  deliveringOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
  unpaidOrders: number;
  partiallyPaidOrders: number;
  paidInFullOrders: number;
  refundedOrders: number;
  uniqueSellerCount: number;
  firstOrderAt?: string;
  lastOrderAt?: string;
  daysActiveWithOrders: number;
};

export type CustomerDetailsMonthlyPoint = {
  year: number;
  month: number;
  orderCount: number;
  totalSpentAmount: number;
  totalProfitAmount: number;
};

export type CustomerDetailsTopProduct = {
  productId: string;
  productName: string;
  orderCount: number;
  totalWeightKg: number;
  totalSpentAmount: number;
  totalProfitAmount: number;
};

export type CustomerDetailsSellerContribution = {
  sellerId: string;
  sellerName: string;
  orderCount: number;
  totalSpentAmount: number;
  totalProfitAmount: number;
  lastOrderAt?: string;
};

export type CustomerDetailsPageData = {
  customer: CustomerView | null;
  stats: CustomerDetailsStats;
  monthlyPerformance: CustomerDetailsMonthlyPoint[];
  topProducts: CustomerDetailsTopProduct[];
  sellerContributions: CustomerDetailsSellerContribution[];
  recentOrders: OrderView[];
};

export type PriceProfileStats = {
  totalProfiles: number;
  activeProfiles: number;
  pricedProductsCount: number;
  averageProductsPerProfile: number;
};

export type ProductStats = {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
};

export type CustomerFilters = {
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
};

export type CustomersPageData = {
  customers: CustomerView[];
  filteredCount: number;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  customersWithOrders: number;
  totalSpentAmount: number;
  newThisMonth: number;
};

export type SellerFilters = {
  search?: string;
  role?: SellerRole;
  status?: 'ALL' | 'ENABLED' | 'DISABLED';
};

export type SellerPerformanceView = {
  sellerId: string;
  sellerName: string;
  totalOrders: number;
  totalSaleAmount: number;
};

export type SellersPageData = {
  sellers: SellerView[];
  filteredCount: number;
  totalCount: number;
  adminCount: number;
  sellerCount: number;
  enabledCount: number;
  disabledCount: number;
  topSellers30d: SellerPerformanceView[];
  sellerRevenues: SellerPerformanceView[];
};

export type DefaultSalePriceMap = Record<string, number>;

type ListOrdersOptions = {
  limit?: number;
  filters?: OrderFilters;
};

function buildOrdersQuery(filters?: OrderFilters) {
  const query: Record<string, unknown> = {};

  if (filters?.fulfillmentStatus) {
    query.fulfillmentStatus = filters.fulfillmentStatus;
  }

  if (filters?.supplierPaymentStatus) {
    query.supplierPaymentStatus = filters.supplierPaymentStatus;
  }

  if (filters?.collectionStatus) {
    query.collectionStatus = filters.collectionStatus;
  }

  if (filters?.sellerId) {
    if (Types.ObjectId.isValid(filters.sellerId)) {
      query.sellerId = new Types.ObjectId(filters.sellerId);
    } else {
      query._id = { $exists: false };
    }
  }

  if (filters?.search?.trim()) {
    const keyword = {
      $regex: escapeRegex(filters.search.trim()),
      $options: 'i',
    };
    query.$or = [{ code: keyword }, { buyerName: keyword }, { customerName: keyword }, { sellerName: keyword }, { 'items.productName': keyword }];
  }

  const dateExpr: Record<string, unknown>[] = [];

  if (typeof filters?.deliveryYear === 'number') {
    dateExpr.push({ $eq: [{ $year: '$deliveryDate' }, filters.deliveryYear] });
  }

  if (typeof filters?.deliveryMonth === 'number') {
    dateExpr.push({ $eq: [{ $month: '$deliveryDate' }, filters.deliveryMonth] });
  }

  if (typeof filters?.deliveryDay === 'number') {
    dateExpr.push({ $eq: [{ $dayOfMonth: '$deliveryDate' }, filters.deliveryDay] });
  }

  if (dateExpr.length === 1) {
    query.$expr = dateExpr[0];
  } else if (dateExpr.length > 1) {
    query.$expr = { $and: dateExpr };
  }

  return query;
}

function buildCustomersQuery(filters?: CustomerFilters) {
  const query: Record<string, unknown> = {};

  if (filters?.status === 'ACTIVE') {
    query.isActive = true;
  } else if (filters?.status === 'INACTIVE') {
    query.isActive = false;
  }

  if (filters?.search?.trim()) {
    const keyword = {
      $regex: escapeRegex(filters.search.trim()),
      $options: 'i',
    };

    query.$or = [{ name: keyword }, { phone: keyword }, { email: keyword }];
  }

  return query;
}

function buildSellersQuery(filters?: SellerFilters) {
  const query: Record<string, unknown> = {};

  if (filters?.role) {
    query.role = filters.role;
  }

  if (filters?.status === 'ENABLED') {
    query.isEnabled = true;
  } else if (filters?.status === 'DISABLED') {
    query.isEnabled = false;
  }

  if (filters?.search?.trim()) {
    const keyword = {
      $regex: escapeRegex(filters.search.trim()),
      $options: 'i',
    };

    query.$or = [{ name: keyword }, { email: keyword }];
  }

  return query;
}

async function runDataQuery<T>(scope: string, fallback: T, queryFn: () => Promise<T>) {
  noStore();

  try {
    await connectToDatabase();
    return await queryFn();
  } catch (error) {
    console.error(`[data:${scope}]`, error);
    return fallback;
  }
}

export async function listProducts(options?: { activeOnly?: boolean; search?: string; status?: 'ALL' | 'ACTIVE' | 'INACTIVE' }) {
  return runDataQuery('listProducts', [] as ProductView[], async () => {
    const query: Record<string, unknown> = {};
    const trimmedSearch = options?.search?.trim();

    if (options?.activeOnly) {
      query.isActive = true;
    } else if (options?.status === 'ACTIVE') {
      query.isActive = true;
    } else if (options?.status === 'INACTIVE') {
      query.isActive = false;
    }

    if (trimmedSearch) {
      const keyword = { $regex: escapeRegex(trimmedSearch), $options: 'i' };
      query.$or = [{ name: keyword }, { description: keyword }];
    }

    const docs = await Product.find(query).sort({ name: 1 }).lean();

    return docs.map(
      (doc): ProductView => ({
        id: String(doc._id),
        name: doc.name,
        description: doc.description ?? '',
        unit: 'kg',
        isActive: doc.isActive,
        createdAt: toIsoString(doc.createdAt),
        updatedAt: toIsoString(doc.updatedAt),
      }),
    );
  });
}

const DEFAULT_PRODUCT_STATS: ProductStats = {
  totalProducts: 0,
  activeProducts: 0,
  inactiveProducts: 0,
};

export async function getProductStats() {
  return runDataQuery('getProductStats', DEFAULT_PRODUCT_STATS, async () => {
    const [totalProducts, activeProducts] = await Promise.all([Product.countDocuments(), Product.countDocuments({ isActive: true })]);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: Math.max(totalProducts - activeProducts, 0),
    } satisfies ProductStats;
  });
}

export async function getDefaultSalePrices(options?: { sellerId?: string }) {
  return runDataQuery('getDefaultSalePrices', {} as DefaultSalePriceMap, async () => {
    const query: Record<string, unknown> = { type: 'SALE' };

    if (options?.sellerId) {
      const ownershipClause = buildSaleOwnershipClause(options.sellerId);
      if (!ownershipClause) {
        return {};
      }

      query.$or = ownershipClause;
    }

    const activeProfile = await PriceProfile.findOne({
      ...query,
      isActive: true,
    })
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean();

    const fallbackProfile = activeProfile ?? (await PriceProfile.findOne(query).sort({ effectiveFrom: -1, createdAt: -1 }).lean());

    if (!fallbackProfile) {
      return {};
    }

    const result: DefaultSalePriceMap = {};

    for (const item of fallbackProfile.items ?? []) {
      result[String(item.productId)] = item.pricePerKg;
    }

    return result;
  });
}

export async function listPriceProfiles(options?: {
  type?: PriceProfileType;
  activeOnly?: boolean;
  sellerId?: string;
  createdBy?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  search?: string;
}) {
  return runDataQuery('listPriceProfiles', [] as PriceProfileView[], async () => {
    const query: Record<string, unknown> = {};
    const andClauses: Array<Record<string, unknown>> = [];

    if (options?.type) {
      query.type = options.type;
    }

    if (options?.activeOnly) {
      query.isActive = true;
    } else if (options?.status === 'ACTIVE') {
      query.isActive = true;
    } else if (options?.status === 'INACTIVE') {
      query.isActive = false;
    }

    if (options?.search?.trim()) {
      query.name = {
        $regex: escapeRegex(options.search.trim()),
        $options: 'i',
      };
    }

    if (options?.sellerId) {
      if (options.type === 'SALE') {
        const ownershipClause = buildSaleOwnershipClause(options.sellerId);
        if (!ownershipClause) {
          return [];
        }

        andClauses.push({ $or: ownershipClause });
      } else if (!Types.ObjectId.isValid(options.sellerId)) {
        return [];
      } else {
        query.sellerId = new Types.ObjectId(options.sellerId);
      }
    }

    if (options?.createdBy && options.type === 'SALE') {
      if (options.createdBy === 'SYSTEM') {
        andClauses.push({
          $or: [{ sellerId: { $exists: false } }, { sellerId: null }],
        });
      } else if (Types.ObjectId.isValid(options.createdBy)) {
        andClauses.push({ sellerId: new Types.ObjectId(options.createdBy) });
      } else {
        return [];
      }
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
    }

    const docs = await PriceProfile.find(query).sort({ effectiveFrom: -1, createdAt: -1 }).lean();

    return docs.map(toPriceProfileView);
  });
}

export async function getActiveCostProfile() {
  return runDataQuery('getActiveCostProfile', null as PriceProfileView | null, async () => {
    const doc = await PriceProfile.findOne({
      type: 'COST',
      isActive: true,
    })
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean();

    return doc ? toPriceProfileView(doc) : null;
  });
}

export async function listCustomers(options?: { activeOnly?: boolean; search?: string; limit?: number }) {
  return runDataQuery('listCustomers', [] as CustomerView[], async () => {
    const query: Record<string, unknown> = {};

    if (options?.activeOnly) {
      query.isActive = true;
    }

    const trimmedSearch = options?.search?.trim();
    if (trimmedSearch) {
      const keyword = { $regex: escapeRegex(trimmedSearch), $options: 'i' };
      query.$or = [{ name: keyword }, { phone: keyword }, { email: keyword }];
    }

    const cursor = Customer.find(query).sort({ name: 1 });
    if (options?.limit && options.limit > 0) {
      cursor.limit(options.limit);
    }

    const docs = await cursor.lean();
    return docs.map(toCustomerView);
  });
}

const DEFAULT_CUSTOMERS_PAGE_DATA: CustomersPageData = {
  customers: [],
  filteredCount: 0,
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  customersWithOrders: 0,
  totalSpentAmount: 0,
  newThisMonth: 0,
};

export async function getCustomersPageData(filters?: CustomerFilters) {
  return runDataQuery('getCustomersPageData', DEFAULT_CUSTOMERS_PAGE_DATA, async () => {
    const query = buildCustomersQuery(filters);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [customers, filteredCount, totalCount, activeCount, withOrders, totalSpentAgg, newThisMonth] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).lean(),
      Customer.countDocuments(query),
      Customer.countDocuments(),
      Customer.countDocuments({ isActive: true }),
      Customer.countDocuments({ orderCount: { $gt: 0 } }),
      Customer.aggregate([
        {
          $group: {
            _id: null,
            totalSpentAmount: { $sum: '$totalSpentAmount' },
          },
        },
      ]),
      Customer.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

    const spent = totalSpentAgg[0]?.totalSpentAmount ?? 0;

    return {
      customers: customers.map(toCustomerView),
      filteredCount,
      totalCount,
      activeCount,
      inactiveCount: Math.max(totalCount - activeCount, 0),
      customersWithOrders: withOrders,
      totalSpentAmount: spent,
      newThisMonth,
    } satisfies CustomersPageData;
  });
}

export async function listSellers(options?: { role?: SellerRole; status?: 'ALL' | 'ENABLED' | 'DISABLED'; search?: string }) {
  return runDataQuery('listSellers', [] as SellerView[], async () => {
    const docs = await Seller.find(buildSellersQuery(options)).sort({ createdAt: -1 }).lean();
    return docs.map(toSellerView);
  });
}

const DEFAULT_SELLERS_PAGE_DATA: SellersPageData = {
  sellers: [],
  filteredCount: 0,
  totalCount: 0,
  adminCount: 0,
  sellerCount: 0,
  enabledCount: 0,
  disabledCount: 0,
  topSellers30d: [],
  sellerRevenues: [],
};

export async function getSellersPageData(filters?: SellerFilters) {
  return runDataQuery('getSellersPageData', DEFAULT_SELLERS_PAGE_DATA, async () => {
    const query = buildSellersQuery(filters);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [sellers, filteredCount, totalCount, adminCount, sellerCount, enabledCount, topSellersRaw] = await Promise.all([
      Seller.find(query).sort({ createdAt: -1 }).lean(),
      Seller.countDocuments(query),
      Seller.countDocuments(),
      Seller.countDocuments({ role: 'ADMIN' }),
      Seller.countDocuments({ role: 'SELLER' }),
      Seller.countDocuments({ isEnabled: true }),
      Order.aggregate([
        {
          $match: {
            sellerId: { $exists: true, $ne: null },
            createdAt: { $gte: last30Days },
          },
        },
        {
          $group: {
            _id: '$sellerId',
            sellerName: { $first: '$sellerName' },
            totalOrders: { $sum: 1 },
            totalSaleAmount: { $sum: '$totalSaleAmount' },
          },
        },
        { $sort: { totalOrders: -1, totalSaleAmount: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const sellerIdList = sellers.map(item => new Types.ObjectId(String(item._id)));
    const sellerRevenueRaw = sellerIdList.length
      ? await Order.aggregate([
          {
            $match: {
              sellerId: { $in: sellerIdList },
            },
          },
          {
            $group: {
              _id: '$sellerId',
              totalOrders: { $sum: 1 },
              totalSaleAmount: { $sum: '$totalSaleAmount' },
            },
          },
        ])
      : [];

    const sellerRevenueMap = new Map(
      sellerRevenueRaw.map(item => [
        String(item._id),
        {
          totalOrders: Number(item.totalOrders || 0),
          totalSaleAmount: Number(item.totalSaleAmount || 0),
        },
      ]),
    );

    const sellerRevenues = sellers
      .map(item => {
        const revenue = sellerRevenueMap.get(String(item._id));
        return {
          sellerId: String(item._id),
          sellerName: item.name,
          totalOrders: revenue?.totalOrders ?? 0,
          totalSaleAmount: revenue?.totalSaleAmount ?? 0,
        } satisfies SellerPerformanceView;
      })
      .sort((left, right) => {
        if (right.totalSaleAmount !== left.totalSaleAmount) {
          return right.totalSaleAmount - left.totalSaleAmount;
        }

        return right.totalOrders - left.totalOrders;
      });

    return {
      sellers: sellers.map(toSellerView),
      filteredCount,
      totalCount,
      adminCount,
      sellerCount,
      enabledCount,
      disabledCount: Math.max(totalCount - enabledCount, 0),
      topSellers30d: topSellersRaw.map(item => ({
        sellerId: String(item._id),
        sellerName: item.sellerName || 'Unknown',
        totalOrders: Number(item.totalOrders || 0),
        totalSaleAmount: Number(item.totalSaleAmount || 0),
      })),
      sellerRevenues,
    } satisfies SellersPageData;
  });
}

export async function listOrders(options?: ListOrdersOptions) {
  return runDataQuery('listOrders', [] as OrderView[], async () => {
    const query = Order.find(buildOrdersQuery(options?.filters)).sort({ createdAt: -1 });

    if (options?.limit) {
      query.limit(options.limit);
    }

    const docs = await query.lean();

    return docs.map(toOrderView);
  });
}

const DEFAULT_ORDERS_PAGE_DATA: OrdersPageData = {
  orders: [],
  totalSaleAmount: 0,
  totalProfitAmount: 0,
  filteredCount: 0,
  totalCount: 0,
  availableYears: [],
};

const DEFAULT_ORDERS_TREND_CHART_DATA: SellerTrendChartData = {
  granularity: 'DAILY',
  points: [],
};

export async function getOrdersPageData(filters?: OrderFilters) {
  return runDataQuery('getOrdersPageData', DEFAULT_ORDERS_PAGE_DATA, async () => {
    const query = buildOrdersQuery(filters);

    const [orderDocs, totalCount, filteredCount, totalsAgg, yearsAgg] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).lean(),
      Order.countDocuments(),
      Order.countDocuments(query),
      Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSaleAmount: { $sum: '$totalSaleAmount' },
            totalProfitAmount: { $sum: '$totalProfitAmount' },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: { $year: '$deliveryDate' },
          },
        },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const totals = totalsAgg[0] ?? {
      totalSaleAmount: 0,
      totalProfitAmount: 0,
    };

    return {
      orders: orderDocs.map(toOrderView),
      totalSaleAmount: totals.totalSaleAmount ?? 0,
      totalProfitAmount: totals.totalProfitAmount ?? 0,
      filteredCount,
      totalCount,
      availableYears: yearsAgg.map(entry => Number(entry._id)).filter(year => Number.isFinite(year)),
    } satisfies OrdersPageData;
  });
}

export async function getOrdersTrendChartData(
  options?: {
    filters?: OrderFilters;
    granularity?: SellerTrendGranularity;
    startDate?: string;
    endDate?: string;
    year?: number;
  },
): Promise<SellerTrendChartData> {
  const requestedGranularity = options?.granularity ?? 'DAILY';

  return runDataQuery('getOrdersTrendChartData', { ...DEFAULT_ORDERS_TREND_CHART_DATA, granularity: requestedGranularity }, async () => {
    const baseQuery = buildOrdersQuery(options?.filters);
    const now = new Date();

    if (requestedGranularity === 'DAILY') {
      const defaultStart = toStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const defaultEnd = toEndOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

      const parsedStart = parseOptionalDate(options?.startDate);
      const parsedEnd = parseOptionalDate(options?.endDate);
      const rangeStart = parsedStart ? toStartOfDay(parsedStart) : defaultStart;
      const rangeEnd = parsedEnd ? toEndOfDay(parsedEnd) : defaultEnd;
      const isRangeValid = rangeStart.getTime() <= rangeEnd.getTime();
      const appliedStart = isRangeValid ? rangeStart : defaultStart;
      const appliedEnd = isRangeValid ? rangeEnd : defaultEnd;

      const rows = await Order.aggregate([
        {
          $match: {
            ...baseQuery,
            deliveryDate: {
              $gte: appliedStart,
              $lte: appliedEnd,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$deliveryDate' },
              month: { $month: '$deliveryDate' },
              day: { $dayOfMonth: '$deliveryDate' },
            },
            revenue: { $sum: '$totalSaleAmount' },
            cost: { $sum: '$totalCostAmount' },
            profit: { $sum: '$totalProfitAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]);

      const bucketMap = new Map<string, { revenue: number; cost: number; profit: number }>(
        (rows as TrendAggregateRow[]).map(row => {
          const year = Number(row._id?.year || 0);
          const month = Number(row._id?.month || 0);
          const day = Number(row._id?.day || 0);
          const key = `${year}-${padDatePart(month)}-${padDatePart(day)}`;

          return [
            key,
            {
              revenue: Number(row.revenue || 0),
              cost: Number(row.cost || 0),
              profit: Number(row.profit || 0),
            },
          ];
        }),
      );

      const points: SellerTrendChartPoint[] = [];
      const cursor = new Date(appliedStart);

      while (cursor.getTime() <= appliedEnd.getTime()) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth() + 1;
        const day = cursor.getDate();
        const key = `${year}-${padDatePart(month)}-${padDatePart(day)}`;
        const totals = bucketMap.get(key) ?? { revenue: 0, cost: 0, profit: 0 };

        points.push({
          key,
          label: `${padDatePart(day)}/${padDatePart(month)}`,
          revenue: totals.revenue,
          cost: totals.cost,
          profit: totals.profit,
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      return {
        granularity: 'DAILY',
        points,
        appliedStartDate: appliedStart.toISOString(),
        appliedEndDate: appliedEnd.toISOString(),
      } satisfies SellerTrendChartData;
    }

    if (requestedGranularity === 'MONTHLY') {
      const currentYear = now.getFullYear();
      const parsedYear = Number(options?.year);
      const appliedYear = Number.isFinite(parsedYear) ? Math.floor(parsedYear) : currentYear;
      const yearStart = toStartOfDay(new Date(appliedYear, 0, 1));
      const yearEnd = toEndOfDay(new Date(appliedYear, 11, 31));

      const rows = await Order.aggregate([
        {
          $match: {
            ...baseQuery,
            deliveryDate: {
              $gte: yearStart,
              $lte: yearEnd,
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: '$deliveryDate' },
            },
            revenue: { $sum: '$totalSaleAmount' },
            cost: { $sum: '$totalCostAmount' },
            profit: { $sum: '$totalProfitAmount' },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]);

      const bucketMap = new Map<number, { revenue: number; cost: number; profit: number }>(
        (rows as TrendAggregateRow[]).map(row => [
          Number(row._id?.month || 0),
          {
            revenue: Number(row.revenue || 0),
            cost: Number(row.cost || 0),
            profit: Number(row.profit || 0),
          },
        ]),
      );

      const points = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const totals = bucketMap.get(month) ?? { revenue: 0, cost: 0, profit: 0 };
        return {
          key: `${appliedYear}-${padDatePart(month)}`,
          label: `${padDatePart(month)}/${appliedYear}`,
          revenue: totals.revenue,
          cost: totals.cost,
          profit: totals.profit,
        } satisfies SellerTrendChartPoint;
      });

      return {
        granularity: 'MONTHLY',
        points,
        appliedYear,
      } satisfies SellerTrendChartData;
    }

    const currentYear = now.getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 4;
    const windowStart = toStartOfDay(new Date(startYear, 0, 1));
    const windowEnd = toEndOfDay(new Date(endYear, 11, 31));

    const rows = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          deliveryDate: {
            $gte: windowStart,
            $lte: windowEnd,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$deliveryDate' },
          },
          revenue: { $sum: '$totalSaleAmount' },
          cost: { $sum: '$totalCostAmount' },
          profit: { $sum: '$totalProfitAmount' },
        },
      },
      { $sort: { '_id.year': 1 } },
    ]);

    const bucketMap = new Map<number, { revenue: number; cost: number; profit: number }>(
      (rows as TrendAggregateRow[]).map(row => [
        Number(row._id?.year || 0),
        {
          revenue: Number(row.revenue || 0),
          cost: Number(row.cost || 0),
          profit: Number(row.profit || 0),
        },
      ]),
    );

    const points = Array.from({ length: 10 }, (_, index) => {
      const year = startYear + index;
      const totals = bucketMap.get(year) ?? { revenue: 0, cost: 0, profit: 0 };
      return {
        key: String(year),
        label: String(year),
        revenue: totals.revenue,
        cost: totals.cost,
        profit: totals.profit,
      } satisfies SellerTrendChartPoint;
    });

    return {
      granularity: 'YEARLY',
      points,
      appliedStartDate: windowStart.toISOString(),
      appliedEndDate: windowEnd.toISOString(),
    } satisfies SellerTrendChartData;
  });
}

const DEFAULT_SELLER_PERFORMANCE_OVERVIEW: SellerPerformanceOverview = {
  sellers: [],
  sellerCount: 0,
  totalOrders: 0,
  totalSaleAmount: 0,
  totalCostAmount: 0,
  totalProfitAmount: 0,
};

const DEFAULT_SELLER_DETAILS_STATS: SellerDetailsStats = {
  totalOrders: 0,
  totalSaleAmount: 0,
  totalCostAmount: 0,
  totalProfitAmount: 0,
  totalWeightKg: 0,
  averageOrderAmount: 0,
  pendingApprovalOrders: 0,
  deliveringOrders: 0,
  deliveredOrders: 0,
  canceledOrders: 0,
  discountRequestedOrders: 0,
  discountApprovedOrders: 0,
  discountRejectedOrders: 0,
  unpaidCollectionOrders: 0,
  partialCollectionOrders: 0,
  paidCollectionOrders: 0,
  refundedOrders: 0,
  unpaidSupplierOrders: 0,
  supplierPaidOrders: 0,
  capitalCycleCompletedOrders: 0,
  firstOrderAt: undefined,
  lastOrderAt: undefined,
  daysActiveWithOrders: 0,
};

const DEFAULT_SELLER_DETAILS_PAGE_DATA: SellerDetailsPageData = {
  seller: null,
  stats: DEFAULT_SELLER_DETAILS_STATS,
  monthlyPerformance: [],
  topProducts: [],
  recentOrders: [],
  activeSaleProfiles: [],
  latestSaleProfiles: [],
};

const DEFAULT_SELLER_TREND_CHART_DATA: SellerTrendChartData = {
  granularity: 'DAILY',
  points: [],
};

function toStartOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toEndOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseOptionalDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

type TrendAggregateRow = {
  _id?: {
    year?: number;
    month?: number;
    day?: number;
  };
  revenue?: number;
  cost?: number;
  profit?: number;
};

export async function getSellerTrendChartData(
  sellerId: string,
  options?: {
    granularity?: SellerTrendGranularity;
    startDate?: string;
    endDate?: string;
    year?: number;
  },
): Promise<SellerTrendChartData> {
  const requestedGranularity = options?.granularity ?? 'DAILY';

  return runDataQuery('getSellerTrendChartData', { ...DEFAULT_SELLER_TREND_CHART_DATA, granularity: requestedGranularity }, async () => {
    if (!Types.ObjectId.isValid(sellerId)) {
      return { ...DEFAULT_SELLER_TREND_CHART_DATA, granularity: requestedGranularity };
    }

    const sellerObjectId = new Types.ObjectId(sellerId);
    const now = new Date();

    if (requestedGranularity === 'DAILY') {
      const defaultStart = toStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const defaultEnd = toEndOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

      const parsedStart = parseOptionalDate(options?.startDate);
      const parsedEnd = parseOptionalDate(options?.endDate);
      const rangeStart = parsedStart ? toStartOfDay(parsedStart) : defaultStart;
      const rangeEnd = parsedEnd ? toEndOfDay(parsedEnd) : defaultEnd;
      const isRangeValid = rangeStart.getTime() <= rangeEnd.getTime();
      const appliedStart = isRangeValid ? rangeStart : defaultStart;
      const appliedEnd = isRangeValid ? rangeEnd : defaultEnd;

      const rows = await Order.aggregate([
        {
          $match: {
            sellerId: sellerObjectId,
            deliveryDate: {
              $gte: appliedStart,
              $lte: appliedEnd,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$deliveryDate' },
              month: { $month: '$deliveryDate' },
              day: { $dayOfMonth: '$deliveryDate' },
            },
            revenue: { $sum: '$totalSaleAmount' },
            cost: { $sum: '$totalCostAmount' },
            profit: { $sum: '$totalProfitAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]);

      const bucketMap = new Map<string, { revenue: number; cost: number; profit: number }>(
        (rows as TrendAggregateRow[]).map(row => {
          const year = Number(row._id?.year || 0);
          const month = Number(row._id?.month || 0);
          const day = Number(row._id?.day || 0);
          const key = `${year}-${padDatePart(month)}-${padDatePart(day)}`;

          return [
            key,
            {
              revenue: Number(row.revenue || 0),
              cost: Number(row.cost || 0),
              profit: Number(row.profit || 0),
            },
          ];
        }),
      );

      const points: SellerTrendChartPoint[] = [];
      const cursor = new Date(appliedStart);

      while (cursor.getTime() <= appliedEnd.getTime()) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth() + 1;
        const day = cursor.getDate();
        const key = `${year}-${padDatePart(month)}-${padDatePart(day)}`;
        const totals = bucketMap.get(key) ?? { revenue: 0, cost: 0, profit: 0 };

        points.push({
          key,
          label: `${padDatePart(day)}/${padDatePart(month)}`,
          revenue: totals.revenue,
          cost: totals.cost,
          profit: totals.profit,
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      return {
        granularity: 'DAILY',
        points,
        appliedStartDate: appliedStart.toISOString(),
        appliedEndDate: appliedEnd.toISOString(),
      } satisfies SellerTrendChartData;
    }

    if (requestedGranularity === 'MONTHLY') {
      const currentYear = now.getFullYear();
      const parsedYear = Number(options?.year);
      const appliedYear = Number.isFinite(parsedYear) ? Math.floor(parsedYear) : currentYear;
      const yearStart = toStartOfDay(new Date(appliedYear, 0, 1));
      const yearEnd = toEndOfDay(new Date(appliedYear, 11, 31));

      const rows = await Order.aggregate([
        {
          $match: {
            sellerId: sellerObjectId,
            deliveryDate: {
              $gte: yearStart,
              $lte: yearEnd,
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: '$deliveryDate' },
            },
            revenue: { $sum: '$totalSaleAmount' },
            cost: { $sum: '$totalCostAmount' },
            profit: { $sum: '$totalProfitAmount' },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]);

      const bucketMap = new Map<number, { revenue: number; cost: number; profit: number }>(
        (rows as TrendAggregateRow[]).map(row => [
          Number(row._id?.month || 0),
          {
            revenue: Number(row.revenue || 0),
            cost: Number(row.cost || 0),
            profit: Number(row.profit || 0),
          },
        ]),
      );

      const points = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const totals = bucketMap.get(month) ?? { revenue: 0, cost: 0, profit: 0 };
        return {
          key: `${appliedYear}-${padDatePart(month)}`,
          label: `${padDatePart(month)}/${appliedYear}`,
          revenue: totals.revenue,
          cost: totals.cost,
          profit: totals.profit,
        } satisfies SellerTrendChartPoint;
      });

      return {
        granularity: 'MONTHLY',
        points,
        appliedYear,
      } satisfies SellerTrendChartData;
    }

    const currentYear = now.getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 4;
    const windowStart = toStartOfDay(new Date(startYear, 0, 1));
    const windowEnd = toEndOfDay(new Date(endYear, 11, 31));

    const rows = await Order.aggregate([
      {
        $match: {
          sellerId: sellerObjectId,
          deliveryDate: {
            $gte: windowStart,
            $lte: windowEnd,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$deliveryDate' },
          },
          revenue: { $sum: '$totalSaleAmount' },
          cost: { $sum: '$totalCostAmount' },
          profit: { $sum: '$totalProfitAmount' },
        },
      },
      { $sort: { '_id.year': 1 } },
    ]);

    const bucketMap = new Map<number, { revenue: number; cost: number; profit: number }>(
      (rows as TrendAggregateRow[]).map(row => [
        Number(row._id?.year || 0),
        {
          revenue: Number(row.revenue || 0),
          cost: Number(row.cost || 0),
          profit: Number(row.profit || 0),
        },
      ]),
    );

    const points = Array.from({ length: 10 }, (_, index) => {
      const year = startYear + index;
      const totals = bucketMap.get(year) ?? { revenue: 0, cost: 0, profit: 0 };
      return {
        key: String(year),
        label: String(year),
        revenue: totals.revenue,
        cost: totals.cost,
        profit: totals.profit,
      } satisfies SellerTrendChartPoint;
    });

    return {
      granularity: 'YEARLY',
      points,
      appliedStartDate: windowStart.toISOString(),
      appliedEndDate: windowEnd.toISOString(),
    } satisfies SellerTrendChartData;
  });
}

const DEFAULT_CUSTOMER_DETAILS_STATS: CustomerDetailsStats = {
  totalOrders: 0,
  totalSpentAmount: 0,
  totalCostAmount: 0,
  totalProfitAmount: 0,
  totalWeightKg: 0,
  averageOrderAmount: 0,
  pendingApprovalOrders: 0,
  deliveringOrders: 0,
  deliveredOrders: 0,
  canceledOrders: 0,
  unpaidOrders: 0,
  partiallyPaidOrders: 0,
  paidInFullOrders: 0,
  refundedOrders: 0,
  uniqueSellerCount: 0,
  firstOrderAt: undefined,
  lastOrderAt: undefined,
  daysActiveWithOrders: 0,
};

const DEFAULT_CUSTOMER_DETAILS_PAGE_DATA: CustomerDetailsPageData = {
  customer: null,
  stats: DEFAULT_CUSTOMER_DETAILS_STATS,
  monthlyPerformance: [],
  topProducts: [],
  sellerContributions: [],
  recentOrders: [],
};

export async function getSellerPerformanceOverview() {
  return runDataQuery('getSellerPerformanceOverview', DEFAULT_SELLER_PERFORMANCE_OVERVIEW, async () => {
    const raw = await Order.aggregate([
      {
        $group: {
          _id: '$sellerId',
          sellerName: { $first: '$sellerName' },
          orderCount: { $sum: 1 },
          totalSaleAmount: { $sum: '$totalSaleAmount' },
          totalCostAmount: { $sum: '$totalCostAmount' },
          totalProfitAmount: { $sum: '$totalProfitAmount' },
          pendingApprovalCount: {
            $sum: {
              $cond: [{ $eq: ['$approval.status', 'PENDING'] }, 1, 0],
            },
          },
          deliveringCount: {
            $sum: {
              $cond: [{ $eq: ['$fulfillmentStatus', 'DELIVERING'] }, 1, 0],
            },
          },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ['$fulfillmentStatus', 'DELIVERED'] }, 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          averageOrderAmount: {
            $cond: [{ $gt: ['$orderCount', 0] }, { $divide: ['$totalSaleAmount', '$orderCount'] }, 0],
          },
        },
      },
      { $sort: { totalSaleAmount: -1, orderCount: -1 } },
    ]);

    const sellers = raw.map(item => ({
      sellerId: item._id ? String(item._id) : '',
      sellerName: item.sellerName || 'Unknown seller',
      orderCount: Number(item.orderCount || 0),
      totalSaleAmount: Number(item.totalSaleAmount || 0),
      totalCostAmount: Number(item.totalCostAmount || 0),
      totalProfitAmount: Number(item.totalProfitAmount || 0),
      averageOrderAmount: Number(item.averageOrderAmount || 0),
      pendingApprovalCount: Number(item.pendingApprovalCount || 0),
      deliveringCount: Number(item.deliveringCount || 0),
      deliveredCount: Number(item.deliveredCount || 0),
    }));

    return {
      sellers,
      sellerCount: sellers.length,
      totalOrders: sellers.reduce((total, item) => total + item.orderCount, 0),
      totalSaleAmount: sellers.reduce((total, item) => total + item.totalSaleAmount, 0),
      totalCostAmount: sellers.reduce((total, item) => total + item.totalCostAmount, 0),
      totalProfitAmount: sellers.reduce((total, item) => total + item.totalProfitAmount, 0),
    } satisfies SellerPerformanceOverview;
  });
}

export async function getSellerDetailsPageData(sellerId: string): Promise<SellerDetailsPageData> {
  return runDataQuery('getSellerDetailsPageData', DEFAULT_SELLER_DETAILS_PAGE_DATA, async () => {
    if (!Types.ObjectId.isValid(sellerId)) {
      return DEFAULT_SELLER_DETAILS_PAGE_DATA;
    }

    const sellerObjectId = new Types.ObjectId(sellerId);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const [sellerDoc, statsRaw, monthlyRaw, topProductsRaw, recentOrderDocs, activeProfilesDocs, latestProfilesDocs] = await Promise.all([
      Seller.findById(sellerObjectId).lean(),
      Order.aggregate([
        { $match: { sellerId: sellerObjectId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSaleAmount: { $sum: '$totalSaleAmount' },
            totalCostAmount: { $sum: '$totalCostAmount' },
            totalProfitAmount: { $sum: '$totalProfitAmount' },
            totalWeightKg: { $sum: '$totalWeightKg' },
            pendingApprovalOrders: {
              $sum: {
                $cond: [{ $eq: ['$approval.status', 'PENDING'] }, 1, 0],
              },
            },
            deliveringOrders: {
              $sum: {
                $cond: [{ $eq: ['$fulfillmentStatus', 'DELIVERING'] }, 1, 0],
              },
            },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ['$fulfillmentStatus', 'DELIVERED'] }, 1, 0],
              },
            },
            canceledOrders: {
              $sum: {
                $cond: [{ $eq: ['$fulfillmentStatus', 'CANCELED'] }, 1, 0],
              },
            },
            discountRequestedOrders: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $eq: ['$discountRequest.status', 'PENDING'] }, { $gt: ['$discountRequest.requestedPercent', 0] }],
                  },
                  1,
                  0,
                ],
              },
            },
            discountApprovedOrders: {
              $sum: {
                $cond: [{ $eq: ['$discountRequest.status', 'APPROVED'] }, 1, 0],
              },
            },
            discountRejectedOrders: {
              $sum: {
                $cond: [{ $eq: ['$discountRequest.status', 'REJECTED'] }, 1, 0],
              },
            },
            unpaidCollectionOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'UNPAID'] }, 1, 0],
              },
            },
            partialCollectionOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'PARTIALLY_PAID'] }, 1, 0],
              },
            },
            paidCollectionOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'PAID_IN_FULL'] }, 1, 0],
              },
            },
            refundedOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'REFUNDED'] }, 1, 0],
              },
            },
            unpaidSupplierOrders: {
              $sum: {
                $cond: [{ $eq: ['$supplierPaymentStatus', 'UNPAID_SUPPLIER'] }, 1, 0],
              },
            },
            supplierPaidOrders: {
              $sum: {
                $cond: [{ $eq: ['$supplierPaymentStatus', 'SUPPLIER_PAID'] }, 1, 0],
              },
            },
            capitalCycleCompletedOrders: {
              $sum: {
                $cond: [{ $eq: ['$supplierPaymentStatus', 'CAPITAL_CYCLE_COMPLETED'] }, 1, 0],
              },
            },
            firstOrderAt: { $min: '$createdAt' },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            sellerId: sellerObjectId,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            orderCount: { $sum: 1 },
            totalSaleAmount: { $sum: '$totalSaleAmount' },
            totalCostAmount: { $sum: '$totalCostAmount' },
            totalProfitAmount: { $sum: '$totalProfitAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Order.aggregate([
        { $match: { sellerId: sellerObjectId } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$items.productName' },
            orderCount: { $sum: 1 },
            totalWeightKg: { $sum: '$items.weightKg' },
            totalSaleAmount: { $sum: '$items.lineSaleTotal' },
            totalProfitAmount: { $sum: '$items.lineProfit' },
          },
        },
        { $sort: { totalSaleAmount: -1, orderCount: -1 } },
        { $limit: 8 },
      ]),
      Order.find({ sellerId: sellerObjectId }).sort({ createdAt: -1 }).limit(10).lean(),
      PriceProfile.find({
        type: 'SALE',
        sellerId: sellerObjectId,
        isActive: true,
      })
        .sort({ updatedAt: -1, effectiveFrom: -1 })
        .limit(6)
        .lean(),
      PriceProfile.find({
        type: 'SALE',
        sellerId: sellerObjectId,
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    if (!sellerDoc) {
      return DEFAULT_SELLER_DETAILS_PAGE_DATA;
    }

    const statsAgg = statsRaw[0] as
      | {
          totalOrders?: number;
          totalSaleAmount?: number;
          totalCostAmount?: number;
          totalProfitAmount?: number;
          totalWeightKg?: number;
          pendingApprovalOrders?: number;
          deliveringOrders?: number;
          deliveredOrders?: number;
          canceledOrders?: number;
          discountRequestedOrders?: number;
          discountApprovedOrders?: number;
          discountRejectedOrders?: number;
          unpaidCollectionOrders?: number;
          partialCollectionOrders?: number;
          paidCollectionOrders?: number;
          refundedOrders?: number;
          unpaidSupplierOrders?: number;
          supplierPaidOrders?: number;
          capitalCycleCompletedOrders?: number;
          firstOrderAt?: Date | string | null;
          lastOrderAt?: Date | string | null;
        }
      | undefined;

    const totalOrders = Number(statsAgg?.totalOrders || 0);
    const totalSaleAmount = Number(statsAgg?.totalSaleAmount || 0);
    const firstOrderAt = statsAgg?.firstOrderAt ? toIsoString(statsAgg.firstOrderAt) : undefined;
    const lastOrderAt = statsAgg?.lastOrderAt ? toIsoString(statsAgg.lastOrderAt) : undefined;
    const daysActiveWithOrders =
      firstOrderAt && lastOrderAt
        ? Math.max(1, Math.floor((new Date(lastOrderAt).getTime() - new Date(firstOrderAt).getTime()) / (24 * 60 * 60 * 1000)) + 1)
        : 0;

    const stats: SellerDetailsStats = {
      totalOrders,
      totalSaleAmount,
      totalCostAmount: Number(statsAgg?.totalCostAmount || 0),
      totalProfitAmount: Number(statsAgg?.totalProfitAmount || 0),
      totalWeightKg: Number(statsAgg?.totalWeightKg || 0),
      averageOrderAmount: totalOrders > 0 ? totalSaleAmount / totalOrders : 0,
      pendingApprovalOrders: Number(statsAgg?.pendingApprovalOrders || 0),
      deliveringOrders: Number(statsAgg?.deliveringOrders || 0),
      deliveredOrders: Number(statsAgg?.deliveredOrders || 0),
      canceledOrders: Number(statsAgg?.canceledOrders || 0),
      discountRequestedOrders: Number(statsAgg?.discountRequestedOrders || 0),
      discountApprovedOrders: Number(statsAgg?.discountApprovedOrders || 0),
      discountRejectedOrders: Number(statsAgg?.discountRejectedOrders || 0),
      unpaidCollectionOrders: Number(statsAgg?.unpaidCollectionOrders || 0),
      partialCollectionOrders: Number(statsAgg?.partialCollectionOrders || 0),
      paidCollectionOrders: Number(statsAgg?.paidCollectionOrders || 0),
      refundedOrders: Number(statsAgg?.refundedOrders || 0),
      unpaidSupplierOrders: Number(statsAgg?.unpaidSupplierOrders || 0),
      supplierPaidOrders: Number(statsAgg?.supplierPaidOrders || 0),
      capitalCycleCompletedOrders: Number(statsAgg?.capitalCycleCompletedOrders || 0),
      firstOrderAt,
      lastOrderAt,
      daysActiveWithOrders,
    };

    const monthlyMap = new Map<string, { orderCount: number; totalSaleAmount: number; totalCostAmount: number; totalProfitAmount: number }>(
      monthlyRaw.map(item => {
        const year = Number(item?._id?.year || 0);
        const month = Number(item?._id?.month || 0);
        return [
          `${year}-${month}`,
          {
            orderCount: Number(item?.orderCount || 0),
            totalSaleAmount: Number(item?.totalSaleAmount || 0),
            totalCostAmount: Number(item?.totalCostAmount || 0),
            totalProfitAmount: Number(item?.totalProfitAmount || 0),
          },
        ];
      }),
    );

    const monthlyPerformance: SellerDetailsMonthlyPoint[] = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(sixMonthsAgo);
      monthDate.setMonth(sixMonthsAgo.getMonth() + index);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      const bucket = monthlyMap.get(`${year}-${month}`);

      return {
        year,
        month,
        orderCount: bucket?.orderCount ?? 0,
        totalSaleAmount: bucket?.totalSaleAmount ?? 0,
        totalCostAmount: bucket?.totalCostAmount ?? 0,
        totalProfitAmount: bucket?.totalProfitAmount ?? 0,
      };
    });

    return {
      seller: toSellerView(sellerDoc),
      stats,
      monthlyPerformance,
      topProducts: topProductsRaw.map(item => ({
        productId: String(item?._id),
        productName: item?.productName || 'Unknown product',
        orderCount: Number(item?.orderCount || 0),
        totalWeightKg: Number(item?.totalWeightKg || 0),
        totalSaleAmount: Number(item?.totalSaleAmount || 0),
        totalProfitAmount: Number(item?.totalProfitAmount || 0),
      })),
      recentOrders: recentOrderDocs.map(toOrderView),
      activeSaleProfiles: activeProfilesDocs.map(toPriceProfileView),
      latestSaleProfiles: latestProfilesDocs.map(toPriceProfileView),
    } satisfies SellerDetailsPageData;
  });
}

export async function getCustomerDetailsPageData(customerId: string) {
  return runDataQuery('getCustomerDetailsPageData', DEFAULT_CUSTOMER_DETAILS_PAGE_DATA, async () => {
    if (!Types.ObjectId.isValid(customerId)) {
      return DEFAULT_CUSTOMER_DETAILS_PAGE_DATA;
    }

    const customerObjectId = new Types.ObjectId(customerId);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const [customerDoc, statsRaw, monthlyRaw, topProductsRaw, sellerContributionsRaw, recentOrderDocs] = await Promise.all([
      Customer.findById(customerObjectId).lean(),
      Order.aggregate([
        { $match: { customerId: customerObjectId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpentAmount: { $sum: '$totalSaleAmount' },
            totalCostAmount: { $sum: '$totalCostAmount' },
            totalProfitAmount: { $sum: '$totalProfitAmount' },
            totalWeightKg: { $sum: '$totalWeightKg' },
            pendingApprovalOrders: {
              $sum: {
                $cond: [{ $eq: ['$approval.status', 'PENDING'] }, 1, 0],
              },
            },
            deliveringOrders: {
              $sum: {
                $cond: [{ $eq: ['$fulfillmentStatus', 'DELIVERING'] }, 1, 0],
              },
            },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ['$fulfillmentStatus', 'DELIVERED'] }, 1, 0],
              },
            },
            canceledOrders: {
              $sum: {
                $cond: [{ $eq: ['$fulfillmentStatus', 'CANCELED'] }, 1, 0],
              },
            },
            unpaidOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'UNPAID'] }, 1, 0],
              },
            },
            partiallyPaidOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'PARTIALLY_PAID'] }, 1, 0],
              },
            },
            paidInFullOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'PAID_IN_FULL'] }, 1, 0],
              },
            },
            refundedOrders: {
              $sum: {
                $cond: [{ $eq: ['$collectionStatus', 'REFUNDED'] }, 1, 0],
              },
            },
            sellerIds: { $addToSet: '$sellerId' },
            firstOrderAt: { $min: '$createdAt' },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            customerId: customerObjectId,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            orderCount: { $sum: 1 },
            totalSpentAmount: { $sum: '$totalSaleAmount' },
            totalProfitAmount: { $sum: '$totalProfitAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Order.aggregate([
        { $match: { customerId: customerObjectId } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$items.productName' },
            orderCount: { $sum: 1 },
            totalWeightKg: { $sum: '$items.weightKg' },
            totalSpentAmount: { $sum: '$items.lineSaleTotal' },
            totalProfitAmount: { $sum: '$items.lineProfit' },
          },
        },
        { $sort: { totalSpentAmount: -1, orderCount: -1 } },
        { $limit: 8 },
      ]),
      Order.aggregate([
        { $match: { customerId: customerObjectId } },
        {
          $group: {
            _id: '$sellerId',
            sellerName: { $first: '$sellerName' },
            orderCount: { $sum: 1 },
            totalSpentAmount: { $sum: '$totalSaleAmount' },
            totalProfitAmount: { $sum: '$totalProfitAmount' },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
        { $sort: { totalSpentAmount: -1, orderCount: -1 } },
        { $limit: 8 },
      ]),
      Order.find({ customerId: customerObjectId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    if (!customerDoc) {
      return DEFAULT_CUSTOMER_DETAILS_PAGE_DATA;
    }

    const statsAgg = statsRaw[0] as
      | {
          totalOrders?: number;
          totalSpentAmount?: number;
          totalCostAmount?: number;
          totalProfitAmount?: number;
          totalWeightKg?: number;
          pendingApprovalOrders?: number;
          deliveringOrders?: number;
          deliveredOrders?: number;
          canceledOrders?: number;
          unpaidOrders?: number;
          partiallyPaidOrders?: number;
          paidInFullOrders?: number;
          refundedOrders?: number;
          sellerIds?: unknown[];
          firstOrderAt?: Date | string | null;
          lastOrderAt?: Date | string | null;
        }
      | undefined;

    const totalOrders = Number(statsAgg?.totalOrders || 0);
    const totalSpentAmount = Number(statsAgg?.totalSpentAmount || 0);
    const firstOrderAt = statsAgg?.firstOrderAt ? toIsoString(statsAgg.firstOrderAt) : undefined;
    const lastOrderAt = statsAgg?.lastOrderAt ? toIsoString(statsAgg.lastOrderAt) : undefined;
    const daysActiveWithOrders =
      firstOrderAt && lastOrderAt
        ? Math.max(1, Math.floor((new Date(lastOrderAt).getTime() - new Date(firstOrderAt).getTime()) / (24 * 60 * 60 * 1000)) + 1)
        : 0;

    const stats: CustomerDetailsStats = {
      totalOrders,
      totalSpentAmount,
      totalCostAmount: Number(statsAgg?.totalCostAmount || 0),
      totalProfitAmount: Number(statsAgg?.totalProfitAmount || 0),
      totalWeightKg: Number(statsAgg?.totalWeightKg || 0),
      averageOrderAmount: totalOrders > 0 ? totalSpentAmount / totalOrders : 0,
      pendingApprovalOrders: Number(statsAgg?.pendingApprovalOrders || 0),
      deliveringOrders: Number(statsAgg?.deliveringOrders || 0),
      deliveredOrders: Number(statsAgg?.deliveredOrders || 0),
      canceledOrders: Number(statsAgg?.canceledOrders || 0),
      unpaidOrders: Number(statsAgg?.unpaidOrders || 0),
      partiallyPaidOrders: Number(statsAgg?.partiallyPaidOrders || 0),
      paidInFullOrders: Number(statsAgg?.paidInFullOrders || 0),
      refundedOrders: Number(statsAgg?.refundedOrders || 0),
      uniqueSellerCount: Array.isArray(statsAgg?.sellerIds) ? statsAgg.sellerIds.length : 0,
      firstOrderAt,
      lastOrderAt,
      daysActiveWithOrders,
    };

    const monthlyMap = new Map<string, { orderCount: number; totalSpentAmount: number; totalProfitAmount: number }>(
      monthlyRaw.map(item => {
        const year = Number(item?._id?.year || 0);
        const month = Number(item?._id?.month || 0);
        return [
          `${year}-${month}`,
          {
            orderCount: Number(item?.orderCount || 0),
            totalSpentAmount: Number(item?.totalSpentAmount || 0),
            totalProfitAmount: Number(item?.totalProfitAmount || 0),
          },
        ];
      }),
    );

    const monthlyPerformance: CustomerDetailsMonthlyPoint[] = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(sixMonthsAgo);
      monthDate.setMonth(sixMonthsAgo.getMonth() + index);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      const bucket = monthlyMap.get(`${year}-${month}`);

      return {
        year,
        month,
        orderCount: bucket?.orderCount ?? 0,
        totalSpentAmount: bucket?.totalSpentAmount ?? 0,
        totalProfitAmount: bucket?.totalProfitAmount ?? 0,
      };
    });

    return {
      customer: toCustomerView(customerDoc),
      stats,
      monthlyPerformance,
      topProducts: topProductsRaw.map(item => ({
        productId: String(item?._id),
        productName: item?.productName || 'Unknown product',
        orderCount: Number(item?.orderCount || 0),
        totalWeightKg: Number(item?.totalWeightKg || 0),
        totalSpentAmount: Number(item?.totalSpentAmount || 0),
        totalProfitAmount: Number(item?.totalProfitAmount || 0),
      })),
      sellerContributions: sellerContributionsRaw.map(item => ({
        sellerId: item?._id ? String(item._id) : '',
        sellerName: item?.sellerName || 'Unknown seller',
        orderCount: Number(item?.orderCount || 0),
        totalSpentAmount: Number(item?.totalSpentAmount || 0),
        totalProfitAmount: Number(item?.totalProfitAmount || 0),
        lastOrderAt: item?.lastOrderAt ? toIsoString(item.lastOrderAt) : undefined,
      })),
      recentOrders: recentOrderDocs.map(toOrderView),
    } satisfies CustomerDetailsPageData;
  });
}

const DEFAULT_DASHBOARD_STATS: DashboardStats = {
  totalProducts: 0,
  activeProducts: 0,
  totalOrders: 0,
  deliveringOrders: 0,
  totalRevenue: 0,
  totalCost: 0,
  totalProfit: 0,
  unpaidOrders: 0,
  uncollectedOrders: 0,
};

export async function getDashboardStats() {
  return runDataQuery('getDashboardStats', DEFAULT_DASHBOARD_STATS, async () => {
    const [totalProducts, activeProducts, totalOrders, deliveringOrders, uncollectedOrders, totals] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({
        fulfillmentStatus: { $in: ['CONFIRMED', 'PICKED', 'DELIVERING'] },
      }),
      Order.countDocuments({
        collectionStatus: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
      }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalSaleAmount' },
            totalCost: { $sum: '$totalCostAmount' },
            totalProfit: { $sum: '$totalProfitAmount' },
            unpaidOrders: {
              $sum: {
                $cond: [{ $eq: ['$supplierPaymentStatus', 'UNPAID_SUPPLIER'] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const aggregate = totals[0] ?? {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      unpaidOrders: 0,
    };

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      deliveringOrders,
      totalRevenue: aggregate.totalRevenue,
      totalCost: aggregate.totalCost,
      totalProfit: aggregate.totalProfit,
      unpaidOrders: aggregate.unpaidOrders,
      uncollectedOrders,
    } satisfies DashboardStats;
  });
}

const DEFAULT_PRICE_PROFILE_STATS: PriceProfileStats = {
  totalProfiles: 0,
  activeProfiles: 0,
  pricedProductsCount: 0,
  averageProductsPerProfile: 0,
};

export async function getPriceProfileStats(options?: { type?: PriceProfileType; sellerId?: string }) {
  return runDataQuery('getPriceProfileStats', DEFAULT_PRICE_PROFILE_STATS, async () => {
    const match: Record<string, unknown> = {};

    if (options?.type) {
      match.type = options.type;
    }

    if (options?.sellerId) {
      if (options.type === 'SALE') {
        const ownershipClause = buildSaleOwnershipClause(options.sellerId);
        if (!ownershipClause) {
          return DEFAULT_PRICE_PROFILE_STATS;
        }

        match.$or = ownershipClause;
      } else if (!Types.ObjectId.isValid(options.sellerId)) {
        return DEFAULT_PRICE_PROFILE_STATS;
      } else {
        match.sellerId = new Types.ObjectId(options.sellerId);
      }
    }

    const [result] = await PriceProfile.aggregate([
      {
        $match: match,
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalProfiles: { $sum: 1 },
                activeProfiles: {
                  $sum: {
                    $cond: ['$isActive', 1, 0],
                  },
                },
                totalItems: {
                  $sum: { $size: { $ifNull: ['$items', []] } },
                },
              },
            },
          ],
          priced: [
            {
              $unwind: {
                path: '$items',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: null,
                productIds: { $addToSet: '$items.productId' },
              },
            },
          ],
        },
      },
    ]);

    const summary = result?.summary?.[0] ?? {
      totalProfiles: 0,
      activeProfiles: 0,
      totalItems: 0,
    };
    const priced = result?.priced?.[0] ?? { productIds: [] as unknown[] };
    const totalProfiles = summary.totalProfiles ?? 0;

    return {
      totalProfiles,
      activeProfiles: summary.activeProfiles ?? 0,
      pricedProductsCount: Array.isArray(priced.productIds) ? priced.productIds.length : 0,
      averageProductsPerProfile: totalProfiles > 0 ? Math.round(((summary.totalItems ?? 0) / totalProfiles) * 10) / 10 : 0,
    } satisfies PriceProfileStats;
  });
}
