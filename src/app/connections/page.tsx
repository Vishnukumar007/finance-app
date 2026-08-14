"use client";

import { useState } from "react";
import { Field, Select, TextInput } from "@/components/form";
import { Button, Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { clearCredentials, loadCredentials } from "@/lib/groww/client";
import type { GrowwCredentialMode, GrowwCredentials } from "@/lib/groww/types";
import { useGrowwSync } from "@/lib/groww/use-groww";
import { useStore } from "@/lib/store";

const MODES: { value: GrowwCredentialMode; label: string; hint: string }[] = [
  {
    value: "access-token",
    label: "Access token",
    hint: "Groww → Settings → Trading APIs → Generate access token. It expires every day at 6:00 AM.",
  },
  {
    value: "api-secret",
    label: "API key and secret",
    hint: "Stays valid as long as the key is approved on the Groww API keys page, so syncs can run on their own.",
  },
  {
    value: "totp",
    label: "API key and TOTP",
    hint: "The code is used once and is not saved, so you will be asked for a new one each sync.",
  },
];

export default function ConnectionsPage() {
  const { assets, loaded, connectGroww, disconnectGroww } = useStore();
  const { connection, syncing, sync } = useGrowwSync();

  const [mode, setMode] = useState<GrowwCredentialMode>("access-token");
  const [accessToken, setAccessToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [totp, setTotp] = useState("");

  if (!loaded) return null;

  const synced = assets.filter((asset) => asset.source?.provider === "groww");
  const savedCredentials = connection ? loadCredentials() : undefined;

  function credentialsFromForm(): GrowwCredentials | undefined {
    if (mode === "access-token") {
      return accessToken.trim()
        ? { mode, accessToken: accessToken.trim() }
        : undefined;
    }
    if (mode === "api-secret") {
      return apiKey.trim() && apiSecret.trim()
        ? { mode, apiKey: apiKey.trim(), apiSecret: apiSecret.trim() }
        : undefined;
    }
    return apiKey.trim() && totp.trim()
      ? { mode, apiKey: apiKey.trim(), totp: totp.trim() }
      : undefined;
  }

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    const credentials = credentialsFromForm();
    if (!credentials) return;
    connectGroww();
    const ok = await sync(credentials);
    if (ok) {
      setAccessToken("");
      setApiSecret("");
      setTotp("");
    }
  }

  function handleDisconnect() {
    clearCredentials();
    disconnectGroww();
  }

  const activeMode = MODES.find((option) => option.value === mode)!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        subtitle="Bring investments in from the places you already invest."
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Groww</h2>
            <p className="mt-1 text-sm text-slate-500">
              {connection
                ? `${synced.length} ${synced.length === 1 ? "holding" : "holdings"} synced${
                    connection.lastSyncedAt
                      ? ` · last updated ${formatDateTime(connection.lastSyncedAt)}`
                      : ""
                  }`
                : "Not connected."}
            </p>
          </div>
          {connection ? (
            <div className="flex gap-2">
              <Button
                onClick={() => void sync()}
                disabled={syncing || !savedCredentials}
              >
                {syncing ? "Syncing…" : "Sync now"}
              </Button>
              <Button variant="danger" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : null}
        </div>

        {connection?.lastError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {connection.lastError}
          </p>
        ) : null}

        {connection && !savedCredentials ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Your Groww code was single use, so enter it again below to sync.
          </p>
        ) : null}

        {connection?.lastResult ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Last sync added {connection.lastResult.added}, updated{" "}
              {connection.lastResult.updated}
              {connection.lastResult.missing > 0
                ? `, and ${connection.lastResult.missing} no longer come back from Groww`
                : ""}
              .
            </p>
            {connection.lastResult.gaps.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  What Groww does not give us
                </p>
                <ul className="mt-2 space-y-2 text-xs text-slate-600">
                  {connection.lastResult.gaps.map((gap) => (
                    <li key={gap.area}>
                      <span className="font-medium text-slate-700">
                        {gap.area}:
                      </span>{" "}
                      {gap.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleConnect} className="space-y-4">
          <p className="text-sm text-slate-600">
            {connection ? "Update your Groww details" : "Connect your Groww account"}{" "}
            using the Trading API. Your key stays in this browser and is only
            sent to Groww when a sync runs.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How do you want to sign in?" hint={activeMode.hint}>
              <Select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as GrowwCredentialMode)
                }
              >
                {MODES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            {mode === "access-token" ? (
              <Field label="Access token">
                <TextInput
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste the token from Groww"
                />
              </Field>
            ) : (
              <>
                <Field label="API key">
                  <TextInput
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Groww API key"
                  />
                </Field>
                {mode === "api-secret" ? (
                  <Field label="API secret">
                    <TextInput
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Groww API secret"
                    />
                  </Field>
                ) : (
                  <Field label="TOTP code">
                    <TextInput
                      value={totp}
                      onChange={(e) => setTotp(e.target.value)}
                      placeholder="6 digit code"
                      inputMode="numeric"
                    />
                  </Field>
                )}
              </>
            )}
          </div>

          <Button type="submit" disabled={syncing || !credentialsFromForm()}>
            {syncing ? "Connecting…" : connection ? "Save and sync" : "Connect and sync"}
          </Button>
        </form>

        <div className="rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
          <p className="text-sm font-medium text-slate-700">
            What syncs from Groww
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              Stocks and ETFs in your demat account, with quantity, average
              price and today&apos;s value.
            </li>
            <li>
              Gold and silver ETFs or sovereign gold bonds, shown under
              Commodities.
            </li>
            <li>
              Mutual fund folios, digital gold and MCX commodities are not part
              of the Groww Trading API, so keep entering those by hand.
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
