"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { loadCredentials, requestSync, saveCredentials } from "./client";
import type { GrowwCredentials } from "./types";

/** How old a sync may get before the app refreshes it on its own. */
const STALE_AFTER_MS = 30 * 60 * 1000;

/** Auto sync runs once per page load, not once per component using this hook. */
let autoSyncStarted = false;

export function useGrowwSync() {
  const { groww, loaded, applyGrowwSync, recordGrowwError } = useStore();
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(
    async (credentials?: GrowwCredentials) => {
      const used = credentials ?? loadCredentials();
      if (!used) {
        await recordGrowwError(
          "No saved Groww credentials — connect again to sync.",
        );
        return false;
      }
      setSyncing(true);
      try {
        await applyGrowwSync(await requestSync(used));
        saveCredentials(used);
        return true;
      } catch (error) {
        await recordGrowwError(
          error instanceof Error ? error.message : "The sync with Groww failed.",
        );
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [applyGrowwSync, recordGrowwError],
  );

  useEffect(() => {
    if (!loaded || !groww || autoSyncStarted) return;
    const last = groww.lastSyncedAt ? Date.parse(groww.lastSyncedAt) : 0;
    if (Date.now() - last < STALE_AFTER_MS) return;
    if (!loadCredentials()) return;
    autoSyncStarted = true;
    // Started off the effect body so the first paint is not blocked by the sync.
    const timer = window.setTimeout(() => void sync(), 0);
    return () => window.clearTimeout(timer);
  }, [groww, loaded, sync]);

  return { connection: groww, syncing, sync };
}
