'use server';

import { getActionMessages, handleActionError, redirectWithMessage } from 'lib/action-helpers';
import { requireAuthSession } from 'lib/auth';
import { connectToDatabase } from 'lib/mongodb';
import { CustomerOrderLink } from 'models/customer-order-link';
import { PriceProfile } from 'models/price-profile';
import { Seller } from 'models/seller';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'node:crypto';

const MIN_LINK_DURATION_MINUTES = 5;
const MAX_LINK_DURATION_DAYS = 60;

async function generateUniqueLinkToken() {
  for (let index = 0; index < 6; index += 1) {
    const token = randomBytes(18).toString('base64url');
    const exists = await CustomerOrderLink.exists({ token });

    if (!exists) {
      return token;
    }
  }

  return `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}`;
}

function buildSaleProfileOwnershipClause(targetSellerId: Types.ObjectId) {
  return [{ sellerId: targetSellerId }, { sellerId: { $exists: false } }, { sellerId: null }];
}

export async function createCustomerOrderLinkAction(formData: FormData) {
  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const requestedSellerId = String(formData.get('sellerId') || '').trim();
    const saleProfileId = String(formData.get('saleProfileId') || '').trim();
    const expiresAtRaw = String(formData.get('expiresAt') || '').trim();

    if (!saleProfileId || !Types.ObjectId.isValid(saleProfileId)) {
      throw new Error(m.invalidPriceProfile);
    }

    if (!expiresAtRaw) {
      throw new Error(m.orderLinkExpiryRequired);
    }

    const expiresAt = new Date(expiresAtRaw);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new Error(m.orderLinkExpiryInvalid);
    }

    const now = new Date();
    const minAllowed = new Date(now.getTime() + MIN_LINK_DURATION_MINUTES * 60 * 1000);
    const maxAllowed = new Date(now.getTime() + MAX_LINK_DURATION_DAYS * 24 * 60 * 60 * 1000);

    if (expiresAt.getTime() < minAllowed.getTime()) {
      throw new Error(m.orderLinkExpiryTooSoon);
    }

    if (expiresAt.getTime() > maxAllowed.getTime()) {
      throw new Error(m.orderLinkExpiryTooFar);
    }

    const targetSellerId =
      session.seller.role === 'ADMIN' && requestedSellerId && Types.ObjectId.isValid(requestedSellerId)
        ? new Types.ObjectId(requestedSellerId)
        : new Types.ObjectId(session.seller.id);

    const targetSeller = await Seller.findOne({
      _id: targetSellerId,
      isEnabled: true,
    }).lean();

    if (!targetSeller) {
      throw new Error(m.orderLinkSellerNotFound);
    }

    const saleProfile = await PriceProfile.findOne({
      _id: new Types.ObjectId(saleProfileId),
      type: 'SALE',
      isActive: true,
      $or: buildSaleProfileOwnershipClause(targetSellerId),
    }).lean();

    if (!saleProfile) {
      throw new Error(m.orderLinkSaleProfileNotFound);
    }

    const token = await generateUniqueLinkToken();

    // Keep a single active public order link per seller to match the short-lived share flow.
    await CustomerOrderLink.updateMany(
      {
        sellerId: targetSeller._id,
        isActive: true,
        expiresAt: { $gt: now },
      },
      {
        $set: {
          isActive: false,
        },
      },
    );

    await CustomerOrderLink.create({
      token,
      sellerId: targetSeller._id,
      sellerName: targetSeller.name,
      saleProfile: {
        profileId: saleProfile._id,
        profileName: saleProfile.name,
        effectiveFrom: saleProfile.effectiveFrom,
        items: (saleProfile.items ?? []).map(item => ({
          productId: item.productId,
          productName: item.productName,
          pricePerKg: item.pricePerKg,
        })),
      },
      expiresAt,
      isActive: true,
      createdBySellerId: new Types.ObjectId(session.seller.id),
      createdBySellerName: session.seller.name,
    });

    revalidatePath('/order-links');

    redirectWithMessage('/order-links', 'success', m.orderLinkCreated);
  } catch (error) {
    await handleActionError('/order-links', error);
  }
}

export async function toggleCustomerOrderLinkStatusAction(formData: FormData) {
  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const linkId = String(formData.get('linkId') || '').trim();

    if (!Types.ObjectId.isValid(linkId)) {
      throw new Error(m.orderLinkNotFound);
    }

    const link = await CustomerOrderLink.findById(linkId);

    if (!link) {
      throw new Error(m.orderLinkNotFound);
    }

    const canManage = session.seller.role === 'ADMIN' || String(link.sellerId) === session.seller.id;

    if (!canManage) {
      throw new Error(m.orderLinkAccessDenied);
    }

    link.isActive = !link.isActive;
    await link.save();

    revalidatePath('/order-links');

    redirectWithMessage('/order-links', 'success', m.orderLinkStatusUpdated);
  } catch (error) {
    await handleActionError('/order-links', error);
  }
}
