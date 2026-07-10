// "20 Good Reasons to Frame a Home with Metal and Not Wood" — the full
// Metal-vs-Wood comparison from aduplans.com, rebuilt as a premium responsive
// table (desktop) / card list (mobile).

const REASONS = [
  ["DIY Construction Benefit", "metal", "The wall frames, trusses, and beams can be erected in just a few days."],
  ["Minimal Construction Skills Required", "metal", "Pre-assembled walls and trusses require no specialized skills to erect."],
  ["Build as DIY, Hybrid, or by a General Contractor", "metal", "Do it yourself, Hybrid (involve special contractors), or hire a General Contractor."],
  ["Build It As You Can Afford It", "metal", "Impervious to weather — build as you have the time and money."],
  ["Up Front Cost of Framing Materials", "wood", "As to only the framing material, wood is less expensive."],
  ["Total Cost To Build", "metal", "Savings in time, labor, and other areas make light gauge steel LESS expensive."],
  ["Termites and Wood Boring Insects", "metal", "Termites, carpenter ants, and wood boring insects eat wood, not metal."],
  ["Mold Resistant", "metal", "Metal does not attract mold."],
  ["Damage Caused by Exterior and Interior Flooding", "metal", "Metal needs no reconditioning after a flood."],
  ["Fire Resistant", "metal", "Non-combustible."],
  ["Lower Insurance Rates", "metal", "Many insurance underwriters now provide lower rates for metal-framed homes."],
  ["Walls, Trusses, and Beams Retain Their Original Form", "metal", "Perfectly straight walls — no shimming of drywall."],
  ["Corners Are 90 Degrees", "metal", "No need for templating of countertops to adjust for out-of-square corners."],
  ["Strength and Weight", "metal", "Metal is stronger than wood and weighs less — no need for a crane to lift ADU trusses."],
  ["IBC Engineered Stamp", "metal", "If an engineering stamp is necessary, months of waiting are saved."],
  ["Complete BOM (Materials Shopping List)", "metal", "Take the materials shopping list to Home Depot and start shopping/pricing."],
  ["Flexible in Seismic Areas — Wood Fracture", "metal", "Light gauge steel is flexible and won't fracture when the earth moves."],
  ["No Waste At Job Site", "metal", "Steel is the most recycled material in the world. A typical wood home has 20–30% waste."],
  ["Environmentally Friendly", "metal", "Trees don't have to be destroyed, and the source of most metal is from recycling."],
  ["How-To Videos Included", "metal", "How-to videos provide simple assembly instructions."],
  ["Relationship Counselor", "metal", "Eliminate emotional upheavals — save time, money, and preserve the relationship."],
];

export default function MetalVsWood() {
  return (
    <section className="border-t border-line bg-cream py-16 md:py-20">
      <div className="container-x">
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">
            Metal vs Wood
          </span>
          <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            20 good reasons to frame a home with metal, not wood
          </h2>
          <p className="mt-3 text-ink-soft">
            Why build your ADU with cold-formed steel — the head-to-head that wins on nearly every line.
          </p>
        </div>

        {/* Desktop table */}
        <div className="mt-10 hidden overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-card)] md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-mist/40 text-left">
                <th className="px-5 py-4 font-semibold text-ink">Why build your ADU with metal vs wood</th>
                <th className="w-24 px-3 py-4 text-center font-semibold text-ink-soft">
                  <div className="flex flex-col items-center gap-1"><TreeIcon /> Wood</div>
                </th>
                <th className="w-28 border-x border-forest/15 bg-mist/60 px-3 py-4 text-center font-bold text-forest-700">
                  <div className="flex flex-col items-center gap-1"><BeamIcon /> Metal</div>
                </th>
                <th className="px-5 py-4 font-semibold text-ink">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {REASONS.map(([reason, winner, note], i) => (
                <tr key={reason} className={`border-b border-line-soft transition-colors last:border-0 hover:bg-mist/25 ${i % 2 ? "bg-cream/40" : ""}`}>
                  <td className="px-5 py-3.5 font-medium text-ink">{reason}</td>
                  <td className="px-3 py-3.5 text-center">{winner === "wood" ? <Win /> : <Lose />}</td>
                  <td className="border-x border-forest/10 bg-mist/30 px-3 py-3.5 text-center">{winner === "metal" ? <Win /> : <Lose />}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mt-8 grid gap-3 md:hidden">
          {REASONS.map(([reason, winner, note]) => (
            <div key={reason} className="rounded-2xl border border-line bg-paper p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-ink">{reason}</h3>
                <span className={`chip shrink-0 ${winner === "metal" ? "bg-forest text-white" : "bg-amber/20 text-amber-600"}`}>
                  {winner === "metal" ? "Metal ✓" : "Wood ✓"}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{note}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          Cold-formed steel wins <strong className="text-forest">20 of 21</strong> — wood only edges out on raw material cost.
        </p>
      </div>
    </section>
  );
}

function Win() {
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-forest text-white shadow-sm">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function Lose() {
  return <span className="inline-block h-5 w-5 rounded-full border-2 border-line" aria-hidden="true" />;
}

function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22v-5" />
      <path d="M8 17h8l-2-3h1l-2.5-3.5H14L12 7 10 10.5h1.5L9 14h1l-2 3Z" />
    </svg>
  );
}

function BeamIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
      <path d="M7 8v8M17 8v8" />
    </svg>
  );
}
