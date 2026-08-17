import { NextResponse } from "next/server";
import { isAppStateKey, writeAppState } from "@/lib/server/app-state";
import { authErrorResponse, requireUnlockedUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const user = await requireUnlockedUser();
    const body = (await request.json()) as { key?: unknown; value?: unknown };

    if (!isAppStateKey(body.key)) {
      throw new Error("Unknown app state key.");
    }

    await writeAppState(user.id, body.key, body.value ?? null);
    return NextResponse.json({ success: true });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 400 },
      )
    );
  }
}
