"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps the storefront chrome (announcement bar, header, footer, cart drawer)
 * around page content — but renders nothing but the page on `/admin` routes,
 * which supply their own full-screen dashboard shell. The chrome pieces are
 * passed in as props so server components (AnnouncementBar, Footer) stay on the
 * server while this thin client wrapper only decides layout by pathname.
 */
export function SiteChrome({
  announcement,
  header,
  categoryNav,
  footer,
  drawer,
  children,
}: {
  announcement: React.ReactNode;
  header: React.ReactNode;
  categoryNav?: React.ReactNode;
  footer: React.ReactNode;
  drawer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  const showCategoryNav = (() => {
    // Category nav is meant for storefront browsing, not utility/auth or product pages.
    const p = pathname ?? "";
    if (
      p === "/" ||
      p.startsWith("/collections") ||
      p.startsWith("/shop")
    )
      return true;

    // Otherwise hide.
    return false;
  })();

  return (
    <div className="flex min-h-full w-full min-w-0 flex-col overflow-x-clip">
      {announcement}
      {header}
      {showCategoryNav ? categoryNav : null}
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      {footer}
      {drawer}
    </div>
  );
}
