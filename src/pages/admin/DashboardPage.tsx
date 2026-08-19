import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useZonesByArea } from "../../hooks/useFloodZones";

export default function DashboardPage() {
  const { role, assignedArea } = useAuth();
  const isAdmin = role === "admin";
  const { data: zones, loading } = useZonesByArea(assignedArea, isAdmin);
  const active = zones.filter((z) => z.status === "active");
  const rising = active.filter((z) => z.trend === "rising").length;
  const closed = active.filter((z) => z.roadPassability === "closed").length;

  return (
    <AdminLayout>
      <h2>Dashboard</h2>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-card__value">{active.length}</span>
              <span className="stat-card__label">Active zones</span>
            </div>
            <div className="stat-card stat-card--warn">
              <span className="stat-card__value">{rising}</span>
              <span className="stat-card__label">Rising</span>
            </div>
            <div className="stat-card stat-card--danger">
              <span className="stat-card__value">{closed}</span>
              <span className="stat-card__label">Closed roads</span>
            </div>
          </div>

          <h3 className="section-heading">Active zones in your area</h3>
          <div className="zone-table">
            {active.map((z) => (
              <div key={z.id} className="zone-table__row">
                <strong>{z.name}</strong>
                <div>{z.waterLevelM.toFixed(2)}m</div>
                <div>{z.trend}</div>
                <div>{z.roadPassability.replace("_", " ")}</div>
              </div>
            ))}
            {active.length === 0 && <p className="muted">No active zones right now.</p>}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
