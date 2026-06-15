import { useEffect, useRef, useState } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DEBOUNCE_MS = 220;
const MIN_CHARS = 3;

export default function AddressSearch({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [geoBusy, setGeoBusy] = useState(false);

  const debounceRef = useRef(null);
  const aborterRef = useRef(null);
  const wrapRef = useRef(null);
  // When the user picks a suggestion (or hits "My location"), we set the
  // query field to the chosen place name. That state change would otherwise
  // re-trigger the debounced search and reopen the dropdown — this flag
  // tells the next search to no-op exactly once.
  const skipNextSearchRef = useRef(false);

  // ---- Live autocomplete (debounced) ----
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (!query || query.trim().length < MIN_CHARS) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ---- Outside click closes the dropdown ----
  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function runSearch(q) {
    setLoading(true);
    setError("");
    if (aborterRef.current) aborterRef.current.abort();
    const controller = new AbortController();
    aborterRef.current = controller;

    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${encodeURIComponent(q)}.json` +
        `?access_token=${MAPBOX_TOKEN}` +
        `&autocomplete=true` +
        `&limit=6` +
        `&types=address,place,locality,postcode,neighborhood`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      if (!data.features || data.features.length === 0) {
        setResults([]);
        setError("No matches. Try a fuller address or city.");
      } else {
        setResults(data.features);
        setOpen(true);
        setError("");
        setActiveIdx(-1);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError("Search failed. Check your internet or token.");
    } finally {
      setLoading(false);
    }
  }

  function handlePick(feature) {
    const [lng, lat] = feature.center;
    const { state, county } = extractRegion(feature);
    onSelectLocation({ lng, lat, placeName: feature.place_name, state, county });
    skipNextSearchRef.current = true;
    setQuery(feature.place_name);
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    if (aborterRef.current) aborterRef.current.abort();
  }

  function handleKeyDown(e) {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < results.length) {
        e.preventDefault();
        handlePick(results[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // ---- Use-my-location ----
  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by this browser.");
      return;
    }
    setGeoBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
            `${lng},${lat}.json` +
            `?access_token=${MAPBOX_TOKEN}` +
            `&types=address,place&limit=1`;
          const res = await fetch(url);
          const data = await res.json();
          const feature = data?.features?.[0];
          const placeName =
            feature?.place_name ||
            `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
          const { state, county } = feature ? extractRegion(feature) : {};
          onSelectLocation({ lng, lat, placeName, state, county });
          skipNextSearchRef.current = true;
          setQuery(placeName);
          setResults([]);
          setOpen(false);
        } catch {
          skipNextSearchRef.current = true;
          const fallback = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
          onSelectLocation({ lng, lat, placeName: fallback });
          setQuery(fallback);
          setResults([]);
          setOpen(false);
        } finally {
          setGeoBusy(false);
        }
      },
      (err) => {
        setGeoBusy(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Enable it in your browser to use this."
            : err.code === err.POSITION_UNAVAILABLE
            ? "Couldn't determine your position. Try again outside or with Wi-Fi on."
            : "Locating timed out. Try again.";
        setError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  const showHint = !query && !error && !loading;

  return (
    <div className="address-search" ref={wrapRef}>
      <div className="address-search-row">
        <div className="input-wrap">
          <span className="input-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Address, city, or ZIP code…"
            autoComplete="off"
            spellCheck="false"
          />
          {loading && <span className="input-spinner" aria-hidden="true" />}
          {!loading && query && (
            <button
              type="button"
              className="input-clear"
              onClick={() => {
                setQuery("");
                setResults([]);
                setOpen(false);
                setError("");
              }}
              aria-label="Clear search"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost geoloc-btn"
          onClick={useMyLocation}
          disabled={geoBusy}
          title="Use my current location"
        >
          {geoBusy ? (
            <span className="geoloc-loading">Locating…</span>
          ) : (
            <>
              <LocationIcon /> <span>My location</span>
            </>
          )}
        </button>
      </div>

      {showHint && (
        <p className="address-hint">
          <span className="address-hint-icon" aria-hidden="true">💡</span>
          Try a full street address for the best result — e.g.&nbsp;
          <em>1600 Pennsylvania Ave, Washington DC</em>.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {open && results.length > 0 && (
        <ul className="results" role="listbox">
          {results.map((f, i) => (
            <li
              key={f.id}
              role="option"
              aria-selected={i === activeIdx}
              className={i === activeIdx ? "active" : ""}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handlePick(f);
              }}
            >
              <span className="result-pin" aria-hidden="true">
                <PinIcon />
              </span>
              <span className="result-text">
                <b>{f.text || f.place_name.split(",")[0]}</b>
                <span className="result-sub">
                  {f.place_name.replace(/^[^,]+,?\s*/, "")}
                </span>
              </span>
              <span className="result-arrow" aria-hidden="true">↵</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Pull the US state (region) and county (district) out of a Mapbox feature's
// context, so we can pre-fill the request form. Falls back gracefully.
function extractRegion(feature) {
  const ctx = feature?.context || [];
  // The feature itself may BE a region/district when types are broad.
  const all = [...ctx, feature].filter(Boolean);
  const find = (prefix) => all.find((c) => typeof c?.id === "string" && c.id.startsWith(prefix));
  const region = find("region");
  const district = find("district");
  let county = district?.text || "";
  // Mapbox usually names counties "Los Angeles County" — keep as-is.
  return { state: region?.text || "", county };
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
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

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
