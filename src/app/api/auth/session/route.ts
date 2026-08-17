import { NextResponse } from "next/server";
import { getCurrentUser, isPinUnlocked } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** What the client needs to decide between the login screen, the PIN screen and the app. */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null, pinSet: false, unlocked: false });
  }

  return NextResponse.json({
    user: { name: user.name, email: user.email, image: user.image },
    pinSet: Boolean(user.pinHash),
    unlocked: Boolean(user.pinHash) && (await isPinUnlocked(user.id)),
    lockedUntil:
      user.pinLockedUntil && user.pinLockedUntil.getTime() > Date.now()
        ? user.pinLockedUntil.toISOString()
        : undefined,
  });
}
