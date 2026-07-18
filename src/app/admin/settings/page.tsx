"use client";

import { useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { AdminButton, Field, inputClass } from "@/components/admin/ui";
import { useAdmin } from "@/context/AdminContext";
import { apiPost } from "@/lib/api/client";

export default function AdminSettingsPage() {
  const { session } = useAdmin();
  const [name, setName] = useState(session?.user.name ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-saffron-600">Access control</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900">Admin settings</h1>
        <p className="mt-2 text-sm text-ink-500">Manage your sign-in details and give trusted team members admin access.</p>
      </div>
      {error && <p className="rounded-lg border border-maroon-700/20 bg-maroon-700/5 px-4 py-3 text-sm text-maroon-700">{error}</p>}
      {message && <p className="rounded-lg border border-leaf-500/20 bg-leaf-500/5 px-4 py-3 text-sm text-leaf-700">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={updateAccount} className="space-y-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-maroon-900"><KeyRound size={18} /><h2 className="font-serif text-xl font-bold">Your account</h2></div>
          <Field label="Name"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email"><input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Current password" hint="Required before saving account changes."><input type="password" required className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
          <Field label="New password" hint="Leave blank to keep your current password."><input type="password" minLength={8} className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
          <AdminButton type="submit" disabled={saving}>{saving ? "Saving…" : "Save account"}</AdminButton>
        </form>
        <form onSubmit={createAdmin} className="space-y-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-maroon-900"><UserPlus size={18} /><h2 className="font-serif text-xl font-bold">Add an admin</h2></div>
          <Field label="Name"><input required className={inputClass} value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} /></Field>
          <Field label="Email"><input type="email" required className={inputClass} value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} /></Field>
          <Field label="Temporary password" hint="Use at least 8 characters and share it securely."><input type="password" required minLength={8} className={inputClass} value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} /></Field>
          <AdminButton type="submit" disabled={saving}>{saving ? "Saving…" : "Create admin"}</AdminButton>
        </form>
      </div>
    </div>
  );
}
