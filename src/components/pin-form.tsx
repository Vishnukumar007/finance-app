"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui";

interface PinFormProps {
  title: string;
  description: string;
  /** Asks for the current PIN as well, which is what changing a PIN needs. */
  askCurrent?: boolean;
  /** Asks the PIN twice, so a new PIN cannot be mistyped. */
  confirm?: boolean;
  submitLabel: string;
  onSubmit: (values: { pin: string; currentPin?: string }) => Promise<string | null>;
  footer?: React.ReactNode;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function PinForm({
  title,
  description,
  askCurrent = false,
  confirm = false,
  submitLabel,
  onSubmit,
  footer,
}: PinFormProps) {
  const fieldId = useId();
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputClass =
    "w-40 rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-[0.6em] text-slate-900 focus:border-slate-400 focus:outline-none";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (pin.length !== 4 || (askCurrent && currentPin.length !== 4)) {
      setError("A PIN is exactly 4 digits.");
      return;
    }
    if (confirm && pin !== repeat) {
      setError("The two PINs do not match.");
      return;
    }

    setBusy(true);
    const message = await onSubmit({
      pin,
      ...(askCurrent ? { currentPin } : {}),
    });
    setBusy(false);

    if (message) {
      setError(message);
      setPin("");
      setRepeat("");
      setCurrentPin("");
      return;
    }
    setPin("");
    setRepeat("");
    setCurrentPin("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {askCurrent ? (
        <div className="space-y-1">
          <label htmlFor={`${fieldId}-current`} className="text-sm text-slate-600">
            Current PIN
          </label>
          <input
            id={`${fieldId}-current`}
            className={inputClass}
            inputMode="numeric"
            autoComplete="off"
            type="password"
            value={currentPin}
            onChange={(event) => setCurrentPin(digitsOnly(event.target.value))}
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor={fieldId} className="text-sm text-slate-600">
          {confirm ? "New PIN" : "PIN"}
        </label>
        <input
          id={fieldId}
          className={inputClass}
          inputMode="numeric"
          autoComplete="off"
          type="password"
          autoFocus
          value={pin}
          onChange={(event) => setPin(digitsOnly(event.target.value))}
        />
      </div>

      {confirm ? (
        <div className="space-y-1">
          <label htmlFor={`${fieldId}-repeat`} className="text-sm text-slate-600">
            Repeat PIN
          </label>
          <input
            id={`${fieldId}-repeat`}
            className={inputClass}
            inputMode="numeric"
            autoComplete="off"
            type="password"
            value={repeat}
            onChange={(event) => setRepeat(digitsOnly(event.target.value))}
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Checking…" : submitLabel}
        </Button>
        {footer}
      </div>
    </form>
  );
}
