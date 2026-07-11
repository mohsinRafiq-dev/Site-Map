"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Adds `.is-visible` to any `.reveal` / `.reveal-stagger` element as it scrolls
// into view, powering the site-wide fade-and-rise animations. No-JS and
// reduced-motion users see everything normally (CSS gates on `html.js-ready`).
//
// It also watches for content that mounts AFTER first paint — sections streamed
// in via <Suspense> arrive late, so a one-time scan would leave them stuck at
// the hidden base state. A MutationObserver registers them as they appear.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js-ready");

    const SEL = ".reveal, .reveal-stagger";

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(SEL).forEach((el) => el.classList.add("is-visible"));
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

    const seen = new WeakSet();
    const observe = (el) => {
      if (!seen.has(el)) {
        seen.add(el);
        io.observe(el);
      }
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return; // elements only
      if (node.matches?.(SEL)) observe(node);
      node.querySelectorAll?.(SEL).forEach(observe);
    };

    scan(document.body);

    // Pick up sections that stream in later (Suspense-resolved async content).
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
