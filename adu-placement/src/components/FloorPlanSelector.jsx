import { useMemo, useState } from "react";
import { usePlansCatalog } from "../lib/plansCatalog";
import FloorPlanSvg from "./FloorPlanSvg";

const ALL_FILTER = "__all__";

export default function FloorPlanSelector({ value, onChange, disabled }) {
  const { plans, loading: plansLoading } = usePlansCatalog();
  const [filter, setFilter] = useState(ALL_FILTER);
  const [query, setQuery] = useState("");

  // Group plans by series so we can build pills with accurate counts.
  const groups = useMemo(() => {
    const map = new Map();
    for (const plan of plans) {
      if (!map.has(plan.series)) map.set(plan.series, []);
      map.get(plan.series).push(plan);
    }
    return Array.from(map.entries()).map(([series, ps]) => ({ series, plans: ps }));
  }, [plans]);

  const visiblePlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plans.filter((p) => {
      if (filter !== ALL_FILTER && p.series !== filter) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.series?.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        String(p.sqft || "").includes(q)
      );
    });
  }, [filter, query, plans]);

  return (
    <div className="floor-plan-picker">
      <div className="fp-search-wrap">
        <svg
          className="fp-search-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          className="fp-search-input"
          placeholder={
            plansLoading
              ? "Loading plans…"
              : `Search ${plans.length.toLocaleString()} plans by name, series, or sq. ft.`
          }
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search floor plans"
        />
        {query && (
          <button
            type="button"
            className="fp-search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="fp-filter-bar" role="tablist" aria-label="Filter by jurisdiction">
        <button
          type="button"
          role="tab"
          aria-selected={filter === ALL_FILTER}
          className={`fp-filter-pill ${filter === ALL_FILTER ? "active" : ""}`}
          disabled={disabled || plansLoading}
          onClick={() => setFilter(ALL_FILTER)}
        >
          All
          <span className="fp-filter-count">
            {plansLoading ? "…" : plans.length}
          </span>
        </button>
        {groups.map(({ series, plans }) => (
          <button
            key={series}
            type="button"
            role="tab"
            aria-selected={filter === series}
            className={`fp-filter-pill ${filter === series ? "active" : ""}`}
            disabled={disabled}
            onClick={() => setFilter(series)}
            title={series}
          >
            {series}
            <span className="fp-filter-count">{plans.length}</span>
          </button>
        ))}
      </div>

      {query.trim() && (
        <div className="fp-search-meta" aria-live="polite">
          {visiblePlans.length.toLocaleString()} of {FLOOR_PLANS.length.toLocaleString()} plans match &ldquo;{query.trim()}&rdquo;
        </div>
      )}

      {plansLoading ? (
        <div className="fp-loading-grid" aria-busy="true" aria-label="Loading plans">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="fp-card-skeleton" />
          ))}
        </div>
      ) : visiblePlans.length === 0 ? (
        <div className="fp-empty">
          <p className="fp-empty-title">No plans match your search.</p>
          <p className="fp-empty-sub">
            Try a different keyword, or{" "}
            <button
              type="button"
              className="fp-empty-reset"
              onClick={() => {
                setQuery("");
                setFilter(ALL_FILTER);
              }}
            >
              reset filters
            </button>
            .
          </p>
        </div>
      ) : (
      <div className="fp-gallery" role="listbox" aria-label="Floor plans">
        {visiblePlans.map((plan) => {
          const isActive = value?.id === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              role="option"
              aria-selected={isActive}
              disabled={disabled}
              className={`fp-card ${isActive ? "active" : ""}`}
              onClick={() => onChange(plan)}
            >
              <div className="fp-card-thumb">
                {plan.image ? (
                  <img src={plan.image} alt={plan.name} className="fp-card-img" />
                ) : (
                  <FloorPlanSvg
                    plan={plan}
                    variant="thumb"
                    showLabels={false}
                    showDecks={false}
                    showDimensions={false}
                  />
                )}
                <span className="fp-card-series">{plan.series}</span>
              </div>
              <div className="fp-card-body">
                <div className="fp-card-row">
                  <span className="fp-card-name">{plan.name}</span>
                  <span className="fp-card-sqft">{plan.sqft} sf</span>
                </div>
                <div className="fp-card-meta">
                  {plan.keySpecs.bedrooms !== "See plan" && (
                    <>
                      <span><b>{plan.keySpecs.bedrooms}</b> bd</span>
                      <span className="fp-dot" />
                      <span><b>{plan.keySpecs.bathrooms}</b> ba</span>
                      <span className="fp-dot" />
                    </>
                  )}
                  <span>
                    {plan.width}&apos; × {plan.depth}&apos;
                  </span>
                </div>
                <p className="fp-card-tagline">{plan.tagline}</p>
              </div>
            </button>
          );
        })}
      </div>
      )}

      {value && <SelectedPlanDetail plan={value} />}
    </div>
  );
}

function SelectedPlanDetail({ plan }) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <article className="fp-detail">
      <div className="fp-detail-head">
        <div>
          <span className="fp-detail-series">{plan.series}</span>
          <h3 className="fp-detail-title">{plan.name}</h3>
          <p className="fp-detail-tagline">{plan.tagline}</p>
        </div>
        <span className="fp-detail-pill">Selected</span>
      </div>

      <div className="fp-detail-image-wrap">
        {plan.image ? (
          <img
            src={plan.image}
            alt={`Floor plan of ${plan.name}`}
            className="fp-detail-img"
          />
        ) : (
          <FloorPlanSvg
            plan={plan}
            variant="full"
            showLabels
            showDecks
            showDimensions
            ariaLabel={`Floor plan of ${plan.name}`}
          />
        )}
        <div className="fp-img-dims">{plan.width}&apos; × {plan.depth}&apos;</div>
        <button
          type="button"
          className="fp-img-zoom-btn"
          onClick={() => setLightbox(true)}
          aria-label="View full floor plan"
          title="Zoom in"
        >
          <ZoomIcon />
        </button>
      </div>

      {lightbox && (
        <div
          className="fp-lightbox"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Floor plan of ${plan.name}`}
        >
          <div className="fp-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="fp-lightbox-close"
              onClick={() => setLightbox(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="fp-lightbox-header">
              <span className="fp-lightbox-name">{plan.name}</span>
              <span className="fp-lightbox-dims">{plan.width}&apos; × {plan.depth}&apos;</span>
              <span className="fp-lightbox-sqft">{plan.sqft} sf</span>
            </div>
            {plan.image ? (
              <img
                src={plan.image}
                alt={`Floor plan of ${plan.name}`}
                className="fp-lightbox-img"
              />
            ) : (
              <FloorPlanSvg
                plan={plan}
                variant="full"
                showLabels
                showDecks
                showDimensions
                ariaLabel={`Floor plan of ${plan.name}`}
                className="fp-lightbox-svg"
              />
            )}
          </div>
        </div>
      )}

      <KeySpecs specs={plan.keySpecs} />

      <h4 className="fp-detail-subhead">Floor plan description</h4>
      <p className="fp-detail-description">{plan.description}</p>

      <h4 className="fp-detail-subhead">What&apos;s included</h4>
      <ul className="fp-detail-features">
        {plan.features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </article>
  );
}

function KeySpecs({ specs }) {
  const fmt = (v) => (v === "See plan" || v === null || v === undefined ? "—" : v);
  const items = [
    { icon: <IconTape />, value: fmt(specs.livableSqft), label: "Livable sq. ft." },
    { icon: <IconBed />,  value: fmt(specs.bedrooms),    label: "Bedroom(s)" },
    { icon: <IconBath />, value: fmt(specs.bathrooms),   label: "Bathroom(s)" },
    { icon: <IconHouse />,value: fmt(specs.floors),      label: "Floor(s)" },
    { icon: <IconGarage />,value: fmt(specs.garage),     label: "Garage(s)" },
    { icon: <IconStud />, value: fmt(specs.studs),       label: "Exterior Studs" },
  ];
  return (
    <div className="key-specs">
      <h4 className="fp-detail-subhead">Key Specs</h4>
      <div className="key-specs-grid">
        {items.map((it, i) => (
          <div className="key-spec" key={i}>
            <div className="key-spec-icon">{it.icon}</div>
            <div className="key-spec-text">
              <span className="key-spec-value">{it.value}</span>
              <span className="key-spec-label">{it.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- icons (inline SVG, brand green) ---------- */
const STROKE = "#3f7a3a";
const FILL = "#3f7a3a";

function IconTape() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <circle cx="8" cy="12" r="2.5" />
      <path d="M11 12h9" strokeDasharray="2 2" />
      <path d="M14 9v3M17 9v3M20 9v3" />
    </svg>
  );
}
function IconBed() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18V8" />
      <path d="M3 13h18v5" />
      <path d="M21 18V11a3 3 0 0 0-3-3H10v5" />
      <circle cx="7" cy="11.5" r="1.5" fill={FILL} stroke="none" />
    </svg>
  );
}
function IconBath() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h17v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z" />
      <path d="M6 12V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <path d="M5 19l-1 2M20 19l1 2" />
    </svg>
  );
}
function IconHouse() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <circle cx="9" cy="15" r="1" />
      <circle cx="12" cy="15" r="1" />
      <circle cx="15" cy="15" r="1" />
    </svg>
  );
}
function IconGarage() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V8l9-5 9 5v13" />
      <rect x="6" y="11" width="12" height="10" rx="1" />
      <path d="M6 14h12M6 17h12" />
    </svg>
  );
}
function IconStud() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l4-12h4l4 12" />
      <path d="M11 20l4-12h4l2 12" />
      <circle cx="20" cy="5" r="2" fill={FILL} stroke="none" />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M9 11h4M11 9v4" />
    </svg>
  );
}
