import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const sellerSessionSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 400,
      default: "",
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "seller_sessions",
  },
);

sellerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SellerSessionDocument = InferSchemaType<typeof sellerSessionSchema>;

export const SellerSession: Model<SellerSessionDocument> =
  (models.SellerSession as Model<SellerSessionDocument>) ||
  model<SellerSessionDocument>("SellerSession", sellerSessionSchema);
