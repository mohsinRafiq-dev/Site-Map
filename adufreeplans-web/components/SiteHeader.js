"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { MenuIcon, CloseIcon } from "@/components/icons";

const FUN = "https://www.frameupnow.com";

// New houseplansfree.com nav (per the V1.2 mockup): How It Works · Why Steel ·
// About Us · Blogs. Blogs is external (opens FrameUpNow's blog in a new tab);
// the rest are pages on this site. "Contact Us" is the right-hand button.
const NAV = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Why Steel", href: "/why-steel" },
  { label: "About Us", href: "/about" },
  { label: "Blogs", href: `${FUN}/blog`, external: true },
];

// Top-of-nav tools ribbon (grouped box). Each opens its own content page on
// this site; the Plan Fit Visualizer page in turn links out to the live
// placement tool, and Ask AI links each question into ChatGPT.
const TOOLS = [
  { label: "Plan Fit Visualizer", href: "/plan-fit-visualizer", external: false },
  { label: "Cost Estimator", href: "/cost-estimator", external: false },
  { label: "Ask AI", href: "/ask-ai", external: false },
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

// A single tool inside the ribbon. External tools (the placement tool) open in a
// new tab; internal/placeholder tools use a client-side link.
function ToolLink({ tool, className, onClick }) {
  const label = tool.label;
  if (tool.external) {
    return (
      <a href={tool.href} {...EXT} className={className} onClick={onClick}>
        {label}
      </a>
    );
  }
  return (
    <Link href={tool.href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur-md">
      <div className="container-x flex h-[4.75rem] items-center justify-between gap-4">
        {/* Logo — the blue HousePlansFree wordmark on the light header, the white
            one on the dark header. Toggled by data-theme in globals.css. */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="HousePlansFree.com — powered by FrameUpNow.com">
          <Image
            src="/logo-wordmark.png"
            alt="HousePlansFree.com — powered by FrameUpNow.com"
            width={1515}
            height={264}
            priority
            className="header-logo-light h-10 w-auto md:h-11 xl:h-12 2xl:h-14"
          />
          <Image
            src="/logo-wordmark-white.png"
            alt=""
            aria-hidden
            width={1515}
            height={264}
            priority
            className="header-logo-dark h-10 w-auto md:h-11 xl:h-12 2xl:h-14"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {/* Tools ribbon — grouped box */}
          <div className="mr-1.5 flex items-center rounded-full border border-forest/30 bg-mist/50 p-1">
            {TOOLS.map((t) => (
              <ToolLink
                key={t.label}
                tool={t}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-forest-700 transition-colors hover:bg-mist hover:text-forest"
              />
            ))}
          </div>
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
            {/* Tools ribbon — grouped box */}
            <div className="mb-2 rounded-xl border border-forest/30 bg-mist/50 p-1">
              {TOOLS.map((t) => (
                <ToolLink
                  key={t.label}
                  tool={t}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-forest-700 hover:bg-mist"
                />
              ))}
            </div>
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
