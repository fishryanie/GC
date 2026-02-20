'use server';

import { formatMessage, generateOrderCode, getActionMessages, handleActionError, redirectWithMessage } from 'lib/action-helpers';
import { connectToDatabase } from 'lib/mongodb';
import { CustomerOrderLink } from 'models/customer-order-link';
import { Customer } from 'models/customer';
import { Order } from 'models/order';
import { PriceProfile } from 'models/price-profile';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';

type OrderInputLine = {
  productId: string;
  weightKg: number;
};

function normalizePhone(value: string) {
  return value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, '');
}

function isValidToken(value: string) {
  return /^[A-Za-z0-9_-]{12,120}$/.test(value);
}

function buildPublicOrderPath(token: string) {
  const safeToken = encodeURIComponent(token);
  return `/o/${safeToken}`;
}

type PublicOrderLinkDoc = {
  _id: Types.ObjectId;
  token: string;
  sellerId: Types.ObjectId;
  sellerName: string;
  expiresAt: Date | string;
  isActive: boolean;
  saleProfile?: {
    profileId?: Types.ObjectId;
    profileName?: string;
    effectiveFrom?: Date | string;
    items?: Array<{
      productId: Types.ObjectId;
      productName: string;
      pricePerKg: number;
    }>;
  };
};

type ResolvedSaleProfileSnapshot = {
  profileId: Types.ObjectId;
  profileName: string;
  effectiveFrom: Date;
  items: Array<{
    productId: Types.ObjectId;
    productName: string;
    pricePerKg: number;
  }>;
  needsBackfill: boolean;
};

async function getValidatedPublicOrderLink(token: string, messages: Awaited<ReturnType<typeof getActionMessages>>) {
  const link = (await CustomerOrderLink.findOne({ token }).lean()) as PublicOrderLinkDoc | null;

  if (!link) {
    throw new Error(messages.orderLinkNotFound);
  }

  if (!link.isActive) {
    throw new Error(messages.orderLinkDisabled);
  }

  if (new Date(link.expiresAt).getTime() <= Date.now()) {
    throw new Error(messages.orderLinkExpired);
  }

  return link;
}

async function resolveSaleProfileSnapshot(
  link: PublicOrderLinkDoc,
  messages: Awaited<ReturnType<typeof getActionMessages>>,
): Promise<ResolvedSaleProfileSnapshot> {
  const fallbackProfileId = link.saleProfile?.profileId;
  const linkItems = (link.saleProfile?.items ?? []).filter(item => Number(item.pricePerKg) > 0);
  const linkEffectiveFromRaw = link.saleProfile?.effectiveFrom;
  const linkEffectiveFrom = linkEffectiveFromRaw ? new Date(linkEffectiveFromRaw) : null;
  const linkProfileName = (link.saleProfile?.profileName || '').trim();

  const hasInlineSnapshot = linkItems.length > 0 && linkEffectiveFrom && !Number.isNaN(linkEffectiveFrom.getTime()) && fallbackProfileId;

  if (hasInlineSnapshot) {
    return {
      profileId: fallbackProfileId,
      profileName: linkProfileName || 'Sale profile',
      effectiveFrom: linkEffectiveFrom,
      items: linkItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        pricePerKg: item.pricePerKg,
      })),
      needsBackfill: false,
    };
  }

  if (!fallbackProfileId) {
    throw new Error(messages.publicOrderSaleProfileInvalid);
  }

  const profile = await PriceProfile.findOne({
    _id: fallbackProfileId,
    type: 'SALE',
  }).lean();

  if (!profile || !profile.items?.length) {
    throw new Error(messages.publicOrderSaleProfileInvalid);
  }

  return {
    profileId: profile._id,
    profileName: profile.name,
    effectiveFrom: new Date(profile.effectiveFrom),
    items: profile.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      pricePerKg: item.pricePerKg,
    })),
    needsBackfill: true,
  };
}

export async function startPublicOrderCustomerSessionAction(formData: FormData) {
  const token = String(formData.get('token') || '').trim();
  const fallbackPath = isValidToken(token) ? buildPublicOrderPath(token) : '/';

  try {
    await connectToDatabase();
    const m = await getActionMessages();

    if (!isValidToken(token)) {
      throw new Error(m.orderLinkNotFound);
    }

    const phoneRaw = String(formData.get('phone') || '');
    const phone = normalizePhone(phoneRaw);

    if (!phone) {
      throw new Error(m.publicOrderPhoneRequired);
    }

    const link = await getValidatedPublicOrderLink(token, m);
    await resolveSaleProfileSnapshot(link, m);

    let customer = await Customer.findOne({ phone }).sort({ createdAt: -1 }).lean();

    if (!customer) {
      customer = await Customer.create({
        name: formatMessage(m.publicOrderAutoCustomerName, { phone }),
        phone,
        isActive: true,
      });
    } else if (!customer.isActive) {
      await Customer.findByIdAndUpdate(customer._id, {
        $set: {
          isActive: true,
        },
      });
    }

    redirectWithMessage(`${buildPublicOrderPath(token)}?customerId=${String(customer._id)}`, 'success', m.publicOrderCustomerReady);
  } catch (error) {
    await handleActionError(fallbackPath, error);
  }
}

export async function submitPublicOrderAction(formData: FormData) {
  const token = String(formData.get('token') || '').trim();
  const fallbackPath = isValidToken(token) ? buildPublicOrderPath(token) : '/';

  try {
    await connectToDatabase();
    const m = await getActionMessages();

    if (!isValidToken(token)) {
      throw new Error(m.orderLinkNotFound);
    }

    const customerId = String(formData.get('customerId') || '').trim();
    const deliveryDate = String(formData.get('deliveryDate') || '').trim();
    const itemsJson = String(formData.get('itemsJson') || '[]');

    if (!Types.ObjectId.isValid(customerId)) {
      throw new Error(m.invalidCustomerId);
    }

    if (!deliveryDate) {
      throw new Error(m.deliveryDateRequired);
    }

    let parsedItems: OrderInputLine[] = [];
    try {
      parsedItems = JSON.parse(itemsJson) as OrderInputLine[];
    } catch {
      throw new Error(m.cartEmpty);
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      throw new Error(m.cartEmpty);
    }

    const [link, customer, costProfile] = await Promise.all([
      getValidatedPublicOrderLink(token, m),
      Customer.findOne({
        _id: new Types.ObjectId(customerId),
        isActive: true,
      }).lean(),
      PriceProfile.findOne({
        type: 'COST',
        isActive: true,
      })
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .lean(),
    ]);

    if (!customer) {
      throw new Error(m.customerNotFound);
    }

    if (!costProfile || costProfile.type !== 'COST') {
      throw new Error(m.invalidCostProfile);
    }

    const resolvedSaleProfile = await resolveSaleProfileSnapshot(link, m);
    const saleItems = resolvedSaleProfile.items;

    const salePriceMap = new Map(
      saleItems.map(item => [
        String(item.productId),
        {
          productName: item.productName,
          pricePerKg: Number(item.pricePerKg || 0),
        },
      ]),
    );
    const costPriceMap = new Map(costProfile.items.map(item => [String(item.productId), Number(item.pricePerKg || 0)]));

    const groupedItems = parsedItems.reduce<Map<string, number>>((accumulator, item) => {
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

    if (!normalizedItems.length) {
      throw new Error(m.cartWeightInvalid);
    }

    let totalWeightKg = 0;
    let totalCostAmount = 0;
    let totalSaleAmount = 0;

    const orderLines = normalizedItems.map(item => {
      const saleItem = salePriceMap.get(item.productId);
      const costPricePerKg = costPriceMap.get(item.productId);

      if (!saleItem) {
        throw new Error(m.publicOrderItemInvalid);
      }

      if (costPricePerKg === undefined) {
        throw new Error(formatMessage(m.missingPriceForProduct, { name: saleItem.productName }));
      }

      const salePricePerKg = saleItem.pricePerKg;
      const lineCostTotal = item.weightKg * costPricePerKg;
      const lineSaleTotal = item.weightKg * salePricePerKg;

      totalWeightKg += item.weightKg;
      totalCostAmount += lineCostTotal;
      totalSaleAmount += lineSaleTotal;

      return {
        productId: new Types.ObjectId(item.productId),
        productName: saleItem.productName,
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

    await Order.create({
      code,
      buyerName: customer.name,
      customerId: customer._id,
      customerName: customer.name,
      sellerId: link.sellerId,
      sellerName: link.sellerName,
      deliveryDate: new Date(deliveryDate),
      fulfillmentStatus: 'PENDING_APPROVAL',
      approval: {
        requiresAdminApproval: true,
        status: 'PENDING',
        requestedAt: orderTime,
      },
      supplierPaymentStatus: 'UNPAID_SUPPLIER',
      collectionStatus: 'UNPAID',
      costProfile: {
        profileId: costProfile._id,
        profileName: costProfile.name,
        effectiveFrom: costProfile.effectiveFrom,
      },
      saleProfile: {
        profileId: resolvedSaleProfile.profileId,
        profileName: resolvedSaleProfile.profileName,
        effectiveFrom: resolvedSaleProfile.effectiveFrom,
      },
      discountRequest: {
        status: 'NONE',
        requestedPercent: 0,
        requestedAmount: 0,
        requestedSaleAmount: totalSaleAmount,
      },
      items: orderLines,
      totalWeightKg,
      totalCostAmount,
      baseSaleAmount: totalSaleAmount,
      totalSaleAmount,
      totalProfitAmount: totalSaleAmount - totalCostAmount,
    });

    const linkUpdatePayload: Record<string, unknown> = {
      lastUsedAt: orderTime,
    };

    if (resolvedSaleProfile.needsBackfill) {
      linkUpdatePayload.saleProfile = {
        profileId: resolvedSaleProfile.profileId,
        profileName: resolvedSaleProfile.profileName,
        effectiveFrom: resolvedSaleProfile.effectiveFrom,
        items: resolvedSaleProfile.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          pricePerKg: item.pricePerKg,
        })),
      };
    }

    await CustomerOrderLink.findByIdAndUpdate(link._id, {
      $inc: { usageCount: 1 },
      $set: linkUpdatePayload,
    });

    revalidatePath('/orders');
    revalidatePath('/dashboard');
    revalidatePath('/customers');
    revalidatePath('/order-links');

    redirectWithMessage(`${buildPublicOrderPath(token)}?customerId=${String(customer._id)}`, 'success', m.orderCreatedPendingApproval);
  } catch (error) {
    await handleActionError(fallbackPath, error);
  }
}
