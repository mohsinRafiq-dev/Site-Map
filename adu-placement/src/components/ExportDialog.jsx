import { useEffect, useMemo, useState } from "react";

// Modal that lets the user customise the exported site-plan PNG:
//   • Filename (auto-suggested from the address)
//   • Quality preset (standard / high / print)
//   • Toggle elements (info panel, scale bar, north arrow, legend)
// Hits onDownload(options) on submit. Parent owns the actual export call.
export default function ExportDialog({
  open,
  onClose,
  onDownload,
  defaultTitle,
  defaultAddress,
  planName,
}) {
  const suggested = useMemo(
    () => buildSuggestedFilename(defaultAddress, planName),
    [defaultAddress, planName]
  );

  const [filename, setFilename] = useState(suggested);
  const [title, setTitle] = useState(defaultTitle || "Site Plan");
  const [quality, setQuality] = useState("high"); // standard | high | print
  const [includeInfoPanel, setIncludeInfoPanel] = useState(true);
  const [includeScaleBar, setIncludeScaleBar] = useState(true);
  const [includeNorthArrow, setIncludeNorthArrow] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [busy, setBusy] = useState(false);

  // Refresh the suggested filename if the user opens the dialog after
  // changing plan/address.
  useEffect(() => {
    if (open) {
      setFilename((curr) => curr || suggested);
    }
  }, [open, suggested]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const scale = quality === "standard" ? 1 : quality === "print" ? 3 : 2;
    const cleanedFilename = ensurePngExtension(
      filename.trim() || suggested
    );
    try {
      await onDownload({
        filename: cleanedFilename,
        title: title.trim() || "Site Plan",
        scale,
        includeInfoPanel,
        includeScaleBar,
        includeNorthArrow,
        includeLegend,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="export-dialog-overlay" onClick={busy ? undefined : onClose}>
      <form
        className="export-dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
      >
        <header className="export-dialog-head">
          <div>
            <span className="export-dialog-eyebrow">EXPORT</span>
            <h3 id="export-dialog-title">Download site plan</h3>
            <p className="export-dialog-sub">
              Produces a high-resolution PNG with the satellite map, your
              floor plan, and a printable info panel.
            </p>
          </div>
          <button
            type="button"
            className="export-dialog-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="export-dialog-body">
          <Field label="File name">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={suggested}
              spellCheck="false"
              autoComplete="off"
            />
          </Field>

          <Field label="Title shown on the plan">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Site Plan"
              spellCheck="false"
            />
          </Field>

          <Field label="Quality">
            <div className="export-quality-row">
              <QualityOption
                value="standard"
                checked={quality === "standard"}
                onChange={setQuality}
                label="Standard"
                hint="1× · ~1 MB"
              />
              <QualityOption
                value="high"
                checked={quality === "high"}
                onChange={setQuality}
                label="High"
                hint="2× · best for screen"
                recommended
              />
              <QualityOption
                value="print"
                checked={quality === "print"}
                onChange={setQuality}
                label="Print"
                hint="3× · large file"
              />
            </div>
          </Field>

          <Field label="Include on the export">
            <div className="export-toggle-grid">
              <Toggle
                checked={includeInfoPanel}
                onChange={setIncludeInfoPanel}
                label="Info panel"
                hint="Lot, setbacks, plan details"
              />
              <Toggle
                checked={includeScaleBar}
                onChange={setIncludeScaleBar}
                label="Scale bar"
                hint="Real-world feet ruler"
              />
              <Toggle
                checked={includeNorthArrow}
                onChange={setIncludeNorthArrow}
                label="North arrow"
                hint="Compass orientation"
              />
              <Toggle
                checked={includeLegend}
                onChange={setIncludeLegend}
                label="Legend"
                hint="Line / color key"
              />
            </div>
          </Field>
        </div>

        <footer className="export-dialog-foot">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-accent"
            disabled={busy}
          >
            {busy ? "Generating…" : "⬇ Download PNG"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="export-field">
      <span className="export-field-label">{label}</span>
      {children}
    </label>
  );
}

function QualityOption({ value, checked, onChange, label, hint, recommended }) {
  return (
    <label className={`export-quality ${checked ? "active" : ""}`}>
      <input
        type="radio"
        name="quality"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className="export-quality-label">
        {label}
        {recommended && <span className="export-quality-tag">Recommended</span>}
      </span>
      <span className="export-quality-hint">{hint}</span>
    </label>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className={`export-toggle ${checked ? "active" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="export-toggle-body">
        <span className="export-toggle-label">{label}</span>
        <span className="export-toggle-hint">{hint}</span>
      </span>
    </label>
  );
}

function buildSuggestedFilename(address, planName) {
  const date = new Date().toISOString().slice(0, 10);
  const slug = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  const addr = slug(address);
  const plan = slug(planName);
  const parts = ["site-plan", addr, plan, date].filter(Boolean);
  return parts.join("_") + ".png";
}

function ensurePngExtension(name) {
  return /\.png$/i.test(name) ? name : `${name}.png`;
}
