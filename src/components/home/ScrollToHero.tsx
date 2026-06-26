"use client";

import { useEffect } from "react";

/**
 * On opening the home page, bring the hero carousel into view (scrolling past
 * the announcement bar + category rail). The hero's `scroll-mt-*` keeps it
 * just below the sticky header. Skips when the user deep-linked to a hash or
 * has already scrolled, and honours reduced-motion.
 */
export function ScrollToHero() {
  useEffect(() => {
    if (window.location.hash || window.scrollY > 0) return;
    const hero = document.getElementById("hero");
    if (!hero) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Wait a frame so layout (and the sticky header height) is settled.
    requestAnimationFrame(() => {
      hero.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });
  }, []);

  return null;
}
