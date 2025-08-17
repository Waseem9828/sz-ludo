
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

/**
 * A Callable Cloud Function triggered from the client after a user is created in Firebase Auth.
 * This function securely creates the corresponding user document in Firestore and handles referral logic.
 */
export const onUserCreate = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { uid } = context.auth;
    const { name, phone, referralCode } = data;
    const { email, photoURL } = context.auth.token;

    const userRef = db.doc(`users/${uid}`);
    
    // Check if the user document already exists to prevent overwriting or duplicate operations.
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        functions.logger.log(`User document for UID: ${uid} already exists. Skipping creation.`);
        // Return a non-error response indicating the user already exists.
        return { success: false, message: "User already exists." };
    }

    const newAppUser: any = {
        uid: uid,
        email: email || "",
        displayName: name || context.auth.token.name || "New User",
        photoURL: photoURL || defaultAvatar,
        phone: phone || "",
        wallet: { balance: 10, winnings: 0 },
        kycStatus: "Pending",
        status: "active",
        gameStats: { played: 0, won: 0, lost: 0 },
        lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
        referralStats: { referredCount: 0, totalEarnings: 0 },
        isKycVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (email && (email.toLowerCase() === "admin@example.com" || email.toLowerCase() === "super@admin.com")) {
        newAppUser.role = "superadmin";
        newAppUser.lifetimeStats.totalRevenue = 0;
    }
    
    const batch = db.batch();

    // Securely handle referral logic on the server-side
    if (referralCode && typeof referralCode === 'string' && referralCode.startsWith('SZLUDO')) {
        const referrerId = referralCode.replace('SZLUDO', '');
        if (referrerId && referrerId !== uid) {
            const referrerRef = db.doc(`users/${referrerId}`);
            newAppUser.referralStats.referredBy = referrerId;
            // Securely update the referrer's count.
            batch.update(referrerRef, { 'referralStats.referredCount': admin.firestore.FieldValue.increment(1) });
        }
    }

    // Set the new user document in the batch
    batch.set(userRef, newAppUser);
    
    // Set the sign-up bonus transaction log in the batch
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

    // Commit all batched writes atomically
    await batch.commit();

    functions.logger.log(`Successfully created user document and bonus transaction for UID: ${uid}`);
    return { success: true, message: "User created successfully." };
});
