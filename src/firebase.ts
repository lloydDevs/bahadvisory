import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web config is not a secret — real protection comes from
// Firestore rules + custom claims, not hiding these values.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

// Default map center + zoom, used when geolocation is denied/unavailable.
// Centered on Oriental Mindoro province (near Calapan City, the capital)
// rather than Manila, since this app is scoped to Oriental Mindoro.
export const DEFAULT_CENTER: [number, number] = [
  Number(import.meta.env.VITE_DEFAULT_CENTER_LAT ?? 13.05),
  Number(import.meta.env.VITE_DEFAULT_CENTER_LNG ?? 121.35),
];
// Zoom 9 shows the whole province (Calapan down to Bulalacao/Mansalay)
// instead of a single-city close-up.
export const DEFAULT_ZOOM = Number(import.meta.env.VITE_DEFAULT_ZOOM ?? 9);

// Rough bounding box for Oriental Mindoro province, used to constrain
// panning so editors/public users can't wander off into other regions.
export const ORIENTAL_MINDORO_BOUNDS: [[number, number], [number, number]] = [
  [12.15, 120.85], // southwest
  [13.55, 121.75], // northeast
];