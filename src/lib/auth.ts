import "server-only";

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Seller, type SellerRole } from "@/models/seller";
import { SellerSession } from "@/models/seller-session";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE_NAME = "CHAFLOW_SESSION";

const SESSION_DURATION_DAYS = 14;
const SCRYPT_KEY_LENGTH = 64;

export type AuthSeller = {
  id: string;
  name: string;
  email: string;
  role: SellerRole;
  isEnabled: boolean;
  mustChangePassword: boolean;
};

function toAuthSeller(doc: {
  _id: unknown;
  name: string;
  email: string;
  role: SellerRole;
  isEnabled: boolean;
  mustChangePassword: boolean;
}): AuthSeller {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isEnabled: doc.isEnabled,
    mustChangePassword: doc.mustChangePassword,
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isPasswordStrong(password: string) {
  return password.length >= 8;
}

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

export async function hashPassword(plainText: string) {
  if (!isPasswordStrong(plainText)) {
    throw new Error("Password must be at least 8 characters.");
  }

  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(plainText, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(plainText: string, storedHash: string) {
  const [algorithm, salt, keyHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !keyHex) {
    return false;
  }

  const expected = Buffer.from(keyHex, "hex");
  const actual = (await scryptAsync(plainText, salt, expected.length)) as Buffer;

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

export async function createSessionForSeller(
  sellerId: string,
  context?: { userAgent?: string; ipAddress?: string },
) {
  await connectToDatabase();

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await SellerSession.create({
    sellerId,
    tokenHash,
    userAgent: context?.userAgent ?? "",
    ipAddress: context?.ipAddress ?? "",
    expiresAt,
    lastSeenAt: new Date(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    await connectToDatabase();
    await SellerSession.deleteOne({ tokenHash: hashToken(rawToken) });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) {
    return null;
  }

  await connectToDatabase();
  const tokenHash = hashToken(rawToken);
  const session = await SellerSession.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const seller = await Seller.findById(session.sellerId).lean();
  if (!seller || !seller.isEnabled) {
    await SellerSession.deleteOne({ _id: session._id });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    seller: toAuthSeller(seller),
    sessionId: String(session._id),
  };
}

export async function requireAuthSession() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireAuthSession();

  if (session.seller.role !== "ADMIN") {
    throw new Error("Only admin can perform this action.");
  }

  return session;
}

export async function ensureDefaultAdminAccount() {
  await connectToDatabase();

  const hasAdmin = await Seller.exists({ role: "ADMIN" });
  if (hasAdmin) {
    return;
  }

  const email = normalizeEmail(process.env.ADMIN_EMAIL || "admin@gc.vn");
  const name = (process.env.ADMIN_NAME || "GC Admin").trim();
  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  const passwordHash = await hashPassword(password);

  await Seller.create({
    name,
    email,
    role: "ADMIN",
    passwordHash,
    isEnabled: true,
    mustChangePassword: false,
  });
}
