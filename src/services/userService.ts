import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { DrrmUser } from "../types";

/**
 * Account creation itself (Firebase Auth user + custom claims) must happen
 * server-side (Admin SDK / Cloud Function) — the client SDK cannot set
 * custom claims. This writes the *directory* doc used to render the Users
 * list; pair it with a callable Cloud Function `createDrrmAccount` that
 * creates the Auth user, sets claims, then calls this.
 */
export function subscribeUsers(cb: (users: DrrmUser[]) => void) {
  return onSnapshot(query(collection(db, "users")), (snap) => {
    cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as DrrmUser)));
  });
}

export async function upsertUserDirectoryEntry(user: DrrmUser) {
  await setDoc(doc(db, "users", user.uid), user, { merge: true });
}

export async function setUserActive(uid: string, active: boolean) {
  await updateDoc(doc(db, "users", uid), { active });
}
