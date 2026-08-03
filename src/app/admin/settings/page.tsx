"use client";

import { useEffect, useState } from "react";
import { KeyRound, UserPlus, Building2, Share2, Plus, Trash2, MessageCircle } from "lucide-react";
import { AdminButton, Field, inputClass } from "@/components/admin/ui";
import { useAdmin } from "@/context/AdminContext";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";

export default function AdminSettingsPage() {
  const { session } = useAdmin();
  const [name, setName] = useState(session?.user.name ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  
  // Business Settings State
  const [bizPhone, setBizPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizSocials, setBizSocials] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [whatsappShipmentTemplate, setWhatsappShipmentTemplate] = useState("");
  const [whatsappDeliveryTemplate, setWhatsappDeliveryTemplate] = useState("");
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingBiz, setSavingBiz] = useState(false);

  useEffect(() => {
    apiGet<any>("/admin/settings/business")
      .then((data) => {
        if (data) {
          setBizPhone(data.phone || "");
          setBizEmail(data.email || "");
          setBizAddress(data.address || "");
          setBizSocials(Array.isArray(data.socials) ? data.socials : []);
          setWhatsappShipmentTemplate(data.whatsappShipmentTemplate || "");
          setWhatsappDeliveryTemplate(data.whatsappDeliveryTemplate || "");
        }
      })
      .catch(() => {});
  }, []);

  async function updateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await apiPost("/admin/account", { action: "update", name, email, currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Account details saved. Use your new password next time you sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the account.");
    } finally {
      setSaving(false);
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await apiPost("/admin/account", { action: "create", name: newAdminName, email: newAdminEmail, password: newAdminPassword });
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setMessage("New admin created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the admin.");
    } finally {
      setSaving(false);
    }
  }

  async function updateBusinessSettings(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSavingBiz(true);
    try {
      await apiPut("/admin/settings/business", {
        phone: bizPhone,
        email: bizEmail,
        address: bizAddress,
        socials: bizSocials.filter(s => s.name.trim() && s.url.trim()),
        whatsappShipmentTemplate,
        whatsappDeliveryTemplate,
      });
      setMessage("Business configurations and WhatsApp templates saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save business settings.");
    } finally {
      setSavingBiz(false);
    }
  }

  function handleAddSocial() {
    setBizSocials(prev => [
      ...prev,
      { id: `social-${Date.now()}`, name: "", url: "" }
    ]);
  }

  function handleUpdateSocial(id: string, field: "name" | "url", value: string) {
    setBizSocials(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function handleRemoveSocial(id: string) {
    setBizSocials(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-saffron-600">Access control & Business details</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900">Admin settings</h1>
        <p className="mt-2 text-sm text-ink-500">Manage account details, business data, contact email, and social media channels.</p>
      </div>

      {error && <p className="rounded-lg border border-maroon-700/20 bg-maroon-700/5 px-4 py-3 text-sm text-maroon-700">{error}</p>}
      {message && <p className="rounded-lg border border-leaf-500/20 bg-leaf-500/5 px-4 py-3 text-sm text-leaf-700">{message}</p>}

      {/* Business Details Form */}
      <form onSubmit={updateBusinessSettings} className="space-y-6 rounded-3xl border border-cream-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-2 text-maroon-900 border-b border-cream-100 pb-3">
          <Building2 size={20} />
          <h2 className="font-serif text-xl font-bold">Business Information</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business Phone">
            <input 
              required 
              className={inputClass} 
              value={bizPhone} 
              onChange={(e) => setBizPhone(e.target.value)} 
              placeholder="e.g. +91 90302 74345"
            />
          </Field>
          <Field label="Business Contact Email">
            <input 
              type="email" 
              required 
              className={inputClass} 
              value={bizEmail} 
              onChange={(e) => setBizEmail(e.target.value)} 
              placeholder="e.g. orders@bhaktanjaneyasweets.com"
            />
          </Field>
        </div>

        <Field label="Business Address">
          <textarea 
            required 
            rows={3} 
            className="w-full resize-none rounded-xl border border-cream-300 bg-white p-3.5 text-sm text-ink-900 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40" 
            value={bizAddress} 
            onChange={(e) => setBizAddress(e.target.value)} 
            placeholder="e.g. Rajamahendravaram, Andhra Pradesh, India"
          />
        </Field>

        {/* Social Media Section */}
        <div className="space-y-4 pt-4 border-t border-cream-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-maroon-900">
              <Share2 size={18} />
              <h3 className="font-serif text-lg font-bold">Social Media Pages</h3>
            </div>
            <button
              type="button"
              onClick={handleAddSocial}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cream-300 bg-cream-50 px-3.5 text-xs font-semibold text-maroon-800 hover:bg-cream-100 transition-colors"
            >
              <Plus size={15} /> Add Social Page
            </button>
          </div>

          <div className="space-y-3">
            {bizSocials.map((s, idx) => (
              <div key={s.id || idx} className="flex flex-col gap-3 rounded-2xl border border-cream-200 bg-cream-50/50 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="Platform Name (e.g. Instagram, Facebook)"
                    value={s.name}
                    onChange={(e) => handleUpdateSocial(s.id, "name", e.target.value)}
                    className={`${inputClass} text-xs`}
                  />
                </div>
                <div className="flex-[2]">
                  <input
                    type="url"
                    required
                    placeholder="URL Link (e.g. https://www.instagram.com/...)"
                    value={s.url}
                    onChange={(e) => handleUpdateSocial(s.id, "url", e.target.value)}
                    className={`${inputClass} text-xs`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial(s.id)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-400 hover:bg-maroon-800/10 hover:text-maroon-700 transition-colors"
                  title="Remove social link"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {bizSocials.length === 0 && (
              <p className="text-center text-xs text-ink-400 py-4">No social media links added yet. Click &quot;Add Social Page&quot; to configure.</p>
            )}
        </div>
      </div>
      {/* WhatsApp Notification Templates Section */}
        <div className="space-y-4 pt-6 border-t border-cream-100">
          <div className="flex items-center gap-2 text-maroon-900">
            <MessageCircle size={18} />
            <h3 className="font-serif text-lg font-bold">WhatsApp Message Templates</h3>
          </div>
          <p className="text-[11px] text-ink-500 leading-relaxed">
            Customize the automated messages sent to customers on WhatsApp. You can use the following placeholders in your templates:
            <br />
            <code className="bg-cream-100 px-1 py-0.5 rounded font-mono text-[10px] text-maroon-800 font-bold">{"{{customerName}}"}</code>,{" "}
            <code className="bg-cream-100 px-1 py-0.5 rounded font-mono text-[10px] text-maroon-800 font-bold">{"{{orderId}}"}</code>,{" "}
            <code className="bg-cream-100 px-1 py-0.5 rounded font-mono text-[10px] text-maroon-800 font-bold">{"{{businessName}}"}</code>,{" "}
            <code className="bg-cream-100 px-1 py-0.5 rounded font-mono text-[10px] text-maroon-800 font-bold">{"{{contactPhone}}"}</code>,{" "}
            <code className="bg-cream-100 px-1 py-0.5 rounded font-mono text-[10px] text-maroon-800 font-bold">{"{{siteUrl}}"}</code>, and{" "}
            <code className="bg-cream-100 px-1 py-0.5 rounded font-mono text-[10px] text-maroon-800 font-bold">{"{{detailsBlock}}"}</code> (Shipment only).
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Order Shipped Template">
              <textarea
                rows={8}
                className="w-full rounded-xl border border-cream-300 bg-white p-3 text-xs text-ink-900 focus:border-saffron-400 focus:outline-none"
                value={whatsappShipmentTemplate}
                onChange={(e) => setWhatsappShipmentTemplate(e.target.value)}
                placeholder="Message template when order is shipped..."
              />
            </Field>

            <Field label="Order Delivered Template">
              <textarea
                rows={8}
                className="w-full rounded-xl border border-cream-300 bg-white p-3 text-xs text-ink-900 focus:border-saffron-400 focus:outline-none"
                value={whatsappDeliveryTemplate}
                onChange={(e) => setWhatsappDeliveryTemplate(e.target.value)}
                placeholder="Message template when order is delivered..."
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <AdminButton type="submit" disabled={savingBiz}>
            {savingBiz ? "Saving..." : "Save Business Settings"}
          </AdminButton>
        </div>
      </form>

      {/* Account Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={updateAccount} className="space-y-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 text-maroon-900"><KeyRound size={18} /><h2 className="font-serif text-xl font-bold">Your Account</h2></div>
          <Field label="Name"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email"><input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Current password" hint="Required before saving account changes."><input type="password" required className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
          <Field label="New password" hint="Leave blank to keep your current password."><input type="password" minLength={8} className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
          <AdminButton type="submit" disabled={saving}>{saving ? "Saving…" : "Save Account"}</AdminButton>
        </form>
        <form onSubmit={createAdmin} className="space-y-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 text-maroon-900"><UserPlus size={18} /><h2 className="font-serif text-xl font-bold">Add an Admin</h2></div>
          <Field label="Name"><input required className={inputClass} value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} /></Field>
          <Field label="Email"><input type="email" required className={inputClass} value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} /></Field>
          <Field label="Temporary password" hint="Use at least 8 characters and share it securely."><input type="password" required minLength={8} className={inputClass} value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} /></Field>
          <AdminButton type="submit" disabled={saving}>{saving ? "Saving…" : "Create Admin"}</AdminButton>
        </form>
      </div>
    </div>
  );
}
