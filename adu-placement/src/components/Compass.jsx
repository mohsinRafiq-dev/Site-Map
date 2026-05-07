// Beautiful interactive compass that mirrors the live Mapbox bearing.
// Click "N" or anywhere on the rim to snap the map back to north-up.
// The needle always points to true north regardless of map rotation.
//
// Props:
//   bearing      — current map bearing in degrees (0..360, CW from north)
//   onResetNorth — called when the user clicks the compass to snap to N
export default function Compass({ bearing = 0, onResetNorth }) {
  // The compass dial rotates opposite to the map bearing so true N stays up.
  const dialRotation = -bearing;

  return (
    <button
      type="button"
      className="compass"
      onClick={onResetNorth}
      aria-label={`Compass — ${Math.round(((bearing % 360) + 360) % 360)}° bearing. Click to reset north up.`}
      title="Reset map to north"
    >
      <svg viewBox="0 0 100 100" width="74" height="74" aria-hidden="true">
        <defs>
          <radialGradient id="cmp-face" cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.78" stopColor="#f4ecd8" />
            <stop offset="1" stopColor="#dac49a" />
          </radialGradient>
          <radialGradient id="cmp-inner" cx="0.5" cy="0.5" r="0.55">
            <stop offset="0" stopColor="#fffaf0" />
            <stop offset="1" stopColor="#e6dcc6" />
          </radialGradient>
          <linearGradient id="cmp-needle-n" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dc2626" />
            <stop offset="1" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="cmp-needle-s" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1e293b" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <filter id="cmp-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" />
            <feOffset dx="0" dy="1.2" result="o" />
            <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer brass ring */}
        <circle cx="50" cy="50" r="48" fill="url(#cmp-face)" stroke="#3f2e16" strokeWidth="1.4" filter="url(#cmp-shadow)" />
        <circle cx="50" cy="50" r="44.5" fill="none" stroke="#9b7a3a" strokeWidth="0.8" />

        {/* Tick marks group — rotates with bearing */}
        <g style={{ transformOrigin: "50px 50px", transform: `rotate(${dialRotation}deg)`, transition: "transform 0.15s linear" }}>
          <circle cx="50" cy="50" r="40" fill="url(#cmp-inner)" stroke="#7a5f2e" strokeWidth="0.6" />

          {/* Major ticks every 30° */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = i * 30;
            const isCardinal = a % 90 === 0;
            return (
              <line
                key={`mj-${i}`}
                x1="50"
                y1={isCardinal ? 12 : 14}
                x2="50"
                y2={isCardinal ? 18 : 17}
                stroke="#3f2e16"
                strokeWidth={isCardinal ? 1.3 : 0.8}
                style={{ transformOrigin: "50px 50px", transform: `rotate(${a}deg)` }}
              />
            );
          })}

          {/* Minor ticks every 10° (skipping the 30s) */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = i * 10;
            if (a % 30 === 0) return null;
            return (
              <line
                key={`mn-${i}`}
                x1="50"
                y1="14"
                x2="50"
                y2="16"
                stroke="#7a5f2e"
                strokeWidth="0.4"
                style={{ transformOrigin: "50px 50px", transform: `rotate(${a}deg)` }}
              />
            );
          })}

          {/* Cardinal letters */}
          <text x="50" y="26" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#dc2626" fontFamily="ui-serif, Georgia, serif" letterSpacing="0.5">N</text>
          <text x="74" y="53" textAnchor="middle" fontSize="7" fontWeight="800" fill="#3f2e16" fontFamily="ui-serif, Georgia, serif">E</text>
          <text x="50" y="80" textAnchor="middle" fontSize="7" fontWeight="800" fill="#3f2e16" fontFamily="ui-serif, Georgia, serif">S</text>
          <text x="26" y="53" textAnchor="middle" fontSize="7" fontWeight="800" fill="#3f2e16" fontFamily="ui-serif, Georgia, serif">W</text>

          {/* Needle (red north / dark south) */}
          <g filter="url(#cmp-shadow)">
            <polygon points="50,16 54,50 50,52 46,50" fill="url(#cmp-needle-n)" stroke="#5b1414" strokeWidth="0.3" />
            <polygon points="50,84 54,50 50,48 46,50" fill="url(#cmp-needle-s)" stroke="#0f172a" strokeWidth="0.3" />
          </g>
          <circle cx="50" cy="50" r="3.5" fill="#fbbf24" stroke="#3f2e16" strokeWidth="0.9" />
          <circle cx="50" cy="50" r="1.4" fill="#3f2e16" />
        </g>
      </svg>
      <span className="compass-degrees">{Math.round(((bearing % 360) + 360) % 360)}°</span>
    </button>
  );
}
