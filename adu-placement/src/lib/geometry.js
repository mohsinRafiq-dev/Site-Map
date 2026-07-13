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
