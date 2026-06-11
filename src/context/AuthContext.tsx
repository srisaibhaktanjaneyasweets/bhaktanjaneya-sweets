"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Customer } from "@/lib/types";
import { requestOtp, verifyOtp } from "@/lib/api/auth";

const STORAGE_KEY = "bas_session";

function isRealSession(value: unknown): value is { token?: string; customer: Customer } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { token?: string }).token === "string" &&
    ((value as { token?: string }).token ?? "").includes(".")
  );
}

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<{ devCode?: string }>;
  confirmOtp: (phone: string, code: string) => Promise<void>;
  updateName: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!isRealSession(parsed)) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomer((parsed as { customer?: Customer }).customer ?? null);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const persist = useCallback((session: { token?: string; customer: Customer } | null) => {
    const nextCustomer = session?.customer ?? null;
    setCustomer(nextCustomer);
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      return await requestOtp(phone);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmOtp = useCallback(
    async (phone: string, code: string) => {
      setLoading(true);
      try {
        const session = await verifyOtp(phone, code);
        const c =
          session.customer ?? {
            id: `cus_${phone}`,
            phone,
            createdAt: new Date().toISOString(),
          };
        persist({ token: session.token, customer: c });
      } finally {
        setLoading(false);
      }
    },
    [persist],
  );

  const updateName = useCallback((name: string) => {
    setCustomer((prev) => {
      if (!prev) return prev;
      const next = { ...prev, name };
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { token?: string }) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, customer: next }));
      return next;
    });
  }, []);

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ customer, loading, sendOtp, confirmOtp, updateName, logout }),
    [customer, loading, sendOtp, confirmOtp, updateName, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
