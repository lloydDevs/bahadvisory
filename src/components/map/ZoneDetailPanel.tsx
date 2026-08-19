import React from "react";
import {
  FloodZone,
  MMDA_CLASS_LABELS,
  PASSABILITY_COLORS,
  PASSABILITY_LABELS,
  VEHICLE_LABELS,
  VehicleKey,
} from "../../types";
import { formatWaterLevel, getWaterLevelBand } from "../../utils/passability";

interface Props {
  zone: FloodZone | null;
  onClose: () => void;
}

const VEHICLE_ICONS: Record<VehicleKey, string> = {
  bike: "🚲",
  motor: "🏍️",
  fourWheel: "🚗",
  suvPickup: "🚙",
  truck: "🚚",
};

function trendLabel(zone: FloodZone) {
  const sign = zone.trendDeltaM > 0 ? "+" : "";
  const arrow = zone.trend === "rising" ? "↑" : zone.trend === "falling" ? "↓" : "→";
  return `${arrow} ${sign}${zone.trendDeltaM.toFixed(2)}m / hr`;
}

/** Simple animated gauge — fill height reflects water level vs a 2m reference scale. */
function WaterGauge({ waterLevelM }: { waterLevelM: number }) {
  const band = getWaterLevelBand(waterLevelM);
  const pct = Math.min((waterLevelM / 2) * 100, 100);
  return (
    <div className="water-gauge">
      <div className="water-gauge__track">
        <div
          className="water-gauge__fill"
          style={{ height: `${pct}%`, background: band.color }}
        />
        {/* reference lines for vehicle clearances, aligned to the MMDA gauge */}
        <div className="water-gauge__mark" style={{ bottom: "12.5%" }} title="Bike risk (0.25m — Half-Knee level)" />
        <div className="water-gauge__mark" style={{ bottom: "24%" }} title="Motor risk (0.48m — Knee level)" />
        <div className="water-gauge__mark" style={{ bottom: "33%" }} title="4-wheel risk (0.66m — Tire level)" />
        <div className="water-gauge__mark" style={{ bottom: "47%" }} title="SUV/pickup risk (0.94m — Waist level)" />
        <div className="water-gauge__mark" style={{ bottom: "57%" }} title="Truck risk (1.14m — Chest level)" />
      </div>
      <div className="water-gauge__value">
        {waterLevelM.toFixed(2)}m
        <span className="water-gauge__layman">{band.laymanLabel}</span>
      </div>
    </div>
  );
}

export default function ZoneDetailPanel({ zone, onClose }: Props) {
  if (!zone) return null;
  const band = getWaterLevelBand(zone.waterLevelM);

  return (
    <div className="zone-panel">
      <div className="zone-panel__header">
        <div>
          <h3>{zone.name}</h3>
          <span className="zone-panel__area">{zone.area}</span>
        </div>
        <button className="zone-panel__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="zone-panel__body">
        <WaterGauge waterLevelM={zone.waterLevelM} />

        <div className="zone-panel__stats">
          <div className="stat">
            <span className="stat__label">Level</span>
            <span className="stat__value">
              {formatWaterLevel(zone.waterLevelM)}
              <span className="stat__sub">{band.label}</span>
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">MMDA classification</span>
            <span className="stat__value">
              <span className="stat__code">{band.mmdaClass}</span>
              <span className="stat__sub">{MMDA_CLASS_LABELS[band.mmdaClass]}</span>
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Trend</span>
            <span className="stat__value">{trendLabel(zone)}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Road status</span>
            <span
              className="stat__badge"
              style={{ background: PASSABILITY_COLORS[zone.roadPassability] }}
            >
              {PASSABILITY_LABELS[zone.roadPassability]}
            </span>
          </div>
        </div>

        <div className="zone-panel__section">
          <h4>Vehicle passability</h4>
          <div className="vehicle-grid">
            {(Object.keys(VEHICLE_LABELS) as VehicleKey[]).map((key) => (
              <div
                key={key}
                className={`vehicle-chip ${
                  zone.passability[key] ? "vehicle-chip--ok" : "vehicle-chip--no"
                }`}
              >
                <span>{VEHICLE_ICONS[key]}</span>
                <span>{VEHICLE_LABELS[key]}</span>
                <span className="vehicle-chip__status">
                  {zone.passability[key] ? "Passable" : "Not passable"}
                </span>
                <span className="vehicle-chip__mark" aria-hidden="true">
                  {zone.passability[key] ? "✓" : "✕"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {zone.notes && (
          <div className="zone-panel__section">
            <h4>DRRM notes</h4>
            <p className="zone-panel__notes">{zone.notes}</p>
          </div>
        )}

        {zone.forecast && zone.forecast.length > 0 && (
          <div className="zone-panel__section">
            <h4>Forecast</h4>
            <ul className="forecast-list">
              {zone.forecast.map((f, i) => (
                <li key={i}>
                  {new Date(f.time).toLocaleString()} — {formatWaterLevel(f.projectedLevelM)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="zone-panel__updated">
          Updated by {zone.updatedByName ?? "DRRM"}
        </p>
      </div>
    </div>
  );
}