"use client";

import { useEffect, useState } from "react";
import { DESIGNERS } from "@/lib/designers";

// The clickable top-10 list. Each firm opens a popup with its contact card
// (mirrors aduplans.com: State, City, Architect, Address, Zip, Telephone,
// Email, Website).
export default function DesignerList() {
  const [active, setActive] = useState(null); // designer object or null

  return (
    <>
      <ol className="grid grid-cols-1 gap-3 sm:grid-flow-col sm:grid-rows-5">
        {DESIGNERS.map((d, i) => {
          const rank = i + 1;
          const featured = rank === 1;
          return (
            <li key={d.firm}>
              <button
                type="button"
                onClick={() => setActive(d)}
                className={`card-hover flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left shadow-[var(--shadow-card)] ${
                  featured ? "border-forest bg-mist" : "border-line bg-paper"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-ink">
                  {d.firm}
                  {featured && <span className="chip bg-forest text-white">Powered by</span>}
                </span>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                    featured ? "bg-forest-700" : "bg-forest"
                  }`}
                >
                  {rank}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {active && <DesignerModal designer={active} onClose={() => setActive(null)} />}
    </>
  );
}

function DesignerModal({ designer, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const rows = [
    { label: "State", value: designer.state },
    { label: "City", value: designer.city },
    { label: "Architect", value: designer.architect || "—" },
    { label: "Address", value: designer.address },
    { label: "Zip", value: designer.zip },
    { label: "Telephone", value: <a href={`tel:${designer.telephone}`} className="hover:text-forest">{designer.telephone}</a> },
    { label: "Email Address", value: <a href={`mailto:${designer.email}`} className="hover:text-forest">{designer.email}</a> },
    {
      label: "Website",
      value: (
        <a href={designer.url.startsWith("http") ? designer.url : `https://${designer.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700">
          {designer.url}
        </a>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={designer.firm}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-night/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-lift)]">
        <div className="relative border-b border-line px-6 py-5 text-center">
          <h3 className="font-display text-2xl font-bold text-forest">{designer.firm}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-line/50 hover:text-ink">
            ✕
          </button>
        </div>

        <dl className="px-6 py-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-4 border-b border-line-soft py-3 last:border-0">
              <dt className="flex w-32 shrink-0 items-center gap-1.5 font-semibold text-forest-600">
                <span className="text-amber">•</span> {r.label}
              </dt>
              <dd className="text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
