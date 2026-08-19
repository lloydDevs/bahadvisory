import { FirestoreError } from "firebase/firestore";

/**
 * Central place to turn Firestore errors into user-safe messages.
 * Never leaks internal error detail to the UI.
 */
export function firestoreErrorMessage(err: FirestoreError): string {
  console.error("[firestore]", err.code, err.message);

  switch (err.code) {
    case "permission-denied":
      return "You don't have access to this data.";
    case "unavailable":
      return "Connection issue — please try again.";
    default:
      return "Something went wrong loading this data.";
  }
}
