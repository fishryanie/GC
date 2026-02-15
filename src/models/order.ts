import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";
import {
  COLLECTION_STATUSES,
  ORDER_APPROVAL_STATUSES,
  ORDER_DISCOUNT_STATUSES,
  ORDER_FULFILLMENT_STATUSES,
  SUPPLIER_PAYMENT_STATUSES,
} from "@/lib/constants";

const orderLineSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0.01,
    },
    costPricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    salePricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    baseSalePricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    lineCostTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    lineSaleTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    baseLineSaleTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    lineProfit: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const profileSnapshotSchema = new Schema(
  {
    profileId: {
      type: Schema.Types.ObjectId,
      ref: "PriceProfile",
      required: true,
    },
    profileName: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

const orderApprovalSchema = new Schema(
  {
    requiresAdminApproval: {
      type: Boolean,
      default: true,
      required: true,
    },
    status: {
      type: String,
      enum: ORDER_APPROVAL_STATUSES,
      default: "PENDING",
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBySellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
    },
    reviewedBySellerName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false },
);

const orderDiscountRequestSchema = new Schema(
  {
    status: {
      type: String,
      enum: ORDER_DISCOUNT_STATUSES,
      default: "NONE",
      required: true,
    },
    requestedPercent: {
      type: Number,
      min: 0,
      max: 90,
      default: 0,
      required: true,
    },
    requestedAmount: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },
    requestedSaleAmount: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBySellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
    },
    reviewedBySellerName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ORDER_FULFILLMENT_STATUSES,
      default: "PENDING_APPROVAL",
      required: true,
    },
    supplierPaymentStatus: {
      type: String,
      enum: SUPPLIER_PAYMENT_STATUSES,
      default: "UNPAID_SUPPLIER",
      required: true,
    },
    collectionStatus: {
      type: String,
      enum: COLLECTION_STATUSES,
      default: "UNPAID",
      required: true,
    },
    costProfile: {
      type: profileSnapshotSchema,
      required: true,
    },
    saleProfile: {
      type: profileSnapshotSchema,
      required: true,
    },
    approval: {
      type: orderApprovalSchema,
      required: true,
      default: () => ({
        requiresAdminApproval: true,
        status: "PENDING",
        requestedAt: new Date(),
      }),
    },
    discountRequest: {
      type: orderDiscountRequestSchema,
      required: true,
      default: () => ({
        status: "NONE",
        requestedPercent: 0,
        requestedAmount: 0,
        requestedSaleAmount: 0,
      }),
    },
    items: {
      type: [orderLineSchema],
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: "Order must include at least one line item.",
      },
      required: true,
    },
    totalWeightKg: {
      type: Number,
      required: true,
      min: 0.01,
    },
    totalCostAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    baseSaleAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSaleAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalProfitAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ deliveryDate: -1, createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ "approval.status": 1, createdAt: -1 });
orderSchema.index({ "discountRequest.status": 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;

export const Order: Model<OrderDocument> =
  (models.Order as Model<OrderDocument>) || model<OrderDocument>("Order", orderSchema);
