import Link from "next/link";
import { getAllPlans, buildFacets, filterPlans } from "@/lib/baserow";
import PlanCard from "@/components/PlanCard";
import PlanFilters from "@/components/PlanFilters";
import Pagination from "@/components/Pagination";
import { CloseIcon, SearchIcon, ArrowRightIcon } from "@/components/icons";

// Human labels for the removable "active filter" chips above the grid.
function chipLabel(key, value) {
  switch (key) {
    case "q": return `“${value}”`;
    case "state": return `State: ${value}`;
    case "architect": return value;
    case "floorPlan": return value;
    case "beds": return value === "0" ? "Studio" : `${value} Bed`;
    case "baths": return `${value} Bath`;
    case "stories": return `${value}-Story`;
    case "garage": return "Garage";
    case "loft": return "Loft";
    case "sqftMin": return `≥ ${value} sqft`;
    case "sqftMax": return `≤ ${value} sqft`;
    case "placeable": return "Fits on a lot";
    default: return `${key}: ${value}`;
  }
}

// Build the list of active filters, each with an href that removes just that one.
function activeChips(sp) {
  const chips = [];
  for (const [key, value] of Object.entries(sp)) {
    if (!value || key === "page") continue;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== key && k !== "page") params.set(k, v);
    const qs = params.toString();
    chips.push({ key, label: chipLabel(key, value), href: `/plans${qs ? `?${qs}` : ""}` });
  }
  return chips;
}

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
  const chips = activeChips(sp);

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
          <Link href="/plans" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-600">
            <ArrowRightIcon size={14} className="rotate-180" /> Clear designer filter
          </Link>
        )}
        <p className="mt-2 text-ink-soft">
          <span className="font-semibold text-ink">{sorted.length.toLocaleString()}</span> plans match ·{" "}
          <span className="text-forest">{sorted.filter((p) => p.placeable).length.toLocaleString()} ready to place on your lot</span>
        </p>

        {/* Active filters — each chip removes just itself */}
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Link
                key={c.key}
                href={c.href}
                scroll={false}
                className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-forest/40 hover:text-forest"
              >
                {c.label}
                <CloseIcon size={13} className="text-muted transition-colors group-hover:text-forest" />
              </Link>
            ))}
            <Link href="/plans" scroll={false} className="ml-1 text-xs font-semibold text-forest hover:text-forest-600">
              Clear all
            </Link>
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <PlanFilters facets={facets} />

        <div>
          {pageItems.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-paper px-6 py-20 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-mist text-forest/50">
                <SearchIcon size={26} />
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">No plans match those filters</h3>
              <p className="mt-1 max-w-sm text-sm text-ink-soft">
                Try widening your search — remove a filter above, or start over.
              </p>
              <Link
                href="/plans"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Clear all filters <ArrowRightIcon size={15} />
              </Link>
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
