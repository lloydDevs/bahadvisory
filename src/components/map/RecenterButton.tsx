import React from "react";
import { GeoStatus } from "../../hooks/useGeolocation";

interface Props {
  onClick: () => void;
  status: GeoStatus;
}

export default function RecenterButton({ onClick, status }: Props) {
  return (
    <button
      className="recenter-btn"
      onClick={onClick}
      title="Recenter on my location"
      aria-label="Recenter on my location"
    >
      <span className={status === "locating" ? "recenter-btn__icon spin" : "recenter-btn__icon"}>
        📍
      </span>
    </button>
  );
}
