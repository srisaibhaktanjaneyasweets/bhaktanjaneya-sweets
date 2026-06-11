"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Package, Pencil, Check, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api/client";
import { formatINR, formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";

const STATUS_LABEL: Record<Order["status"], string> = {
  new: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AccountPage() {
  const router = useRouter();
  const { customer, updateName, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Hydration: intentionally setting state on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (customer) {
      setNameInput(customer.name ?? "");
      apiGet<Order[]>("/orders").then(setOrders).catch(() => setOrders([]));
    }
  }, [customer]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!mounted) {
    return (
      <Container>
        <div className="py-24" />
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container>
        <div className="mx-auto max-w-md py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-maroon-800">
            <User size={30} />
          </span>
          <h1 className="mt-5 font-serif text-2xl font-bold text-maroon-900">
            You&apos;re not logged in
          </h1>
          <p className="mt-2 text-ink-600">
            Log in to view your orders and save your details.
          </p>
          <Link
            href="/login?redirect=/account"
            className="mt-7 inline-flex h-11 items-center rounded-full bg-maroon-800 px-6 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
          >
            Login / Sign up
          </Link>
        </div>
      </Container>
    );
  }

  function saveName() {
    updateName(nameInput.trim());
    setEditing(false);
  }

  return (
    <div className="py-10">
      <Container>
        <h1 className="font-serif text-3xl font-bold text-maroon-900">
          My Account
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Profile */}
          <div className="h-fit rounded-2xl border border-cream-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon-800 font-serif text-xl font-bold text-cream-50">
                {(customer.name?.[0] ?? customer.phone.slice(-2, -1)).toUpperCase()}
              </span>
              <div className="min-w-0">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Your name"
                      className="h-9 w-full rounded-lg border border-cream-300 px-2 text-sm focus:border-saffron-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={saveName}
                      aria-label="Save name"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-maroon-800 text-cream-50"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-maroon-900">
                      {customer.name || "Add your name"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      aria-label="Edit name"
                      className="text-ink-400 hover:text-maroon-700"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
                <p className="text-sm text-ink-500">+91 {customer.phone}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-maroon-800/30 py-2.5 text-sm font-semibold text-maroon-800 hover:bg-maroon-800/5"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>

          {/* Orders */}
          <div>
            <h2 className="mb-4 font-serif text-xl font-semibold text-maroon-900">
              Your Orders
            </h2>
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cream-300 bg-white py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-maroon-800">
                  <Package size={26} />
                </span>
                <p className="mt-4 font-medium text-maroon-900">No orders yet</p>
                <p className="mt-1 text-sm text-ink-500">
                  Your placed orders will appear here.
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex h-10 items-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-cream-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-maroon-900">
                          #{o.id.replace(/^ord_/, "").toUpperCase()}
                        </p>
                        <p className="text-xs text-ink-400">
                          {formatDate(o.createdAt)} • {o.channel === "whatsapp" ? "WhatsApp" : "Online"}
                        </p>
                      </div>
                      <Badge tone={o.status === "delivered" ? "leaf" : "saffron"}>
                        {STATUS_LABEL[o.status]}
                      </Badge>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-ink-700">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span>
                            {it.name}{" "}
                            <span className="text-ink-400">
                              ({it.variantLabel}) × {it.quantity}
                            </span>
                          </span>
                          <span>{formatINR(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex justify-between border-t border-cream-200 pt-3 text-sm">
                      <span className="text-ink-500">
                        Payment: {o.paymentStatus}
                      </span>
                      <span className="font-bold text-maroon-900">
                        {formatINR(o.total)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
