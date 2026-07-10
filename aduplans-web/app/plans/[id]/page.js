import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlanById, getAllPlans } from "@/lib/baserow";
import PlaceOnLotButton from "@/components/PlaceOnLotButton";
import PlanEstimator from "@/components/PlanEstimator";
import PlanGallery from "@/components/PlanGallery";
import PlanCard from "@/components/PlanCard";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const plan = await getPlanById(id);
  if (!plan) return { title: "Plan not found" };
  return {
    title: `${plan.displayName} — ${plan.sqft ?? ""} sqft ADU`,
    description: `${plan.floorPlanLabel || plan.bedsLabel} · ${plan.sqft ?? ""} sqft ADU in ${plan.jurisdiction}, ${plan.state}. Place it on your lot free.`,
  };
}

export default async function PlanDetailPage({ params }) {
  const { id } = await params;
  const plan = await getPlanById(id);
  if (!plan) notFound();

  const all = await getAllPlans();
  const related = all
    .filter((p) => p.id !== plan.id && p.placeable && (p.jurisdiction === plan.jurisdiction || p.state === plan.state))
    .slice(0, 4);

  const gallery = [
    plan.elevationImage && { src: plan.elevationImage, label: "Elevation" },
    plan.floorPlanImage && { src: plan.floorPlanImage, label: "Floor plan" },
    plan.lotImage && { src: plan.lotImage, label: "Lot fit view" },
  ].filter(Boolean);


  return (
    <div className="container-x py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/plans" className="hover:text-forest">Plans</Link>
        <span>/</span>
        <span className="text-ink-soft">{plan.state} · {plan.jurisdiction}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left: gallery (click to zoom) + Place-on-lot CTA */}
        <div>
          <PlanGallery images={gallery} name={plan.displayName} />

          {/* CTA */}
          <div className="mt-6 rounded-3xl border border-forest/20 bg-mist/50 p-6">
            {plan.placeable ? (
              <>
                <h3 className="font-display text-xl text-ink">See it on your property</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  Open this plan in the placement tool, enter your address, and watch it drop onto your
                  lot to scale — free.
                </p>
                <div className="mt-4">
                  <PlaceOnLotButton plan={plan} large />
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-xl text-ink">Lot placement coming soon</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  This plan isn’t yet available for lot placement. Browse other plans that are ready to
                  place on your property.
                </p>
                <Link href="/plans?placeable=1" className="mt-4 inline-flex rounded-full border border-forest px-5 py-2.5 text-sm font-semibold text-forest hover:bg-mist">
                  Show placeable plans →
                </Link>
              </>
            )}
          </div>

          {/* Multi-level disclaimer (per Rodger's universal wording) */}
          <p className="mt-4 flex gap-2 rounded-2xl bg-cream px-4 py-3 text-xs leading-relaxed text-muted">
            <span aria-hidden>ℹ️</span>
            <span>
              The purpose of this tool is to fit the ADU on your lot. For more detail about the layout —
              including each floor of a multi-level design — please review the full home description.
            </span>
          </p>
        </div>

        {/* Right: details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {plan.placeable && (
              <span className="chip bg-mist text-forest-700">
                <span className="h-1.5 w-1.5 rounded-full bg-forest" /> Fits on your lot
              </span>
            )}
            {plan.stories === 2 && <span className="chip bg-night/10 text-ink">2-Story design</span>}
            {plan.loft && <span className="chip bg-amber/20 text-amber-600">Loft</span>}
          </div>

          <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
            {plan.displayName}
          </h1>
          <p className="mt-2 text-lg text-ink-soft">
            {[plan.floorPlanLabel, plan.sqft ? `${plan.sqft.toLocaleString()} sq ft` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {plan.jurisdiction}, {plan.county || plan.state}
            {plan.architect && <> · Designed by {plan.architect}</>}
          </p>

          {/* Headline specs */}
          <dl className="mt-6 grid grid-cols-3 gap-3">
            <HeadStat label="Sq Ft" value={plan.sqft ? plan.sqft.toLocaleString() : "See plan"} />
            <HeadStat label="Bed / Bath" value={`${plan.beds ?? "—"} / ${plan.baths ?? "—"}`} />
            <HeadStat label="Footprint" value={plan.width && plan.depth ? `${plan.width}′×${plan.depth}′` : "See plan"} />
          </dl>

          {/* Full plan details */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="border-b border-line-soft bg-mist/40 px-5 py-3">
              <h2 className="font-display text-lg text-ink">Plan Details</h2>
            </div>
            <dl className="divide-y divide-line-soft">
              <SpecRow icon="pin" label="State" value={plan.state} />
              <SpecRow icon="ruler" label="Square Feet" value={plan.sqft ? `${plan.sqft.toLocaleString()} sq ft` : "See plan"} />
              <SpecRow icon="bed" label="Bedrooms" value={plan.bedsLabel} />
              <SpecRow icon="bath" label="Bathrooms" value={plan.baths ?? "See plan"} />
              <SpecRow icon="stairs" label="Stories" value={plan.stories === 2 ? "2-Story" : "1-Story"} />
              <SpecRow icon="loft" label="Loft" value={plan.loft ? "Yes" : "No"} />
              <SpecRow icon="garage" label="Garage" value={plan.garage ? "Yes" : "No"} />
              {plan.architect && <SpecRow icon="pencil" label="Architect / Designer" value={plan.architect} />}
              {plan.payment && <SpecRow icon="tag" label="Payment to Acquire Plan" value={plan.payment} highlight={/no charge|free/i.test(plan.payment)} />}
            </dl>
            {plan.pradUrl && (
              <a
                href={plan.pradUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 border-t border-line-soft bg-mist/30 px-5 py-3.5 text-sm font-semibold text-forest hover:bg-mist"
              >
                <span>✓ Pre-approved in {plan.jurisdiction}</span>
                <span className="text-forest-600">View requirements ↗</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* PRADU cost + financing + shipping estimator */}
      {plan.sqft ? (
        <PlanEstimator
          sqft={plan.sqft}
          state={plan.state}
          jurisdiction={plan.jurisdiction}
          floorPlan={plan.floorPlanLabel}
          elevation={plan.style}
        />
      ) : null}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="reveal font-display text-2xl text-ink">More plans near {plan.jurisdiction}</h2>
          <div className="reveal-stagger mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {related.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HeadStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4 text-center">
      <div className="font-display text-xl text-ink">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function SpecRow({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="flex items-center gap-2.5 text-sm text-ink-soft">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mist text-forest">
          <SpecIcon name={icon} />
        </span>
        {label}
      </dt>
      <dd className={`text-sm font-semibold ${highlight ? "text-forest-600" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

function SpecIcon({ name }) {
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "pin": return <svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "ruler": return <svg {...p}><path d="M3 8h18v8H3z" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></svg>;
    case "bed": return <svg {...p}><path d="M3 18v-6h18v6M3 12V8a2 2 0 0 1 2-2h5v6M3 18h18" /></svg>;
    case "bath": return <svg {...p}><path d="M4 12V6a2 2 0 0 1 4 0M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" /><path d="M6 19l-1 2M18 19l1 2" /></svg>;
    case "stairs": return <svg {...p}><path d="M4 20v-4h4v-4h4v-4h4V4h4" /></svg>;
    case "loft": return <svg {...p}><path d="M3 11 12 4l9 7" /><path d="M5 11v9h14v-9" /><path d="M9 20v-5h6v5" /></svg>;
    case "garage": return <svg {...p}><path d="M3 21V8l9-4 9 4v13" /><path d="M6 21v-8h12v8" /><path d="M6 16h12M6 18.5h12" /></svg>;
    case "pencil": return <svg {...p}><path d="m14 6 4 4L8 20l-4 1 1-4z" /><path d="m14 6 3-3 4 4-3 3" /></svg>;
    case "tag": return <svg {...p}><path d="M20 12 12 20l-8-8V4h8z" /><circle cx="8" cy="8" r="1.4" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
  }
}
