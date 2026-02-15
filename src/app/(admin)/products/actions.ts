"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { requireAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PriceProfile } from "@/models/price-profile";
import { Product } from "@/models/product";
import {
  getActionMessages,
  handleActionError,
  redirectWithMessage,
} from "@/lib/action-helpers";

export async function upsertProductAction(formData: FormData) {
  try {
    await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "")
      .trim()
      .slice(0, 300);

    if (!name) {
      throw new Error(m.productNameRequired);
    }

    if (id) {
      await Product.findByIdAndUpdate(
        id,
        {
          $set: {
            name,
            description,
          },
        },
        { runValidators: true },
      );
      revalidatePath("/products");
      revalidatePath("/price-profiles");
      revalidatePath("/orders/new");
      redirectWithMessage("/products", "success", m.productUpdated);
    }

    await Product.create({
      name,
      description,
      unit: "kg",
      isActive: true,
    });

    revalidatePath("/products");
    revalidatePath("/price-profiles");
    revalidatePath("/orders/new");
    revalidatePath("/dashboard");

    redirectWithMessage("/products", "success", m.productCreated);
  } catch (error) {
    await handleActionError("/products", error);
  }
}

export async function toggleProductStatusAction(formData: FormData) {
  try {
    await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const productId = String(formData.get("productId") || "").trim();

    if (!Types.ObjectId.isValid(productId)) {
      throw new Error(m.invalidProductId);
    }

    const product = await Product.findById(productId);

    if (!product) {
      throw new Error(m.productNotFound);
    }

    product.isActive = !product.isActive;
    await product.save();

    revalidatePath("/products");
    revalidatePath("/orders/new");
    revalidatePath("/dashboard");

    redirectWithMessage("/products", "success", m.productStatusUpdated);
  } catch (error) {
    await handleActionError("/products", error);
  }
}

export async function deleteProductAction(formData: FormData) {
  try {
    await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const productId = String(formData.get("productId") || "").trim();

    if (!Types.ObjectId.isValid(productId)) {
      throw new Error(m.invalidProductId);
    }

    const objectId = new Types.ObjectId(productId);
    const product = await Product.findById(objectId);

    if (!product) {
      throw new Error(m.productNotFound);
    }

    await Product.findByIdAndDelete(objectId);

    await PriceProfile.updateMany(
      {},
      {
        $pull: {
          items: {
            productId: objectId,
          },
        },
      },
    );

    revalidatePath("/products");
    revalidatePath("/price-profiles");
    revalidatePath("/orders/new");
    revalidatePath("/dashboard");

    redirectWithMessage("/products", "success", m.productDeleted);
  } catch (error) {
    await handleActionError("/products", error);
  }
}
