
'use client';

import { doc, getDoc, updateDoc, collection, writeBatch, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

export interface UpiId {
  id: string;
  name: string;
  limit: number;
  currentAmount: number;
}

export interface HomePageCard {
  id: 'game_1' | 'game_2' | 'tournament_1' | 'tournament_2';
  type: 'game' | 'tournament';
  title: string;
  description: string;
  images: string[];
  enabled: boolean;
  aiHint?: string;
}

export interface ReferralSettings {
    imageUrl: string;
    shareText: string;
    howItWorksText: string;
}

export interface FestiveGreeting {
  enabled: boolean;
  type: 'None' | 'Generic' | 'Holi' | 'Diwali' | 'Eid' | 'Christmas' | 'IndependenceDay';
  message: string;
}

export interface AppSettings {
  upiIds?: UpiId[];
  appSettings?: {
    adminCommission: number;
  };
  promotionBannerText?: string;
  termsContent?: string;
  privacyContent?: string;
  refundContent?: string;
  gstContent?: string;
  homePageCards?: HomePageCard[];
  referralSettings?: ReferralSettings;
  festiveGreeting?: FestiveGreeting;
}

const SETTINGS_DOC_ID = 'appConfig';

/**
 * Fetches the application settings from Firestore.
 * @returns {Promise<AppSettings>} A promise that resolves to the app settings object.
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      console.warn('Settings document does not exist. Returning default empty object.');
      return {};
    }
  } catch (error) {
    console.error("Error fetching settings: ", error);
    throw new Error("Could not fetch application settings.");
  }
}

/**
 * Updates the application settings in Firestore.
 * @param {AppSettings} newSettings - The new settings object to save.
 */
export async function updateSettings(newSettings: AppSettings): Promise<void> {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await updateDoc(docRef, newSettings, { merge: true });
}

/**
 * Finds the first UPI ID that has not reached its daily limit.
 * @returns {Promise<UpiId | null>} The active UPI ID or null if none are available.
 */
export async function getActiveUpiId(): Promise<UpiId | null> {
    const settings = await getSettings();
    if (!settings.upiIds || settings.upiIds.length === 0) {
        return null;
    }
    const availableUpi = settings.upiIds.find(upi => upi.currentAmount < upi.limit);
    return availableUpi || null;
}

/**
 * Uploads a banner image to Firebase Storage.
 * @param {File} file - The image file to upload.
 * @param {string} folder - The folder to upload the image to (e.g., 'banners', 'homecards').
 * @returns {Promise<string>} The download URL of the uploaded image.
 */
export async function uploadBannerImage(file: File, folder: string): Promise<string> {
  if (!file) throw new Error('No file provided for upload.');

  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Deletes an image from Firebase Storage using its URL.
 * @param {string} imageUrl - The full URL of the image to delete.
 */
export async function deleteBannerImage(imageUrl: string): Promise<void> {
  const imageRef = ref(storage, imageUrl);
  await deleteObject(imageRef);
}

/**
 * Deletes game records older than 30 days.
 * @returns {Promise<number>} The number of deleted records.
 */
export async function deleteOldGameRecords(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timestamp = Timestamp.fromDate(thirtyDaysAgo);

    const gamesRef = collection(db, 'games');
    const q = query(
        gamesRef, 
        where('status', 'in', ['completed', 'cancelled', 'disputed']),
        where('createdAt', '<=', timestamp)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return 0;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
}
