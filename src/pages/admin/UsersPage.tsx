import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { DrrmUser, Role } from "../../types";
import { setUserActive, subscribeUsers, upsertUserDirectoryEntry } from "../../services/userService";

/**
 * Admin-only. Creating the underlying Firebase Auth account + custom claims
 * cannot happen from the client (the client SDK can't set its own custom
 * claims), and this project intentionally stays off Cloud Functions/Blaze
 * to keep everything on Firebase's free Spark plan. So actual account
 * creation happens by running `node scripts/createDrrmAccount.js` locally
 * (see README.md) — this form only writes the directory entry so the new
 * person shows up here, as a checklist step before/after running it.
 */
export default function UsersPage() {
  const [users, setUsers] = useState<DrrmUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("drrm_editor");
  const [assignedArea, setAssignedArea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => subscribeUsers(setUsers), []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      // This only records intent to add the person — it does NOT create
      // sign-in credentials. Run `node scripts/createDrrmAccount.js`
      // locally with these same values to actually provision the account;
      // that script writes the real users/{uid} doc (with the real uid),
      // which will replace this placeholder entry once it runs.
      const uid = `pending-${Date.now()}`;
      await upsertUserDirectoryEntry({ uid, name, email, role, assignedArea, active: true });
      setMessage(
        `Added to the directory as pending. Now run: node scripts/createDrrmAccount.js (edit the account details in that file to match, or copy this call: name="${name}", email="${email}", role="${role}", assignedArea="${assignedArea}") to actually create the sign-in.`
      );
      setName("");
      setEmail("");
      setAssignedArea("");
    } catch {
      setMessage("Could not add this user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <h2>Users</h2>
      <form className="inline-form" onSubmit={handleAdd}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="drrm_editor">DRRM Editor</option>
          <option value="admin">Admin</option>
        </select>
        <input
          placeholder="Assigned area"
          value={assignedArea}
          onChange={(e) => setAssignedArea(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add editor"}
        </button>
      </form>
      {message && <p className="muted">{message}</p>}

      <div className="zone-table">
        {users.map((u) => (
          <div key={u.uid} className="zone-table__row">
            <div>
              <strong>{u.name}</strong>
              <div className="muted">{u.email}</div>
            </div>
            <div>{u.role === "admin" ? "Admin" : "DRRM Editor"}</div>
            <div>{u.assignedArea}</div>
            <div>
              <button
                className="btn-secondary"
                onClick={() => setUserActive(u.uid, !u.active)}
              >
                {u.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
