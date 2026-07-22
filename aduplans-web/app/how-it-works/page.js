import Link from "next/link";
import PageHero from "@/components/PageHero";
import ShowcaseBand from "@/components/ShowcaseBand";
import FeatureSplit from "@/components/FeatureSplit";

export const metadata = {
  title: "How It Works | Find, Plan and Build Your ADU",
  description:
    "Learn how to find a Permit-Ready ADU plan, visualize it on your property, estimate construction and financing costs, and convert it to steel with FrameUpNow.",
};

const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "https://www.frameupnow.com";
const FUN = "https://www.frameupnow.com";

const STEPS = [
  {
    n: 1,
    icon: "search",
    eyebrow: "Step 1",
    title: "Choose Your ADU Plan",
    lead: "Start with a local Permit-Ready plan — or explore the entire collection.",
    body: [
      {
        h: "Browse Permit-Ready plans in your area",
        p: "Select your state and local jurisdiction to view plans that have already been reviewed or approved for permit-readiness in that location. Choosing one of these plans may simplify your submittal requirements and help shorten the local permitting process.",
      },
      {
        h: "Choose any plan in the collection",
        p: "You are not limited to the plans listed for your jurisdiction. You can select any design from the entire ADUplans.com library and submit it through your jurisdiction’s standard plan review and permitting process.",
      },
    ],
    note: "Search by bedrooms, bathrooms, square footage, number of stories, garage options, location, and other features to find a plan that fits your property, lifestyle, and goals.",
    cta: { label: "Explore ADU Plans", href: "/plans" },
  },
  {
    n: 2,
    icon: "map",
    eyebrow: "Step 2",
    title: "See How the Plan Fits Your Property",
    lead: "Visualize your ADU on your actual lot for free.",
    intro:
      "Once you have selected a plan, open the free ADU Plan Fit Visualizer to see how the floor plan could be positioned on your property. Enter your property address, place the ADU on the lot, adjust its location and orientation, and set your required setbacks.",
    list: [
      "Position the ADU on your property",
      "Review its size and orientation",
      "Establish preliminary setbacks",
      "Compare different plans or placements",
      "Identify potential space limitations early",
    ],
    note: "Final placement and setback requirements must always be confirmed with your local jurisdiction and qualified project professionals.",
    cta: { label: "Open the Plan Fit Visualizer", href: TOOL_URL, external: true },
  },
  {
    n: 3,
    icon: "calc",
    eyebrow: "Step 3",
    title: "Estimate Your Complete Project Cost",
    lead: "Understand more than just the price of the plan or frame.",
    intro:
      "Use the ADU Cost Estimator to build a preliminary estimate for your complete ADU project. Select your plan and explore potential costs for the major parts of the build:",
    list: [
      "Permits and plan review",
      "Site preparation",
      "Foundation",
      "Cold-formed steel framing",
      "Exterior and interior finishes",
      "Doors and windows",
      "Plumbing, electrical, and mechanical systems",
      "Labor and other construction expenses",
    ],
    note: "The estimator is an early planning tool. Actual costs depend on your location, site conditions, jurisdictional requirements, selected finishes, labor rates, and contractor pricing.",
    cta: { label: "Estimate Your ADU Build Cost", href: "/plans" },
  },
  {
    n: 4,
    icon: "edit",
    eyebrow: "Step 4",
    title: "Confirm or Customize Your Plan",
    lead: "Keep the plan as designed — or make it your own.",
    intro:
      "Once you have selected a plan and reviewed your preliminary lot placement and budget, submit the design to FrameUpNow. You can move forward with the plan as shown or request modifications:",
    list: [
      "Adjusting doors or windows",
      "Changing room layouts",
      "Revising exterior features",
      "Mirroring the floor plan",
      "Modifying dimensions",
      "Adapting the design to site-specific requirements",
    ],
    note: "FrameUpNow will review the plan and help determine the next steps for customization, engineering, and steel conversion.",
    cta: { label: "Submit Your Plan to FrameUpNow", href: `${FUN}/contact-us`, external: true },
  },
  {
    n: 5,
    icon: "beam",
    eyebrow: "Step 5",
    title: "FrameUpNow Converts Your Plan to Steel",
    lead: "Build with greater strength, precision, and predictability.",
    intro:
      "FrameUpNow transforms your selected ADU plan into a precision-engineered cold-formed steel framing system. Pre-cut members and preassembled panels can reduce jobsite cutting, construction waste, labor requirements, and framing time. Your steel frame package can include wall panels, trusses, beams, floor joists (when applicable), engineering documents, assembly information, and a detailed BIM-generated materials list.",
    cta: { label: "Request a Steel Frame Quote", href: `${FUN}/contact-us`, external: true },
  },
];

const SUMMARY = [
  "Find a Permit-Ready local plan or choose any design from the full collection.",
  "Use the ADU Plan Fit Visualizer to explore placement on your property.",
  "Estimate your complete project cost and potential monthly payment.",
  "Confirm the design or request modifications.",
  "Have FrameUpNow convert the plan into a precision-engineered cold-formed steel frame package.",
  "Use the Material Shopping List to plan your fixtures, flooring, and finishes to your taste.",
];

function StepCta({ cta }) {
  const cls =
    "mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-forest-600";
  return cta.external ? (
    <a href={cta.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {cta.label} →
    </a>
  ) : (
    <Link href={cta.href} className={cls}>
      {cta.label} →
    </Link>
  );
}

export default function HowItWorksPage() {
  return (
    <div>
      <PageHero
        image="/hero-how-it-works.jpg"
        imagePosition="center 65%"
        eyebrow="How It Works"
        title="Find Your Plan. Plan Your Build. Build Better in Steel."
      >
        ADUplans.com helps you move from searching for the right ADU plan to preparing for
        construction — all in one place. Choose from thousands of ADU floor plans, use our free tools
        to see how yours fits and what it costs, then let FrameUpNow convert it into a
        precision-engineered cold-formed steel framing system.
      </PageHero>

      {/* ── Start here (image + content) ─────────────────────────────────── */}
      <FeatureSplit
        image="/img-blueprints.jpg"
        eyebrow="Start here"
        title="Permit-ready plans, engineered to build"
      >
        <p>
          Every plan on ADUplans.com is designed to move from selection to permitting to construction.
          Choose a local Permit-Ready design or any plan in the library, then use our free tools to see
          how it fits and what it will cost — before you commit.
        </p>
      </FeatureSplit>

      {/* ── Steps timeline ───────────────────────────────────────────────── */}
      <section className="container-x py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl">
          {/* Vertical timeline rail (desktop) */}
          <span
            aria-hidden
            className="timeline-line absolute left-6 top-4 hidden w-px md:block"
            style={{ height: "calc(100% - 2rem)" }}
          />
          <div className="flex flex-col gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="reveal relative md:pl-20">
                {/* Node with step icon */}
                <span className="absolute left-0 top-0 z-10 hidden h-12 w-12 place-items-center rounded-2xl bg-forest text-white shadow-lg ring-4 ring-cream md:grid">
                  <StepIcon name={s.icon} />
                </span>
                <div className="rounded-3xl border border-line bg-paper p-7 shadow-[var(--shadow-card)] md:p-9">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest text-white md:hidden">
                      <StepIcon name={s.icon} />
                    </span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-forest-600">
                        {s.eyebrow}
                      </div>
                      <h2 className="font-display text-2xl text-ink">{s.title}</h2>
                    </div>
                  </div>
                  <p className="mt-5 text-lg font-medium text-ink">{s.lead}</p>
                  {s.intro && <p className="mt-3 leading-relaxed text-ink-soft">{s.intro}</p>}

                  {s.body && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {s.body.map((b) => (
                        <div key={b.h} className="rounded-2xl border border-line-soft bg-cream/60 p-4">
                          <h3 className="font-semibold text-ink">{b.h}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{b.p}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.list && (
                    <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                      {s.list.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                          <Check /> {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.note && <p className="mt-5 text-sm italic leading-relaxed text-muted">{s.note}</p>}

                  <StepCta cta={s.cta} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ShowcaseBand image="/img-adu.jpg" imagePosition="center 62%">
        From a plan you love to a precision-engineered, steel-framed ADU — ready to build.
      </ShowcaseBand>

      {/* ── Financing callout ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-line bg-cream/60 py-14">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-x relative mx-auto max-w-3xl text-center">
          <div className="reveal">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-mist text-forest">
              <StepIcon name="finance" />
            </span>
            <span className="mt-4 block text-xs font-semibold uppercase tracking-widest text-forest-600">
              Explore Your Financing Options
            </span>
            <h2 className="mt-2 font-display text-2xl text-ink md:text-3xl">
              See what your estimated monthly payment could look like
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              After developing a preliminary project budget, use the ADU Financing Calculator to
              explore possible loan scenarios — enter your estimated project amount, down payment,
              interest rate, and loan term to calculate an estimated monthly payment.
            </p>
            <p className="mt-3 text-sm italic text-muted">
              The calculator provides estimates for planning purposes and is not a loan offer or
              financing approval. Actual rates, terms, and payments are determined by your lender.
            </p>
          </div>
        </div>
      </section>

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      <section className="container-x py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">The full journey</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">From Plan Search to Steel-Framed ADU</h2>
          </div>
          <ol className="reveal-stagger mt-8 grid gap-3">
            {SUMMARY.map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 shadow-[var(--shadow-card)] transition-colors hover:border-forest/30"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mist text-sm font-bold text-forest-700">
                  {i + 1}
                </span>
                <span className="text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="container-x pb-16">
        <div className="reveal hero-surface relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white md:px-16">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl md:text-4xl">Ready to Find Your ADU?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/75">
            Explore thousands of plans, compare your options, and use our free tools to begin planning
            your project today.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/plans" className="rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5">
              Browse ADU Plans →
            </Link>
            <a href={`${FUN}/contact-us`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Already have a plan? Request a Quote
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg className="mt-0.5 shrink-0 text-forest" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function StepIcon({ name }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  switch (name) {
    case "search":
      return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
    case "map":
      return <svg {...p}><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" /><path d="M9 3v15M15 6v15" /></svg>;
    case "calc":
      return <svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15v2M9 15v2" /></svg>;
    case "edit":
      return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
    case "beam":
      return <svg {...p}><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /><path d="M7 8v8M17 8v8" /></svg>;
    case "finance":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1.1 1.5-2.5 1.5-2.5.4-2.5 1.5 1.1 2 2.5 2 2.5-.9 2.5-2" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
