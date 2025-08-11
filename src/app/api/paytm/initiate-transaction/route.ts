
import { NextResponse } from 'next/server';
import Paytm from 'paytm-pg-node-sdk';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount, userId } = body;

    if (!orderId || !amount || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mid = process.env.PAYTM_MID;
    const mkey = process.env.PAYTM_MERCHANT_KEY;
    const website = process.env.PAYTM_WEBSITE;
    const callbackUrl = process.env.PAYTM_CALLBACK_URL;

    if (!mid || !mkey || !website || !callbackUrl) {
        console.error("Paytm environment variables are not set");
        return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
    }
    
    // For Vercel, it's safer to explicitly set environment.
    const environment = Paytm.LibraryConstants.PROD_ENVIRONMENT;
    
    Paytm.MerchantProperties.setMid(mid);
    Paytm.MerchantProperties.setMerchantKey(mkey);
    Paytm.MerchantProperties.setWebsite(website);
    Paytm.MerchantProperties.setCallbackUrl(callbackUrl);
    Paytm.MerchantProperties.setEnvironment(environment);

    const paytmParams = {
      body: {
        "requestType": "Payment",
        "mid": mid,
        "websiteName": website,
        "orderId": orderId,
        "callbackUrl": `${callbackUrl}`,
        "txnAmount": {
          "value": amount,
          "currency": "INR",
        },
        "userInfo": {
          "custId": userId,
        },
      },
    };

    const response = await Paytm.Payment.createTxnToken(paytmParams);
    
    if (response.response.body.resultInfo.resultStatus !== 'S') {
        console.error("Paytm token generation failed:", response.response.body.resultInfo.resultMsg);
        throw new Error(response.response.body.resultInfo.resultMsg);
    }
    
    return NextResponse.json({
        txnToken: response.response.body.txnToken,
        orderId: orderId,
        amount: amount,
    });

  } catch (error: any) {
    console.error('Paytm transaction initiation failed:', error.message);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
