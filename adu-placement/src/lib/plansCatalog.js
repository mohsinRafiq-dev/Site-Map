// Firestore-backed plan catalog with a module-level cache.
//
// Strategy: load ALL plan metadata (~4,600 records) once on first use,
// keep it in memory for the session. This lets every filter/search/sort
// run instantly on the client with zero round-trips. Plan images are
// Firebase Storage URLs and are lazy-loaded by the browser as cards
// scroll into view — never bundled.
//
// Falls back to BUILTIN_PLANS (the 3 hand-authored demo plans) if
// Firestore is unreachable (network error, missing env vars, etc.).

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { BUILTIN_PLANS } from "./floorPlans";

// Module-level cache — persists across React re-renders without re-fetching.
let _cache = null;
let _inflight = null;

async function _load() {
  if (_cache) return _cache;
  if (_inflight) return _inflight;

  _inflight = (async () => {
    try {
      const q = query(
        collection(db, "plans"),
        orderBy("series"),
        orderBy("sqft")
      );
      const snap = await getDocs(q);
      const remote = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      // Builtin demo plans always sit at the front of the list.
      _cache = [...BUILTIN_PLANS, ...remote];
    } catch (err) {
      console.warn(
        "[FrameUpNow] Firestore unreachable — showing built-in plans only.",
        err.message
      );
      _cache = [...BUILTIN_PLANS];
    }
    return _cache;
  })();

  return _inflight;
}

// Kick off the fetch early (call from main.jsx) so the catalog arrives
// before the user reaches Step 3 — no loading spinner in most cases.
export function prefetchCatalog() {
  _load();
}

export function usePlansCatalog() {
  // If the cache is already warm (HMR reload or second mount) resolve instantly.
  const [plans, setPlans] = useState(_cache ?? BUILTIN_PLANS);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache !== null) {
      setPlans(_cache);
      setLoading(false);
      return;
    }
    let stale = false;
    _load()
      .then((p) => { if (!stale) { setPlans(p); setLoading(false); } })
      .catch((e) => { if (!stale) { setError(e); setLoading(false); } });
    return () => { stale = true; };
  }, []);

  function getById(id) {
    return (plans ?? BUILTIN_PLANS).find((p) => p.id === id) ?? null;
  }

  return { plans, loading, error, getById };
}

// Bust the cache (e.g. after an admin upload) and re-fetch on next hook use.
export function invalidateCatalog() {
  _cache = null;
  _inflight = null;
}
