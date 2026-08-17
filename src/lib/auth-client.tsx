"use client";

import { useSyncExternalStore } from "react";
import { resetStore } from "@/lib/store";

export interface SessionUser {
  name: string;
  email: string;
  image: string;
}

export interface AuthState {
  user: SessionUser | null;
  pinSet: boolean;
  unlocked: boolean;
  lockedUntil?: string;
  loading: boolean;
}

const SIGNED_OUT: AuthState = {
  user: null,
  pinSet: false,
  unlocked: false,
  loading: false,
};

const LOADING: AuthState = { ...SIGNED_OUT, loading: true };

/**
 * Leaving the app locks it: coming back from another tab, another app or a
 * reopened browser asks for the PIN again.
 */
const LOCK_AFTER_HIDDEN_MS = 15_000;

let state: AuthState = LOADING;
let pending: Promise<void> | null = null;
let watching = false;
const listeners = new Set<() => void>();

function setState(changes: Partial<AuthState>): void {
  state = { ...state, ...changes };
  for (const listener of listeners) listener();
}

export async function refreshSession(): Promise<void> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    const body = (await response.json()) as Omit<AuthState, "loading">;
    setState({ ...body, loading: false });
  } catch {
    setState({ ...SIGNED_OUT });
  }
}

export async function lockApp(): Promise<void> {
  setState({ unlocked: false });
  resetStore();
  await fetch("/api/auth/pin/lock", { method: "POST", keepalive: true });
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  resetStore();
  setState({ ...SIGNED_OUT });
}

function watchApp(): void {
  if (watching) return;
  watching = true;

  let hiddenTimer: ReturnType<typeof setTimeout> | undefined;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenTimer = setTimeout(() => void lockApp(), LOCK_AFTER_HIDDEN_MS);
      return;
    }
    clearTimeout(hiddenTimer);
    void refreshSession();
  });

  window.addEventListener("auth-changed", () => void refreshSession());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  watchApp();
  pending ??= refreshSession();

  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  );
}
