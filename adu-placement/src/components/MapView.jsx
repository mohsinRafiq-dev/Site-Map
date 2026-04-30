import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Source / layer ids
const LOT_SRC = "lot-src";
const LOT_FILL = "lot-fill";
const LOT_LINE = "lot-line";
const SB_SRC = "sb-src";
const SB_LINE = "sb-line";
const FP_SRC = "fp-src";
const FP_FILL = "fp-fill";
const FP_LINE = "fp-line";

const MapView = forwardRef(function MapView(
  {
    location,
    lotFeature,
    lotConfirmed,
    setbackFeature,
    footprintFeature,
    isValid,
    interactive,
    onDragFootprint,
  },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const styleReadyRef = useRef(false);
  const dragStateRef = useRef(null);

  // Stable refs to latest props for inside event listeners
  const footprintRef = useRef(footprintFeature);
  const onDragRef = useRef(onDragFootprint);
  const interactiveRef = useRef(interactive);
  useEffect(() => {
    footprintRef.current = footprintFeature;
  }, [footprintFeature]);
  useEffect(() => {
    onDragRef.current = onDragFootprint;
  }, [onDragFootprint]);
  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  // ------- Init map (once) -------
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 3,
      preserveDrawingBuffer: true, // required for image export
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "imperial" }), "bottom-left");

    map.on("load", () => {
      styleReadyRef.current = true;

      // sources
      map.addSource(LOT_SRC, emptyFC());
      map.addSource(SB_SRC, emptyFC());
      map.addSource(FP_SRC, emptyFC());

      // lot
      map.addLayer({
        id: LOT_FILL,
        type: "fill",
        source: LOT_SRC,
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: LOT_LINE,
        type: "line",
        source: LOT_SRC,
        paint: { "line-color": "#3b82f6", "line-width": 2 },
      });

      // setback (dashed yellow)
      map.addLayer({
        id: SB_LINE,
        type: "line",
        source: SB_SRC,
        paint: {
          "line-color": "#facc15",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });

      // footprint
      map.addLayer({
        id: FP_FILL,
        type: "fill",
        source: FP_SRC,
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "valid"], true],
            "#10b981",
            "#ef4444",
          ],
          "fill-opacity": 0.5,
        },
      });
      map.addLayer({
        id: FP_LINE,
        type: "line",
        source: FP_SRC,
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "valid"], true],
            "#047857",
            "#b91c1c",
          ],
          "line-width": 2.5,
        },
      });

      attachDragHandlers(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
    };
  }, []);

  // ------- Expose imperative API -------
  useImperativeHandle(ref, () => ({
    exportAsPng: async (filename = "site-plan.png") => {
      const map = mapRef.current;
      if (!map) return;
      // Make sure all tiles + layers are rendered first
      await new Promise((resolve) => {
        if (map.loaded() && map.areTilesLoaded()) {
          map.once("idle", resolve);
          map.triggerRepaint();
        } else {
          map.once("idle", resolve);
        }
      });
      const sourceCanvas = map.getCanvas();
      const w = sourceCanvas.width;
      const h = sourceCanvas.height;
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const ctx = out.getContext("2d");
      ctx.drawImage(sourceCanvas, 0, 0);
      drawNorthArrow(ctx, w, h);
      drawTitleBar(ctx, w, h);
      const dataUrl = out.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    },
  }));

  // ------- Fly to location -------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;
    map.flyTo({
      center: [location.lng, location.lat],
      zoom: 19,
      speed: 1.2,
      essential: true,
    });
    if (markerRef.current) {
      markerRef.current.setLngLat([location.lng, location.lat]);
    } else {
      markerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
    }
  }, [location]);

  // ------- Sync lot data -------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      const m = mapRef.current;
      if (m) m.once("load", () => syncSrc(m, LOT_SRC, lotFeature));
      return;
    }
    syncSrc(map, LOT_SRC, lotFeature);
  }, [lotFeature, lotConfirmed]);

  // ------- Sync setback data -------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!styleReadyRef.current) {
      map.once("load", () => syncSrc(map, SB_SRC, setbackFeature));
      return;
    }
    syncSrc(map, SB_SRC, setbackFeature);
  }, [setbackFeature]);

  // ------- Sync footprint data with validity property -------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const tagged = footprintFeature
      ? {
          ...footprintFeature,
          properties: { ...footprintFeature.properties, valid: !!isValid },
        }
      : null;
    if (!styleReadyRef.current) {
      map.once("load", () => syncSrc(map, FP_SRC, tagged));
      return;
    }
    syncSrc(map, FP_SRC, tagged);
  }, [footprintFeature, isValid]);

  // ------- Drag handlers (attached once at load) -------
  function attachDragHandlers(map) {
    function onMouseEnter() {
      if (!interactiveRef.current) return;
      map.getCanvas().style.cursor = "grab";
    }
    function onMouseLeave() {
      if (!dragStateRef.current) map.getCanvas().style.cursor = "";
    }
    function onMouseDown(e) {
      if (!interactiveRef.current || !footprintRef.current) return;
      e.preventDefault();
      const ring = footprintRef.current.geometry.coordinates[0];
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        cx += ring[i][0];
        cy += ring[i][1];
      }
      cx /= ring.length - 1;
      cy /= ring.length - 1;
      dragStateRef.current = {
        startLngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat },
        centerStart: [cx, cy],
      };
      map.getCanvas().style.cursor = "grabbing";
      map.on("mousemove", onMouseMove);
      map.once("mouseup", onMouseUp);
    }
    function onMouseMove(e) {
      const ds = dragStateRef.current;
      if (!ds) return;
      const dLng = e.lngLat.lng - ds.startLngLat.lng;
      const dLat = e.lngLat.lat - ds.startLngLat.lat;
      const next = [ds.centerStart[0] + dLng, ds.centerStart[1] + dLat];
      onDragRef.current?.(next);
    }
    function onMouseUp() {
      dragStateRef.current = null;
      map.off("mousemove", onMouseMove);
      map.getCanvas().style.cursor = "";
    }

    map.on("mouseenter", FP_FILL, onMouseEnter);
    map.on("mouseleave", FP_FILL, onMouseLeave);
    map.on("mousedown", FP_FILL, onMouseDown);
  }

  return <div ref={containerRef} className="map-container" />;
});

export default MapView;

// ---------- helpers ----------
function emptyFC() {
  return {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  };
}

function syncSrc(map, srcId, feature) {
  const src = map.getSource(srcId);
  if (!src) return;
  src.setData({
    type: "FeatureCollection",
    features: feature ? [feature] : [],
  });
}

function drawNorthArrow(ctx, w, h) {
  const cx = w - 70;
  const cy = h - 90;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 28);
  ctx.lineTo(cx - 12, cy + 16);
  ctx.lineTo(cx, cy + 8);
  ctx.lineTo(cx + 12, cy + 16);
  ctx.closePath();
  ctx.fill();
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", cx, cy + 24);
  ctx.restore();
}

function drawTitleBar(ctx, w) {
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(0, 0, w, 56);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("ADU Site Plan", 24, 28);
  ctx.font = "400 13px system-ui, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  const stamp = new Date().toLocaleString();
  ctx.fillText(`Generated ${stamp}`, 24, 46);
  ctx.restore();
}
