export default function LotConfirmation({
  lotDims,
  onChangeDims,
  confirmed,
  onConfirm,
  onReset,
}) {
  function update(field, raw) {
    const num = Math.max(10, Math.min(500, Number(raw) || 0));
    onChangeDims({ ...lotDims, [field]: num });
  }

  return (
    <div className="lot-confirm">
      <p className="hint">
        Adjust the lot rectangle to roughly match your property, then confirm.
      </p>

      <div className="dim-grid">
        <label className="dim-field">
          <span>Width (ft)</span>
          <input
            type="number"
            value={lotDims.width}
            disabled={confirmed}
            onChange={(e) => update("width", e.target.value)}
          />
        </label>
        <label className="dim-field">
          <span>Length (ft)</span>
          <input
            type="number"
            value={lotDims.length}
            disabled={confirmed}
            onChange={(e) => update("length", e.target.value)}
          />
        </label>
      </div>

      {!confirmed ? (
        <button className="btn btn-primary" onClick={onConfirm}>
          Confirm Lot
        </button>
      ) : (
        <div className="confirmed-row">
          <span className="badge badge-ok">Lot confirmed</span>
          <button className="btn btn-link" onClick={onReset}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
