import React from "react";
import { Polygon, Circle, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { FloodZone, PASSABILITY_COLORS } from "../../types";
import { formatWaterLevel, getWaterLevelBand, severityColor } from "../../utils/passability";

interface Props {
  zone: FloodZone;
  onSelect: (zone: FloodZone) => void;
  selected: boolean;
  /** Whether the polygon/circle fill reflects the water-level band (blue
   *  scale). When off, fill drops to a neutral gray — border/pin still show. */
  showWaterLevel?: boolean;
  /** Whether the border color + pin reflect road passability severity
   *  (orange→red). When off, both fall back to a neutral gray. */
  showPassability?: boolean;
}

/** Centroid of a polygon (simple average — fine for the small, roughly
 *  convex flood-zone shapes editors draw; not meant for huge/complex ones). */
function centroid(points: [number, number][]): [number, number] {
  const [latSum, lngSum] = points.reduce(
    ([lat, lng], [pLat, pLng]) => [lat + pLat, lng + pLng],
    [0, 0]
  );
  return [latSum / points.length, lngSum / points.length];
}

/** Teardrop map-pin marker, orange→red by severity, visible at any zoom
 *  level (province-wide included) independent of how large/small the
 *  actual zone polygon renders on screen. */
function pinIcon(color: string, selected: boolean) {
  const size = selected ? 40 : 32;
  return L.divIcon({
    className: "zone-pin",
    html: `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.45));
      ">
        <path fill="${color}" stroke="white" stroke-width="1.2"
          d="M12 0C6.5 0 2 4.5 2 10c0 7.5 10 14 10 14s10-6.5 10-14c0-5.5-4.5-10-10-10z" />
        <circle cx="12" cy="10" r="3.6" fill="white" />
      </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size], // tip of the teardrop points at the location
  });
}

/**
 * Renders one flood zone as an animated polygon/circle. The "wave" pulse is
 * pure CSS (see index.css .zone-overlay) driven by a severity-scaled
 * animation-duration — deeper water pulses faster/brighter. Also drops a
 * teardrop pin at the zone's center, colored orange→red by severity, since
 * a thin/small polygon disappears at province-wide zoom levels.
 */
export default function ZoneOverlay({
  zone,
  onSelect,
  selected,
  showWaterLevel = true,
  showPassability = true,
}: Props) {
  const NEUTRAL = "#9aa5ad";
  const band = getWaterLevelBand(zone.waterLevelM);
  const borderColor = showPassability ? PASSABILITY_COLORS[zone.roadPassability] : NEUTRAL;
  const fillColor = showWaterLevel ? band.color : NEUTRAL;
  const severity = Math.min(zone.waterLevelM / 2, 1); // 0..1
  const duration = 3.2 - severity * 1.6; // faster pulse at higher severity
  const pinColor = showPassability ? severityColor(severity) : NEUTRAL;

  const pathOptions = {
    color: borderColor,
    weight: selected ? 4 : 2.5,
    fillColor,
    fillOpacity: 0.45 + severity * 0.2,
    className: `zone-overlay${selected ? " zone-overlay--selected" : ""}`,
  };

  const style: React.CSSProperties & Record<string, string> = {
    ["--pulse-duration" as string]: `${duration}s`,
  };

  // On touch devices Leaflet opens the bound Tooltip on tap in addition to
  // firing this click handler. Without closing it, a mobile tap looks like
  // it "only shows a text bubble" even though selection did happen — the
  // detail panel was actually just hidden behind the map (see index.css
  // .zone-panel z-index fix). Closing the tooltip here makes the panel the
  // obvious next thing the tap produced.
  const handlers = {
    click: (e: L.LeafletMouseEvent) => {
      onSelect(zone);
      (e.target as L.Layer).closeTooltip?.();
    },
  };

  const pinCenter =
    zone.geometry.type === "circle" ? zone.geometry.center : centroid(zone.geometry.coordinates);

  const pin = (
    <Marker
      position={pinCenter}
      icon={pinIcon(pinColor, selected)}
      eventHandlers={handlers}
    >
      <Tooltip direction="top" offset={[0, -28]} opacity={1}>
        <strong>Flooded here, click to see more info</strong>
        <br />
        {zone.name} — {formatWaterLevel(zone.waterLevelM)}
      </Tooltip>
    </Marker>
  );

  if (zone.geometry.type === "circle") {
    return (
      <>
        <Circle
          center={zone.geometry.center}
          radius={zone.geometry.radiusM}
          pathOptions={pathOptions}
          eventHandlers={handlers}
          // @ts-expect-error - leaflet accepts arbitrary style props via className/CSS vars on the SVG path parent
          style={style}
        >
          <Tooltip direction="top" opacity={1}>
            {zone.name} — {formatWaterLevel(zone.waterLevelM)}
          </Tooltip>
        </Circle>
        {pin}
      </>
    );
  }

  return (
    <>
      <Polygon
        positions={zone.geometry.coordinates}
        pathOptions={pathOptions}
        eventHandlers={handlers}
      >
        <Tooltip direction="top" opacity={1}>
          {zone.name} — {formatWaterLevel(zone.waterLevelM)}
        </Tooltip>
      </Polygon>
      {pin}
    </>
  );
}