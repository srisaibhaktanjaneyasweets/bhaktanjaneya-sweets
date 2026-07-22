"use client";

import { useEffect, useState } from "react";
import { ToastCard, type ToastTone } from "./toast";

export function Alert({
  tone = "error",
  title,
  children,
  className = "",
  durationMs = 5000,
}: {
  tone?: "error" | "success" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
  durationMs?: number;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (durationMs > 0) {
      const timer = setTimeout(() => setOpen(false), durationMs);
      return () => clearTimeout(timer);
    }
  }, [durationMs]);

  if (!open) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed right-4 bottom-4 z-[80] w-[calc(100vw-2rem)] max-w-[320px] sm:right-6 sm:bottom-6 sm:w-[380px] sm:max-w-md ${className}`}
    >
      <ToastCard
        tone={tone as ToastTone}
        title={title}
        message={children}
        onDismiss={() => setOpen(false)}
      />
    </div>
  );
}
