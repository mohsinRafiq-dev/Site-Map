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
    { id: "satellite", label: "Satellite", emoji: "🛰️" },
    { id: "streets", label: "Streets", emoji: "🗺️" },
    { id: "outdoors", label: "Outdoors", emoji: "🏞️" },
    { id: "light", label: "Light", emoji: "💡" },
  ];

  return (
    <div className="map-controls">
      {/* Style switcher */}
      <div className="map-ctl-group" ref={styleWrapRef}>
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
                <span className="map-style-emoji">{s.emoji}</span>
                <span>{s.label}</span>
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
