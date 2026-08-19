import React from "react";
import { FloodZone, PASSABILITY_COLORS } from "../../types";
import { getWaterLevelBand } from "../../utils/passability";

interface Props {
  zonesByArea: Record<string, FloodZone[]>;
  open: boolean;
  onToggle: () => void;
  onSelectArea: (area: string) => void;
  onSelectZone: (zone: FloodZone) => void;
}

export default function LocationsSidebar({
  zonesByArea,
  open,
  onToggle,
  onSelectArea,
  onSelectZone,
}: Props) {
  const areas = Object.keys(zonesByArea).sort();
  const totalZones = areas.reduce((n, a) => n + zonesByArea[a].length, 0);

  if (!open) {
    return (
      <button className="locations-sidebar__reopen" onClick={onToggle}>
        Show list
      </button>
    );
  }

  return (
    <aside className="locations-sidebar">
      <div className="locations-sidebar__header">
        <div>
          <strong>All Locations</strong>
          <div className="muted">
            {areas.length} {areas.length === 1 ? "area" : "areas"} · {totalZones}{" "}
            {totalZones === 1 ? "active zone" : "active zones"}
          </div>
        </div>
        <button className="locations-sidebar__close" onClick={onToggle} aria-label="Hide list">
          ×
        </button>
      </div>

      <div className="locations-sidebar__list">
        {areas.length === 0 && <p className="muted">No active flood zones right now.</p>}
        {areas.map((area) => (
          <div key={area} className="locations-sidebar__area">
            <button className="locations-sidebar__area-header" onClick={() => onSelectArea(area)}>
              <span>{area}</span>
              <span className="locations-sidebar__count">{zonesByArea[area].length}</span>
            </button>
            <table className="locations-sidebar__table">
              <tbody>
                {zonesByArea[area].map((zone) => (
                  <tr key={zone.id} onClick={() => onSelectZone(zone)}>
                    <td className="locations-sidebar__zone-name">
                      <span
                        className="locations-sidebar__dot"
                        style={{ background: PASSABILITY_COLORS[zone.roadPassability] }}
                      />
                    </td>
                    <td className="locations-sidebar__zone-level">
                      {zone.name}
                    </td>
                    <td className="locations-sidebar__zone-level">
                      {getWaterLevelBand(zone.waterLevelM).laymanLabel}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </aside>
  );
}