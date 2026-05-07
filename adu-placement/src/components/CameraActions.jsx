// Floating camera quick-action panel: one-click recenter on the home,
// frame the entire lot, or jump back to the original address. Pinned
// to the bottom-center of the map and only renders when relevant.

export default function CameraActions({
  hasFootprint,
  hasLot,
  hasLocation,
  onFrameHome,
  onFrameLot,
  onRecenterAddress,
}) {
  if (!hasLocation) return null;

  return (
    <div className="cam-actions" role="toolbar" aria-label="Camera shortcuts">
      {hasFootprint && (
        <button
          type="button"
          className="cam-btn cam-btn-primary"
          onClick={onFrameHome}
          title="Zoom in tight on the home"
        >
          <HomeIcon /> <span>Frame home</span>
        </button>
      )}
      {hasLot && (
        <button
          type="button"
          className="cam-btn"
          onClick={onFrameLot}
          title="Fit the entire lot in view"
        >
          <LotIcon /> <span>Frame lot</span>
        </button>
      )}
      <button
        type="button"
        className="cam-btn"
        onClick={onRecenterAddress}
        title="Jump back to the address"
      >
        <PinIcon /> <span>Address</span>
      </button>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function LotIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" strokeOpacity="0.4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}
