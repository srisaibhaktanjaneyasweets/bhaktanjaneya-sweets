"use client";

import { useMemo, useState } from "react";
import { Users, Search, MessageCircle } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { EmptyState, inputClass } from "@/components/admin/ui";
import { formatINR, formatDate } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import { config } from "@/lib/config";

export default function AdminCustomersPage() {
  const { customers, orders } = useAdmin();
  const [query, setQuery] = useState("");

  // Spend per customer, computed from recorded orders.
  const spendByPhone = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      map.set(o.customerPhone, (map.get(o.customerPhone) ?? 0) + o.total);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.name ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-maroon-900">
          Customers
        </h1>
        <p className="text-sm text-ink-500">
          {customers.length} customer{customers.length !== 1 ? "s" : ""}{" "}
          captured via login &amp; checkout
        </p>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className={`${inputClass} pl-9`}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={26} />}
          title="No customers yet"
          text={
            customers.length === 0
              ? "Phone numbers from checkout will appear here."
              : "No customers match your search."
          }
        />
      ) : (
        <div className="md:overflow-hidden md:rounded-2xl md:border md:border-cream-200 md:bg-white">
          <div className="md:overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Total spend</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-xs font-bold text-cream-50">
                          {(c.name?.[0] ?? c.phone.slice(-2, -1)).toUpperCase()}
                        </span>
                        <span className="font-medium text-maroon-900">
                          {c.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td data-label="Phone" className="px-4 py-3 text-ink-600">+91 {c.phone}</td>
                    <td data-label="Orders" className="px-4 py-3 text-ink-600">
                      {c.ordersCount ?? 0}
                    </td>
                    <td data-label="Total spend" className="px-4 py-3 font-medium text-maroon-900">
                      {formatINR(spendByPhone.get(c.phone) ?? 0)}
                    </td>
                    <td data-label="Joined" className="px-4 py-3 text-ink-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td data-label="Contact" className="px-4 py-3 text-right">
                      <a
                        href={waLink(
                          `Hello${c.name ? ` ${c.name}` : ""}! Greetings from ${config.businessName}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Message ${c.name || c.phone}`}
                        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#35B664] hover:bg-[#35B664]/10"
                      >
                        <MessageCircle size={17} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
