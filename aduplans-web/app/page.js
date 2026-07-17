import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getAllPlans, buildFacets } from "@/lib/baserow";
import USAMap from "@/components/USAMap";
import StateSelector from "@/components/StateSelector";
import StatCounters from "@/components/StatCounters";
import QuickSearch from "@/components/QuickSearch";
import PlanCard from "@/components/PlanCard";
import { ArrowRightIcon } from "@/components/icons";

// Serve a cached, statically-rendered shell and refresh the catalog snapshot
// every 5 minutes in the background (ISR) — visitors never wait on Baserow.
export const revalidate = 300;

const FUN = "https://www.frameupnow.com";
const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "http://localhost:5173";

export default function HomePage() {
  return (
    <>
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-center text-white"
        style={{ background: "linear-gradient(100deg, #3b5a1f 0%, #4c7328 55%, #3b5a1f 100%)" }}
      >
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="container-x relative py-10 md:py-12">
          <h1 className="rise-in font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
            Explore 4,000+ ADU Plans
          </h1>
          <p className="rise-in delay-1 mt-2 font-display text-xl italic text-white/95 md:text-2xl">
            &amp; See the Floor Plan on Your Property for FREE
          </p>
        </div>
      </section>

      {/* ── Intro + map (streamed) ───────────────────────────────────────── */}
      <Suspense fallback={<ExploreSkeleton />}>
        <ExploreSection />
      </Suspense>

      {/* ── Free build planning tools ────────────────────────────────────── */}
      <ToolsSection />

      {/* ── Plan quick search ────────────────────────────────────────────── */}
      <section className="container-x pb-6">
        <div className="reveal mx-auto max-w-6xl">
          <QuickSearch />
        </div>
      </section>

      {/* ── How it works (4 steps) ───────────────────────────────────────── */}
      <StepsSection />

      {/* ── Featured plans (streamed) ────────────────────────────────────── */}
      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedPlans />
      </Suspense>

      {/* ── Why build in steel (5 cards) ─────────────────────────────────── */}
      <WhyBuildSection />

      {/* ── CTA band ─────────────────────────────────────────────────────── */}
      <CtaBand />

      {/* ── Who this helps (3 cards) ─────────────────────────────────────── */}
      <WhoThisHelps />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Intro + interactive map (data-dependent → streamed behind <Suspense>)
   ═══════════════════════════════════════════════════════════════════════ */
const WHY_CONVERT = [
  { img: "/shield-star.png", t: "Stronger & Safer", d: "Build to last for generations" },
  { img: "/shield-gear.png", t: "Faster and Easier to Build", d: "Precision parts and panels for quicker on-site assembly" },
  { img: "/shield-medal.png", t: "More Durable", d: "Resists fire, pests, mold, and rot" },
  { img: "/shield-check.png", t: "More Predictable", d: "No warping, shrinking, or surprises" },
];

const MAP_BADGES = [
  "Pre-Approved by Jurisdictions",
  "Faster Permitting and Approvals",
  "Easily Convert to Steel with FrameUpNow",
];

async function ExploreSection() {
  const plans = await getAllPlans();
  const facets = buildFacets(plans);
  return (
    <section className="container-x py-14 md:py-16">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.55fr] lg:gap-12">
        {/* Left — copy, why-convert, counters.
            suppressHydrationWarning: ScrollReveal adds `is-visible` to this
            streamed node before React hydrates it — a benign class-only change. */}
        <div className="reveal" suppressHydrationWarning>
          <p className="text-[15px] leading-relaxed text-ink-soft md:text-base">
            With <strong className="text-ink">more than 4,000 floor plans to choose from</strong>, finding
            the perfect ADU has never been easier. Search for Permit-Ready ADU plans available in your
            city or explore the full collection to{" "}
            <strong className="text-ink">find the plan you love and build it anywhere</strong>. Then use
            the <strong className="text-forest-700">FREE ADU-Plan-Fit Visualizer</strong> to see your
            favorite design on your property in seconds. When you’re ready, FrameUpNow can transform your
            chosen plan into a precision-engineered cold-formed steel frame package for permitting and
            construction.
          </p>

          {/* Why convert to steel */}
          <div className="mt-7 rounded-2xl border border-forest/20 bg-mist/50 p-5">
            <div className="flex items-center gap-2 text-forest-700">
              <Image src="/shield-hand.png" alt="" aria-hidden width={28} height={28} className="h-7 w-auto" />
              <h3 className="font-display text-base font-semibold">Why Convert to Steel?</h3>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
              {WHY_CONVERT.map((w, i) => (
                <div key={w.t} className={i > 0 ? "sm:border-l sm:border-forest/20 sm:pl-4" : ""}>
                  <Image src={w.img} alt="" aria-hidden width={36} height={40} className="h-9 w-auto" />
                  <div className="mt-2 text-sm font-bold leading-snug text-ink">{w.t}</div>
                  <p className="mt-1 text-xs leading-snug text-ink-soft">{w.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Counters */}
          <div className="mt-8">
            <StatCounters total={plans.length} lastMonth={122} />
          </div>
        </div>

        {/* Right — map */}
        <div className="reveal" suppressHydrationWarning>
          <div className="rounded-3xl border border-line bg-paper p-3 shadow-[var(--shadow-card)] md:p-4">
            <h2 className="text-center font-display text-xl italic text-forest-700 md:text-2xl">
              Click a State to Explore Local Plans
            </h2>
            <div className="mt-3">
              <USAMap states={facets.states} bare />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line pt-4">
              {MAP_BADGES.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <MiniCheck /> {b}
                </span>
              ))}
            </div>
          </div>

          <details className="mx-auto mt-5 max-w-2xl">
            <summary className="cursor-pointer text-center text-sm font-semibold text-forest hover:text-forest-600">
              Or choose your state from the list ↓
            </summary>
            <div className="mt-5">
              <StateSelector states={facets.states} />
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Free build planning tools — the two illustrated tool cards
   ═══════════════════════════════════════════════════════════════════════ */
function ToolsSection() {
  const cards = [
    {
      title: "ADU-Plan-Fit Visualizer",
      img: "/tool-visualizer.png",
      alt: "Choose a plan, enter your address, and see it placed on your lot with setbacks",
      href: TOOL_URL,
      external: true,
    },
    {
      title: "ADU Cost Estimator",
      img: "/tool-estimator.png",
      alt: "Choose a plan, customize the cost options, and see your full estimate",
      href: "/plans",
      external: false,
    },
  ];
  return (
    <section className="container-x py-14 md:py-16">
      <h2 className="reveal text-center text-sm font-bold uppercase tracking-[0.2em] text-forest-700">
        Your Free Build Planning Tools
      </h2>
      <div className="reveal mx-auto mt-8 max-w-6xl rounded-[2rem] border-2 border-forest/25 bg-mist/30 p-4 md:p-6">
        <div className="reveal-stagger grid gap-5 md:grid-cols-2">
          {cards.map((c) => {
            const Inner = (
              <>
                <h3 className="text-center font-display text-xl italic text-forest-700">{c.title}</h3>
                <div className="mt-4 overflow-hidden rounded-xl">
                  <Image
                    src={c.img}
                    alt={c.alt}
                    width={950}
                    height={520}
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </>
            );
            const cls =
              "group block rounded-2xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] md:p-5";
            return c.external ? (
              <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {Inner}
              </a>
            ) : (
              <Link key={c.title} href={c.href} className={cls}>
                {Inner}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="reveal mx-auto mt-8 flex max-w-3xl items-center justify-center gap-2 text-center text-sm text-ink-soft">
        <span className="animate-bob grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-white">
          <HouseGlyph />
        </span>
        A resource for homeowners, builders, families, and developers looking for smarter housing options.
      </p>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   How it works — 4 numbered steps
   ═══════════════════════════════════════════════════════════════════════ */
const STEPS = [
  { n: 1, img: "/step-1.png", title: "Select a Plan", body: "Browse plans that are pre-approved by your local jurisdiction or select a plan from the entire library" },
  { n: 2, img: "/step-2.png", title: "Use the Plan-My-Floor-Plan Visualizer and ADU Cost Estimator", body: "Use our free tools to see how the plan you’ve picked will look on your own lot and how much it will cost to complete your build." },
  { n: 3, img: "/step-3.png", title: "Customize or Confirm Your Layout", body: "Review plan details and make any options or adjustments you need" },
  { n: 4, img: "/step-4.png", title: "FrameUpNow Converts it from Wood to Steel", body: "We’ll deliver a precision-engineered cold-formed steel frame package ready to assemble" },
];

function StepsSection() {
  return (
    <section className="container-x py-10 md:py-12">
      <div className="reveal-stagger grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.n} className="group text-center">
            <Image
              src={s.img}
              alt=""
              aria-hidden
              width={132}
              height={130}
              className="icon-rise mx-auto h-24 w-auto"
            />
            <h3 className="mx-auto mt-4 max-w-[15rem] font-display text-base font-semibold leading-snug text-ink">
              {s.title}
            </h3>
            <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Featured plans (data-dependent → streamed)
   ═══════════════════════════════════════════════════════════════════════ */
async function FeaturedPlans() {
  const plans = await getAllPlans();
  const featured = plans
    .filter((p) => p.placeable && p.elevationImage)
    .filter((_, i) => i % 11 === 0)
    .slice(0, 4);
  return (
    <section className="container-x py-12 md:py-14">
      {/* suppressHydrationWarning: streamed section — ScrollReveal toggles
          `is-visible` on these before React hydrates the chunk. */}
      <div className="reveal flex items-end justify-between gap-4" suppressHydrationWarning>
        <h2 className="font-display text-2xl text-ink md:text-3xl">Featured Permit-Ready Plans</h2>
        <Link href="/plans" className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-600">
          Browse All Plans
          <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="reveal-stagger mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5" suppressHydrationWarning>
        {featured.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Why build in steel — 5 outlined feature cards
   ═══════════════════════════════════════════════════════════════════════ */
const STEEL = [
  { color: "blue", img: "/steel-faster.png", title: "Faster Install", body: "Prefabricated components speed up construction and reduce delays while using less manpower and equipment." },
  { color: "slate", img: "/steel-precision.png", title: "Engineered Precision", body: "Factory-accurate framing for a perfect fit and no on-site cutting." },
  { color: "amber", img: "/steel-termite.png", title: "Resistant to Termites, Mold, and Warping", body: "Steel won’t rot, warp or attract unwanted pests." },
  { color: "purple", img: "/steel-fire.png", title: "Non-Combustible", body: "Steel is non-combustible and helps improve fire safety and durability." },
  { color: "orange", img: "/steel-materials.png", title: "Materials List Clarity", body: "Detailed and quantified BIM created materials list ensures transparent pricing and easier purchasing." },
];

const BORDER = {
  blue: "border-blue-200",
  slate: "border-slate-300",
  amber: "border-amber-200",
  purple: "border-purple-200",
  orange: "border-orange-200",
};

function WhyBuildSection() {
  return (
    <section className="container-x py-14 md:py-16">
      <div className="reveal mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-ink md:text-4xl">Why Build in Steel?</h2>
        <p className="mt-3 text-ink-soft">
          Cold-formed steel framing delivers a better building experience from start to finish
        </p>
      </div>
      <div className="reveal-stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {STEEL.map((s) => (
          <div
            key={s.title}
            className={`group lift rounded-2xl border-2 ${BORDER[s.color]} bg-paper p-5 text-center shadow-[var(--shadow-card)]`}
          >
            <div className="icon-rise mx-auto grid h-14 w-14 place-items-center">
              <Image src={s.img} alt="" aria-hidden width={56} height={56} className="h-14 w-auto" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold leading-snug text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CTA band
   ═══════════════════════════════════════════════════════════════════════ */
function CtaBand() {
  return (
    <section className="container-x py-8 md:py-10">
      <div className="reveal relative grid overflow-hidden rounded-3xl md:grid-cols-[1fr_1.1fr]">
        {/* Left — copy + actions */}
        <div
          className="relative flex flex-col justify-center px-8 py-8 text-white md:px-10"
          style={{ background: "linear-gradient(120deg, #3b5a1f 0%, #4c7328 100%)" }}
        >
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.1]" />
          <h2 className="relative max-w-md font-display text-2xl leading-snug">
            Found a plan you love? Let FrameUpNow turn it into a steel frame package.
          </h2>
          <p className="relative mt-3 max-w-md text-sm text-white/80">
            Send us the plan and we’ll help you move from approved design to a stronger build system.
          </p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <a
              href={`${FUN}/contact-us`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-cream px-6 py-3 text-sm font-semibold italic text-forest-700 shadow-md transition-transform hover:-translate-y-0.5"
            >
              Request a Quote
            </a>
            <a
              href={`${FUN}/contact-us`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold italic text-white transition-colors hover:bg-white/10"
            >
              Schedule a Call
            </a>
          </div>
        </div>
        {/* Right — real steel-frame construction photo.
            Mobile: box takes the photo's own aspect ratio so the whole frame
            shows (no crop). Desktop: fills the side column (cover). */}
        <div className="relative aspect-[1760/558] bg-night md:aspect-auto md:min-h-0">
          <Image
            src="/steel-frame-photo.jpg"
            alt="A FrameUpNow cold-formed steel frame for an ADU under construction"
            fill
            sizes="(max-width: 768px) 100vw, 48vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Who this helps — 3 audience cards
   ═══════════════════════════════════════════════════════════════════════ */
const AUDIENCE = [
  { color: "blue", img: "/who-homeowners.png", title: "Homeowners", body: "Create extra space, build property value, and build smarter for your family." },
  { color: "orange", img: "/who-builders.png", title: "Builders", body: "Save time finding approved plans and streamline your framing process." },
  { color: "purple", img: "/who-developers.png", title: "Developers", body: "Scale projects with confidence using approved plans and steel framing solutions." },
];

function WhoThisHelps() {
  return (
    <section className="container-x py-14 md:py-16">
      <h2 className="reveal text-center font-display text-3xl text-ink md:text-4xl">Who This Helps</h2>
      <div className="reveal-stagger mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
        {AUDIENCE.map((a) => (
          <div
            key={a.title}
            className={`group lift rounded-2xl border-2 ${BORDER[a.color]} bg-paper p-6 text-center shadow-[var(--shadow-card)]`}
          >
            <Image src={a.img} alt="" aria-hidden width={72} height={72} className="icon-rise mx-auto h-16 w-16 object-contain" />
            <h3 className="mt-4 font-display text-lg text-ink">{a.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Skeletons (layout-stable so streaming causes no jump)
   ═══════════════════════════════════════════════════════════════════════ */
function ExploreSkeleton() {
  return (
    <section className="container-x py-14 md:py-16">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.55fr] lg:gap-12">
        <div className="space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-mist" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-mist" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-mist" />
          <div className="h-28 animate-pulse rounded-2xl bg-mist" />
          <div className="h-24 animate-pulse rounded-2xl bg-mist" />
        </div>
        <div className="aspect-[1.5/1] animate-pulse rounded-3xl bg-mist" />
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <section className="container-x py-12 md:py-14">
      <div className="h-8 w-64 animate-pulse rounded bg-mist" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-mist" />
        ))}
      </div>
    </section>
  );
}


function HouseGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" />
    </svg>
  );
}

function MiniCheck() {
  return (
    <svg className="shrink-0 text-forest" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
