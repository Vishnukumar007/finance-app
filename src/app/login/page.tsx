import Link from "next/link";

/**
 * The sign-in screen itself is rendered by the auth gate; this route exists so
 * Google can send a failed sign-in back to a real page.
 */
export default function LoginPage() {
  return (
    <div className="text-sm text-slate-500">
      You are signed in.{" "}
      <Link href="/" className="font-medium text-slate-900 underline">
        Go to the dashboard
      </Link>
      .
    </div>
  );
}
