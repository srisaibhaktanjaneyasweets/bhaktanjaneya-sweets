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
  MapPin,
  X,
  Search,
  RotateCcw,
  Building2,
} from "lucide-react";
import { AdminButton, inputClass } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";
import { apiGet, apiPut } from "@/lib/api/client";
import {
  DEFAULT_SHIPPING_SETTINGS,
  type ShippingSettings,
  type ShippingTier,
} from "@/lib/shipping";
import { DEFAULT_SERVICEABLE_AREAS } from "@/lib/constants/serviceable-areas";
import { getPresetCitiesForState, STATE_DISTRICTS } from "@/lib/constants/india-locations";
import { formatINR } from "@/lib/utils";

export default function AdminDeliveryPage() {
  const [activeTab, setActiveTab] = useState<"shipping" | "locations">("shipping");

  // Shipping Charges & Thresholds State
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Serviceable States & Cities State
  const [areasMap, setAreasMap] = useState<Record<string, string[]>>({});
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [savingAreas, setSavingAreas] = useState(false);
  const [selectedStatePreset, setSelectedStatePreset] = useState("");
  const [newStateName, setNewStateName] = useState("");
  const [cityInputMap, setCityInputMap] = useState<Record<string, string>>({});
  const [locationSearch, setLocationSearch] = useState("");

  // Confirmation Modals State
  const [deleteModalState, setDeleteModalState] = useState<{ open: boolean; stateName: string }>({
    open: false,
    stateName: "",
  });
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    // Load Shipping Settings
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

    // Load Serviceable Areas
    apiGet<Record<string, string[]>>("/admin/settings/serviceable-areas")
      .then((data) => {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setAreasMap(data);
        } else {
          setAreasMap(DEFAULT_SERVICEABLE_AREAS as Record<string, string[]>);
        }
      })
      .catch(() => {
        setAreasMap(DEFAULT_SERVICEABLE_AREAS as Record<string, string[]>);
      })
      .finally(() => setLoadingAreas(false));
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

  async function handleSaveShipping() {
    setSaving(true);
    try {
      const data = await apiPut<ShippingSettings>("/admin/settings/shipping", settings);
      setSettings(data);
      toast({
        tone: "success",
        title: "Delivery Settings Saved",
        message: "Cart delivery fees and thresholds are now live across your store.",
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Save Failed",
        message: error instanceof Error ? error.message : "Please check details and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  // --- Location Management Functions ---

  function handleAddState(stateToAdd?: string) {
    const name = (stateToAdd || newStateName || selectedStatePreset).trim();
    if (!name) return;

    const existingKey = Object.keys(areasMap).find(
      (s) => s.toLowerCase() === name.toLowerCase(),
    );
    if (existingKey) {
      toast({
        tone: "warning",
        title: "State Already Listed",
        message: `"${existingKey}" is already in your serviceable locations list below.`,
      });
      return;
    }

    // Automatically fetch preset cities for this state
    const autoCities = getPresetCitiesForState(name);

    setAreasMap((prev) => ({
      ...prev,
      [name]: autoCities,
    }));

    setNewStateName("");
    setSelectedStatePreset("");

    if (autoCities.length > 0) {
      toast({
        tone: "success",
        title: `Added "${name}" with ${autoCities.length} Cities!`,
        message: `Automatically populated major cities. Click "X" on any unserviceable city to remove it.`,
        durationMs: 5000,
      });
    } else {
      toast({
        tone: "success",
        title: `Added "${name}"`,
        message: `State added. Use the input below to add serviceable cities to ${name}.`,
      });
    }
  }

  function confirmDeleteState() {
    const stateName = deleteModalState.stateName;
    if (!stateName) return;

    setAreasMap((prev) => {
      const next = { ...prev };
      delete next[stateName];
      return next;
    });

    setDeleteModalState({ open: false, stateName: "" });

    toast({
      tone: "info",
      title: "State Removed",
      message: `Removed "${stateName}" from serviceable locations. Click Save to publish.`,
    });
  }

  function handleAddCity(stateName: string) {
    const cityName = (cityInputMap[stateName] || "").trim();
    if (!cityName) return;

    const currentCities = areasMap[stateName] || [];
    const exists = currentCities.some(
      (c) => c.toLowerCase() === cityName.toLowerCase(),
    );

    if (exists) {
      toast({
        tone: "warning",
        title: "City Already Exists",
        message: `"${cityName}" is already listed under ${stateName}.`,
      });
      return;
    }

    setAreasMap((prev) => ({
      ...prev,
      [stateName]: [...(prev[stateName] || []), cityName],
    }));

    setCityInputMap((prev) => ({ ...prev, [stateName]: "" }));

    toast({
      tone: "success",
      title: "City Added",
      message: `Added "${cityName}" to ${stateName}.`,
    });
  }

  function handleRemoveCity(stateName: string, cityName: string) {
    setAreasMap((prev) => ({
      ...prev,
      [stateName]: (prev[stateName] || []).filter(
        (c) => c.toLowerCase() !== cityName.toLowerCase(),
      ),
    }));
  }

  function confirmResetLocations() {
    setAreasMap(DEFAULT_SERVICEABLE_AREAS as Record<string, string[]>);
    setResetModalOpen(false);
    toast({
      tone: "info",
      title: "Locations Reset to Defaults",
      message: "Reset serviceable areas map to standard AP & Telangana defaults. Click Save to publish.",
    });
  }

  async function handleSaveLocations() {
    setSavingAreas(true);
    try {
      const data = await apiPut<Record<string, string[]>>(
        "/admin/settings/serviceable-areas",
        areasMap,
      );
      setAreasMap(data);
      toast({
        tone: "success",
        title: "Serviceable Locations Published Live!",
        message: "Available states and cities are updated live for customer checkout.",
        durationMs: 5000,
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Save Failed",
        message: error instanceof Error ? error.message : "Could not save locations.",
      });
    } finally {
      setSavingAreas(false);
    }
  }

  // Filtered Locations based on search
  const filteredStates = Object.entries(areasMap).filter(([stateName, cities]) => {
    if (!locationSearch.trim()) return true;
    const q = locationSearch.toLowerCase().trim();
    if (stateName.toLowerCase().includes(q)) return true;
    return cities.some((c) => c.toLowerCase().includes(q));
  });

  const totalStatesCount = Object.keys(areasMap).length;
  const totalCitiesCount = Object.values(areasMap).reduce((acc, c) => acc + c.length, 0);

  // Available Preset States that aren't added yet
  const availablePresetStates = Object.keys(STATE_DISTRICTS).filter(
    (st) => !Object.keys(areasMap).some((s) => s.toLowerCase() === st.toLowerCase()),
  );

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
              Delivery &amp; Serviceable Locations
            </h1>
          </div>
          <p className="text-sm text-ink-500">
            Manage delivery fees, minimum order rules, and available states &amp; cities.
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

          {activeTab === "shipping" ? (
            <AdminButton
              onClick={handleSaveShipping}
              disabled={saving || loading}
              className="h-11 rounded-full px-6 font-semibold shadow-md"
            >
              <Save size={16} /> {saving ? "Saving…" : "Save Delivery Rules"}
            </AdminButton>
          ) : (
            <AdminButton
              onClick={handleSaveLocations}
              disabled={savingAreas || loadingAreas}
              className="h-11 rounded-full px-6 font-semibold shadow-md"
            >
              <Save size={16} /> {savingAreas ? "Saving…" : "Save Serviceable Locations"}
            </AdminButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl border border-cream-200 bg-cream-100/60 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("shipping")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all sm:text-sm ${
            activeTab === "shipping"
              ? "bg-white text-maroon-900 shadow-sm"
              : "text-ink-500 hover:text-maroon-800"
          }`}
        >
          <IndianRupee size={16} /> Shipping Charges &amp; Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("locations")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all sm:text-sm ${
            activeTab === "locations"
              ? "bg-white text-maroon-900 shadow-sm"
              : "text-ink-500 hover:text-maroon-800"
          }`}
        >
          <MapPin size={16} /> Serviceable States &amp; Cities ({totalStatesCount} States, {totalCitiesCount} Cities)
        </button>
      </div>

      {/* Tab 1: Shipping Charges & Rules */}
      {activeTab === "shipping" && (
        <div className="space-y-8">
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
        </div>
      )}

      {/* Tab 2: Serviceable States & Cities Management */}
      {activeTab === "locations" && (
        <div className="space-y-8">
          {/* Top Actions: Add New State & Search */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Add New State Card */}
            <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-maroon-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-maroon-800/10 text-maroon-800">
                  <MapPin size={18} />
                </span>
                <h2 className="font-serif text-lg font-bold">Add New Serviceable State</h2>
              </div>
              <p className="text-xs text-ink-500">
                Select a state from the dropdown or type a custom state name. Prominent cities will automatically populate!
              </p>

              {/* Preset Selection Dropdown */}
              {availablePresetStates.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatePreset}
                    onChange={(e) => {
                      setSelectedStatePreset(e.target.value);
                      if (e.target.value) handleAddState(e.target.value);
                    }}
                    className={`${inputClass} text-xs font-semibold`}
                  >
                    <option value="">-- Quick Select Indian State --</option>
                    {availablePresetStates.map((st) => (
                      <option key={st} value={st}>
                        {st} ({STATE_DISTRICTS[st as keyof typeof STATE_DISTRICTS]?.length} cities)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom State Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddState();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="Or type custom state (e.g. Karnataka)"
                  className={`${inputClass} text-xs`}
                />
                <button
                  type="submit"
                  disabled={!newStateName.trim()}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-maroon-800 px-4 text-xs font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-50 transition-colors"
                >
                  <Plus size={16} /> Add State
                </button>
              </form>
            </div>

            {/* Filter / Actions Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-cream-200 bg-white p-6 shadow-soft space-y-4">
              <div className="space-y-2">
                <h2 className="font-serif text-lg font-bold text-maroon-900">Filter Locations</h2>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search state or city name..."
                    className={`${inputClass} pl-10 text-sm`}
                  />
                  {locationSearch && (
                    <button
                      type="button"
                      onClick={() => setLocationSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-cream-200 pt-3">
                <span className="text-xs font-medium text-ink-500">
                  Showing {filteredStates.length} of {totalStatesCount} states
                </span>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon-800 hover:text-saffron-600 transition-colors"
                >
                  <RotateCcw size={14} /> Reset to standard defaults
                </button>
              </div>
            </div>
          </div>

          {/* States and Cities Grid */}
          <div className="space-y-6">
            {filteredStates.map(([stateName, cities]) => (
              <div
                key={stateName}
                className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft space-y-4"
              >
                {/* State Card Header */}
                <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/10 text-saffron-600 font-bold">
                      <Building2 size={18} />
                    </span>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-maroon-900">
                        {stateName}
                      </h3>
                      <p className="text-xs text-ink-500">
                        {cities.length} {cities.length === 1 ? "serviceable city" : "serviceable cities"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteModalState({ open: true, stateName })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-maroon-800/20 bg-maroon-800/5 px-3 py-1.5 text-xs font-semibold text-maroon-800 hover:bg-maroon-800 hover:text-cream-50 transition-colors"
                  >
                    <Trash2 size={14} /> Remove State
                  </button>
                </div>

                {/* Cities Pill Badges List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                      Active Cities ({cities.length})
                    </label>
                    <span className="text-[11px] text-ink-400 italic">
                      Click X on any city badge to mark as unserviceable
                    </span>
                  </div>

                  {cities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {cities.map((city) => (
                        <span
                          key={city}
                          className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-cream-50 px-3.5 py-1.5 text-xs font-bold text-maroon-900 shadow-sm transition-all hover:border-maroon-400"
                        >
                          {city}
                          <button
                            type="button"
                            onClick={() => handleRemoveCity(stateName, city)}
                            aria-label={`Remove ${city}`}
                            className="rounded-full text-ink-400 hover:bg-maroon-800/15 hover:text-maroon-800 p-0.5 transition-colors"
                            title={`Remove ${city} from ${stateName}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50/50 p-4 text-center text-xs text-ink-500">
                      No cities added to {stateName} yet. Use the form below to add serviceable cities.
                    </div>
                  )}
                </div>

                {/* Add City Input for this State */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddCity(stateName);
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-cream-100"
                >
                  <input
                    type="text"
                    value={cityInputMap[stateName] || ""}
                    onChange={(e) =>
                      setCityInputMap((prev) => ({
                        ...prev,
                        [stateName]: e.target.value,
                      }))
                    }
                    placeholder={`Add city to ${stateName} (e.g. Bengaluru)`}
                    className={`${inputClass} text-xs`}
                  />
                  <button
                    type="submit"
                    disabled={!(cityInputMap[stateName] || "").trim()}
                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-cream-300 bg-cream-50 px-3 text-xs font-semibold text-maroon-800 hover:bg-cream-100 disabled:opacity-50 transition-colors"
                  >
                    <Plus size={14} /> Add City
                  </button>
                </form>
              </div>
            ))}

            {filteredStates.length === 0 && (
              <div className="rounded-3xl border border-dashed border-cream-300 bg-white p-12 text-center text-ink-500 space-y-3">
                <MapPin size={32} className="mx-auto text-ink-300" />
                <h4 className="font-serif text-lg font-bold text-maroon-900">No matching locations found</h4>
                <p className="text-xs text-ink-500">
                  Try searching for a different city or state, or add a new state above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal Popup: Remove State */}
      <ConfirmDialog
        open={deleteModalState.open}
        title={`Remove ${deleteModalState.stateName}?`}
        description={`Are you sure you want to remove ${deleteModalState.stateName} and all its cities from serviceable locations? Customers from this state will no longer be able to place orders.`}
        confirmLabel="Yes, Remove State"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setDeleteModalState({ open: false, stateName: "" })}
        onConfirm={confirmDeleteState}
      />

      {/* Confirmation Modal Popup: Reset to Defaults */}
      <ConfirmDialog
        open={resetModalOpen}
        title="Reset Locations to Standard Defaults?"
        description="This will restore the serviceable locations map back to standard Andhra Pradesh & Telangana default cities. Any custom states/cities you added will be reset."
        confirmLabel="Reset Locations"
        cancelLabel="Keep Current List"
        tone="danger"
        onCancel={() => setResetModalOpen(false)}
        onConfirm={confirmResetLocations}
      />

      {/* Guidance Card */}
      <div className="rounded-3xl border border-cream-200 bg-cream-100/60 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-600">
            <HelpCircle size={18} />
          </span>
          <div className="text-xs text-ink-600 space-y-1.5">
            <h4 className="font-serif text-sm font-bold text-maroon-900">
              How Delivery &amp; Location Rules Work
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Auto City Population:</strong> Adding any state (e.g. Karnataka, Tamil Nadu, Maharashtra) automatically populates prominent cities. You can easily click the <strong>X</strong> on any city to mark it as unserviceable.
              </li>
              <li>
                <strong>Immediate Storefront Sync:</strong> Adding new states or cities immediately makes them selectable in customer delivery location dropdowns and pincode lookups.
              </li>
              <li>
                <strong>SQL Migration Script:</strong> A database script is available in <code>supabase/serviceable_areas.sql</code> to create the <code>site_settings</code> table and default rows in Supabase.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
