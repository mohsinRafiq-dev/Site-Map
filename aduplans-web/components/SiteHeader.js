"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { MenuIcon, CloseIcon } from "@/components/icons";

const FUN = "https://www.frameupnow.com";
// The FrameUpNow ADU Plan Fit Visualizer (placement tool). The top-of-site
// entry is the unbranded "Plan Fit Visualizer" label per the naming convention.
const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "http://localhost:5173";

// New aduplans.com nav (per the V1.2 mockup): How It Works · Why Steel ·
// About Us · Blogs. Blogs is external (opens FrameUpNow's blog in a new tab);
// the rest are pages on this site. "Contact Us" is the right-hand button.
const NAV = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Why Steel", href: "/why-steel" },
  { label: "About Us", href: "/about" },
  { label: "Blogs", href: `${FUN}/blog`, external: true },
];

const EXT = { target: "_blank", rel: "noopener noreferrer" };
const linkCls =
  "rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-mist/60 hover:text-ink";

// Internal pages navigate client-side (Link); external links open in a new tab.
function NavLink({ item, className, onClick }) {
  const cls = className || linkCls;
  if (item.external) {
    return (
      <a href={item.href} {...EXT} className={cls} onClick={onClick}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={cls} onClick={onClick}>
      {item.label}
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur-md">
      <div className="container-x flex h-[4.75rem] items-center justify-between gap-4">
        {/* Logo — "aduplans.com" wordmark + "Powered by FrameUpNow" tagline
            (sans-serif, matching the aduplans.com brand mark exactly). */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/adu-logo.png" alt="aduplans.com" width={40} height={40} className="h-10 w-10 object-contain" priority />
          <span className="flex flex-col items-end leading-none">
            <span className="font-sans text-[1.35rem] font-bold leading-none tracking-tight text-ink">
              aduplans<span className="text-forest">.com</span>
            </span>
            <span className="mt-1 text-right text-[11px] font-normal leading-none text-muted">
              Powered by <span className="font-semibold text-ink-soft">FrameUpNow</span>
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          <a
            href={TOOL_URL}
            {...EXT}
            className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-mist/60 px-3.5 py-2 text-sm font-semibold text-forest-700 transition-colors hover:bg-mist hover:text-forest"
          >
            <PlanFitIcon /> Plan Fit Visualizer
          </a>
          {NAV.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/contact"
            className="hidden rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-600 sm:inline-flex"
          >
            Contact Us
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ink lg:hidden"
          >
            {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line bg-cream lg:hidden">
          <nav className="container-x flex flex-col py-3">
            <a
              href={TOOL_URL}
              {...EXT}
              onClick={() => setOpen(false)}
              className="mb-1 inline-flex items-center gap-2 rounded-xl border border-forest/30 bg-mist/60 px-3 py-2.5 text-sm font-semibold text-forest-700"
            >
              <PlanFitIcon /> Plan Fit Visualizer
            </a>
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-mist"
              />
            ))}
            <div className="mt-3 border-t border-line pt-3">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-forest px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Contact Us
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// A little "plan on a lot" glyph for the Plan Fit Visualizer link.
function PlanFitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </svg>
  );
}
