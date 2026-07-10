import Link from "next/link";
import { getAllPlans, buildFacets } from "@/lib/baserow";
import StateSelector from "@/components/StateSelector";
import USAMap from "@/components/USAMap";
import DesignersSection from "@/components/DesignersSection";
import StatCounters from "@/components/StatCounters";
import MetalVsWood from "@/components/MetalVsWood";
import EightSteps from "@/components/EightSteps";
import PlanCard from "@/components/PlanCard";

// Real content mirrored from aduplans.com
const VIDEOS = [
  "GncoRZO4rAI", "R0VZMLq_74Q", "Gl8Y2hnVSX0", "8kx_BZTx2hs",
  "MerPhwrbB-c", "zuwfcVv9Rkk", "km4yeQrO7_o", "BuNzQaJor_s",
];

export default async function HomePage() {
  const plans = await getAllPlans();
  const facets = buildFacets(plans);
  const placeable = plans.filter((p) => p.placeable);
  const featured = placeable
    .filter((p) => p.elevationImage)
    .filter((_, i) => i % 11 === 0)
    .slice(0, 8);

  return (
    <>
      {/* ── Hero (real ADUplans collage background) ──────────────────────── */}
      <section className="relative overflow-hidden">
        {/* The original pre-darkened ADU-renderings collage, with a slow drift */}
        <div
          aria-hidden
          className="animate-kenburns absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: "url('/hero-section.jpg')" }}
        />
        {/* Light overlay — image is already dimmed, just aid text contrast */}
        <div aria-hidden className="absolute inset-0 bg-night/30" />

        {/* Floating glow orbs for depth */}
        <div aria-hidden className="animate-floaty pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-forest/25 blur-3xl" />
        <div aria-hidden className="animate-floaty-slow pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-amber/20 blur-3xl" />

        {/* Content */}
        <div
          className="relative container-x py-24 text-center text-white md:py-28"
          style={{ textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}
        >
          <div className="mx-auto max-w-3xl">
            <span className="rise-in delay-1 mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
              Design · Place · Build
            </span>
            <h1 className="rise-in delay-2 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              ADU Plans for Any Jurisdiction
            </h1>
            <p className="rise-in delay-2 mt-4 text-2xl font-bold">
              <span className="shimmer-green">Powered by FrameUpNow</span>
            </p>
            <p className="rise-in delay-3 mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/85">
              At ADUplans.com, we’ve brought together a country-wide collection of Permit-Ready
              Accessory Dwelling Units (PRADUs) — all in one place — to help you find the perfect
              design for your space and needs.
            </p>
            <p className="rise-in delay-4 mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
              Whether you’re looking for a fast-track build by choosing a PRADU plan from your
              jurisdiction, or a more flexible ADU option for any location, you’re in the right place.
              Once you’ve found a plan you love,{" "}
              <a
                href="https://www.frameupnow.com/diy-plans"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white underline decoration-amber decoration-2 underline-offset-4 hover:text-amber"
              >
                FrameUpNow can convert it into a high-quality steel frame package
              </a>
              , helping you build faster, stronger, and smarter.
            </p>
            <p className="rise-in delay-5 mt-8 text-lg font-medium text-white">
              Click your state from the <strong className="text-amber">map</strong> below to begin
            </p>

            {/* cute bouncing scroll cue */}
            <a href="#select-state" aria-label="Jump to the map" className="rise-in delay-5 mx-auto mt-8 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20">
              <svg className="animate-bounce-down" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── A note to jurisdictions + top-10 designers + City Planner video ─ */}
      <DesignersSection />

      {/* ── Select your state (+ PRADU counters) ─────────────────────────── */}
      <section id="select-state" className="border-t border-line bg-paper py-16 md:py-20">
        <div className="container-x">
        <div className="reveal mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl leading-tight text-ink md:text-4xl">
            Choose a plan from the largest PRADU database in the world.
          </h2>
          <p className="mt-3 text-forest-600">
            And FrameUpNow will convert it to steel framing for you.
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-forest-600">
            Select your state
          </p>
        </div>

        {/* PRADU counters */}
        <div className="mt-8">
          <StatCounters total={plans.length} lastMonth={122} />
        </div>

        <div className="mt-12">
          <p className="mb-5 text-center text-sm text-ink-soft">
            Click your state on the map to begin — {facets.states.length} states with permit-ready
            plans and growing.
          </p>
          <USAMap states={facets.states} />
        </div>

        <details className="mx-auto mt-8 max-w-4xl">
          <summary className="cursor-pointer text-center text-sm font-semibold text-forest hover:text-forest-600">
            Or choose your state from the list ↓
          </summary>
          <div className="mt-6">
            <StateSelector states={facets.states} />
          </div>
        </details>
        </div>
      </section>

      {/* ── Featured plans ───────────────────────────────────────────────── */}
      <section className="container-x py-16">
        <div className="reveal flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Popular plans</span>
            <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">Featured PRADUs</h2>
          </div>
          <Link href="/plans" className="hidden shrink-0 text-sm font-semibold text-forest hover:text-forest-600 sm:block">
            View all {plans.length.toLocaleString()} →
          </Link>
        </div>
        <div className="reveal-stagger mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {featured.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* ── 20 reasons: Metal vs Wood ────────────────────────────────────── */}
      <MetalVsWood />

      {/* ── 8 steps wheel ────────────────────────────────────────────────── */}
      <EightSteps />

      {/* ── Videos ───────────────────────────────────────────────────────── */}
      <section className="bg-paper py-16">
        <div className="container-x">
          <div className="reveal mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-ink md:text-4xl">Watch how it’s done</h2>
            <p className="mt-3 text-ink-soft">Short videos on framing, assembly, and PRADUs.</p>
          </div>
          <div className="reveal-stagger mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {VIDEOS.map((id) => (
              <a
                key={id}
                href={`https://youtu.be/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover group relative aspect-video overflow-hidden rounded-xl border border-line bg-night"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="Video" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-forest shadow-lg">▶</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="container-x py-16">
        <div className="reveal hero-surface overflow-hidden rounded-3xl px-8 py-14 text-center text-white md:px-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl md:text-4xl">
            Find a plan you love and see it on your lot — free.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            No architect. No survey. Just your address and a plan you like.
          </p>
          <Link href="/plans" className="mt-8 inline-flex rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5">
            Browse floor plans →
          </Link>
        </div>
      </section>
    </>
  );
}

