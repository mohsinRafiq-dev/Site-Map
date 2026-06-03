import {
  useEffect,
  useRef,
  useState,
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
const FP_GLOW = "fp-glow";
const FP_LINE = "fp-line";
const FP_IMG_SRC = "fp-img-src";
const FP_IMG_LAYER = "fp-img-layer";

const MARKER_HIDE_MS = 7000;
const PIXELS_PER_FOOT = 24; // raster resolution for the SVG → PNG conversion

const MAP_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12", // Real (satellite + labels)
  satelliteClean: "mapbox://styles/mapbox/satellite-v9",     // Real (no labels)
  streets: "mapbox://styles/mapbox/streets-v12",             // Default road map
  outdoors: "mapbox://styles/mapbox/outdoors-v12",           // Terrain / topo
  light: "mapbox://styles/mapbox/light-v11",                 // Light
  dark: "mapbox://styles/mapbox/dark-v11",                   // Dark
  navDay: "mapbox://styles/mapbox/navigation-day-v1",        // Navigation
};

const MapView = forwardRef(function MapView(
  {
    location,
    lotFeature,
    lotConfirmed,
    setbackFeature,
    footprintFeature,
    floorPlan,
    isValid,
    fitState = "great",
    viewMode = "full",
    mapStyle = "satellite",
    is3D = false,
    onDragLot,
    onDragFootprint,
    onBearingChange,
    onReady,
  },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const styleReadyRef = useRef(false);
  const currentImagePlanIdRef = useRef(null);
  const currentStyleUrlRef = useRef(null);
  // Bumped every time the map's style finishes loading. Used as a dep
  // for the floor-plan image overlay effect so that swapping styles
  // (which clears all custom layers) reliably triggers a re-add.
  const [styleEpoch, setStyleEpoch] = useState(0);

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

    const initialStyleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.satellite;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: initialStyleUrl,
      // Open on a whole-world view behind the landing hero.
      center: [10, 25],
      zoom: 1.4,
      pitch: is3D ? 55 : 0,
      preserveDrawingBuffer: true,
    });
    mapRef.current = map;
    currentStyleUrlRef.current = initialStyleUrl;

    // Custom-styled controls — we keep the scale control (it's important
    // and well-designed) but use our own custom Compass + zoom buttons
    // so we control the look completely.
    map.addControl(
      new mapboxgl.ScaleControl({ unit: "imperial" }),
      "bottom-left"
    );

    // Track map bearing so the compass can rotate in real time
    const fireBearing = () => {
      if (typeof onBearingChange === "function") {
        onBearingChange(map.getBearing());
      }
    };
    map.on("rotate", fireBearing);
    map.on("rotateend", fireBearing);
    map.on("load", fireBearing);

    // Idempotent layer setup — runs on initial style.load AND every
    // subsequent setStyle() swap (which destroys all custom sources/layers).
    function ensureLayers() {
      if (map.getSource(LOT_SRC)) return;
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
      // FP_FILL tints the footprint by fit state (great / tight / bad).
      map.addLayer({
        id: FP_FILL,
        type: "fill",
        source: FP_SRC,
        paint: {
          "fill-color": [
            "match", ["get", "fitState"],
            "bad", "#ef4444",
            "tight", "#f59e0b",
            /* great */ "#22c55e",
          ],
          "fill-opacity": [
            "match", ["get", "fitState"],
            "bad", 0.34,
            "tight", 0.20,
            /* great */ 0.12,
          ],
        },
      });
      // Blurred wide "glow" line under the crisp outline — neon effect.
      map.addLayer({
        id: FP_GLOW,
        type: "line",
        source: FP_SRC,
        paint: {
          "line-color": [
            "match", ["get", "fitState"],
            "bad", "#ef4444",
            "tight", "#fbbf24",
            /* great */ "#34d399",
          ],
          "line-width": 11,
          "line-blur": 9,
          "line-opacity": [
            "match", ["get", "fitState"],
            "bad", 0.7,
            "tight", 0.6,
            /* great */ 0.55,
          ],
        },
      });
      map.addLayer({
        id: FP_LINE,
        type: "line",
        source: FP_SRC,
        paint: {
          "line-color": [
            "match", ["get", "fitState"],
            "bad", "#fca5a5",
            "tight", "#fcd34d",
            /* great */ "#6ee7b7",
          ],
          "line-width": 2.5,
        },
      });
    }

    function onStyleLoad() {
      ensureLayers();
      styleReadyRef.current = true;
      // Re-sync feature data after a style swap (which clears sources)
      syncSrc(map, LOT_SRC, lotFeatureRef.current);
      syncSrc(map, FP_SRC, footprintFeatureRef.current);
      // The floor-plan image overlay was destroyed by setStyle.
      // Reset its cached id and bump the epoch so the overlay effect
      // re-fires and re-adds the layer with the same coordinates.
      currentImagePlanIdRef.current = null;
      setStyleEpoch((e) => e + 1);
    }

    map.on("style.load", onStyleLoad);

    map.on("load", () => {
      // Drag handlers are attached ONCE — they survive style changes
      // because Mapbox layer-filtered events are map-level, not layer-bound.
      ensureLayers();
      styleReadyRef.current = true;
      attachDrag(map, "lot");
      attachDrag(map, "fp");
      // Tell the parent the map is ready so it can frame a restored session.
      if (typeof onReady === "function") onReady();
      // Mapbox can paint black if the container's final size wasn't ready at
      // init (common on reload / mobile bottom-sheet layout). Force a few
      // resizes once the layout settles so the canvas matches the container.
      map.resize();
      requestAnimationFrame(() => map.resize());
      setTimeout(() => map.resize(), 250);
      setTimeout(() => map.resize(), 800);
    });

    // Keep the canvas in sync with any container size change (orientation
    // flip, sheet open/close, devtools, etc.) — prevents the black-map bug.
    let ro;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(() => {
        if (mapRef.current) mapRef.current.resize();
      });
      ro.observe(containerRef.current);
    }
    const onWinResize = () => map.resize();
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
      currentImagePlanIdRef.current = null;
    };
  }, []);

  // ------- Sync style when prop changes (track URL in a ref to avoid
  // calling getStyle() before the style finished loading) -------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = MAP_STYLES[mapStyle] || MAP_STYLES.satellite;
    if (currentStyleUrlRef.current === target) return;
    currentStyleUrlRef.current = target;
    styleReadyRef.current = false;
    currentImagePlanIdRef.current = null;
    map.setStyle(target);
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ pitch: is3D ? 55 : 0, duration: 500 });
  }, [is3D]);

  // ------- Imperative API -------
  useImperativeHandle(ref, () => ({
    resetNorth: () => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ bearing: 0, pitch: 0, duration: 600 });
    },
    setBearing: (deg) => mapRef.current?.easeTo({ bearing: deg, duration: 400 }),
    zoomIn: () => mapRef.current?.zoomIn({ duration: 250 }),
    zoomOut: () => mapRef.current?.zoomOut({ duration: 250 }),
    flyToLocation: (lng, lat, zoom = 19) =>
      mapRef.current?.flyTo({ center: [lng, lat], zoom, speed: 1.4, essential: true }),
    // Zoom back out to the whole-world landing view (used by "Start fresh").
    flyToWorld: () =>
      mapRef.current?.flyTo({ center: [10, 25], zoom: 1.4, pitch: 0, bearing: 0, speed: 1.6, essential: true }),
    // Frame the footprint as tightly as possible — fitBounds with small padding
    // so the home fills the visible area, capped at max zoom 22.
    flyToFootprint: (padding = 50) => {
      const map = mapRef.current;
      const fp = footprintFeatureRef.current;
      if (!map || !fp) return;
      const ring = fp.geometry.coordinates[0];
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding, duration: 900, maxZoom: 22, essential: true }
      );
    },
    // Fit the lot polygon into view with comfortable padding
    fitToLot: (padding = 80) => {
      const map = mapRef.current;
      const lot = lotFeatureRef.current;
      if (!map || !lot) return;
      const ring = lot.geometry.coordinates[0];
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding, duration: 800, essential: true }
      );
    },
    getMapInstance: () => mapRef.current,
    exportAsPng: async (input = {}) => {
      const map = mapRef.current;
      if (!map) return;
      // Accept either a plain filename string (legacy) or a context object
      const opts =
        typeof input === "string" ? { filename: input } : input;
      const {
        filename = "adu-site-plan.png",
        title = "Site Plan",
        address = "",
        lot,
        setbacks,
        floorPlan,
        footprint,
        fitMargin,
        isValid,
        scale = 2,
        includeInfoPanel = true,
        includeScaleBar = true,
        includeNorthArrow = true,
        includeLegend = true,
      } = opts;

      await new Promise((resolve) => {
        map.once("idle", resolve);
        map.triggerRepaint();
      });
      const sourceCanvas = map.getCanvas();
      const mapW = sourceCanvas.width;
      const mapH = sourceCanvas.height;

      // Render at requested upscale factor for crisper print output.
      const r = Math.max(1, Math.min(3, scale));
      const PANEL_W = includeInfoPanel ? Math.round(320 * r) : 0;
      const HEADER_H = Math.round(72 * r);
      const FOOTER_H = Math.round(36 * r);
      const outW = mapW + PANEL_W;
      const outH = HEADER_H + mapH + FOOTER_H;

      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const ctx = out.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Page background — soft warm white so the map sits nicely
      ctx.fillStyle = "#f6f6f3";
      ctx.fillRect(0, 0, outW, outH);

      // Map area
      ctx.drawImage(sourceCanvas, 0, HEADER_H, mapW, mapH);

      // Compute meters-per-pixel at the map's current center (for the scale bar)
      const center = map.getCenter();
      const mPerPx =
        (40075016.686 * Math.cos((center.lat * Math.PI) / 180)) /
        Math.pow(2, map.getZoom() + 8);

      // Draw all the chrome
      drawHeader(ctx, outW, HEADER_H, { title, address, r });
      if (includeInfoPanel) {
        drawInfoPanel(ctx, mapW, HEADER_H, PANEL_W, mapH, {
          lot,
          setbacks,
          floorPlan,
          footprint,
          fitMargin,
          isValid,
          address,
          mapCenter: center,
          r,
          includeLegend,
        });
      }
      if (includeNorthArrow) {
        drawNorthArrow2(
          ctx,
          HEADER_H,
          mapW,
          mapH,
          map.getBearing(),
          r
        );
      }
      if (includeScaleBar) {
        drawScaleBar(ctx, HEADER_H, mapH, mPerPx, r);
      }
      drawFooter(ctx, outW, outH, FOOTER_H, { mapCenter: center, r });

      const dataUrl = out.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    },
    // Find the nearest road segment to the given lng/lat and return
    // the segment's compass bearing (0..360, 0=N, increasing clockwise).
    // Returns null if no road feature is rendered nearby.
    getStreetBearing: (centerLngLat) => {
      const map = mapRef.current;
      if (!map || !centerLngLat) return null;
      try {
        const center = { lng: centerLngLat[0], lat: centerLngLat[1] };
        const px = map.project(center);
        const r = 200; // generous search radius in pixels
        const bbox = [
          [px.x - r, px.y - r],
          [px.x + r, px.y + r],
        ];

        // Try a targeted road-layer query first
        const styleLayers = map.getStyle()?.layers || [];
        const roadLayerIds = styleLayers
          .filter(
            (l) =>
              l.type === "line" &&
              /(road|street|highway|motorway|primary|secondary|tertiary|residential|service|path|track)/i.test(
                l["source-layer"] || l.id
              )
          )
          .map((l) => l.id);

        let features = roadLayerIds.length
          ? map.queryRenderedFeatures(bbox, { layers: roadLayerIds })
          : [];

        // Fallback: query every rendered feature and keep only LineStrings
        if (!features.length) {
          features = map
            .queryRenderedFeatures(bbox)
            .filter(
              (f) =>
                f.geometry?.type === "LineString" ||
                f.geometry?.type === "MultiLineString"
            );
        }

        if (!features.length) return null;

        let best = { dist: Infinity, bearing: null };
        for (const f of features) {
          const coords =
            f.geometry?.type === "LineString"
              ? [f.geometry.coordinates]
              : f.geometry?.type === "MultiLineString"
              ? f.geometry.coordinates
              : [];
          for (const line of coords) {
            for (let i = 0; i < line.length - 1; i++) {
              const a = line[i];
              const b = line[i + 1];
              const d = pointToSegmentDist(
                [center.lng, center.lat],
                a,
                b
              );
              if (d < best.dist) {
                best.dist = d;
                best.bearing = compassBearing(a, b);
              }
            }
          }
        }
        return best.bearing;
      } catch (err) {
        console.warn("getStreetBearing failed", err);
        return null;
      }
    },
  }));

  // ------- Fly to location + auto-hide marker -------
  const firstLocationRef = useRef(true);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    // On the very first location value, if a lot is already confirmed or a
    // footprint exists, this is a RESTORED session — skip the zoom-19 address
    // fly-in and let App.jsx frame the lot/footprint instead. We still drop
    // the address marker for reference.
    const isInitialRestore =
      firstLocationRef.current &&
      (lotConfirmedRef.current || !!footprintFeatureRef.current);
    firstLocationRef.current = false;

    if (!isInitialRestore) {
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: 19,
        speed: 1.2,
        essential: true,
      });
    }

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    // Use Mapbox's default red drop-pin SVG — it's the recognizable
    // marker users expect from Google Maps / Mapbox.
    markerRef.current = new mapboxgl.Marker({ color: "#ef4444", anchor: "bottom" })
      .setLngLat([location.lng, location.lat])
      .addTo(map);

    const fadeTimer = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.getElement().style.transition = "opacity 0.4s ease";
        markerRef.current.getElement().style.opacity = "0";
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
          properties: {
            ...footprintFeature.properties,
            valid: !!isValid,
            fitState,
          },
        }
      : null;
    syncWhenReady(FP_SRC, tagged);
  }, [footprintFeature, isValid, fitState]);

  // ------- Floor plan image overlay (the actual rendered floor plan as SVG → PNG) -------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => {
      // View mode "footprint" hides the rendered floor plan entirely.
      if (viewMode === "footprint") {
        removeImageLayer(map);
        currentImagePlanIdRef.current = null;
        return;
      }
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

      // Use the plan's bundled image URL directly when available (fastest, highest quality).
      // Fall back to SVG rasterization for plans without a photo.
      const imageUrlPromise = floorPlan.image
        ? Promise.resolve(floorPlan.image)
        : rasterizeFloorPlan(floorPlan);
      imageUrlPromise.then((pngUrl) => {
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
                "raster-opacity": 1,
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
  }, [floorPlan, footprintFeature, viewMode, styleEpoch]);

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

    // Touch drag — single-finger pan of the lot or footprint on touch devices.
    // Mapbox wraps native touch events and provides lngLat on the event object,
    // so the handler mirrors the mouse handler exactly.
    map.on("touchstart", layerId, (e) => {
      if (!isInteractive()) return;
      if (e.originalEvent.touches.length !== 1) return;

      if (kind === "lot") {
        const onTop = map.queryRenderedFeatures(e.point, { layers: [FP_FILL] });
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

      function onTouchMove(ev) {
        if (!dragState) return;
        if (ev.originalEvent.touches.length !== 1) return;
        const dLng = ev.lngLat.lng - dragState.startLngLat.lng;
        const dLat = ev.lngLat.lat - dragState.startLngLat.lat;
        onDrag([
          dragState.centerStart[0] + dLng,
          dragState.centerStart[1] + dLat,
        ]);
      }
      function onTouchEnd() {
        dragState = null;
        map.off("touchmove", onTouchMove);
        map.getCanvas().style.cursor = "";
      }

      map.on("touchmove", onTouchMove);
      map.once("touchend", onTouchEnd);
      map.once("touchcancel", onTouchEnd);
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
    const svg = renderFloorPlanSvgString(plan, { forMap: true });
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

function pointToSegmentDist(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    const ex = px - ax;
    const ey = py - ay;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return Math.sqrt(ex * ex + ey * ey);
}

function compassBearing(a, b) {
  // Compass bearing from a to b: 0=N, 90=E, 180=S, 270=W
  const φ1 = (a[1] * Math.PI) / 180;
  const φ2 = (b[1] * Math.PI) / 180;
  const Δλ = ((b[0] - a[0]) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

/* ---------- Site-plan export drawing helpers ---------- */

function drawHeader(ctx, outW, h, { title, address, r }) {
  ctx.save();
  // Brand green bar
  const grad = ctx.createLinearGradient(0, 0, outW, 0);
  grad.addColorStop(0, "#1f3a1c");
  grad.addColorStop(1, "#2c5a28");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, outW, h);

  // Brand mark (small house icon)
  const ix = 18 * r;
  const iy = h / 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  const s = 13 * r;
  ctx.moveTo(ix, iy);
  ctx.lineTo(ix + s, iy - s);
  ctx.lineTo(ix + 2 * s, iy);
  ctx.lineTo(ix + 2 * s, iy + s);
  ctx.lineTo(ix + 1.4 * s, iy + s);
  ctx.lineTo(ix + 1.4 * s, iy + 0.2 * s);
  ctx.lineTo(ix + 0.6 * s, iy + 0.2 * s);
  ctx.lineTo(ix + 0.6 * s, iy + s);
  ctx.lineTo(ix, iy + s);
  ctx.closePath();
  ctx.fill();

  // Title text
  const textX = ix + 2 * s + 14 * r;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${22 * r}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("FrameUpNow", textX, h / 2 - 4 * r);
  ctx.font = `500 ${12 * r}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "rgba(220, 232, 210, 0.85)";
  ctx.fillText(
    `${title}${address ? " · " + address : ""}`,
    textX,
    h / 2 + 14 * r
  );

  // Right-side badge: date
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  ctx.font = `600 ${12 * r}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fillText(dateStr, outW - 20 * r, h / 2 + 4 * r);
  ctx.restore();
}

function drawInfoPanel(
  ctx,
  mapW,
  headerH,
  panelW,
  mapH,
  {
    lot,
    setbacks,
    floorPlan,
    footprint,
    fitMargin,
    isValid,
    address,
    mapCenter,
    r,
    includeLegend,
  }
) {
  ctx.save();
  // Panel background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(mapW, headerH, panelW, mapH);
  // Left divider
  ctx.fillStyle = "rgba(31, 58, 28, 0.12)";
  ctx.fillRect(mapW, headerH, 1, mapH);

  const px = mapW + 24 * r;
  let py = headerH + 28 * r;

  const sectionTitle = (text) => {
    ctx.font = `800 ${10 * r}px system-ui, sans-serif`;
    ctx.fillStyle = "#3f7a3a";
    ctx.textAlign = "left";
    ctx.fillText(text.toUpperCase(), px, py);
    py += 6 * r;
    // Underline accent
    ctx.fillStyle = "rgba(63, 122, 58, 0.25)";
    ctx.fillRect(px, py, 24 * r, 2 * r);
    py += 14 * r;
  };

  const row = (label, value) => {
    ctx.font = `400 ${11 * r}px system-ui, sans-serif`;
    ctx.fillStyle = "#64748b";
    ctx.fillText(label, px, py);
    ctx.font = `700 ${13 * r}px system-ui, sans-serif`;
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "right";
    ctx.fillText(value, mapW + panelW - 24 * r, py);
    ctx.textAlign = "left";
    py += 20 * r;
  };

  const fmt = (n) =>
    Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—";

  // PROPERTY section
  sectionTitle("Property");
  if (address) {
    ctx.font = `500 ${11 * r}px system-ui, sans-serif`;
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    wrapText(ctx, address, px, py, panelW - 48 * r, 14 * r);
    py += 30 * r;
  }
  if (mapCenter) {
    row(
      "Coordinates",
      `${mapCenter.lat.toFixed(5)}, ${mapCenter.lng.toFixed(5)}`
    );
  }
  py += 8 * r;

  // LOT section
  if (lot && Number.isFinite(lot.width) && Number.isFinite(lot.length)) {
    sectionTitle("Lot");
    const lotSqFt = lot.width * lot.length;
    row("Dimensions", `${lot.width}' × ${lot.length}'`);
    row("Area", `${fmt(lotSqFt)} sq ft`);
    row("Acres", `${(lotSqFt / 43560).toFixed(3)}`);
    py += 8 * r;
  }

  // SETBACKS section
  if (setbacks) {
    sectionTitle("Setbacks");
    row("Front / Back", `${setbacks.front}' / ${setbacks.back}'`);
    row("Left / Right", `${setbacks.left}' / ${setbacks.right}'`);
    if (lot) {
      const bW = lot.width - setbacks.left - setbacks.right;
      const bD = lot.length - setbacks.front - setbacks.back;
      row("Buildable", `${bW}' × ${bD}'  (${fmt(bW * bD)} sf)`);
    }
    py += 8 * r;
  }

  // PLAN section
  if (floorPlan) {
    sectionTitle("Floor Plan");
    if (floorPlan.series) row("Collection", floorPlan.series);
    row("Name", floorPlan.name || "—");
    row("Footprint", `${floorPlan.width}' × ${floorPlan.depth}'`);
    row(
      "Area",
      `${fmt(floorPlan.sqft || floorPlan.width * floorPlan.depth)} sq ft`
    );
    if (floorPlan.keySpecs?.bedrooms && floorPlan.keySpecs.bedrooms !== "—") {
      row(
        "Bed / Bath",
        `${floorPlan.keySpecs.bedrooms} bd / ${floorPlan.keySpecs.bathrooms} ba`
      );
    }
    if (footprint && Number.isFinite(footprint.rotation)) {
      row("Rotation", `${Math.round(footprint.rotation)}°`);
    }
    if (lot && floorPlan) {
      const cov =
        (floorPlan.width * floorPlan.depth) / (lot.width * lot.length);
      row("Lot coverage", `${(cov * 100).toFixed(1)}%`);
    }
    py += 8 * r;
  }

  // PLACEMENT section
  if (fitMargin != null) {
    sectionTitle("Placement");
    const status = isValid
      ? fitMargin >= 1
        ? "Compliant · room to spare"
        : "Compliant · tight fit"
      : "Outside setback";
    row("Status", status);
    row(
      "Clearance",
      fitMargin < 0
        ? `−${Math.abs(fitMargin).toFixed(1)} ft (over)`
        : `${fitMargin.toFixed(1)} ft`
    );
    // Color dot for status
    const dotX = px;
    const dotY = py - 56 * r;
    ctx.beginPath();
    ctx.fillStyle = isValid ? "#3f7a3a" : "#c0392b";
    ctx.arc(dotX + 64 * r, dotY, 4 * r, 0, Math.PI * 2);
    ctx.fill();
    py += 8 * r;
  }

  // LEGEND
  if (includeLegend) {
    sectionTitle("Legend");
    const drawSwatch = (color, label, dashed = false) => {
      ctx.fillStyle = color;
      if (dashed) {
        // Draw dashed bar
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * r;
        ctx.setLineDash([4 * r, 3 * r]);
        ctx.beginPath();
        ctx.moveTo(px, py - 4 * r);
        ctx.lineTo(px + 18 * r, py - 4 * r);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillRect(px, py - 9 * r, 18 * r, 8 * r);
      }
      ctx.font = `500 ${11 * r}px system-ui, sans-serif`;
      ctx.fillStyle = "#334155";
      ctx.textAlign = "left";
      ctx.fillText(label, px + 26 * r, py - 2 * r);
      py += 18 * r;
    };
    drawSwatch("#3b82f6", "Lot boundary");
    drawSwatch("#facc15", "Buildable area (setbacks)", true);
    drawSwatch(isValid ? "#3f7a3a" : "#c0392b", "Your home");
  }

  ctx.restore();
}

function drawNorthArrow2(ctx, headerH, mapW, mapH, bearingDeg, r) {
  const cx = mapW - 56 * r;
  const cy = headerH + 56 * r;
  ctx.save();
  // Background disc
  ctx.fillStyle = "rgba(255, 255, 255, 0.97)";
  ctx.strokeStyle = "rgba(31, 58, 28, 0.5)";
  ctx.lineWidth = 1.5 * r;
  ctx.beginPath();
  ctx.arc(cx, cy, 30 * r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Rotate to compensate for map bearing — North needle always points up
  ctx.translate(cx, cy);
  ctx.rotate((-bearingDeg * Math.PI) / 180);
  // North arrow body (red top, white bottom — classic compass look)
  ctx.beginPath();
  ctx.fillStyle = "#c0392b";
  ctx.moveTo(0, -22 * r);
  ctx.lineTo(-7 * r, 0);
  ctx.lineTo(0, -3 * r);
  ctx.lineTo(7 * r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#475569";
  ctx.moveTo(0, 22 * r);
  ctx.lineTo(-7 * r, 0);
  ctx.lineTo(0, 3 * r);
  ctx.lineTo(7 * r, 0);
  ctx.closePath();
  ctx.fill();
  // N label
  ctx.rotate((bearingDeg * Math.PI) / 180); // unrotate so label is upright
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 ${13 * r}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", 0, -34 * r);
  ctx.restore();
}

function drawScaleBar(ctx, headerH, mapH, mPerPx, r) {
  // Target a ~140 px wide bar at the export scale, rounded to a nice
  // feet number (10, 20, 25, 50, 100, etc.)
  const targetPx = 140 * r;
  const ftPerPx = mPerPx / 0.3048;
  const targetFt = targetPx * ftPerPx;
  const niceFt = niceRoundNumber(targetFt);
  const barPx = niceFt / ftPerPx;

  const x = 20 * r;
  const y = headerH + mapH - 36 * r;

  ctx.save();
  // White backing pill so it's readable on any map color
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.strokeStyle = "rgba(31, 58, 28, 0.3)";
  ctx.lineWidth = 1 * r;
  roundRect(ctx, x - 8 * r, y - 8 * r, barPx + 16 * r, 28 * r, 6 * r);
  ctx.fill();
  ctx.stroke();

  // Two-tone scale bar
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x, y, barPx / 2, 8 * r);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1 * r;
  ctx.fillRect(x + barPx / 2, y, barPx / 2, 8 * r);
  ctx.strokeRect(x + barPx / 2, y, barPx / 2, 8 * r);

  ctx.fillStyle = "#0f172a";
  ctx.font = `700 ${10 * r}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("0", x, y + 20 * r);
  ctx.textAlign = "right";
  ctx.fillText(`${niceFt} ft`, x + barPx, y + 20 * r);
  ctx.restore();
}

function drawFooter(ctx, outW, outH, footerH, { mapCenter, r }) {
  ctx.save();
  ctx.fillStyle = "#1f3a1c";
  ctx.fillRect(0, outH - footerH, outW, footerH);
  ctx.fillStyle = "rgba(220, 232, 210, 0.85)";
  ctx.font = `500 ${10 * r}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const stamp = new Date().toLocaleString();
  ctx.fillText(`Generated ${stamp}`, 18 * r, outH - footerH / 2);
  ctx.textAlign = "right";
  ctx.fillText(
    "frameupnow.com  ·  Not for construction use",
    outW - 18 * r,
    outH - footerH / 2
  );
  ctx.restore();
}

function niceRoundNumber(n) {
  const candidates = [
    5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 500, 750,
    1000,
  ];
  // Pick the candidate closest to n that falls within ±60% — avoids the
  // first-match problem where e.g. n=1000 would match 750 before 1000.
  let best = null;
  let bestDiff = Infinity;
  for (const c of candidates) {
    if (c >= n * 0.4 && c <= n * 1.6) {
      const diff = Math.abs(c - n);
      if (diff < bestDiff) { bestDiff = diff; best = c; }
    }
  }
  if (best != null) return best;
  return Math.max(5, Math.round(n / 10) * 10);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, y);
      line = word + " ";
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
}
