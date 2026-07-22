import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Plan Fit Visualizer",
  description:
    "The ADU Property Fit Visualizer shows you exactly what fits on your specific property in a few minutes. Enter your address, and the tool places a real ADU footprint on your real lot, checked against setback rules and available space.",
};

const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "http://localhost:5173";
const FUN = "https://www.frameupnow.com";

// All copy below is verbatim from the ADU Property Fit Visualizer instructions.
const STEPS = [
  { n: 1, title: "Enter Your Lot Information", body: "Type in your address or manual lot dimensions. The tool pulls available property data to establish your buildable area." },
  { n: 2, title: "Generate Placement Options", body: "The Visualizer produces ADU footprint options sized to fit your lot, factoring in general setback rules and existing structures on the property." },
  { n: 3, title: "Compare Permit Ready Plans", body: "Each placement option links to matching designs from FrameUpNow's Permit Ready designs collections, and ADUplans.com plans already approved in many USA jurisdictions are ready to submit with minimal review time. Homeowners who want something custom can move straight into FrameUpNow's engineering service, where design and structural review happen together instead of in sequence." },
  { n: 4, title: "Save or Schedule a Consultation", body: "Once you find a fit you like, save it or schedule a consultation to move from concept to a real project timeline." },
];

const AUDIENCE = [
  { title: "Homeowners Planning a Build or Rebuild", body: "Homeowners get a fast, free answer to the question that normally requires paid professionals to resolve. This is especially relevant for owners rebuilding after property loss, where speed and cost certainty both matter more than usual." },
  { title: "General Contractors", body: "Contractors can use the Visualizer during early client conversations to show real placement options on a specific property, instead of relying on generic renderings that do not reflect the actual lot." },
  { title: "Realtors Keeping Deals Moving", body: "Realtors working with buyers interested in rental income or multigenerational living can use the tool to answer ADU feasibility questions during a showing or a listing conversation, without waiting on a third party. Properties with income producing potential from an ADU can also affect financing options; Fannie Mae and Freddie Mac both publish guidelines on how ADU rental income can factor into a mortgage." },
];

const COMPARE = [
  ["Cost", "Free", "Survey and architect fees, often $1,000 or more"],
  ["Time to first answer", "Minutes", "Days to weeks"],
  ["Commitment required", "None", "Deposit or contract typically required"],
  ["Based on your actual lot", "Yes", "Yes, but only after paying for it"],
  ["Connects to buildable, Permit Ready designs", "Yes", "Not usually"],
];

const FAQ = [
  ["Is the ADU Property Fit Visualizer free to use?", "Yes. There is no cost and no account required to generate placement options for your property."],
  ["Do I need a survey before I use it?", "No. The tool works from your address or basic lot dimensions, so a formal survey is not required to get started."],
  ["Can I try multiple ADU designs on the same lot?", "Yes. You can run as many placement options as you want and compare them against different Permit Ready designs."],
  ["Does this replace a formal site plan?", "No. The Visualizer gives you a realistic starting point, but a licensed site plan is still required for permitting."],
  ["What information do I need to get started?", "Your property address is usually enough. You can also enter manual lot dimensions if you prefer."],
  ["Does the tool account for setback and zoning rules?", "The Visualizer factors in general setback distances to show realistic placement options. Local zoning and permit review will confirm final requirements, since these vary by jurisdiction. The California HCD ADU Handbook is a useful reference for how state ADU law applies where you live."],
  ["What happens after I find a design that fits?", "You can save your results or move directly into a consultation to start turning your placement option into a real project."],
];

const framed = "overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-lift)]";

export default function PlanFitVisualizerPage() {
  return (
    <div>
      <PageHero image="/hero-plan-fit.jpg" imagePosition="center 65%" eyebrow="Plan Fit Visualizer" title="Will an ADU Fit on My Lot? Find Out in Minutes">
        The ADU Property Fit Visualizer shows you exactly what fits on your specific property in a few
        minutes. Enter your address, and the tool places a real ADU footprint on your real lot, checked
        against setback rules and available space, before you contact a builder, a surveyor, or an
        architect.
        <span className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={TOOL_URL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-forest px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5">
            Launch the Visualizer →
          </a>
        </span>
      </PageHero>

      {/* From Click to Completion — overview infographic */}
      <section className="container-x py-14 md:py-16">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">From click to completion</span>
          <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Floor plan on your lot in 60 seconds</h2>
        </div>
        <div className={`reveal mx-auto mt-8 max-w-5xl ${framed}`}>
          <Image src="/pfv-overview.jpg" alt="ADU Property Fit Visualizer: from click to completion — rapid visualization, perfect the placement, engineering & production, materials & completion" width={1700} height={931} className="h-auto w-full" priority />
        </div>
      </section>

      {/* What the ADU Property Fit Visualizer Does */}
      <section className="border-y border-line bg-mist/30 py-14 md:py-20">
        <div className="container-x mx-auto max-w-3xl">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">What it does</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">What the ADU Property Fit Visualizer Does</h2>
          </div>
          <div className="reveal mt-6 space-y-4 leading-relaxed text-ink-soft">
            <p>
              The Visualizer works like a configurator for your property instead of a car or a house you
              will never build. You enter an address or your lot dimensions. The tool then generates ADU
              placement options sized to your available space, checked against basic setback requirements,
              and matched against FrameUpNow and ADUplans design collections.
            </p>
            <p>
              Think of it this way. Zillow lets you imagine a house. A car configurator lets you build a
              vehicle before you buy it. The ADU Property Fit Visualizer lets you place an ADU on your own
              lot before you spend a dollar on design work.
            </p>
            <p>
              That distinction matters. Most ADU tools show generic floor plans with no resemblance to an
              actual floor plan you have chosen and connection to your actual property. This tool starts with
              your lot, not a catalog page, and works backward from there.
            </p>
            <p className="font-medium text-ink">
              Launch the ADU Property Fit Visualizer and see what fits on your lot right now. It is FREE and
              very easy.
            </p>
          </div>
        </div>
      </section>

      {/* How the Visualizer Works */}
      <section className="container-x py-14 md:py-20">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">How the Visualizer works</span>
          <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">How the Visualizer Works</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">Using the tool takes four steps.</p>
        </div>
        <div className={`reveal mx-auto mt-8 max-w-5xl ${framed}`}>
          <Image src="/pfv-steps.jpg" alt="Choose Plan, Enter Address, Place on Lot — the ADU-Plan-Fit Visualizer in three steps" width={1600} height={1123} className="h-auto w-full" />
        </div>
        <div className="reveal-stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-forest text-sm font-bold text-white">{s.n}</span>
              <h3 className="mt-4 font-display text-lg text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built on IBC Engineered Framing */}
      <section className="container-x pb-4">
        <div className="reveal mx-auto max-w-3xl rounded-3xl border border-forest/20 bg-mist/40 p-8 text-center">
          <h2 className="font-display text-2xl text-ink md:text-3xl">Built on IBC Engineered Framing</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Every design option the Visualizer surfaces connects back to a real, buildable product.
            ADUplans.com plans and FrameUpNow.com plans are built around cold formed steel (CFS) framing and
            engineered to comply with International Building Code standards.
          </p>
        </div>
      </section>

      {/* Why Guessing at ADU Placement Costs You Time and Money */}
      <section className="container-x py-14 md:py-20">
        <div className="reveal mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Skip the expensive guesswork</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Why Guessing at ADU Placement Costs You Time and Money</h2>
          </div>
          <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">
            <p>
              Most homeowners start their ADU journey the expensive way. They hire a surveyor to map the
              lot. They pay an architect for a custom concept. Only after both of those checks come back do
              they learn whether their preferred design actually fits.
            </p>
            <p>
              That sequence can burn weeks and thousands of dollars before a single permit application gets
              filed. Setback requirements, lot coverage limits, and existing structures all affect what a
              property can hold, and none of that is obvious from a listing photo or a rough measurement.
            </p>
            <p>
              The ADU Property Fit Visualizer removes that early uncertainty. You see viable placement
              options before you commit to a survey or a design fee. It will not replace a licensed site
              plan, but it gives you a realistic starting point instead of a guess.
            </p>
          </div>
        </div>
      </section>

      {/* Who the Tool Is Built For */}
      <section className="border-y border-line bg-mist/30 py-14 md:py-20">
        <div className="container-x">
          <div className="reveal mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Who it&rsquo;s built for</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Who the Tool Is Built For</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              The ADU Property Fit Visualizer serves three distinct groups, each with a different reason to
              use it.
            </p>
          </div>
          <div className="reveal-stagger mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="rounded-2xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-display text-lg text-ink">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADU Property Fit vs Traditional Feasibility Checks */}
      <section className="container-x py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Plan Fit vs. traditional</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">ADU Property Fit vs Traditional Feasibility Checks</h2>
          </div>
          <div className="reveal mt-10 overflow-x-auto rounded-3xl border border-line bg-paper shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="p-4"></th>
                  <th className="p-4 font-display text-base text-forest-700">ADU Property Fit Visualizer</th>
                  <th className="p-4 font-display text-base text-ink-soft">Traditional Feasibility Check</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, a, b]) => (
                  <tr key={label} className="border-b border-line-soft last:border-0">
                    <td className="p-4 font-medium text-ink">{label}</td>
                    <td className="p-4 font-semibold text-forest-700">{a}</td>
                    <td className="p-4 text-ink-soft">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Your Free Build Planning Tools */}
      <section className="border-y border-line bg-mist/30 py-14 md:py-20">
        <div className="container-x mx-auto max-w-5xl">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Free tools</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Your Free Build Planning Tools</h2>
          </div>
          <div className={`reveal mx-auto mt-8 max-w-3xl ${framed}`}>
            <Image src="/pfv-tools.jpg" alt="Your free build planning tools: the ADU-Plan-Fit Visualizer and the ADU Cost Estimator" width={1500} height={1642} className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="container-x py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">FAQ</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="reveal mt-8 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-ink">
                  {q}
                  <span className="text-forest transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* From Fit to Frame + cost cross-link */}
      <section className="border-y border-line bg-mist/30 py-14 md:py-20">
        <div className="container-x mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="reveal">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">From fit to frame</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">From Fit to Frame</h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Finding a design that fits your lot is only the first step. Every plan connected to the ADU
              Property Fit Visualizer is already engineered to International Building Code standards, using
              cold formed steel framing that arrives to spec and does not warp, rot, or shift the way wood
              framing can over time. That means the design you find here is not a concept that still needs
              engineering.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              <strong className="text-ink">How do I estimate the cost of completing my ADU to my style and
              taste?</strong> Use the ADU cost estimator that is available directly from the ADU Property Fit
              Visualizer.
            </p>
            <Link href="/cost-estimator" className="mt-6 inline-flex rounded-full bg-forest px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5">
              Open the Cost Estimator →
            </Link>
          </div>
          <div className={`reveal ${framed}`}>
            <Image src="/pfv-estimator.jpg" alt="ADU Cost Estimator: choose a plan, customize costs, and see your estimate" width={1200} height={777} className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* See It on Your Own Lot — CTA */}
      <section className="container-x py-16">
        <div className="reveal hero-surface relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white md:px-16">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl md:text-4xl">See It on Your Own Lot</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/85">
            Reading about lot fit only gets you so far. The fastest way to know what your property can hold
            is to check it yourself. Try the ADU Property Fit Visualizer before you schedule a paid
            consultation with anyone.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <a href={TOOL_URL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5">
              Launch the Visualizer →
            </a>
            <a href={`${FUN}/schedule-an-appointment`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Schedule a Consultation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
