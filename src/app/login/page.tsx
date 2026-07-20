"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/context/AuthContext";
import { config } from "@/lib/config";

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/account";
  const { signInWithGoogle, loading } = useAuth();
  const googleOAuthEnabled = config.googleOAuthEnabled;

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleGoogleSignIn() {
    setError("");
    setNotice("");
    if (!googleOAuthEnabled) {
      setNotice("Google sign-in is not enabled for this deployment yet.");
      return;
    }
    try {
      await signInWithGoogle(`/login/complete-profile?next=${encodeURIComponent(redirect)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed.";
      setError(
        /provider is not enabled|unsupported provider/i.test(message)
          ? "Google sign-in is not enabled in the Supabase project settings yet."
          : message,
      );
    }
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-cream-200 bg-white p-6 text-center shadow-soft sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maroon-800 text-saffron-400 shadow-sm">
        <ShieldCheck size={28} />
      </span>

      <h1 className="mt-5 font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">
        Sign in to {config.businessName}
      </h1>
      <p className="mt-2 text-sm text-ink-600 max-w-sm mx-auto">
        Sign in with your Google account to manage your profile, track your orders, and checkout quickly.
      </p>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || !googleOAuthEnabled}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-cream-300 bg-white text-base font-semibold text-maroon-900 shadow-sm hover:bg-cream-50 transition-colors disabled:opacity-60"
        >
          <GoogleLogo className="h-5 w-5" />
          {loading ? "Redirecting to Google..." : googleOAuthEnabled ? "Continue with Google" : "Google sign-in unavailable"}
        </button>
      </div>

      {notice && <p className="mt-4 rounded-xl bg-leaf-600/10 p-3 text-sm font-medium text-leaf-700">{notice}</p>}
      {error && <p className="mt-4 rounded-xl bg-maroon-800/10 p-3 text-sm font-medium text-maroon-800">{error}</p>}

      <p className="mt-8 text-center text-xs text-ink-400">
        By continuing you agree to {config.businessName}&apos;s{" "}
        <Link href="/policies/terms" className="underline hover:text-maroon-800">
          Terms
        </Link>{" "}
        &amp;{" "}
        <Link href="/policies/privacy" className="underline hover:text-maroon-800">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Container>
      <div className="mx-auto w-full min-w-0 max-w-md py-12 sm:py-24">
        <Suspense fallback={null}>
          <LoginInner />
        </Suspense>
      </div>
    </Container>
  );
}