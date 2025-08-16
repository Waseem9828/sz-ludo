
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Default user avatar URL
const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

/**
 * A Callable Cloud Function triggered from the client after a user is created in Firebase Auth.
 * This function securely creates the corresponding user document in Firestore.
 */
export const onUserCreate = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { uid } = context.auth;
    const { name, phone, referralCode } = data;
    const { email, photoURL } = context.auth.token;

    const userRef = db.doc(`users/${uid}`);
    
    // This function should only be called once upon sign-up. 
    // The client-side logic now ensures this is called only if the doc doesn't exist.
    // The check here is removed to prevent race conditions and simplify logic.
    
    const newAppUser = {
        uid: uid,
        email: email || "",
        displayName: name || "New User",
        photoURL: photoURL || defaultAvatar,
        phone: phone || "",
        wallet: { balance: 10, winnings: 0 },
        kycStatus: "Pending" as const,
        status: "active" as const,
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

    // Handle referral if code is provided
    if (referralCode && typeof referralCode === 'string' && referralCode.startsWith('SZLUDO')) {
        const referrerId = referralCode.replace('SZLUDO', '');
        if (referrerId && referrerId !== uid) {
            const referrerRef = db.doc(`users/${referrerId}`);
            (newAppUser.referralStats as any).referredBy = referrerId;
            batch.update(referrerRef, { 'referralStats.referredCount': admin.firestore.FieldValue.increment(1) });
        }
    }

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
        return { success: true, message: "User created successfully." };
    } catch (error) {
        functions.logger.error(`Error creating user document for UID: ${uid}`, error);
        throw new functions.https.HttpsError('internal', 'Could not create user document.');
    }
});
