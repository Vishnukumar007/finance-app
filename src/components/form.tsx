import type { ComponentProps, ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint ? <span className="ml-2 text-xs text-slate-400">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const controlClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400";

export function TextInput({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${controlClass} ${className}`} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${controlClass} ${className}`} />;
}

export function TextArea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${controlClass} ${className}`} />;
}
