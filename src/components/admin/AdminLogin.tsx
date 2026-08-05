"use client";

import { useState } from "react";
import { ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { config } from "@/lib/config";
import { inputClass } from "./ui";

export function AdminLogin() {
  const { login, loading } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md rounded-3xl border border-cream-200 bg-white p-7 shadow-soft sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon-800 text-saffron-400">
          <ShieldCheck size={22} />
        </span>
        <h1 className="mt-5 font-serif text-2xl font-bold text-maroon-900">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {config.businessName} store dashboard
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-maroon-900">
              Email
            </label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-maroon-900">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass + " pr-10"}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-ink-500 hover:text-maroon-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-ink-500">Use your admin credentials.</p>
          </div>

          {error && <p className="text-sm text-maroon-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
}
