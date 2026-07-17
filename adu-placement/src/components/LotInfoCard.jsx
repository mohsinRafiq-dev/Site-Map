// Compact stats card showing real-world dimensions of the lot,
// the buildable area after setbacks, and footprint coverage ratio.
//
// Uses real arithmetic in feet — width/length come from user input,
// setbacks are subtracted to get buildable area, footprint is W×D
// of the selected plan. Acres = sq ft / 43,560.

import { polygonAreaSqFt, polygonBoundsFeet, offsetLotPolygon } from "../lib/geometry";

const SQFT_PER_ACRE = 43560;

export default function LotInfoCard({ lot, setbacks, floorPlan }) {
  if (!lot?.center) return null;

  const poly = !!(lot.corners && lot.corners.length >= 3);

  let lotSqFt;
  let dimsLabel;
  let buildableSqFt;
  let buildableSub;
  if (poly) {
    lotSqFt = polygonAreaSqFt(lot.corners);
    const b = polygonBoundsFeet(lot.corners, lot.rotation || 0);
    dimsLabel = `~${Math.round(b.w)}' × ${Math.round(b.l)}'`;
    const bp = offsetLotPolygon(lot.corners, setbacks || {}, lot.rotation || 0);
    buildableSqFt = bp ? polygonAreaSqFt(bp) : 0;
    buildableSub = "after setbacks";
  } else {
    lotSqFt = lot.width * lot.length;
    dimsLabel = `${lot.width}' × ${lot.length}'`;
    const buildableW = Math.max(0, lot.width - (setbacks?.left || 0) - (setbacks?.right || 0));
    const buildableL = Math.max(0, lot.length - (setbacks?.front || 0) - (setbacks?.back || 0));
    buildableSqFt = buildableW * buildableL;
    buildableSub = `${buildableW}' × ${buildableL}'`;
  }

  const lotAcres = lotSqFt / SQFT_PER_ACRE;
  const footprintSqFt = floorPlan ? floorPlan.width * floorPlan.depth : 0;
  const coverage = footprintSqFt && lotSqFt ? (footprintSqFt / lotSqFt) * 100 : null;

  return (
    <div className="lot-info-card">
      <div className="lot-info-head">
        <span className="lot-info-icon" aria-hidden="true">📐</span>
        <h4>Lot Details</h4>
      </div>
      <div className="lot-info-grid">
        <Stat
          label="Lot size"
          value={fmt(lotSqFt)}
          unit="sq ft"
          sub={`${lotAcres.toFixed(3)} acres`}
        />
        <Stat
          label="Lot dims"
          value={dimsLabel}
          unit=""
          sub={poly ? "bounds" : "W × L"}
        />
        <Stat
          label="Buildable"
          value={fmt(buildableSqFt)}
          unit="sq ft"
          sub={buildableSub}
          warn={buildableSqFt <= 0}
        />
        {floorPlan && (
          <Stat
            label="Coverage"
            value={coverage != null ? `${coverage.toFixed(1)}%` : "—"}
            unit=""
            sub={`${fmt(footprintSqFt)} sq ft footprint`}
            warn={coverage > 50}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit, sub, warn }) {
  return (
    <div className={`lot-stat ${warn ? "is-warn" : ""}`}>
      <span className="lot-stat-label">{label}</span>
      <span className="lot-stat-value">
        {value}
        {unit && <span className="lot-stat-unit"> {unit}</span>}
      </span>
      {sub && <span className="lot-stat-sub">{sub}</span>}
    </div>
  );
}

function fmt(n) {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}
