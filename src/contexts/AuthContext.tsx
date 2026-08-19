import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { login, logout, getUserRole, getUserArea, refreshClaims } from "../services/authService";
import { Role } from "../types";

interface AuthContextValue {
  currentUser: User | null;
  role: Role | null;
  assignedArea: string | null;
  login: typeof login;
  logout: typeof logout;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [assignedArea, setAssignedArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      // Force a fresh ID token on every auth state change. Custom claims
      // (role/assignedArea) are set server-side by the admin script and
      // can otherwise be picked up from a stale cached token, which is
      // what causes "permission-denied" on Firestore writes right after
      // an account is created or its role changes.
      await refreshClaims(user);
      // Role/area come from server-set custom claims — never trust a
      // client-supplied value here.
      setRole(await getUserRole(user));
      setAssignedArea(await getUserArea(user));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = { currentUser, role, assignedArea, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}