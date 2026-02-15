"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { parseNumber } from "@/lib/format";
import { PRICE_PROFILE_TYPES } from "@/lib/constants";
import { requireAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PriceProfile } from "@/models/price-profile";
import { Product } from "@/models/product";
import {
  getActionMessages,
  getErrorMessage,
  handleActionError,
  redirectWithMessage,
} from "@/lib/action-helpers";

export type PriceProfileCreateResult = {
  ok: boolean;
  message: string;
};

export async function createPriceProfileAction(formData: FormData) {
  const responseMode = String(formData.get("_responseMode") || "redirect");
  const inlineResponse = responseMode === "inline";

  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const isActive = formData.get("isActive") === "on";

    if (!name) {
      throw new Error(m.profileNameRequired);
    }

    if (!PRICE_PROFILE_TYPES.includes(type as (typeof PRICE_PROFILE_TYPES)[number])) {
      throw new Error(m.invalidProfileType);
    }

    if (type === "COST" && session.seller.role !== "ADMIN") {
      throw new Error(m.onlyAdminCanManageCostProfiles);
    }

    const rawEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith("price_"));

    const pricePairs = rawEntries
      .map(([key, value]) => {
        const productId = key.replace("price_", "");
        return {
          productId,
          pricePerKg: parseNumber(value),
        };
      })
      .filter((item) => Types.ObjectId.isValid(item.productId) && item.pricePerKg > 0);

    if (pricePairs.length === 0) {
      throw new Error(m.priceRequired);
    }

    const productIds = pricePairs.map((item) => new Types.ObjectId(item.productId));
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((item) => [String(item._id), item]));

    const items = pricePairs.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(m.productMissingInSystem);
      }

      return {
        productId: product._id,
        productName: product.name,
        pricePerKg: item.pricePerKg,
      };
    });

    let nextIsActive = isActive;
    if (type === "COST") {
      const hasAnyActiveCost = await PriceProfile.exists({
        type: "COST",
        isActive: true,
      });
      if (!hasAnyActiveCost) {
        nextIsActive = true;
      }
    }

    if (type === "COST" && nextIsActive) {
      await PriceProfile.updateMany(
        {
          type: "COST",
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        },
      );
    }

    let saleSellerId: Types.ObjectId | undefined;
    let saleSellerName: string | undefined;
    if (type === "SALE") {
      if (session.seller.role === "ADMIN") {
        saleSellerId = undefined;
        saleSellerName = "System";
      } else {
        if (!Types.ObjectId.isValid(session.seller.id)) {
          throw new Error(m.invalidSellerId);
        }

        saleSellerId = new Types.ObjectId(session.seller.id);
        saleSellerName = session.seller.name;
      }
    }

    await PriceProfile.create({
      name,
      type,
      sellerId: saleSellerId,
      sellerName: type === "SALE" ? saleSellerName : undefined,
      effectiveFrom: new Date(),
      notes: notes || undefined,
      isActive: nextIsActive,
      items,
    });

    revalidatePath("/price-profiles");
    revalidatePath("/orders/new");

    if (inlineResponse) {
      return {
        ok: true,
        message: m.profileCreated,
      } satisfies PriceProfileCreateResult;
    }

    redirectWithMessage("/price-profiles", "success", m.profileCreated);
  } catch (error) {
    if (inlineResponse) {
      const messages = await getActionMessages();
      return {
        ok: false,
        message: getErrorMessage(error, messages),
      } satisfies PriceProfileCreateResult;
    }

    await handleActionError("/price-profiles", error);
  }
}

export async function togglePriceProfileStatusAction(formData: FormData) {
  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const profileId = String(formData.get("profileId") || "").trim();

    if (!Types.ObjectId.isValid(profileId)) {
      throw new Error(m.invalidProfileId);
    }

    const profile = await PriceProfile.findById(profileId);

    if (!profile) {
      throw new Error(m.profileNotFound);
    }

    if (profile.type === "COST") {
      if (session.seller.role !== "ADMIN") {
        throw new Error(m.onlyAdminCanManageCostProfiles);
      }

      if (profile.isActive) {
        throw new Error(m.costProfileMustStayActive);
      }

      await PriceProfile.updateMany(
        {
          type: "COST",
          isActive: true,
        },
        {
          $set: {
            isActive: false,
          },
        },
      );

      profile.isActive = true;
      await profile.save();
    } else {
      const profileSellerId = profile.sellerId ? String(profile.sellerId) : "";
      const canManageSaleProfile =
        session.seller.role === "ADMIN" || profileSellerId === session.seller.id;

      if (!canManageSaleProfile) {
        throw new Error(m.profileNotFound);
      }

      profile.isActive = !profile.isActive;
      await profile.save();
    }

    revalidatePath("/price-profiles");
    revalidatePath("/orders/new");

    redirectWithMessage("/price-profiles", "success", m.profileStatusUpdated);
  } catch (error) {
    await handleActionError("/price-profiles", error);
  }
}

export async function clonePriceProfileAction(formData: FormData) {
  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const profileId = String(formData.get("profileId") || "").trim();

    if (!Types.ObjectId.isValid(profileId)) {
      throw new Error(m.invalidProfileId);
    }

    const profile = await PriceProfile.findById(profileId).lean();
    if (!profile) {
      throw new Error(m.profileNotFound);
    }

    if (profile.type === "COST" && session.seller.role !== "ADMIN") {
      throw new Error(m.onlyAdminCanManageCostProfiles);
    }

    if (profile.type === "SALE") {
      const ownerId = profile.sellerId ? String(profile.sellerId) : "";
      const canCloneSale = session.seller.role === "ADMIN" || ownerId === session.seller.id;

      if (!canCloneSale) {
        throw new Error(m.profileNotFound);
      }
    }

    if (!profile.items?.length) {
      throw new Error(m.priceRequired);
    }

    const now = new Date();
    const dateLabel = now.toISOString().slice(0, 10);
    const clonedName = `${profile.name} - ${dateLabel}`.slice(0, 140);

    await PriceProfile.create({
      name: clonedName,
      type: profile.type,
      sellerId:
        profile.type === "SALE"
          ? profile.sellerId ||
            (session.seller.role === "ADMIN"
              ? undefined
              : new Types.ObjectId(session.seller.id))
          : undefined,
      sellerName:
        profile.type === "SALE"
          ? profile.sellerName ||
            (session.seller.role === "ADMIN" ? "System" : session.seller.name)
          : undefined,
      effectiveFrom: now,
      notes: profile.notes || undefined,
      isActive: false,
      items: profile.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        pricePerKg: item.pricePerKg,
      })),
    });

    revalidatePath("/price-profiles");
    revalidatePath("/orders/new");
    revalidatePath("/products");

    redirectWithMessage("/price-profiles", "success", m.profileCloned);
  } catch (error) {
    await handleActionError("/price-profiles", error);
  }
}
