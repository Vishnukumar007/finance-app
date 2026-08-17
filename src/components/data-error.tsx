"use client";

import { useStore } from "@/lib/store";

/** Says so plainly when the database cannot be reached, instead of showing an empty app. */
export function DataError() {
  const { error } = useStore();

  if (!error) return null;

  return (
    <div className="mx-auto mb-4 w-full max-w-5xl px-4">
      <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
        Your data could not be loaded from the database. {error}
      </p>
    </div>
  );
}
