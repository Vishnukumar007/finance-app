import { NextResponse } from "next/server";
import { endSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await endSession();
  return NextResponse.json({ success: true });
}
