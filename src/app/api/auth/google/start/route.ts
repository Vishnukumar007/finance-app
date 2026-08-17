import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/server/google";

export const dynamic = "force-dynamic";

const OAUTH_COOKIE = "mm_oauth";
const OAUTH_MAX_AGE_SECONDS = 60 * 10;

export async function GET(request: Request) {
  try {
    const state = randomBytes(16).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    const response = NextResponse.redirect(
      authorizeUrl({ request, state, codeChallenge }),
    );

    response.cookies.set(OAUTH_COOKIE, `${state}.${codeVerifier}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: OAUTH_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
