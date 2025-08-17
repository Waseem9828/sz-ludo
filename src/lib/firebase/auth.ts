
'use client';

import { auth, db, storage } from "./config";
import { deleteUser } from "firebase/auth";
import { doc, deleteDoc, collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";

export async function deleteAccount() {
  if (!auth.currentUser) throw new Error("No user logged in");
  const user = auth.currentUser;
  const uid = user.uid;
  const batch = writeBatch(db);

  // 1. Delete user’s main document
  const userDocRef = doc(db, "users", uid);
  batch.delete(userDocRef);


  // 2. Delete user’s dependent documents (deposits, games, transactions etc.)
  const collectionsToClean = ["deposits", "games", "transactions"];
  for (const col of collectionsToClean) {
    const q = query(collection(db, col), where("userId", "==", uid));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      batch.delete(doc(db, col, d.id));
    }
  }

  // Commit all Firestore deletions
  await batch.commit();

  // 3. Delete user’s Storage files (screenshots, deposits)
  const paths = [`deposits/${uid}`, `screenshots/${uid}`];
  for (const path of paths) {
    try {
        const folderRef = ref(storage, path);
        const list = await listAll(folderRef);
        for (const item of list.items) {
          await deleteObject(item);
        }
    } catch (error) {
        console.error(`Could not clean storage path ${path}:`, error);
        // Continue even if storage cleanup fails
    }
  }

  // 4. Finally delete user from Auth
  await deleteUser(user);
}
