import { NextResponse } from "next/server";
import { lockPin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Called when the app loses focus, so coming back asks for the PIN again. */
export async function POST() {
  await lockPin();
  return NextResponse.json({ success: true });
}
