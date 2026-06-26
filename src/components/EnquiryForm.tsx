"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/whatsapp";
import { config } from "@/lib/config";

export function EnquiryForm({
  prefix,
  ctaLabel = "Send on WhatsApp",
  messageLabel = "Message",
  messagePlaceholder = "How can we help?",
}: {
  prefix: string;
  ctaLabel?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter your name and a valid phone number.");
      return;
    }
    const body = [
      `Hello ${config.businessName}!`,
      "",
      prefix,
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      message.trim() ? `${messageLabel}: ${message}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n");
    window.open(waLink(body), "_blank", "noopener,noreferrer");
  }

  const field =
    "h-12 w-full rounded-xl border border-cream-300 bg-white px-4 text-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-cream-200 bg-white p-6 shadow-soft"
    >
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={field}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="Phone number"
          className={field}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={messagePlaceholder}
          rows={4}
          className="w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40"
        />
      </div>
      {error && <p className="mt-2 text-sm text-maroon-700">{error}</p>}
      <button
        type="submit"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#35B664] text-sm font-semibold text-white hover:bg-[#2E9E57]"
      >
        <MessageCircle size={18} /> {ctaLabel}
      </button>
    </form>
  );
}
