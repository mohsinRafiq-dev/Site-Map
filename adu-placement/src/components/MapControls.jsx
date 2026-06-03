// Custom map control stack pinned to the top-right of the map.
// Style-matched to the FrameUpNow theme (forest green / cream).
// Includes zoom in/out, 3D toggle, fullscreen, and a style switcher dropdown.
import { useState, useEffect, useRef } from "react";

export default function MapControls({
  is3D,
  onToggle3D,
  mapStyle,
  onChangeStyle,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  fullscreenActive,
}) {
  const [styleOpen, setStyleOpen] = useState(false);
  const styleWrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!styleWrapRef.current) return;
      if (!styleWrapRef.current.contains(e.target)) setStyleOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const styles = [
    { id: "satellite", label: "Satellite", Icon: SatelliteIcon },
    { id: "satelliteClean", label: "Satellite (clean)", Icon: GlobeIcon },
    { id: "streets", label: "Streets", Icon: StreetsIcon },
    { id: "outdoors", label: "Terrain", Icon: TerrainIcon },
    { id: "navDay", label: "Navigation", Icon: NavIcon },
    { id: "light", label: "Light", Icon: SunIcon },
    { id: "dark", label: "Dark", Icon: MoonIcon },
  ];

  return (
    <div className="map-controls">
      {/* Style switcher */}
      <div className="map-ctl-group map-ctl-group--menu" ref={styleWrapRef}>
        <button
          type="button"
          className="map-ctl-btn"
          onClick={() => setStyleOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={styleOpen}
          title="Change map style"
        >
          <LayerIcon />
        </button>
        {styleOpen && (
          <ul className="map-style-menu" role="listbox">
            {styles.map((s) => (
              <li
                key={s.id}
                role="option"
                aria-selected={mapStyle === s.id}
                className={mapStyle === s.id ? "active" : ""}
                onClick={() => {
                  onChangeStyle(s.id);
                  setStyleOpen(false);
                }}
              >
                <span className="map-style-ico"><s.Icon /></span>
                <span className="map-style-name">{s.label}</span>
                {mapStyle === s.id && <span className="map-style-check">✓</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3D toggle */}
      <div className="map-ctl-group">
        <button
          type="button"
          className={`map-ctl-btn ${is3D ? "is-active" : ""}`}
          onClick={onToggle3D}
          aria-pressed={is3D}
          title={is3D ? "Switch to 2D view" : "Switch to 3D view"}
        >
          <span className="map-ctl-3d">3D</span>
        </button>
      </div>

      {/* Zoom controls */}
      <div className="map-ctl-group map-ctl-stack">
        <button type="button" className="map-ctl-btn" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
          <PlusIcon />
        </button>
        <button type="button" className="map-ctl-btn" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
          <MinusIcon />
        </button>
      </div>

      {/* Fullscreen */}
      <div className="map-ctl-group">
        <button
          type="button"
          className={`map-ctl-btn ${fullscreenActive ? "is-active" : ""}`}
          onClick={onFullscreen}
          aria-pressed={fullscreenActive}
          title={fullscreenActive ? "Exit fullscreen" : "Fullscreen"}
        >
          {fullscreenActive ? <ExitFsIcon /> : <FullscreenIcon />}
        </button>
      </div>
    </div>
  );
}

/* ---------- icons ---------- */
function LayerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5l9 4.5-9 4.5-9-4.5L12 2.5z" />
      <path d="M3 12l9 4.5L21 12" />
      <path d="M3 16.5L12 21l9-4.5" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
    </svg>
  );
}
function ExitFsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
    </svg>
  );
}

/* ---------- map-style icons ---------- */
const ICO = { viewBox: "0 0 24 24", width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

function SatelliteIcon() {
  return (
    <svg {...ICO} aria-hidden="true">
      <path d="M5 13a7 7 0 0 1 7 7" />
      <path d="M5 17a3 3 0 0 1 3 3" />
      <circle cx="5.5" cy="19.5" r="1" fill="currentColor" stroke="none" />
      <rect x="11.5" y="3.5" width="6" height="6" rx="1" transform="rotate(45 14.5 6.5)" />
      <path d="M16 9l3 3M14 11l-2-2" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg {...ICO} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}
function StreetsIcon() {
  return (
    <svg {...ICO} aria-hidden="true">
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}
function TerrainIcon() {
  return (
    <svg {...ICO} aria-hidden="true">
      <path d="M3 20l6-9 4 5 2-3 6 7z" />
      <path d="M9 11l2 3" />
      <circle cx="17" cy="6" r="2" />
    </svg>
  );
}
function NavIcon() {
  return (
    <svg {...ICO} aria-hidden="true">
      <path d="M12 3l8 18-8-4-8 4 8-18z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg {...ICO} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg {...ICO} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}
