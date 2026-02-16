'use server';

import { getActionMessages, handleActionError, redirectWithMessage } from 'lib/action-helpers';
import { clearAuthSession } from 'lib/auth';

export async function logoutAction() {
  try {
    const m = await getActionMessages();
    await clearAuthSession();
    redirectWithMessage('/login', 'success', m.logoutSuccess);
  } catch (error) {
    await handleActionError('/login', error);
  }
}

