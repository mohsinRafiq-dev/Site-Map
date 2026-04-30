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
