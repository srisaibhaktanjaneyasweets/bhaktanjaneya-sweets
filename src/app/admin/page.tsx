"use client";

import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  BadgePercent,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { Badge } from "@/components/ui/Badge";
import { formatINR, formatDate } from "@/lib/utils";

const STATUS_TONE: Record<string, "saffron" | "leaf"> = {
  delivered: "leaf",
};

export default function AdminDashboard() {
  const { products, orders, customers, offers } = useAdmin();

  const activeProducts = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) =>
    p.variants.every((v) => v.stock === 0)
      ? true
      : p.variants.some((v) => v.stock > 0 && v.stock <= 5),
  );
  const orderValue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeOffers = offers.filter((o) => o.active).length;
  const recentOrders = orders.slice(0, 5);

  const stats = [
    {
      label: "Products",
      value: `${activeProducts}/${products.length}`,
      sub: "active / total",
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Orders",
      value: String(orders.length),
      sub: "all time",
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      label: "Order value",
      value: formatINR(orderValue),
      sub: "all orders",
      icon: IndianRupee,
      href: "/admin/orders",
    },
    {
      label: "Customers",
      value: String(customers.length),
      sub: "captured",
      icon: Users,
      href: "/admin/customers",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-maroon-900">
          Dashboard
        </h1>
        <p className="text-sm text-ink-500">
          Overview of your store&apos;s catalog and orders.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-cream-200 bg-white p-5 transition-shadow hover:shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-maroon-800">
                <Icon size={20} />
              </span>
              <ArrowRight
                size={16}
                className="text-ink-300 transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <p className="mt-4 font-serif text-2xl font-bold text-maroon-900">
              {value}
            </p>
            <p className="text-sm font-medium text-ink-700">{label}</p>
            <p className="text-xs text-ink-500">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Recent orders */}
        <div className="rounded-2xl border border-cream-200 bg-white">
          <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-maroon-900">
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-saffron-700 hover:text-saffron-500"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-500">
              No orders yet. Orders placed on the storefront appear here.
            </p>
          ) : (
            <ul className="divide-y divide-cream-200">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-maroon-900">
                      {o.customerName || o.customerPhone || "Customer"}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatDate(o.createdAt)} · {o.items.length} item
                      {o.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS_TONE[o.status] ?? "saffron"}>
                      {o.status}
                    </Badge>
                    <span className="text-sm font-bold text-maroon-900">
                      {formatINR(o.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Low stock */}
          <div className="rounded-2xl border border-cream-200 bg-white">
            <div className="flex items-center gap-2 border-b border-cream-200 px-5 py-4">
              <AlertTriangle size={18} className="text-saffron-700" />
              <h2 className="font-serif text-lg font-semibold text-maroon-900">
                Low / out of stock
              </h2>
            </div>
            {lowStock.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-500">
                Everything is well stocked.
              </p>
            ) : (
              <ul className="divide-y divide-cream-200">
                {lowStock.slice(0, 6).map((p) => {
                  const total = p.variants.reduce((s, v) => s + v.stock, 0);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <Link
                        href="/admin/products"
                        className="truncate text-sm text-ink-700 hover:text-maroon-800"
                      >
                        {p.name}
                      </Link>
                      <span
                        className={
                          total === 0
                            ? "text-xs font-semibold text-maroon-700"
                            : "text-xs font-semibold text-saffron-700"
                        }
                      >
                        {total === 0 ? "Out of stock" : `${total} left`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Offers */}
          <div className="rounded-2xl border border-cream-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <BadgePercent size={18} className="text-maroon-800" />
              <h2 className="font-serif text-lg font-semibold text-maroon-900">
                Offers
              </h2>
            </div>
            <p className="mt-3 text-sm text-ink-600">
              {activeOffers} active offer{activeOffers !== 1 ? "s" : ""} of{" "}
              {offers.length} total.
            </p>
            <Link
              href="/admin/offers"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-700 hover:text-saffron-500"
            >
              Manage offers <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
