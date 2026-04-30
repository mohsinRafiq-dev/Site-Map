import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ location }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-98.5795, 39.8283], // center of USA
      zoom: 3,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to the selected location whenever it changes
  useEffect(() => {
    if (!location || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 19,
      speed: 1.2,
      essential: true,
    });

    if (markerRef.current) {
      markerRef.current.setLngLat([location.lng, location.lat]);
    } else {
      markerRef.current = new mapboxgl.Marker({ color: "#e63946" })
        .setLngLat([location.lng, location.lat])
        .addTo(mapRef.current);
    }
  }, [location]);

  return <div ref={mapContainerRef} className="map-container" />;
}
