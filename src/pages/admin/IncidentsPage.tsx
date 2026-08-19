import React, { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useZonesByArea } from "../../hooks/useFloodZones";

export default function IncidentsPage() {
  const { role, assignedArea } = useAuth();
  const isAdmin = role === "admin";
  const { data: zones, loading } = useZonesByArea(assignedArea, isAdmin);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cleared">("all");

  const filtered = zones.filter((z) => {
    const matchesSearch = z.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || z.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="page-header">
        <h2>Incidents</h2>
      </div>
      <div className="filter-bar">
        <input
          placeholder="Search zone name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="cleared">Cleared</option>
        </select>
      </div>
      {loading && <p className="muted">Loading…</p>}
      <div className="zone-table">
        {filtered.map((z) => (
          <div key={z.id} className="zone-table__row">
            <div>
              <strong>{z.name}</strong>
              <div className="muted">{z.area}</div>
            </div>
            <div>{z.waterLevelM.toFixed(2)}m</div>
            <div>{z.status}</div>
            <div>{z.roadPassability.replace("_", " ")}</div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <p className="muted">No matching zones.</p>}
      </div>
    </AdminLayout>
  );
}
