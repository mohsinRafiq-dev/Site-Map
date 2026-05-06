// Renders a floor plan as a clean SVG drawn at real-world scale.
//
// The viewBox is "0 0 width depth" (in feet), with a small margin so the
// back deck (which extends past the depth boundary) isn't clipped.
// Y axis grows downward in SVG, but the layout data treats y=0 as the
// front of the home (street-facing), which matches the visual top-down
// orientation people expect when reading a plan.
//
// Two render modes:
//   variant="thumb" → for the gallery card (no margins, no labels, dense look)
//   variant="full"  → for detail panel + map overlay (with labels & decks)

import { useMemo } from "react";
import AbsoluteFloorPlanSvg, {
  renderAbsoluteSvgString,
} from "./plans/AbsoluteFloorPlan";

const ROOM_COLORS = {
  default: "#fefdf9",
  small: "#f5f0e6",
  porch: "#eef5e9",
  deck: "#cfe7c0",
};

export default function FloorPlanSvg({
  plan,
  variant = "full",
  showLabels = true,
  showDecks = true,
  showDimensions = true,
  className = "",
  ariaLabel,
}) {
  // Delegate to per-plan custom renderer when available.
  if (plan.customRenderer === "absolute") {
    return (
      <AbsoluteFloorPlanSvg
        variant={variant}
        showLabels={showLabels}
        showDecks={showDecks}
        showDimensions={showDimensions}
        className={className}
        ariaLabel={ariaLabel}
      />
    );
  }

  const { width, depth, layout } = plan;

  // Add margin around for decks + dimension text in full variant
  const padFront = showDecks ? 5 : 0;
  const padBack = showDecks ? 6 : 0;
  const padSide = variant === "full" ? 4 : 1;
  const vbX = -padSide;
  const vbY = -padBack;
  const vbW = width + padSide * 2;
  const vbH = depth + padFront + padBack;

  const wallStroke = Math.max(0.35, Math.min(width, depth) / 60);
  const intStroke = wallStroke * 0.55;

  return (
    <svg
      className={`floorplan-svg ${className}`}
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <defs>
        <pattern
          id="fp-floor"
          width="2"
          height="0.6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(0)"
        >
          <rect width="2" height="0.6" fill="#fefdf9" />
          <line x1="0" y1="0" x2="0" y2="0.6" stroke="#e8e2d4" strokeWidth="0.06" />
        </pattern>
        <pattern
          id="fp-deck"
          width="1.5"
          height="0.4"
          patternUnits="userSpaceOnUse"
        >
          <rect width="1.5" height="0.4" fill="#cfe7c0" />
          <line x1="0" y1="0" x2="1.5" y2="0" stroke="#a8c997" strokeWidth="0.04" />
        </pattern>
      </defs>

      {/* Decks (front and back) */}
      {showDecks &&
        layout.decks?.map((d) => (
          <g key={d.id}>
            <rect
              x={d.x}
              y={d.y}
              width={d.w}
              height={d.d}
              fill="url(#fp-deck)"
              stroke="#6f9a55"
              strokeWidth={intStroke * 0.9}
              rx="0.2"
            />
            {showLabels && variant === "full" && (
              <DeckLabel deck={d} />
            )}
          </g>
        ))}

      {/* Outer footprint (exterior wall fill) */}
      <rect
        x={0}
        y={0}
        width={width}
        height={depth}
        fill="url(#fp-floor)"
      />

      {/* Rooms */}
      {layout.rooms.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.d}
            fill={
              r.isPorch
                ? ROOM_COLORS.porch
                : r.small
                ? ROOM_COLORS.small
                : ROOM_COLORS.default
            }
            stroke="#3a4d2c"
            strokeWidth={intStroke}
          />
          {showLabels && variant === "full" && (
            <RoomLabel room={r} />
          )}
        </g>
      ))}

      {/* Special fixtures: tub in bathroom + bed in bedroom (visual flair) */}
      {variant === "full" && <Fixtures plan={plan} />}

      {/* Doors with swing arcs */}
      {layout.doors?.map((d, i) => (
        <Door key={i} door={d} stroke={intStroke} />
      ))}

      {/* Outer perimeter wall on top */}
      <rect
        x={0}
        y={0}
        width={width}
        height={depth}
        fill="none"
        stroke="#1f2a18"
        strokeWidth={wallStroke}
        strokeLinejoin="miter"
      />

      {/* Outer dimensions */}
      {showDimensions && variant === "full" && (
        <Dimensions width={width} depth={depth} />
      )}
    </svg>
  );
}

/* ---------- subcomponents ---------- */

function RoomLabel({ room }) {
  const cx = room.x + room.w / 2;
  const cy = room.y + room.d / 2;
  const fontSize = Math.max(
    0.7,
    Math.min(room.w, room.d) / (room.label.length > 8 ? 6 : 4.5)
  );
  return (
    <g pointerEvents="none">
      <text
        x={cx}
        y={cy - fontSize * 0.3}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill="#1f2a18"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.04em"
      >
        {room.label}
      </text>
      {!room.small && (
        <text
          x={cx}
          y={cy + fontSize * 0.95}
          textAnchor="middle"
          fontSize={fontSize * 0.78}
          fill="#5b6b48"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {room.sqft} SF
        </text>
      )}
    </g>
  );
}

function DeckLabel({ deck }) {
  const cx = deck.x + deck.w / 2;
  const cy = deck.y + deck.d / 2;
  const fontSize = Math.max(0.7, Math.min(deck.w, deck.d) / 4);
  return (
    <g pointerEvents="none">
      <text
        x={cx}
        y={cy - fontSize * 0.2}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill="#2f4520"
        letterSpacing="0.06em"
      >
        {deck.label}
      </text>
      <text
        x={cx}
        y={cy + fontSize * 0.95}
        textAnchor="middle"
        fontSize={fontSize * 0.78}
        fill="#3a5028"
      >
        {deck.sqft} SF
      </text>
    </g>
  );
}

function Door({ door, stroke }) {
  // Draw a small swing arc + door panel near (door.x, door.y)
  const r = 2.2;
  let path = "";
  let panelStart = [door.x, door.y];
  let panelEnd = [door.x, door.y];

  switch (door.facing) {
    case "south":
      path = `M ${door.x} ${door.y} a ${r} ${r} 0 0 1 ${r} ${r}`;
      panelEnd = [door.x + r, door.y];
      break;
    case "north":
      path = `M ${door.x} ${door.y} a ${r} ${r} 0 0 0 ${r} ${-r}`;
      panelEnd = [door.x + r, door.y];
      break;
    case "east":
      path = `M ${door.x} ${door.y} a ${r} ${r} 0 0 0 ${r} ${r}`;
      panelEnd = [door.x, door.y + r];
      break;
    case "west":
      path = `M ${door.x} ${door.y} a ${r} ${r} 0 0 1 ${-r} ${r}`;
      panelEnd = [door.x, door.y + r];
      break;
    default:
      break;
  }
  return (
    <g pointerEvents="none">
      <path
        d={path}
        fill="none"
        stroke="#94a37d"
        strokeWidth={stroke * 0.7}
        strokeDasharray="0.25 0.2"
      />
      <line
        x1={panelStart[0]}
        y1={panelStart[1]}
        x2={panelEnd[0]}
        y2={panelEnd[1]}
        stroke="#3a4d2c"
        strokeWidth={stroke * 1.2}
      />
    </g>
  );
}

function Fixtures({ plan }) {
  const bath = plan.layout.rooms.find((r) =>
    r.label.toLowerCase().includes("bath")
  );
  const bed = plan.layout.rooms.find(
    (r) => r.label.toLowerCase() === "bedroom" || r.label.toLowerCase().startsWith("bedroom")
  );
  const kitchen = plan.layout.rooms.find((r) =>
    r.label.toLowerCase().startsWith("kitchen")
  );
  return (
    <g pointerEvents="none">
      {bath && <Tub room={bath} />}
      {bed && <Bed room={bed} />}
      {kitchen && <KitchenIsland room={kitchen} />}
    </g>
  );
}

function Tub({ room }) {
  // Tub along longer wall
  const horizontal = room.w >= room.d;
  const inset = 0.3;
  const tx = room.x + inset;
  const ty = room.y + inset;
  const tw = horizontal ? room.w - inset * 2 : Math.min(room.w - inset * 2, 2.5);
  const td = horizontal ? Math.min(room.d - inset * 2, 2.5) : room.d - inset * 2;
  return (
    <g>
      <rect
        x={tx}
        y={ty}
        width={tw}
        height={td}
        rx="0.4"
        fill="#eaf2fa"
        stroke="#7c95ad"
        strokeWidth="0.08"
      />
      <ellipse
        cx={tx + tw / 2}
        cy={ty + td / 2}
        rx={tw / 2 - 0.25}
        ry={td / 2 - 0.25}
        fill="#ffffff"
        stroke="#7c95ad"
        strokeWidth="0.06"
      />
    </g>
  );
}

function Bed({ room }) {
  // Place bed against the top wall of the bedroom
  const bw = Math.min(room.w * 0.7, 5);
  const bd = Math.min(room.d * 0.45, 6);
  const bx = room.x + (room.w - bw) / 2;
  const by = room.y + 0.4;
  return (
    <g>
      <rect
        x={bx}
        y={by}
        width={bw}
        height={bd}
        rx="0.3"
        fill="#f6ecd8"
        stroke="#8a6f3c"
        strokeWidth="0.08"
      />
      {/* pillow */}
      <rect
        x={bx + 0.4}
        y={by + 0.3}
        width={bw - 0.8}
        height={bd * 0.22}
        rx="0.15"
        fill="#ffffff"
        stroke="#bba37a"
        strokeWidth="0.05"
      />
    </g>
  );
}

function KitchenIsland({ room }) {
  if (room.w < 5 || room.d < 5) return null;
  const iw = Math.min(room.w * 0.55, 5);
  const id = Math.min(room.d * 0.25, 2);
  const ix = room.x + (room.w - iw) / 2;
  const iy = room.y + (room.d - id) / 2;
  return (
    <rect
      x={ix}
      y={iy}
      width={iw}
      height={id}
      rx="0.15"
      fill="#fff7e6"
      stroke="#7a5d2e"
      strokeWidth="0.07"
    />
  );
}

function Dimensions({ width, depth }) {
  return (
    <g pointerEvents="none">
      {/* Top width dimension */}
      <line
        x1={0}
        y1={-3}
        x2={width}
        y2={-3}
        stroke="#3a4d2c"
        strokeWidth="0.08"
      />
      <line x1={0} y1={-3.4} x2={0} y2={-2.6} stroke="#3a4d2c" strokeWidth="0.08" />
      <line x1={width} y1={-3.4} x2={width} y2={-2.6} stroke="#3a4d2c" strokeWidth="0.08" />
      <text
        x={width / 2}
        y={-3.5}
        textAnchor="middle"
        fontSize="1.4"
        fontWeight="700"
        fill="#1f2a18"
      >
        {width}&apos; - 0&quot;
      </text>

      {/* Right depth dimension */}
      <line
        x1={width + 3}
        y1={0}
        x2={width + 3}
        y2={depth}
        stroke="#3a4d2c"
        strokeWidth="0.08"
      />
      <line x1={width + 2.6} y1={0} x2={width + 3.4} y2={0} stroke="#3a4d2c" strokeWidth="0.08" />
      <line
        x1={width + 2.6}
        y1={depth}
        x2={width + 3.4}
        y2={depth}
        stroke="#3a4d2c"
        strokeWidth="0.08"
      />
      <text
        x={width + 3.7}
        y={depth / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize="1.4"
        fontWeight="700"
        fill="#1f2a18"
      >
        {depth}&apos; - 0&quot;
      </text>
    </g>
  );
}

/* ---------- helper for serializing the SVG to a data URL (used by map overlay) ---------- */

export function useFloorPlanDataUrl(plan) {
  return useMemo(() => {
    if (!plan) return null;
    const svgString = renderFloorPlanSvgString(plan);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }, [plan?.id]);
}

// Server-style renderer used for image source on the map.
// Mirrors the React variant. Per-plan custom renderers are delegated.
export function renderFloorPlanSvgString(plan) {
  if (plan.customRenderer === "absolute") {
    return renderAbsoluteSvgString({ withDecks: true });
  }
  const { width, depth, layout } = plan;
  const wallStroke = Math.max(0.35, Math.min(width, depth) / 60);
  const intStroke = wallStroke * 0.55;

  const rooms = layout.rooms
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.d}" fill="${
          r.isPorch ? "#eef5e9" : r.small ? "#f5f0e6" : "#fefdf9"
        }" stroke="#3a4d2c" stroke-width="${intStroke}"/>` +
        roomLabelString(r)
    )
    .join("");

  const doors = (layout.doors || [])
    .map((d) => doorString(d, intStroke))
    .join("");

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${depth}" preserveAspectRatio="none">
  <defs>
    <pattern id="floor" width="2" height="0.6" patternUnits="userSpaceOnUse">
      <rect width="2" height="0.6" fill="#fefdf9"/>
      <line x1="0" y1="0" x2="0" y2="0.6" stroke="#e8e2d4" stroke-width="0.06"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="${width}" height="${depth}" fill="url(#floor)"/>
  ${rooms}
  ${doors}
  <rect x="0" y="0" width="${width}" height="${depth}" fill="none" stroke="#1f2a18" stroke-width="${wallStroke}"/>
</svg>`.trim();
}

function roomLabelString(r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.d / 2;
  const fs = Math.max(
    0.7,
    Math.min(r.w, r.d) / (r.label.length > 8 ? 6 : 4.5)
  );
  return (
    `<text x="${cx}" y="${cy - fs * 0.3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fs}" font-weight="700" fill="#1f2a18">${escapeXml(
      r.label
    )}</text>` +
    (r.small
      ? ""
      : `<text x="${cx}" y="${cy + fs * 0.95}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${
          fs * 0.78
        }" fill="#5b6b48">${r.sqft} SF</text>`)
  );
}

function doorString(d, stroke) {
  const r = 2.2;
  let path = "";
  let p2 = [d.x, d.y];
  switch (d.facing) {
    case "south":
      path = `M ${d.x} ${d.y} a ${r} ${r} 0 0 1 ${r} ${r}`;
      p2 = [d.x + r, d.y];
      break;
    case "north":
      path = `M ${d.x} ${d.y} a ${r} ${r} 0 0 0 ${r} ${-r}`;
      p2 = [d.x + r, d.y];
      break;
    case "east":
      path = `M ${d.x} ${d.y} a ${r} ${r} 0 0 0 ${r} ${r}`;
      p2 = [d.x, d.y + r];
      break;
    case "west":
      path = `M ${d.x} ${d.y} a ${r} ${r} 0 0 1 ${-r} ${r}`;
      p2 = [d.x, d.y + r];
      break;
  }
  return (
    `<path d="${path}" fill="none" stroke="#94a37d" stroke-width="${
      stroke * 0.7
    }" stroke-dasharray="0.25 0.2"/>` +
    `<line x1="${d.x}" y1="${d.y}" x2="${p2[0]}" y2="${p2[1]}" stroke="#3a4d2c" stroke-width="${
      stroke * 1.2
    }"/>`
  );
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}
