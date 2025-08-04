
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ChevronLeft, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/components/ui/splash-screen';
import { useSearchParams } from 'next/navigation';
import { getActiveUpiId, UpiId } from '@/lib/firebase/settings';
import Image from 'next/image';

const quickAmounts = [100, 200, 500, 1000, 2000, 5000, 7500, 10000];

function AddCashPageComponent() {
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, appUser, loading } = useAuth();
  const searchParams = useSearchParams();

  const [activeUpi, setActiveUpi] = useState<UpiId | null>(null);
  const [showQr, setShowQr] = useState(false);
  
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({ title: 'Payment Successful', description: 'Your wallet has been credited.' });
    } else if (paymentStatus === 'failed') {
      toast({ title: 'Payment Failed', description: 'Your payment could not be completed. Please try again.', variant: 'destructive' });
    } else if (paymentStatus === 'error') {
      toast({ title: 'Payment Error', description: 'An unexpected error occurred. Please contact support.', variant: 'destructive' });
    }
  }, [searchParams, toast]);
  
  const handleProceed = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to add cash.", variant: "destructive" });
      return;
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 10) {
      toast({ title: 'Invalid Amount', description: 'Please enter an amount of at least ₹10.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
        const upiId = await getActiveUpiId();
        if (!upiId) {
            throw new Error("No active UPI ID available for payment. Please contact support.");
        }
        setActiveUpi(upiId);
        setShowQr(true);

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const upiLink = useMemo(() => {
    if (!activeUpi || !amount) return '#';
    const params = new URLSearchParams({
        pa: activeUpi.id,
        pn: activeUpi.name,
        am: amount,
        cu: 'INR',
        tn: `Cash deposit for ${user?.displayName || user?.email}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [activeUpi, amount, user]);

  const qrCodeUrl = useMemo(() => {
    if (!upiLink || upiLink === '#') return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  }, [upiLink]);

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
  
  if (loading) {
    return <SplashScreen />;
  }

  const resetFlow = () => {
    setShowQr(false);
    setActiveUpi(null);
  }

  return (
    <>
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
             {showQr && activeUpi ? (
                <>
                <CardHeader>
                    <CardTitle className="text-center text-xl font-semibold text-red-600">Scan to Pay</CardTitle>
                    <CardDescription className="text-center">Use any UPI app to scan the QR code below.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4 text-center">
                    {qrCodeUrl && (
                        <div className="p-4 border rounded-lg bg-white inline-block">
                             <Image src={qrCodeUrl} alt="UPI QR Code" width={250} height={250} data-ai-hint="qr code"/>
                        </div>
                    )}
                    <div className="text-2xl font-bold">Pay: ₹{amount}</div>
                    <div className="text-sm text-muted-foreground">
                        <p>To: {activeUpi.name}</p>
                        <p>UPI ID: {activeUpi.id}</p>
                    </div>
                     <a href={upiLink}>
                       <Button className="w-full font-bold text-lg py-6 md:hidden">Pay with UPI</Button>
                     </a>
                    <Button variant="outline" onClick={resetFlow} className="w-full">
                        <RefreshCw className="mr-2"/>
                        Change Amount
                    </Button>
                 </CardContent>
                </>
             ) : (
                <>
                <CardHeader>
                  <CardTitle className="text-center text-xl font-semibold text-red-600">Add Cash to Wallet</CardTitle>
                  <CardDescription className="text-center">100% Safe and Secure Payments</CardDescription>
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
                      <div className="flex justify-between text-green-600">
                              <span>Cashback Bonus B</span>
                              <span>₹{summary.cashback}</span>
                      </div>
                      <hr/>
                      <div className="flex justify-between font-bold">
                              <span>Add To Wallet Balance (A + B)</span>
                              <span>₹{summary.walletBalance}</span>
                      </div>
                      </CardContent>
                  </Card>
                </CardContent>
                </>
            )}
          </Card>
        </main>
      </div>
    </>
  );
}


export default function AddCashPage() {
    return (
        <React.Suspense fallback={<SplashScreen />}>
            <AddCashPageComponent />
        </React.Suspense>
    );
}
