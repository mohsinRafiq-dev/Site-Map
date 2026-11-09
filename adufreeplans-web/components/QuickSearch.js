"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { SearchIcon, ArrowRightIcon } from "@/components/icons";

const FUN = "https://www.frameupnow.com";

// Compact homepage "Plan Quick Search" bar (per the mockup). Collects the core
// facets and hands off to /plans, which already filters on these exact params.
export default function QuickSearch() {
  const router = useRouter();
  const [f, setF] = useState({ beds: "", baths: "", sqftMin: "", sqftMax: "", stories: "", garage: "" });

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v !== "") params.set(k, v);
    const qs = params.toString();
    router.push(`/plans${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="rounded-3xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] md:p-6">
      <form onSubmit={submit} className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <span className="shrink-0 pb-2.5 font-display text-lg text-ink lg:pb-0 lg:pr-2 lg:text-base">
          Plan Quick&nbsp;Search
        </span>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SelectField label="Bedrooms" value={f.beds} onChange={set("beds")}>
            <option value="">Any</option>
            <option value="0">Studio</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
          </SelectField>

          <SelectField label="Bathrooms" value={f.baths} onChange={set("baths")}>
            <option value="">Any</option>
            {[1, 1.5, 2, 2.5, 3].map((n) => <option key={n} value={n}>{n}+</option>)}
          </SelectField>

          {/* Sq Ft spans two columns on wide screens (min + max) */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <Label>Sq Ft</Label>
            <div className="flex items-center gap-2">
              <input
                type="number" inputMode="numeric" min="0" placeholder="Min"
                value={f.sqftMin} onChange={set("sqftMin")}
                className="w-full min-w-0 rounded-xl border border-line bg-cream/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest focus:bg-paper"
              />
              <span className="text-muted">–</span>
              <input
                type="number" inputMode="numeric" min="0" placeholder="Max"
                value={f.sqftMax} onChange={set("sqftMax")}
                className="w-full min-w-0 rounded-xl border border-line bg-cream/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest focus:bg-paper"
              />
            </div>
          </div>

          <SelectField label="Stories" value={f.stories} onChange={set("stories")}>
            <option value="">Any</option>
            <option value="1">1-Story</option>
            <option value="2">2-Story</option>
          </SelectField>

          <SelectField label="Garage" value={f.garage} onChange={set("garage")}>
            <option value="">Any</option>
            <option value="1">Garage</option>
          </SelectField>
        </div>

        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-600"
        >
          <SearchIcon size={16} /> View Matching Plans
        </button>
      </form>

      <div className="mt-3 flex justify-end">
        <Link
          href={`${FUN}/contact-us`}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold italic text-forest-600 hover:text-forest-700"
        >
          Already have a plan? Send it to FrameUpNow for a quote
          <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">{children}</label>;
}

function SelectField({ label, value, onChange, children }) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-line bg-cream/60 px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest focus:bg-paper"
      >
        {children}
      </select>
    </div>
  );
}
