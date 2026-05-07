import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import AddressSearch from "./components/AddressSearch";
import LotConfirmation from "./components/LotConfirmation";
import FloorPlanSelector from "./components/FloorPlanSelector";
import FootprintControls from "./components/FootprintControls";
import SetbackInputs from "./components/SetbackInputs";
import MapView from "./components/MapView";
import Compass from "./components/Compass";
import MapControls from "./components/MapControls";
import CameraActions from "./components/CameraActions";
import LotInfoCard from "./components/LotInfoCard";
import ValidationBadge from "./components/ValidationBadge";
import DownloadButton from "./components/DownloadButton";
import ConfidenceMeter from "./components/ConfidenceMeter";
import {
  makeRectangle,
  applySetbacksToRect,
  isFootprintInside,
  clampFootprintToSetbacks,
  footprintFitMargin,
} from "./lib/geometry";
import "./App.css";

const DEFAULT_LOT = { width: 60, length: 100, rotation: 0, center: null };
const DEFAULT_SETBACKS = { front: 5, back: 5, left: 5, right: 5 };

export default function App() {
  const [location, setLocation] = useState(null);
  const [lot, setLot] = useState(DEFAULT_LOT);
  const [lotConfirmed, setLotConfirmed] = useState(false);
  const [floorPlan, setFloorPlan] = useState(null);
  const [footprint, setFootprint] = useState(null); // {center, rotation}
  const [setbacks, setSetbacks] = useState(DEFAULT_SETBACKS);
  const [snapToSetbacks, setSnapToSetbacks] = useState(true);
  const [viewMode, setViewMode] = useState("full"); // "full" | "footprint"
  const [alignBusy, setAlignBusy] = useState(false);
  const [alignFlash, setAlignFlash] = useState(null); // { kind: "ok" | "warn", text }
  const [mapBearing, setMapBearing] = useState(0);
  const [mapStyle, setMapStyle] = useState("satellite");
  const [is3D, setIs3D] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showPlacementHint, setShowPlacementHint] = useState(false);
  const [pulseHome, setPulseHome] = useState(false);
  const mapWrapperRef = useRef(null);
  const lastZoomedPlanRef = useRef(null);

  // Track fullscreen state (browser may exit on Esc)
  useEffect(() => {
    function handleFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Auto-zoom to the floor plan when it's first selected, and trigger the
  // pulse + drag-hint UI flourishes. We track the last-zoomed plan id so
  // that simply dragging the home around doesn't keep re-zooming.
  useEffect(() => {
    if (!floorPlan?.id || !footprint) return;
    if (lastZoomedPlanRef.current === floorPlan.id) return;
    lastZoomedPlanRef.current = floorPlan.id;

    const flyTimer = setTimeout(() => {
      mapRef.current?.flyToFootprint(60);
    }, 240);

    setPulseHome(true);
    const pulseTimer = setTimeout(() => setPulseHome(false), 1800);

    setShowPlacementHint(true);
    const hintTimer = setTimeout(() => setShowPlacementHint(false), 5500);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(pulseTimer);
      clearTimeout(hintTimer);
    };
  }, [floorPlan?.id, footprint]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      mapWrapperRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  const mapRef = useRef(null);

  // ---- Derived geometry ----
  const lotFeature = useMemo(() => {
    if (!lot.center) return null;
    return makeRectangle(lot.center, lot.width, lot.length, lot.rotation);
  }, [lot]);

  const setbackFeature = useMemo(() => {
    if (!lot.center || !lotConfirmed) return null;
    return applySetbacksToRect(
      lot.center,
      lot.width,
      lot.length,
      lot.rotation,
      setbacks
    );
  }, [lot, lotConfirmed, setbacks]);

  const footprintFeature = useMemo(() => {
    if (!footprint || !floorPlan) return null;
    return makeRectangle(
      footprint.center,
      floorPlan.width,
      floorPlan.depth,
      footprint.rotation
    );
  }, [footprint, floorPlan]);

  const isValid = useMemo(() => {
    if (!footprintFeature || !setbackFeature) return true;
    return isFootprintInside(footprintFeature, setbackFeature);
  }, [footprintFeature, setbackFeature]);

  const fitMargin = useMemo(() => {
    if (!footprint || !floorPlan || !lotConfirmed) return null;
    return footprintFitMargin({
      footprintCenter: footprint.center,
      footprintWidth: floorPlan.width,
      footprintDepth: floorPlan.depth,
      footprintRotationDeg: footprint.rotation,
      lot,
      setbacks,
    });
  }, [footprint, floorPlan, lot, setbacks, lotConfirmed]);

  // ---- Step status ----
  const step1Done = !!location;
  const step2Done = !!location && lotConfirmed;
  const step3Done = step2Done && !!floorPlan && !!footprint;
  const allReady = step3Done;

  // ---- Handlers ----
  function handleSelectLocation(loc) {
    setLocation(loc);
    setLot({
      ...DEFAULT_LOT,
      center: [loc.lng, loc.lat],
    });
    setLotConfirmed(false);
    setFloorPlan(null);
    setFootprint(null);
  }

  function handleChangeLotDims(next) {
    setLot((l) => ({ ...l, width: next.width, length: next.length }));
  }

  const handleDragLot = useCallback((newCenter) => {
    setLot((l) => ({ ...l, center: newCenter }));
  }, []);

  function handleRotateLot(delta) {
    setLot((l) => ({ ...l, rotation: (l.rotation + delta) % 360 }));
  }

  function handleResetLotRotation() {
    setLot((l) => ({ ...l, rotation: 0 }));
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
    if (lot.center) {
      setFootprint({ center: lot.center, rotation: lot.rotation });
    }
  }

  // Drag the home. If snap-to-setbacks is on, clamp the position so the
  // axis-aligned bounding box of the rotated home stays inside the buildable
  // area (the dashed yellow line). Per the doc's MVP recommendation.
  const handleDragFootprint = useCallback(
    (newCenter) => {
      setFootprint((f) => {
        if (!f) return f;
        if (!snapToSetbacks || !floorPlan || !lotConfirmed) {
          return { ...f, center: newCenter };
        }
        const { center: clamped } = clampFootprintToSetbacks({
          proposedCenter: newCenter,
          footprintWidth: floorPlan.width,
          footprintDepth: floorPlan.depth,
          footprintRotationDeg: f.rotation,
          lot,
          setbacks,
        });
        return { ...f, center: clamped };
      });
    },
    [snapToSetbacks, floorPlan, lot, setbacks, lotConfirmed]
  );

  function handleRotateFootprint(delta) {
    setFootprint((f) =>
      f ? { ...f, rotation: (f.rotation + delta) % 360 } : f
    );
  }

  // Snap rotation to nearest 0/90/180/270 (per doc).
  function handleSnap90() {
    setFootprint((f) => {
      if (!f) return f;
      const n = ((f.rotation % 360) + 360) % 360;
      const target = [0, 90, 180, 270].reduce((p, c) =>
        Math.abs(n - c) < Math.abs(n - p) ? c : p
      );
      return { ...f, rotation: target };
    });
  }

  // Auto-align to street: query nearest road, set footprint rotation so
  // the home's depth-axis is perpendicular to the street (front door faces
  // the road), then snap to the nearest 90°.
  //
  // Why target = 90 - bearing:
  //   • compass bearing measures the road's direction (0=N, 90=E, CW)
  //   • the home's width-axis runs E-W when rotation=0 (CCW rotation convention)
  //   • for the home to be parallel to the road, width must align to road bearing
  //   • the conversion between the two conventions is: θ = 90 - bearing
  async function handleAlignStreet() {
    if (!footprint?.center || !mapRef.current) return;
    setAlignBusy(true);
    setAlignFlash(null);
    try {
      const bearing = mapRef.current.getStreetBearing(footprint.center);
      if (bearing == null) {
        setAlignFlash({ kind: "warn", text: "No street found nearby — zoom out a touch and try again." });
        setTimeout(() => setAlignFlash(null), 3200);
        return;
      }
      const target = 90 - bearing;
      const angles = [0, 90, 180, 270];
      const snap = angles.reduce((p, c) => {
        const dp = Math.abs(((p - target + 540) % 360) - 180);
        const dc = Math.abs(((c - target + 540) % 360) - 180);
        return dc < dp ? c : p;
      }, 0);
      const norm = ((snap % 360) + 360) % 360;
      setFootprint((f) => (f ? { ...f, rotation: norm } : f));
      setAlignFlash({ kind: "ok", text: `Aligned to street · ${Math.round(((bearing % 360) + 360) % 360)}°` });
      setTimeout(() => setAlignFlash(null), 2400);
    } finally {
      setAlignBusy(false);
    }
  }

  function handleResetFootprint() {
    if (lot.center) {
      setFootprint({ center: lot.center, rotation: lot.rotation });
    }
  }

  async function handleDownload() {
    await mapRef.current?.exportAsPng("adu-site-plan.png");
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <path
                d="M4 16 L16 6 L28 16 L28 26 L20 26 L20 18 L12 18 L12 26 L4 26 Z"
                fill="white"
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="brand-text">
            <h1>FrameUpNow</h1>
            <span className="brand-sub">
              Place your ADU. See it on your land. Make it real.
            </span>
          </div>
        </div>
        <div className="header-meta">
          {floorPlan && (
            <div className="header-plan-pill">
              <span className="hpp-series">{floorPlan.series}</span>
              <span className="hpp-name">{floorPlan.name}</span>
              <span className="hpp-sep">·</span>
              <span className="hpp-sqft">{floorPlan.sqft} sf</span>
            </div>
          )}
          {footprintFeature && setbackFeature && (
            <ValidationBadge isValid={isValid} />
          )}
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <Step n={1} title="Find your address" done={step1Done} active={!step1Done}>
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

          <Step
            n={2}
            title="Position & confirm your lot"
            done={step2Done}
            active={step1Done && !step2Done}
            locked={!step1Done}
          >
            <LotConfirmation
              lot={lot}
              onChangeDims={handleChangeLotDims}
              onRotate={handleRotateLot}
              onResetRotation={handleResetLotRotation}
              confirmed={lotConfirmed}
              onConfirm={handleConfirmLot}
              onReset={handleEditLot}
            />
          </Step>

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

          <Step
            n={4}
            title="Place & rotate your home"
            done={!!footprint && step3Done}
            active={!!floorPlan}
            locked={!floorPlan}
          >
            {footprint && (
              <>
                <FootprintControls
                  rotation={footprint.rotation}
                  onRotate={handleRotateFootprint}
                  onReset={handleResetFootprint}
                  onSnap90={handleSnap90}
                  onAlignStreet={handleAlignStreet}
                  alignBusy={alignBusy}
                  snapToSetbacks={snapToSetbacks}
                  onToggleSnap={() => setSnapToSetbacks((v) => !v)}
                />
                <ConfidenceMeter marginFt={fitMargin} />
              </>
            )}
          </Step>

          <Step
            n={5}
            title="Set setbacks"
            done={step3Done}
            active={step3Done}
            locked={!step3Done}
          >
            <SetbackInputs setbacks={setbacks} onChange={setSetbacks} />
          </Step>

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

        <main className="map-wrapper" ref={mapWrapperRef}>
          <MapView
            ref={mapRef}
            location={location}
            lotFeature={lotFeature}
            lotConfirmed={lotConfirmed}
            setbackFeature={setbackFeature}
            footprintFeature={footprintFeature}
            floorPlan={floorPlan}
            isValid={isValid}
            viewMode={viewMode}
            mapStyle={mapStyle}
            is3D={is3D}
            onDragLot={handleDragLot}
            onDragFootprint={handleDragFootprint}
            onBearingChange={setMapBearing}
          />
          {!location && <Hero />}

          <MapControls
            is3D={is3D}
            onToggle3D={() => setIs3D((v) => !v)}
            mapStyle={mapStyle}
            onChangeStyle={setMapStyle}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onFullscreen={toggleFullscreen}
            fullscreenActive={fullscreen}
          />

          <Compass
            bearing={mapBearing}
            onResetNorth={() => mapRef.current?.resetNorth()}
          />

          {floorPlan && footprintFeature && (
            <ViewToggle value={viewMode} onChange={setViewMode} />
          )}

          {lot.center && lotConfirmed && (
            <LotInfoCard lot={lot} setbacks={setbacks} floorPlan={floorPlan} />
          )}

          <Legend
            showLot={!!lotFeature}
            showSetback={!!setbackFeature}
            showFootprint={!!footprintFeature}
            isValid={isValid}
          />

          {floorPlan && footprintFeature && (
            <PlanFloatCard plan={floorPlan} valid={isValid} margin={fitMargin} />
          )}

          <CameraActions
            hasFootprint={!!footprintFeature}
            hasLot={!!lotFeature}
            hasLocation={!!location}
            onFrameHome={() => mapRef.current?.flyToFootprint(60)}
            onFrameLot={() => mapRef.current?.fitToLot(80)}
            onRecenterAddress={() =>
              location && mapRef.current?.flyToLocation(location.lng, location.lat, 19)
            }
          />

          {pulseHome && footprintFeature && (
            <div className="home-pulse" aria-hidden="true">
              <span />
              <span />
            </div>
          )}

          {showPlacementHint && footprintFeature && (
            <div className="placement-hint" role="status">
              <span className="placement-hint-icon">✋</span>
              <span><b>Drag the home</b> to position it on your lot — it stays inside the dashed setback line.</span>
              <button
                type="button"
                className="placement-hint-close"
                onClick={() => setShowPlacementHint(false)}
                aria-label="Dismiss tip"
              >
                ✕
              </button>
            </div>
          )}

          {alignFlash && (
            <div className={`align-flash align-flash-${alignFlash.kind}`} role="status">
              <span className="align-flash-icon">
                {alignFlash.kind === "ok" ? "🧭" : "⚠️"}
              </span>
              <span>{alignFlash.text}</span>
            </div>
          )}
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

function Hero() {
  return (
    <div className="hero">
      <div className="hero-card">
        <span className="hero-eyebrow">DESIGN. PLACE. BUILD.</span>
        <h2 className="hero-title">
          See your future ADU on your land — <em>before</em> the first board is cut.
        </h2>
        <p className="hero-sub">
          Drop in your address, drag the floor plan, and watch the rooms, decks
          and front door fall into place — exactly where the sun rises and the
          street meets your driveway.
        </p>
        <div className="hero-row">
          <Bullet>Real floor plans, not boxes</Bullet>
          <Bullet>Setback-aware placement</Bullet>
          <Bullet>Export a shareable site plan</Bullet>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <span className="hero-bullet">
      <span className="hero-bullet-dot" />
      {children}
    </span>
  );
}

function ViewToggle({ value, onChange }) {
  return (
    <div className="view-toggle" role="tablist" aria-label="View mode">
      <button
        type="button"
        role="tab"
        aria-selected={value === "full"}
        className={value === "full" ? "active" : ""}
        onClick={() => onChange("full")}
      >
        Full floor plan
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "footprint"}
        className={value === "footprint" ? "active" : ""}
        onClick={() => onChange("footprint")}
      >
        Footprint only
      </button>
    </div>
  );
}

function PlanFloatCard({ plan, valid, margin }) {
  const fitText =
    margin == null
      ? null
      : margin < 0
      ? `Outside setback by ${Math.abs(margin).toFixed(1)} ft`
      : margin < 1
      ? `Tight fit · ${margin.toFixed(1)} ft clearance`
      : `Great placement · ${margin.toFixed(1)} ft clearance`;
  return (
    <div className={`plan-float ${valid ? "" : "invalid"}`}>
      <div className="plan-float-head">
        <span className="plan-float-series">{plan.series}</span>
        <h4>{plan.name}</h4>
      </div>
      <div className="plan-float-stats">
        <Stat value={plan.keySpecs.livableSqft} label="sq ft" />
        <Stat value={plan.keySpecs.bedrooms} label="bed" />
        <Stat value={plan.keySpecs.bathrooms} label="bath" />
        <Stat value={`${plan.width}'×${plan.depth}'`} label="size" />
      </div>
      {fitText && (
        <div className={`plan-float-fit ${valid ? "ok" : "bad"}`}>
          {fitText}
        </div>
      )}
      {!valid && (
        <div className="plan-float-warn">
          ⚠ Outside buildable area — drag inside the dashed yellow setback line.
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="plan-float-stat">
      <span className="pfs-value">{value}</span>
      <span className="pfs-label">{label}</span>
    </div>
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
          Your home
        </div>
      )}
    </div>
  );
}
