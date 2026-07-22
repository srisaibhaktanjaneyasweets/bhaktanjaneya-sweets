"use client";

import { CheckCircle2, Info, XCircle, AlertTriangle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastPayload = {
  tone: ToastTone;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastInternal = ToastPayload & {
  id: string;
};

export const TONE_META = {
  success: {
    Icon: CheckCircle2,
    iconClass: "text-[#2f7d4f]",
    border: "#2f7d4f",
    badge: "Success",
  },
  error: {
    Icon: XCircle,
    iconClass: "text-[#793b13]",
    border: "#793b13",
    badge: "Error",
  },
  info: {
    Icon: Info,
    iconClass: "text-[#c9961e]",
    border: "#c9961e",
    badge: "Notice",
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: "text-[#ec8f1e]",
    border: "#ec8f1e",
    badge: "Warning",
  },
};

export function ToastCard({
  tone,
  title,
  message,
  onDismiss,
}: {
  tone: ToastTone;
  title?: string;
  message: React.ReactNode;
  onDismiss: () => void;
}) {
  const meta = TONE_META[tone];
  const Icon = meta.Icon;

  return (
    <div
      style={{
        backgroundColor: "#fffdf7", // cream-50 (page background)
        opacity: 1,
        borderColor: meta.border,
        borderWidth: "2px",
        borderStyle: "solid",
        boxShadow: "0 10px 25px -5px rgba(46, 36, 23, 0.15), 0 8px 10px -6px rgba(46, 36, 23, 0.15)",
      }}
      className="flex w-full items-start gap-3 rounded-2xl p-4 text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 text-[#2a1810]"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#fbf5e9]">
        <Icon size={18} className={meta.iconClass} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        {title || meta.badge ? (
          <p className="font-sans text-sm font-extrabold tracking-wide text-[#55290c]">
            {title || meta.badge}
          </p>
        ) : null}
        <div className="mt-0.5 text-xs text-[#6f5848] leading-relaxed font-normal">
          {message}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close"
        className="ml-1 shrink-0 rounded-full p-1 text-[#8a7565] hover:bg-[#f2e9d6] hover:text-[#55290c] transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
}

let listeners: Array<(t: ToastInternal[]) => void> = [];
let state: ToastInternal[] = [];
let counter = 1;

function notify() {
  for (const l of listeners) l(state);
}

function dismiss(id: string) {
  state = state.filter((t) => t.id !== id);
  notify();
}

export function toast(payload: Omit<ToastPayload, "tone"> & { tone: ToastTone }) {
  const id = `toast_${Date.now()}_${counter++}`;
  const durationMs = payload.durationMs ?? 4000;

  const next: ToastInternal = { ...payload, id, durationMs };
  state = [next, ...state].slice(0, 4);
  notify();

  if (durationMs > 0) {
    window.setTimeout(() => dismiss(id), durationMs);
  }
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastInternal[]>(state);

  useEffect(() => {
    const l = (t: ToastInternal[]) => setToasts(t);
    listeners.push(l);

    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const rendered = useMemo(() => toasts, [toasts]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2.5 max-w-[calc(100%-2rem)] sm:right-6 sm:bottom-6">
      {rendered.map((t) => (
        <div key={t.id} className="pointer-events-auto w-[320px] max-w-full sm:w-[380px]">
          <ToastCard
            tone={t.tone}
            title={t.title}
            message={t.message}
            onDismiss={() => dismiss(t.id)}
          />
        </div>
      ))}
    </div>
  );
}
