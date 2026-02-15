import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 24,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastOrderAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 }, { sparse: true });
customerSchema.index({ isActive: 1, createdAt: -1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;

export const Customer: Model<CustomerDocument> =
  (models.Customer as Model<CustomerDocument>) || model<CustomerDocument>("Customer", customerSchema);
