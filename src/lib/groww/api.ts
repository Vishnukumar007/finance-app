import { createHash } from "node:crypto";
import { classifyHolding } from "./classify";
import type {
  GrowwCredentials,
  GrowwGap,
  GrowwHolding,
  GrowwSyncResult,
} from "./types";

const BASE_URL = "https://api.groww.in";
const API_VERSION = "1.0";
/** The live price endpoint accepts at most 50 instruments per call. */
const LTP_BATCH_SIZE = 50;

export class GrowwError extends Error {
  constructor(
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "GrowwError";
  }
}

interface GrowwEnvelope<T> {
  status?: string;
  payload?: T;
  error?: { code?: string; message?: string };
}

async function growwGet<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-API-VERSION": API_VERSION,
    },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as GrowwEnvelope<T> | null;
  if (!response.ok || body?.status === "FAILURE" || !body?.payload) {
    throw new GrowwError(
      `Groww rejected the request to ${path}`,
      body?.error?.message ?? `HTTP ${response.status}`,
    );
  }
  return body.payload;
}

/** SHA256(secret + epoch seconds), as required by the approval flow. */
function checksum(apiSecret: string, timestamp: string): string {
  return createHash("sha256").update(`${apiSecret}${timestamp}`).digest("hex");
}

export async function resolveAccessToken(
  credentials: GrowwCredentials,
): Promise<string> {
  if (credentials.mode === "access-token") return credentials.accessToken;

  const body =
    credentials.mode === "totp"
      ? { key_type: "totp", totp: credentials.totp }
      : (() => {
          const timestamp = String(Math.floor(Date.now() / 1000));
          return {
            key_type: "approval",
            checksum: checksum(credentials.apiSecret, timestamp),
            timestamp,
          };
        })();

  const response = await fetch(`${BASE_URL}/v1/token/api/access`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | (GrowwEnvelope<{ token?: string }> & { token?: string })
    | null;
  const token = payload?.payload?.token ?? payload?.token;
  if (!response.ok || !token) {
    throw new GrowwError(
      "Could not generate a Groww access token",
      payload?.error?.message ??
        "Check the API key and that today's approval or TOTP is valid.",
    );
  }
  return token;
}

interface RawHolding {
  isin?: string;
  trading_symbol?: string;
  quantity?: number;
  average_price?: number;
}

async function fetchLastPrices(
  accessToken: string,
  symbols: string[],
): Promise<{ prices: Record<string, number>; failed: string[] }> {
  const prices: Record<string, number> = {};
  const failed: string[] = [];

  for (let i = 0; i < symbols.length; i += LTP_BATCH_SIZE) {
    const batch = symbols.slice(i, i + LTP_BATCH_SIZE);
    try {
      const payload = await growwGet<Record<string, number>>(
        "/v1/live-data/ltp",
        accessToken,
        {
          segment: "CASH",
          exchange_symbols: batch.map((s) => `NSE_${s}`).join(","),
        },
      );
      for (const symbol of batch) {
        const price = payload[`NSE_${symbol}`];
        if (typeof price === "number" && price > 0) prices[symbol] = price;
        else failed.push(symbol);
      }
    } catch {
      failed.push(...batch);
    }
  }

  return { prices, failed };
}

/**
 * Groww's trading API only exposes demat holdings, so mutual funds bought on
 * Groww and digital gold are reported as gaps instead of being guessed at.
 */
export async function fetchGrowwPortfolio(
  credentials: GrowwCredentials,
): Promise<GrowwSyncResult> {
  const accessToken = await resolveAccessToken(credentials);

  const payload = await growwGet<{ holdings?: RawHolding[] }>(
    "/v1/holdings/user",
    accessToken,
  );
  const raw = (payload.holdings ?? []).filter(
    (h): h is RawHolding & { isin: string; trading_symbol: string } =>
      Boolean(h.isin && h.trading_symbol),
  );

  const { prices, failed } = await fetchLastPrices(
    accessToken,
    raw.map((h) => h.trading_symbol),
  );

  const holdings: GrowwHolding[] = raw.map((h) => ({
    isin: h.isin,
    tradingSymbol: h.trading_symbol,
    quantity: h.quantity ?? 0,
    averagePrice: h.average_price ?? 0,
    lastPrice: prices[h.trading_symbol],
    ...classifyHolding(h.isin, h.trading_symbol),
  }));

  const gaps: GrowwGap[] = [
    {
      area: "Mutual funds",
      reason:
        "Groww's trading API does not expose mutual fund folios, only demat holdings. Upload your mutual fund holdings file on the Connections page instead.",
    },
    {
      area: "Digital gold and MCX commodities",
      reason:
        "Not covered by the trading API. Gold and silver ETFs or SGBs held in your demat do sync.",
    },
  ];
  if (failed.length > 0) {
    gaps.push({
      area: "Live price",
      reason: `No live price for ${failed.join(", ")} — the value shown for these is the amount invested.`,
    });
  }

  return { holdings, gaps, syncedAt: new Date().toISOString() };
}
