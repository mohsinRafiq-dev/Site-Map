import { useEffect, useMemo, useState } from "react";
import { usePlansCatalog } from "../lib/plansCatalog";

const ALL = "__all__";

// Full-screen plan gallery. Opens on demand from Step 3 so the wizard
// sidebar stays short. Filters by jurisdiction + size + free-text search.
export default function FloorPlanModal({ open, value, onClose, onSelect }) {
  const { plans, loading, error, reload } = usePlansCatalog();
  const [filter, setFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("all"); // all | s | m | l
  const [sort, setSort] = useState("default"); // default | sqftAsc | sqftDesc | beds

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const jurisdictions = useMemo(() => {
    const m = new Map();
    for (const p of plans) m.set(p.series, (m.get(p.series) || 0) + 1);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [plans]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = plans.filter((p) => {
      if (filter !== ALL && p.series !== filter) return false;
      if (size === "s" && p.sqft >= 600) return false;
      if (size === "m" && (p.sqft < 600 || p.sqft > 1000)) return false;
      if (size === "l" && p.sqft <= 1000) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.series?.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        String(p.sqft || "").includes(q)
      );
    });
    const beds = (p) => (typeof p.keySpecs?.bedrooms === "number" ? p.keySpecs.bedrooms : -1);
    const sorted = [...filtered];
    if (sort === "sqftAsc") sorted.sort((a, b) => (a.sqft || 0) - (b.sqft || 0));
    else if (sort === "sqftDesc") sorted.sort((a, b) => (b.sqft || 0) - (a.sqft || 0));
    else if (sort === "beds") sorted.sort((a, b) => beds(b) - beds(a) || (a.sqft || 0) - (b.sqft || 0));
    return sorted;
  }, [plans, filter, query, size, sort]);

  if (!open) return null;

  return (
    <div className="plan-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="plan-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Browse floor plans"
      >
        {/* Header */}
        <div className="plan-modal-head">
          <div className="pmh-title">
            <span className="pmh-kicker">Floor Plan Catalog</span>
            <h2>Choose your home</h2>
          </div>
          <div className="pmh-search">
            <SearchIcon />
            <input
              type="search"
              placeholder={loading ? "Loading…" : `Search ${plans.length} plans…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button className="pmh-clear" onClick={() => setQuery("")} aria-label="Clear">✕</button>
            )}
          </div>
          <button className="plan-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Filters */}
        <div className="plan-modal-filters">
          <div className="pmf-pills">
            <button
              className={`pmf-pill ${filter === ALL ? "active" : ""}`}
              onClick={() => setFilter(ALL)}
            >
              All <span>{plans.length}</span>
            </button>
            {jurisdictions.map(([series, count]) => (
              <button
                key={series}
                className={`pmf-pill ${filter === series ? "active" : ""}`}
                onClick={() => setFilter(series)}
              >
                {series} <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="pmf-row2">
            <div className="pmf-size">
              {[
                { id: "all", label: "Any size" },
                { id: "s", label: "< 600 sf" },
                { id: "m", label: "600–1000" },
                { id: "l", label: "> 1000 sf" },
              ].map((s) => (
                <button
                  key={s.id}
                  className={`pmf-size-btn ${size === s.id ? "active" : ""}`}
                  onClick={() => setSize(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <label className="pmf-sort">
              <span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Jurisdiction</option>
                <option value="sqftAsc">Size: small → large</option>
                <option value="sqftDesc">Size: large → small</option>
                <option value="beds">Most bedrooms</option>
              </select>
            </label>
          </div>
        </div>

        {/* Grid */}
        <div className="plan-modal-grid-wrap">
          {error && !loading ? (
            <div className="plan-modal-empty">
              <p className="pme-title">Couldn't load floor plans</p>
              <p className="pme-sub">Check your connection and try again.</p>
              <button className="btn btn-accent sm" onClick={reload}>↻ Try again</button>
            </div>
          ) : loading ? (
            <div className="plan-modal-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="pm-card-skeleton" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="plan-modal-empty">
              <p>No plans match your filters.</p>
              <button
                className="btn btn-ghost sm"
                onClick={() => { setQuery(""); setFilter(ALL); setSize("all"); }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="plan-modal-grid">
              {visible.map((plan) => {
                const active = value?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    className={`pm-card ${active ? "active" : ""}`}
                    onClick={() => onSelect(plan)}
                  >
                    <div className="pm-card-thumb">
                      {plan.image ? (
                        <img src={plan.image} alt={plan.name} loading="lazy" />
                      ) : (
                        <span className="pm-card-ph">▦</span>
                      )}
                      <span className="pm-card-series">{plan.series}</span>
                      {active && <span className="pm-card-check">✓</span>}
                    </div>
                    <div className="pm-card-body">
                      <div className="pm-card-row">
                        <span className="pm-card-name">{plan.name}</span>
                        <span className="pm-card-sqft">{plan.sqft} sf</span>
                      </div>
                      <div className="pm-card-meta">
                        {plan.keySpecs?.bedrooms !== "See plan" && plan.keySpecs?.bedrooms != null && (
                          <span><b>{plan.keySpecs.bedrooms}</b> bd · <b>{plan.keySpecs.bathrooms}</b> ba ·</span>
                        )}
                        <span>{plan.width}′ × {plan.depth}′</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="plan-modal-foot">
          {loading ? "Loading catalog…" : `${visible.length} of ${plans.length} plans shown`}
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
