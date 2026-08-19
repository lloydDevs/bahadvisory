import React from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { FloodZone } from "../../types";
import { severityColor } from "../../utils/passability";

interface Props {
  area: string;
  zones: FloodZone[];
  onClick: (area: string, center: [number, number]) => void;
}

function areaCentroid(zones: FloodZone[]): [number, number] {
  const points = zones.map((z) =>
    z.geometry.type === "circle" ? z.geometry.center : z.geometry.coordinates[0]
  );
  const [latSum, lngSum] = points.reduce(
    ([lat, lng], [pLat, pLng]) => [lat + pLat, lng + pLng],
    [0, 0]
  );
  return [latSum / points.length, lngSum / points.length];
}

function maxSeverity(zones: FloodZone[]) {
  return Math.min(Math.max(...zones.map((z) => z.waterLevelM)) / 2, 1);
}

function clusterIcon(count: number, color: string) {
  const size = 40 + Math.min(count, 20) * 1.4; // grows a bit with count, capped
  return L.divIcon({
    className: "area-cluster-pin",
    html: `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.45));
      ">
        <path fill="${color}" stroke="white" stroke-width="1"
          d="M12 0C6.5 0 2 4.5 2 10c0 7.5 10 14 10 14s10-6.5 10-14c0-5.5-4.5-10-10-10z" />
        <circle cx="12" cy="9.5" r="6.2" fill="white" />
        <text x="12" y="12.6" text-anchor="middle" font-size="7" font-weight="700"
          font-family="inherit" fill="${color}">${count}</text>
      </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

/** One pin marker per area/municipality — count of active zones, colored
 *  orange→red by the most severe water level among them. Click to zoom
 *  into that area and reveal the individual zone pins (see ZoneOverlay). */
export default function AreaClusterMarker({ area, zones, onClick }: Props) {
  const center = areaCentroid(zones);
  const color = severityColor(maxSeverity(zones));

  return (
    <Marker
      position={center}
      icon={clusterIcon(zones.length, color)}
      eventHandlers={{ click: () => onClick(area, center) }}
    >
      <Tooltip direction="top" offset={[0, -36]} opacity={1}>
        <strong>Flooded here, click to see more info</strong>
        <br />
        {area} — {zones.length} active {zones.length === 1 ? "zone" : "zones"}
      </Tooltip>
    </Marker>
  );
}