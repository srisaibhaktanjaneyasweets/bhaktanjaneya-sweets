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

const TONE_META: Record<
  ToastTone,
  { Icon: typeof Info; className: string; iconClass: string; badge: string }
> = {
  success: {
    Icon: CheckCircle2,
    className: "border-leaf-600/60 bg-maroon-950 text-cream-50 shadow-xl ring-1 ring-leaf-600/30",
    iconClass: "text-leaf-400",
    badge: "Success",
  },
  error: {
    Icon: XCircle,
    className: "border-maroon-500/80 bg-maroon-950 text-cream-50 shadow-xl ring-1 ring-maroon-500/40",
    iconClass: "text-red-400",
    badge: "Error",
  },
  info: {
    Icon: Info,
    className: "border-gold-400/60 bg-maroon-950 text-cream-50 shadow-xl ring-1 ring-gold-400/30",
    iconClass: "text-gold-300",
    badge: "Notice",
  },
  warning: {
    Icon: AlertTriangle,
    className: "border-saffron-500/70 bg-maroon-950 text-cream-50 shadow-xl ring-1 ring-saffron-500/30",
    iconClass: "text-saffron-400",
    badge: "Warning",
  },
};

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
    <div className="pointer-events-none fixed right-4 bottom-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-md flex-col gap-2.5 sm:right-6 sm:bottom-6">
      {rendered.map((t) => {
        const meta = TONE_META[t.tone];
        const Icon = meta.Icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${meta.className}`}
            role="status"
            aria-live="polite"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Icon size={18} className={meta.iconClass} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm font-bold tracking-tight text-cream-50">
                {t.title || meta.badge}
              </p>
              <div className="mt-0.5 text-xs text-cream-100/90 leading-relaxed font-normal">
                {t.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Close notification"
              className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-cream-100/70 hover:bg-white/15 hover:text-cream-50 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
