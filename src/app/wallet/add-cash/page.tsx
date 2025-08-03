
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Loader } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Script from 'next/script';

const quickAmounts = [100, 200, 500, 1000, 2000, 5000, 7500, 10000];

export default function AddCashPage() {
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paytmConfig, setPaytmConfig] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleProceed = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to add cash.", variant: "destructive" });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount to add.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const orderId = `ORDER_${user.uid}_${Date.now()}`;
      const response = await fetch('/api/paytm/initiate-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          amount: numericAmount.toFixed(2),
          userId: user.uid,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPaytmConfig(data);
      } else {
        throw new Error(data.error || 'Failed to initiate transaction.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (paytmConfig && (window as any).Paytm && (window as any).Paytm.CheckoutJS) {
      const config = {
        "root": "",
        "flow": "DEFAULT",
        "data": {
          "orderId": paytmConfig.orderId,
          "token": paytmConfig.txnToken,
          "tokenType": "TXN_TOKEN",
          "amount": paytmConfig.amount
        },
        "handler": {
          "notifyMerchant": function(eventName: string, data: any) {
            console.log("notifyMerchant handler function called");
            console.log("eventName => ", eventName);
            console.log("data => ", data);
          }
        }
      };
      
      (window as any).Paytm.CheckoutJS.init(config).then(function onSuccess() {
        (window as any).Paytm.CheckoutJS.invoke();
        setIsSubmitting(false);
        setPaytmConfig(null);
      }).catch(function onError(error: any) {
        toast({ title: 'Paytm Error', description: error.message, variant: 'destructive' });
        setIsSubmitting(false);
        setPaytmConfig(null);
      });
    }
  }, [paytmConfig, toast]);


  const summary = useMemo(() => {
    const numericAmount = parseFloat(amount) || 0;
    const depositAmount = numericAmount / 1.28;
    const taxAmount = numericAmount - depositAmount;

    return {
        depositAmount: depositAmount.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        total: numericAmount.toFixed(2),
        cashback: taxAmount.toFixed(2),
        walletBalance: numericAmount.toFixed(2)
    }
  }, [amount]);

  return (
    <>
      <Script
        type="application/javascript"
        crossOrigin="anonymous"
        src={`https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/${process.env.NEXT_PUBLIC_PAYTM_MID}.js`}
      />
      <div className="flex flex-col min-h-screen bg-background font-body">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center">
              <Link href="/wallet">
                  <Button variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                  </Button>
              </Link>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-xl font-semibold text-red-600">Add Cash to Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-card pl-8 text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((qAmount) => (
                    <Button 
                      key={qAmount}
                      variant="outline"
                      onClick={() => setAmount(qAmount.toString())}
                      disabled={isSubmitting}
                      className={`flex-col h-auto ${amount === qAmount.toString() ? 'border-primary' : ''}`}
                    >
                      <span>₹{qAmount}</span>
                    </Button>
                  ))}
                </div>
                <Button onClick={handleProceed} className="w-full font-bold text-lg py-6" disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="animate-spin"/> : 'Proceed to Add'}
                </Button>
              </div>
              
              <Card>
                  <CardHeader>
                      <CardTitle className="text-center text-lg text-red-600">Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                          <span>Deposit Amount (Excl. Govt. Tax) A</span>
                          <span>₹{summary.depositAmount}</span>
                  </div>
                  <div className="flex justify-between">
                          <span>Govt. Tax (28% GST)</span>
                          <span>₹{summary.taxAmount}</span>
                  </div>
                  <hr/>
                  <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>₹{summary.total}</span>
                  </div>
                  <div className="flex justify-between">
                          <span>Cashback Bonus B</span>
                          <span>₹{summary.cashback}</span>
                  </div>
                  <hr/>
                  <div className="flex justify-between font-bold">
                          <span>Add To Wallet Balance A + B</span>
                          <span>₹{summary.walletBalance}</span>
                  </div>
                  </CardContent>
              </Card>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
