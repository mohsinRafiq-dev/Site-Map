"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { proxyImg } from "@/lib/img";

// Plan image gallery with a click-to-zoom lightbox (arrow-key + swipe nav).
export default function PlanGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const [box, setBox] = useState(-1); // -1 = closed, else lightbox index

  useEffect(() => {
    if (box < 0) return;
    const onKey = (e) => {
      if (e.key === "Escape") setBox(-1);
      if (e.key === "ArrowRight") setBox((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setBox((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [box, images.length]);

  if (!images.length) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-3xl border border-line bg-mist text-6xl text-forest/20">
        ▦
      </div>
    );
  }

  return (
    <div>
      {/* Main image — click to zoom */}
      <button
        type="button"
        onClick={() => setBox(active)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-3xl border border-line bg-mist shadow-[var(--shadow-card)]"
      >
        <Image
          src={proxyImg(images[active].src, 1200)}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          priority
        />
        <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-night/65 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIcon /> Click to zoom
        </span>
      </button>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {images.map((g, i) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-2xl border bg-paper transition-all ${
                i === active ? "border-forest ring-2 ring-forest/25" : "border-line hover:border-forest/40"
              }`}
            >
              <div className="relative aspect-square bg-mist">
                <Image src={proxyImg(g.src, 300)} alt={g.label} fill unoptimized sizes="30vw" className="object-contain p-2" />
              </div>
              <div className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted">
                {g.label}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {box >= 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-night/90 p-4 backdrop-blur-sm"
          onClick={() => setBox(-1)}
          role="dialog"
          aria-modal="true"
        >
          <button aria-label="Close" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20">
            ✕
          </button>
          {images.length > 1 && (
            <button
              aria-label="Previous"
              onClick={(e) => { e.stopPropagation(); setBox((i) => (i - 1 + images.length) % images.length); }}
              className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
            >
              ‹
            </button>
          )}
          <figure className="max-h-[86vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxyImg(images[box].src, 1600)}
              alt={images[box].label}
              className="mx-auto max-h-[80vh] max-w-[92vw] rounded-xl bg-white/5 object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/70">
              {images[box].label} · {name}
            </figcaption>
          </figure>
          {images.length > 1 && (
            <button
              aria-label="Next"
              onClick={(e) => { e.stopPropagation(); setBox((i) => (i + 1) % images.length); }}
              className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  );
}
