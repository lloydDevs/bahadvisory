import React, { useState } from "react";
import { collectionGroup, orderBy, query, limit } from "firebase/firestore";
import AdminLayout from "../../components/admin/AdminLayout";
import { db } from "../../firebase";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { ZoneHistoryEntry } from "../../types";

export default function AuditLogsPage() {
  const [editorFilter, setEditorFilter] = useState("");
  const { data: entries, loading } = useFirestoreCollection<ZoneHistoryEntry>(
    () => query(collectionGroup(db, "updates"), orderBy("timestamp", "desc"), limit(200)),
    (id, data) => ({ id, zoneId: "", ...(data as Omit<ZoneHistoryEntry, "id" | "zoneId">) }),
    []
  );

  const filtered = entries.filter((e) =>
    editorFilter ? e.editorName.toLowerCase().includes(editorFilter.toLowerCase()) : true
  );

  return (
    <AdminLayout>
      <h2>Audit Logs</h2>
      <div className="filter-bar">
        <input
          placeholder="Filter by editor…"
          value={editorFilter}
          onChange={(e) => setEditorFilter(e.target.value)}
        />
      </div>
      {loading && <p className="muted">Loading…</p>}
      <table className="audit-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Zone</th>
            <th>Action</th>
            <th>Editor</th>
            <th>Changed fields</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => (
            <tr key={e.id}>
              <td>
                {e.timestamp
                  ? // @ts-expect-error Firestore Timestamp has toDate at runtime
                    e.timestamp.toDate().toLocaleString("en-PH")
                  : "—"}
              </td>
              <td>{e.zoneName}</td>
              <td>{e.action}</td>
              <td>{e.editorName}</td>
              <td className="audit-table__fields">
                {Object.keys(e.changedFields ?? {}).join(", ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && filtered.length === 0 && <p className="muted">No log entries.</p>}
    </AdminLayout>
  );
}
