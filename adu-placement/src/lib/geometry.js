// Geometry helpers — feet/lng-lat conversion, rectangle creation,
// setback inset, point-in-polygon validation.

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
// with width × height in feet, rotated by `rotationDeg`.
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

// Inset an axis-aligned rectangular lot by per-side setbacks (in feet).
// Returns the inner buildable area as a GeoJSON Feature.
export function applySetbacks(lotFeature, setbacks) {
  const ring = lotFeature.geometry.coordinates[0];
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const centerLat = (minLat + maxLat) / 2;
  const [dLngLeft] = feetToLngLat(setbacks.left, 0, centerLat);
  const [dLngRight] = feetToLngLat(setbacks.right, 0, centerLat);
  const [, dLatBack] = feetToLngLat(0, setbacks.back, centerLat);
  const [, dLatFront] = feetToLngLat(0, setbacks.front, centerLat);

  const inner = [
    [minLng + dLngLeft, minLat + dLatBack],
    [maxLng - dLngRight, minLat + dLatBack],
    [maxLng - dLngRight, maxLat - dLatFront],
    [minLng + dLngLeft, maxLat - dLatFront],
    [minLng + dLngLeft, minLat + dLatBack],
  ];

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [inner] },
    properties: {},
  };
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
