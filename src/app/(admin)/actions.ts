"use server";

import { clearAuthSession } from "@/lib/auth";
import {
  getActionMessages,
  handleActionError,
  redirectWithMessage,
} from "@/lib/action-helpers";

export async function logoutAction() {
  try {
    const m = await getActionMessages();
    await clearAuthSession();
    redirectWithMessage("/login", "success", m.logoutSuccess);
  } catch (error) {
    await handleActionError("/login", error);
  }
}
