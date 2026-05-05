import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { polygonCenter } from "../lib/geometry";
import { renderFloorPlanSvgString } from "./FloorPlanSvg";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const LOT_SRC = "lot-src";
const LOT_FILL = "lot-fill";
const LOT_LINE = "lot-line";
const SB_SRC = "sb-src";
const SB_LINE = "sb-line";
const FP_SRC = "fp-src";
const FP_FILL = "fp-fill";
const FP_LINE = "fp-line";
const FP_IMG_SRC = "fp-img-src";
const FP_IMG_LAYER = "fp-img-layer";

const MARKER_HIDE_MS = 7000;
const PIXELS_PER_FOOT = 24; // raster resolution for the SVG → PNG conversion

const MapView = forwardRef(function MapView(
  {
    location,
    lotFeature,
    lotConfirmed,
    setbackFeature,
    footprintFeature,
    floorPlan,
    isValid,
    onDragLot,
    onDragFootprint,
  },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const styleReadyRef = useRef(false);
  const currentImagePlanIdRef = useRef(null);

  // Stable refs to latest props for inside event listeners
  const lotFeatureRef = useRef(lotFeature);
  const footprintFeatureRef = useRef(footprintFeature);
  const lotConfirmedRef = useRef(lotConfirmed);
  const onDragLotRef = useRef(onDragLot);
  const onDragFpRef = useRef(onDragFootprint);

  useEffect(() => {
    lotFeatureRef.current = lotFeature;
  }, [lotFeature]);
  useEffect(() => {
    footprintFeatureRef.current = footprintFeature;
  }, [footprintFeature]);
  useEffect(() => {
    lotConfirmedRef.current = lotConfirmed;
  }, [lotConfirmed]);
  useEffect(() => {
    onDragLotRef.current = onDragLot;
  }, [onDragLot]);
  useEffect(() => {
    onDragFpRef.current = onDragFootprint;
  }, [onDragFootprint]);

  // ------- Init map (once) -------
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 3,
      preserveDrawingBuffer: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.ScaleControl({ unit: "imperial" }),
      "bottom-left"
    );

    map.on("load", () => {
      styleReadyRef.current = true;

      map.addSource(LOT_SRC, emptyFC());
      map.addSource(SB_SRC, emptyFC());
      map.addSource(FP_SRC, emptyFC());

      map.addLayer({
        id: LOT_FILL,
        type: "fill",
        source: LOT_SRC,
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.18 },
      });
      map.addLayer({
        id: LOT_LINE,
        type: "line",
        source: LOT_SRC,
        paint: { "line-color": "#3b82f6", "line-width": 2 },
      });
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
      // FP_FILL is now mostly used as a click target + invalid-state warning tint.
      // The visual representation comes from the FP_IMG_LAYER (SVG floor plan).
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
          "fill-opacity": [
            "case",
            ["==", ["get", "valid"], true],
            0.0,
            0.35,
          ],
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
            "#3f7a3a",
            "#b91c1c",
          ],
          "line-width": 2.5,
        },
      });

      attachDrag(map, "lot");
      attachDrag(map, "fp");
    });

    return () => {
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
      currentImagePlanIdRef.current = null;
    };
  }, []);

  // ------- Imperative API for export -------
  useImperativeHandle(ref, () => ({
    exportAsPng: async (filename = "site-plan.png") => {
      const map = mapRef.current;
      if (!map) return;
      await new Promise((resolve) => {
        map.once("idle", resolve);
        map.triggerRepaint();
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
      drawTitleBar(ctx, w);
      const dataUrl = out.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    },
  }));

  // ------- Fly to location + auto-hide marker -------
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
      markerRef.current.remove();
      markerRef.current = null;
    }
    const el = document.createElement("div");
    el.className = "pin-marker";
    markerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([location.lng, location.lat])
      .addTo(map);

    const fadeTimer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.getElement().classList.add("pin-marker-fading");
      }
    }, MARKER_HIDE_MS - 400);

    const removeTimer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }, MARKER_HIDE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [location]);

  // ------- Sync sources to React state -------
  useEffect(() => {
    syncWhenReady(LOT_SRC, lotFeature);
  }, [lotFeature]);

  useEffect(() => {
    syncWhenReady(SB_SRC, setbackFeature);
  }, [setbackFeature]);

  useEffect(() => {
    const tagged = footprintFeature
      ? {
          ...footprintFeature,
          properties: { ...footprintFeature.properties, valid: !!isValid },
        }
      : null;
    syncWhenReady(FP_SRC, tagged);
  }, [footprintFeature, isValid]);

  // ------- Floor plan image overlay (the actual rendered floor plan as SVG → PNG) -------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => {
      // No floor plan: clear the overlay
      if (!floorPlan || !footprintFeature) {
        removeImageLayer(map);
        currentImagePlanIdRef.current = null;
        return;
      }

      const coords = imageCoordinatesFromFootprint(footprintFeature);
      if (!coords) return;

      // If same plan is already loaded, just reposition.
      if (currentImagePlanIdRef.current === floorPlan.id) {
        const src = map.getSource(FP_IMG_SRC);
        if (src && typeof src.setCoordinates === "function") {
          src.setCoordinates(coords);
        }
        return;
      }

      // Otherwise rasterize SVG → PNG and add as image source.
      rasterizeFloorPlan(floorPlan).then((pngUrl) => {
        if (!mapRef.current) return;
        removeImageLayer(map);
        try {
          map.addSource(FP_IMG_SRC, {
            type: "image",
            url: pngUrl,
            coordinates: coords,
          });
          // Place the image layer just under the outline so the line stays on top
          const beforeId = map.getLayer(FP_LINE) ? FP_LINE : undefined;
          map.addLayer(
            {
              id: FP_IMG_LAYER,
              type: "raster",
              source: FP_IMG_SRC,
              paint: {
                "raster-opacity": 0.95,
                "raster-fade-duration": 0,
                "raster-resampling": "linear",
              },
            },
            beforeId
          );
          currentImagePlanIdRef.current = floorPlan.id;
        } catch (err) {
          console.warn("Failed to add floor plan overlay", err);
        }
      });
    };

    if (!styleReadyRef.current) {
      map.once("load", run);
    } else {
      run();
    }
  }, [floorPlan, footprintFeature]);

  function syncWhenReady(srcId, feature) {
    const map = mapRef.current;
    if (!map) return;
    if (!styleReadyRef.current) {
      map.once("load", () => syncSrc(map, srcId, feature));
      return;
    }
    syncSrc(map, srcId, feature);
  }

  // ------- Drag handlers (attached once at load) -------
  function attachDrag(map, kind) {
    const layerId = kind === "lot" ? LOT_FILL : FP_FILL;
    let dragState = null;

    function isInteractive() {
      if (kind === "lot") {
        return !lotConfirmedRef.current && !!lotFeatureRef.current;
      }
      return lotConfirmedRef.current && !!footprintFeatureRef.current;
    }

    function getFeature() {
      return kind === "lot"
        ? lotFeatureRef.current
        : footprintFeatureRef.current;
    }

    function onDrag(newCenter) {
      const cb = kind === "lot" ? onDragLotRef.current : onDragFpRef.current;
      cb?.(newCenter);
    }

    map.on("mouseenter", layerId, () => {
      if (isInteractive()) map.getCanvas().style.cursor = "grab";
    });
    map.on("mouseleave", layerId, () => {
      if (!dragState) map.getCanvas().style.cursor = "";
    });
    map.on("mousedown", layerId, (e) => {
      if (!isInteractive()) return;

      if (kind === "lot") {
        const onTop = map.queryRenderedFeatures(e.point, {
          layers: [FP_FILL],
        });
        if (onTop.length > 0) return;
      }

      const feature = getFeature();
      if (!feature) return;

      e.preventDefault();
      const center = polygonCenter(feature);
      dragState = {
        startLngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat },
        centerStart: center,
      };
      map.getCanvas().style.cursor = "grabbing";

      function onMouseMove(ev) {
        if (!dragState) return;
        const dLng = ev.lngLat.lng - dragState.startLngLat.lng;
        const dLat = ev.lngLat.lat - dragState.startLngLat.lat;
        onDrag([
          dragState.centerStart[0] + dLng,
          dragState.centerStart[1] + dLat,
        ]);
      }
      function onMouseUp() {
        dragState = null;
        map.off("mousemove", onMouseMove);
        map.getCanvas().style.cursor = "";
      }

      map.on("mousemove", onMouseMove);
      map.once("mouseup", onMouseUp);
    });

    // Double-click on footprint overlay area = also draggable (image overlay does not block events)
    if (kind === "fp") {
      map.on("mousedown", FP_IMG_LAYER, () => {
        // no-op; event will already fire on FP_FILL beneath
      });
    }
  }

  return <div ref={containerRef} className="map-container" />;
});

export default MapView;

/* ---------- helpers ---------- */
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

function removeImageLayer(map) {
  if (map.getLayer(FP_IMG_LAYER)) map.removeLayer(FP_IMG_LAYER);
  if (map.getSource(FP_IMG_SRC)) map.removeSource(FP_IMG_SRC);
}

// Mapbox image source needs [TL, TR, BR, BL] in image-space orientation.
// Our footprint polygon ring is [SW, SE, NE, NW, SW] (rotation = 0).
// We treat image-top = "north" / back of the home in unrotated state, so:
//   TL = NW = ring[3]
//   TR = NE = ring[2]
//   BR = SE = ring[1]
//   BL = SW = ring[0]
function imageCoordinatesFromFootprint(feature) {
  if (!feature) return null;
  const ring = feature.geometry.coordinates[0];
  if (!ring || ring.length < 4) return null;
  return [ring[3], ring[2], ring[1], ring[0]];
}

// Rasterize the SVG floor plan into a high-resolution PNG dataURL.
// Mapbox's image source accepts dataURLs reliably as PNG.
function rasterizeFloorPlan(plan) {
  return new Promise((resolve, reject) => {
    const svg = renderFloorPlanSvgString(plan);
    const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(plan.width * PIXELS_PER_FOOT);
      canvas.height = Math.round(plan.depth * PIXELS_PER_FOOT);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = svgUrl;
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
  ctx.fillStyle = "rgba(31, 42, 24, 0.92)";
  ctx.fillRect(0, 0, w, 56);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("My Site Plan — FrameUpNow", 24, 28);
  ctx.font = "400 13px system-ui, sans-serif";
  ctx.fillStyle = "#cdd9c0";
  const stamp = new Date().toLocaleString();
  ctx.fillText(`Generated ${stamp}`, 24, 46);
  ctx.restore();
}
