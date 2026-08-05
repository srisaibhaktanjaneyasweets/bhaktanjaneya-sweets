"use client";

import { useEffect, useState } from "react";
import { Megaphone, Truck, BadgePercent, MessageCircle, LayoutGrid, EyeOff, Save, Sparkles } from "lucide-react";
import { AdminButton, Field, inputClass } from "@/components/admin/ui";
import { toast } from "@/components/ui/toast";
import { apiGet, apiPut } from "@/lib/api/client";
import {
  defaultAnnouncementMessages,
  type AnnouncementMessages,
} from "@/lib/announcement";
import {
  defaultOfferBannerSettings,
  type OfferBannerSettings,
} from "@/lib/offer-banner";

const FIELDS = [
  {
    key: "shipping",
    label: "Shipping message",
    hint: "Shown with the truck icon.",
    icon: Truck,
  },
  {
    key: "offer",
    label: "Offer message",
    hint: "Shown with the % icon.",
    icon: BadgePercent,
  },
  {
    key: "whatsapp",
    label: "WhatsApp message",
    hint: "Shown with the chat icon.",
    icon: MessageCircle,
  },
] as const;

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<"announcements" | "banner">("announcements");
  
  const [draft, setDraft] = useState<AnnouncementMessages>(defaultAnnouncementMessages());
  const [bannerDraft, setBannerDraft] = useState<OfferBannerSettings>(defaultOfferBannerSettings());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet<{ messages: AnnouncementMessages }>("/settings/announcement"),
      apiGet<{ settings: OfferBannerSettings }>("/settings/offer-banner"),
    ])
      .then(([annRes, bannerRes]) => {
        setDraft(annRes.messages);
        setBannerDraft(bannerRes.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const d = await apiPut<{ messages: AnnouncementMessages }>(
        "/admin/settings/announcement",
        draft,
      );
      setDraft(d.messages);
      toast({
        tone: "success",
        title: "Announcements saved",
        message: "The header bar now shows the new messages.",
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveBanner() {
    setSavingBanner(true);
    try {
      const d = await apiPut<{ settings: OfferBannerSettings }>(
        "/admin/settings/offer-banner",
        bannerDraft,
      );
      setBannerDraft(d.settings);
      toast({
        tone: "success",
        title: "Offer Banner saved",
        message: "The homepage offer banner now shows the new settings.",
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSavingBanner(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900">Store Promotions</h1>
          <p className="text-sm text-ink-500">
            Manage the top announcement bar messages and the homepage welcome banner.
          </p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-cream-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("announcements")}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === "announcements" ? "text-maroon-800 font-bold" : "text-ink-500 hover:text-maroon-800/80"
          }`}
        >
          Top Announcement Bar
          {activeTab === "announcements" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-800 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("banner")}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === "banner" ? "text-maroon-800 font-bold" : "text-ink-500 hover:text-maroon-800/80"
          }`}
        >
          Homepage Offer Banner
          {activeTab === "banner" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-800 rounded-full" />
          )}
        </button>
      </div>

      {/* LOADING OVERLAY */}
      {loading ? (
        <div className="animate-pulse space-y-6 rounded-2xl border border-cream-200 bg-white p-6">
          <div className="h-6 bg-cream-100 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-10 bg-cream-100 rounded"></div>
              <div className="h-10 bg-cream-100 rounded"></div>
            </div>
            <div className="h-28 bg-cream-100 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {/* TAB 1: ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Input Card */}
              <div className="lg:col-span-7 rounded-2xl border border-cream-200 bg-white p-6 shadow-soft space-y-5">
                <div className="flex items-center gap-2 border-b border-cream-100 pb-3 mb-1">
                  <Megaphone size={18} className="text-maroon-800" />
                  <h3 className="font-serif text-lg font-bold text-maroon-900">Header Bar Messages</h3>
                </div>

                <div className="space-y-4">
                  {FIELDS.map(({ key, label, hint, icon: Icon }) => (
                    <Field key={key} label={label} hint={hint}>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-maroon-800/5 text-maroon-800">
                          <Icon size={16} />
                        </span>
                        <input
                          className={inputClass}
                          value={draft[key]}
                          maxLength={140}
                          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                        />
                      </div>
                    </Field>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-cream-100">
                  <span className="text-xs text-ink-500">
                    Changes apply to the storefront instantly.
                  </span>
                  <AdminButton onClick={save} disabled={saving}>
                    <Save size={16} /> {saving ? "Saving…" : "Save changes"}
                  </AdminButton>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-maroon-800" />
                  <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider">Live Preview</h4>
                </div>
                
                <div className="rounded-2xl border border-cream-150 bg-cream-50/40 p-5 shadow-soft space-y-4">
                  <p className="text-xs text-ink-500 leading-relaxed">
                    This is a live mock of how the top announcement bar looks on mobile and desktop screens.
                  </p>
                  
                  {/* Mock Bar container */}
                  <div className="bg-maroon-900 text-cream-100 rounded-xl p-4 text-[11px] font-medium shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-cream-100/10 pb-2">
                      <Truck size={13} className="text-saffron-400 shrink-0" />
                      <span className="truncate">{draft.shipping}</span>
                    </div>
                    <div className="flex items-center gap-2 border-b border-cream-100/10 pb-2">
                      <BadgePercent size={13} className="text-saffron-400 shrink-0" />
                      <span className="truncate">{draft.offer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={13} className="text-saffron-400 shrink-0" />
                      <span className="truncate">{draft.whatsapp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOMEPAGE OFFER BANNER */}
          {activeTab === "banner" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Input Card */}
              <div className="lg:col-span-7 rounded-2xl border border-cream-200 bg-white p-6 shadow-soft space-y-5">
                <div className="flex items-center gap-2 border-b border-cream-100 pb-3 mb-1">
                  <LayoutGrid size={18} className="text-maroon-800" />
                  <h3 className="font-serif text-lg font-bold text-maroon-900">Banner Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Badge Text" hint="Small top tagline (e.g. Welcome offer)">
                      <input
                        className={inputClass + " mt-1"}
                        value={bannerDraft.badge}
                        onChange={(e) => setBannerDraft((d) => ({ ...d, badge: e.target.value }))}
                      />
                    </Field>

                    <Field label="Banner Title" hint="Main headline">
                      <input
                        className={inputClass + " mt-1"}
                        value={bannerDraft.title}
                        onChange={(e) => setBannerDraft((d) => ({ ...d, title: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <Field label="Offer Description" hint="Detailed code information or terms">
                    <textarea
                      rows={3}
                      className={inputClass + " mt-1 resize-none py-2"}
                      value={bannerDraft.description}
                      onChange={(e) => setBannerDraft((d) => ({ ...d, description: e.target.value }))}
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Promo Code" hint="Code to style as highlighted pill">
                      <input
                        className={inputClass + " mt-1"}
                        value={bannerDraft.code}
                        onChange={(e) => setBannerDraft((d) => ({ ...d, code: e.target.value }))}
                      />
                    </Field>

                    <Field label="Button Text" hint="Call-to-action button label">
                      <input
                        className={inputClass + " mt-1"}
                        value={bannerDraft.buttonText}
                        onChange={(e) => setBannerDraft((d) => ({ ...d, buttonText: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Button Link" hint="Destination URL (e.g. /shop)">
                      <input
                        className={inputClass + " mt-1"}
                        value={bannerDraft.buttonLink}
                        onChange={(e) => setBannerDraft((d) => ({ ...d, buttonLink: e.target.value }))}
                      />
                    </Field>

                    <Field label="Banner Status" hint="Show or hide this promotion on the homepage">
                      <div className="flex items-center mt-2.5">
                        <button
                          type="button"
                          onClick={() => setBannerDraft((d) => ({ ...d, visible: !d.visible }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            bannerDraft.visible ? "bg-emerald-600" : "bg-ink-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              bannerDraft.visible ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="ml-3 text-xs font-semibold text-ink-600">
                          {bannerDraft.visible ? "Visible to customers" : "Hidden from homepage"}
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-cream-100">
                  <span className="text-xs text-ink-500">
                    Saves to database immediately.
                  </span>
                  <AdminButton onClick={saveBanner} disabled={savingBanner}>
                    <Save size={16} /> {savingBanner ? "Saving…" : "Save banner"}
                  </AdminButton>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-maroon-800" />
                  <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider">Live Preview</h4>
                </div>

                <div className="rounded-2xl border border-cream-150 bg-cream-50/40 p-5 shadow-soft space-y-4">
                  <p className="text-xs text-ink-500 leading-relaxed">
                    This is a live mock of how the welcome banner appears on the storefront.
                  </p>

                  <div className="flex justify-center pt-2">
                    {bannerDraft.visible ? (
                      <div className="offer-glow relative overflow-hidden rounded-xl bg-gradient-to-br from-maroon-800 via-maroon-900 to-maroon-950 px-5 py-8 text-center w-full shadow-md max-w-sm">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold-500/10 blur-xl" />
                        <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-pista-500/8 blur-xl" />
                        
                        <div className="relative mx-auto space-y-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-cream-50/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-saffron-300 ring-1 ring-inset ring-cream-50/15">
                            <BadgePercent size={12} /> {bannerDraft.badge}
                          </span>
                          
                          <h2 className="font-serif text-xl font-bold text-cream-50 leading-snug">
                            {bannerDraft.title}
                          </h2>
                          
                          <p className="text-[11px] text-cream-100/85 leading-relaxed font-medium">
                            {(() => {
                              const code = bannerDraft.code || "";
                              const desc = bannerDraft.description || "";
                              if (code && desc.includes(code)) {
                                const parts = desc.split(code);
                                return (
                                  <>
                                    {parts[0]}
                                    <span className="mx-1 rounded bg-cream-50 px-1.5 py-0.5 font-bold text-maroon-900 shadow-sm whitespace-nowrap">
                                      {code}
                                    </span>
                                    {parts[1]}
                                  </>
                                );
                              }
                              return desc;
                            })()}
                          </p>
                          
                          <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gold-500 px-5 text-xs font-semibold text-maroon-900 shadow-sm mt-1">
                            {bannerDraft.buttonText}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-cream-300 bg-white p-8 text-center text-xs text-ink-500 font-medium w-full max-w-sm">
                        <EyeOff size={20} className="mx-auto text-ink-300 mb-2" />
                        Banner is hidden on the store.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
