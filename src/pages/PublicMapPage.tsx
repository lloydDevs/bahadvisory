import React, { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useActiveFloodZones } from "../hooks/useFloodZones";
import { useGeolocation } from "../hooks/useGeolocation";
import ZoneOverlay from "../components/map/ZoneOverlay";
import AreaClusterMarker from "../components/map/AreaClusterMarker";
import LocationsSidebar from "../components/map/LocationsSidebar";
import ZoneDetailPanel from "../components/map/ZoneDetailPanel";
import Legend from "../components/map/Legend";
import RecenterButton from "../components/map/RecenterButton";
import TutorialOverlay from "../components/TutorialOverlay";
import { FloodZone } from "../types";
import { DEFAULT_ZOOM, ORIENTAL_MINDORO_BOUNDS } from "../firebase";

type Layer = "water" | "flooded" | "passability";

// Below this zoom, group zones into per-area badges instead of drawing
// every individual pin/polygon — keeps the province-wide view readable.
const CLUSTER_ZOOM_THRESHOLD = 11;

function FlyToPosition({ position }: { position: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(position, map.getZoom(), { duration: 0.8 });
  }, [position, map]);
  return null;
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoomChange(map.getZoom()) });
  React.useEffect(() => {
    onZoomChange(map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function FlyToArea({ target }: { target: { center: [number, number]; nonce: number } | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (target) map.flyTo(target.center, CLUSTER_ZOOM_THRESHOLD + 2, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.nonce]);
  return null;
}

/**
 * On first load, once we know geolocation didn't give us a position to
 * center on, zoom/pan the map to fit the actual active flood zones instead
 * of leaving the visitor staring at the static province-wide default
 * center — so the pins are visible right away instead of being some
 * unrelated spot on the map. Runs once (guarded by `didFit`) so later
 * zone updates don't keep yanking the view around.
 */
function FitToZones({ zones, enabled }: { zones: FloodZone[]; enabled: boolean }) {
  const map = useMap();
  const didFit = useRef(false);

  React.useEffect(() => {
    if (didFit.current || !enabled || zones.length === 0) return;
    const points = zones.map((z) =>
      z.geometry.type === "circle" ? z.geometry.center : z.geometry.coordinates[0]
    );
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points as [number, number][]);
    map.flyToBounds(bounds.pad(0.4), { maxZoom: 13, duration: 0.8 });
    didFit.current = true;
  }, [zones, enabled, map]);

  return null;
}

export default function PublicMapPage() {
  const { data: zones, loading, error } = useActiveFloodZones();
  const { status, position, locate } = useGeolocation();
  const [selected, setSelected] = useState<FloodZone | null>(null);
  const [activeLayers, setActiveLayers] = useState<Record<Layer, boolean>>({
    water: true,
    flooded: true,
    passability: true,
  });
  const [hasCentered, setHasCentered] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; nonce: number } | null>(null);

  // Attempt geolocation once on first load.
  React.useEffect(() => {
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!hasCentered && (status === "granted" || status === "denied" || status === "unavailable")) {
      setHasCentered(true);
    }
  }, [status, hasCentered]);

  const toggleLayer = (layer: Layer) =>
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));

  const zonesByArea = useMemo(() => {
    const grouped: Record<string, FloodZone[]> = {};
    for (const zone of zones) {
      (grouped[zone.area] ??= []).push(zone);
    }
    return grouped;
  }, [zones]);

  const flyToArea = (area: string, center: [number, number]) => {
    setFlyTarget({ center, nonce: Date.now() });
  };

  const selectZoneFromList = (zone: FloodZone) => {
    const center =
      zone.geometry.type === "circle" ? zone.geometry.center : zone.geometry.coordinates[0];
    setFlyTarget({ center, nonce: Date.now() });
    setSelected(zone);
  };

  // Clustering disabled — zones always render as individual scattered pins,
  // even when zoomed out.
  const showClusters = false;

  return (
    <div className="public-map-page">
      <header className="topbar">
        <div className="topbar__brand">
          <img className="topbar__logo" src="/logo/bahadvisory_icon.png" alt="Bahadvisory icon" />
          <img className="topbar__text-logo" src="/logo/bahadvisory_textlogo.png" alt="Bahadvisory" />
        </div>
        {/* <div className="topbar__layers">
          {(["water", "flooded", "passability"] as Layer[]).map((l) => (
            <button
              key={l}
              className={`layer-toggle ${activeLayers[l] ? "layer-toggle--on" : ""}`}
              onClick={() => toggleLayer(l)}
              title={
                l === "water"
                  ? "Toggle blue water-level shading on zones"
                  : l === "flooded"
                  ? "Show/hide flood zone markers entirely"
                  : "Toggle orange–red road-passability coloring"
              }
            >
              {l === "water" ? "Water Level" : l === "flooded" ? "Flooded Areas" : "Road Passability"}
            </button>
          ))}
        </div> */}
        <div className="topbar__meta">
          <span className="topbar__timestamp">
            {new Date().toLocaleString("en-PH", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </header>

      <div className="public-map-page__body">
        <div className="map-wrap">
          {error && <div className="map-error">{error}</div>}
          <MapContainer
            center={position}
            zoom={DEFAULT_ZOOM}
            minZoom={8}
            maxBounds={ORIENTAL_MINDORO_BOUNDS}
            maxBoundsViscosity={1.0}
            className="leaflet-map"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {status === "granted" && <FlyToPosition position={position} />}
            <FitToZones zones={zones} enabled={hasCentered && status !== "granted"} />
            <ZoomWatcher onZoomChange={setZoom} />
            <FlyToArea target={flyTarget} />

            {activeLayers.flooded &&
              (showClusters
                ? Object.entries(zonesByArea).map(([area, areaZones]) => (
                    <AreaClusterMarker
                      key={area}
                      area={area}
                      zones={areaZones}
                      onClick={flyToArea}
                    />
                  ))
                : zones.map((zone) => (
                    <ZoneOverlay
                      key={zone.id}
                      zone={zone}
                      selected={selected?.id === zone.id}
                      onSelect={setSelected}
                      showWaterLevel={activeLayers.water}
                      showPassability={activeLayers.passability}
                    />
                  )))}
          </MapContainer>

          <RecenterButton onClick={locate} status={status} />
          <Legend />
          {loading && <div className="map-loading-chip">Loading live zones…</div>}

          <LocationsSidebar
            zonesByArea={zonesByArea}
            open={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
            onSelectArea={(area) => {
              const areaZones = zonesByArea[area];
              if (!areaZones?.length) return;
              const [latSum, lngSum] = areaZones.reduce(
                ([lat, lng], z) => {
                  const c = z.geometry.type === "circle" ? z.geometry.center : z.geometry.coordinates[0];
                  return [lat + c[0], lng + c[1]];
                },
                [0, 0]
              );
              flyToArea(area, [latSum / areaZones.length, lngSum / areaZones.length]);
            }}
            onSelectZone={selectZoneFromList}
          />
        </div>

        <ZoneDetailPanel zone={selected} onClose={() => setSelected(null)} />
        <TutorialOverlay />
      </div>
    </div>
  );
}