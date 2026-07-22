import Image from "next/image";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Cost Estimator",
  description:
    "The FrameUpNow Cost Estimator is available on each individual home model page. It combines the real steel-frame cost with site work, foundation, labor, and finishes so you understand your complete build cost before construction begins.",
};

const FUN = "https://www.frameupnow.com";

// Exact steps from the Cost Estimator instructions (v1.1).
const STEPS = [
  "Will the floor plan fit on my lot?",
  "What is the estimated finished cost of the selected Model? FrameUpNow provides the skeleton and the engineered and stamped plan set. The owner — as a DIYer, Hybrid Builder, or the owner’s General Contractor — selects finishes and directs the completion of the home.",
  "Before spending the first dollar, download the Materials Shopping List for a generic list of all the items to complete the home — from drywall to floor covering to appliances.",
];

const MSL_CATEGORIES = [
  { title: "Exterior", items: ["Structural sheathing", "Roofing", "Siding or exterior cladding", "Exterior trim", "Windows", "Exterior doors"] },
  { title: "Interior", items: ["Drywall", "Interior doors", "Trim and moldings", "Flooring", "Cabinets"] },
  { title: "Mechanical, Electrical & Plumbing (MEP)", items: ["Plumbing pipe and fittings", "Electrical wire, boxes, breakers, and devices", "HVAC components and ductwork"] },
  { title: "Finishes", items: ["Insulation", "Paint", "Sealants", "Hardware", "Miscellaneous finish materials"] },
];

const DIFFERENTIATORS = [
  "Exact quantities instead of estimates — and cost certainty",
  "Reduced material waste",
  "More accurate budgeting before construction begins",
  "Better purchasing and scheduling",
];

const NOT_SPECIFIED = [
  "A particular manufacturer (unless requested)",
  "Which retailer to buy from",
  "Current market pricing (prices fluctuate)",
  "Labor costs",
];

const framed = "overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-lift)]";

export default function CostEstimatorPage() {
  return (
    <div>
      <PageHero image="/hero-cost.jpg" imagePosition="center 60%" eyebrow="Cost Estimator" title="FrameUpNow Cost Estimator">
        The Cost Estimator is available on each individual home model page, not from a single standalone
        estimator page.
      </PageHero>

      {/* 1 — Lives on the model page */}
      <section className="container-x py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="reveal">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">On every model page</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Available on Each Home Model Page</h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              When you open a specific home model in the FrameUpNow.com Plan Library or the ADU.com Plan
              Library, you&rsquo;ll see a <strong className="text-ink">&ldquo;Click Here to estimate your
              complete build&rdquo;</strong> link or button near the <strong className="text-ink">Key
              Specs</strong> section. That launches the estimator for that specific model.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              For this explanation we used the <strong className="text-ink">Absolute Model</strong>, the
              first model in the FrameUpNow plan collection.
            </p>
          </div>
          <div className={`reveal ${framed}`}>
            <Image src="/est-model-card.jpg" alt="The Absolute model card — FUN Collection, with a Learn More button" width={900} height={720} className="h-auto w-full" />
          </div>
        </div>

        <div className={`reveal mx-auto mt-10 max-w-5xl ${framed}`}>
          <Image src="/est-model-page.png" alt="The Absolute model page: Key Specs, Buy Skeleton + Plan, and the Click Here to estimate your complete build link that activates the estimator" width={1500} height={885} className="h-auto w-full" />
        </div>
      </section>

      {/* 2 — Enter your project information */}
      <section className="border-y border-line bg-mist/30 py-14 md:py-20">
        <div className="container-x mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="reveal lg:sticky lg:top-28">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Your inputs</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Enter Your Project Information</h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Enter your project information (location, foundation, labor type, finish level, etc.) to
              receive an estimated total project cost.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Every FrameUpNow home model includes access to its own Home Building Cost Estimator. Simply
              open the model you&rsquo;re interested in and click the <strong className="text-ink">&ldquo;Estimate
              Your Complete Build&rdquo;</strong> button on the model page. The estimator combines the actual
              cost of the FrameUpNow steel frame with estimated costs for site work, foundation, labor,
              mechanical systems, and finishes in <strong className="text-ink">5 levels from modest to
              designer</strong> — helping you understand the total cost of completing your home before
              construction begins.
            </p>
          </div>
          <div className={`reveal mx-auto max-w-[560px] ${framed}`}>
            <Image src="/est-form.png" alt="The ADU Cost Estimator: Construction Costs, Financial Summary, and Shipping Details for the Absolute model" width={1100} height={1625} className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* 3 — Adjust for Local Economy */}
      <section className="container-x py-14 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="reveal text-xs font-semibold uppercase tracking-widest text-forest-600">Local economy</span>
          <h2 className="reveal mt-2 font-display text-3xl text-ink md:text-4xl">Adjust for Local Economy</h2>
          <p className="reveal mx-auto mt-4 max-w-2xl leading-relaxed text-ink-soft">
            We have added a cost adjuster for the local economic conditions. Some very dynamic cities will
            cost more for labor and materials than others.
          </p>
          <div className={`reveal mx-auto mt-10 max-w-2xl ${framed}`}>
            <Image src="/est-local-economy.png" alt="Adjust for Local Economy slider set to 0% (Base), with Total Cost Including Labor & Adjustments" width={1100} height={519} className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* 4 — From a plan that fits to a price */}
      <section className="border-y border-line bg-mist/30 py-14 md:py-20">
        <div className="container-x mx-auto max-w-6xl">
          <div className="reveal mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">From fit to price</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Here Are the Steps You May Want to Take</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              The Plan Fit Visualizer allows a visitor to go from finding a plan that fits their lot to
              knowing approximately what it will cost in just a few clicks. Each model in the FrameUpNow.com
              collection includes a Materials Shopping List.
            </p>
          </div>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <ol className="reveal-stagger space-y-4">
              {STEPS.map((s, i) => (
                <li key={i} className="flex gap-4 rounded-2xl border border-line bg-paper p-5 shadow-[var(--shadow-card)]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span>
                  <p className="text-sm leading-relaxed text-ink-soft">{s}</p>
                </li>
              ))}
            </ol>
            <div className={`reveal ${framed}`}>
              <Image src="/est-floorplan.png" alt="Floor Plan view with a Shopping List tab — click the Shopping List for a complete list of materials" width={1500} height={932} className="h-auto w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 5 — Materials Shopping List */}
      <section className="container-x py-14 md:py-20">
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Materials Shopping List</span>
          <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">The FrameUpNow Materials Shopping List (MSL)</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            The FrameUpNow Materials Shopping List (MSL) is intended to provide a comprehensive list of the
            materials required to complete the home, not just the steel frame. That is one of the major
            differentiators of the FrameUpNow platform — and the entire list is available before investing a
            single dollar.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            The Material Shopping List is generated directly from the BIM model rather than by estimating
            from square footage or historical averages. As a result, the quantities are intended to be
            highly accurate. The shopping list includes materials in categories such as:
          </p>
        </div>

        <div className="reveal-stagger mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MSL_CATEGORIES.map((cat) => (
            <div key={cat.title} className="rounded-2xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-base text-forest-700">{cat.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {cat.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="reveal mx-auto mt-12 max-w-3xl">
          <h3 className="font-display text-2xl text-ink">What makes FrameUpNow and the Material Shopping List different?</h3>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Unlike many builders&rsquo; material takeoffs, FrameUpNow&rsquo;s shopping list is generated from
            the actual engineered building model. It is not an estimate — it is precise. The objective is to
            provide:
          </p>
          <ul className="reveal-stagger mt-5 grid gap-3 sm:grid-cols-2">
            {DIFFERENTIATORS.map((d) => (
              <li key={d} className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 shadow-[var(--shadow-card)]">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest text-[11px] font-bold text-white">✓</span>
                <span className="text-sm leading-relaxed text-ink">{d}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border-l-4 border-amber bg-amber/10 p-5 text-sm leading-relaxed text-ink">
            The Shopping List for an ADUplans.com home is available only after the customer order and the
            wood plan has been engineered to a Steel Skeleton.
          </div>
        </div>
      </section>

      {/* 6 — One important clarification */}
      <section className="border-y border-line bg-mist/30 py-14 md:py-20">
        <div className="container-x mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="reveal">
            <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">Clarification</span>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">One Important Clarification</h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              The shopping list is not a procurement package. It tells the owner or builder what is needed
              and how much is needed. It typically does not specify:
            </p>
            <ul className="mt-4 space-y-2">
              {NOT_SPECIFIED.map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Instead, it becomes the basis for obtaining supplier pricing from sources such as Home Depot,
              Lowe&rsquo;s, or specialty suppliers. FrameUpNow doesn&rsquo;t just engineer your home&rsquo;s
              steel skeleton — it generates a BIM-based Materials Shopping List that identifies virtually
              every major material required to complete the home. Instead of guessing what to buy, builders
              know what to order before construction begins.
            </p>
            <p className="mt-4 font-medium leading-relaxed text-forest-700">
              FrameUpNow provides engineering certainty paired with material cost certainty before
              construction starts.
            </p>
          </div>
          <div className={`reveal ${framed}`}>
            <Image src="/est-planset.png" alt="The Absolute Modern engineered plan set: renderings, table of contents, about FrameUpNow and HouseDocs, and title block" width={1700} height={1284} className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-16">
        <div className="reveal hero-surface relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white md:px-16">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl md:text-4xl">
            Engineering certainty, paired with material cost certainty
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/85">
            Browse the plan library, open a model, and click <em>Estimate Your Complete Build</em> to price
            your ADU before you break ground.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <a href={`${FUN}/plans`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5">
              Browse the Plan Library →
            </a>
            <a href={`${FUN}/schedule-an-appointment`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Schedule an Appointment
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
