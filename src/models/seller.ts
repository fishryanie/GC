import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const SELLER_ROLES = ["ADMIN", "SELLER"] as const;

export type SellerRole = (typeof SELLER_ROLES)[number];

const sellerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    role: {
      type: String,
      enum: SELLER_ROLES,
      default: "SELLER",
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    createdBySellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
    },
  },
  {
    timestamps: true,
    collection: "sellers",
  },
);

sellerSchema.index({ email: 1 }, { unique: true });
sellerSchema.index({ role: 1, isEnabled: 1, createdAt: -1 });

export type SellerDocument = InferSchemaType<typeof sellerSchema>;

export const Seller: Model<SellerDocument> =
  (models.Seller as Model<SellerDocument>) || model<SellerDocument>("Seller", sellerSchema);
