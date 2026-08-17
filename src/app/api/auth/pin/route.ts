import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPin, hashPin, isValidPin } from "@/lib/server/pin";
import { getCurrentUser, unlockPin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Sets the PIN the first time, or changes it when the current one is given. */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue.", code: "signed-out" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    pin?: unknown;
    currentPin?: unknown;
  } | null;

  if (!isValidPin(body?.pin)) {
    return NextResponse.json(
      { error: "The PIN must be exactly 4 digits." },
      { status: 400 },
    );
  }

  if (user.pinHash) {
    if (!isValidPin(body?.currentPin)) {
      return NextResponse.json(
        { error: "Enter your current PIN to change it." },
        { status: 400 },
      );
    }

    const check = await checkPin(user, body.currentPin);
    if (!check.ok) {
      return NextResponse.json(
        {
          error: check.lockedUntil
            ? "Too many wrong PINs. Try again later."
            : `That is not your current PIN. ${check.attemptsLeft} tries left.`,
          attemptsLeft: check.attemptsLeft,
          lockedUntil: check.lockedUntil,
        },
        { status: 403 },
      );
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      pinHash: await hashPin(body.pin),
      pinUpdatedAt: new Date(),
      pinFailedCount: 0,
      pinLockedUntil: null,
    },
  });

  await unlockPin(user.id);
  return NextResponse.json({ success: true });
}
