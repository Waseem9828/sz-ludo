
import { NextResponse, NextRequest } from 'next/server';
import Paytm from 'paytm-pg-node-sdk';
import { updateUserWallet } from '@/lib/firebase/users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const paytmResponse: { [key: string]: any } = {};
    body.forEach((value, key) => {
        paytmResponse[key] = value;
    });
    
    console.log("Paytm Callback Received:", paytmResponse);

    const isVerified = Paytm.Checksum.verifySignature(JSON.stringify(paytmResponse), process.env.PAYTM_MERCHANT_KEY!, paytmResponse.CHECKSUMHASH);

    if (!isVerified) {
      console.error('Checksum verification failed');
      return NextResponse.json({ error: 'Checksum mismatch' }, { status: 400 });
    }

    const orderId = paytmResponse.ORDERID;
    const status = paytmResponse.STATUS;
    const amount = parseFloat(paytmResponse.TXNAMOUNT);
    const userId = orderId.split('_')[1]; // Assumes ORDER_ID format is `ORDER_${userId}_${timestamp}`

    if (status === 'TXN_SUCCESS') {
      // Payment successful, update user's wallet
      await updateUserWallet(userId, amount, 'balance', 'deposit', `Paytm: ${paytmResponse.TXNID}`);
      
      // You can redirect user to a success page
      return NextResponse.redirect(new URL('/wallet?payment=success', req.url));

    } else {
      // Payment failed or is pending
      console.log(`Payment status for order ${orderId} is ${status}`);
       // You can redirect user to a failure page
      return NextResponse.redirect(new URL('/wallet/add-cash?payment=failed', req.url));
    }

  } catch (error: any) {
    console.error('Paytm callback error:', error);
    return NextResponse.redirect(new URL('/wallet/add-cash?payment=error', req.url));
  }
}
