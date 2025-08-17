import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadScreenshot(userId: string, file: File, gameId?: string) {
  if (!file) throw new Error("No file selected.");
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large. Max 10MB allowed.");
  }

  // Determine path based on whether it's for a game or a deposit
  const path = gameId 
    ? `screenshots/${userId}/${Date.now()}_${gameId}_${file.name}`
    : `deposits/${userId}/${Date.now()}_${file.name}`;
    
  const screenshotRef = ref(storage, path);

  const metadata = { contentType: file.type || "image/png" };

  try {
    const snap = await uploadBytes(screenshotRef, file, metadata);
    const url = await getDownloadURL(snap.ref);
    return url;
  } catch (err: any) {
    console.error("Upload failed:", err.code, err.message);
    // Provide a more user-friendly error
    if (err.code === 'storage/unauthorized') {
        throw new Error("You do not have permission to upload this file. Please check your connection and try again.");
    }
    throw new Error("Screenshot upload failed. Please try again.");
  }
}
