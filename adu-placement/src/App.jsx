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
import ExportDialog from "./components/ExportDialog";
import ConfidenceMeter from "./components/ConfidenceMeter";
import {
  makeRectangle,
  applySetbacksToRect,
  clampFootprintToSetbacks,
  footprintFitMargin,
} from "./lib/geometry";
import { getFloorPlanById } from "./lib/floorPlans";
import "./App.css";

const DEFAULT_LOT = { width: 60, length: 100, rotation: 0, center: null };
const DEFAULT_SETBACKS = { front: 5, back: 5, left: 5, right: 5 };
const SESSION_KEY = "frameupnow-session-v1";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  // Restore the last session on first mount. The initializer runs synchronously
  // so all state slots get their saved values before the first render.
  const [_session] = useState(loadSession);

  const [location, setLocation] = useState(_session?.location ?? null);
  const [lot, setLot] = useState(_session?.lot ?? DEFAULT_LOT);
  const [lotConfirmed, setLotConfirmed] = useState(_session?.lotConfirmed ?? false);
  const [floorPlan, setFloorPlan] = useState(() => {
    if (!_session?.floorPlanId) return null;
    return getFloorPlanById(_session.floorPlanId) ?? null;
  });
  const [footprint, setFootprint] = useState(_session?.footprint ?? null);
  const [setbacks, setSetbacks] = useState(_session?.setbacks ?? DEFAULT_SETBACKS);
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
  // Increments every time a plan card is clicked — even if it's the same
  // plan. This guarantees the auto-zoom effect re-fires (otherwise React
  // bails on setFloorPlan(samePlan) and the user wouldn't see the zoom).
  const [placementId, setPlacementId] = useState(0);
  // Which CameraActions pill is currently "active" (green). Acts like a
  // segmented control — the highlight moves to whichever button was
  // clicked most recently.
  const [activeCamAction, setActiveCamAction] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const mapWrapperRef = useRef(null);

  // Track fullscreen state (browser may exit on Esc)
  useEffect(() => {
    function handleFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Auto-zoom + pulse + drag-hint every time the user clicks a floor plan
  // card. We key off `placementId` (which always increments) instead of
  // `floorPlan.id` so the zoom fires reliably even on a same-plan re-click.
  // Dragging changes `footprint` but NOT `placementId`, so drags don't
  // re-trigger the camera fly-in.
  useEffect(() => {
    if (placementId === 0) return;
    if (!floorPlan?.id) return;

    const flyTimer = setTimeout(() => {
      mapRef.current?.flyToFootprint(60);
    }, 240);
    setActiveCamAction("home"); // camera is now framing the home

    setPulseHome(true);
    const pulseTimer = setTimeout(() => setPulseHome(false), 1800);

    setShowPlacementHint(true);
    const hintTimer = setTimeout(() => setShowPlacementHint(false), 5500);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(pulseTimer);
      clearTimeout(hintTimer);
    };
  }, [placementId]);

  // Single handler for the bottom camera pill bar — moves the camera
  // AND moves the green "active" highlight to that button.
  function handleCamAction(id) {
    setActiveCamAction(id);
    if (id === "home") {
      mapRef.current?.flyToFootprint(60);
    } else if (id === "lot") {
      mapRef.current?.fitToLot(80);
    } else if (id === "address" && location) {
      mapRef.current?.flyToLocation(location.lng, location.lat, 19);
    }
  }

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

  // Single source of truth for validity: derive from fitMargin. Tolerance
  // for floating-point noise is applied inside footprintFitMargin itself
  // so every consumer (header badge, plan card, confidence meter) agrees.
  const isValid = useMemo(() => {
    if (fitMargin == null) return true;
    return fitMargin >= 0;
  }, [fitMargin]);

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
      // Clamp the initial placement to the buildable area so the home
      // loads inside the yellow setback line, not just at lot.center
      // (which may be partially outside the buildable area if setbacks
      // are wide or the plan is large).
      let initialCenter = lot.center;
      if (lotConfirmed) {
        const { center } = clampFootprintToSetbacks({
          proposedCenter: lot.center,
          footprintWidth: fp.width,
          footprintDepth: fp.depth,
          footprintRotationDeg: lot.rotation,
          lot,
          setbacks,
        });
        initialCenter = center;
      }
      setFootprint({ center: initialCenter, rotation: lot.rotation });
      // Only warn if the plan literally cannot fit in the buildable area.
      const bW = lot.width - setbacks.left - setbacks.right;
      const bD = lot.length - setbacks.front - setbacks.back;
      if (lotConfirmed && (fp.width > bW || fp.depth > bD)) {
        setAlignFlash({
          kind: "warn",
          text: `This plan (${fp.width}'×${fp.depth}') is larger than your buildable area (${bW}'×${bD}'). Increase lot size or reduce setbacks.`,
        });
        setTimeout(() => setAlignFlash(null), 4500);
      }
    }
    // Always increment so the auto-zoom effect re-fires, even when the
    // user clicks the same card twice.
    setPlacementId((p) => p + 1);
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

  async function handleDownload(options = {}) {
    const ctx = {
      filename: options.filename || "adu-site-plan.png",
      title: options.title || "Site Plan",
      address: options.address ?? location?.placeName ?? "",
      lot,
      setbacks,
      floorPlan,
      footprint,
      fitMargin,
      isValid,
      scale: options.scale ?? 2, // 1 = standard, 2 = high (default), 3 = print
      includeInfoPanel: options.includeInfoPanel ?? true,
      includeScaleBar: options.includeScaleBar ?? true,
      includeNorthArrow: options.includeNorthArrow ?? true,
      includeLegend: options.includeLegend ?? true,
    };
    await mapRef.current?.exportAsPng(ctx);
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
          <StepNavigator
            steps={[
              { n: 1, label: "Address", done: step1Done, active: !step1Done },
              { n: 2, label: "Lot", done: step2Done, active: step1Done && !step2Done, locked: !step1Done },
              { n: 3, label: "Plan", done: !!floorPlan, active: step2Done && !floorPlan, locked: !step2Done },
              { n: 4, label: "Place", done: !!footprint && step3Done, active: !!floorPlan && !footprint, locked: !floorPlan },
              { n: 5, label: "Setbacks", done: step3Done, active: step3Done, locked: !step3Done },
              { n: 6, label: "Export", done: false, active: allReady, locked: !allReady },
            ]}
            onJump={(n) => {
              const el = document.querySelector(`[data-step="${n}"]`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
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
                ? "A printable PNG with the satellite map, your floor plan, and a full info panel — lot, setbacks, plan specs, scale bar, and north arrow."
                : "Complete the previous steps to enable export."}
            </p>
            <DownloadButton
              onDownload={() => setExportDialogOpen(true)}
              disabled={!allReady}
              variant="prominent"
              label="Export Site Plan…"
            />
            {allReady && (
              <ul className="export-perks">
                <li>📐 True-to-scale satellite + plan overlay</li>
                <li>📋 Full info panel (lot · setbacks · plan)</li>
                <li>🧭 North arrow + scale bar</li>
                <li>🖨️ Print-ready resolution</li>
              </ul>
            )}
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
            active={activeCamAction}
            onAction={handleCamAction}
          />

          {allReady && (
            <button
              type="button"
              className="export-fab"
              onClick={() => setExportDialogOpen(true)}
              aria-label="Export site plan"
              title="Export your site plan as PNG"
            >
              <span className="export-fab-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v12" />
                  <path d="M6 12l6 6 6-6" />
                  <path d="M5 21h14" />
                </svg>
              </span>
              <span className="export-fab-body">
                <span className="export-fab-label">Export site plan</span>
                <span className="export-fab-sub">PNG · scale · info panel</span>
              </span>
              <span className="export-fab-shine" aria-hidden="true" />
            </button>
          )}

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

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onDownload={handleDownload}
        defaultAddress={location?.placeName}
        defaultTitle="Site Plan"
        planName={floorPlan?.name}
      />
    </div>
  );
}

function StepNavigator({ steps, onJump }) {
  return (
    <nav className="step-nav" aria-label="Wizard progress">
      {steps.map((s, i) => {
        const cls = [
          "step-nav-dot",
          s.done ? "done" : "",
          s.active ? "active" : "",
          s.locked ? "locked" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={s.n}
            type="button"
            className={cls}
            disabled={s.locked}
            onClick={() => onJump(s.n)}
            title={s.label}
            aria-current={s.active ? "step" : undefined}
          >
            <span className="step-nav-num">{s.done ? "✓" : s.n}</span>
            <span className="step-nav-label">{s.label}</span>
            {i < steps.length - 1 && <span className="step-nav-bar" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
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
  const ref = useRef(null);
  // When this step becomes active, smooth-scroll it into view within
  // the sidebar. Saves the user a long manual scroll on tall screens.
  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }, [active]);
  return (
    <section className={cls} ref={ref} data-step={n}>
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
