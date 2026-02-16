import type {
  CollectionStatus,
  OrderApprovalStatus,
  OrderDiscountStatus,
  OrderFulfillmentStatus,
  PriceProfileType,
  SupplierPaymentStatus,
} from 'lib/constants';

export type ProductView = {
  id: string;
  name: string;
  description?: string;
  unit: 'kg';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PriceProfileItemView = {
  productId: string;
  productName: string;
  pricePerKg: number;
};

export type PriceProfileView = {
  id: string;
  name: string;
  type: PriceProfileType;
  sellerId?: string;
  sellerName?: string;
  effectiveFrom: string;
  notes?: string;
  isActive: boolean;
  items: PriceProfileItemView[];
  createdAt: string;
  updatedAt: string;
};

export type OrderLineView = {
  productId: string;
  productName: string;
  weightKg: number;
  costPricePerKg: number;
  salePricePerKg: number;
  baseSalePricePerKg: number;
  lineCostTotal: number;
  lineSaleTotal: number;
  baseLineSaleTotal: number;
  lineProfit: number;
};

export type OrderProfileSnapshotView = {
  profileId: string;
  profileName: string;
  effectiveFrom: string;
};

export type OrderView = {
  id: string;
  code: string;
  buyerName: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  deliveryDate: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  approval: {
    requiresAdminApproval: boolean;
    status: OrderApprovalStatus;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBySellerId?: string;
    reviewedBySellerName?: string;
    note?: string;
  };
  discountRequest: {
    status: OrderDiscountStatus;
    requestedPercent: number;
    requestedAmount: number;
    requestedSaleAmount: number;
    reason?: string;
    reviewedAt?: string;
    reviewedBySellerId?: string;
    reviewedBySellerName?: string;
    reviewNote?: string;
  };
  supplierPaymentStatus: SupplierPaymentStatus;
  collectionStatus: CollectionStatus;
  totalWeightKg: number;
  totalCostAmount: number;
  baseSaleAmount: number;
  totalSaleAmount: number;
  totalProfitAmount: number;
  costProfile: OrderProfileSnapshotView;
  saleProfile: OrderProfileSnapshotView;
  items: OrderLineView[];
  createdAt: string;
  updatedAt: string;
};

export type CustomerView = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  isActive: boolean;
  orderCount: number;
  totalSpentAmount: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SellerRole = 'ADMIN' | 'SELLER';

export type SellerView = {
  id: string;
  name: string;
  email: string;
  role: SellerRole;
  isEnabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  deliveringOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  unpaidOrders: number;
  uncollectedOrders: number;
};
