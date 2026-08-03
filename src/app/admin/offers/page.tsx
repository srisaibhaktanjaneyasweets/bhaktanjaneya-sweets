"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BadgePercent, RefreshCw, Key, Filter, Calendar } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import {
  AdminButton,
  EmptyState,
  Field,
  Modal,
  Toggle,
  inputClass,
} from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { formatINR, uid } from "@/lib/utils";
import type { Offer, OfferType } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";
import { apiGet, apiPost } from "@/lib/api/client";

const TYPE_LABEL: Record<OfferType, string> = {
  percent: "% off",
  flat: "Flat ₹ off",
  free_shipping: "Free shipping",
};

function offerValueLabel(o: Offer): string {
  if (o.type === "percent") return `${o.value}% off`;
  if (o.type === "flat") return `${formatINR(o.value)} off`;
  return "Free shipping";
}

function offerValueLabelCustom(o: { type: string; value: number }): string {
  if (o.type === "percent") return `${o.value}% off`;
  if (o.type === "flat") return `${formatINR(o.value)} off`;
  return "Free shipping";
}

function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "STORY-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Custom Coupon Editor Modal Component
function CustomCouponEditor({
  coupon,
  onSave,
  onClose,
}: {
  coupon: any | null;
  onSave: (c: any) => void;
  onClose: () => void;
}) {
  const isNew = !coupon;
  
  const defaultStarts = new Date().toISOString().slice(0, 10);
  const defaultEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [draft, setDraft] = useState<any>(
    coupon ?? {
      code: "",
      type: "percent",
      value: 10,
      maxUses: 1,
      usesCount: 0,
      startsAt: defaultStarts,
      endsAt: defaultEnds,
      allowedPhone: "",
      allowedEmail: "",
      active: true,
    },
  );
  
  const [error, setError] = useState("");

  function handleGenerateCode() {
    setDraft((d: any) => ({ ...d, code: generateRandomCode() }));
  }

  function save() {
    const code = draft.code.trim().toUpperCase();
    if (!code) return setError("A coupon code is required.");
    if (draft.type !== "free_shipping" && draft.value <= 0) {
      return setError("Discount value must be greater than zero.");
    }
    if (Number(draft.maxUses) <= 0) {
      return setError("Number of uses must be greater than zero.");
    }

    onSave({
      ...draft,
      code,
      value: draft.type === "free_shipping" ? 0 : Number(draft.value),
      maxUses: Number(draft.maxUses),
      allowedPhone: draft.allowedPhone ? String(draft.allowedPhone).trim().replace(/\D/g, "") : undefined,
      allowedEmail: draft.allowedEmail ? String(draft.allowedEmail).trim().toLowerCase() : undefined,
    });
  }

  return (
    <Modal
      title={isNew ? "Generate Story Coupon" : "Edit Story Coupon"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save}>{isNew ? "Generate" : "Save"}</AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Field label="Coupon code">
              <input
                className={`${inputClass} uppercase`}
                value={draft.code}
                onChange={(e) => setDraft((d: any) => ({ ...d, code: e.target.value }))}
                placeholder="STORY-XXXXXX"
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={handleGenerateCode}
            className="h-10 px-3 flex items-center justify-center gap-1.5 rounded-xl border border-maroon-800/30 bg-maroon-50 text-xs font-bold text-maroon-900 hover:bg-maroon-100 transition-colors shrink-0 cursor-pointer"
          >
            <Key size={14} /> Generate Code
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select
              className={inputClass}
              value={draft.type}
              onChange={(e) =>
                setDraft((d: any) => ({ ...d, type: e.target.value as OfferType }))
              }
            >
              <option value="percent">Percent off</option>
              <option value="flat">Flat ₹ off</option>
              <option value="free_shipping">Free shipping</option>
            </select>
          </Field>

          {draft.type !== "free_shipping" && (
            <Field
              label={draft.type === "percent" ? "Percent (0–100)" : "Amount (₹)"}
            >
              <input
                className={inputClass}
                type="number"
                min={0}
                value={draft.value || ""}
                onChange={(e) =>
                  setDraft((d: any) => ({ ...d, value: Number(e.target.value) }))
                }
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Number of uses (Max uses)">
            <input
              className={inputClass}
              type="number"
              min={1}
              value={draft.maxUses}
              onChange={(e) =>
                setDraft((d: any) => ({ ...d, maxUses: Number(e.target.value) }))
              }
            />
          </Field>

          <Field label="Uses count (Used so far)" hint="Change only if resetting.">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={draft.usesCount}
              onChange={(e) =>
                setDraft((d: any) => ({ ...d, usesCount: Number(e.target.value) }))
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Starts (optional)">
            <input
              className={inputClass}
              type="date"
              value={draft.startsAt?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setDraft((d: any) => ({
                  ...d,
                  startsAt: e.target.value || undefined,
                }))
              }
            />
          </Field>

          <Field label="Ends / Expiry (default 1 month)">
            <input
              className={inputClass}
              type="date"
              value={draft.endsAt?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setDraft((d: any) => ({
                  ...d,
                  endsAt: e.target.value || undefined,
                }))
              }
            />
          </Field>
        </div>

        <div className="border-t border-cream-100 pt-4 space-y-4">
          <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider">
            Restrictions (Optional)
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Restrict to Phone Number">
              <input
                className={inputClass}
                value={draft.allowedPhone ?? ""}
                onChange={(e) => setDraft((d: any) => ({ ...d, allowedPhone: e.target.value }))}
                placeholder="e.g. 9876543210"
              />
            </Field>

            <Field label="Restrict to Email ID">
              <input
                className={inputClass}
                type="email"
                value={draft.allowedEmail ?? ""}
                onChange={(e) => setDraft((d: any) => ({ ...d, allowedEmail: e.target.value }))}
                placeholder="e.g. customer@gmail.com"
              />
            </Field>
          </div>
        </div>

        <Toggle
          checked={draft.active}
          onChange={(v) => setDraft((d: any) => ({ ...d, active: v }))}
          label={draft.active ? "Active" : "Inactive"}
        />

        {error ? <p className="text-sm text-maroon-700">{error}</p> : null}
      </div>
    </Modal>
  );
}

// Standard Offer Editor Modal Component
function OfferEditor({
  offer,
  onSave,
  onClose,
}: {
  offer: Offer | null;
  onSave: (o: Offer) => void;
  onClose: () => void;
}) {
  const isNew = !offer;
  const [draft, setDraft] = useState<Offer>(
    offer ?? {
      id: uid("off"),
      code: "",
      title: "",
      description: "",
      type: "percent",
      value: 10,
      minSubtotal: undefined,
      active: true,
    },
  );
  const [error, setError] = useState("");

  function save() {
    const code = draft.code.trim().toUpperCase();
    const title = draft.title.trim();
    if (!code) return setError("A coupon code is required.");
    if (!title) return setError("A title is required.");
    if (draft.type !== "free_shipping" && draft.value <= 0)
      return setError("Enter a discount value greater than zero.");

    onSave({
      ...draft,
      code,
      title,
      description: draft.description?.trim() || undefined,
      value: draft.type === "free_shipping" ? 0 : Number(draft.value),
      minSubtotal: draft.minSubtotal ? Number(draft.minSubtotal) : undefined,
    });
  }

  return (
    <Modal
      title={isNew ? "Add Offer" : "Edit Offer"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save}>{isNew ? "Create" : "Save"}</AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Coupon code">
            <input
              className={`${inputClass} uppercase`}
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
              placeholder="BAS10"
            />
          </Field>

          <Field label="Type">
            <select
              className={inputClass}
              value={draft.type}
              onChange={(e) =>
                setDraft((d) => ({ ...d, type: e.target.value as OfferType }))
              }
            >
              <option value="percent">Percent off</option>
              <option value="flat">Flat ₹ off</option>
              <option value="free_shipping">Free shipping</option>
            </select>
          </Field>
        </div>

        <Field label="Title">
          <input
            className={inputClass}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="10% off your order"
          />
        </Field>

        <Field label="Description">
          <input
            className={inputClass}
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="Save 10% on orders above ₹500."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          {draft.type !== "free_shipping" && (
            <Field
              label={draft.type === "percent" ? "Percent (0–100)" : "Amount (₹)"}
            >
              <input
                className={inputClass}
                type="number"
                min={0}
                value={draft.value || ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, value: Number(e.target.value) }))
                }
              />
            </Field>
          )}

          <Field label="Min. subtotal (₹)" hint="Leave blank for none.">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={draft.minSubtotal ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  minSubtotal: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Starts (optional)">
            <input
              className={inputClass}
              type="date"
              value={draft.startsAt?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  startsAt: e.target.value || undefined,
                }))
              }
            />
          </Field>

          <Field label="Ends (optional)">
            <input
              className={inputClass}
              type="date"
              value={draft.endsAt?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  endsAt: e.target.value || undefined,
                }))
              }
            />
          </Field>
        </div>

        <Toggle
          checked={draft.active}
          onChange={(v) => setDraft((d) => ({ ...d, active: v }))}
          label={draft.active ? "Active" : "Inactive"}
        />

        {error ? <p className="text-sm text-maroon-700">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default function AdminOffersPage() {
  const { offers, saveOffer, deleteOffer } = useAdmin();
  const [activeTab, setActiveTab] = useState<"standard" | "custom">("standard");

  // Standard Offer states
  const [editing, setEditing] = useState<Offer | null>(null);
  const [creating, setCreating] = useState(false);

  // Custom Coupon states
  const [customCoupons, setCustomCoupons] = useState<any[]>([]);
  const [editingCustom, setEditingCustom] = useState<any | null>(null);
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<"standard" | "custom">("standard");

  // Load custom coupons on mount
  useEffect(() => {
    fetchCustomCoupons();
  }, []);

  async function fetchCustomCoupons() {
    setLoadingCustom(true);
    try {
      const data = await apiGet<any[]>("/admin/settings/custom-coupons");
      setCustomCoupons(data || []);
    } catch {
      toast({
        tone: "error",
        title: "Load failed",
        message: "Could not fetch custom coupons list.",
      });
    } finally {
      setLoadingCustom(false);
    }
  }

  async function handleSaveCustomCoupon(coupon: any) {
    try {
      const newList = await apiPost<any[]>("/admin/settings/custom-coupons", {
        action: "save",
        coupon,
      });
      setCustomCoupons(newList || []);
      setEditingCustom(null);
      setCreatingCustom(false);
      toast({
        tone: "success",
        title: "Coupon Saved",
        message: `Custom coupon code ${coupon.code} configured successfully.`,
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Error saving custom coupon.",
      });
    }
  }

  function requestDelete(o: Offer) {
    setConfirmId(o.id);
    setConfirmCode(o.code);
    setConfirmType("standard");
    setConfirmOpen(true);
  }

  function requestDeleteCustom(c: any) {
    setConfirmId(c.code);
    setConfirmCode(c.code);
    setConfirmType("custom");
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    const id = confirmId;
    const code = confirmCode;
    setConfirmOpen(false);

    try {
      if (confirmType === "standard") {
        await deleteOffer(id);
        toast({
          tone: "success",
          title: "Offer deleted",
          message: code ? `Offer ${code} removed.` : "Offer removed.",
        });
      } else {
        const newList = await apiPost<any[]>("/admin/settings/custom-coupons", {
          action: "delete",
          code: id,
        });
        setCustomCoupons(newList || []);
        toast({
          tone: "success",
          title: "Coupon deleted",
          message: `Custom coupon ${code} removed successfully.`,
        });
      }
    } catch (err) {
      toast({
        tone: "error",
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setConfirmId(null);
      setConfirmCode(null);
    }
  }

  function getCouponStatus(c: any): { label: string; tone: "leaf" | "saffron" | "muted" | "maroon" } {
    if (!c.active) return { label: "Inactive", tone: "muted" };
    const now = new Date();
    if (c.endsAt && new Date(c.endsAt) < now) return { label: "Expired", tone: "maroon" };
    if (c.usesCount >= c.maxUses) return { label: "Used", tone: "muted" };
    if (c.usesCount === 0) return { label: "Unused", tone: "leaf" };
    return { label: "Active", tone: "saffron" };
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900">Offers & Promo Codes</h1>
          <p className="text-sm text-ink-500">
            Create checkout coupon codes and customized story reviews reward coupons.
          </p>
        </div>

        {activeTab === "standard" ? (
          <AdminButton onClick={() => setCreating(true)}>
            <Plus size={16} /> Add Offer
          </AdminButton>
        ) : (
          <AdminButton onClick={() => setCreatingCustom(true)}>
            <Plus size={16} /> Generate Coupon
          </AdminButton>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-cream-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("standard")}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "standard"
              ? "text-maroon-900 border-b-2 border-maroon-900"
              : "text-ink-400 hover:text-ink-700"
          }`}
        >
          Standard Shop Offers ({offers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === "custom"
              ? "text-maroon-900 border-b-2 border-maroon-900"
              : "text-ink-400 hover:text-ink-700"
          }`}
        >
          Customer Story Coupons ({customCoupons.length})
          {loadingCustom && <RefreshCw size={12} className="animate-spin text-ink-400" />}
        </button>
      </div>

      {/* Standard Shop Offers Tab */}
      {activeTab === "standard" && (
        <>
          {offers.length === 0 ? (
            <EmptyState
              icon={<BadgePercent size={26} />}
              title="No offers yet"
              text="Create a coupon code to run a shop promotion."
            />
          ) : (
            <div className="md:overflow-hidden md:rounded-2xl md:border md:border-cream-200 md:bg-white">
              <div className="md:overflow-x-auto">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wide text-ink-400">
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Discount</th>
                      <th className="px-4 py-3 font-medium">Min.</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-cream-200">
                    {offers.map((o) => (
                      <tr key={o.id} className="hover:bg-cream-50">
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-cream-100 px-2 py-1 font-mono text-xs font-bold text-maroon-800">
                            {o.code}
                          </span>
                        </td>
                        <td data-label="Title" className="px-4 py-3 text-ink-700">{o.title}</td>
                        <td data-label="Type" className="px-4 py-3 text-ink-500">{TYPE_LABEL[o.type]}</td>
                        <td data-label="Discount" className="px-4 py-3 font-medium text-maroon-900">
                          {offerValueLabel(o)}
                        </td>
                        <td data-label="Min." className="px-4 py-3 text-ink-500">
                          {o.minSubtotal ? formatINR(o.minSubtotal) : "—"}
                        </td>
                        <td data-label="Status" className="px-4 py-3">
                          <Badge tone={o.active ? "leaf" : "muted"}>
                            {o.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td data-label="Actions" className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditing(o)}
                              aria-label={`Edit ${o.code}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-maroon-800 cursor-pointer"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(o)}
                              aria-label={`Delete ${o.code}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-maroon-700/5 hover:text-maroon-700 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer Story Coupons Tab */}
      {activeTab === "custom" && (
        <>
          {customCoupons.length === 0 ? (
            <EmptyState
              icon={<BadgePercent size={26} />}
              title="No customer reward coupons"
              text="Generate a unique code for a customer tagging you on their Instagram story."
            />
          ) : (
            <div className="md:overflow-hidden md:rounded-2xl md:border md:border-cream-200 md:bg-white">
              <div className="md:overflow-x-auto">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wide text-ink-400">
                      <th className="px-4 py-3 font-medium">Coupon Code</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Value</th>
                      <th className="px-4 py-3 font-medium text-center">Uses Limit</th>
                      <th className="px-4 py-3 font-medium">Allowed Phone / Email</th>
                      <th className="px-4 py-3 font-medium">Validity</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-cream-200">
                    {customCoupons.map((c) => {
                      const stat = getCouponStatus(c);
                      const validityStr = c.endsAt
                        ? new Date(c.endsAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "No limit";

                      return (
                        <tr key={c.code} className="hover:bg-cream-50">
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-pista-100 px-2 py-1 font-mono text-xs font-bold text-pista-700">
                              {c.code}
                            </span>
                          </td>
                          <td data-label="Type" className="px-4 py-3 text-ink-500">{TYPE_LABEL[c.type as OfferType]}</td>
                          <td data-label="Value" className="px-4 py-3 font-medium text-maroon-900">
                            {offerValueLabelCustom(c)}
                          </td>
                          <td data-label="Uses Limit" className="px-4 py-3 text-center text-ink-700 font-bold">
                            {c.usesCount} / {c.maxUses}
                          </td>
                          <td data-label="Allowed Phone / Email" className="px-4 py-3 text-ink-600">
                            <div className="flex flex-col gap-0.5 text-xs">
                              {c.allowedPhone && <span className="font-semibold text-ink-800">📞 {c.allowedPhone}</span>}
                              {c.allowedEmail && <span className="text-[11px] truncate text-ink-500 font-mono">✉️ {c.allowedEmail}</span>}
                              {!c.allowedPhone && !c.allowedEmail && <span className="text-ink-400 font-medium">Open to anyone</span>}
                            </div>
                          </td>
                          <td data-label="Validity" className="px-4 py-3 text-ink-500">
                            <span className="flex items-center gap-1 text-xs">
                              <Calendar size={13} className="text-ink-400" />
                              {validityStr}
                            </span>
                          </td>
                          <td data-label="Status" className="px-4 py-3">
                            <Badge tone={stat.tone}>{stat.label}</Badge>
                          </td>
                          <td data-label="Actions" className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingCustom(c)}
                                aria-label={`Edit custom coupon ${c.code}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-maroon-800 cursor-pointer"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteCustom(c)}
                                aria-label={`Delete custom coupon ${c.code}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-maroon-700/5 hover:text-maroon-700 cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Standard Offer Modals */}
      {(editing || creating) && (
        <OfferEditor
          offer={editing}
          onSave={(o) => {
            saveOffer(o);
            setEditing(null);
            setCreating(false);
          }}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      {/* Custom Coupon Modals */}
      {(editingCustom || creatingCustom) && (
        <CustomCouponEditor
          coupon={editingCustom}
          onSave={handleSaveCustomCoupon}
          onClose={() => {
            setEditingCustom(null);
            setCreatingCustom(false);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmType === "standard" ? "Delete offer?" : "Delete custom coupon?"}
        description={confirmCode ? `Are you sure you want to delete ${confirmCode}?` : undefined}
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmId(null);
          setConfirmCode(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
