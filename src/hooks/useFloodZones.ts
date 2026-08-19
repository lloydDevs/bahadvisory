import { collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { FloodZone } from "../types";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { tuplesFromFirestore } from "../utils/geo";

/**
 * Firestore stores polygon points as {lat,lng} objects (nested arrays
 * aren't allowed — see src/utils/geo.ts). Convert back to [lat,lng]
 * tuples here, once, so every consumer (Leaflet, forms) keeps using the
 * tuple shape it already expects.
 */
function fromFirestoreDoc(id: string, data: unknown): FloodZone {
  const zone = { id, ...(data as Omit<FloodZone, "id">) };
  if (zone.geometry?.type === "polygon") {
    zone.geometry = {
      ...zone.geometry,
      coordinates: tuplesFromFirestore(zone.geometry.coordinates as any),
    };
  }
  return zone;
}

/** All active zones — powers the public map. Real-time via onSnapshot. */
export function useActiveFloodZones() {
  return useFirestoreCollection<FloodZone>(
    () => query(collection(db, "floodZones"), where("status", "==", "active")),
    fromFirestoreDoc,
    []
  );
}

/** All zones (active + cleared) scoped to one area — powers the DRRM dashboard/incidents list. */
export function useZonesByArea(area: string | null, includeAll: boolean) {
  return useFirestoreCollection<FloodZone>(
    () =>
      includeAll || !area
        ? query(collection(db, "floodZones"))
        : query(collection(db, "floodZones"), where("area", "==", area)),
    fromFirestoreDoc,
    [area, includeAll]
  );
}