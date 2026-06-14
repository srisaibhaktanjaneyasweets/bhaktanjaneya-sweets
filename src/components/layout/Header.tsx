"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

import {
  Menu,
  X,
  Search,
  ShoppingBag,
  User,
  MessageCircle,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { waLink } from "@/lib/whatsapp";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/find-my-order", label: "Find my order" },
  { href: "/shop", label: "Shop All" },
  { href: "/collections/sweets", label: "Sweets" },
  { href: "/collections/namkeen", label: "Namkeen" },
  { href: "/shop?tag=best-seller", label: "Best Sellers" },
  { href: "/bulk-orders", label: "Bulk Orders" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const router = useRouter();
  const { count, setOpen } = useCart();
  const { customer, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  function lockBodyScroll(locked: boolean) {
    // Use class-based locking to avoid getting stuck when route changes.
    document.body.classList.toggle("scroll-locked", locked);
    document.body.style.overflow = locked ? "hidden" : "";
  }

  useEffect(() => {
    if (menuOpen) lockBodyScroll(true);
    else lockBodyScroll(false);

    return () => {
      // Safety net on unmount
      lockBodyScroll(false);
    };
  }, [menuOpen]);



  function closeMenu() {
    setMenuOpen(false);
    lockBodyScroll(false);
  }

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    closeMenu();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }


  return (
    <Fragment>
    <header className="sticky top-0 z-40 border-b border-cream-300/60 bg-cream-50/95 backdrop-blur supports-[backdrop-filter]:bg-cream-50/80">
      <Container>
        <div className="flex h-16 min-w-0 items-center gap-2 sm:gap-3 lg:h-20">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(true);
            }}


            aria-label="Open menu"
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-maroon-800 hover:bg-maroon-800/5 lg:hidden"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <Image
              src="/images/logo.png"
              alt="Bhaktanjaneya Sweets"
              width={48}
              height={48}
              priority
              className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
            />
            <span className="truncate font-serif text-base font-bold leading-none text-maroon-900 sm:text-xl">
              Bhaktanjaneya
              <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-saffron-600">
                Sweets
              </span>
            </span>
          </Link>

          {/* Mobile search icon */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-maroon-800 hover:bg-maroon-800/5 lg:hidden"
          >
            <Search size={20} />
          </button>


          {mobileSearchOpen && (
            <div className="absolute left-3 right-3 top-[3.25rem] z-50 rounded-2xl border border-cream-300 bg-cream-50/95 p-3 shadow-card lg:hidden">
              <form onSubmit={submitSearch} className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="h-11 w-full rounded-full border border-cream-300 bg-cream-100/60 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40"
                />
              </form>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-maroon-800 hover:bg-maroon-800/5"
                >
                  Close
                </button>
              </div>
            </div>
          )}


          {/* Desktop search */}
          <form
            onSubmit={submitSearch}
            className="relative ml-6 hidden flex-1 lg:block"
          >
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sweets, namkeen, gifts…"
              className="h-11 w-full rounded-full border border-cream-300 bg-cream-100/60 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40"
            />
          </form>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href={waLink(`Hello ${config.businessName}! I have a question.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1fb457] md:inline-flex"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                aria-label="Account menu"
                className="flex h-10 items-center gap-2 rounded-full px-2.5 text-maroon-800 hover:bg-maroon-800/5 sm:px-3"
              >
                <User size={20} />
                <span className="hidden text-sm font-medium sm:inline">
                  {customer ? customer.name?.split(" ")[0] ?? "Account" : "Login / Sign up"}
                </span>
              </button>

              {accountMenuOpen && customer && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl border border-cream-300 bg-cream-50 p-1 shadow-card"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      router.push("/account");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-maroon-900 hover:bg-maroon-800/5",
                      !customer && "hidden",
                    )}
                    role="menuitem"
                  >
                    My Account
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      router.push("/login");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-maroon-900 hover:bg-maroon-800/5",
                      customer && "hidden",
                    )}
                    role="menuitem"
                  >
                    Login / Sign up
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      logout();
                      router.push("/");
                    }}
                    className={cn(
                      "mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-maroon-900 hover:bg-maroon-800/5",
                      !customer && "hidden",
                    )}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-maroon-800 hover:bg-maroon-800/5"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron-500 px-1 text-[11px] font-bold text-maroon-900">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden h-12 items-center gap-7 border-t border-cream-300/50 text-sm font-medium text-maroon-800 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="relative transition-colors hover:text-saffron-600"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </Container>

    </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 w-screen overflow-hidden lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/65"
            onClick={closeMenu}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100vw,24rem)] max-w-full flex-col overflow-hidden bg-cream-50 shadow-card">

            <div className="flex items-center justify-between border-b border-cream-300 px-4 py-4">
              <span className="font-serif text-lg font-bold text-maroon-900">
                Menu
              </span>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-maroon-800 hover:bg-maroon-800/5"
              >
                <X size={22} />
              </button>
            </div>



            <nav className="flex-1 overflow-y-auto p-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-maroon-900 hover:bg-maroon-800/5"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-cream-300 p-4">
              <Link
                href={customer ? "/account" : "/login"}
                onClick={closeMenu}
                className="flex items-center gap-2 text-sm font-medium text-maroon-800"
              >
                <User size={18} />
                {customer ? "My Account" : "Login / Sign up"}
              </Link>
              <a
                href={waLink(`Hello ${config.businessName}! I have a question.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-medium text-white",
                )}
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}
