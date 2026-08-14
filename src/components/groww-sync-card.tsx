"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { loadCredentials } from "@/lib/groww/client";
import { useGrowwSync } from "@/lib/groww/use-groww";

/** Sync status banner: last update, a manual sync, and anything Groww could not give us. */
export function GrowwSyncCard() {
  const { connection, syncing, sync } = useGrowwSync();

  if (!connection) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Investing through Groww? Connect it and your stocks and ETFs come in
          on their own.
        </p>
        <Link
          href="/connections"
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Connect Groww →
        </Link>
      </Card>
    );
  }

  const gaps = connection.lastResult?.gaps ?? [];

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Groww</p>
          <p className="text-xs text-slate-500">
            {syncing
              ? "Syncing…"
              : connection.lastSyncedAt
                ? `Last updated ${formatDateTime(connection.lastSyncedAt)}`
                : "Not synced yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => void sync()}
            disabled={syncing || !loadCredentials()}
          >
            Sync now
          </Button>
          <Link
            href="/connections"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Manage
          </Link>
        </div>
      </div>

      {connection.lastError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {connection.lastError}
        </p>
      ) : null}

      {gaps.length > 0 ? (
        <details className="text-xs text-slate-500 [&_summary]:list-none">
          <summary className="cursor-pointer font-medium text-slate-600">
            {gaps.length} things Groww could not give us
          </summary>
          <ul className="mt-2 space-y-1">
            {gaps.map((gap) => (
              <li key={gap.area}>
                <span className="font-medium text-slate-700">{gap.area}:</span>{" "}
                {gap.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
