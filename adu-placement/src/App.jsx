import { useMemo, useRef, useState, useCallback } from "react";
import AddressSearch from "./components/AddressSearch";
import LotConfirmation from "./components/LotConfirmation";
import FloorPlanSelector from "./components/FloorPlanSelector";
import FootprintControls from "./components/FootprintControls";
import SetbackInputs from "./components/SetbackInputs";
import MapView from "./components/MapView";
import NorthArrow from "./components/NorthArrow";
import ValidationBadge from "./components/ValidationBadge";
import DownloadButton from "./components/DownloadButton";
import {
  makeRectangle,
  applySetbacks,
  isFootprintInside,
} from "./lib/geometry";
import "./App.css";

const DEFAULT_LOT = { width: 60, length: 100 };
const DEFAULT_SETBACKS = { front: 5, back: 5, left: 5, right: 5 };

export default function App() {
  // ---- State ----
  const [location, setLocation] = useState(null);
  const [lotDims, setLotDims] = useState(DEFAULT_LOT);
  const [lotConfirmed, setLotConfirmed] = useState(false);
  const [floorPlan, setFloorPlan] = useState(null);
  const [footprint, setFootprint] = useState(null); // {center, rotation}
  const [setbacks, setSetbacks] = useState(DEFAULT_SETBACKS);

  const mapRef = useRef(null);

  // ---- Derived geometry ----
  const lotFeature = useMemo(() => {
    if (!location) return null;
    return makeRectangle(
      [location.lng, location.lat],
      lotDims.width,
      lotDims.length,
      0
    );
  }, [location, lotDims]);

  const setbackFeature = useMemo(() => {
    if (!lotFeature || !lotConfirmed) return null;
    return applySetbacks(lotFeature, setbacks);
  }, [lotFeature, lotConfirmed, setbacks]);

  const footprintFeature = useMemo(() => {
    if (!footprint || !floorPlan) return null;
    return makeRectangle(
      footprint.center,
      floorPlan.width,
      floorPlan.height,
      footprint.rotation
    );
  }, [footprint, floorPlan]);

  const isValid = useMemo(() => {
    if (!footprintFeature || !setbackFeature) return true;
    return isFootprintInside(footprintFeature, setbackFeature);
  }, [footprintFeature, setbackFeature]);

  // ---- Step status ----
  const step1Done = !!location;
  const step2Done = !!location && lotConfirmed;
  const step3Done = step2Done && !!floorPlan && !!footprint;
  const allReady = step3Done;

  // ---- Handlers ----
  function handleSelectLocation(loc) {
    setLocation(loc);
    setLotConfirmed(false);
    setFloorPlan(null);
    setFootprint(null);
  }

  function handleConfirmLot() {
    setLotConfirmed(true);
  }

  function handleEditLot() {
    setLotConfirmed(false);
    setFloorPlan(null);
    setFootprint(null);
  }

  function handleSelectFloorPlan(fp) {
    setFloorPlan(fp);
    if (location) {
      setFootprint({ center: [location.lng, location.lat], rotation: 0 });
    }
  }

  const handleDragFootprint = useCallback((newCenter) => {
    setFootprint((f) => (f ? { ...f, center: newCenter } : f));
  }, []);

  function handleRotate(delta) {
    setFootprint((f) =>
      f ? { ...f, rotation: (f.rotation + delta) % 360 } : f
    );
  }

  function handleResetFootprint() {
    if (location) {
      setFootprint({ center: [location.lng, location.lat], rotation: 0 });
    }
  }

  async function handleDownload() {
    await mapRef.current?.exportAsPng("adu-site-plan.png");
  }

  // ---- Render ----
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div className="brand-text">
            <h1>ADU Placement</h1>
            <span className="brand-sub">Site planning, simplified</span>
          </div>
        </div>
        <div className="header-meta">
          {footprintFeature && setbackFeature && (
            <ValidationBadge isValid={isValid} />
          )}
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          {/* Step 1 */}
          <Step
            n={1}
            title="Find your address"
            done={step1Done}
            active={!step1Done}
          >
            <AddressSearch onSelectLocation={handleSelectLocation} />
            {location && (
              <div className="selected-info">
                <p className="place-name">{location.placeName}</p>
                <p className="coords">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              </div>
            )}
          </Step>

          {/* Step 2 */}
          <Step
            n={2}
            title="Confirm your lot"
            done={step2Done}
            active={step1Done && !step2Done}
            locked={!step1Done}
          >
            <LotConfirmation
              lotDims={lotDims}
              onChangeDims={setLotDims}
              confirmed={lotConfirmed}
              onConfirm={handleConfirmLot}
              onReset={handleEditLot}
            />
          </Step>

          {/* Step 3 */}
          <Step
            n={3}
            title="Pick a floor plan"
            done={!!floorPlan}
            active={step2Done && !floorPlan}
            locked={!step2Done}
          >
            <FloorPlanSelector
              value={floorPlan}
              onChange={handleSelectFloorPlan}
              disabled={!step2Done}
            />
          </Step>

          {/* Step 4 */}
          <Step
            n={4}
            title="Place & rotate"
            done={!!footprint && step3Done}
            active={!!floorPlan}
            locked={!floorPlan}
          >
            {footprint && (
              <FootprintControls
                rotation={footprint.rotation}
                onRotate={handleRotate}
                onReset={handleResetFootprint}
              />
            )}
          </Step>

          {/* Step 5 */}
          <Step
            n={5}
            title="Set setbacks"
            done={step3Done}
            active={step3Done}
            locked={!step3Done}
          >
            <SetbackInputs setbacks={setbacks} onChange={setSetbacks} />
          </Step>

          {/* Step 6 */}
          <Step
            n={6}
            title="Download site plan"
            done={false}
            active={allReady}
            locked={!allReady}
          >
            <p className="hint">
              {allReady
                ? "Save your site plan as a PNG image (includes north arrow + title)."
                : "Complete the previous steps to enable export."}
            </p>
            <DownloadButton onDownload={handleDownload} disabled={!allReady} />
          </Step>
        </aside>

        <main className="map-wrapper">
          <MapView
            ref={mapRef}
            location={location}
            lotFeature={lotFeature}
            lotConfirmed={lotConfirmed}
            setbackFeature={setbackFeature}
            footprintFeature={footprintFeature}
            isValid={isValid}
            interactive={!!floorPlan && lotConfirmed}
            onDragFootprint={handleDragFootprint}
          />
          <NorthArrow />
          <Legend
            showLot={!!lotFeature}
            showSetback={!!setbackFeature}
            showFootprint={!!footprintFeature}
            isValid={isValid}
          />
        </main>
      </div>
    </div>
  );
}

function Step({ n, title, done, active, locked, children }) {
  const cls = [
    "step",
    done ? "step-done" : "",
    active ? "step-active" : "",
    locked ? "step-locked" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={cls}>
      <header className="step-header">
        <span className="step-num">{done ? "✓" : n}</span>
        <h2>{title}</h2>
      </header>
      <div className="step-body">{children}</div>
    </section>
  );
}

function Legend({ showLot, showSetback, showFootprint, isValid }) {
  if (!showLot && !showSetback && !showFootprint) return null;
  return (
    <div className="legend">
      <h4>Legend</h4>
      {showLot && (
        <div className="legend-row">
          <span className="swatch swatch-lot" /> Lot boundary
        </div>
      )}
      {showSetback && (
        <div className="legend-row">
          <span className="swatch swatch-setback" /> Buildable area (setbacks)
        </div>
      )}
      {showFootprint && (
        <div className="legend-row">
          <span
            className={`swatch ${isValid ? "swatch-valid" : "swatch-invalid"}`}
          />{" "}
          ADU footprint
        </div>
      )}
    </div>
  );
}
