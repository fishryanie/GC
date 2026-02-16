'use server';

import { formatMessage, getActionMessages, handleActionError, redirectWithMessage, revalidateCorePaths, roundToThousand } from 'lib/action-helpers';
import { requireAdminSession } from 'lib/auth';
import { INITIAL_PRODUCTS } from 'lib/constants';
import { connectToDatabase } from 'lib/mongodb';
import { PriceProfile } from 'models/price-profile';
import { Product } from 'models/product';
import { Types } from 'mongoose';

export async function seedInitialDataAction() {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();
    const m = await getActionMessages();

    for (const item of INITIAL_PRODUCTS) {
      await Product.findOneAndUpdate(
        { name: item.name },
        {
          $setOnInsert: {
            name: item.name,
            unit: 'kg',
            isActive: true,
          },
        },
        { upsert: true, new: true },
      );
    }

    const products = await Product.find().lean();
    const productByName = new Map(products.map(product => [product.name, product]));

    const hasCostProfile = await PriceProfile.exists({ type: 'COST' });
    if (!hasCostProfile) {
      await PriceProfile.create({
        name: 'Default Cost Price',
        type: 'COST',
        effectiveFrom: new Date(),
        isActive: true,
        notes: 'Auto-generated from initial seed data',
        items: INITIAL_PRODUCTS.map(item => {
          const product = productByName.get(item.name);

          if (!product) {
            throw new Error(formatMessage(m.productNotFoundByName, { name: item.name }));
          }

          return {
            productId: product._id,
            productName: product.name,
            pricePerKg: item.defaultCost,
          };
        }),
      });
    }

    const hasSaleProfile = await PriceProfile.exists({ type: 'SALE' });
    if (!hasSaleProfile) {
      await PriceProfile.create({
        name: 'Reference Sale Price',
        type: 'SALE',
        sellerId: new Types.ObjectId(session.seller.id),
        sellerName: session.seller.name,
        effectiveFrom: new Date(),
        isActive: true,
        notes: 'Auto-generated: cost + 20%',
        items: INITIAL_PRODUCTS.map(item => {
          const product = productByName.get(item.name);

          if (!product) {
            throw new Error(formatMessage(m.productNotFoundByName, { name: item.name }));
          }

          return {
            productId: product._id,
            productName: product.name,
            pricePerKg: roundToThousand(item.defaultCost * 1.2),
          };
        }),
      });
    }

    revalidateCorePaths();

    redirectWithMessage('/dashboard', 'success', m.seeded);
  } catch (error) {
    await handleActionError('/dashboard', error);
  }
}
