'use server';

import { getActionMessages, handleActionError, redirectWithMessage } from 'lib/action-helpers';
import { clearAuthSession, hashPassword, requireAuthSession, verifyPassword } from 'lib/auth';
import { connectToDatabase } from 'lib/mongodb';
import { Seller } from 'models/seller';
import { SellerSession } from 'models/seller-session';

export async function changePasswordAction(formData: FormData) {
  try {
    const session = await requireAuthSession();
    await connectToDatabase();
    const m = await getActionMessages();

    const currentPassword = String(formData.get('currentPassword') || '');
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error(m.passwordFieldsRequired);
    }

    if (newPassword !== confirmPassword) {
      throw new Error(m.passwordConfirmationMismatch);
    }

    if (newPassword.length < 8) {
      throw new Error(m.passwordTooShort);
    }

    const seller = await Seller.findById(session.seller.id).select('+passwordHash');
    if (!seller) {
      throw new Error(m.accountNotFound);
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, seller.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error(m.currentPasswordInvalid);
    }

    const nextHash = await hashPassword(newPassword);

    await Seller.findByIdAndUpdate(seller._id, {
      $set: {
        passwordHash: nextHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    await SellerSession.deleteMany({ sellerId: seller._id });
    await clearAuthSession();

    redirectWithMessage('/login', 'success', m.passwordChanged);
  } catch (error) {
    await handleActionError('/account', error);
  }
}
