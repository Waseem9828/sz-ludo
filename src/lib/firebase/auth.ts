import { auth, db, storage } from "./config";
import { deleteUser } from "firebase/auth";
import { doc, deleteDoc, collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";

export async function deleteAccount() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No user logged in to delete.");
  
  const uid = currentUser.uid;

  // 1. Delete user's Firestore documents
  // Note: This is a best-effort cleanup. For production, a Cloud Function is more reliable.
  const collectionsToDeleteFrom = ["deposits", "games", "transactions"];
  const batch = writeBatch(db);

  for (const collectionName of collectionsToDeleteFrom) {
    const q = query(collection(db, collectionName), where("userId", "==", uid));
    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
    } catch (error) {
        console.warn(`Could not query collection '${collectionName}' for user cleanup:`, error);
    }
  }

  // Also delete the main user document
  const userDocRef = doc(db, 'users', uid);
  batch.delete(userDocRef);
  
  try {
    await batch.commit();
    console.log("Firestore documents deleted for user:", uid);
  } catch (error) {
    console.error("Error deleting Firestore documents in batch:", error);
  }


  // 2. Delete user's Storage files
  const storagePaths = [`deposits/${uid}`, `screenshots/${uid}`];
  for (const path of storagePaths) {
    const folderRef = ref(storage, path);
    try {
        const listResult = await listAll(folderRef);
        const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
        await Promise.all(deletePromises);
        console.log(`Storage files deleted from '${path}'`);
    } catch (error) {
        console.error(`Error deleting files from storage path '${path}':`, error);
    }
  }

  // 3. Finally, delete user from Auth
  try {
    await deleteUser(currentUser);
    console.log("Firebase Auth user deleted successfully.");
  } catch (error) {
    console.error("Error deleting Firebase Auth user:", error);
    throw new Error("Failed to delete user account. Please try again or contact support.");
  }
}
