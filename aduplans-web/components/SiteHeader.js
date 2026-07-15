"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { MenuIcon, CloseIcon } from "@/components/icons";

const FUN = "https://www.frameupnow.com";
const SCHEDULE_URL = `${FUN}/schedule-an-appointment`;
// The FrameUpNow ADU Plan Fit Visualizer (placement tool). The top-of-site
// entry is the unbranded "Plan Fit Visualizer" label per the naming convention.
const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "http://localhost:5173";

// Exact aduplans.com nav: Builders · DIY (dropdown) · NapkinCAD · About Us · FAQs · Blog · Contact Us
const NAV = [
  { label: "Builders", href: `${FUN}/builders` },
  {
    label: "DIY",
    href: `${FUN}/diy`,
    children: [
      { label: "Order Samples", href: `${FUN}/order-sample` },
      { label: "DIY Videos", href: `${FUN}/diy-videos` },
      {
        label: "DIY Plans",
        href: `${FUN}/diy-plans`,
        children: [
          { label: "Affordable Homes/ADUs", href: `${FUN}/categories/affordable-homes` },
          { label: "Barndominium", href: `${FUN}/categories/barndominium` },
          { label: "Garage", href: `${FUN}/categories/garage` },
          { label: "Shops/Sheds", href: `${FUN}/categories/shops-sheds` },
        ],
      },
    ],
  },
  { label: "NapkinCAD", href: `${FUN}/napkincad` },
  { label: "About Us", href: `${FUN}/about-us` },
  { label: "FAQs", href: `${FUN}/faqs` },
  { label: "Blog", href: `${FUN}/blog` },
  { label: "Contact Us", href: `${FUN}/contact-us` },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur-md">
      <div className="container-x flex h-[4.75rem] items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/adu-logo.png" alt="ADU Plans" width={48} height={48} className="h-12 w-12 object-contain" priority />
          <span className="font-display text-xl font-semibold text-ink">ADUplans</span>
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
          {NAV.map((item) =>
            item.children ? (
              <Dropdown key={item.label} item={item} />
            ) : (
              <a key={item.label} href={item.href} {...EXT} className={linkCls}>{item.label}</a>
            )
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={SCHEDULE_URL}
            {...EXT}
            className="hidden rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-600 sm:inline-flex"
          >
            Schedule an Appointment
          </a>
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
              <MobileItem key={item.label} item={item} onNavigate={() => setOpen(false)} />
            ))}
            <div className="mt-3 border-t border-line pt-3">
              <a href={SCHEDULE_URL} {...EXT} className="block rounded-full bg-forest px-4 py-2.5 text-center text-sm font-semibold text-white">
                Schedule an Appointment
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

const linkCls =
  "rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-mist/60 hover:text-ink";

// Every header link is outbound (FrameUpNow / scheduling) → open in a new tab.
const EXT = { target: "_blank", rel: "noopener noreferrer" };

// A little "plan on a lot" glyph for the Plan Fit Visualizer link.
function PlanFitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
      <rect x="8" y="8" width="8" height="8" rx="1" />
    </svg>
  );
}

function Chevron({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Desktop dropdown with optional nested flyout (DIY → DIY Plans → categories).
function Dropdown({ item }) {
  return (
    <div className="group relative">
      <a href={item.href} {...EXT} className={`flex items-center gap-1 ${linkCls} group-hover:bg-mist/60 group-hover:text-ink`}>
        {item.label}
        <Chevron className="transition-transform group-hover:rotate-180" />
      </a>
      <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
        <div className="min-w-52 rounded-2xl border border-line bg-paper p-1.5 shadow-[var(--shadow-lift)]">
          {item.children.map((c) =>
            c.children ? (
              <div key={c.label} className="group/sub relative">
                <a href={c.href} {...EXT} className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-mist hover:text-forest-700">
                  {c.label}
                  <Chevron className="-rotate-90" />
                </a>
                <div className="invisible absolute left-full top-0 z-50 pl-2 opacity-0 transition-all duration-150 group-hover/sub:visible group-hover/sub:opacity-100">
                  <div className="min-w-56 rounded-2xl border border-line bg-paper p-1.5 shadow-[var(--shadow-lift)]">
                    {c.children.map((g) => (
                      <a key={g.label} href={g.href} {...EXT} className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-mist hover:text-forest-700">
                        {g.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a key={c.label} href={c.href} {...EXT} className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-mist hover:text-forest-700">
                {c.label}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile accordion item (one level of children shown indented).
function MobileItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  if (!item.children) {
    return <a href={item.href} {...EXT} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-mist">{item.label}</a>;
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-mist"
      >
        {item.label}
        <Chevron className={expanded ? "rotate-180" : ""} />
      </button>
      {expanded && (
        <div className="ml-3 border-l border-line pl-2">
          {item.children.map((c) =>
            c.children ? (
              <div key={c.label}>
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{c.label}</div>
                {c.children.map((g) => (
                  <a key={g.label} href={g.href} {...EXT} className="block rounded-lg px-4 py-2 text-sm text-ink-soft hover:bg-mist">{g.label}</a>
                ))}
              </div>
            ) : (
              <a key={c.label} href={c.href} {...EXT} className="block rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-mist">{c.label}</a>
            )
          )}
        </div>
      )}
    </div>
  );
}
