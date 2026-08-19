import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

interface Props {
  onDrawn: (coords: [number, number][]) => void;
}

/**
 * Wraps Leaflet.draw to let a DRRM editor draw a polygon for a new flood
 * zone. Only one shape is kept at a time — drawing a new one replaces the
 * previous draft, matching "draw a polygon (or drop a pin)" from the plan.
 */
export default function PolygonDrawer({ onDrawn }: Props) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    const drawControl = new (L.Control as any).Draw({
      draw: {
        // showArea disabled: leaflet-draw 1.0.4's area tooltip is broken
        // against leaflet 1.9.x (throws "type is not defined" from
        // readableArea while dragging a vertex). We still know the
        // polygon's shape from onDrawn, we just don't show the live
        // area label while drawing.
        polygon: { allowIntersection: false, showArea: false },
        marker: true,
        circle: false,
        circlemarker: false,
        polyline: false,
        rectangle: false,
      },
      edit: { featureGroup: drawnItems },
    });
    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      if (e.layerType === "polygon") {
        const latlngs = (e.layer.getLatLngs()[0] as L.LatLng[]).map(
          (ll) => [ll.lat, ll.lng] as [number, number]
        );
        onDrawn(latlngs);
      } else if (e.layerType === "marker") {
        const ll = e.layer.getLatLng();
        // Represent a dropped pin as a small square "polygon" footprint
        // so it fits the same geometry shape used by drawn areas.
        const delta = 0.0015;
        onDrawn([
          [ll.lat - delta, ll.lng - delta],
          [ll.lat - delta, ll.lng + delta],
          [ll.lat + delta, ll.lng + delta],
          [ll.lat + delta, ll.lng - delta],
        ]);
      }
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}