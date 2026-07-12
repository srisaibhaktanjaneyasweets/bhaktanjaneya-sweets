"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isCompleteAddress } from "@/lib/address";
import { supabasePublic } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";

export type AuthMode = "login" | "signup";

export interface SignupDetails {
  name: string;
  email: string;
  password: string;
}

function cleanPhone(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "").trim() : "";
}

function customerFromUser(user: User): Customer {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const savedAddress = metadata.savedAddress;

  return {
    id: user.id,
    phone: cleanPhone(metadata.phone ?? user.phone),
    name: typeof metadata.name === "string" ? metadata.name : undefined,
    email: typeof user.email === "string" ? user.email : undefined,
    savedAddress: isCompleteAddress(savedAddress as Customer["savedAddress"])
      ? (savedAddress as Customer["savedAddress"])
      : undefined,
    createdAt: user.created_at,
  };
}

interface AuthContextValue {
  customer: Customer | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (details: SignupDetails) => Promise<{ needsVerification: boolean }>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  updateName: (name: string) => void;
  updateCustomer: (patch: Partial<Customer>) => Promise<Customer>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    supabasePublic.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setCustomer(data.session?.user ? customerFromUser(data.session.user) : null);
      })
      .catch(() => {
        if (active) setCustomer(null);
      });

    const { data } = supabasePublic.auth.onAuthStateChange((_event, session) => {
      setCustomer(session?.user ? customerFromUser(session.user) : null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Sign in failed.");
      if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
        await supabasePublic.auth.signOut();
        throw new Error("Please verify your email before signing in.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (details: SignupDetails) => {
    setLoading(true);
    try {
      const { data, error } = await supabasePublic.auth.signUp({
        email: details.email,
        password: details.password,
        options: {
          data: { name: details.name },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login?verified=1`
              : undefined,
        },
      });
      if (error) throw error;

      const needsVerification = !data.session || !data.user?.email_confirmed_at;
      if (needsVerification) {
        await supabasePublic.auth.signOut();
        return { needsVerification: true };
      }

      if (data.user) setCustomer(customerFromUser(data.user));
      return { needsVerification: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    setLoading(true);
    try {
      const resolvedRedirectTo =
        redirectTo && typeof window !== "undefined"
          ? new URL(redirectTo, window.location.origin).toString()
          : redirectTo;
      const { error } = await supabasePublic.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            resolvedRedirectTo ??
            (typeof window !== "undefined" ? `${window.location.origin}/account` : undefined),
        },
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateName = useCallback((name: string) => {
    setCustomer((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const updateCustomer = useCallback(async (patch: Partial<Customer>) => {
    const { data, error } = await supabasePublic.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("You must be signed in to update your profile.");

    const currentMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const nextMetadata: Record<string, unknown> = {
      ...currentMetadata,
      ...(patch.name !== undefined ? { name: patch.name.trim() || undefined } : {}),
      ...(patch.phone !== undefined ? { phone: cleanPhone(patch.phone) || undefined } : {}),
      ...(patch.savedAddress !== undefined ? { savedAddress: patch.savedAddress } : {}),
    };

    const { data: updated, error: updateError } = await supabasePublic.auth.updateUser({
      data: nextMetadata,
    });
    if (updateError) throw updateError;

    const nextCustomer = updated.user ? customerFromUser(updated.user) : customerFromUser(data.user);
    setCustomer(nextCustomer);
    return nextCustomer;
  }, []);

  const logout = useCallback(async () => {
    await supabasePublic.auth.signOut();
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({ customer, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, updateName, updateCustomer, logout }),
    [customer, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, updateName, updateCustomer, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}