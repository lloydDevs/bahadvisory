import {
  signInWithEmailAndPassword,
  signOut,
  User,
  getIdTokenResult,
} from "firebase/auth";
import { auth } from "../firebase";
import { Role } from "../types";

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

/**
 * Reads the `role` and `assignedArea` custom claims off the user's ID token.
 *
 * Custom claims can ONLY be set server-side (Admin SDK / Cloud Function),
 * never by the client — that's what makes this trustworthy for Firestore
 * rules and route guards. Do NOT replace this with a client-writable
 * Firestore field like `users/{uid}.role`.
 */
export async function getUserRole(user: User | null): Promise<Role | null> {
  if (!user) return null;
  const token = await getIdTokenResult(user);
  return (token.claims.role as Role) ?? null;
}

export async function getUserArea(user: User | null): Promise<string | null> {
  if (!user) return null;
  const token = await getIdTokenResult(user);
  return (token.claims.assignedArea as string) ?? null;
}

/**
 * Force-refreshes the ID token so newly-set custom claims (e.g. right after
 * an admin creates/activates an account) are picked up without a re-login.
 */
export async function refreshClaims(user: User | null) {
  if (!user) return;
  await user.getIdToken(true);
}

/**
 * Example (run only from a trusted server context — a Cloud Function
 * triggered by the Users admin panel, never client code):
 *
 * const admin = require("firebase-admin");
 * admin.auth().setCustomUserClaims(uid, { role: "drrm_editor", assignedArea: "Marikina" });
 */
