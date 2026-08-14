import type { GrowwCredentials, GrowwSyncResult } from "./types";

const CREDENTIALS_KEY = "finance-tracker-groww-credentials";

/** A TOTP is single use, so only the other modes can be kept for later syncs. */
export function isReusable(credentials: GrowwCredentials): boolean {
  return credentials.mode !== "totp";
}

export function loadCredentials(): GrowwCredentials | undefined {
  try {
    const raw = window.localStorage.getItem(CREDENTIALS_KEY);
    return raw ? (JSON.parse(raw) as GrowwCredentials) : undefined;
  } catch {
    return undefined;
  }
}

export function saveCredentials(credentials: GrowwCredentials): void {
  if (!isReusable(credentials)) return;
  window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function clearCredentials(): void {
  window.localStorage.removeItem(CREDENTIALS_KEY);
}

export async function requestSync(
  credentials: GrowwCredentials,
): Promise<GrowwSyncResult> {
  const response = await fetch("/api/groww/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const body = (await response.json().catch(() => null)) as
    | (GrowwSyncResult & { error?: string; detail?: string })
    | null;

  if (!response.ok || !body || body.error) {
    throw new Error(
      [body?.error ?? "The sync with Groww failed.", body?.detail]
        .filter(Boolean)
        .join(" "),
    );
  }
  return body;
}
