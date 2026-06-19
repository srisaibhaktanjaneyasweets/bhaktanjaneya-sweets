"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";

import {
  Menu,
  X,
  Search,
  ShoppingBag,
  User,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api/client";
import { waLink } from "@/lib/whatsapp";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const leadingLinks = [
  { href: "/", label: "Home" },
  { href: "/find-my-order", label: "Find my order" },
  { href: "/shop", label: "Shop All" },
];

const trailingLinks = [
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleCategoriesEnter() {
    if (categoriesTimeoutRef.current) {
      clearTimeout(categoriesTimeoutRef.current);
      categoriesTimeoutRef.current = null;
    }
    setCategoriesOpen(true);
  }

  function handleCategoriesLeave() {
    if (categoriesTimeoutRef.current) {
      clearTimeout(categoriesTimeoutRef.current);
    }
    categoriesTimeoutRef.current = setTimeout(() => {
      setCategoriesOpen(false);
    }, 200); // 200ms delay to prevent accidental closing
  }

  function handleCategoryClick() {
    if (categoriesTimeoutRef.current) {
      clearTimeout(categoriesTimeoutRef.current);
      categoriesTimeoutRef.current = null;
    }
    setCategoriesOpen(false);
  }

  useEffect(() => {
    return () => {
      if (categoriesTimeoutRef.current) {
        clearTimeout(categoriesTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    apiGet<Category[]>("/categories")
      .then((cats) => {
        if (active) setCategories(cats);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  function lockBodyScroll(locked: boolean) {
    // Use class-based locking to avoid getting stuck when route changes.
    document.body.classList.toggle("scroll-locked", locked);
    document.body.style.overflow = locked ? "hidden" : "";
  }

  useEffect(() => {
    if (menuOpen || mobileSearchOpen) lockBodyScroll(true);
    else lockBodyScroll(false);

    return () => {
      // Safety net on unmount
      lockBodyScroll(false);
    };
  }, [menuOpen, mobileSearchOpen]);



  function closeMenu() {
    setMenuOpen(false);
    lockBodyScroll(false);
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
            <div className="absolute inset-x-0 top-0 z-50 flex h-16 items-center gap-3 border-b border-cream-300 bg-cream-50 px-4 lg:hidden">
              <div className="flex-1">
                <HeaderSearch
                  variant="mobile"
                  autoFocus
                  onNavigate={() => setMobileSearchOpen(false)}
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-maroon-800 hover:bg-maroon-800/5"
              >
                <X size={22} />
              </button>
            </div>
          )}


          {/* Desktop search */}
          <div className="ml-6 hidden flex-1 lg:block">
            <HeaderSearch variant="desktop" onNavigate={closeMenu} />
          </div>

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
              {customer ? (
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  aria-label="Account menu"
                  className="flex h-10 items-center gap-2 rounded-full px-2.5 text-maroon-800 hover:bg-maroon-800/5 sm:px-3"
                >
                  <User size={20} />
                  <span className="hidden text-sm font-medium sm:inline">
                    {customer.name?.split(" ")[0] ?? "Account"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  aria-label="Login"
                  className="flex h-10 items-center gap-2 rounded-full px-2.5 text-maroon-800 hover:bg-maroon-800/5 sm:px-3"
                >
                  <User size={20} />
                  <span className="hidden text-sm font-medium sm:inline">Login / Sign up</span>
                </button>
              )}

              {customer && accountMenuOpen && (
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
                      !customer && "hidden sm:inline-flex",
                      "login-item"
                    )}
                    role="menuitem"
                  >
                    My Account
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
          {leadingLinks.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="relative whitespace-nowrap transition-colors hover:text-saffron-600"
            >
              {l.label}
            </Link>
          ))}

          {categories.length > 0 && (
            <div
              className="relative"
              onMouseEnter={handleCategoriesEnter}
              onMouseLeave={handleCategoriesLeave}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={categoriesOpen}
                onClick={() => {
                  if (categoriesTimeoutRef.current) {
                    clearTimeout(categoriesTimeoutRef.current);
                    categoriesTimeoutRef.current = null;
                  }
                  setCategoriesOpen((v) => !v);
                }}
                className="inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-saffron-600"
              >
                Categories
                <ChevronDown
                  size={15}
                  className={cn("transition-transform", categoriesOpen && "rotate-180")}
                />
              </button>

              {categoriesOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-1 w-60 max-h-[70vh] overflow-y-auto rounded-xl border border-cream-300 bg-cream-50 p-1.5 shadow-card"
                >
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${c.slug}`}
                      role="menuitem"
                      onClick={handleCategoryClick}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-maroon-900 transition-colors hover:bg-maroon-800/5 hover:text-saffron-600"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {trailingLinks.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="relative whitespace-nowrap transition-colors hover:text-saffron-600"
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
              {leadingLinks.concat(trailingLinks).map((l) => (

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
