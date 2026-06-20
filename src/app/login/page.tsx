"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/context/AuthContext";
import { config } from "@/lib/config";

const inputClass =
  "h-12 w-full rounded-xl border border-cream-300 bg-white px-4 text-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/account";
  const { sendOtp, confirmOtp, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError("");
    setCode("");
  }

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (mode === "signup" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      const res = await sendOtp(digits, mode);
      setDevCode(res.devCode);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code. Please try again.");
    }
  }

  async function resendCode() {
    setError("");
    try {
      const res = await sendOtp(phone.replace(/\D/g, ""), mode, true);
      setDevCode(res.devCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code. Please try again.");
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await confirmOtp(
        phone.replace(/\D/g, ""),
        code.trim(),
        mode,
        mode === "signup" ? { name: name.trim(), email: email.trim() } : undefined,
      );
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    }
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-cream-200 bg-white p-5 shadow-soft sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon-800 text-saffron-400">
        {step === "phone" ? <Phone size={22} /> : <ShieldCheck size={22} />}
      </span>

      {step === "phone" ? (
        <form onSubmit={submitPhone} className="mt-5">
          <h1 className="font-serif text-2xl font-bold text-maroon-900">
            {mode === "login" ? "Login" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {mode === "login"
              ? "Welcome back. Verify your number to view orders."
              : "Tell us the basics, then verify your number with OTP."}
          </p>

          <div className="mt-5 grid min-w-0 grid-cols-2 rounded-full bg-cream-100 p-1 text-sm font-semibold">
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

          {mode === "signup" && (
            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-maroon-900">
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block text-sm font-medium text-maroon-900">
                Email address
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                  placeholder="you@example.com"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
            </div>
          )}

          <label className="mt-6 block text-sm font-medium text-maroon-900">
            Phone number
          </label>
          <div className="mt-1.5 flex min-w-0 items-center rounded-xl border border-cream-300 bg-white focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-400/40">
            <span className="pl-4 pr-2 text-sm text-ink-500">+91</span>
            <input
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="tel"
              placeholder="98765 43210"
              className="h-12 min-w-0 flex-1 rounded-r-xl bg-transparent pr-4 text-sm focus:outline-none"
            />
          </div>
          {error && <p className="mt-2 text-sm text-maroon-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
          >
            {loading ? "Sending..." : mode === "login" ? "Send login OTP" : "Send signup OTP"}
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-5">
          <h1 className="font-serif text-2xl font-bold text-maroon-900">
            Enter the code
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Sent to +91 {phone}.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              className="font-medium text-maroon-700 hover:text-saffron-600"
            >
              Change
            </button>
          </p>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={6}
            placeholder="------"
            className="mt-6 h-14 w-full rounded-xl border border-cream-300 bg-white text-center text-2xl font-bold tracking-[0.4em] text-maroon-900 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40"
          />
          {devCode && (
            <p className="mt-2 rounded-lg bg-cream-100 px-3 py-2 text-center text-xs text-ink-500">
              Demo mode — use code{" "}
              <span className="font-bold text-maroon-800">{devCode}</span>
            </p>
          )}
          {error && <p className="mt-2 text-sm text-maroon-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
          >
            {loading ? "Verifying..." : mode === "login" ? "Login" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => void resendCode()}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-saffron-600 disabled:opacity-60"
          >
            <ArrowLeft size={14} /> Resend code
          </button>
        </form>
      )}

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
