"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Asset, Goal, Liability } from "./types";

const STORAGE_KEY = "finance-tracker-data";

export interface StoredData {
  assets: Asset[];
  liabilities: Liability[];
  goals: Goal[];
}

const EMPTY_DATA: StoredData = { assets: [], liabilities: [], goals: [] };

let cache: StoredData | null = null;
const listeners = new Set<() => void>();

function readStorage(): StoredData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as Partial<StoredData>;
    return {
      assets: parsed.assets ?? [],
      liabilities: parsed.liabilities ?? [],
      goals: parsed.goals ?? [],
    };
  } catch {
    return EMPTY_DATA;
  }
}

function getSnapshot(): StoredData {
  if (cache === null) cache = readStorage();
  return cache;
}

function getServerSnapshot(): StoredData {
  return EMPTY_DATA;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setData(updater: (previous: StoredData) => StoredData): void {
  cache = updater(getSnapshot());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  for (const listener of listeners) listener();
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Keeps the client-only flag out of render-time `window` checks. */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function useStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const loaded = useIsHydrated();

  const addAsset = useCallback((asset: Omit<Asset, "id" | "createdAt">) => {
    const created: Asset = {
      ...asset,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, assets: [...prev.assets, created] }));
    return created;
  }, []);

  const updateAsset = useCallback(
    (id: string, changes: Partial<Omit<Asset, "id">>) => {
      setData((prev) => ({
        ...prev,
        assets: prev.assets.map((a) => (a.id === id ? { ...a, ...changes } : a)),
      }));
    },
    [],
  );

  const deleteAsset = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id),
      goals: prev.goals.map((goal) => ({
        ...goal,
        linkedAssetIds: goal.linkedAssetIds.filter((assetId) => assetId !== id),
      })),
    }));
  }, []);

  const addLiability = useCallback(
    (liability: Omit<Liability, "id" | "createdAt">) => {
      const created: Liability = {
        ...liability,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        liabilities: [...prev.liabilities, created],
      }));
      return created;
    },
    [],
  );

  const updateLiability = useCallback(
    (id: string, changes: Partial<Omit<Liability, "id">>) => {
      setData((prev) => ({
        ...prev,
        liabilities: prev.liabilities.map((l) =>
          l.id === id ? { ...l, ...changes } : l,
        ),
      }));
    },
    [],
  );

  const deleteLiability = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      liabilities: prev.liabilities.filter((l) => l.id !== id),
    }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, "id" | "createdAt">) => {
    const created: Goal = {
      ...goal,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, goals: [...prev.goals, created] }));
    return created;
  }, []);

  const updateGoal = useCallback(
    (id: string, changes: Partial<Omit<Goal, "id">>) => {
      setData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...changes } : g)),
      }));
    },
    [],
  );

  const deleteGoal = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  return useMemo(
    () => ({
      ...data,
      loaded,
      addAsset,
      updateAsset,
      deleteAsset,
      addLiability,
      updateLiability,
      deleteLiability,
      addGoal,
      updateGoal,
      deleteGoal,
    }),
    [
      data,
      loaded,
      addAsset,
      updateAsset,
      deleteAsset,
      addLiability,
      updateLiability,
      deleteLiability,
      addGoal,
      updateGoal,
      deleteGoal,
    ],
  );
}
