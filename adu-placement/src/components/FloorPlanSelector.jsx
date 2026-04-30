const PRESETS = [
  { id: "A", label: "Plan A", subtitle: "Studio", width: 20, height: 20 },
  { id: "B", label: "Plan B", subtitle: "1-Bedroom", width: 24, height: 32 },
  { id: "C", label: "Plan C", subtitle: "2-Bedroom", width: 30, height: 40 },
];

export default function FloorPlanSelector({ value, onChange, disabled }) {
  return (
    <div className="floor-plan-selector">
      {PRESETS.map((p) => {
        const isActive = value?.id === p.id;
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            className={`fp-option ${isActive ? "active" : ""}`}
            onClick={() => onChange(p)}
          >
            <div className="fp-row">
              <span className="fp-name">{p.label}</span>
              <span className="fp-pill">{p.subtitle}</span>
            </div>
            <div className="fp-dims">
              {p.width} × {p.height} ft
              <span className="fp-area"> · {p.width * p.height} sqft</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
