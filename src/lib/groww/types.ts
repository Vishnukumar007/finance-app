import type { AssetCategoryId } from "@/lib/types";

/** How the user authenticates with Groww. Credentials never leave the browser except on a sync call. */
export type GrowwCredentials =
  | { mode: "access-token"; accessToken: string }
  | { mode: "api-secret"; apiKey: string; apiSecret: string }
  | { mode: "totp"; apiKey: string; totp: string };

export type GrowwCredentialMode = GrowwCredentials["mode"];

/** A holding as Groww returns it, plus the price we resolved for it. */
export interface GrowwHolding {
  isin: string;
  tradingSymbol: string;
  quantity: number;
  averagePrice: number;
  /** Last traded price, missing when Groww could not price the instrument. */
  lastPrice?: number;
  categoryId: AssetCategoryId;
  assetType: string;
}

/** Something the sync could not retrieve, shown to the user instead of guessing. */
export interface GrowwGap {
  area: string;
  reason: string;
}

export interface GrowwSyncResult {
  holdings: GrowwHolding[];
  gaps: GrowwGap[];
  syncedAt: string;
}

export interface GrowwSyncError {
  error: string;
  detail?: string;
}

/** Outcome of applying a sync to the stored assets. */
export interface GrowwApplyReport {
  added: number;
  updated: number;
  missing: number;
}

export interface GrowwConnection {
  connectedAt: string;
  lastSyncedAt?: string;
  lastResult?: {
    added: number;
    updated: number;
    missing: number;
    gaps: GrowwGap[];
  };
  lastError?: string;
}

/** The last mutual fund file the user uploaded. */
export interface GrowwImport {
  importedAt: string;
  fileName: string;
  added: number;
  updated: number;
  problems: string[];
}

/** Marks an asset that a provider owns, so a sync updates it instead of adding a duplicate. */
export interface AssetSource {
  /** `groww` comes from the API sync, `groww-file` from an uploaded holdings file. */
  provider: "groww" | "groww-file";
  /** ISIN, or the folio for imported funds — stable across name changes. */
  externalId: string;
  syncedAt: string;
  /** Set when the holding disappeared from the provider. */
  missingSince?: string;
  /** Set when the provider had no price, so the value shown is the invested amount. */
  priceUnavailable?: boolean;
}
