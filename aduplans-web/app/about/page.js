import Link from "next/link";
import PageHero from "@/components/PageHero";
import ShowcaseBand from "@/components/ShowcaseBand";
import FeatureSplit from "@/components/FeatureSplit";

export const metadata = {
  title: "About Us",
  description:
    "ADUplans.com was created by FrameUpNow to make ADUs easier to find, understand, and build — from plan search to a precision-engineered cold-formed steel frame.",
};

const STRUGGLES = [
  "Which ADU plans are available in their area",
  "Whether a plan has been reviewed or approved by their jurisdiction",
  "Whether an ADU will fit on their property",
  "How setbacks and site limitations may affect the project",
  "What the complete build could cost",
  "How permitting, financing, engineering, and construction work",
  "Which building materials will provide the best long-term value",
];

const PROCESS = [
  "Find an ADU plan that meets their needs.",
  "Identify plans available for permit-readiness in their jurisdiction.",
  "Explore designs from outside their area when they want more options.",
  "See how a selected floor plan could fit on their property.",
  "Estimate the major costs involved in completing the build.",
  "Explore possible financing and monthly payment scenarios.",
  "Submit the selected plan to FrameUpNow for customization and steel conversion.",
];

const WHAT_WE_DO = [
  "IBC-engineered steel framing kits (walls, trusses, joists, beams)",
  "BIM-generated Material Shopping Lists for finishing your build",
  "Plan sets designed for permitting and construction",
  "Optional upgrades and customization for site-specific needs",
];

const DIFFERENTIATORS = [
  {
    icon: "code",
    title: "Engineered to the International Building Code (IBC)",
    body: "Every FrameUpNow design is engineered to meet IBC standards, ensuring structural integrity and a clear path toward permitting.",
  },
  {
    icon: "bim",
    title: "BIM-Driven Material Clarity",
    body: "We use Building Information Modeling (BIM) to generate a Material Shopping List directly from your engineered structure — accurate quantities, realistic budgeting before construction, and fewer surprises during the build.",
  },
  {
    icon: "steel",
    title: "Steel Framing Advantages",
    body: "Cold-formed steel is non-combustible and fire-resistant, resistant to pests and rot, free of warping, shrinking, or twisting, and fully recyclable and environmentally responsible.",
  },
  {
    icon: "speed",
    title: "Faster, Cleaner Construction",
    body: "Kits are precision-manufactured off-site and delivered pre-cut and panelized, reducing on-site labor time, material waste, and job-site complexity.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        image="/img-adu.jpg"
        imagePosition="center 62%"
        eyebrow="About ADUplans.com"
        title="Making ADUs Easier to Find, Understand, and Build"
      >
        ADUplans.com was created by FrameUpNow to help address one of the most significant challenges
        facing families and communities today: the need for more practical, attainable housing options.
      </PageHero>

      {/* ── The challenge ────────────────────────────────────────────────── */}
      <section className="container-x py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="reveal text-lg leading-relaxed text-ink-soft">
            Accessory dwelling units can create space for aging parents, adult children, caregivers,
            guests, renters, or homeowners who want to make better use of their property. But although
            interest in ADUs continues to grow, the process of planning one can still feel unnecessarily
            complicated.
          </p>
          <p className="reveal mt-6 font-semibold text-ink">Prospective homeowners often struggle to determine:</p>
          <ul className="reveal-stagger mt-5 grid gap-3 sm:grid-cols-2">
            {STRUGGLES.map((s) => (
              <li
                key={s}
                className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 text-sm text-ink-soft shadow-[var(--shadow-card)] transition-colors hover:border-forest/30"
              >
                <Dot /> {s}
              </li>
            ))}
          </ul>
          <p className="reveal mt-6 text-lg leading-relaxed text-ink-soft">
            Important information is often spread across jurisdiction websites, designers, builders,
            lenders, and other sources. ADUplans.com was created to bring those resources together and
            give homeowners, builders, and developers a clearer place to begin.
          </p>
        </div>
      </section>

      {/* ── Why we created it ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-line bg-cream/60 py-16 md:py-20">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-x relative">
          <div className="reveal mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">
              Why We Created ADUplans.com
            </span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">
              A better path from housing need to buildable solution
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              At FrameUpNow, we recognized that solving housing challenges requires more than simply
              offering another collection of floor plans. People need reliable information, practical
              planning tools, local plan options, realistic cost guidance, and a clear understanding of
              what happens after they choose a design.
            </p>
          </div>

          <ol className="reveal-stagger mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {PROCESS.map((step, i) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-line bg-paper p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
          <p className="reveal mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-ink-soft">
            Our goal is to replace confusion with clarity and help more people confidently move from an
            idea to an achievable building plan.
          </p>
        </div>
      </section>

      {/* ── Who we are (image + content) ─────────────────────────────────── */}
      <FeatureSplit
        image="/img-steel-frame.jpg"
        eyebrow="Who We Are"
        title="An engineered structural system — not just plans"
      >
        <p>
          FrameUpNow is a residential construction company that designs and manufactures engineered
          cold-formed steel framing kits for homes, ADUs, and small residential structures. We don’t
          just sell plans — we deliver a complete, engineered structural system designed to meet the
          International Building Code (IBC) and paired with a BIM-derived Material Shopping List, so
          before construction begins you already understand your structure, material quantities, and
          real-world costs.
        </p>
      </FeatureSplit>

      {/* ── What we do ───────────────────────────────────────────────────── */}
      <section className="container-x pb-16 md:pb-20">
        <div className="reveal mx-auto max-w-3xl rounded-3xl border border-forest/20 bg-mist/50 p-7 shadow-[var(--shadow-card)] md:p-8">
          <h3 className="font-display text-xl text-ink">What We Do</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {WHAT_WE_DO.map((w) => (
              <li key={w} className="flex items-start gap-3 text-ink-soft">
                <Check /> {w}
              </li>
            ))}
          </ul>
          <p className="mt-5 leading-relaxed text-ink-soft">
            We manufacture the structural skeleton of your home, giving you a faster, more predictable
            path to building.
          </p>
        </div>
      </section>

      <ShowcaseBand image="/img-steel-interior.jpg" imagePosition="center 40%">
        We don’t just sell plans — we deliver a complete, engineered structural system, built to the
        International Building Code.
      </ShowcaseBand>

      {/* ── What makes us different ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-line bg-cream/60 py-16 md:py-20">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-x relative">
          <div className="reveal mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">
              What Makes Us Different
            </span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Certainty, built in from the start</h2>
          </div>
          <div className="reveal-stagger mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
            {DIFFERENTIATORS.map((d, i) => (
              <div
                key={d.title}
                className="group card-hover relative overflow-hidden rounded-2xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]"
              >
                <span className="accent-bar absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mist text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                    <DiffIcon name={d.icon} />
                  </span>
                  <div className="font-display text-sm font-bold text-forest-600">0{i + 1}</div>
                </div>
                <h3 className="mt-4 font-display text-lg text-ink">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why FrameUpNow exists + CTA (brand-green band) ───────────────── */}
      <section className="container-x py-16 md:py-20">
        <div className="reveal hero-surface relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white md:px-16">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
          <span className="relative text-xs font-semibold uppercase tracking-widest text-amber">
            Why FrameUpNow Exists
          </span>
          <p className="relative mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            Traditional homebuilding is filled with uncertainty — changing material costs, unclear
            quantities, and delays caused by incomplete planning. We built FrameUpNow to solve that. Our
            mission is to bring certainty, clarity, and efficiency to residential construction by
            defining the structure and materials before you break ground.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/plans"
              className="rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Browse ADU plans →
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />;
}

function Check() {
  return (
    <svg className="mt-0.5 shrink-0 text-forest" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function DiffIcon({ name }) {
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
    case "code":
      return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>;
    case "bim":
      return <svg {...p}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "steel":
      return <svg {...p}><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /><path d="M7 8v8M17 8v8" /></svg>;
    case "speed":
      return <svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
