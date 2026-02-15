import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import enMessages from "@/messages/en.json";
import { defaultLocale, isAppLocale } from "@/i18n/config";
import { Order } from "@/models/order";

export type ActionMessages = typeof enMessages.actions;

export function formatMessage(template: string, values?: Record<string, string | number>) {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export async function getActionMessages(): Promise<ActionMessages> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : defaultLocale;

  if (locale === "vi") {
    return (await import("../messages/vi.json")).default.actions as ActionMessages;
  }

  return enMessages.actions;
}

export function getErrorMessage(error: unknown, messages: ActionMessages) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return messages.genericError;
}

export function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  if (!("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function redirectWithMessage(path: string, type: "success" | "error", message: string): never {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(type, message);
  redirect(`${pathname}?${params.toString()}`);
}

export function sanitizeReturnPath(rawValue: string, fallback: string) {
  const value = rawValue.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value.startsWith("/login")) {
    return fallback;
  }

  return value;
}

export async function handleActionError(path: string, error: unknown): Promise<never> {
  if (isNextRedirectError(error)) {
    throw error;
  }

  const messages = await getActionMessages();
  redirectWithMessage(path, "error", getErrorMessage(error, messages));
}

export function roundToThousand(amount: number) {
  return Math.round(amount / 1000) * 1000;
}

export async function generateOrderCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (let index = 0; index < 5; index += 1) {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const candidate = `DH-${datePart}-${randomSuffix}`;
    const exists = await Order.exists({ code: candidate });

    if (!exists) {
      return candidate;
    }
  }

  return `DH-${datePart}-${Date.now().toString().slice(-6)}`;
}

export function revalidateCorePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/price-profiles");
  revalidatePath("/orders");
  revalidatePath("/orders/new");
  revalidatePath("/customers");
}
