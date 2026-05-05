import { FLOOR_PLANS } from "../lib/floorPlans";
import FloorPlanSvg from "./FloorPlanSvg";

// Zillow-style floor plan picker:
//  • Horizontal gallery of cards (each shows the plan thumbnail + headline)
//  • Tapping a card selects it and reveals a rich detail panel below
//    with key specs, large floor plan, description and features.
export default function FloorPlanSelector({ value, onChange, disabled }) {
  return (
    <div className="floor-plan-picker">
      <div className="fp-gallery" role="listbox" aria-label="Floor plans">
        {FLOOR_PLANS.map((plan) => {
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
                <FloorPlanSvg
                  plan={plan}
                  variant="thumb"
                  showLabels={false}
                  showDecks={false}
                  showDimensions={false}
                />
                <span className="fp-card-series">{plan.series}</span>
              </div>
              <div className="fp-card-body">
                <div className="fp-card-row">
                  <span className="fp-card-name">{plan.name}</span>
                  <span className="fp-card-sqft">{plan.sqft} sf</span>
                </div>
                <div className="fp-card-meta">
                  <span>
                    <b>{plan.keySpecs.bedrooms}</b> bd
                  </span>
                  <span className="fp-dot" />
                  <span>
                    <b>{plan.keySpecs.bathrooms}</b> ba
                  </span>
                  <span className="fp-dot" />
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

      {value && <SelectedPlanDetail plan={value} />}
    </div>
  );
}

function SelectedPlanDetail({ plan }) {
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
        <FloorPlanSvg
          plan={plan}
          variant="full"
          showLabels
          showDecks
          showDimensions
          ariaLabel={`Floor plan of ${plan.name}`}
        />
      </div>

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
  const items = [
    { icon: <IconTape />, value: specs.livableSqft, label: "Livable sq. ft." },
    { icon: <IconBed />, value: specs.bedrooms, label: "Bedroom(s)" },
    { icon: <IconBath />, value: specs.bathrooms, label: "Bathroom(s)" },
    { icon: <IconHouse />, value: specs.floors, label: "Floor(s)" },
    { icon: <IconGarage />, value: specs.garage, label: "Garage(s)" },
    { icon: <IconStud />, value: specs.studs, label: "Exterior Studs" },
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
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <circle cx="8" cy="12" r="2.5" />
      <path d="M11 12h9" strokeDasharray="2 2" />
      <path d="M14 9v3M17 9v3M20 9v3" />
    </svg>
  );
}
function IconBed() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18V8" />
      <path d="M3 13h18v5" />
      <path d="M21 18V11a3 3 0 0 0-3-3H10v5" />
      <circle cx="7" cy="11.5" r="1.5" fill={FILL} stroke="none" />
    </svg>
  );
}
function IconBath() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h17v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z" />
      <path d="M6 12V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <path d="M5 19l-1 2M20 19l1 2" />
    </svg>
  );
}
function IconHouse() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V8l9-5 9 5v13" />
      <rect x="6" y="11" width="12" height="10" rx="1" />
      <path d="M6 14h12M6 17h12" />
    </svg>
  );
}
function IconStud() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l4-12h4l4 12" />
      <path d="M11 20l4-12h4l2 12" />
      <circle cx="20" cy="5" r="2" fill={FILL} stroke="none" />
    </svg>
  );
}
