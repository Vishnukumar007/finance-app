"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { refreshSession, signOut, useAuth } from "@/lib/auth-client";
import { reloadStore } from "@/lib/store";
import { PinForm } from "@/components/pin-form";
import { Button, Card } from "@/components/ui";

function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full p-6 sm:p-8">{children}</Card>
    </main>
  );
}

async function postPin(
  url: string,
  body: Record<string, string>,
): Promise<string | null> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) return null;

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return payload?.error ?? "That did not work. Please try again.";
}

/** Google sends a failed sign-in back with `?error=`. */
function SignInError() {
  const message = useSearchParams().get("error");

  if (!message) return null;

  return (
    <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </p>
  );
}

function SignIn() {
  return (
    <Screen>
      <h1 className="text-xl font-semibold text-slate-900">My Money</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sign in with Google to see your assets, liabilities and goals. Every
        account has its own data.
      </p>
      <Suspense fallback={null}>
        <SignInError />
      </Suspense>
      <a
        href="/api/auth/google/start"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Continue with Google
      </a>
    </Screen>
  );
}

/**
 * Nothing renders until there is a signed-in account with its PIN entered in
 * this browser session.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, pinSet, unlocked, loading } = useAuth();

  if (loading) {
    return (
      <Screen>
        <p className="text-sm text-slate-500">Loading…</p>
      </Screen>
    );
  }

  if (!user) return <SignIn />;

  if (!pinSet || !unlocked) {
    const signOutButton = (
      <Button
        variant="secondary"
        type="button"
        className="w-full sm:w-auto"
        onClick={() => void signOut()}
      >
        Sign out
      </Button>
    );

    const unlockedNow = async () => {
      await refreshSession();
      await reloadStore();
      return null;
    };

    return (
      <Screen>
        <p className="mb-5 truncate text-sm text-slate-500">
          Signed in as {user.email}
        </p>
        {pinSet ? (
          <PinForm
            title="Enter your PIN"
            description="Your money is hidden until you type your 4 digit PIN."
            submitLabel="Unlock"
            footer={signOutButton}
            onSubmit={async ({ pin }) =>
              (await postPin("/api/auth/pin/verify", { pin })) ??
              (await unlockedNow())
            }
          />
        ) : (
          <PinForm
            title="Create a 4 digit PIN"
            description="You will be asked for this PIN whenever you come back to the app."
            confirm
            submitLabel="Save PIN"
            footer={signOutButton}
            onSubmit={async ({ pin }) =>
              (await postPin("/api/auth/pin", { pin })) ?? (await unlockedNow())
            }
          />
        )}
      </Screen>
    );
  }

  return <>{children}</>;
}
