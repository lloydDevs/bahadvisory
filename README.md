# Bahadvisory

Live, DRRM-curated flood advisory map for the Philippines — water level and
per-vehicle road passability, 100% on Firebase's free Spark plan.

Built against `bahadvisory-plan.md`. This README covers what's implemented,
what's stubbed, and how to stand it up.

## Stack

React 18 + TypeScript + Vite, react-leaflet (OpenStreetMap tiles, no paid
map API), Firebase Auth + Firestore + Hosting. No Firebase Storage — no
photo uploads in this version, which keeps the whole app on Spark.

Security pattern follows the uploaded `react-firebase-secure-starter`
architecture: role/area live in Firebase Auth **custom claims** (set only
server-side), `AuthContext` reads them off the ID token, `RouteGuards` gate
the UI, and `firestore.rules` is the actual enforcement layer — the UI gate
is just UX polish.

## What's implemented

- **Public map** (`/`) — real-time `floodZones` via `onSnapshot`, no login.
  Animated polygon/circle overlays (pulse speed scales with water level),
  layer toggles (Water Level / Flooded Areas / Road Passability), legend,
  zone detail panel with an animated water-level gauge against vehicle
  clearance reference lines, and browser-geolocation initial centering with
  a default-city fallback and a "recenter on me" button (`useGeolocation`).
  Location is used only in-browser — never written to Firestore.
- **Recent Advisories** (`/advisories`) — reads `zoneHistory` across all
  zones via `collectionGroup`, newest first.
- **DRRM login** (`/login`) — Firebase Auth email/password.
- **DRRM Dashboard** (`/admin`) — active zone counts (total / rising /
  closed roads), scoped to the editor's `assignedArea` (admins see all).
- **Manage Map** (`/admin/manage-map`) — draw a polygon or drop a pin
  (Leaflet.draw), set water level / trend / road passability / per-vehicle
  passability (auto-suggested from water level via `suggestPassability`,
  fully editable) / notes, publish. Every create/update/clear writes a
  `zoneHistory` entry.
- **Incidents** (`/admin/incidents`) — flat searchable/filterable zone list.
- **Users** (`/admin/users`, admin-only) — add/deactivate DRRM editor
  directory entries.
- **Audit Logs** (`/admin/audit-logs`, admin-only) — chronological
  `zoneHistory`, filterable by editor.
- **Firestore rules** (`firestore.rules`) — default-deny, public read on
  `floodZones`/`zoneHistory`, writes locked to the editor's own area (or
  admin), with server-side shape validation.

## Creating DRRM accounts (stays on the free Spark plan)

The client SDK can never set its own Firebase Auth custom claims (`role`,
`assignedArea`) — something has to do that with the Admin SDK. The obvious
answer is a Cloud Function, but Cloud Functions require the Blaze
(pay-as-you-go) plan even to deploy, which breaks the plan's "100% free
Spark" constraint for a workflow (adding a handful of DRRM staff) that
doesn't need to be a hosted endpoint at all.

Instead, `scripts/createDrrmAccount.js` does the same thing as a **local
script** you run from your own machine with a downloaded service account
key — no deploy, no Blaze upgrade, nothing hosted:

```bash
npm install firebase-admin
# Firebase Console → Project Settings → Service Accounts →
# "Generate new private key" → save as serviceAccountKey.json in the
# project root (already gitignored — never commit it)

# edit the account object at the bottom of the script, then:
node scripts/createDrrmAccount.js
```

It creates the Auth user, sets the custom claims, writes the `users/{uid}`
directory doc, and emails a password-reset link. Run it once per new DRRM
editor or admin — including to bootstrap your very first admin, since
`UsersPage` itself can only queue a *pending* directory entry (it has no
way to create real credentials from the browser).

**`UsersPage` in the app** — the "Add editor" form only writes a
placeholder directory row (uid `pending-...`) so the person shows up in
the list right away. Run the script with matching details to replace it
with a real account; the real `users/{uid}` doc from the script will show
correctly once it lands.

If your usage ever outgrows Spark's limits (unlikely for a single-city
MVP) or you want `createDrrmAccount` self-service from the Users page
without shelling out, upgrading to Blaze and deploying it as a callable
Cloud Function is a straightforward follow-up — the script's logic ports
over almost line-for-line.

## Setup

```bash
npm install
cp .env.example .env      # fill in your Firebase web config
npm run dev
```

Firebase project setup:
1. Create a Firebase project, enable Auth (email/password) and Firestore
   (Spark/free plan is enough — no Blaze upgrade needed).
2. `firebase deploy --only firestore:rules` using `firestore.rules`
   (needs a `firebase.json` — see below).
3. Bootstrap your first admin account with `scripts/createDrrmAccount.js`
   (see "Creating DRRM accounts" above).
4. Set `VITE_DEFAULT_CENTER_LAT` / `_LNG` in `.env` to your pilot city.

`firebase.json` at the project root wires the CLI to `firestore.rules`
and `firestore.indexes.json`, and to `dist/` for Hosting. If you ever run
`firebase init` yourself, choose "Use an existing project" — it's safe to
let it overwrite this file, since it matches the same setup.

## Notes on the plan's roadmap

Steps 1–5 of the plan's roadmap are represented here in code form (steps
2–5 aren't gated behind step 1 being deployed — you can run everything
against Firebase emulators first). Step 6 (Phase 2 — citizen reporting,
evacuation centers, CCTV) is out of scope by design, per the plan's MVP
boundary.
