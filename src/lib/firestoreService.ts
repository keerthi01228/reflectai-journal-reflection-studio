import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db, sanitizeForFirestore } from "./firebase";
import { JournalEntry } from "../types";

/**
 * Saves or updates a journal interaction document in the user's isolated subcollection:
 * Path: /users/{userId}/interactions/{interactionId}
 */
export async function saveInteraction(
  userId: string,
  entry: JournalEntry
): Promise<void> {
  if (!userId) {
    throw new Error("Cannot save entry: User is not authenticated.");
  }
  if (!entry || !entry.id) {
    throw new Error("Cannot save entry: Invalid entry data or missing ID.");
  }

  const docRef = doc(db, "users", userId, "interactions", entry.id);
  const payload = sanitizeForFirestore({
    ...entry,
    userId,
    updatedAt: new Date().toISOString(),
  });

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Deletes a journal interaction document from the user's isolated subcollection.
 */
export async function deleteInteraction(
  userId: string,
  entryId: string
): Promise<void> {
  if (!userId || !entryId) {
    throw new Error("User ID and Entry ID are required to delete.");
  }
  const docRef = doc(db, "users", userId, "interactions", entryId);
  await deleteDoc(docRef);
}

/**
 * Subscribes to real-time updates of the authenticated user's interactions collection.
 */
export function subscribeUserInteractions(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  try {
    const colRef = collection(db, "users", userId, "interactions");
    const q = query(colRef, orderBy("updatedAt", "desc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const entries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JournalEntry;
          entries.push({
            ...data,
            id: docSnap.id,
          });
        });
        onUpdate(entries);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        onError(error);
      }
    );
  } catch (err: any) {
    onError(err);
    return () => {};
  }
}
