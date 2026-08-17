"use client";

import { useState } from "react";
import { PageHeader, Card } from "@/components/ui";
import { PinForm } from "@/components/pin-form";
import { useAuth } from "@/lib/auth-client";

export default function SecurityPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader
        title="Security"
        subtitle={`Signed in with Google as ${user?.email ?? ""}`}
      />
      <Card>
        <PinForm
          title="Change your PIN"
          description="You need your current PIN to set a new one."
          askCurrent
          confirm
          submitLabel="Save new PIN"
          onSubmit={async ({ pin, currentPin }) => {
            const response = await fetch("/api/auth/pin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pin, currentPin }),
            });

            if (!response.ok) {
              const body = (await response.json().catch(() => null)) as {
                error?: string;
              } | null;
              return body?.error ?? "The PIN could not be changed.";
            }

            setSaved(true);
            return null;
          }}
        />
        {saved ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Your PIN has been changed.
          </p>
        ) : null}
      </Card>
    </>
  );
}
