import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Small signed-token helper. Tokens are `base64url(payload).base64url(hmac)`
 * and are only ever read back by this app, so no JWT library is needed.
 */

function secret(): string {
  const value = process.env.AUTH_SECRET;

  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET is not set — put a long random string in your environment.",
    );
  }
  return value;
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function signToken(payload: object, maxAgeSeconds: number): string {
  const body = encode({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  });
  return `${body}.${sign(body)}`;
}

export function verifyToken<T extends object>(
  token: string | undefined,
): (T & { exp: number }) | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);

  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as T & {
      exp: number;
    };
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
