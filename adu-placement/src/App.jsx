import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import AddressSearch from "./components/AddressSearch";
import LotConfirmation from "./components/LotConfirmation";
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
import AuthModal from "./components/AuthModal";
import SaveProjectButton from "./components/SaveProjectButton";
import MyProjects from "./components/MyProjects";
import FloorPlanModal from "./components/FloorPlanModal";
import BuildReadyForm from "./components/BuildReadyForm";
import AdminPanel from "./components/AdminPanel";
import {
  makeRectangle,
  applySetbacksToRect,
  clampFootprintToSetbacks,
  footprintFitMargin,
} from "./lib/geometry";
import { usePlansCatalog } from "./lib/plansCatalog";
import { fetchPlanById } from "./lib/baserow";
import { useAuth } from "./lib/auth";
import "./App.css";

const DEFAULT_LOT = { width: 60, length: 100, rotation: 0, center: null };
const DEFAULT_SETBACKS = { front: 5, back: 5, left: 5, right: 5 };
const SESSION_KEY = "frameupnow-session-v1";

// Gate for Step auto-scroll. Stays false for a short window after the app
// mounts so a restored session — whose active step flickers while the plan
// catalog loads — doesn't yank the sidebar to a different step on load.
let autoScrollReady = false;

// Pick the furthest-along step to resume on after a reload.
function stepFromSession(s) {
  if (!s) return 1;
  if (s.footprint && s.floorPlanId && s.lotConfirmed && s.location) return 5; // Export
  if (s.floorPlanId) return 4; // Place
  if (s.lotConfirmed) return 3; // Plan
  if (s.location) return 2;     // Lot
  return 1;                     // Address
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  // ---- Catalog (Firestore-backed) ----
  const { plans, loading: plansLoading, getById: getPlanById } = usePlansCatalog();

  // ---- Auth ----
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  // ---- Session restore ----
  // Restore the last session on first mount. The initializer runs synchronously
  // so all state slots get their saved values before the first render.
  const [_session] = useState(loadSession);

  // A deep link (?plan=) means the customer is placing a NEW plan. Detect it
  // synchronously so we DON'T restore the previous session's plan/footprint —
  // that's what made the old plan flash under the new one. We still keep the
  // saved address/lot so the new plan can drop straight onto it.
  const _deepLinkPlanId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("plan")
      : null;

  const [location, setLocation] = useState(_session?.location ?? null);
  const [lot, setLot] = useState(_session?.lot ?? DEFAULT_LOT);
  const [lotConfirmed, setLotConfirmed] = useState(_session?.lotConfirmed ?? false);
  // floorPlan starts null; restored by effect once catalog is ready
  // Restore the full plan object straight from the session snapshot so the
  // placed home survives a reload even before the catalog finishes loading.
  // But on a deep link, start empty so the OLD plan never renders.
  const [floorPlan, setFloorPlan] = useState(_deepLinkPlanId ? null : (_session?.floorPlanSnapshot ?? null));
  const [footprint, setFootprint] = useState(_deepLinkPlanId ? null : (_session?.footprint ?? null));
  const [setbacks, setSetbacks] = useState(_session?.setbacks ?? DEFAULT_SETBACKS);
  const [snapToSetbacks, setSnapToSetbacks] = useState(false);
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
  // Build-Ready ADU Placement Request — required before export is unlocked.
  const [buildFormOpen, setBuildFormOpen] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(_session?.leadSubmitted ?? false);
  const [mapReady, setMapReady] = useState(false);
  const mapWrapperRef = useRef(null);
  // True only for the first render if a previous session was restored.
  const restoringRef = useRef(!!_session?.location);
  const didRestoreCameraRef = useRef(false);

  // ---- One-step-at-a-time wizard ----
  // On a deep link, don't jump to the old session's furthest step (its plan is
  // gone). Start at Lot if we have a saved address, else Address; the deep-link
  // effect advances to Place once the new plan drops.
  const [currentStep, setCurrentStep] = useState(() =>
    _deepLinkPlanId ? (_session?.location ? 2 : 1) : stepFromSession(_session)
  );
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // ---- Mobile bottom-sheet (wizard over full-screen map) ----
  // Desktop: always open. Phones: collapsed on a fresh landing (so the world
  // map + hero are the focus), but open when resuming a saved session.
  const [sheetOpen, setSheetOpen] = useState(() => {
    const mobile = typeof window !== "undefined" && window.innerWidth <= 820;
    if (!mobile) return true;
    return stepFromSession(_session) > 1; // open only if resuming past step 1
  });
  // After the first render, open the sheet on every step change so the user
  // sees that step's controls — except the "Place" step, where we collapse it
  // so the map is fully free for dragging the home.
  const firstStepRunRef = useRef(true);
  useEffect(() => {
    if (firstStepRunRef.current) { firstStepRunRef.current = false; return; }
    setSheetOpen(currentStep !== 4);
  }, [currentStep]);

  // ---- Admin panel (opened via #admin) ----
  const [adminMode, setAdminMode] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#admin"
  );
  useEffect(() => {
    const onHash = () => setAdminMode(window.location.hash === "#admin");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // ---- Theme (dark = night mode, light = original look) ----
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("frameupnow-theme") || "dark"; }
    catch { return "dark"; }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("frameupnow-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  // Track fullscreen state (browser may exit on Esc)
  useEffect(() => {
    function handleFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Enable Step auto-scroll only after the initial restore settles, so the
  // sidebar doesn't jump while async state (plan catalog) resolves on load.
  useEffect(() => {
    autoScrollReady = false;
    const t = setTimeout(() => { autoScrollReady = true; }, 1600);
    return () => clearTimeout(t);
  }, []);

  // Persist session to localStorage whenever relevant state changes.
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        location,
        lot,
        lotConfirmed,
        setbacks,
        floorPlanId: floorPlan?.id ?? null,
        floorPlanSnapshot: floorPlan, // full plan so reload restores instantly
        footprint,
        leadSubmitted,
      }));
    } catch {
      // localStorage unavailable (private browsing quota, etc.) — silently skip
    }
  }, [location, lot, lotConfirmed, setbacks, floorPlan, footprint, leadSubmitted]);

  // Restore floor plan from session once the catalog finishes loading (fallback
  // for old sessions without a snapshot). `allowRestoreRef` cancels this if the
  // user starts fresh / changes address BEFORE the catalog finished loading —
  // otherwise the late-arriving catalog would resurrect the cleared plan.
  const allowRestoreRef = useRef(!!_session?.floorPlanId);
  useEffect(() => {
    if (!allowRestoreRef.current || plansLoading) return;
    allowRestoreRef.current = false; // attempt at most once, after catalog is ready
    if (floorPlan || !_session?.floorPlanId) return;
    const found = getPlanById(_session.floorPlanId);
    if (found) setFloorPlan(found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plansLoading]);

  // ---- Deep link from aduplans.com ("Place on my lot") ----
  // The website button opens the tool at  ?plan=<PlanID> . We fetch that plan
  // straight from Baserow and pre-select it so it places to scale once the
  // customer enters their address. deepLinkPlanRef tells handleSelectLocation
  // to KEEP this plan (instead of clearing it) when an address is chosen.
  const deepLinkPlanRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get("plan");
    if (!planId) return;
    allowRestoreRef.current = false; // a deep link wins over an old session plan

    // Route a cross-origin image (Baserow S3 has no CORS on GET) through our
    // same-origin proxy so Mapbox can use it as a floor-plan overlay texture.
    const proxyImg = (u) =>
      u && /^https?:\/\//.test(u) ? `/api/img?url=${encodeURIComponent(u)}` : u;

    // Apply a plan object and, if a lot is already positioned, drop it on.
    const applyPlan = (plan) => {
      if (!plan) return;
      deepLinkPlanRef.current = true;
      setFloorPlan({ ...plan, image: proxyImg(plan.image) });
      if (_session?.lot?.center) {
        setFootprint({ center: _session.lot.center, rotation: _session.lot.rotation || 0 });
        setPlacementId((p) => p + 1);
        setCurrentStep(4); // new plan dropped onto the saved lot → Place step
      }
    };

    // Preferred: the website passes the plan's data in the URL — no fetch needed.
    const w = parseFloat(params.get("w"));
    const d = parseFloat(params.get("d"));
    const img = params.get("img");
    if (w && d && img) {
      const sqft = parseInt(params.get("sqft"), 10) || Math.round(w * d);
      applyPlan({
        id: planId,
        series: params.get("series") || "ADU Plan",
        name: params.get("name") || `Plan ${planId}`,
        tagline: `${sqft.toLocaleString()} sq ft`,
        width: w,
        depth: d,
        sqft,
        image: img,
        keySpecs: {
          livableSqft: sqft, bedrooms: "See plan", bathrooms: "See plan",
          floors: 1, garage: 0, studs: "See plan",
        },
        source: "url",
      });
      return;
    }

    // Fallback: fetch the plan from Baserow by its ID.
    let cancelled = false;
    fetchPlanById(planId)
      .then((plan) => { if (!cancelled) applyPlan(plan); })
      .catch((e) => console.warn("[FrameUpNow] deep-link plan fetch failed:", e.message));
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When setbacks change AND snap-to-setbacks is on, re-clamp the footprint
  // so it never ends up outside the new buildable area without a drag.
  useEffect(() => {
    if (!snapToSetbacks || !footprint || !floorPlan || !lotConfirmed) return;
    setFootprint((f) => {
      if (!f) return f;
      const { center } = clampFootprintToSetbacks({
        proposedCenter: f.center,
        footprintWidth: floorPlan.width,
        footprintDepth: floorPlan.depth,
        footprintRotationDeg: f.rotation,
        lot,
        setbacks,
      });
      return { ...f, center };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setbacks]);

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

  // One-shot camera restore: when reloading mid-session, frame whatever the
  // user was last working on (footprint → lot → address) instead of snapping
  // to the raw address at zoom 19. Waits for the map to be ready AND, if the
  // session had a saved plan, for that plan to finish loading from Firestore
  // (so the footprint geometry exists before we frame it).
  useEffect(() => {
    if (didRestoreCameraRef.current) return;
    if (!mapReady || !restoringRef.current) return;
    // If the saved session referenced a plan, wait for it to load.
    if (_session?.floorPlanId && !floorPlan) return;

    didRestoreCameraRef.current = true;
    restoringRef.current = false;

    // Small delay lets the footprint/lot sources sync to the map first.
    const t = setTimeout(() => {
      if (footprint && floorPlan) {
        mapRef.current?.flyToFootprint(70);
      } else if (lotConfirmed && lot.center) {
        mapRef.current?.fitToLot(80);
      } else if (location) {
        mapRef.current?.flyToLocation(location.lng, location.lat, 19);
      }
    }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, floorPlan, plansLoading]);

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

  // Three-state fit for the map's neon placement indicator.
  const fitState = useMemo(() => {
    if (fitMargin == null) return "great";
    if (fitMargin < 0) return "bad";
    if (fitMargin < 1) return "tight";
    return "great";
  }, [fitMargin]);

  // ---- Step status ----
  const step1Done = !!location;
  const step2Done = !!location && lotConfirmed;
  const step3Done = step2Done && !!floorPlan && !!footprint;
  const allReady = step3Done;

  // Furthest step the user is allowed to jump to (gates on completion).
  let maxStep = 1;
  if (step1Done) maxStep = 2;
  if (step2Done) maxStep = 3;
  if (floorPlan) maxStep = 4;
  if (footprint && step3Done) maxStep = 5;

  // Can the Next button advance from the current step?
  const canProceed =
    (currentStep === 1 && !!location) ||
    (currentStep === 2 && lotConfirmed) ||
    (currentStep === 3 && !!floorPlan) ||
    (currentStep === 4 && !!footprint);
    // Step 5 (Export) is the final step — no "Next".

  const goNext = useCallback(
    () => setCurrentStep((s) => Math.min(6, s + 1)),
    []
  );
  const goBack = useCallback(
    () => setCurrentStep((s) => Math.max(1, s - 1)),
    []
  );
  const jumpStep = useCallback(
    (n) => setCurrentStep((s) => (n <= maxStepRef.current ? n : s)),
    []
  );
  // Keep a ref so jumpStep doesn't need maxStep in its dep array.
  const maxStepRef = useRef(maxStep);
  maxStepRef.current = maxStep;

  // ---- Handlers ----
  function handleSelectLocation(loc) {
    allowRestoreRef.current = false; // user picked a new address — don't restore old plan
    const center = [loc.lng, loc.lat];
    setLocation(loc);
    setLot({
      ...DEFAULT_LOT,
      center,
    });
    setLotConfirmed(false);
    setCurrentProjectId(null);
    // A plan deep-linked from aduplans.com (?plan=) is kept and dropped onto the
    // new lot so the customer immediately sees their chosen home placed. A normal
    // address change instead clears the plan to start that step fresh.
    if (deepLinkPlanRef.current && floorPlan) {
      setFootprint({ center, rotation: 0 });
      setPlacementId((p) => p + 1);
    } else {
      setFloorPlan(null);
      setFootprint(null);
    }
    setCurrentStep(2); // advance to "position your lot"
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
    setCurrentStep(3); // advance to "pick a floor plan"
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
    setPlanModalOpen(false);     // close the gallery
    setCurrentStep(4);           // advance to "place & rotate"
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
    if (!lot.center) return;
    let initialCenter = lot.center;
    if (lotConfirmed && floorPlan) {
      const { center } = clampFootprintToSetbacks({
        proposedCenter: lot.center,
        footprintWidth: floorPlan.width,
        footprintDepth: floorPlan.depth,
        footprintRotationDeg: lot.rotation,
        lot,
        setbacks,
      });
      initialCenter = center;
    }
    setFootprint({ center: initialCenter, rotation: lot.rotation });
  }

  // Wipe the current session and start a brand-new plan from step 1.
  function handleStartFresh() {
    const ok = window.confirm(
      "Start a fresh plan? This clears your current address, lot, floor plan and placement."
    );
    if (!ok) return;
    allowRestoreRef.current = false; // cancel any pending session restore
    deepLinkPlanRef.current = false; // forget the ?plan deep link
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setLocation(null);
    setLot(DEFAULT_LOT);
    setLotConfirmed(false);
    setFloorPlan(null);
    setFootprint(null);
    setSetbacks(DEFAULT_SETBACKS);
    setSnapToSetbacks(false);
    setCurrentProjectId(null);
    setPlanModalOpen(false);
    setExportDialogOpen(false);
    setBuildFormOpen(false);
    setLeadSubmitted(false);
    setProjectsOpen(false);
    setCurrentStep(1);
    // Zoom the map back out to the whole-world landing view.
    mapRef.current?.flyToWorld();
  }

  // Both Export AND Save Project are gated behind the Build-Ready request form
  // (per Kolleen's spec). The customer may sign in any time, but cannot print,
  // download, OR save a project until the form is submitted. We remember which
  // action triggered the form so we can resume it once they submit.
  const pendingActionRef = useRef(null);
  function requestExport() {
    if (leadSubmitted) { setExportDialogOpen(true); return; }
    pendingActionRef.current = "export";
    setBuildFormOpen(true);
  }
  function requestSaveForm() {
    pendingActionRef.current = "save";
    setBuildFormOpen(true);
  }
  function handleLeadSubmitted() {
    setLeadSubmitted(true);
    setBuildFormOpen(false);
    if (pendingActionRef.current === "export") setExportDialogOpen(true);
    // For "save", we simply unlock — the now-active Save button is right there.
    pendingActionRef.current = null;
  }
  const leadContext = {
    planId: floorPlan?.id ?? null,
    planName: floorPlan?.name ?? null,
    planSeries: floorPlan?.series ?? null,
    planSqft: floorPlan?.sqft ?? null,
    address: location?.placeName ?? null,
    coordinates: location ? { lng: location.lng, lat: location.lat } : null,
    lot: { width: lot.width, length: lot.length, rotation: lot.rotation },
    setbacks,
  };
  // County/State captured from the chosen address — used to pre-fill the form.
  const leadPrefill = { county: location?.county || "", state: location?.state || "" };

  // Restore all wizard state from a saved Firestore project.
  function handleLoadProject(project) {
    if (project.location)    setLocation(project.location);
    if (project.lot)         setLot(project.lot);
    if (project.lotConfirmed != null) setLotConfirmed(project.lotConfirmed);
    if (project.setbacks)    setSetbacks(project.setbacks);
    if (project.footprint)   setFootprint(project.footprint);
    if (project.floorPlanId) {
      const found = getPlanById(project.floorPlanId);
      if (found) setFloorPlan(found);
    }
    setCurrentProjectId(project.id);
    setCurrentStep(stepFromSession({
      location: project.location,
      lotConfirmed: project.lotConfirmed,
      floorPlanId: project.floorPlanId,
      footprint: project.footprint,
    }));
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

  // The admin dashboard takes over the whole screen when opened via #admin.
  if (adminMode) {
    return <AdminPanel onExit={() => { window.location.hash = ""; setAdminMode(false); }} />;
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
        {(floorPlan || (footprintFeature && setbackFeature)) && (
          <div className="header-context">
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
        )}

        <div className="header-controls">
          {(location || floorPlan) && (
            <button
              type="button"
              className="header-icon-btn"
              onClick={handleStartFresh}
              title="Start a fresh plan"
              aria-label="Start over"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
          {user ? (
            <button
              type="button"
              className="header-user-btn"
              onClick={() => setProjectsOpen(true)}
              title="My saved projects"
            >
              <span className="header-avatar">
                {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
              </span>
              <span className="header-user-label">Projects</span>
            </button>
          ) : (
            <button
              type="button"
              className="header-signin-btn"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="app-body" data-sheet={sheetOpen ? "open" : "collapsed"}>
        <aside className={`sidebar ${sheetOpen ? "sheet-open" : "sheet-collapsed"}`}>
          <button
            type="button"
            className="sheet-handle"
            onClick={() => setSheetOpen((v) => !v)}
            aria-label={sheetOpen ? "Collapse panel" : "Expand panel"}
          >
            <span className="sheet-grabber" />
            <span className="sheet-handle-hint">
              {sheetOpen ? "▾ Tap to see the map" : "▴ Step " + currentStep + " · tap to open"}
            </span>
          </button>
          <WizardStepper
            steps={[
              { n: 1, label: "Address", done: step1Done },
              { n: 2, label: "Lot", done: step2Done },
              { n: 3, label: "Plan", done: !!floorPlan },
              { n: 4, label: "Place", done: !!footprint && step3Done },
              { n: 5, label: "Export", done: false },
            ]}
            current={currentStep}
            maxStep={maxStep}
            onJump={jumpStep}
          />

          <div className="wizard-panel">
            {currentStep === 1 && (
              <StepPanel
                n={1}
                title="Find your address"
                subtitle="Search for your property to drop it on the map."
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
              </StepPanel>
            )}

            {currentStep === 2 && (
              <StepPanel
                n={2}
                title="Position your lot"
                subtitle="Drag the blue rectangle on the map, set dimensions, then confirm."
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
              </StepPanel>
            )}

            {currentStep === 3 && (
              <StepPanel
                n={3}
                title="Pick a floor plan"
                subtitle="Browse the catalog and choose a home to place."
              >
                <PlanTrigger
                  plan={floorPlan}
                  onOpen={() => setPlanModalOpen(true)}
                />
              </StepPanel>
            )}

            {currentStep === 4 && (
              <StepPanel
                n={4}
                title="Place your home"
                subtitle="Drag the home on the map to position it inside the buildable area."
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

                    {/* Setbacks are pre-set to 5 ft (covers almost all of the
                        USA). Only shown if the customer needs to adjust them. */}
                    <details className="setbacks-settings">
                      <summary>
                        <span className="ss-gear" aria-hidden="true">⚙</span>
                        Adjust setbacks
                        <span className="ss-optional">optional · default 5 ft</span>
                      </summary>
                      <p className="setbacks-note">
                        Most ADUs can be placed with side and rear setbacks of approximately
                        4–5 ft, but local zoning requirements vary. We've set a default of
                        <strong> 5 ft for the rear and either side</strong> — only change this
                        if your jurisdiction requires it.
                      </p>
                      <SetbackInputs setbacks={setbacks} onChange={setSetbacks} />
                    </details>
                  </>
                )}
              </StepPanel>
            )}

            {currentStep === 5 && (
              <StepPanel
                n={5}
                title="Export your site plan"
                subtitle="A print-ready PNG with map, plan, info panel, scale bar & north arrow."
              >
                {allReady && !leadSubmitted && (
                  <div className="export-gate">
                    <div className="export-gate-icon" aria-hidden="true">🔒</div>
                    <div className="export-gate-body">
                      <strong>One quick step before your site plan</strong>
                      <p>Complete the short Build-Ready ADU Placement Request and your site plan unlocks instantly for download &amp; print.</p>
                    </div>
                  </div>
                )}

                {allReady && leadSubmitted && (
                  <div className="export-unlocked">
                    ✓ Request submitted — your site plan is unlocked.
                  </div>
                )}

                <DownloadButton
                  onDownload={requestExport}
                  disabled={!allReady}
                  variant="prominent"
                  label={leadSubmitted ? "Export Site Plan…" : "Continue to request form…"}
                />
                <SaveProjectButton
                  disabled={!allReady}
                  formLocked={!leadSubmitted}
                  onRequireForm={requestSaveForm}
                  sessionData={{
                    location, lot, lotConfirmed, setbacks,
                    floorPlanId: floorPlan?.id ?? null, footprint,
                  }}
                  currentProjectId={currentProjectId}
                  onRequestSignIn={() => setAuthModalOpen(true)}
                  onSaved={(id) => setCurrentProjectId(id)}
                />
                {allReady && (
                  <ul className="export-perks">
                    <li>📐 True-to-scale satellite + plan overlay</li>
                    <li>📋 Full info panel (lot · setbacks · plan)</li>
                    <li>🧭 North arrow + scale bar</li>
                    <li>🖨️ Print-ready resolution</li>
                  </ul>
                )}
              </StepPanel>
            )}
          </div>

          <WizardNav
            current={currentStep}
            canProceed={canProceed}
            onBack={goBack}
            onNext={goNext}
          />
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
            fitState={fitState}
            viewMode={viewMode}
            mapStyle={mapStyle}
            is3D={is3D}
            onDragLot={handleDragLot}
            onDragFootprint={handleDragFootprint}
            onBearingChange={setMapBearing}
            onReady={() => setMapReady(true)}
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
              onClick={requestExport}
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

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      <MyProjects
        open={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        onLoad={handleLoadProject}
      />

      <FloorPlanModal
        open={planModalOpen}
        value={floorPlan}
        onClose={() => setPlanModalOpen(false)}
        onSelect={handleSelectFloorPlan}
      />

      <BuildReadyForm
        open={buildFormOpen}
        onClose={() => setBuildFormOpen(false)}
        onSubmitted={handleLeadSubmitted}
        context={leadContext}
        prefill={leadPrefill}
      />
    </div>
  );
}

function WizardStepper({ steps, current, maxStep, onJump }) {
  return (
    <nav className="wstepper" aria-label="Wizard progress">
      {steps.map((s, i) => {
        const reachable = s.n <= maxStep;
        const isCurrent = s.n === current;
        const cls = [
          "wstep-dot",
          s.done ? "done" : "",
          isCurrent ? "current" : "",
          !reachable ? "locked" : "",
        ].filter(Boolean).join(" ");
        return (
          <button
            key={s.n}
            type="button"
            className={cls}
            disabled={!reachable}
            onClick={() => onJump(s.n)}
            title={s.label}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className="wstep-num">{s.done && !isCurrent ? "✓" : s.n}</span>
            <span className="wstep-label">{s.label}</span>
            {i < steps.length - 1 && (
              <span className={`wstep-bar ${s.done ? "filled" : ""}`} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function StepPanel({ n, title, subtitle, children }) {
  return (
    <section className="wpanel" data-step={n} key={n}>
      <div className="wpanel-head">
        <span className="wpanel-kicker">Step {n} of 5</span>
        <h2 className="wpanel-title">{title}</h2>
        {subtitle && <p className="wpanel-sub">{subtitle}</p>}
      </div>
      <div className="wpanel-body">{children}</div>
    </section>
  );
}

function WizardNav({ current, canProceed, onBack, onNext }) {
  return (
    <div className="wnav">
      <button
        type="button"
        className="wnav-back"
        onClick={onBack}
        disabled={current === 1}
      >
        ‹ Back
      </button>
      <div className="wnav-progress" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`wnav-pip ${i + 1 <= current ? "on" : ""}`} />
        ))}
      </div>
      {current < 5 ? (
        <button
          type="button"
          className="wnav-next"
          onClick={onNext}
          disabled={!canProceed}
        >
          Next ›
        </button>
      ) : (
        <span className="wnav-done">Final step</span>
      )}
    </div>
  );
}

// Step-3 trigger: opens the full-screen plan gallery, shows the chosen plan.
function PlanTrigger({ plan, onOpen }) {
  return (
    <div className="plan-trigger">
      {plan ? (
        <button type="button" className="plan-trigger-selected" onClick={onOpen}>
          <div className="pts-thumb">
            {plan.image ? (
              <img src={plan.image} alt={plan.name} />
            ) : (
              <span className="pts-thumb-ph">▦</span>
            )}
          </div>
          <div className="pts-info">
            <span className="pts-series">{plan.series}</span>
            <span className="pts-name">{plan.name}</span>
            <span className="pts-meta">
              {plan.sqft} sf · {plan.width}′×{plan.depth}′
            </span>
          </div>
          <span className="pts-change">Change ›</span>
        </button>
      ) : (
        <button type="button" className="plan-trigger-empty" onClick={onOpen}>
          <span className="pte-icon">▦</span>
          <span className="pte-text">
            <b>Browse floor plans</b>
            <span>Filter by jurisdiction, size & more</span>
          </span>
          <span className="pte-arrow">›</span>
        </button>
      )}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to night mode"}
      title={isDark ? "Light mode" : "Night mode"}
    >
      <span className={`theme-toggle-track ${isDark ? "dark" : "light"}`}>
        <span className="theme-toggle-thumb">
          {isDark ? (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}

function Hero() {
  return (
    <div className="hero">
      <div className="hero-card">
        <span className="hero-eyebrow">DESIGN. PLACE. BUILD.</span>
        <h2 className="hero-title">
          See your future ADU on your land — <em>before</em> the frame is erected.
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

function fmtSpec(v) {
  return v === "See plan" || v == null ? "—" : v;
}

function PlanFloatCard({ plan, valid, margin }) {
  const state =
    margin == null ? "great" : margin < 0 ? "bad" : margin < 1 ? "tight" : "great";
  const meta = {
    great: { icon: "✓", cls: "great", head: "Great placement",
             sub: margin == null ? "Looks good" : `${margin.toFixed(1)} ft of clearance` },
    tight: { icon: "!", cls: "tight", head: "Tight fit",
             sub: `${(margin ?? 0).toFixed(1)} ft to the setback line` },
    bad:   { icon: "✕", cls: "bad", head: "Outside buildable area",
             sub: `Over by ${Math.abs(margin ?? 0).toFixed(1)} ft — drag it inside` },
  }[state];

  return (
    <div className={`plan-float fit-${state}`}>
      <div className="plan-float-head">
        <span className="plan-float-series">{plan.series}</span>
        <h4>{plan.name}</h4>
      </div>
      <div className="plan-float-stats">
        <Stat value={plan.keySpecs.livableSqft} label="sq ft" />
        <Stat value={fmtSpec(plan.keySpecs.bedrooms)} label="bed" />
        <Stat value={fmtSpec(plan.keySpecs.bathrooms)} label="bath" />
        <Stat value={`${plan.width}'×${plan.depth}'`} label="size" />
      </div>
      <div className={`fit-badge fit-badge-${meta.cls}`}>
        <span className="fit-badge-icon">{meta.icon}</span>
        <span className="fit-badge-text">
          <b>{meta.head}</b>
          <span>{meta.sub}</span>
        </span>
      </div>
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
