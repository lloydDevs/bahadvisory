import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivateRoute, RequireRole } from "./components/RouteGuards";
import PublicMapPage from "./pages/PublicMapPage";
import AdvisoriesPage from "./pages/AdvisoriesPage";
import Login from "./pages/Login";
import DashboardPage from "./pages/admin/DashboardPage";
import ManageMapPage from "./pages/admin/ManageMapPage";
import IncidentsPage from "./pages/admin/IncidentsPage";
import UsersPage from "./pages/admin/UsersPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";

export default function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public — no login required */}
          <Route path="/" element={<PublicMapPage />} />
          <Route path="/advisories" element={<AdvisoriesPage />} />
          <Route path="/login" element={<Login />} />

          {/* DRRM editor + admin */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/manage-map"
            element={
              <PrivateRoute>
                <ManageMapPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/incidents"
            element={
              <PrivateRoute>
                <IncidentsPage />
              </PrivateRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin/users"
            element={
              <RequireRole allow={["admin"]}>
                <UsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RequireRole allow={["admin"]}>
                <AuditLogsPage />
              </RequireRole>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}