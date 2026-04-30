export default function FootprintControls({ rotation, onRotate, onReset }) {
  return (
    <div className="footprint-controls">
      <p className="hint">Drag the rectangle on the map. Rotate using buttons.</p>
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
          <span className="rotate-value">{Math.round(rotation)}°</span>
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
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(-90)}>
          -90°
        </button>
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(-1)}>
          -1°
        </button>
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(1)}>
          +1°
        </button>
        <button type="button" className="btn btn-ghost sm" onClick={() => onRotate(90)}>
          +90°
        </button>
      </div>
      <button type="button" className="btn btn-link" onClick={onReset}>
        Reset position & rotation
      </button>
    </div>
  );
}
