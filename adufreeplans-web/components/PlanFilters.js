"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SearchIcon, ChevronDownIcon } from "@/components/icons";

export default function PlanFilters({ facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const get = (k) => params.get(k) || "";

  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params.toString());
      if (value === "" || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
      next.delete("page"); // any filter change resets to page 1
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  // Live, debounced search (updates results as you type).
  const [q, setQ] = useState(get("q"));
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (params.get("q") || "")) setParam("q", q);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggleParam = (key, value) => setParam(key, get(key) === String(value) ? "" : value);

  const activeCount = ["q", "state", "beds", "baths", "stories", "garage", "placeable"].filter((k) =>
    params.get(k)
  ).length;

  const clearAll = () => {
    setQ("");
    router.push(pathname, { scroll: false });
  };

  const body = (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <Field label="Search">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plan name, city…"
            className="w-full rounded-xl border border-line bg-cream/60 px-4 py-2.5 pr-9 text-sm outline-none transition-colors focus:border-forest focus:bg-white"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon size={15} />
          </span>
        </div>
      </Field>

      {/* Placeable */}
      <Field label="Availability">
        <button
          type="button"
          onClick={() => toggleParam("placeable", "1")}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            get("placeable") === "1"
              ? "border-forest bg-mist text-forest-700"
              : "border-line bg-cream/60 text-ink-soft hover:border-forest/40"
          }`}
        >
          Fits on a lot (placeable)
          <span className={`grid h-5 w-9 items-center rounded-full px-0.5 transition-colors ${get("placeable") === "1" ? "bg-forest" : "bg-line"}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition-transform ${get("placeable") === "1" ? "translate-x-4" : ""}`} />
          </span>
        </button>
      </Field>

      {/* State */}
      <Field label="State">
        <select
          value={get("state")}
          onChange={(e) => setParam("state", e.target.value)}
          className="w-full rounded-xl border border-line bg-cream/60 px-3 py-2.5 text-sm outline-none focus:border-forest focus:bg-white"
        >
          <option value="">All states</option>
          {facets.states.map((s) => (
            <option key={s.code} value={s.code}>{s.code} ({s.count})</option>
          ))}
        </select>
      </Field>

      {/* Bedrooms */}
      <Field label="Bedrooms">
        <div className="flex flex-wrap gap-2">
          {facets.beds.map((b) => (
            <Pill key={b} active={get("beds") === String(b)} onClick={() => toggleParam("beds", b)}>
              {b === 0 ? "Studio" : `${b}`}
            </Pill>
          ))}
        </div>
      </Field>

      {/* Bathrooms */}
      <Field label="Bathrooms">
        <div className="flex flex-wrap gap-2">
          {facets.baths.map((b) => (
            <Pill key={b} active={get("baths") === String(b)} onClick={() => toggleParam("baths", b)}>
              {b}
            </Pill>
          ))}
        </div>
      </Field>

      {/* Stories + Garage */}
      <Field label="Layout">
        <div className="flex flex-wrap gap-2">
          <Pill active={get("stories") === "1"} onClick={() => toggleParam("stories", "1")}>1-Story</Pill>
          <Pill active={get("stories") === "2"} onClick={() => toggleParam("stories", "2")}>2-Story</Pill>
          <Pill active={get("garage") === "1"} onClick={() => toggleParam("garage", "1")}>Garage</Pill>
        </div>
      </Field>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="mb-4 flex w-full items-center justify-between rounded-xl border border-line bg-paper px-4 py-3 text-sm font-semibold lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          Filters {activeCount > 0 && <span className="chip bg-forest text-white">{activeCount}</span>}
        </span>
        <ChevronDownIcon size={16} className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
      </button>

      <aside className={`${mobileOpen ? "block" : "hidden"} lg:block`}>
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-20">
          {body}
        </div>
      </aside>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</h4>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-forest bg-forest text-white"
          : "border-line bg-cream/60 text-ink-soft hover:border-forest/40"
      }`}
    >
      {children}
    </button>
  );
}
