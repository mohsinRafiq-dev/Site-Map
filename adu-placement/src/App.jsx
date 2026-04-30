import { useState } from "react";
import AddressSearch from "./components/AddressSearch";
import MapView from "./components/MapView";
import "./App.css";

export default function App() {
  const [location, setLocation] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>ADU Placement Tool</h1>
        <p className="phase-label">Phase 1: Address Search</p>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <h2>Step 1: Enter Address</h2>
          <AddressSearch onSelectLocation={setLocation} />

          {location && (
            <div className="selected-info">
              <h3>Selected:</h3>
              <p>{location.placeName}</p>
              <p className="coords">
                lat: {location.lat.toFixed(6)}, lng: {location.lng.toFixed(6)}
              </p>
            </div>
          )}
        </aside>

        <main className="map-wrapper">
          <MapView location={location} />
        </main>
      </div>
    </div>
  );
}
