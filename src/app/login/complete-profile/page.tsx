"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Phone, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/context/AuthContext";

function CompleteProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const { customer, loading, updateCustomer } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customer) return;
    // The authenticated profile is loaded asynchronously; hydrate the form once
    // it becomes available so the customer can correct either value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(customer.name ?? "");
    setPhone(customer.phone ?? "");
    if (customer.name && customer.phone) {
      router.replace(next);
    }
  }, [customer, next, router]);

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const nextName = name.trim();
    const nextPhone = phone.replace(/\D/g, "").trim();

    if (!nextName) {
      setError("Please confirm your full name.");
      return;
    }
    if (!/^\d{10}$/.test(nextPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSaving(true);
    try {
      await updateCustomer({ name: nextName, phone: nextPhone });
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details.");
    } finally {
      setSaving(false);
    }
  }

  if (!customer && !loading) {
    return (
      <div className="w-full rounded-3xl border border-cream-200 bg-white p-5 shadow-soft sm:p-8">
        <p className="text-sm text-ink-500">
          Please sign in again to confirm your details.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-cream-200 bg-white p-5 shadow-soft sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon-800 text-saffron-400">
          <CheckCircle2 size={22} />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900">
            Confirm your details
          </h1>
          <p className="text-sm text-ink-500">
            We need your name and phone number before you continue.
          </p>
        </div>
      </div>

      <form onSubmit={submitProfile} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-maroon-900">
          Email address
          <div className="mt-1.5 flex items-center rounded-xl border border-cream-300 bg-cream-50">
            <span className="pl-4 pr-2 text-ink-500">
              <Mail size={16} />
            </span>
            <input
              readOnly
              value={customer?.email ?? ""}
              className="h-12 min-w-0 flex-1 rounded-r-xl bg-transparent pr-4 text-sm text-ink-600 focus:outline-none"
            />
          </div>
        </label>

        <label className="block text-sm font-medium text-maroon-900">
          Full name
          <div className="mt-1.5 flex items-center rounded-xl border border-cream-300 bg-white focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-400/40">
            <span className="pl-4 pr-2 text-ink-500">
              <User size={16} />
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="h-12 min-w-0 flex-1 rounded-r-xl bg-transparent pr-4 text-sm focus:outline-none"
            />
          </div>
        </label>

        <label className="block text-sm font-medium text-maroon-900">
          Phone number
          <div className="mt-1.5 flex items-center rounded-xl border border-cream-300 bg-white focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-400/40">
            <span className="pl-4 pr-2 text-ink-500">
              <Phone size={16} />
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              placeholder="10-digit phone number"
              className="h-12 min-w-0 flex-1 rounded-r-xl bg-transparent pr-4 text-sm focus:outline-none"
            />
          </div>
        </label>

        <p className="text-xs text-ink-400">
          We use your phone number for order updates, delivery coordination, and support.
        </p>

        {error && <p className="text-sm text-maroon-700">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex h-12 w-full items-center justify-center rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Confirm and continue"}
        </button>
      </form>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Container>
      <div className="mx-auto w-full max-w-md py-10 sm:py-20">
        <Suspense fallback={null}>
          <CompleteProfileInner />
        </Suspense>
      </div>
    </Container>
  );
}
