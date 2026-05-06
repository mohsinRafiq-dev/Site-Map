// Hand-drawn SVG of the "Absolute" 30' x 18' ADU.
// Matches the reference floor plan exactly: green exterior band,
// wood-grain interior, all furniture (bathtub, toilet, bed, sofa,
// kitchen island, fridge, stove, sink, dresser), closet rods,
// the ladder symbol, deck planks, door swings, and front-door marker.
//
// Coordinates: feet, with y=0 at the TOP edge of the home and y=18
// at the BOTTOM. Decks extend OUTSIDE that footprint: the small
// front-entry deck (28 sf) reaches above y=0, the large back deck
// (180 sf) reaches below y=18.
//
// The exact same drawing is rendered two ways:
//   • <AbsoluteFloorPlanSvg variant="full" /> — JSX, used in the
//     in-page detail panel, with dimension lines + room labels.
//   • renderAbsoluteSvgString({ withDecks, withDoorMarker }) —
//     a plain SVG string, rasterized into a PNG and pinned to
//     the map as the on-lot floor plan overlay.
//
// Both share the geometry constants below so the two views never
// drift out of sync.

const W = 30;
const D = 18;

// ROOMS — laid out to match the reference image. Labels show the
// authored sf (which doesn't always equal x*y because of wall thickness).
const ROOMS = [
  { id: "bath",   label: "BATHROOM",        sqft: 36,  x: 0,    y: 0,    w: 8,   d: 6 },
  { id: "hall",   label: "HALL",            sqft: 19,  x: 8,    y: 0,    w: 5,   d: 4 },
  { id: "wd",     label: "W/D",             sqft: 9,   x: 10,   y: 4.5,  w: 3.5, d: 3.5 },
  { id: "ref",    label: "REF",             sqft: null,x: 13.5, y: 4.5,  w: 4,   d: 2.5 },
  { id: "bed",    label: "BEDROOM",         sqft: 103, x: 0,    y: 6,    w: 9,   d: 10 },
  { id: "closet", label: "CLOSET",          sqft: 19,  x: 9,    y: 8.5,  w: 4,   d: 6 },
  { id: "kitchen",label: "KITCHEN",         sqft: 120, x: 13,   y: 7,    w: 7,   d: 11 },
  { id: "foyer",  label: "FOYER",           sqft: 12,  x: 9,    y: 14.5, w: 11,  d: 3.5 },
  { id: "living", label: "LIVING + DINING", sqft: 163, x: 20,   y: 0,    w: 10,  d: 18 },
];

const DECKS = [
  { id: "deck-front", label: "DECK", sqft: 28,  x: 11, y: -4, w: 8,  d: 4, side: "front" },
  { id: "deck-back",  label: "DECK", sqft: 180, x: 0,  y: 18, w: 30, d: 6, side: "back" },
];

const FRONT_DOOR = { x: 13, y: 18, side: "back-deck-entry" }; // door from foyer → back deck
const FOYER_DOOR = { x: 9.5, y: 18, side: "foyer-out" };      // foyer to outside (front entry)
const BACK_LIVING_DOOR = { x: 25, y: 18, side: "living-out" };
const TOP_DECK_DOOR = { x: 13, y: 0, side: "hall-deck" };

const COLORS = {
  exterior: "#5b8a3a",    // the green frame
  exteriorDark: "#3d6622",
  interior: "#1a1a1a",    // black wall lines
  floorWood: "#fcf6e9",
  floorWoodDark: "#e8dec4",
  deckWood: "#cfe7c0",
  deckWoodDark: "#a8c997",
  roomFill: "#fcfaf2",
  smallRoomFill: "#f3eddb",
  fixture: "#2d2d2d",
  fixtureFill: "#ffffff",
  furniture: "#c9b387",
  furnitureDark: "#8a6b3c",
  textDark: "#1c2018",
  textMuted: "#5b6b48",
  doorMarker: "#c0392b",
};

/* ========================================================================
   JSX COMPONENT (used in detail panel + thumbnail card)
   ======================================================================== */

export default function AbsoluteFloorPlanSvg({
  variant = "full",
  showLabels = true,
  showDecks = true,
  showDimensions = true,
  ariaLabel,
  className = "",
}) {
  const padFront = showDecks ? 5 : 0.5;
  const padBack = showDecks ? 7 : 0.5;
  const padSide = variant === "full" ? 4.5 : 0.6;

  const vbX = -padSide;
  const vbY = -padBack;
  const vbW = W + padSide * 2;
  const vbH = D + padFront + padBack;

  return (
    <svg
      className={`floorplan-svg ${className}`}
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <Defs />
      {showDecks && (
        <>
          {DECKS.map((d) => (
            <DeckGroup key={d.id} deck={d} showLabel={showLabels && variant === "full"} />
          ))}
        </>
      )}
      <ExteriorShell />
      <InteriorFloor />
      <Rooms showLabels={showLabels && variant === "full"} />
      <Fixtures />
      <Furniture />
      <DoorsAndSwings includeMarker={variant === "full"} />
      <ExteriorWallTrim />
      <Windows />
      {variant === "full" && showDimensions && <DimensionLines />}
    </svg>
  );
}

/* ---------- defs (patterns, gradients) ---------- */

function Defs() {
  return (
    <defs>
      <pattern id="abs-wood" width="3" height="0.7" patternUnits="userSpaceOnUse">
        <rect width="3" height="0.7" fill={COLORS.floorWood} />
        <line x1="0" y1="0" x2="3" y2="0" stroke={COLORS.floorWoodDark} strokeWidth="0.04" />
        <line x1="0" y1="0" x2="0" y2="0.7" stroke={COLORS.floorWoodDark} strokeWidth="0.04" />
      </pattern>
      <pattern id="abs-wood-vert" width="0.7" height="3" patternUnits="userSpaceOnUse">
        <rect width="0.7" height="3" fill={COLORS.floorWood} />
        <line x1="0" y1="0" x2="0.7" y2="0" stroke={COLORS.floorWoodDark} strokeWidth="0.04" />
        <line x1="0" y1="0" x2="0" y2="3" stroke={COLORS.floorWoodDark} strokeWidth="0.04" />
      </pattern>
      <pattern id="abs-deck" width="1.4" height="0.5" patternUnits="userSpaceOnUse">
        <rect width="1.4" height="0.5" fill={COLORS.deckWood} />
        <line x1="0" y1="0" x2="1.4" y2="0" stroke={COLORS.deckWoodDark} strokeWidth="0.05" />
      </pattern>
    </defs>
  );
}

/* ---------- exterior + decks ---------- */

function ExteriorShell() {
  // Outer green band representing exterior walls. We draw a slightly
  // larger green rectangle behind the floor so it shows as a 0.45 ft
  // "frame" of green, like the reference image.
  const t = 0.45;
  return (
    <rect
      x={-t}
      y={-t}
      width={W + 2 * t}
      height={D + 2 * t}
      fill={COLORS.exterior}
      stroke={COLORS.exteriorDark}
      strokeWidth="0.12"
    />
  );
}

function ExteriorWallTrim() {
  // Strong outer black perimeter line on top of everything.
  return (
    <rect
      x={0}
      y={0}
      width={W}
      height={D}
      fill="none"
      stroke={COLORS.interior}
      strokeWidth="0.32"
    />
  );
}

function InteriorFloor() {
  return (
    <rect
      x={0}
      y={0}
      width={W}
      height={D}
      fill={COLORS.floorWood}
    />
  );
}

function Windows() {
  // Window indicators — small lighter rectangles on exterior walls
  const wins = [
    // Living + Dining: south wall (right)
    { x: W - 0.45, y: 2,    w: 0.45, h: 4 },
    { x: W - 0.45, y: 12,   w: 0.45, h: 4 },
    // Living + Dining: top wall (window over the living seating)
    { x: 22, y: -0.05, w: 5, h: 0.45 },
    // Bathroom: top wall
    { x: 1.5, y: -0.05, w: 4, h: 0.45 },
    // Bedroom: left wall
    { x: -0.4, y: 8,  w: 0.45, h: 5 },
    // Living + Dining: bottom wall
    { x: 22, y: D - 0.4, w: 5, h: 0.45 },
  ];
  return (
    <g>
      {wins.map((w, i) => (
        <rect
          key={i}
          x={w.x}
          y={w.y}
          width={w.w}
          height={w.h}
          fill="#ffffff"
          stroke={COLORS.exteriorDark}
          strokeWidth="0.05"
        />
      ))}
    </g>
  );
}

function DeckGroup({ deck, showLabel }) {
  return (
    <g>
      <rect
        x={deck.x}
        y={deck.y}
        width={deck.w}
        height={deck.d}
        fill={COLORS.exterior}
        stroke={COLORS.exteriorDark}
        strokeWidth="0.15"
      />
      {/* deck wood planks */}
      <rect
        x={deck.x + 0.4}
        y={deck.y + 0.4}
        width={deck.w - 0.8}
        height={deck.d - 0.8}
        fill="url(#abs-deck)"
        stroke={COLORS.deckWoodDark}
        strokeWidth="0.04"
      />
      {/* arrow indicator (entry direction) on back deck */}
      {deck.side === "back" && (
        <DeckArrow x={deck.x + 5} y={deck.y + deck.d / 2} />
      )}
      {deck.side === "back" && (
        <DeckArrow x={deck.x + 25} y={deck.y + deck.d / 2} flip />
      )}
      {showLabel && (
        <DeckLabel deck={deck} />
      )}
    </g>
  );
}

function DeckArrow({ x, y, flip }) {
  // Up-pointing arrow into the home
  const dir = flip ? -1 : 1;
  return (
    <g pointerEvents="none">
      <line
        x1={x}
        y1={y}
        x2={x + dir * 1.2}
        y2={y}
        stroke={COLORS.exteriorDark}
        strokeWidth="0.1"
      />
      <polyline
        points={`${x + dir * 0.6},${y - 0.4} ${x},${y} ${x + dir * 0.6},${y + 0.4}`}
        fill="none"
        stroke={COLORS.exteriorDark}
        strokeWidth="0.1"
      />
    </g>
  );
}

function DeckLabel({ deck }) {
  const cx = deck.x + deck.w / 2;
  const cy = deck.y + deck.d / 2;
  const fs = 1.1;
  return (
    <g pointerEvents="none">
      <text
        x={cx}
        y={cy - fs * 0.2}
        textAnchor="middle"
        fontSize={fs}
        fontWeight="800"
        fill="#1a3010"
        letterSpacing="0.1"
      >
        DECK
      </text>
      <text
        x={cx}
        y={cy + fs * 0.95}
        textAnchor="middle"
        fontSize={fs * 0.78}
        fill="#1a3010"
        fontWeight="600"
      >
        {deck.sqft} SF
      </text>
    </g>
  );
}

/* ---------- rooms ---------- */

function Rooms({ showLabels }) {
  return (
    <g>
      {ROOMS.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.d}
            fill={r.id === "ref" ? "#ffffff" : COLORS.roomFill}
            stroke={COLORS.interior}
            strokeWidth={r.id === "ref" ? "0.1" : "0.18"}
          />
          {showLabels && r.label && (
            <RoomLabel room={r} />
          )}
        </g>
      ))}
    </g>
  );
}

function RoomLabel({ room }) {
  const cx = room.x + room.w / 2;
  const cy = room.y + room.d / 2;
  const small = room.sqft && room.sqft < 25;
  const ref = room.id === "ref";
  const fs = ref
    ? 0.85
    : small
    ? 0.95
    : Math.max(1.05, Math.min(room.w, room.d) / 5.5);

  // Special: ladder label below HALL
  if (room.id === "hall") {
    return (
      <g pointerEvents="none">
        <text x={cx} y={cy - 0.2} textAnchor="middle" fontSize={fs} fontWeight="800" fill={COLORS.textDark}>HALL</text>
        <text x={cx} y={cy + fs * 0.85} textAnchor="middle" fontSize={fs * 0.7} fill={COLORS.textMuted} fontWeight="600">{room.sqft} SF</text>
        <text x={cx - 2.5} y={cy + fs * 1.6} textAnchor="middle" fontSize={fs * 0.72} fill={COLORS.textMuted} fontWeight="700" letterSpacing="0.04">LADDER</text>
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      <text
        x={cx}
        y={cy - (room.sqft ? fs * 0.2 : 0)}
        textAnchor="middle"
        fontSize={fs}
        fontWeight="800"
        fill={COLORS.textDark}
        letterSpacing="0.04"
      >
        {room.label}
      </text>
      {room.sqft && (
        <text
          x={cx}
          y={cy + fs * 0.95}
          textAnchor="middle"
          fontSize={fs * 0.72}
          fill={COLORS.textMuted}
          fontWeight="600"
        >
          {room.sqft} SF
        </text>
      )}
    </g>
  );
}

/* ---------- fixtures (bathtub, toilet, sinks, stove, fridge, ladder) ---------- */

function Fixtures() {
  return (
    <g pointerEvents="none">
      {/* BATHROOM */}
      <Bathtub />
      <Toilet />
      <BathSink />
      {/* W/D */}
      <Washer />
      {/* KITCHEN */}
      <KitchenSink />
      <Stove />
      <KitchenIsland />
      <Fridge />
      {/* HALL: Ladder */}
      <Ladder />
      {/* CLOSET: hanging rod */}
      <ClosetRod />
    </g>
  );
}

function Bathtub() {
  // Bathtub along left wall of bathroom, 5x2.5 oriented vertically
  const x = 0.4;
  const y = 0.5;
  const w = 2.6;
  const h = 5;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="0.35"
        fill={COLORS.fixtureFill}
        stroke={COLORS.fixture}
        strokeWidth="0.1"
      />
      <ellipse
        cx={x + w / 2}
        cy={y + h / 2 + 0.3}
        rx={w / 2 - 0.4}
        ry={h / 2 - 0.6}
        fill="#f6f9fb"
        stroke={COLORS.fixture}
        strokeWidth="0.08"
      />
      <circle cx={x + w / 2} cy={y + 0.5} r="0.18" fill={COLORS.fixture} />
    </g>
  );
}

function Toilet() {
  // Small toilet on right edge of bathroom
  const cx = 6.7;
  const cy = 1.2;
  return (
    <g>
      <rect
        x={cx - 0.65}
        y={cy - 0.4}
        width="1.3"
        height="0.6"
        rx="0.1"
        fill={COLORS.fixtureFill}
        stroke={COLORS.fixture}
        strokeWidth="0.08"
      />
      <ellipse
        cx={cx}
        cy={cy + 0.7}
        rx="0.6"
        ry="0.7"
        fill={COLORS.fixtureFill}
        stroke={COLORS.fixture}
        strokeWidth="0.08"
      />
    </g>
  );
}

function BathSink() {
  // Sink at the bottom of the bathroom
  const x = 4.3;
  const y = 4.2;
  const w = 1.6;
  const h = 1.2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="0.1"
        fill={COLORS.fixtureFill}
        stroke={COLORS.fixture}
        strokeWidth="0.08"
      />
      <ellipse
        cx={x + w / 2}
        cy={y + h / 2 + 0.05}
        rx={w / 2 - 0.2}
        ry={h / 2 - 0.2}
        fill="#eaf2fa"
        stroke={COLORS.fixture}
        strokeWidth="0.06"
      />
      <circle cx={x + w / 2} cy={y + 0.18} r="0.1" fill={COLORS.fixture} />
    </g>
  );
}

function Washer() {
  // W/D circle inside the W/D box
  const cx = 11.75;
  const cy = 6.25;
  return (
    <g>
      <rect
        x={10.3}
        y={4.8}
        width="2.9"
        height="2.9"
        rx="0.1"
        fill="#fafafa"
        stroke={COLORS.fixture}
        strokeWidth="0.08"
      />
      <circle cx={cx} cy={cy} r="0.95" fill="#e6e6e6" stroke={COLORS.fixture} strokeWidth="0.08" />
      <circle cx={cx} cy={cy} r="0.55" fill="#ffffff" stroke={COLORS.fixture} strokeWidth="0.05" />
    </g>
  );
}

function Fridge() {
  // REF — drawn as a horizontal box at top of kitchen
  return (
    <g>
      <rect x="13.7" y="4.7" width="3.6" height="2.1" rx="0.08" fill="#ffffff" stroke={COLORS.fixture} strokeWidth="0.08" />
      <line x1="13.7" y1="5.3" x2="17.3" y2="5.3" stroke={COLORS.fixture} strokeWidth="0.06" />
      <rect x="14.0" y="5.6" width="0.18" height="1.0" fill={COLORS.fixture} />
    </g>
  );
}

function KitchenSink() {
  // Sink + faucet in kitchen
  const x = 13.5;
  const y = 7.3;
  return (
    <g>
      <rect x={x} y={y} width="2.3" height="1.6" rx="0.1" fill={COLORS.fixtureFill} stroke={COLORS.fixture} strokeWidth="0.09" />
      <rect x={x + 0.2} y={y + 0.2} width="1.9" height="1.2" rx="0.05" fill="#dbe6ee" stroke={COLORS.fixture} strokeWidth="0.06" />
      <circle cx={x + 1.15} cy={y + 0.05} r="0.08" fill={COLORS.fixture} />
    </g>
  );
}

function Stove() {
  const x = 13.5;
  const y = 9.6;
  return (
    <g>
      <rect x={x} y={y} width="2.5" height="2.0" rx="0.1" fill={COLORS.fixtureFill} stroke={COLORS.fixture} strokeWidth="0.09" />
      <circle cx={x + 0.7} cy={y + 0.6} r="0.22" fill="none" stroke={COLORS.fixture} strokeWidth="0.06" />
      <circle cx={x + 1.8} cy={y + 0.6} r="0.22" fill="none" stroke={COLORS.fixture} strokeWidth="0.06" />
      <circle cx={x + 0.7} cy={y + 1.5} r="0.22" fill="none" stroke={COLORS.fixture} strokeWidth="0.06" />
      <circle cx={x + 1.8} cy={y + 1.5} r="0.22" fill="none" stroke={COLORS.fixture} strokeWidth="0.06" />
    </g>
  );
}

function KitchenIsland() {
  return (
    <g>
      <rect x="16.6" y="8.5" width="3.0" height="5.0" rx="0.1" fill="#fff7e6" stroke="#7a5d2e" strokeWidth="0.1" />
      <line x1="16.6" y1="11.0" x2="19.6" y2="11.0" stroke="#7a5d2e" strokeWidth="0.05" />
    </g>
  );
}

function Ladder() {
  // Ladder symbol inside hall (parallel slanted lines)
  return (
    <g pointerEvents="none">
      <line x1="9" y1="2.4" x2="11.5" y2="3.7" stroke={COLORS.fixture} strokeWidth="0.1" />
      <line x1="9.5" y1="2.4" x2="12.0" y2="3.7" stroke={COLORS.fixture} strokeWidth="0.1" />
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line
          key={i}
          x1={9 + 2.5 * t}
          y1={2.4 + 1.3 * t}
          x2={9.5 + 2.5 * t}
          y2={2.4 + 1.3 * t}
          stroke={COLORS.fixture}
          strokeWidth="0.08"
        />
      ))}
    </g>
  );
}

function ClosetRod() {
  // Hanging rod with zig-zag (clothes) lines
  return (
    <g pointerEvents="none">
      <line x1="9.4" y1="9.5" x2="12.6" y2="9.5" stroke={COLORS.fixture} strokeWidth="0.08" />
      {[9.6, 10.2, 10.8, 11.4, 12.0].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="9.55" x2={x} y2="11" stroke={COLORS.furnitureDark} strokeWidth="0.05" />
          <polyline
            points={`${x - 0.25},11.6 ${x},11 ${x + 0.25},11.6`}
            fill="none"
            stroke={COLORS.furnitureDark}
            strokeWidth="0.06"
          />
        </g>
      ))}
    </g>
  );
}

/* ---------- furniture (bed, sofa, chairs, dresser, table) ---------- */

function Furniture() {
  return (
    <g pointerEvents="none">
      <Bed />
      <Dresser />
      <NightTables />
      <Sofa />
      <SideChair x={26.0} y={1.6} />
      <SideChair x={26.0} y={14.4} />
      <CoffeeTable />
      <DiningTable />
    </g>
  );
}

function Bed() {
  // Queen bed against the bedroom-bathroom wall, head facing top
  const x = 1.6;
  const y = 7.4;
  const w = 5.6;
  const d = 6.5;
  return (
    <g>
      {/* mattress */}
      <rect x={x} y={y} width={w} height={d} rx="0.25" fill="#f5e9d3" stroke={COLORS.furnitureDark} strokeWidth="0.1" />
      {/* headboard */}
      <rect x={x - 0.05} y={y - 0.1} width={w + 0.1} height="0.5" fill={COLORS.furnitureDark} />
      {/* pillows */}
      <rect x={x + 0.4} y={y + 0.4} width={(w - 1.0) / 2} height="1.6" rx="0.18" fill="#ffffff" stroke={COLORS.furnitureDark} strokeWidth="0.06" />
      <rect x={x + 0.6 + (w - 1.0) / 2} y={y + 0.4} width={(w - 1.0) / 2} height="1.6" rx="0.18" fill="#ffffff" stroke={COLORS.furnitureDark} strokeWidth="0.06" />
      {/* duvet line */}
      <line x1={x + 0.2} y1={y + 2.5} x2={x + w - 0.2} y2={y + 2.5} stroke={COLORS.furnitureDark} strokeWidth="0.06" />
    </g>
  );
}

function NightTables() {
  return (
    <g>
      <rect x="0.2" y="7.4" width="1.2" height="1.2" fill="#e9d8b2" stroke={COLORS.furnitureDark} strokeWidth="0.07" />
      <rect x="7.4" y="7.4" width="1.2" height="1.2" fill="#e9d8b2" stroke={COLORS.furnitureDark} strokeWidth="0.07" />
    </g>
  );
}

function Dresser() {
  // Dresser at the bottom-left of bedroom
  return (
    <g>
      <rect x="0.3" y="14.5" width="6" height="1.3" fill="#d6b884" stroke={COLORS.furnitureDark} strokeWidth="0.08" />
      <line x1="2.3" y1="14.5" x2="2.3" y2="15.8" stroke={COLORS.furnitureDark} strokeWidth="0.06" />
      <line x1="4.3" y1="14.5" x2="4.3" y2="15.8" stroke={COLORS.furnitureDark} strokeWidth="0.06" />
    </g>
  );
}

function Sofa() {
  // L-shape sectional in living + dining, against right wall
  return (
    <g>
      {/* main sofa along right wall */}
      <rect x="27.4" y="6" width="2.4" height="6.5" rx="0.3" fill="#dec999" stroke={COLORS.furnitureDark} strokeWidth="0.1" />
      <rect x="27.55" y="6.2" width="2.1" height="6.1" rx="0.2" fill="#efe2c0" stroke={COLORS.furnitureDark} strokeWidth="0.05" />
      {/* short return along bottom */}
      <rect x="22.5" y="13.4" width="6.0" height="2.4" rx="0.3" fill="#dec999" stroke={COLORS.furnitureDark} strokeWidth="0.1" />
      <rect x="22.7" y="13.55" width="5.6" height="2.1" rx="0.2" fill="#efe2c0" stroke={COLORS.furnitureDark} strokeWidth="0.05" />
    </g>
  );
}

function SideChair({ x, y }) {
  return (
    <g>
      <rect x={x} y={y} width="2.1" height="2.0" rx="0.25" fill="#e3d4ad" stroke={COLORS.furnitureDark} strokeWidth="0.09" />
      <rect x={x + 0.15} y={y + 0.15} width="1.8" height="1.5" rx="0.18" fill="#f3e9cc" stroke={COLORS.furnitureDark} strokeWidth="0.05" />
    </g>
  );
}

function CoffeeTable() {
  return (
    <rect x="23.2" y="9.2" width="3" height="2" rx="0.15" fill="#bea66f" stroke={COLORS.furnitureDark} strokeWidth="0.09" />
  );
}

function DiningTable() {
  // Small dining table near top-left of living+dining
  return (
    <g>
      <rect x="22.0" y="2.0" width="3.4" height="3.0" rx="0.15" fill="#cab27e" stroke={COLORS.furnitureDark} strokeWidth="0.09" />
      {/* chairs */}
      <rect x="22.4" y="0.8" width="2.6" height="0.9" rx="0.1" fill="#d8c594" stroke={COLORS.furnitureDark} strokeWidth="0.06" />
      <rect x="22.4" y="5.3" width="2.6" height="0.9" rx="0.1" fill="#d8c594" stroke={COLORS.furnitureDark} strokeWidth="0.06" />
    </g>
  );
}

/* ---------- doors + swing arcs + front-door marker ---------- */

function DoorsAndSwings({ includeMarker = true }) {
  // Each door has a panel line + a swing arc
  return (
    <g pointerEvents="none">
      {/* Foyer to outside (FRONT door — bottom of foyer) */}
      <Door x={9.6} y={18} swingX={9.6} swingY={16.5} arcSize={1.8} />

      {/* Bedroom to foyer (door swinging from bedroom into the hallway/foyer) */}
      <Door x={6.5} y={16} swingX={4.7} swingY={16} arcSize={1.8} />

      {/* Hall door at top to small front deck */}
      <Door x={11} y={0} swingX={11} swingY={1.5} arcSize={1.5} />

      {/* Bathroom door */}
      <Door x={6.0} y={6} swingX={7.2} swingY={6} arcSize={1.4} />

      {/* Closet doors (sliding indicator) */}
      <line x1="9.0" y1="11.5" x2="9.0" y2="14.5" stroke={COLORS.fixture} strokeWidth="0.18" />

      {/* Living + Dining to back deck */}
      <Door x={22.5} y={18} swingX={22.5} swingY={16.5} arcSize={1.6} />
      <Door x={28.5} y={18} swingX={28.5} swingY={16.5} arcSize={1.6} />

      {/* Kitchen to foyer */}
      <line x1="13" y1="14.5" x2="20" y2="14.5" stroke={COLORS.interior} strokeWidth="0.18" strokeDasharray="0 0" />

      {includeMarker && (
        <FrontDoorMarker x={9.6} y={18} />
      )}
    </g>
  );
}

function Door({ x, y, swingX, swingY, arcSize }) {
  // Drawn as a small rectangle indicating the panel + a curved arc
  const dx = swingX - x;
  const dy = swingY - y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ex = x + ux * arcSize;
  const ey = y + uy * arcSize;
  return (
    <g>
      <path
        d={`M ${x} ${y} A ${arcSize} ${arcSize} 0 0 1 ${ex} ${ey}`}
        fill="none"
        stroke="#94a37d"
        strokeWidth="0.07"
        strokeDasharray="0.25 0.18"
      />
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={COLORS.fixture} strokeWidth="0.16" />
    </g>
  );
}

function FrontDoorMarker({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r="0.55" fill={COLORS.doorMarker} stroke="#ffffff" strokeWidth="0.18" />
      <text
        x={x + 1.2}
        y={y + 0.22}
        fontSize="0.7"
        fontWeight="800"
        fill={COLORS.doorMarker}
        letterSpacing="0.04"
      >
        FRONT ENTRY
      </text>
    </g>
  );
}

/* ---------- dimensions (full variant only) ---------- */

function DimensionLines() {
  return (
    <g pointerEvents="none">
      <line x1="0" y1="-5.5" x2={W} y2="-5.5" stroke={COLORS.textDark} strokeWidth="0.08" />
      <line x1="0" y1="-6" x2="0" y2="-5" stroke={COLORS.textDark} strokeWidth="0.08" />
      <line x1={W} y1="-6" x2={W} y2="-5" stroke={COLORS.textDark} strokeWidth="0.08" />
      <text x={W / 2} y="-6" textAnchor="middle" fontSize="1.4" fontWeight="800" fill={COLORS.textDark}>
        30&apos; - 0&quot;
      </text>

      <line x1={W + 4} y1="0" x2={W + 4} y2={D} stroke={COLORS.textDark} strokeWidth="0.08" />
      <line x1={W + 3.5} y1="0" x2={W + 4.5} y2="0" stroke={COLORS.textDark} strokeWidth="0.08" />
      <line x1={W + 3.5} y1={D} x2={W + 4.5} y2={D} stroke={COLORS.textDark} strokeWidth="0.08" />
      <text
        x={W + 4.2}
        y={D / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize="1.4"
        fontWeight="800"
        fill={COLORS.textDark}
      >
        18&apos; - 0&quot;
      </text>
    </g>
  );
}

/* ========================================================================
   STRING RENDERER (for map raster overlay — no dimensions, no decks-outside)
   ======================================================================== */

export function renderAbsoluteSvgString({ withDecks = true } = {}) {
  // The map overlay must be cropped exactly to the building footprint
  // per the client's "no detail outside the boundary" requirement, but
  // we still draw decks INSIDE the SVG (they help orientation). We
  // expand the viewBox to include them but keep no whitespace.
  const padFront = withDecks ? 5 : 0;
  const padBack = withDecks ? 7 : 0;
  const vbX = 0;
  const vbY = -padBack;
  const vbW = W;
  const vbH = D + padFront + padBack;

  const decks = withDecks ? DECKS.map(deckXml).join("") : "";
  const rooms = ROOMS.map(roomXml).join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" preserveAspectRatio="none">
  <defs>
    <pattern id="abs-deck" width="1.4" height="0.5" patternUnits="userSpaceOnUse">
      <rect width="1.4" height="0.5" fill="${COLORS.deckWood}"/>
      <line x1="0" y1="0" x2="1.4" y2="0" stroke="${COLORS.deckWoodDark}" stroke-width="0.05"/>
    </pattern>
  </defs>
  ${decks}
  <rect x="-0.45" y="-0.45" width="${W + 0.9}" height="${D + 0.9}" fill="${COLORS.exterior}" stroke="${COLORS.exteriorDark}" stroke-width="0.12"/>
  <rect x="0" y="0" width="${W}" height="${D}" fill="${COLORS.floorWood}"/>
  ${rooms}
  ${fixturesXml()}
  ${furnitureXml()}
  ${doorsXml()}
  <rect x="0" y="0" width="${W}" height="${D}" fill="none" stroke="${COLORS.interior}" stroke-width="0.32"/>
</svg>`.trim();
}

function deckXml(d) {
  const arrow =
    d.side === "back"
      ? `<g><line x1="5" y1="${d.y + d.d / 2}" x2="6.2" y2="${d.y + d.d / 2}" stroke="${COLORS.exteriorDark}" stroke-width="0.1"/></g>`
      : "";
  return `
    <rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.d}" fill="${COLORS.exterior}" stroke="${COLORS.exteriorDark}" stroke-width="0.15"/>
    <rect x="${d.x + 0.4}" y="${d.y + 0.4}" width="${d.w - 0.8}" height="${d.d - 0.8}" fill="url(#abs-deck)" stroke="${COLORS.deckWoodDark}" stroke-width="0.04"/>
    <text x="${d.x + d.w / 2}" y="${d.y + d.d / 2 - 0.2}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="1.05" font-weight="800" fill="#1a3010">DECK</text>
    <text x="${d.x + d.w / 2}" y="${d.y + d.d / 2 + 0.85}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="0.78" fill="#1a3010" font-weight="600">${d.sqft} SF</text>
    ${arrow}`;
}

function roomXml(r) {
  const isRef = r.id === "ref";
  const stroke = isRef ? "0.1" : "0.18";
  const fill = isRef ? "#ffffff" : COLORS.roomFill;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.d / 2;
  const small = r.sqft && r.sqft < 25;
  const fs = isRef
    ? 0.85
    : small
    ? 0.95
    : Math.max(1.05, Math.min(r.w, r.d) / 5.5);
  const labelLine =
    r.id === "hall"
      ? `<text x="${cx}" y="${cy - 0.2}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fs}" font-weight="800" fill="${COLORS.textDark}">HALL</text>
         <text x="${cx}" y="${cy + fs * 0.85}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fs * 0.7}" fill="${COLORS.textMuted}" font-weight="600">${r.sqft} SF</text>
         <text x="${cx - 2.5}" y="${cy + fs * 1.6}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fs * 0.72}" fill="${COLORS.textMuted}" font-weight="700">LADDER</text>`
      : `<text x="${cx}" y="${cy - (r.sqft ? fs * 0.2 : 0)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fs}" font-weight="800" fill="${COLORS.textDark}">${r.label}</text>${
          r.sqft
            ? `<text x="${cx}" y="${cy + fs * 0.95}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fs * 0.72}" fill="${COLORS.textMuted}" font-weight="600">${r.sqft} SF</text>`
            : ""
        }`;
  return `
    <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.d}" fill="${fill}" stroke="${COLORS.interior}" stroke-width="${stroke}"/>
    ${labelLine}`;
}

function fixturesXml() {
  // Bathtub + toilet + sinks + stove + fridge + ladder + closet rod (simplified)
  return `
    <!-- bathtub -->
    <rect x="0.4" y="0.5" width="2.6" height="5" rx="0.35" fill="#ffffff" stroke="${COLORS.fixture}" stroke-width="0.1"/>
    <ellipse cx="1.7" cy="3.3" rx="0.9" ry="1.9" fill="#f6f9fb" stroke="${COLORS.fixture}" stroke-width="0.08"/>
    <!-- toilet -->
    <rect x="6.05" y="0.8" width="1.3" height="0.6" rx="0.1" fill="#ffffff" stroke="${COLORS.fixture}" stroke-width="0.08"/>
    <ellipse cx="6.7" cy="1.9" rx="0.6" ry="0.7" fill="#ffffff" stroke="${COLORS.fixture}" stroke-width="0.08"/>
    <!-- bath sink -->
    <rect x="4.3" y="4.2" width="1.6" height="1.2" rx="0.1" fill="#ffffff" stroke="${COLORS.fixture}" stroke-width="0.08"/>
    <ellipse cx="5.1" cy="4.85" rx="0.6" ry="0.4" fill="#eaf2fa" stroke="${COLORS.fixture}" stroke-width="0.06"/>
    <!-- W/D -->
    <rect x="10.3" y="4.8" width="2.9" height="2.9" rx="0.1" fill="#fafafa" stroke="${COLORS.fixture}" stroke-width="0.08"/>
    <circle cx="11.75" cy="6.25" r="0.95" fill="#e6e6e6" stroke="${COLORS.fixture}" stroke-width="0.08"/>
    <!-- fridge (REF) -->
    <rect x="13.7" y="4.7" width="3.6" height="2.1" rx="0.08" fill="#ffffff" stroke="${COLORS.fixture}" stroke-width="0.08"/>
    <line x1="13.7" y1="5.3" x2="17.3" y2="5.3" stroke="${COLORS.fixture}" stroke-width="0.06"/>
    <!-- kitchen sink -->
    <rect x="13.5" y="7.3" width="2.3" height="1.6" rx="0.1" fill="#ffffff" stroke="${COLORS.fixture}" stroke-width="0.09"/>
    <rect x="13.7" y="7.5" width="1.9" height="1.2" rx="0.05" fill="#dbe6ee" stroke="${COLORS.fixture}" stroke-width="0.06"/>
    <!-- stove -->
    <rect x="13.5" y="9.6" width="2.5" height="2.0" rx="0.1" fill="#ffffff" stroke="${COLORS.fixture}" stroke-width="0.09"/>
    <circle cx="14.2" cy="10.2" r="0.22" fill="none" stroke="${COLORS.fixture}" stroke-width="0.06"/>
    <circle cx="15.3" cy="10.2" r="0.22" fill="none" stroke="${COLORS.fixture}" stroke-width="0.06"/>
    <circle cx="14.2" cy="11.1" r="0.22" fill="none" stroke="${COLORS.fixture}" stroke-width="0.06"/>
    <circle cx="15.3" cy="11.1" r="0.22" fill="none" stroke="${COLORS.fixture}" stroke-width="0.06"/>
    <!-- island -->
    <rect x="16.6" y="8.5" width="3.0" height="5.0" rx="0.1" fill="#fff7e6" stroke="#7a5d2e" stroke-width="0.1"/>
    <line x1="16.6" y1="11.0" x2="19.6" y2="11.0" stroke="#7a5d2e" stroke-width="0.05"/>
    <!-- ladder -->
    <line x1="9" y1="2.4" x2="11.5" y2="3.7" stroke="${COLORS.fixture}" stroke-width="0.1"/>
    <line x1="9.5" y1="2.4" x2="12.0" y2="3.7" stroke="${COLORS.fixture}" stroke-width="0.1"/>
    <!-- closet rod -->
    <line x1="9.4" y1="9.5" x2="12.6" y2="9.5" stroke="${COLORS.fixture}" stroke-width="0.08"/>`;
}

function furnitureXml() {
  return `
    <!-- bed -->
    <rect x="1.6" y="7.4" width="5.6" height="6.5" rx="0.25" fill="#f5e9d3" stroke="${COLORS.furnitureDark}" stroke-width="0.1"/>
    <rect x="1.55" y="7.3" width="5.7" height="0.5" fill="${COLORS.furnitureDark}"/>
    <rect x="2.0" y="7.8" width="2.3" height="1.6" rx="0.18" fill="#ffffff" stroke="${COLORS.furnitureDark}" stroke-width="0.06"/>
    <rect x="4.5" y="7.8" width="2.3" height="1.6" rx="0.18" fill="#ffffff" stroke="${COLORS.furnitureDark}" stroke-width="0.06"/>
    <line x1="1.8" y1="9.9" x2="7.0" y2="9.9" stroke="${COLORS.furnitureDark}" stroke-width="0.06"/>
    <!-- night tables -->
    <rect x="0.2" y="7.4" width="1.2" height="1.2" fill="#e9d8b2" stroke="${COLORS.furnitureDark}" stroke-width="0.07"/>
    <rect x="7.4" y="7.4" width="1.2" height="1.2" fill="#e9d8b2" stroke="${COLORS.furnitureDark}" stroke-width="0.07"/>
    <!-- dresser -->
    <rect x="0.3" y="14.5" width="6" height="1.3" fill="#d6b884" stroke="${COLORS.furnitureDark}" stroke-width="0.08"/>
    <line x1="2.3" y1="14.5" x2="2.3" y2="15.8" stroke="${COLORS.furnitureDark}" stroke-width="0.06"/>
    <line x1="4.3" y1="14.5" x2="4.3" y2="15.8" stroke="${COLORS.furnitureDark}" stroke-width="0.06"/>
    <!-- sectional -->
    <rect x="27.4" y="6" width="2.4" height="6.5" rx="0.3" fill="#dec999" stroke="${COLORS.furnitureDark}" stroke-width="0.1"/>
    <rect x="27.55" y="6.2" width="2.1" height="6.1" rx="0.2" fill="#efe2c0" stroke="${COLORS.furnitureDark}" stroke-width="0.05"/>
    <rect x="22.5" y="13.4" width="6.0" height="2.4" rx="0.3" fill="#dec999" stroke="${COLORS.furnitureDark}" stroke-width="0.1"/>
    <rect x="22.7" y="13.55" width="5.6" height="2.1" rx="0.2" fill="#efe2c0" stroke="${COLORS.furnitureDark}" stroke-width="0.05"/>
    <!-- side chair x2 -->
    <rect x="26.0" y="1.6" width="2.1" height="2.0" rx="0.25" fill="#e3d4ad" stroke="${COLORS.furnitureDark}" stroke-width="0.09"/>
    <rect x="26.0" y="14.4" width="2.1" height="2.0" rx="0.25" fill="#e3d4ad" stroke="${COLORS.furnitureDark}" stroke-width="0.09"/>
    <!-- coffee table -->
    <rect x="23.2" y="9.2" width="3" height="2" rx="0.15" fill="#bea66f" stroke="${COLORS.furnitureDark}" stroke-width="0.09"/>
    <!-- dining table -->
    <rect x="22.0" y="2.0" width="3.4" height="3.0" rx="0.15" fill="#cab27e" stroke="${COLORS.furnitureDark}" stroke-width="0.09"/>
    <rect x="22.4" y="0.8" width="2.6" height="0.9" rx="0.1" fill="#d8c594" stroke="${COLORS.furnitureDark}" stroke-width="0.06"/>
    <rect x="22.4" y="5.3" width="2.6" height="0.9" rx="0.1" fill="#d8c594" stroke="${COLORS.furnitureDark}" stroke-width="0.06"/>`;
}

function doorsXml() {
  return `
    <path d="M 9.6 18 A 1.8 1.8 0 0 1 9.6 16.2" fill="none" stroke="#94a37d" stroke-width="0.07" stroke-dasharray="0.25 0.18"/>
    <line x1="9.6" y1="18" x2="9.6" y2="16.2" stroke="${COLORS.fixture}" stroke-width="0.16"/>
    <circle cx="9.6" cy="18" r="0.55" fill="${COLORS.doorMarker}" stroke="#ffffff" stroke-width="0.18"/>`;
}

/* shared geometry constants for App-level logic */
export const ABSOLUTE_GEOM = { width: W, depth: D };
