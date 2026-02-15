import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";
import { PRICE_PROFILE_TYPES } from "@/lib/constants";

const profileItemSchema = new Schema(
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
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const priceProfileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    type: {
      type: String,
      enum: PRICE_PROFILE_TYPES,
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
    },
    sellerName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    items: {
      type: [profileItemSchema],
      default: [],
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: "Price profile must include at least one item.",
      },
    },
  },
  {
    timestamps: true,
  },
);

priceProfileSchema.index({ type: 1, isActive: 1, effectiveFrom: -1 });
priceProfileSchema.index({ type: 1, sellerId: 1, effectiveFrom: -1, createdAt: -1 });

export type PriceProfileDocument = InferSchemaType<typeof priceProfileSchema>;

export const PriceProfile: Model<PriceProfileDocument> =
  (models.PriceProfile as Model<PriceProfileDocument>) ||
  model<PriceProfileDocument>("PriceProfile", priceProfileSchema);
