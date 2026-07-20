"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  BadgePercent,
  Megaphone,
  ShoppingBag,
  Users,
  Newspaper,
  Film,
  Truck,
  Settings,
  LogOut,
  ExternalLink,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/offers", label: "Offers", icon: BadgePercent },
  { href: "/admin/delivery", label: "Delivery & charges", icon: Truck },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/instagram-reels", label: "Instagram reels", icon: Film },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/settings", label: "Admin settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, logout, refreshData } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-cream-50 lg:grid lg:grid-cols-[240px_1fr]">
      {/* Mobile Top Header Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cream-200 bg-maroon-900 text-cream-100 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-cream-100 hover:bg-cream-50/10"
          >
            <Menu size={20} />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron-400 font-serif text-base font-bold text-maroon-900">
              B
            </span>
            <span className="font-serif text-sm font-bold text-cream-50">
              {config.businessName} Admin
            </span>
          </Link>
        </div>
        <button
          type="button"
          onClick={logout}
          title="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-cream-100/85 hover:bg-cream-50/10 hover:text-cream-50"
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* Mobile Slide-over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-maroon-900 text-cream-100 shadow-xl transition-all duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200/10">
              <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-saffron-400 font-serif text-lg font-bold text-maroon-900">
                  B
                </span>
                <div className="leading-tight">
                  <p className="font-serif text-sm font-bold text-cream-50">
                    {config.businessName}
                  </p>
                  <p className="text-[11px] text-cream-100/60">Admin panel</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-cream-100/70 hover:bg-cream-50/10 hover:text-cream-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Nav links */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {NAV.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(href, exact)
                      ? "bg-cream-50/10 text-saffron-300"
                      : "text-cream-100/80 hover:bg-cream-50/5 hover:text-cream-50",
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Drawer Session Info Footer */}
            <div className="border-t border-cream-200/10 p-4 bg-maroon-950">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] uppercase tracking-wider text-cream-100/40">Signed in as</p>
                  <p className="truncate text-sm font-semibold text-cream-50">
                    {session?.user.name ?? session?.user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-maroon-800 text-cream-50 hover:bg-maroon-700 transition-colors"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden lg:flex lg:flex-col border-r border-cream-200 bg-maroon-900 text-cream-100 min-h-screen">
        <div className="px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-saffron-400 font-serif text-lg font-bold text-maroon-900">
              B
            </span>
            <div className="leading-tight">
              <p className="font-serif text-sm font-bold text-cream-50">
                {config.businessName}
              </p>
              <p className="text-[11px] text-cream-100/60">Admin panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-2 flex-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(href, exact)
                  ? "bg-cream-50/10 text-saffron-300"
                  : "text-cream-100/80 hover:bg-cream-50/5 hover:text-cream-50",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex min-h-screen flex-col">
        {/* Main Content Header */}
        <header className="flex items-center justify-between gap-3 border-b border-cream-200 bg-white px-4 py-3 sm:px-6">
          <p className="hidden md:block text-sm text-ink-500">
            Signed in as{" "}
            <span className="font-medium text-maroon-900">
              {session?.user.name ?? session?.user.email}
            </span>
          </p>
          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2">
            <button
              type="button"
              onClick={refreshData}
              title="Refresh Supabase data"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 px-3 py-2 text-xs font-medium text-ink-600 hover:bg-cream-100"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 px-3 py-2 text-xs font-medium text-ink-600 hover:bg-cream-100"
              >
                <ExternalLink size={14} /> View store
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg bg-maroon-800 px-3 py-2 text-xs font-semibold text-cream-50 hover:bg-maroon-700"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
