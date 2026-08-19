import React from "react";
import { collectionGroup, orderBy, query, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useFirestoreCollection } from "../hooks/useFirestoreCollection";
import { ZoneHistoryEntry } from "../types";

const ACTION_LABELS: Record<ZoneHistoryEntry["action"], string> = {
  created: "New zone reported",
  updated: "Update",
  cleared: "Cleared",
  deleted: "Removed",
};

export default function AdvisoriesPage() {
  const { data: entries, loading, error } = useFirestoreCollection<ZoneHistoryEntry>(
    () => query(collectionGroup(db, "updates"), orderBy("timestamp", "desc"), limit(50)),
    (id, data) => ({ id, zoneId: "", ...(data as Omit<ZoneHistoryEntry, "id" | "zoneId">) }),
    []
  );

  return (
    <div className="advisories-page">
      <h2>Recent Advisories</h2>
      {loading && <p className="muted">Loading advisories…</p>}
      {error && <p className="error-text">{error}</p>}
      <div className="advisories-list">
        {entries.map((e) => (
          <div key={e.id} className="advisory-card">
            <div className="advisory-card__tag">{ACTION_LABELS[e.action]}</div>
            <h4>{e.zoneName}</h4>
            <p className="advisory-card__meta">
              by {e.editorName} ·{" "}
              {e.timestamp
                ? // @ts-expect-error Firestore Timestamp has toDate at runtime
                  e.timestamp.toDate().toLocaleString("en-PH")
                : "just now"}
            </p>
          </div>
        ))}
        {!loading && entries.length === 0 && (
          <p className="muted">No advisories yet.</p>
        )}
      </div>
    </div>
  );
}
