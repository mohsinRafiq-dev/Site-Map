"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import map from "@/lib/usMap.json";

const STATE_NAMES = Object.fromEntries(map.states.map((s) => [s.code, s.name]));

// The real "Select your state" interaction — a clickable US map. States with
// plans are filled green and navigate to that state's catalog; the rest are
// muted and non-interactive. A tooltip shows the state name + plan count.
// `bare` drops USAMap's own card chrome (border/padding/shadow) — used when the
// map already sits inside a framed card, so there's a single border, not two.
export default function USAMap({ states, bare = false }) {
  const router = useRouter();
  const counts = Object.fromEntries(states.map((s) => [s.code, s.count]));
  const [hover, setHover] = useState(null);

  return (
    <div className="relative">
      <div
        className={
          bare
            ? ""
            : "-mx-5 overflow-hidden border-y border-line bg-paper p-2 shadow-[var(--shadow-card)] sm:mx-0 sm:rounded-3xl sm:border sm:p-6"
        }
      >
        <svg
          viewBox={map.viewBox}
          className="h-auto w-full"
          role="img"
          aria-label="Map of the United States — select your state"
        >
          {/* State shapes */}
          {map.states.map((s) => {
            const count = counts[s.code] || 0;
            const has = count > 0;
            const isHover = hover?.code === s.code;
            return (
              <path
                key={s.code}
                d={s.d}
                role={has ? "button" : undefined}
                tabIndex={has ? 0 : undefined}
                aria-label={has ? `${STATE_NAMES[s.code]} — ${count} ${count === 1 ? "plan" : "plans"}` : undefined}
                className={has ? "us-state cursor-pointer transition-colors duration-150" : "transition-colors duration-150"}
                fill={
                  !has
                    ? "var(--color-line-soft)"
                    : isHover
                    ? "var(--color-amber)"
                    : "var(--color-forest)"
                }
                stroke="var(--color-paper)"
                strokeWidth="1.2"
                onMouseEnter={(e) => has && setHover({ code: s.code, count, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => has && setHover({ code: s.code, count, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}
                onFocus={(e) => {
                  if (!has) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  setHover({ code: s.code, count, x: r.left + r.width / 2, y: r.top });
                }}
                onBlur={() => setHover(null)}
                onKeyDown={(e) => {
                  if (has && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    router.push(`/plans?state=${s.code}`);
                  }
                }}
                onClick={() => has && router.push(`/plans?state=${s.code}`)}
              />
            );
          })}

          {/* Leader lines for small crowded NE states */}
          {map.states.filter((s) => s.leader).map((s) => (
            <line
              key={`ldr-${s.code}`}
              x1={s.cx} y1={s.cy} x2={s.lx} y2={s.ly}
              stroke="var(--color-muted)" strokeWidth="0.8"
            />
          ))}

          {/* State code labels */}
          {map.states.map((s) => {
            const has = (counts[s.code] || 0) > 0;
            const x = s.leader ? s.lx : s.cx;
            const y = s.leader ? s.ly : s.cy;
            return (
              <text
                key={`lbl-${s.code}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className={`us-map-label pointer-events-none select-none${s.leader ? " leader" : ""}`}
                style={{
                  fill: has ? "#ffffff" : "var(--color-muted)",
                  // A dark halo keeps white labels readable even when the state's
                  // label centroid falls on the light ocean background (e.g. the
                  // FL peninsula, the scattered HI islands).
                  stroke: has ? "rgba(16,40,26,0.6)" : "transparent",
                  strokeWidth: has ? 3 : 0,
                  paintOrder: "stroke",
                }}
              >
                {s.code}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--color-forest)" }} /> Plans available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--color-amber)" }} /> Hovered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--color-line-soft)" }} /> Coming soon
        </span>
      </div>

      {/* Tooltip — portaled to body so ancestor transforms can't offset it.
          `hover` starts null, so nothing renders during SSR/hydration. */}
      {hover && hover.count > 0 && typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full rounded-lg bg-night px-3 py-2 text-center text-white shadow-lg"
            style={{ left: hover.x, top: hover.y - 12 }}
          >
            <div className="font-display text-sm leading-tight">{STATE_NAMES[hover.code]}</div>
            <div className="text-[11px] text-white/70">
              {hover.count.toLocaleString()} {hover.count === 1 ? "plan" : "plans"} →
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
