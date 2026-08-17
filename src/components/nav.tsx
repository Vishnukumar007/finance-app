"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { lockApp, signOut, useAuth } from "@/lib/auth-client";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/liabilities", label: "Liabilities" },
  { href: "/goals", label: "Goals" },
  { href: "/connections", label: "Connections" },
  { href: "/security", label: "Security" },
];

export function Nav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-base font-semibold text-slate-900">
          My Money
        </Link>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user.email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void lockApp()}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Lock
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
