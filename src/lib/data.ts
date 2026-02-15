import { unstable_noStore as noStore } from "next/cache";
import { Types } from "mongoose";
import type {
  CustomerView,
  DashboardStats,
  OrderView,
  PriceProfileView,
  ProductView,
  SellerRole,
  SellerView,
} from "@/types";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";
import { Order } from "@/models/order";
import { PriceProfile } from "@/models/price-profile";
import { Product } from "@/models/product";
import { Seller } from "@/models/seller";
import type {
  OrderApprovalStatus,
  OrderDiscountStatus,
  CollectionStatus,
  OrderFulfillmentStatus,
  PriceProfileType,
  SupplierPaymentStatus,
} from "@/lib/constants";

function toIsoString(value: Date | string | null | undefined) {
  return new Date(value ?? Date.now()).toISOString();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSaleOwnershipClause(sellerId: string) {
  if (!Types.ObjectId.isValid(sellerId)) {
    return null;
  }

  return [
    { sellerId: new Types.ObjectId(sellerId) },
    { sellerId: { $exists: false } },
    { sellerId: null },
  ] as Array<Record<string, unknown>>;
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
    customerId: doc.customerId ? String(doc.customerId) : "",
    customerName: doc.customerName || doc.buyerName,
    sellerId: doc.sellerId ? String(doc.sellerId) : "",
    sellerName: doc.sellerName || "",
    deliveryDate: toIsoString(doc.deliveryDate),
    fulfillmentStatus: doc.fulfillmentStatus,
    approval: {
      requiresAdminApproval: doc.approval?.requiresAdminApproval ?? false,
      status:
        doc.approval?.status ??
        (doc.fulfillmentStatus === "PENDING_APPROVAL" ? "PENDING" : "APPROVED"),
      requestedAt: toIsoString(doc.approval?.requestedAt ?? doc.createdAt),
      reviewedAt: doc.approval?.reviewedAt ? toIsoString(doc.approval.reviewedAt) : undefined,
      reviewedBySellerId: doc.approval?.reviewedBySellerId
        ? String(doc.approval.reviewedBySellerId)
        : undefined,
      reviewedBySellerName: doc.approval?.reviewedBySellerName || undefined,
      note: doc.approval?.note || undefined,
    },
    discountRequest: {
      status: doc.discountRequest?.status ?? "NONE",
      requestedPercent: doc.discountRequest?.requestedPercent ?? 0,
      requestedAmount: doc.discountRequest?.requestedAmount ?? 0,
      requestedSaleAmount:
        doc.discountRequest?.requestedSaleAmount ??
        doc.baseSaleAmount ??
        doc.totalSaleAmount,
      reason: doc.discountRequest?.reason || undefined,
      reviewedAt: doc.discountRequest?.reviewedAt
        ? toIsoString(doc.discountRequest.reviewedAt)
        : undefined,
      reviewedBySellerId: doc.discountRequest?.reviewedBySellerId
        ? String(doc.discountRequest.reviewedBySellerId)
        : undefined,
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
    items: doc.items.map((item) => ({
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
    email: doc.email ?? "",
    notes: doc.notes ?? "",
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
    items: (doc.items ?? []).map((item) => ({
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
  deliveryYear?: number;
  deliveryMonth?: number;
  deliveryDay?: number;
  search?: string;
};

export type OrdersPageData = {
  orders: OrderView[];
  totalSaleAmount: number;
  totalProfitAmount: number;
  filteredCount: number;
  totalCount: number;
  availableYears: number[];
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
  status?: "ALL" | "ACTIVE" | "INACTIVE";
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
  status?: "ALL" | "ENABLED" | "DISABLED";
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

  if (filters?.search?.trim()) {
    const keyword = {
      $regex: escapeRegex(filters.search.trim()),
      $options: "i",
    };
    query.$or = [
      { code: keyword },
      { buyerName: keyword },
      { customerName: keyword },
      { sellerName: keyword },
      { "items.productName": keyword },
    ];
  }

  const dateExpr: Record<string, unknown>[] = [];

  if (typeof filters?.deliveryYear === "number") {
    dateExpr.push({ $eq: [{ $year: "$deliveryDate" }, filters.deliveryYear] });
  }

  if (typeof filters?.deliveryMonth === "number") {
    dateExpr.push({ $eq: [{ $month: "$deliveryDate" }, filters.deliveryMonth] });
  }

  if (typeof filters?.deliveryDay === "number") {
    dateExpr.push({ $eq: [{ $dayOfMonth: "$deliveryDate" }, filters.deliveryDay] });
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

  if (filters?.status === "ACTIVE") {
    query.isActive = true;
  } else if (filters?.status === "INACTIVE") {
    query.isActive = false;
  }

  if (filters?.search?.trim()) {
    const keyword = {
      $regex: escapeRegex(filters.search.trim()),
      $options: "i",
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

  if (filters?.status === "ENABLED") {
    query.isEnabled = true;
  } else if (filters?.status === "DISABLED") {
    query.isEnabled = false;
  }

  if (filters?.search?.trim()) {
    const keyword = {
      $regex: escapeRegex(filters.search.trim()),
      $options: "i",
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

export async function listProducts(options?: {
  activeOnly?: boolean;
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
}) {
  return runDataQuery("listProducts", [] as ProductView[], async () => {
    const query: Record<string, unknown> = {};
    const trimmedSearch = options?.search?.trim();

    if (options?.activeOnly) {
      query.isActive = true;
    } else if (options?.status === "ACTIVE") {
      query.isActive = true;
    } else if (options?.status === "INACTIVE") {
      query.isActive = false;
    }

    if (trimmedSearch) {
      const keyword = { $regex: escapeRegex(trimmedSearch), $options: "i" };
      query.$or = [{ name: keyword }, { description: keyword }];
    }

    const docs = await Product.find(query).sort({ name: 1 }).lean();

    return docs.map(
      (doc): ProductView => ({
        id: String(doc._id),
        name: doc.name,
        description: doc.description ?? "",
        unit: "kg",
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
  return runDataQuery("getProductStats", DEFAULT_PRODUCT_STATS, async () => {
    const [totalProducts, activeProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
    ]);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: Math.max(totalProducts - activeProducts, 0),
    } satisfies ProductStats;
  });
}

export async function getDefaultSalePrices(options?: { sellerId?: string }) {
  return runDataQuery("getDefaultSalePrices", {} as DefaultSalePriceMap, async () => {
    const query: Record<string, unknown> = { type: "SALE" };

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

    const fallbackProfile =
      activeProfile ??
      (await PriceProfile.findOne(query)
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .lean());

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
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  search?: string;
}) {
  return runDataQuery("listPriceProfiles", [] as PriceProfileView[], async () => {
    const query: Record<string, unknown> = {};

    if (options?.type) {
      query.type = options.type;
    }

    if (options?.activeOnly) {
      query.isActive = true;
    } else if (options?.status === "ACTIVE") {
      query.isActive = true;
    } else if (options?.status === "INACTIVE") {
      query.isActive = false;
    }

    if (options?.search?.trim()) {
      query.name = {
        $regex: escapeRegex(options.search.trim()),
        $options: "i",
      };
    }

    if (options?.sellerId) {
      if (options.type === "SALE") {
        const ownershipClause = buildSaleOwnershipClause(options.sellerId);
        if (!ownershipClause) {
          return [];
        }

        query.$or = ownershipClause;
      } else if (!Types.ObjectId.isValid(options.sellerId)) {
        return [];
      } else {
        query.sellerId = new Types.ObjectId(options.sellerId);
      }
    }

    const docs = await PriceProfile.find(query)
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean();

    return docs.map(toPriceProfileView);
  });
}

export async function getActiveCostProfile() {
  return runDataQuery("getActiveCostProfile", null as PriceProfileView | null, async () => {
    const doc = await PriceProfile.findOne({
      type: "COST",
      isActive: true,
    })
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean();

    return doc ? toPriceProfileView(doc) : null;
  });
}

export async function listCustomers(options?: {
  activeOnly?: boolean;
  search?: string;
  limit?: number;
}) {
  return runDataQuery("listCustomers", [] as CustomerView[], async () => {
    const query: Record<string, unknown> = {};

    if (options?.activeOnly) {
      query.isActive = true;
    }

    const trimmedSearch = options?.search?.trim();
    if (trimmedSearch) {
      const keyword = { $regex: escapeRegex(trimmedSearch), $options: "i" };
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
  return runDataQuery("getCustomersPageData", DEFAULT_CUSTOMERS_PAGE_DATA, async () => {
    const query = buildCustomersQuery(filters);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [customers, filteredCount, totalCount, activeCount, withOrders, totalSpentAgg, newThisMonth] =
      await Promise.all([
        Customer.find(query).sort({ createdAt: -1 }).lean(),
        Customer.countDocuments(query),
        Customer.countDocuments(),
        Customer.countDocuments({ isActive: true }),
        Customer.countDocuments({ orderCount: { $gt: 0 } }),
        Customer.aggregate([
          {
            $group: {
              _id: null,
              totalSpentAmount: { $sum: "$totalSpentAmount" },
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

export async function listSellers(options?: {
  role?: SellerRole;
  status?: "ALL" | "ENABLED" | "DISABLED";
  search?: string;
}) {
  return runDataQuery("listSellers", [] as SellerView[], async () => {
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
};

export async function getSellersPageData(filters?: SellerFilters) {
  return runDataQuery("getSellersPageData", DEFAULT_SELLERS_PAGE_DATA, async () => {
    const query = buildSellersQuery(filters);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [sellers, filteredCount, totalCount, adminCount, sellerCount, enabledCount, topSellersRaw] =
      await Promise.all([
        Seller.find(query).sort({ createdAt: -1 }).lean(),
        Seller.countDocuments(query),
        Seller.countDocuments(),
        Seller.countDocuments({ role: "ADMIN" }),
        Seller.countDocuments({ role: "SELLER" }),
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
              _id: "$sellerId",
              sellerName: { $first: "$sellerName" },
              totalOrders: { $sum: 1 },
              totalSaleAmount: { $sum: "$totalSaleAmount" },
            },
          },
          { $sort: { totalOrders: -1, totalSaleAmount: -1 } },
          { $limit: 5 },
        ]),
      ]);

    return {
      sellers: sellers.map(toSellerView),
      filteredCount,
      totalCount,
      adminCount,
      sellerCount,
      enabledCount,
      disabledCount: Math.max(totalCount - enabledCount, 0),
      topSellers30d: topSellersRaw.map((item) => ({
        sellerId: String(item._id),
        sellerName: item.sellerName || "Unknown",
        totalOrders: Number(item.totalOrders || 0),
        totalSaleAmount: Number(item.totalSaleAmount || 0),
      })),
    } satisfies SellersPageData;
  });
}

export async function listOrders(options?: ListOrdersOptions) {
  return runDataQuery("listOrders", [] as OrderView[], async () => {
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

export async function getOrdersPageData(filters?: OrderFilters) {
  return runDataQuery("getOrdersPageData", DEFAULT_ORDERS_PAGE_DATA, async () => {
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
            totalSaleAmount: { $sum: "$totalSaleAmount" },
            totalProfitAmount: { $sum: "$totalProfitAmount" },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: { $year: "$deliveryDate" },
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
      availableYears: yearsAgg
        .map((entry) => Number(entry._id))
        .filter((year) => Number.isFinite(year)),
    } satisfies OrdersPageData;
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
  return runDataQuery("getDashboardStats", DEFAULT_DASHBOARD_STATS, async () => {
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      deliveringOrders,
      uncollectedOrders,
      totals,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({
        fulfillmentStatus: { $in: ["CONFIRMED", "PICKED", "DELIVERING"] },
      }),
      Order.countDocuments({
        collectionStatus: { $in: ["UNPAID", "PARTIALLY_PAID"] },
      }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalSaleAmount" },
            totalCost: { $sum: "$totalCostAmount" },
            totalProfit: { $sum: "$totalProfitAmount" },
            unpaidOrders: {
              $sum: {
                $cond: [{ $eq: ["$supplierPaymentStatus", "UNPAID_SUPPLIER"] }, 1, 0],
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

export async function getPriceProfileStats(options?: {
  type?: PriceProfileType;
  sellerId?: string;
}) {
  return runDataQuery("getPriceProfileStats", DEFAULT_PRICE_PROFILE_STATS, async () => {
    const match: Record<string, unknown> = {};

    if (options?.type) {
      match.type = options.type;
    }

    if (options?.sellerId) {
      if (options.type === "SALE") {
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
                    $cond: ["$isActive", 1, 0],
                  },
                },
                totalItems: {
                  $sum: { $size: { $ifNull: ["$items", []] } },
                },
              },
            },
          ],
          priced: [
            {
              $unwind: {
                path: "$items",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $group: {
                _id: null,
                productIds: { $addToSet: "$items.productId" },
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
      averageProductsPerProfile:
        totalProfiles > 0 ? Math.round(((summary.totalItems ?? 0) / totalProfiles) * 10) / 10 : 0,
    } satisfies PriceProfileStats;
  });
}
