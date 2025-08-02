
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

const SETTINGS_COLLECTION = 'settings';
const APP_CONFIG_DOC = 'app-config';

export interface AppSettings {
  upiId?: string;
  // Add other settings here in the future
}

export const getSettings = async (): Promise<AppSettings | null> => {
  const docRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as AppSettings;
  } else {
    // If the document doesn't exist, create it with default values
    const initialSettings: AppSettings = { upiId: '' };
    await setDoc(docRef, initialSettings);
    return initialSettings;
  }
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  const docRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
  // Use updateDoc to avoid overwriting the entire document
  // if we only want to change one field.
  // setDoc with merge:true would also work.
  await updateDoc(docRef, settings);
};
