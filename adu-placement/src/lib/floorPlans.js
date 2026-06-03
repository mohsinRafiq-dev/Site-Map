// All plans are loaded from Firestore via usePlansCatalog().
// There are no hardcoded demo plans — run `npm run migrate` to upload plans.

export const BUILTIN_PLANS = [];

// Kept for backward-compat with any code that imports FLOOR_PLANS directly.
export const FLOOR_PLANS = [];

// Kept for backward-compat — returns null until Firestore plans are loaded.
export function getFloorPlanById(id) {
  return null;
}
