
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getCookie } from 'cookies-next';

admin.initializeApp();
const db = admin.firestore();

// Default user avatar URL
const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

/**
 * Triggered when a new user is created in Firebase Authentication.
 * This function creates a corresponding user document in Firestore.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    
    const userRef = db.doc(`users/${uid}`);

    // The `cookies-next` library doesn't work in Cloud Functions environment.
    // We will retrieve these values from the request if needed, or rely on Auth object.
    // For this use case, we'll assume the client sets the data on the Auth object.
    // If referral/phone need to be passed, it must be done via a callable function
    // right after sign-up, as we cannot access client-side cookies here.
    // For simplicity, we are removing the cookie logic from here.
    
    const newAppUser = {
        uid: uid,
        email: email,
        displayName: displayName || "New User",
        photoURL: photoURL || defaultAvatar,
        phone: user.phoneNumber || "", // Get phone from Auth if available
        wallet: { balance: 10, winnings: 0 },
        kycStatus: "Pending",
        status: "active",
        gameStats: { played: 0, won: 0, lost: 0 },
        lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
        referralStats: { referredCount: 0, totalEarnings: 0 },
        isKycVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Assign admin role for specific emails
    if (email && (email.toLowerCase() === "admin@example.com" || email.toLowerCase() === "super@admin.com")) {
        (newAppUser as any).role = "superadmin";
        (newAppUser as any).lifetimeStats.totalRevenue = 0;
    }
    
    const batch = db.batch();

    // 1. Create the user document
    batch.set(userRef, newAppUser);
    
    // 2. Create the welcome bonus transaction log
    const transLogRef = db.collection("transactions").doc();
    batch.set(transLogRef, {
        userId: uid,
        userName: newAppUser.displayName,
        amount: 10,
        type: "Sign Up",
        status: "completed",
        notes: "Welcome bonus",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
        await batch.commit();
        functions.logger.log(`Successfully created user document and bonus transaction for UID: ${uid}`);
    } catch (error) {
        functions.logger.error(`Error creating user document for UID: ${uid}`, error);
    }
});
