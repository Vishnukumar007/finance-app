import { db } from "@/lib/db";
import type { GrowwConnection, GrowwImport } from "@/lib/groww/types";

export type AppStateKey = "groww" | "growwImport";

export interface AppStateValues {
  groww: GrowwConnection | undefined;
  growwImport: GrowwImport | undefined;
}

export function isAppStateKey(value: unknown): value is AppStateKey {
  return value === "groww" || value === "growwImport";
}

export async function readAppState<K extends AppStateKey>(
  key: K,
): Promise<AppStateValues[K] | undefined> {
  const record = await db.appState.findUnique({ where: { key } });
  return (record?.value as AppStateValues[K] | undefined) ?? undefined;
}

/** A null value clears the entry, which is how disconnecting is stored. */
export async function writeAppState(
  key: AppStateKey,
  value: unknown,
): Promise<void> {
  if (value === null || value === undefined) {
    await db.appState.deleteMany({ where: { key } });
    return;
  }

  await db.appState.upsert({
    where: { key },
    create: { key, value: value as object },
    update: { value: value as object },
  });
}
