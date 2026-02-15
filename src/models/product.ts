import { model, models, Schema, type InferSchemaType, type Model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    unit: {
      type: String,
      enum: ["kg"],
      default: "kg",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 1 }, { unique: true });

export type ProductDocument = InferSchemaType<typeof productSchema>;

const existingProductModel = models.Product as Model<ProductDocument> | undefined;

// Handle dev HMR safely: if an older model instance exists without the new field,
// extend the existing schema so updates with description are not dropped.
if (existingProductModel && !existingProductModel.schema.path("description")) {
  existingProductModel.schema.add({
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  });
}

export const Product: Model<ProductDocument> =
  existingProductModel || model<ProductDocument>("Product", productSchema);
