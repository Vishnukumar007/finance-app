import { NextResponse } from "next/server";
import { checkPin, isValidPin } from "@/lib/server/pin";
import { getCurrentUser, unlockPin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to continue.", code: "signed-out" },
      { status: 401 },
    );
  }
  if (!user.pinHash) {
    return NextResponse.json(
      { error: "Create a PIN first.", code: "no-pin" },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as { pin?: unknown } | null;

  if (!isValidPin(body?.pin)) {
    return NextResponse.json(
      { error: "The PIN must be exactly 4 digits." },
      { status: 400 },
    );
  }

  const check = await checkPin(user, body.pin);

  if (!check.ok) {
    return NextResponse.json(
      {
        error: check.lockedUntil
          ? "Too many wrong PINs. Try again later."
          : `Wrong PIN. ${check.attemptsLeft} tries left.`,
        attemptsLeft: check.attemptsLeft,
        lockedUntil: check.lockedUntil,
      },
      { status: 403 },
    );
  }

  await unlockPin(user.id);
  return NextResponse.json({ success: true });
}
