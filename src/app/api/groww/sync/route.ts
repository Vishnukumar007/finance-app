import { NextResponse } from "next/server";
import { fetchGrowwPortfolio, GrowwError } from "@/lib/groww/api";
import type { GrowwCredentials } from "@/lib/groww/types";

export const dynamic = "force-dynamic";

function parseCredentials(body: unknown): GrowwCredentials | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = body as Record<string, unknown>;
  const text = (key: string) =>
    typeof value[key] === "string" ? (value[key] as string).trim() : "";

  switch (value.mode) {
    case "access-token": {
      const accessToken = text("accessToken");
      return accessToken ? { mode: "access-token", accessToken } : undefined;
    }
    case "api-secret": {
      const apiKey = text("apiKey");
      const apiSecret = text("apiSecret");
      return apiKey && apiSecret
        ? { mode: "api-secret", apiKey, apiSecret }
        : undefined;
    }
    case "totp": {
      const apiKey = text("apiKey");
      const totp = text("totp");
      return apiKey && totp ? { mode: "totp", apiKey, totp } : undefined;
    }
    default:
      return undefined;
  }
}

/** Proxies Groww on the server: the browser cannot call api.groww.in directly. */
export async function POST(request: Request) {
  const credentials = parseCredentials(await request.json().catch(() => null));
  if (!credentials) {
    return NextResponse.json(
      { error: "Missing Groww credentials." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await fetchGrowwPortfolio(credentials));
  } catch (error) {
    if (error instanceof GrowwError) {
      return NextResponse.json(
        { error: error.message, detail: error.detail },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Could not reach Groww.", detail: "Please try the sync again." },
      { status: 502 },
    );
  }
}
