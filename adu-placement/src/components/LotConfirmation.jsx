export default function LotConfirmation({
  lot,
  onChangeDims,
  onRotate,
  onResetRotation,
  confirmed,
  onConfirm,
  onReset,
}) {
  function update(field, raw) {
    const num = Math.max(10, Math.min(500, Number(raw) || 0));
    onChangeDims({ ...lot, [field]: num });
  }

  return (
    <div className="lot-confirm">
      <p className="hint">
        Drag the blue rectangle on the map to position your lot, then rotate it
        to match your property orientation.
      </p>

      {/* Dimensions */}
      <div className="lc-section">
        <span className="lc-section-label">Dimensions</span>
        <div className="dim-grid">
          <label className="dim-field">
            <span>Width (ft)</span>
            <input
              type="number"
              value={lot.width}
              disabled={confirmed}
              onChange={(e) => update("width", e.target.value)}
            />
          </label>
          <label className="dim-field">
            <span>Length (ft)</span>
            <input
              type="number"
              value={lot.length}
              disabled={confirmed}
              onChange={(e) => update("length", e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Rotation */}
      {!confirmed && (
        <div className="lc-section">
          <span className="lc-section-label">Rotation</span>

          <div className="rotate-main-row">
            <button
              type="button"
              className="btn btn-ghost rotate-btn"
              onClick={() => onRotate(-15)}
              title="Rotate -15°"
            >
              ↺&nbsp;‑15°
            </button>
            <div className="rotate-display">
              <span className="rotate-value">{Math.round(lot.rotation)}°</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost rotate-btn"
              onClick={() => onRotate(15)}
              title="Rotate +15°"
            >
              ↻&nbsp;+15°
            </button>
          </div>

          <div className="rotate-fine-row">
            {[
              { label: "−90°", delta: -90 },
              { label: "−1°", delta: -1 },
              { label: "+1°", delta: 1 },
              { label: "+90°", delta: 90 },
            ].map(({ label, delta }) => (
              <button
                key={label}
                type="button"
                className="btn btn-ghost sm"
                onClick={() => onRotate(delta)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-link lc-reset-btn"
            onClick={onResetRotation}
          >
            ↺ Reset rotation
          </button>
        </div>
      )}

      {/* Confirm / Edit */}
      <div className="lc-action">
        {!confirmed ? (
          <button className="btn btn-primary w-full" onClick={onConfirm}>
            Confirm Lot
          </button>
        ) : (
          <div className="confirmed-row">
            <span className="badge badge-ok">✓ Lot confirmed</span>
            <button className="btn btn-link" onClick={onReset}>
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
