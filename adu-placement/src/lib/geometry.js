// Geometry helpers — feet/lng-lat conversion, rectangle creation,
// setback inset (rotation-aware), point-in-polygon validation.

const METERS_PER_FOOT = 0.3048;
const METERS_PER_DEG_LAT = 111320;

// Convert an offset in feet (x = east, y = north) to lng/lat degrees
// at a given latitude.
export function feetToLngLat(feetX, feetY, atLat) {
  const mX = feetX * METERS_PER_FOOT;
  const mY = feetY * METERS_PER_FOOT;
  const dLat = mY / METERS_PER_DEG_LAT;
  const dLng = mX / (METERS_PER_DEG_LAT * Math.cos((atLat * Math.PI) / 180));
  return [dLng, dLat];
}

// Build a rectangle GeoJSON Feature centered at `center`,
// width × height in feet, rotated by `rotationDeg`.
export function makeRectangle(center, widthFt, heightFt, rotationDeg = 0) {
  const [lng, lat] = center;
  const halfW = widthFt / 2;
  const halfH = heightFt / 2;
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const local = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ];

  const ring = local.map(([x, y]) => {
    const xr = x * cos - y * sin;
    const yr = x * sin + y * cos;
    const [dLng, dLat] = feetToLngLat(xr, yr, lat);
    return [lng + dLng, lat + dLat];
  });
  ring.push(ring[0]);

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: {},
  };
}

// Inset a (possibly rotated) rectangular lot by per-side setbacks (ft),
// where front/back/left/right are relative to the lot's orientation.
// Returns the inner buildable area as a GeoJSON Feature.
export function applySetbacksToRect(
  center,
  widthFt,
  lengthFt,
  rotationDeg,
  setbacks
) {
  const newWidth = widthFt - setbacks.left - setbacks.right;
  const newLength = lengthFt - setbacks.front - setbacks.back;
  if (newWidth <= 0 || newLength <= 0) return null;

  // Local-coord shift: x = east (right), y = north (front)
  const dxLocal = (setbacks.left - setbacks.right) / 2;
  const dyLocal = (setbacks.back - setbacks.front) / 2;

  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dxRot = dxLocal * cos - dyLocal * sin;
  const dyRot = dxLocal * sin + dyLocal * cos;

  const [lng, lat] = center;
  const [dLng, dLat] = feetToLngLat(dxRot, dyRot, lat);
  const newCenter = [lng + dLng, lat + dLat];

  return makeRectangle(newCenter, newWidth, newLength, rotationDeg);
}

// Ray-casting point in polygon test.
export function pointInPolygon(point, polygonFeature) {
  const [x, y] = point;
  const ring = polygonFeature.geometry.coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// True iff every corner of `inner` lies inside `outer`.
export function isFootprintInside(inner, outer) {
  const ring = inner.geometry.coordinates[0];
  for (let i = 0; i < ring.length - 1; i++) {
    if (!pointInPolygon(ring[i], outer)) return false;
  }
  return true;
}

// Compute centroid of a polygon (average of corners excluding closing).
export function polygonCenter(feature) {
  const ring = feature.geometry.coordinates[0];
  let cx = 0;
  let cy = 0;
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    cx += ring[i][0];
    cy += ring[i][1];
  }
  return [cx / n, cy / n];
}

// ---- Lot-local feet conversion (axis-aligned space inside the lot) ----
//
// Convert a world lng/lat point into lot-local FEET coordinates,
// where +x is "right along the lot's width" and +y is "up along the lot's depth".
// In this space the lot is centered on the origin and axis-aligned, which
// makes setback clamping a trivial bounding-box operation.
const M_PER_FOOT = 0.3048;
const M_PER_DEG_LAT = 111320;

export function worldToLotLocalFeet(point, lotCenter, lotRotationDeg) {
  const [lng, lat] = point;
  const [lngC, latC] = lotCenter;
  const dLng = lng - lngC;
  const dLat = lat - latC;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((latC * Math.PI) / 180);
  const fx = (dLng * mPerDegLng) / M_PER_FOOT;
  const fy = (dLat * M_PER_DEG_LAT) / M_PER_FOOT;
  // Un-rotate by lot rotation
  const rad = (-lotRotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [fx * cos - fy * sin, fx * sin + fy * cos];
}

export function lotLocalFeetToWorld(localPt, lotCenter, lotRotationDeg) {
  const [lx, ly] = localPt;
  // Rotate forward by lot rotation
  const rad = (lotRotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const fx = lx * cos - ly * sin;
  const fy = lx * sin + ly * cos;
  // Convert feet back to lng/lat
  const [lngC, latC] = lotCenter;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((latC * Math.PI) / 180);
  const dLng = (fx * M_PER_FOOT) / mPerDegLng;
  const dLat = (fy * M_PER_FOOT) / M_PER_DEG_LAT;
  return [lngC + dLng, latC + dLat];
}

// Half-extents of an axis-aligned bounding box around a rotated W x D rectangle.
export function rotatedAabbHalf(widthFt, depthFt, rotationDeg) {
  const rad = (rotationDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const halfW = widthFt / 2;
  const halfD = depthFt / 2;
  return {
    halfX: halfW * c + halfD * s,
    halfY: halfW * s + halfD * c,
  };
}

// Clamp a proposed footprint center (in world lng/lat) so that the
// AXIS-ALIGNED BOUNDING BOX of the rotated footprint lies entirely
// within the buildable area defined by `setbacks` inside the lot.
//
// Returns { center: [lng, lat], snapped: { left, right, front, back } } where
// `snapped.*` flags indicate which edge(s) the clamp pinned the footprint to.
// If the footprint is too big to fit, returns { center: input, snapped: null }
// so the caller can show an "outside" warning instead of fighting the user.
export function clampFootprintToSetbacks({
  proposedCenter,
  footprintWidth,
  footprintDepth,
  footprintRotationDeg,
  lot,
  setbacks,
}) {
  if (!lot || !lot.center || !setbacks) {
    return { center: proposedCenter, snapped: null };
  }

  // Buildable area (axis-aligned in lot-local feet)
  const bWidth = lot.width - setbacks.left - setbacks.right;
  const bDepth = lot.length - setbacks.front - setbacks.back;
  if (bWidth <= 0 || bDepth <= 0) {
    return { center: proposedCenter, snapped: null };
  }

  // Buildable center is offset because front/back/left/right may be unequal.
  // Match the convention in applySetbacksToRect:
  //   x = east (right), y = north (front of lot)
  const bcx = (setbacks.left - setbacks.right) / 2;
  const bcy = (setbacks.back - setbacks.front) / 2;
  const bHalfX = bWidth / 2;
  const bHalfY = bDepth / 2;

  // Footprint AABB half (relative to lot frame)
  const fpRotInLot = footprintRotationDeg - lot.rotation;
  const { halfX: fHalfX, halfY: fHalfY } = rotatedAabbHalf(
    footprintWidth,
    footprintDepth,
    fpRotInLot
  );

  // Plan is bigger than the buildable area in some axis. Fall back to
  // clamping inside the LOT itself so the home at least stays on the
  // property — the validation badge will still flag "outside buildable
  // area" which is the user-visible signal that they need to reduce
  // setbacks or pick a smaller plan.
  if (fHalfX > bHalfX || fHalfY > bHalfY) {
    const lotHalfX = lot.width / 2;
    const lotHalfY = lot.length / 2;
    // If the plan is bigger than the lot itself, we genuinely can't help —
    // return the proposed center untouched.
    if (fHalfX > lotHalfX || fHalfY > lotHalfY) {
      return { center: proposedCenter, snapped: null };
    }
    const lminX = -lotHalfX + fHalfX;
    const lmaxX = lotHalfX - fHalfX;
    const lminY = -lotHalfY + fHalfY;
    const lmaxY = lotHalfY - fHalfY;
    const lLocal = worldToLotLocalFeet(proposedCenter, lot.center, lot.rotation);
    const cx = Math.max(lminX, Math.min(lmaxX, lLocal[0]));
    const cy = Math.max(lminY, Math.min(lmaxY, lLocal[1]));
    const lWorld = lotLocalFeetToWorld([cx, cy], lot.center, lot.rotation);
    return { center: lWorld, snapped: null };
  }

  const minX = bcx - bHalfX + fHalfX;
  const maxX = bcx + bHalfX - fHalfX;
  const minY = bcy - bHalfY + fHalfY;
  const maxY = bcy + bHalfY - fHalfY;

  const local = worldToLotLocalFeet(proposedCenter, lot.center, lot.rotation);
  const clampedX = Math.max(minX, Math.min(maxX, local[0]));
  const clampedY = Math.max(minY, Math.min(maxY, local[1]));

  const snapped = {
    left: clampedX === minX,
    right: clampedX === maxX,
    front: clampedY === minY,
    back: clampedY === maxY,
  };

  // If nothing changed, no snap occurred
  const moved = clampedX !== local[0] || clampedY !== local[1];

  const world = lotLocalFeetToWorld(
    [clampedX, clampedY],
    lot.center,
    lot.rotation
  );
  return { center: world, snapped: moved ? snapped : null };
}

// Compute confidence: distance (in feet) from each footprint corner to the
// nearest setback edge. Used by the Confidence Meter.
//   < 0  → outside buildable area
//   0..1 → tight (within 1 ft)
//   ≥1   → great
export function footprintFitMargin({
  footprintCenter,
  footprintWidth,
  footprintDepth,
  footprintRotationDeg,
  lot,
  setbacks,
}) {
  if (!lot || !lot.center || !setbacks) return null;

  const bWidth = lot.width - setbacks.left - setbacks.right;
  const bDepth = lot.length - setbacks.front - setbacks.back;
  if (bWidth <= 0 || bDepth <= 0) return -Infinity;

  const bcx = (setbacks.left - setbacks.right) / 2;
  const bcy = (setbacks.back - setbacks.front) / 2;

  const fpRotInLot = footprintRotationDeg - lot.rotation;
  const local = worldToLotLocalFeet(
    footprintCenter,
    lot.center,
    lot.rotation
  );

  // Build the footprint corners in lot-local feet
  const halfW = footprintWidth / 2;
  const halfD = footprintDepth / 2;
  const rad = (fpRotInLot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
  ].map(([x, y]) => [
    local[0] + x * cos - y * sin,
    local[1] + x * sin + y * cos,
  ]);

  // Distance from each corner to the nearest setback edge (negative = outside)
  let minMargin = Infinity;
  const minX = bcx - bWidth / 2;
  const maxX = bcx + bWidth / 2;
  const minY = bcy - bDepth / 2;
  const maxY = bcy + bDepth / 2;
  for (const [x, y] of corners) {
    const m = Math.min(x - minX, maxX - x, y - minY, maxY - y);
    if (m < minMargin) minMargin = m;
  }
  // Floating-point precision from world ↔ lot-local round trips can leave
  // a corner that's been snapped exactly ON the setback line reading as
  // -0.0003 ft instead of 0. Treat anything within 1 cm of the line as
  // exactly on it — touching the setback is a valid placement in real
  // construction, not "outside by 0.0 ft".
  if (minMargin < 0 && minMargin > -0.033) minMargin = 0;
  return minMargin;
}

// Where a newly-dropped home should start. The geocoded address almost always
// sits on the EXISTING house, so centering the ADU there drops it on the roof.
// Instead we place it toward the REAR of the buildable area (the backyard side —
// +y is north / "up", which is how a homeowner reads "backyard" on a north-up
// map). We propose a point deep past the rear edge and let the setback clamp
// pin it to the back of the buildable area, correctly accounting for footprint
// size, rotation and uneven setbacks.
export function rearBuildableCenter({
  lot,
  setbacks,
  footprintWidth,
  footprintDepth,
  footprintRotationDeg = 0,
}) {
  if (!lot || !lot.center || !setbacks) return lot?.center ?? null;
  const rearProposed = lotLocalFeetToWorld(
    [0, lot.length], // deep toward the rear; clamp pins it to the back setback
    lot.center,
    lot.rotation || 0
  );
  const { center } = clampFootprintToSetbacks({
    proposedCenter: rearProposed,
    footprintWidth,
    footprintDepth,
    footprintRotationDeg,
    lot,
    setbacks,
  });
  return center;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Arbitrary-polygon lot support — so a lot can be a trapezoid, pentagon, or any
   irregular shape (not just a rectangle). A polygon lot is stored as an array
   of [lng, lat] corners; these helpers build/offset/measure it.
   ═══════════════════════════════════════════════════════════════════════════ */

const FEET_PER_DEG = M_PER_DEG_LAT / M_PER_FOOT;

// The four corner [lng,lat]s of a rotated rectangle — same winding/order as
// makeRectangle. Used to seed a polygon from the current rectangle lot.
export function rectCorners(center, widthFt, heightFt, rotationDeg = 0) {
  const [lng, lat] = center;
  const halfW = widthFt / 2;
  const halfH = heightFt / 2;
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ].map(([x, y]) => {
    const xr = x * cos - y * sin;
    const yr = x * sin + y * cos;
    const [dLng, dLat] = feetToLngLat(xr, yr, lat);
    return [lng + dLng, lat + dLat];
  });
}

// GeoJSON polygon Feature from [lng,lat] corners (auto-closes the ring).
export function polygonFeature(corners) {
  const ring = corners.map((c) => [c[0], c[1]]);
  ring.push(ring[0]);
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: {} };
}

// Average of the corners (used as the polygon's center / pivot).
export function cornersCentroid(corners) {
  let x = 0;
  let y = 0;
  for (const c of corners) {
    x += c[0];
    y += c[1];
  }
  return [x / corners.length, y / corners.length];
}

// Polygon area in square feet (shoelace, on the centered feet frame).
export function polygonAreaSqFt(corners) {
  const c = cornersCentroid(corners);
  const p = cornersToFeet(corners, c);
  let a2 = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a2 += p[i][0] * q[1] - q[0] * p[i][1];
  }
  return Math.abs(a2) / 2;
}

// Oriented bounding-box dimensions (ft) of a polygon, measured in the lot's own
// frame (rotated by `rotationDeg`) — an approximate "W × L" for irregular lots.
export function polygonBoundsFeet(corners, rotationDeg = 0) {
  const c = cornersCentroid(corners);
  const R = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(R);
  const sin = Math.sin(R);
  const coslat = Math.cos((c[1] * Math.PI) / 180) || 1;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [lng, lat] of corners) {
    const ex = (lng - c[0]) * coslat * FEET_PER_DEG;
    const ny = (lat - c[1]) * FEET_PER_DEG;
    const x = ex * cos - ny * sin;
    const y = ex * sin + ny * cos;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { w: maxX - minX, l: maxY - minY };
}

// ── centered feet ENU frame (origin at the polygon centroid) ─────────────────
function cornersToFeet(corners, c) {
  const coslat = Math.cos((c[1] * Math.PI) / 180) || 1;
  return corners.map(([lng, lat]) => [
    (lng - c[0]) * coslat * FEET_PER_DEG,
    (lat - c[1]) * FEET_PER_DEG,
  ]);
}
function feetToCorners(pts, c) {
  const coslat = Math.cos((c[1] * Math.PI) / 180) || 1;
  return pts.map(([x, y]) => [c[0] + x / (coslat * FEET_PER_DEG), c[1] + y / FEET_PER_DEG]);
}
function lineIntersect(L1, L2, fallback) {
  const denom = L1.dx * L2.dy - L1.dy * L2.dx;
  if (Math.abs(denom) < 1e-9) return fallback; // parallel
  const t = ((L2.px - L1.px) * L2.dy - (L2.py - L1.py) * L2.dx) / denom;
  return [L1.px + t * L1.dx, L1.py + t * L1.dy];
}

// Ray-cast point-in-polygon on a centered-feet ring.
function insideFeet(p, ring) {
  let ins = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      ins = !ins;
    }
  }
  return ins;
}

// Distance from point p to segment a→b (feet frame).
function distToSeg(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}

// Inset a polygon lot inward by per-side setbacks → the buildable area.
// Each edge is offset inward (by the setback for the direction it FACES:
// front/back/left/right relative to the lot's `rotationDeg`), and adjacent
// offset edges are intersected to form the new corners. Inward normals come
// from the polygon WINDING (correct even for concave lots), and any offset
// vertex that would escape the lot (a miter spike at a reflex corner) is pulled
// back inside — so the buildable line never crosses outside the lot.
export function offsetLotPolygon(corners, setbacks, rotationDeg = 0) {
  if (!corners || corners.length < 3) return corners;
  const c = cornersCentroid(corners);
  const pts = cornersToFeet(corners, c);
  const n = pts.length;

  // Winding: CCW when signed area > 0 → interior is to the LEFT of each edge.
  let area2 = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  const ccw = area2 > 0;

  const R = (rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(R);
  const sinR = Math.sin(R);
  const frontDir = [-sinR, cosR];
  const rightDir = [cosR, sinR];
  const setbackForOutward = (ox, oy) => {
    const f = ox * frontDir[0] + oy * frontDir[1];
    const r = ox * rightDir[0] + oy * rightDir[1];
    const opts = [
      { v: f, s: setbacks.front },
      { v: -f, s: setbacks.back },
      { v: r, s: setbacks.right },
      { v: -r, s: setbacks.left },
    ];
    opts.sort((a, b) => b.v - a.v);
    return opts[0].s;
  };

  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    // inward normal from winding (consistent for concave polygons)
    const nx = ccw ? -dy : dy;
    const ny = ccw ? dx : -dx;
    const d = setbackForOutward(-nx, -ny);
    lines.push({ px: a[0] + nx * d, py: a[1] + ny * d, dx, dy, nx, ny, d });
  }

  const out = [];
  for (let i = 0; i < n; i++) {
    const L1 = lines[(i - 1 + n) % n];
    const L2 = lines[i];
    let p = lineIntersect(L1, L2, null);
    // Reflex corner / parallel edges: miter escapes the lot. Fall back to
    // offsetting the vertex along the average inward normal, which stays inside.
    if (!p || !insideFeet(p, pts)) {
      const v = pts[i];
      let bx = L1.nx + L2.nx;
      let by = L1.ny + L2.ny;
      const bl = Math.hypot(bx, by) || 1;
      bx /= bl;
      by /= bl;
      const dd = Math.max(L1.d, L2.d);
      p = [v[0] + bx * dd, v[1] + by * dd];
    }
    out.push(p);
  }
  return feetToCorners(out, c);
}

// Min signed clearance (ft) from a footprint (its 4 corners) to a buildable
// polygon: ≥0 inside, <0 outside. Robust for concave polygons — uses an
// inside/outside test plus true distance to the nearest boundary segment.
export function polygonFitMargin(footprintCorners, buildableCorners) {
  if (!buildableCorners || buildableCorners.length < 3) return -Infinity;
  const c = cornersCentroid(buildableCorners);
  const bl = cornersToFeet(buildableCorners, c);
  const fl = cornersToFeet(footprintCorners, c);
  const n = bl.length;

  let minMargin = Infinity;
  for (const p of fl) {
    let nearest = Infinity;
    for (let i = 0; i < n; i++) {
      const dseg = distToSeg(p, bl[i], bl[(i + 1) % n]);
      if (dseg < nearest) nearest = dseg;
    }
    const m = insideFeet(p, bl) ? nearest : -nearest;
    if (m < minMargin) minMargin = m;
  }
  if (minMargin < 0 && minMargin > -0.033) minMargin = 0;
  return minMargin;
}
