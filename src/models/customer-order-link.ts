import { model, models, Schema, type InferSchemaType, type Model } from 'mongoose';

const saleProfileItemSnapshotSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const saleProfileSnapshotSchema = new Schema(
  {
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'PriceProfile',
      required: true,
    },
    profileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    items: {
      type: [saleProfileItemSnapshotSchema],
      required: true,
      default: [],
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: 'Order link sale profile snapshot must include at least one item.',
      },
    },
  },
  { _id: false },
);

const customerOrderLinkSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 12,
      maxlength: 120,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    sellerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    saleProfile: {
      type: saleProfileSnapshotSchema,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    createdBySellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    createdBySellerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    usageCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'customer_order_links',
  },
);

customerOrderLinkSchema.index({ sellerId: 1, createdAt: -1 });
customerOrderLinkSchema.index({ sellerId: 1, isActive: 1, expiresAt: 1 });
customerOrderLinkSchema.index({ isActive: 1, expiresAt: 1 });

export type CustomerOrderLinkDocument = InferSchemaType<typeof customerOrderLinkSchema>;

export const CustomerOrderLink: Model<CustomerOrderLinkDocument> =
  (models.CustomerOrderLink as Model<CustomerOrderLinkDocument>) ||
  model<CustomerOrderLinkDocument>('CustomerOrderLink', customerOrderLinkSchema);
