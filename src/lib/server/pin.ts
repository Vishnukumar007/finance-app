import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function isValidPin(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}$/.test(value);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(pin, salt, KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function matchesPin(pin: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const derived = await scryptAsync(pin, Buffer.from(salt, "hex"), KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export interface PinCheckResult {
  ok: boolean;
  /** Attempts left before the PIN is locked out; `0` while locked out. */
  attemptsLeft: number;
  lockedUntil?: string;
}

/**
 * Checks a PIN and keeps the failure count on the user, so guessing gets
 * slower instead of staying free.
 */
export async function checkPin(user: User, pin: string): Promise<PinCheckResult> {
  if (user.pinLockedUntil && user.pinLockedUntil.getTime() > Date.now()) {
    return {
      ok: false,
      attemptsLeft: 0,
      lockedUntil: user.pinLockedUntil.toISOString(),
    };
  }

  if (user.pinHash && (await matchesPin(pin, user.pinHash))) {
    await db.user.update({
      where: { id: user.id },
      data: { pinFailedCount: 0, pinLockedUntil: null },
    });
    return { ok: true, attemptsLeft: MAX_ATTEMPTS };
  }

  const failedCount = user.pinFailedCount + 1;
  const lockedUntil =
    failedCount >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      : null;

  await db.user.update({
    where: { id: user.id },
    data: {
      pinFailedCount: lockedUntil ? 0 : failedCount,
      pinLockedUntil: lockedUntil,
    },
  });

  return {
    ok: false,
    attemptsLeft: lockedUntil ? 0 : MAX_ATTEMPTS - failedCount,
    lockedUntil: lockedUntil?.toISOString(),
  };
}
