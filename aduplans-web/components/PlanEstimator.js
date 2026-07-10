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
    // Same-origin: read the content height directly (most reliable).
    const measure = () => {
      try {
        const d = iframe?.contentDocument;
        if (d) apply(Math.max(d.body.scrollHeight, d.documentElement.scrollHeight));
      } catch {
        /* cross-origin fallback handled by postMessage below */
      }
    };
    const onMessage = (e) => apply(e?.data?.__estHeight);
    const onLoad = () => [100, 500, 1200, 2500, 4500].forEach((t) => setTimeout(measure, t));

    window.addEventListener("message", onMessage);
    iframe?.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("message", onMessage);
      iframe?.removeEventListener("load", onLoad);
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
      <iframe
        ref={frameRef}
        src={src}
        title="ADU Cost & Financing Estimator"
        scrolling="no"
        style={{ width: "100%", height, border: 0, display: "block", overflow: "hidden" }}
      />
    </section>
  );
}
