
import { NextResponse, NextRequest } from 'next/server';
import Paytm from 'paytm-pg-node-sdk';
import { updateUserWallet } from '@/lib/firebase/users';
import { createTransaction } from '@/lib/firebase/transactions';

// This is a simplified example. In a production environment, you should store
// the order details in your database before initiating the payment and verify against that.
async function verifyAndUpdate(orderId: string, amount: number, txnId: string, status: string, fullResponse: any) {
    const userId = orderId.split('_')[1];

    if (status === 'TXN_SUCCESS') {
        try {
            await updateUserWallet(userId, amount, 'balance', 'deposit', `Paytm Gateway: ${txnId}`);
            // The transaction log is now created inside updateUserWallet.
            console.log(`Successfully credited ₹${amount} to user ${userId} for order ${orderId}`);
        } catch (error) {
            console.error(`Failed to update wallet for user ${userId}, but payment was successful. Manual credit required. Order ID: ${orderId}, TXN ID: ${txnId}`, error);
            // Here you should add logic to flag this transaction for manual review.
        }
    } else {
        // Log failed transaction if needed, but don't update user wallet.
        await createTransaction({
            userId,
            userName: 'N/A', // We may not have the user's name here easily.
            amount,
            type: 'deposit',
            status: 'failed',
            notes: `Paytm Gateway Failed: ${fullResponse.RESPMSG || 'Unknown Reason'}`,
            relatedId: txnId
        });
        console.log(`Payment failed or is pending for order ${orderId}. Status: ${status}`);
    }
}


export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const paytmResponse = new URLSearchParams(bodyText);
    
    const responseData: { [key:string]: any } = {};
    paytmResponse.forEach((value, key) => {
        responseData[key] = value;
    });
    
    console.log("Paytm Callback Received:", responseData);

    const mkey = process.env.PAYTM_MERCHANT_KEY;
    if (!mkey) {
        console.error("Paytm Merchant Key is not set in environment variables.");
        return NextResponse.redirect(new URL('/wallet/add-cash?payment=error', req.url));
    }

    const isVerified = Paytm.Checksum.verifySignature(responseData, mkey, responseData.CHECKSUMHASH);

    if (!isVerified) {
      console.error('Checksum verification failed for order:', responseData.ORDERID);
      // In a real app, you might want to redirect to a more specific error page.
      return NextResponse.redirect(new URL('/wallet/add-cash?payment=error', req.url));
    }

    const { ORDERID: orderId, STATUS: status, TXNAMOUNT: amountStr, TXNID: txnId } = responseData;
    const amount = parseFloat(amountStr);

    // Don't block the callback response to Paytm. Process the update asynchronously.
    verifyAndUpdate(orderId, amount, txnId, status, responseData).catch(err => {
        console.error("Error in background verification and update:", err);
    });
    
    if (status === 'TXN_SUCCESS') {
        return NextResponse.redirect(new URL('/wallet?payment=success', req.url));
    } else {
        return NextResponse.redirect(new URL('/wallet/add-cash?payment=failed', req.url));
    }

  } catch (error: any) {
    console.error('Paytm callback processing error:', error);
    return NextResponse.redirect(new URL('/wallet/add-cash?payment=error', req.url));
  }
}
