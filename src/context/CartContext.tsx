"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "bas_cart";
const NOTES_KEY = "bas_cart_notes";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  /** Optional order notes, shared between the cart drawer and checkout. */
  notes: string;
  setNotes: (notes: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [notes, setNotesState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Hydration: intentionally setting state from localStorage
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
      const savedNotes = window.localStorage.getItem(NOTES_KEY);
      if (savedNotes) setNotesState(savedNotes);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(NOTES_KEY, notes);
  }, [notes, hydrated]);

  const setNotes = useCallback((next: string) => setNotesState(next), []);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.variantId === item.variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
    // Only slide the cart open on desktop. On mobile the drawer is full-screen,
    // so auto-opening it on every add interrupts anyone adding several items;
    // there we rely on the inline "Added" button state + the header cart badge.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches
    ) {
      setOpen(true);
    }
  }, []);

  const remove = useCallback(
    (variantId: string) =>
      setItems((prev) => prev.filter((x) => x.variantId !== variantId)),
    [],
  );

  const setQty = useCallback(
    (variantId: string, qty: number) =>
      setItems((prev) =>
        prev.map((x) =>
          x.variantId === variantId ? { ...x, quantity: Math.max(1, qty) } : x,
        ),
      ),
    [],
  );

  const clear = useCallback(() => {
    setItems([]);
    setNotesState("");
  }, []);

  const count = useMemo(
    () => items.reduce((s, x) => s + x.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((s, x) => s + x.price * x.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, count, subtotal, add, remove, setQty, clear, isOpen, setOpen, notes, setNotes }),
    [items, count, subtotal, add, remove, setQty, clear, isOpen, notes, setNotes],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
