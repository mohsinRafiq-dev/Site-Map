export default function FootprintControls({
  rotation,
  onRotate,
  onReset,
  onSnap90,
  onAlignStreet,
  alignBusy,
  snapToSetbacks,
  onToggleSnap,
}) {
  const norm = ((rotation % 360) + 360) % 360;
  const atSnap = [0, 90, 180, 270].some((a) => Math.abs(((norm - a + 360) % 360)) < 0.5);

  return (
    <div className="footprint-controls">
      <p className="hint">
        Drag the home on the map to place it. Use the buttons to rotate, or
        snap it to the street for a perfect alignment.
      </p>

      <div className="rotate-row">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onRotate(-15)}
          aria-label="Rotate -15°"
        >
          ↺ -15°
        </button>
        <div className="rotate-display">
          <span className="rotate-label">Rotation</span>
          <span className="rotate-value">{Math.round(norm)}°</span>
          {atSnap && (
            <span className="fc-rotation-snapped">● Snapped</span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onRotate(15)}
          aria-label="Rotate +15°"
        >
          ↻ +15°
        </button>
      </div>

      <div className="rotate-row sub">
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(-90)}>-90°</button>
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(-1)}>-1°</button>
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(1)}>+1°</button>
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(90)}>+90°</button>
      </div>

      <div className="fc-snap-row">
        <button type="button" className="btn" onClick={onSnap90}>
          ↟ Snap to 90°
        </button>
        <button
          type="button"
          className="btn"
          onClick={onAlignStreet}
          disabled={alignBusy}
          title="Rotate so the front entry faces the nearest street"
        >
          {alignBusy ? "Aligning…" : "🧭 Align to street"}
        </button>
      </div>

      <div className="fc-snap-row">
        <button
          type="button"
          className={`btn ${snapToSetbacks ? "btn-active" : ""}`}
          onClick={onToggleSnap}
          aria-pressed={snapToSetbacks}
          title="Keep the home inside the buildable area while dragging"
        >
          {snapToSetbacks ? "✓ Snap-to-setbacks ON" : "Snap-to-setbacks OFF"}
        </button>
        <button type="button" className="btn" onClick={onReset}>
          ↺ Reset position
        </button>
      </div>

      {snapToSetbacks && (
        <div className="fc-snap-banner">
          <b>Snap-to-setbacks is on.</b> The home will slide along the dashed
          buildable edge instead of crossing it.
        </div>
      )}
    </div>
  );
}
