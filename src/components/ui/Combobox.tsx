"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible searchable select (combobox). Shows a text input the user can type
 * into to filter `options`, plus a clickable dropdown list. Keyboard: ArrowUp/
 * Down to move, Enter to pick, Escape to close. Falls back to showing the full
 * list when the query equals the current value, so it also works as a plain
 * dropdown.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  ariaLabel,
  emptyText = "No matching city",
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Keep the visible text in sync with the committed value when not editing.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setQuery(value);
  }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close + revert the query when clicking outside.
  useEffect(() => {
    function onDocPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === value.toLowerCase()) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, value, options]);

  function commit(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[active]) {
        e.preventDefault();
        commit(filtered[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(value);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={(e) => {
          if (disabled) return;
          setOpen(true);
          e.target.select();
        }}
        onKeyDown={onKeyDown}
        className={cn(className, "pr-9")}
      />
      <ChevronDown
        size={18}
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-transform",
          open && "rotate-180",
        )}
      />
      {open && !disabled ? (
        filtered.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-56 w-full overflow-auto overscroll-contain rounded-xl border border-cream-300 bg-white py-1 shadow-card"
          >
            {filtered.map((option, i) => (
              <li
                key={option}
                role="option"
                aria-selected={option === value}
                onPointerDown={(e) => {
                  e.preventDefault();
                  commit(option);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 px-4 py-2 text-sm",
                  i === active ? "bg-saffron-500/10 text-maroon-900" : "text-ink-700",
                )}
              >
                <span>{option}</span>
                {option === value ? (
                  <Check size={15} className="shrink-0 text-leaf-600" />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm text-ink-500 shadow-card">
            {emptyText}
          </div>
        )
      ) : null}
    </div>
  );
}
