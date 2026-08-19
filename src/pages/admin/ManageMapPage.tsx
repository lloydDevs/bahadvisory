import React, { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ZoneForm from "../../components/admin/ZoneForm";
import { useAuth } from "../../contexts/AuthContext";
import { useZonesByArea } from "../../hooks/useFloodZones";
import { FloodZone, FloodZoneInput } from "../../types";
import { auth } from "../../firebase";
import { clearZone, createZone, updateZone } from "../../services/zoneService";

export default function ManageMapPage() {
  const { currentUser, role, assignedArea } = useAuth();
  const isAdmin = role === "admin";
  const { data: zones, loading } = useZonesByArea(assignedArea, isAdmin);
  const [editing, setEditing] = useState<FloodZone | "new" | null>(null);

  const activeZones = zones.filter((z) => z.status === "active");
  const editorName = currentUser?.email ?? "DRRM staff";

  const handleSubmit = async (input: FloodZoneInput) => {
    if (!currentUser) return;

    // TEMP DEBUG — remove once permission-denied issue is confirmed fixed.
    const token = await auth.currentUser?.getIdTokenResult();
    console.log("role:", token?.claims.role, "area:", token?.claims.assignedArea);

    if (editing && editing !== "new") {
      await updateZone(editing.id, editing.name, input, currentUser.uid, editorName);
    } else {
      await createZone(input, currentUser.uid, editorName);
    }
    setEditing(null);
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <h2>Manage Map</h2>
        {!editing && (
          <button onClick={() => setEditing("new")}>+ New flood zone</button>
        )}
      </div>

      {editing ? (
        <ZoneForm
          initial={editing === "new" ? null : editing}
          area={isAdmin ? assignedArea ?? "Unassigned" : assignedArea ?? "Unassigned"}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="zone-table">
          {loading && <p className="muted">Loading zones…</p>}
          {!loading && activeZones.length === 0 && (
            <p className="muted">No active zones. Publish one to get started.</p>
          )}
          {activeZones.map((zone) => (
            <div key={zone.id} className="zone-table__row">
              <div>
                <strong>{zone.name}</strong>
                <div className="muted">{zone.area}</div>
              </div>
              <div>{zone.waterLevelM.toFixed(2)}m</div>
              <div>{zone.roadPassability.replace("_", " ")}</div>
              <div className="zone-table__actions">
                <button className="btn-secondary" onClick={() => setEditing(zone)}>
                  Edit
                </button>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    currentUser &&
                    clearZone(zone.id, zone.name, currentUser.uid, editorName)
                  }
                >
                  Mark cleared
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}