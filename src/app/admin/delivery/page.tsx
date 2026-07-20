"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AdminButton, inputClass } from "@/components/admin/ui";
import { toast } from "@/components/ui/toast";
import { apiGet, apiPut } from "@/lib/api/client";
import {
  DEFAULT_SHIPPING_SETTINGS,
  type ShippingSettings,
  type ShippingTier,
} from "@/lib/shipping";
import { formatINR } from "@/lib/utils";

export default function AdminDeliveryPage() {
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<ShippingSettings>("/admin/settings/shipping")
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {
        toast({
          tone: "error",
          title: "Could not load delivery settings",
          message: "Using default shipping thresholds.",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function handleMinOrderChange(val: string) {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSettings((prev) => ({ ...prev, minOrderValue: num }));
  }

  function handleFreeThresholdChange(val: string) {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSettings((prev) => ({ ...prev, freeShippingThreshold: num }));
  }

  function handleAddTier() {
    const newTier: ShippingTier = {
      id: `tier-${Date.now()}`,
      minSubtotal: 0,
      maxSubtotal: 499,
      fee: 50,
    };
    setSettings((prev) => ({
      ...prev,
      tiers: [...prev.tiers, newTier],
    }));
  }

  function handleUpdateTier(id: string, field: keyof ShippingTier, value: unknown) {
    setSettings((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  }

  function handleRemoveTier(id: string) {
    setSettings((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.id !== id),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = await apiPut<ShippingSettings>("/admin/settings/shipping", settings);
      setSettings(data);
      toast({
        tone: "success",
        title: "Delivery settings saved",
        message: "Cart delivery fees and thresholds have been updated live across your store.",
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Please check details and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-maroon-800/10 text-maroon-800">
              <Truck size={22} />
            </span>
            <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">
              Delivery &amp; Shipping Charges
            </h1>
          </div>
          <p className="text-sm text-ink-500">
            Configure minimum order values, delivery fees, and free shipping thresholds for customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            target="_blank"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-cream-300 bg-cream-50 px-4 text-xs font-semibold text-maroon-800 transition-colors hover:bg-cream-100"
          >
            <ExternalLink size={14} /> Cart Preview
          </Link>

          <AdminButton
            onClick={handleSave}
            disabled={saving || loading}
            className="h-11 rounded-full px-6 font-semibold shadow-md"
          >
            <Save size={16} /> {saving ? "Saving…" : "Save Delivery Rules"}
          </AdminButton>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Minimum Order Requirement Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-cream-200 bg-white p-6 shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-maroon-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron-500/10 text-saffron-600">
                <IndianRupee size={18} />
              </span>
              <h2 className="font-serif text-lg font-bold">Minimum Order Requirement</h2>
            </div>
            <p className="text-xs text-ink-500">
              Customers cannot place orders if their cart subtotal is less than this minimum value. Set to 0 to disable.
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                Minimum Order Subtotal (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={settings.minOrderValue}
                  onChange={(e) => handleMinOrderChange(e.target.value)}
                  className={`${inputClass} pl-8 text-base font-bold text-maroon-900`}
                  placeholder="e.g. 200"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-cream-100 p-3.5 text-xs text-ink-600">
            {settings.minOrderValue > 0 ? (
              <p className="flex items-center gap-2 font-medium text-maroon-900">
                <CheckCircle2 size={16} className="text-leaf-600 shrink-0" />
                Orders below <strong>{formatINR(settings.minOrderValue)}</strong> will be blocked with an alert.
              </p>
            ) : (
              <p className="flex items-center gap-2 text-ink-500">
                <AlertCircle size={16} className="text-ink-400 shrink-0" />
                No minimum order limit active. Any cart subtotal can checkout.
              </p>
            )}
          </div>
        </div>

        {/* Free Shipping Threshold Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-cream-200 bg-white p-6 shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-maroon-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf-600/10 text-leaf-600">
                <Truck size={18} />
              </span>
              <h2 className="font-serif text-lg font-bold">Free Shipping Threshold</h2>
            </div>
            <p className="text-xs text-ink-500">
              Orders with subtotals equal to or greater than this threshold automatically qualify for FREE delivery.
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                Free Shipping Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => handleFreeThresholdChange(e.target.value)}
                  className={`${inputClass} pl-8 text-base font-bold text-maroon-900`}
                  placeholder="e.g. 799"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-cream-100 p-3.5 text-xs text-ink-600">
            <p className="flex items-center gap-2 font-medium text-maroon-900">
              <CheckCircle2 size={16} className="text-leaf-600 shrink-0" />
              Orders above <strong>{formatINR(settings.freeShippingThreshold)}</strong> get free shipping automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Tiered Delivery Charge Table */}
      <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-maroon-900">
              Tiered Delivery Charges
            </h2>
            <p className="text-xs text-ink-500">
              Define delivery fees based on cart subtotal ranges (e.g. below ₹499 is ₹50, above ₹799 is Free).
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddTier}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cream-300 bg-cream-50 px-3.5 text-xs font-semibold text-maroon-800 hover:bg-cream-100 transition-colors"
          >
            <Plus size={15} /> Add Fee Rule
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-cream-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50/70 text-xs font-semibold uppercase tracking-wider text-ink-600">
                <th className="px-4 py-3">Min Subtotal (₹)</th>
                <th className="px-4 py-3">Max Subtotal (₹)</th>
                <th className="px-4 py-3">Delivery Charge (₹)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {settings.tiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-cream-50/50">
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={tier.minSubtotal}
                      onChange={(e) =>
                        handleUpdateTier(tier.id, "minSubtotal", Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className={`${inputClass} h-9 w-28 text-xs font-semibold`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={tier.maxSubtotal === null ? "" : tier.maxSubtotal}
                        placeholder="Unlimited"
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                          handleUpdateTier(tier.id, "maxSubtotal", val);
                        }}
                        className={`${inputClass} h-9 w-32 text-xs font-semibold`}
                      />
                      {tier.maxSubtotal === null && (
                        <span className="text-xs font-medium text-leaf-600">
                          (No limit)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={tier.fee}
                        onChange={(e) =>
                          handleUpdateTier(tier.id, "fee", Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        className={`${inputClass} h-9 w-28 text-xs font-bold text-maroon-900`}
                      />
                      {tier.fee === 0 && (
                        <span className="rounded-full bg-leaf-600/10 px-2 py-0.5 text-[11px] font-bold text-leaf-700">
                          FREE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(tier.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-maroon-800/10 hover:text-maroon-700 transition-colors"
                      title="Delete tier"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guidance Card */}
      <div className="rounded-3xl border border-cream-200 bg-cream-100/60 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-600">
            <HelpCircle size={18} />
          </span>
          <div className="text-xs text-ink-600 space-y-1.5">
            <h4 className="font-serif text-sm font-bold text-maroon-900">
              How Shipping Rules Work
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Minimum Order Value:</strong> Orders below this amount cannot proceed to checkout.
              </li>
              <li>
                <strong>Free Delivery Threshold:</strong> Carts with subtotals meeting or exceeding this amount automatically receive <strong>FREE Shipping</strong> (₹0).
              </li>
              <li>
                <strong>Automatic Rules:</strong> Tiered rules are evaluated live during checkout.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
