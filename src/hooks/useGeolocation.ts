import { useCallback, useState } from "react";
import { DEFAULT_CENTER } from "../firebase";

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

/**
 * Wraps the browser's native Geolocation API. Position is used only
 * in-browser to center the Leaflet map — it is never sent to Firestore
 * or stored anywhere (see plan §8, "GPS initial centering").
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [position, setPosition] = useState<[number, number]>(DEFAULT_CENTER);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setStatus("granted");
      },
      () => {
        setStatus("denied");
        setPosition(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  return { status, position, locate };
}
