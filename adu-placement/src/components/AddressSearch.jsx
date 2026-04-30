import { useState } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function AddressSearch({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${encodeURIComponent(query)}.json` +
        `?access_token=${MAPBOX_TOKEN}` +
        `&limit=5&types=address`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.features || data.features.length === 0) {
        setError("No results found. Try a more specific address.");
      } else {
        setResults(data.features);
      }
    } catch (err) {
      setError("Search failed. Check your internet or token.");
    } finally {
      setLoading(false);
    }
  }

  function handlePick(feature) {
    const [lng, lat] = feature.center;
    onSelectLocation({
      lng,
      lat,
      placeName: feature.place_name,
    });
    setResults([]);
    setQuery(feature.place_name);
  }

  return (
    <div className="address-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter an address (e.g. 1600 Pennsylvania Ave NW, Washington DC)"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <ul className="results">
          {results.map((f) => (
            <li key={f.id} onClick={() => handlePick(f)}>
              {f.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
