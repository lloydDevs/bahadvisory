import React, { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { role, currentUser, logout, assignedArea } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/manage-map", label: "Manage Map" },
    { to: "/admin/incidents", label: "Incidents" },
    ...(role === "admin"
      ? [
          { to: "/admin/users", label: "Users" },
          { to: "/admin/audit-logs", label: "Audit Logs" },
        ]
      : []),
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo-chip">
            <img className="admin-sidebar__logo" src="/logo/bahadvisory_icon.png" alt="Bahadvisory" />
          </span>
          <span className="admin-sidebar__brand-text">Bahadvisory</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "admin-nav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div>{currentUser?.email}</div>
            <div className="admin-sidebar__role">
              {role === "admin" ? "Admin" : "DRRM Editor"}
              {assignedArea ? ` · ${assignedArea}` : ""}
            </div>
          </div>
          <button
            className="admin-sidebar__logout"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}