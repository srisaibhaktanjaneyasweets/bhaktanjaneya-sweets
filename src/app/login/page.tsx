"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/context/AuthContext";
import { config } from "@/lib/config";

const inputClass =
  "h-12 w-full rounded-xl border border-cream-300 bg-white px-4 text-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40";

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
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/account";
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loading } = useAuth();
  const googleOAuthEnabled = config.googleOAuthEnabled;

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (mode === "signup") {
        const result = await signUpWithEmail({
          name: name.trim(),
          email: normalizedEmail,
          password,
        });
        if (result.needsVerification) {
          setNotice("Check your email and verify your account before signing in.");
          setMode("login");
          setPassword("");
          setConfirmPassword("");
          return;
        }
      } else {
        await signInWithEmail(normalizedEmail, password);
      }

      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
    }
  }

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
    <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-cream-200 bg-white p-5 shadow-soft sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon-800 text-saffron-400">
        {mode === "login" ? <ShieldCheck size={22} /> : <UserPlus size={22} />}
      </span>

      <h1 className="mt-5 font-serif text-2xl font-bold text-maroon-900">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {mode === "login"
          ? "Use your verified email and password, or continue with Google."
          : "Create your account with a verified email address."}
      </p>

      <div className="mt-5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || !googleOAuthEnabled}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-cream-300 bg-white text-sm font-semibold text-maroon-900 hover:bg-cream-50 disabled:opacity-60"
        >
          <GoogleLogo className="h-4.5 w-4.5" />
          {googleOAuthEnabled ? "Continue with Google" : "Google sign-in unavailable"}
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
        <span className="h-px flex-1 bg-cream-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-cream-200" />
      </div>

      <div className="grid min-w-0 grid-cols-2 rounded-full bg-cream-100 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`h-10 rounded-full ${
            mode === "login" ? "bg-white text-maroon-900 shadow-sm" : "text-ink-500"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`h-10 rounded-full ${
            mode === "signup" ? "bg-white text-maroon-900 shadow-sm" : "text-ink-500"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={submitCredentials} className="mt-5 space-y-4">
        {mode === "signup" && (
          <label className="block text-sm font-medium text-maroon-900">
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={`${inputClass} mt-1.5`}
            />
          </label>
        )}

        <label className="block text-sm font-medium text-maroon-900">
          Email address
          <div className="mt-1.5 flex items-center rounded-xl border border-cream-300 bg-white focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-400/40">
            <span className="pl-4 pr-2 text-ink-500">
              <Mail size={16} />
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              placeholder="you@example.com"
              className="h-12 min-w-0 flex-1 rounded-r-xl bg-transparent pr-4 text-sm focus:outline-none"
            />
          </div>
        </label>

        <label className="block text-sm font-medium text-maroon-900">
          Password
          <div className="mt-1.5 flex items-center rounded-xl border border-cream-300 bg-white focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-400/40">
            <span className="pl-4 pr-2 text-ink-500">
              <Lock size={16} />
            </span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="At least 8 characters"
              className="h-12 min-w-0 flex-1 rounded-r-xl bg-transparent pr-4 text-sm focus:outline-none"
            />
          </div>
        </label>

        {mode === "signup" && (
          <label className="block text-sm font-medium text-maroon-900">
            Confirm password
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Repeat your password"
              className={`${inputClass} mt-1.5`}
            />
          </label>
        )}

        {notice && <p className="rounded-lg bg-leaf-600/10 px-3 py-2 text-sm text-leaf-700">{notice}</p>}
        {error && <p className="text-sm text-maroon-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
        >
          {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-400">
        By continuing you agree to {config.businessName}&apos;s{" "}
        <Link href="/policies/terms" className="underline">
          Terms
        </Link>{" "}
        &amp;{" "}
        <Link href="/policies/privacy" className="underline">
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
      <div className="mx-auto w-full min-w-0 max-w-md py-10 sm:py-20">
        <Suspense fallback={null}>
          <LoginInner />
        </Suspense>
      </div>
    </Container>
  );
}