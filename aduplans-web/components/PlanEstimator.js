"use client";

import { useEffect, useRef, useState } from "react";

// Embeds the exact aduplans.com PRADU cost/financing/shipping estimator
// (original HTML/CSS/JS + Google Maps) in an isolated iframe so it renders
// 100% identically. The iframe auto-sizes to its content so there's no inner
// scrollbar.
export default function PlanEstimator({ sqft, state, jurisdiction, floorPlan = "", elevation = "" }) {
  const [height, setHeight] = useState(1700);
  const frameRef = useRef(null);

  useEffect(() => {
    const iframe = frameRef.current;
    let last = 0;
    const apply = (h) => {
      if (typeof h === "number" && h > 200 && Math.abs(h - last) > 3) {
        last = h;
        setHeight(h + 20);
      }
    };
    // Same-origin: measure the estimator's actual content wrapper, not the whole
    // document. document.scrollHeight can be inflated by a leftover full-viewport
    // element (the estimator's .c-section is min-height:100vh in its own CSS),
    // which left a huge empty area below the form. The .container bottom is the
    // true content height.
    const measure = () => {
      try {
        const d = iframe?.contentDocument;
        if (!d) return;
        const el = d.querySelector(".container");
        const h = el
          ? Math.ceil(el.getBoundingClientRect().bottom)
          : Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
        apply(h);
      } catch {
        /* cross-origin fallback handled by postMessage below */
      }
    };
    const onMessage = (e) => apply(e?.data?.__estHeight);
    // Keep the estimator's theme in lock-step with the site's light/dark toggle.
    const getTheme = () =>
      document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const sendTheme = () => {
      try {
        iframe?.contentWindow?.postMessage({ __setTheme: getTheme() }, "*");
      } catch {
        /* iframe not ready yet — the load handler re-sends */
      }
    };
    const onLoad = () => {
      sendTheme();
      [100, 500, 1200, 2500, 4500].forEach((t) => setTimeout(measure, t));
    };

    window.addEventListener("message", onMessage);
    iframe?.addEventListener("load", onLoad);
    // Re-push the theme whenever the toggle flips data-theme on <html>.
    const themeObserver = new MutationObserver(sendTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      window.removeEventListener("message", onMessage);
      iframe?.removeEventListener("load", onLoad);
      themeObserver.disconnect();
    };
  }, []);

  const src =
    `/estimator/frame.html?sqft=${encodeURIComponent(sqft)}` +
    `&state=${encodeURIComponent(state || "")}` +
    `&jurisdiction=${encodeURIComponent(jurisdiction || "")}` +
    `&floorPlan=${encodeURIComponent(floorPlan || "")}` +
    `&elevation=${encodeURIComponent(elevation || "")}`;

  return (
    <section className="mt-12">
      {/* The estimator now follows the site theme (synced into the iframe). The
          wrapper background mirrors the estimator's own --bg in both modes. */}
      <div
        className="overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-card)]"
        style={{ background: "var(--est-bg)" }}
      >
        <iframe
          ref={frameRef}
          src={src}
          title="ADU Cost & Financing Estimator"
          scrolling="no"
          style={{ width: "100%", height, border: 0, display: "block", overflow: "hidden" }}
        />
      </div>
    </section>
  );
}
