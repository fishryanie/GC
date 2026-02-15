"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import {
  COLLECTION_STATUSES,
  ORDER_FULFILLMENT_STATUSES,
  SUPPLIER_PAYMENT_STATUSES,
} from "@/lib/constants";
import {
  requireAdminSession,
  requireAuthSession,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { parseNumber } from "@/lib/format";
import { Customer } from "@/models/customer";
import { Order } from "@/models/order";
import { PriceProfile } from "@/models/price-profile";
import { Product } from "@/models/product";
import {
  formatMessage,
  generateOrderCode,
  getActionMessages,
  handleActionError,
  redirectWithMessage,
} from "@/lib/action-helpers";

type OrderInputLine = {
  productId: string;
  weightKg: number;
};

const ORDER_APPROVAL_DECISIONS = [
  "APPROVE_ORDER",
  "APPROVE_WITH_DISCOUNT",
  "APPROVE_WITHOUT_DISCOUNT",
  "REJECT_ORDER",
] as const;

type OrderApprovalDecision = (typeof ORDER_APPROVAL_DECISIONS)[number];

export async function createOrderAction(formData: FormData) {
  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const customerId = String(formData.get("customerId") || "").trim();
    const deliveryDate = String(formData.get("deliveryDate") || "").trim();
    const saleProfileId = String(formData.get("saleProfileId") || "").trim();
    const itemsJson = String(formData.get("itemsJson") || "[]");
    const requestedDiscountPercentRaw = parseNumber(formData.get("requestedDiscountPercent"));
    const discountReason = String(formData.get("discountReason") || "").trim();
    const requestedDiscountPercent = Number(requestedDiscountPercentRaw.toFixed(2));

    if (!Number.isFinite(requestedDiscountPercent) || requestedDiscountPercent < 0 || requestedDiscountPercent > 90) {
      throw new Error(m.invalidDiscountPercent);
    }

    if (requestedDiscountPercent > 0 && !discountReason) {
      throw new Error(m.discountReasonRequired);
    }

    if (!Types.ObjectId.isValid(customerId)) {
      throw new Error(m.invalidCustomerId);
    }

    if (!deliveryDate) {
      throw new Error(m.deliveryDateRequired);
    }

    if (!Types.ObjectId.isValid(saleProfileId)) {
      throw new Error(m.invalidPriceProfile);
    }

    const customer = await Customer.findById(customerId).lean();
    if (!customer || !customer.isActive) {
      throw new Error(m.customerNotFound);
    }

    let rawItems: OrderInputLine[] = [];
    try {
      rawItems = JSON.parse(itemsJson) as OrderInputLine[];
    } catch {
      throw new Error(m.cartEmpty);
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new Error(m.cartEmpty);
    }

    const groupedItems = rawItems.reduce<Map<string, number>>((accumulator, item) => {
      if (!Types.ObjectId.isValid(item.productId)) {
        return accumulator;
      }

      const weightKg = Number(item.weightKg);
      if (!Number.isFinite(weightKg) || weightKg <= 0) {
        return accumulator;
      }

      const currentWeight = accumulator.get(item.productId) ?? 0;
      accumulator.set(item.productId, currentWeight + weightKg);
      return accumulator;
    }, new Map());

    const normalizedItems = Array.from(groupedItems.entries()).map(([productId, weightKg]) => ({
      productId,
      weightKg: Number(weightKg.toFixed(3)),
    }));

    if (normalizedItems.length === 0) {
      throw new Error(m.cartWeightInvalid);
    }

    const productIds = normalizedItems.map((item) => new Types.ObjectId(item.productId));
    const saleProfileQuery: Record<string, unknown> = {
      _id: new Types.ObjectId(saleProfileId),
      type: "SALE",
      isActive: true,
    };

    if (session.seller.role !== "ADMIN") {
      saleProfileQuery.$or = [
        { sellerId: new Types.ObjectId(session.seller.id) },
        { sellerId: { $exists: false } },
        { sellerId: null },
      ];
    }

    const [products, costProfile, saleProfile] = await Promise.all([
      Product.find({ _id: { $in: productIds } }).lean(),
      PriceProfile.findOne({
        type: "COST",
        isActive: true,
      })
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .lean(),
      PriceProfile.findOne(saleProfileQuery).lean(),
    ]);

    if (!costProfile || costProfile.type !== "COST") {
      throw new Error(m.invalidCostProfile);
    }

    if (!saleProfile || saleProfile.type !== "SALE") {
      throw new Error(m.invalidSaleProfile);
    }

    const isSystemSaleProfile = !saleProfile.sellerId;
    if (
      session.seller.role !== "ADMIN" &&
      requestedDiscountPercent > 0 &&
      !isSystemSaleProfile
    ) {
      throw new Error(m.discountRequiresSystemProfile);
    }

    const productMap = new Map(products.map((item) => [String(item._id), item]));
    const costPriceMap = new Map(costProfile.items.map((item) => [String(item.productId), item.pricePerKg]));
    const salePriceMap = new Map(saleProfile.items.map((item) => [String(item.productId), item.pricePerKg]));

    let totalWeightKg = 0;
    let totalCostAmount = 0;
    let baseSaleAmount = 0;

    const baseLines = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      const costPricePerKg = costPriceMap.get(item.productId);
      const salePricePerKg = salePriceMap.get(item.productId);

      if (!product) {
        throw new Error(m.cartProductMissing);
      }

      if (costPricePerKg === undefined || salePricePerKg === undefined) {
        throw new Error(formatMessage(m.missingPriceForProduct, { name: product.name }));
      }

      const lineCostTotal = item.weightKg * costPricePerKg;
      const lineSaleTotal = item.weightKg * salePricePerKg;

      totalWeightKg += item.weightKg;
      totalCostAmount += lineCostTotal;
      baseSaleAmount += lineSaleTotal;

      return {
        productId: product._id,
        productName: product.name,
        weightKg: item.weightKg,
        costPricePerKg,
        salePricePerKg,
        baseSalePricePerKg: salePricePerKg,
        lineCostTotal,
        lineSaleTotal,
        baseLineSaleTotal: lineSaleTotal,
        lineProfit: lineSaleTotal - lineCostTotal,
      };
    });

    const code = await generateOrderCode();
    const orderTime = new Date();
    const requestedSaleAmount = Math.max(
      0,
      Math.round(baseSaleAmount * (1 - requestedDiscountPercent / 100)),
    );
    const requestedDiscountAmount = Math.max(
      0,
      Math.round(baseSaleAmount - requestedSaleAmount),
    );
    const requiresAdminApproval = session.seller.role !== "ADMIN";
    const shouldApplyDiscountImmediately =
      session.seller.role === "ADMIN" && requestedDiscountPercent > 0;

    const finalLines = shouldApplyDiscountImmediately
      ? (() => {
          const ratio = baseSaleAmount > 0 ? requestedSaleAmount / baseSaleAmount : 1;
          return baseLines.map((line) => {
            const salePricePerKg = Math.round(line.baseSalePricePerKg * ratio);
            const lineSaleTotal = Math.round(line.baseLineSaleTotal * ratio);

            return {
              ...line,
              salePricePerKg,
              lineSaleTotal,
              lineProfit: lineSaleTotal - line.lineCostTotal,
            };
          });
        })()
      : baseLines;

    const finalSaleAmount = finalLines.reduce(
      (sum, line) => sum + line.lineSaleTotal,
      0,
    );
    const finalProfitAmount = finalSaleAmount - totalCostAmount;

    await Order.create({
      code,
      buyerName: customer.name,
      customerId: customer._id,
      customerName: customer.name,
      sellerId: new Types.ObjectId(session.seller.id),
      sellerName: session.seller.name,
      deliveryDate: new Date(deliveryDate),
      fulfillmentStatus: requiresAdminApproval ? "PENDING_APPROVAL" : "CONFIRMED",
      approval: {
        requiresAdminApproval,
        status: requiresAdminApproval ? "PENDING" : "APPROVED",
        requestedAt: orderTime,
        reviewedAt: requiresAdminApproval ? undefined : orderTime,
        reviewedBySellerId: requiresAdminApproval ? undefined : new Types.ObjectId(session.seller.id),
        reviewedBySellerName: requiresAdminApproval ? undefined : session.seller.name,
      },
      supplierPaymentStatus: "UNPAID_SUPPLIER",
      collectionStatus: "UNPAID",
      costProfile: {
        profileId: costProfile._id,
        profileName: costProfile.name,
        effectiveFrom: costProfile.effectiveFrom,
      },
      saleProfile: {
        profileId: saleProfile._id,
        profileName: saleProfile.name,
        effectiveFrom: saleProfile.effectiveFrom,
      },
      discountRequest: {
        status:
          requestedDiscountPercent > 0
            ? requiresAdminApproval
              ? "PENDING"
              : "APPROVED"
            : "NONE",
        requestedPercent: requestedDiscountPercent,
        requestedAmount: requestedDiscountAmount,
        requestedSaleAmount: requestedDiscountPercent > 0 ? requestedSaleAmount : baseSaleAmount,
        reason: requestedDiscountPercent > 0 ? discountReason : undefined,
        reviewedAt:
          requestedDiscountPercent > 0 && !requiresAdminApproval ? orderTime : undefined,
        reviewedBySellerId:
          requestedDiscountPercent > 0 && !requiresAdminApproval
            ? new Types.ObjectId(session.seller.id)
            : undefined,
        reviewedBySellerName:
          requestedDiscountPercent > 0 && !requiresAdminApproval
            ? session.seller.name
            : undefined,
      },
      items: finalLines,
      totalWeightKg,
      totalCostAmount,
      baseSaleAmount,
      totalSaleAmount: finalSaleAmount,
      totalProfitAmount: finalProfitAmount,
    });

    if (!requiresAdminApproval) {
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: {
          orderCount: 1,
          totalSpentAmount: finalSaleAmount,
        },
        $set: {
          lastOrderAt: orderTime,
        },
      });
    }

    revalidatePath("/orders");
    revalidatePath("/orders/new");
    revalidatePath("/dashboard");
    revalidatePath("/customers");

    redirectWithMessage(
      "/orders",
      "success",
      requiresAdminApproval ? m.orderCreatedPendingApproval : m.orderCreated,
    );
  } catch (error) {
    await handleActionError("/orders/new", error);
  }
}

export async function updateOrderStatusesAction(formData: FormData) {
  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    if (session.seller.role !== "ADMIN") {
      throw new Error(m.onlyAdminCanUpdateOrderStatuses);
    }

    const orderId = String(formData.get("orderId") || "").trim();
    const returnToRaw = String(formData.get("returnTo") || "").trim();
    const returnTo = returnToRaw.startsWith("/orders") ? returnToRaw : "/orders";
    const fulfillmentStatus = String(formData.get("fulfillmentStatus") || "").trim();
    const supplierPaymentStatus = String(formData.get("supplierPaymentStatus") || "").trim();
    const collectionStatus = String(formData.get("collectionStatus") || "").trim();

    if (!Types.ObjectId.isValid(orderId)) {
      throw new Error(m.invalidOrderId);
    }

    if (
      !ORDER_FULFILLMENT_STATUSES.includes(
        fulfillmentStatus as (typeof ORDER_FULFILLMENT_STATUSES)[number],
      )
    ) {
      throw new Error(m.invalidFulfillmentStatus);
    }

    if (
      !SUPPLIER_PAYMENT_STATUSES.includes(
        supplierPaymentStatus as (typeof SUPPLIER_PAYMENT_STATUSES)[number],
      )
    ) {
      throw new Error(m.invalidCapitalStatus);
    }

    if (!COLLECTION_STATUSES.includes(collectionStatus as (typeof COLLECTION_STATUSES)[number])) {
      throw new Error(m.invalidCollectionStatus);
    }

    if (fulfillmentStatus === "PENDING_APPROVAL") {
      throw new Error(m.invalidFulfillmentStatus);
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new Error(m.orderNotFound);
    }

    if (order.fulfillmentStatus === "PENDING_APPROVAL" || order.approval?.status === "PENDING") {
      throw new Error(m.orderPendingApprovalLocked);
    }

    await Order.findByIdAndUpdate(orderId, {
      fulfillmentStatus,
      supplierPaymentStatus,
      collectionStatus,
    });

    revalidatePath("/orders");
    revalidatePath("/dashboard");

    redirectWithMessage(returnTo || "/orders", "success", m.orderStatusesUpdated);
  } catch (error) {
    await handleActionError("/orders", error);
  }
}

export async function reviewOrderApprovalAction(formData: FormData) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const orderId = String(formData.get("orderId") || "").trim();
    const returnToRaw = String(formData.get("returnTo") || "").trim();
    const returnTo = returnToRaw.startsWith("/orders") ? returnToRaw : "/orders";
    const decision = String(formData.get("decision") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!Types.ObjectId.isValid(orderId)) {
      throw new Error(m.invalidOrderId);
    }

    if (
      !ORDER_APPROVAL_DECISIONS.includes(
        decision as OrderApprovalDecision,
      )
    ) {
      throw new Error(m.invalidOrderApprovalDecision);
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      throw new Error(m.orderNotFound);
    }

    if (order.fulfillmentStatus !== "PENDING_APPROVAL" || order.approval?.status !== "PENDING") {
      throw new Error(m.orderAlreadyReviewed);
    }

    const hasDiscountRequest =
      order.discountRequest?.status === "PENDING" &&
      (order.discountRequest?.requestedPercent ?? 0) > 0;

    if (decision === "APPROVE_ORDER" && hasDiscountRequest) {
      throw new Error(m.discountDecisionRequired);
    }

    if (
      (decision === "APPROVE_WITH_DISCOUNT" || decision === "APPROVE_WITHOUT_DISCOUNT") &&
      !hasDiscountRequest
    ) {
      throw new Error(m.discountRequestNotFound);
    }

    const now = new Date();
    const baseSaleAmount = order.baseSaleAmount ?? order.totalSaleAmount;
    const orderLines = (order.items ?? []) as Array<{
      productId: Types.ObjectId;
      productName: string;
      weightKg: number;
      costPricePerKg: number;
      salePricePerKg: number;
      baseSalePricePerKg?: number;
      lineCostTotal: number;
      lineSaleTotal: number;
      baseLineSaleTotal?: number;
      lineProfit: number;
    }>;

    let nextFulfillmentStatus: (typeof ORDER_FULFILLMENT_STATUSES)[number] =
      order.fulfillmentStatus;
    let nextApprovalStatus: "APPROVED" | "REJECTED" = "APPROVED";
    let nextSaleAmount = order.totalSaleAmount;
    let nextDiscountStatus =
      (order.discountRequest?.status as "NONE" | "PENDING" | "APPROVED" | "REJECTED" | undefined) ??
      "NONE";
    let nextLines = orderLines;
    let successMessage = m.orderApproved;

    if (decision === "REJECT_ORDER") {
      nextFulfillmentStatus = "CANCELED";
      nextApprovalStatus = "REJECTED";
      nextDiscountStatus = hasDiscountRequest ? "REJECTED" : nextDiscountStatus;
      successMessage = m.orderRejected;
    } else if (decision === "APPROVE_WITH_DISCOUNT") {
      const requestedSaleAmount = Math.max(
        0,
        Math.round(order.discountRequest?.requestedSaleAmount ?? baseSaleAmount),
      );
      const ratio = baseSaleAmount > 0 ? requestedSaleAmount / baseSaleAmount : 1;

      nextLines = orderLines.map((line) => {
        const baseSalePricePerKg = line.baseSalePricePerKg ?? line.salePricePerKg;
        const baseLineSaleTotal = line.baseLineSaleTotal ?? line.lineSaleTotal;
        const salePricePerKg = Math.round(baseSalePricePerKg * ratio);
        const lineSaleTotal = Math.round(baseLineSaleTotal * ratio);

        return {
          ...line,
          salePricePerKg,
          baseSalePricePerKg,
          lineSaleTotal,
          baseLineSaleTotal,
          lineProfit: lineSaleTotal - line.lineCostTotal,
        };
      });

      nextSaleAmount = nextLines.reduce((sum, line) => sum + line.lineSaleTotal, 0);
      nextDiscountStatus = "APPROVED";
      nextFulfillmentStatus = "CONFIRMED";
      successMessage = m.orderApprovedWithDiscount;
    } else if (decision === "APPROVE_WITHOUT_DISCOUNT") {
      nextLines = orderLines.map((line) => {
        const baseSalePricePerKg = line.baseSalePricePerKg ?? line.salePricePerKg;
        const baseLineSaleTotal = line.baseLineSaleTotal ?? line.lineSaleTotal;
        return {
          ...line,
          salePricePerKg: baseSalePricePerKg,
          baseSalePricePerKg,
          lineSaleTotal: baseLineSaleTotal,
          baseLineSaleTotal,
          lineProfit: baseLineSaleTotal - line.lineCostTotal,
        };
      });
      nextSaleAmount = nextLines.reduce((sum, line) => sum + line.lineSaleTotal, 0);
      nextDiscountStatus = "REJECTED";
      nextFulfillmentStatus = "CONFIRMED";
      successMessage = m.orderApprovedWithoutDiscount;
    } else {
      nextFulfillmentStatus = "CONFIRMED";
      nextDiscountStatus = hasDiscountRequest ? "APPROVED" : nextDiscountStatus;
      successMessage = m.orderApproved;
    }

    const nextProfitAmount =
      nextFulfillmentStatus === "CANCELED" ? order.totalProfitAmount : nextSaleAmount - order.totalCostAmount;

    await Order.findByIdAndUpdate(orderId, {
      fulfillmentStatus: nextFulfillmentStatus,
      items: nextLines,
      totalSaleAmount: nextSaleAmount,
      totalProfitAmount: nextProfitAmount,
      approval: {
        ...order.approval,
        requiresAdminApproval: true,
        status: nextApprovalStatus,
        requestedAt: order.approval?.requestedAt || order.createdAt,
        reviewedAt: now,
        reviewedBySellerId: new Types.ObjectId(session.seller.id),
        reviewedBySellerName: session.seller.name,
        note: note || undefined,
      },
      discountRequest: {
        ...order.discountRequest,
        status: nextDiscountStatus,
        reviewedAt: hasDiscountRequest ? now : order.discountRequest?.reviewedAt,
        reviewedBySellerId: hasDiscountRequest
          ? new Types.ObjectId(session.seller.id)
          : order.discountRequest?.reviewedBySellerId,
        reviewedBySellerName: hasDiscountRequest
          ? session.seller.name
          : order.discountRequest?.reviewedBySellerName,
        reviewNote: hasDiscountRequest ? note || undefined : order.discountRequest?.reviewNote,
      },
    });

    if (nextFulfillmentStatus === "CONFIRMED" && nextApprovalStatus === "APPROVED") {
      await Customer.findByIdAndUpdate(order.customerId, {
        $inc: {
          orderCount: 1,
          totalSpentAmount: nextSaleAmount,
        },
        $set: {
          lastOrderAt: now,
        },
      });
    }

    revalidatePath("/orders");
    revalidatePath("/orders/new");
    revalidatePath("/dashboard");
    revalidatePath("/customers");

    redirectWithMessage(returnTo || "/orders", "success", successMessage);
  } catch (error) {
    await handleActionError("/orders", error);
  }
}
