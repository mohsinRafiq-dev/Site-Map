"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Adds `.is-visible` to any `.reveal` / `.reveal-stagger` element as it scrolls
// into view, powering the site-wide fade-and-rise animations. No-JS and
// reduced-motion users see everything normally (CSS gates on `html.js-ready`).
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js-ready");

    const els = Array.from(document.querySelectorAll(".reveal, .reveal-stagger"));
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
