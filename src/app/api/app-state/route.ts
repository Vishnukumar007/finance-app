import { NextResponse } from "next/server";
import { isAppStateKey, writeAppState } from "@/lib/server/app-state";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { key?: unknown; value?: unknown };

    if (!isAppStateKey(body.key)) {
      throw new Error("Unknown app state key.");
    }

    await writeAppState(body.key, body.value ?? null);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
