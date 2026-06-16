"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared input styles for admin forms. */
export const inputClass =
  "h-10 w-full rounded-lg border border-cream-300 bg-white px-3 text-sm text-ink-900 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/30";

export const labelClass = "block text-xs font-semibold text-ink-600";

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "justify-end bg-leaf-500" : "justify-start bg-cream-300",
        )}
      >
        <span className="h-5 w-5 shrink-0 rounded-full bg-white shadow" />
      </span>
      {label && (
        <span className="whitespace-nowrap text-sm text-ink-700">{label}</span>
      )}
    </button>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 sm:p-6">
      <div
        className={cn(
          "my-4 w-full rounded-2xl bg-white shadow-card",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-maroon-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-cream-100 hover:text-maroon-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-cream-200 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminButton({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-maroon-800 text-cream-50 hover:bg-maroon-700",
    ghost: "border border-cream-300 text-ink-700 hover:bg-cream-100",
    danger: "border border-maroon-700/30 text-maroon-700 hover:bg-maroon-700/5",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold disabled:opacity-60",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-300 bg-white py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-maroon-800">
        {icon}
      </span>
      <p className="mt-4 font-medium text-maroon-900">{title}</p>
      {text && <p className="mt-1 text-sm text-ink-500">{text}</p>}
    </div>
  );
}
