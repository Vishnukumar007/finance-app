import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken, verifyToken } from "@/lib/server/tokens";
import type { User } from "@/generated/prisma/client";

export const SESSION_COOKIE = "mm_session";
export const PIN_COOKIE = "mm_pin";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
/** The unlocked window is short on purpose: the PIN comes back quickly. */
const PIN_MAX_AGE_SECONDS = 60 * 30;

interface SessionPayload {
  uid: string;
}

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

export async function startSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    signToken({ uid: userId } satisfies SessionPayload, SESSION_MAX_AGE_SECONDS),
    cookieOptions(SESSION_MAX_AGE_SECONDS),
  );
  store.delete(PIN_COOKIE);
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PIN_COOKIE);
}

/** No `maxAge`, so the unlock also disappears when the browser is closed. */
export async function unlockPin(userId: string): Promise<void> {
  const store = await cookies();
  store.set(
    PIN_COOKIE,
    signToken({ uid: userId } satisfies SessionPayload, PIN_MAX_AGE_SECONDS),
    cookieOptions(),
  );
}

export async function lockPin(): Promise<void> {
  const store = await cookies();
  store.delete(PIN_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const payload = verifyToken<SessionPayload>(store.get(SESSION_COOKIE)?.value);

  if (!payload?.uid) return null;
  return db.user.findUnique({ where: { id: payload.uid } });
}

export async function isPinUnlocked(userId: string): Promise<boolean> {
  const store = await cookies();
  const payload = verifyToken<SessionPayload>(store.get(PIN_COOKIE)?.value);
  return payload?.uid === userId;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "signed-out" | "locked",
  ) {
    super(message);
  }
}

/**
 * The single gate every data route goes through: a signed-in user whose PIN has
 * been entered in this browser session.
 */
export async function requireUnlockedUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError("Sign in to continue.", 401, "signed-out");
  }
  if (!user.pinHash || !(await isPinUnlocked(user.id))) {
    throw new AuthError("Enter your PIN to continue.", 423, "locked");
  }
  return user;
}

/** Turns an `AuthError` into a response and leaves everything else to the caller. */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthError)) return null;

  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}
