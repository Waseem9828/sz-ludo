
'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  setDoc,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { useEffect, useState } from 'react';

// Main notifications collection
export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  sentBy: 'admin';
  readCount: number;
}

// Subcollection for user-specific notification status
export interface UserNotification {
  notificationId: string;
  userId: string;
  isRead: boolean;
  readAt?: any;
}

// Combined type for UI
export type NotificationWithStatus = Notification & { isRead: boolean };

const NOTIFICATIONS_COLLECTION = 'notifications';
const USER_NOTIFICATIONS_COLLECTION = 'userNotifications';

// ADMIN: Create a new notification for all users
export const createNotification = async (data: {
  title: string;
  message: string;
}) => {
  return await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    ...data,
    sentBy: 'admin',
    readCount: 0,
    createdAt: serverTimestamp(),
  });
};

// ADMIN: Listen for all notifications to display in panel
export const listenForNotifications = (
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Notification)
    );
    callback(notifications);
  });
};

// USER: Hook to get notifications for a specific user
export const useUserNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<NotificationWithStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
        setNotifications([]);
        setUnreadCount(0);
        return;
    };

    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      const userNotifsRef = collection(db, 'users', userId, USER_NOTIFICATIONS_COLLECTION);
      const userNotifsSnap = await getDocs(userNotifsRef);
      const userReadMap = new Map<string, boolean>();
      userNotifsSnap.forEach(doc => {
          userReadMap.set(doc.id, doc.data().isRead);
      });

      const notificationsWithStatus = allNotifs.map(notif => ({
        ...notif,
        isRead: userReadMap.get(notif.id) || false,
      }));

      const newUnreadCount = notificationsWithStatus.filter(n => !n.isRead).length;

      setNotifications(notificationsWithStatus);
      setUnreadCount(newUnreadCount);
    });

    return () => unsubscribe();
  }, [userId]);

  return { notifications, unreadCount };
};


// USER: Mark a single notification as read
export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    const userNotifRef = doc(db, 'users', userId, USER_NOTIFICATIONS_COLLECTION, notificationId);
    const userNotifSnap = await getDoc(userNotifRef);
    
    // Only proceed if it hasn't been marked as read before
    if (!userNotifSnap.exists() || !userNotifSnap.data()?.isRead) {
        const batch = writeBatch(db);
        
        // 1. Set user-specific read status
        batch.set(userNotifRef, { isRead: true, readAt: serverTimestamp() }, { merge: true });

        // 2. Increment the main notification's readCount
        const mainNotifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        batch.update(mainNotifRef, { readCount: increment(1) });
        
        await batch.commit();
    }
};


// USER: Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
    const allNotifsQuery = query(collection(db, NOTIFICATIONS_COLLECTION));
    const allNotifsSnap = await getDocs(allNotifsQuery);

    const batch = writeBatch(db);
    let newReads = 0;
    
    // Create a list of promises to check read status
    const readStatusPromises = allNotifsSnap.docs.map(async (notifDoc) => {
        const userNotifRef = doc(db, 'users', userId, USER_NOTIFICATIONS_COLLECTION, notifDoc.id);
        const userNotifSnap = await getDoc(userNotifRef);
        return {
            id: notifDoc.id,
            isRead: userNotifSnap.exists() && userNotifSnap.data()?.isRead,
        };
    });

    const readStatuses = await Promise.all(readStatusPromises);

    readStatuses.forEach(({ id, isRead }) => {
        if (!isRead) {
            newReads++;
            // Mark user-specific notification as read
            const userNotifRef = doc(db, 'users', userId, USER_NOTIFICATIONS_COLLECTION, id);
            batch.set(userNotifRef, { isRead: true, readAt: serverTimestamp() }, { merge: true });

            // Increment readCount on the main notification
            const mainNotifRef = doc(db, NOTIFICATIONS_COLLECTION, id);
            batch.update(mainNotifRef, { readCount: increment(1) });
        }
    });

    if (newReads > 0) {
      await batch.commit();
    }
};
