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

  // ---- Live autocomplete (debounced) ----
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
    onSelectLocation({ lng, lat, placeName: feature.place_name });
    setQuery(feature.place_name);
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
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
          const placeName =
            data?.features?.[0]?.place_name ||
            `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
          onSelectLocation({ lng, lat, placeName });
          setQuery(placeName);
          setResults([]);
          setOpen(false);
        } catch {
          onSelectLocation({
            lng,
            lat,
            placeName: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
          });
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

  return (
    <div className="address-search" ref={wrapRef}>
      <div className="address-search-row">
        <div className="input-wrap">
          <span className="input-icon" aria-hidden="true">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing your address…"
            autoComplete="off"
            spellCheck="false"
          />
          {loading && <span className="input-spinner" aria-hidden="true" />}
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
              <span className="result-pin" aria-hidden="true">📍</span>
              <span className="result-text">
                <b>{f.text || f.place_name.split(",")[0]}</b>
                <span className="result-sub">
                  {f.place_name.replace(/^[^,]+,?\s*/, "")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
