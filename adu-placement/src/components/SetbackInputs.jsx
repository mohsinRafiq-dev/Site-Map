const SIDES = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
];

export default function SetbackInputs({ setbacks, onChange }) {
  function update(key, raw) {
    const num = Math.max(0, Math.min(100, Number(raw) || 0));
    onChange({ ...setbacks, [key]: num });
  }

  function applyAll(value) {
    onChange({ front: value, back: value, left: value, right: value });
  }

  return (
    <div className="setback-inputs">
      <p className="hint">
        The yellow dashed line is the buildable area after setbacks.
      </p>

      <div className="dim-grid four">
        {SIDES.map((s) => (
          <label key={s.key} className="dim-field">
            <span>{s.label} (ft)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={setbacks[s.key]}
              onChange={(e) => update(s.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="quick-row">
        <span className="quick-label">Apply to all:</span>
        <button type="button" className="btn-pill" onClick={() => applyAll(5)}>
          5 ft
        </button>
        <button type="button" className="btn-pill" onClick={() => applyAll(10)}>
          10 ft
        </button>
        <button type="button" className="btn-pill" onClick={() => applyAll(15)}>
          15 ft
        </button>
      </div>

      <p className="disclaimer">
        ⚠ Setback guidance is approximate and for visualization only. Always
        verify required setbacks with your local planning department before building.
      </p>
    </div>
  );
}
