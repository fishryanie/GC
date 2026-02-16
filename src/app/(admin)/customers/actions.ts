'use server';

import { getActionMessages, handleActionError, redirectWithMessage } from 'lib/action-helpers';
import { hashPassword, normalizeEmail, requireAdminSession, requireAuthSession } from 'lib/auth';
import { connectToDatabase } from 'lib/mongodb';
import { Customer } from 'models/customer';
import { Seller } from 'models/seller';
import { SellerSession } from 'models/seller-session';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';

export async function upsertCustomerAction(formData: FormData) {
  try {
    await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const id = String(formData.get('id') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const email = normalizeEmail(String(formData.get('email') || ''));
    const notes = String(formData.get('notes') || '')
      .trim()
      .slice(0, 500);

    if (!name) {
      throw new Error(m.customerNameRequired);
    }

    if (!phone) {
      throw new Error(m.customerPhoneRequired);
    }

    const payload = {
      name,
      phone,
      email,
      notes,
    };

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(m.invalidCustomerId);
      }

      const customer = await Customer.findById(id);
      if (!customer) {
        throw new Error(m.customerNotFound);
      }

      await Customer.findByIdAndUpdate(id, { $set: payload }, { runValidators: true });

      revalidatePath('/customers');
      revalidatePath('/orders/new');
      redirectWithMessage('/customers?tab=customers', 'success', m.customerUpdated);
    }

    await Customer.create({
      ...payload,
      isActive: true,
    });

    revalidatePath('/customers');
    revalidatePath('/orders/new');

    redirectWithMessage('/customers?tab=customers', 'success', m.customerCreated);
  } catch (error) {
    await handleActionError('/customers?tab=customers', error);
  }
}

export async function toggleCustomerStatusAction(formData: FormData) {
  try {
    await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const customerId = String(formData.get('customerId') || '').trim();

    if (!Types.ObjectId.isValid(customerId)) {
      throw new Error(m.invalidCustomerId);
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error(m.customerNotFound);
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    revalidatePath('/customers');
    revalidatePath('/orders/new');

    redirectWithMessage('/customers?tab=customers', 'success', m.customerStatusUpdated);
  } catch (error) {
    await handleActionError('/customers?tab=customers', error);
  }
}

export async function upsertSellerAction(formData: FormData) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const id = String(formData.get('id') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const email = normalizeEmail(String(formData.get('email') || ''));
    const password = String(formData.get('password') || '');
    const role = String(formData.get('role') || 'SELLER').trim();

    if (!name) {
      throw new Error(m.sellerNameRequired);
    }

    if (!email) {
      throw new Error(m.sellerEmailRequired);
    }

    if (role !== 'SELLER' && role !== 'ADMIN') {
      throw new Error(m.invalidSellerRole);
    }

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(m.invalidSellerId);
      }

      const seller = await Seller.findById(id);
      if (!seller) {
        throw new Error(m.sellerNotFound);
      }

      const updatePayload: Record<string, unknown> = {
        name,
        email,
        role,
      };

      if (password) {
        if (password.length < 8) {
          throw new Error(m.sellerPasswordRequired);
        }

        updatePayload.passwordHash = await hashPassword(password);
        updatePayload.mustChangePassword = true;
        updatePayload.passwordChangedAt = new Date();

        await SellerSession.deleteMany({ sellerId: seller._id });
      }

      await Seller.findByIdAndUpdate(id, { $set: updatePayload }, { runValidators: true });

      revalidatePath('/customers');
      redirectWithMessage('/customers?tab=sellers', 'success', m.sellerUpdated);
    }

    if (!password) {
      throw new Error(m.sellerPasswordRequired);
    }

    if (password.length < 8) {
      throw new Error(m.sellerPasswordRequired);
    }

    const passwordHash = await hashPassword(password);

    await Seller.create({
      name,
      email,
      role,
      passwordHash,
      isEnabled: true,
      mustChangePassword: false,
      createdBySellerId: session.seller.id,
    });

    revalidatePath('/customers');

    redirectWithMessage('/customers?tab=sellers', 'success', m.sellerCreated);
  } catch (error) {
    await handleActionError('/customers?tab=sellers', error);
  }
}

export async function toggleSellerStatusAction(formData: FormData) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const sellerId = String(formData.get('sellerId') || '').trim();

    if (!Types.ObjectId.isValid(sellerId)) {
      throw new Error(m.invalidSellerId);
    }

    if (session.seller.id === sellerId) {
      throw new Error(m.cannotDisableSelf);
    }

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      throw new Error(m.sellerNotFound);
    }

    seller.isEnabled = !seller.isEnabled;
    await seller.save();

    if (!seller.isEnabled) {
      await SellerSession.deleteMany({ sellerId: seller._id });
    }

    revalidatePath('/customers');

    redirectWithMessage('/customers?tab=sellers', 'success', m.sellerStatusUpdated);
  } catch (error) {
    await handleActionError('/customers?tab=sellers', error);
  }
}

export async function resetSellerPasswordAction(formData: FormData) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const sellerId = String(formData.get('sellerId') || '').trim();
    const newPassword = String(formData.get('newPassword') || '');

    if (!Types.ObjectId.isValid(sellerId)) {
      throw new Error(m.invalidSellerId);
    }

    if (!newPassword) {
      throw new Error(m.sellerPasswordRequired);
    }

    if (newPassword.length < 8) {
      throw new Error(m.sellerPasswordRequired);
    }

    if (session.seller.id === sellerId) {
      throw new Error(m.resetSelfPasswordWithChangeFeature);
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      throw new Error(m.sellerNotFound);
    }

    if (seller.role !== 'SELLER') {
      throw new Error(m.onlySellerResetAllowed);
    }

    await Seller.findByIdAndUpdate(sellerId, {
      $set: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: true,
        passwordChangedAt: new Date(),
      },
    });

    await SellerSession.deleteMany({ sellerId });

    revalidatePath('/customers');

    redirectWithMessage('/customers?tab=sellers', 'success', m.sellerPasswordReset);
  } catch (error) {
    await handleActionError('/customers?tab=sellers', error);
  }
}
