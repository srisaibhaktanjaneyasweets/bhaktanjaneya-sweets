"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Check,
  Pencil,
  AlertTriangle,
  Phone,
  MessageCircle,
} from "lucide-react";
import {
  SERVICEABLE_STATES,
  citiesForState,
} from "@/lib/constants/serviceable-areas";
import { Combobox } from "@/components/ui/Combobox";
import { config } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";

const selectClass =
  "h-11 w-full rounded-xl border border-cream-300 bg-white px-4 text-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 disabled:cursor-not-allowed disabled:bg-cream-100/60 disabled:opacity-70";

export function DeliveryLocationGate({
  confirmed,
  confirmedState,
  confirmedCity,
  defaultState = "",
  defaultCity = "",
  onConfirm,
  onReset,
}: {
  confirmed: boolean;
  confirmedState?: string;
  confirmedCity?: string;
  defaultState?: string;
  defaultCity?: string;
  onConfirm: (state: string, city: string) => void;
  onReset: () => void;
}) {
  const [stateValue, setStateValue] = useState(defaultState);
  const [cityValue, setCityValue] = useState(defaultCity);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  // Prefill from a serviceable saved address once the customer loads, but never
  // override what the user has started selecting themselves.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (touched || confirmed) return;
    setStateValue(defaultState);
    setCityValue(defaultCity);
  }, [defaultState, defaultCity, touched, confirmed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cities = citiesForState(stateValue);

  function handleContinue() {
    setError("");
    if (!stateValue) {
      setError("Please select your state.");
      return;
    }
    if (!cityValue) {
      setError("Please select your city.");
      return;
    }
    setUnavailable(false);
    onConfirm(stateValue, cityValue);
  }

  if (confirmed) {
    return (
      <section className="rounded-2xl border border-leaf-600/30 bg-leaf-600/5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-600/15 text-leaf-600">
              <Check size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-maroon-900">Delivery available</p>
              <p className="mt-0.5 text-sm text-ink-600">
                {confirmedCity}
                {confirmedCity && confirmedState ? ", " : ""}
                {confirmedState}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-maroon-800 hover:bg-maroon-800/5"
          >
            <Pencil size={14} /> Change
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-cream-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="shrink-0 text-saffron-600" />
        <h2 className="font-serif text-lg font-bold text-maroon-900">
          Select delivery location
        </h2>
      </div>
      <p className="mt-2 text-sm text-ink-600">
        We deliver across{" "}
        <span className="font-medium text-maroon-900">
          Andhra Pradesh &amp; Telangana
        </span>
        . If courier service is unavailable in your area, we&apos;ll arrange
        delivery through APSRTC / TGSRTC Cargo and inform you accordingly.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-maroon-900">
          State *
          <select
            value={stateValue}
            onChange={(e) => {
              setTouched(true);
              setStateValue(e.target.value);
              setCityValue("");
              setUnavailable(false);
              setError("");
            }}
            className={`${selectClass} mt-1.5`}
          >
            <option value="">Select state</option>
            {SERVICEABLE_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="text-sm font-medium text-maroon-900">
          <span className="mb-1.5 block">City *</span>
          <Combobox
            value={cityValue}
            onChange={(c) => {
              setTouched(true);
              setCityValue(c);
              setUnavailable(false);
              setError("");
            }}
            options={cities}
            disabled={!stateValue}
            placeholder={stateValue ? "Type or select your city" : "Select a state first"}
            ariaLabel="Delivery city"
            className={selectClass}
            notListedLabel="My city isn't listed?"
            onNotListed={() => {
              setTouched(true);
              setError("");
              setUnavailable(true);
            }}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-sm font-medium text-maroon-700">{error}</p>
      ) : null}

      {!unavailable ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-maroon-800 px-7 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setUnavailable(true);
            }}
            className="text-sm font-medium text-maroon-700 underline underline-offset-4 hover:text-saffron-600"
          >
            My city isn&apos;t listed?
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-saffron-400/50 bg-saffron-500/10 px-4 py-3 text-sm text-maroon-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-saffron-600" />
            <span>Online courier delivery is not available for this city.</span>
          </div>
          <div className="rounded-xl border border-leaf-600/30 bg-leaf-600/5 p-4">
            <p className="font-semibold text-leaf-600">Good news! 😃</p>
            <p className="mt-1 text-sm text-ink-700">
              Even if courier delivery is unavailable in your city, we may still
              be able to deliver your order through{" "}
              <span className="font-medium text-maroon-900">
                APSRTC / TGSRTC Cargo
              </span>{" "}
              services. Our team will contact you to confirm the best delivery
              option.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <a
                href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700 sm:flex-1"
              >
                <Phone size={16} /> Call now
              </a>
              <a
                href={waLink(
                  `Hello ${config.businessName}! I'd like to check delivery to my city.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#35B664] text-sm font-semibold text-white hover:bg-[#2E9E57] sm:flex-1"
              >
                <MessageCircle size={16} /> WhatsApp us
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUnavailable(false);
              setCityValue("");
            }}
            className="text-sm font-medium text-maroon-700 hover:text-saffron-600"
          >
            Check a different city
          </button>
        </div>
      )}
    </section>
  );
}
