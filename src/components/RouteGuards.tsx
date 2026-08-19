import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Role } from "../types";

/** Blocks unauthenticated users. UX-only — Firestore rules are the real gate. */
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

/**
 * Blocks users without one of the allowed roles. Still UX-only:
 * the matching Firestore rule (see firestore.rules) is what actually
 * prevents a non-admin from writing data, even if they bypass this UI.
 */
export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const { currentUser, role } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (!role || !allow.includes(role)) return <Navigate to="/admin" />;
  return <>{children}</>;
}
