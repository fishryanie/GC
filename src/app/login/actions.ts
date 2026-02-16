'use server';

import { getActionMessages, handleActionError, redirectWithMessage, sanitizeReturnPath } from 'lib/action-helpers';
import { createSessionForSeller, ensureDefaultAdminAccount, normalizeEmail, verifyPassword } from 'lib/auth';
import { connectToDatabase } from 'lib/mongodb';
import { Seller } from 'models/seller';
import { headers } from 'next/headers';

export async function loginAction(formData: FormData) {
  try {
    await ensureDefaultAdminAccount();
    await connectToDatabase();
    const m = await getActionMessages();

    const email = normalizeEmail(String(formData.get('email') || ''));
    const password = String(formData.get('password') || '');
    const returnTo = sanitizeReturnPath(String(formData.get('returnTo') || ''), '/dashboard');

    if (!email || !password) {
      throw new Error(m.loginInvalidCredentials);
    }

    const seller = await Seller.findOne({ email }).select('+passwordHash').lean();
    if (!seller) {
      throw new Error(m.loginInvalidCredentials);
    }

    if (!seller.isEnabled) {
      throw new Error(m.sellerDisabled);
    }

    const isValidPassword = await verifyPassword(password, seller.passwordHash);
    if (!isValidPassword) {
      throw new Error(m.loginInvalidCredentials);
    }

    const headerStore = await headers();
    const forwardedFor = headerStore.get('x-forwarded-for') || '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() || '';
    const userAgent = headerStore.get('user-agent') || '';

    await createSessionForSeller(String(seller._id), {
      ipAddress,
      userAgent,
    });

    await Seller.findByIdAndUpdate(seller._id, {
      $set: {
        lastLoginAt: new Date(),
      },
    });

    redirectWithMessage(returnTo, 'success', m.loginSuccess);
  } catch (error) {
    await handleActionError('/login', error);
  }
}
