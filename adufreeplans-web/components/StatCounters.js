"use client";

import { useEffect, useRef, useState } from "react";

// Count-up animation that fires when the number scrolls into view.
function useCountUp(target, duration = 1600) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            setVal(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return [val, ref];
}

function Stat({ target, label }) {
  const [val, ref] = useCountUp(target);
  return (
    <div
      ref={ref}
      className="relative flex-1 overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-paper to-mist/40 p-6 text-center shadow-[var(--shadow-card)]"
    >
      <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-forest/5" />
      <div className="flex items-center justify-center gap-2">
        <span className="font-display tabular-nums text-4xl font-extrabold tracking-tight text-forest md:text-5xl">
          {val.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}

export default function StatCounters({ total, lastMonth }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 sm:flex-row">
      <Stat target={total} label="Total ADU Plan Count" />
      <Stat target={lastMonth} label="Total ADU Plans Added Last Month" />
    </div>
  );
}
