import { getAllPlans, buildFacets, filterPlans } from "@/lib/baserow";
import PlanCard from "@/components/PlanCard";
import PlanFilters from "@/components/PlanFilters";
import Pagination from "@/components/Pagination";

export const metadata = {
  title: "Browse ADU Floor Plans",
  description: "Search thousands of build-ready ADU floor plans by state, size, bedrooms and more.",
};

const PER_PAGE = 24;

export default async function PlansPage({ searchParams }) {
  const sp = await searchParams;
  const all = await getAllPlans();
  const facets = buildFacets(all);

  const filters = {
    q: sp.q || "",
    state: sp.state || "",
    architect: sp.architect || "",
    floorPlan: sp.floorPlan || "",
    beds: sp.beds ?? null,
    baths: sp.baths ?? null,
    stories: sp.stories || "",
    garage: sp.garage ?? "",
    loft: sp.loft ?? "",
    sqftMin: sp.sqftMin || "",
    sqftMax: sp.sqftMax || "",
    placeable: sp.placeable === "1",
  };

  const filtered = filterPlans(all, filters);
  const sorted = filtered.sort(
    (a, b) => Number(b.placeable) - Number(a.placeable) || (a.sqft || 0) - (b.sqft || 0)
  );

  const page = Math.max(1, parseInt(sp.page, 10) || 1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * PER_PAGE;
  const pageItems = sorted.slice(start, start + PER_PAGE);

  const makeHref = (n) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return `/plans${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-x py-10 md:py-14">
      <header className="reveal mb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-forest-600">
          The catalog
        </span>
        <h1 className="mt-1 font-display text-4xl text-ink md:text-5xl">
          {filters.architect ? `Plans by ${filters.architect}` : "Browse floor plans"}
        </h1>
        {filters.architect && (
          <a href="/plans" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-forest hover:text-forest-600">
            ← Clear designer filter
          </a>
        )}
        <p className="mt-2 text-ink-soft">
          {sorted.length.toLocaleString()} plans match ·{" "}
          <span className="text-forest">{sorted.filter((p) => p.placeable).length.toLocaleString()} ready to place on your lot</span>
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <PlanFilters facets={facets} />

        <div>
          {pageItems.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-paper py-24 text-center">
              <div className="text-4xl">🔍</div>
              <h3 className="mt-4 font-display text-xl text-ink">No plans match those filters</h3>
              <p className="mt-1 text-sm text-ink-soft">Try widening your search or clearing a filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
              {pageItems.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} priority={i < 6} />
              ))}
            </div>
          )}

          <Pagination current={clampedPage} totalPages={totalPages} makeHref={makeHref} />
        </div>
      </div>
    </div>
  );
}
