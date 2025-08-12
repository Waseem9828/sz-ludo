
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ChevronLeft, Loader, RefreshCw, Upload, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { SplashScreen } from '@/components/ui/splash-screen';
import { getActiveUpiId, UpiId } from '@/lib/firebase/settings';
import { createDepositRequest } from '@/lib/firebase/deposits';
import Image from 'next/image';
import { Label } from '@/components/ui/label';

const quickAmounts = [100, 200, 500, 1000, 2000, 5000, 7500, 10000];

function AddCashPageComponent() {
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUpi, setIsLoadingUpi] = useState(false);
  const { toast } = useToast();
  const { user, appUser, loading } = useAuth();
  
  const [activeUpi, setActiveUpi] = useState<UpiId | null>(null);
  const [paymentStep, setPaymentStep] = useState<'enter_amount' | 'make_payment' | 'submit_proof' | 'submitted'>('enter_amount');

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [utr, setUtr] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleProceed = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 10) {
      toast({ title: 'Invalid Amount', description: 'Please enter an amount of at least ₹10.', variant: 'destructive' });
      return;
    }
    
    setIsLoadingUpi(true);
    try {
        const upiId = await getActiveUpiId();
        if (!upiId) {
            throw new Error("No active UPI ID available for payment. Please contact support.");
        }
        setActiveUpi(upiId);
        setPaymentStep('make_payment');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoadingUpi(false);
    }
  };
  
  const handleSubmitProof = async () => {
      if (!user || !appUser) return;
      if (!screenshot) {
          toast({ title: 'Screenshot Required', description: 'Please upload the payment screenshot.', variant: 'destructive' });
          return;
      }
      if (!utr.trim()) {
           toast({ title: 'Transaction ID Required', description: 'Please enter the UPI Transaction ID (UTR).', variant: 'destructive' });
          return;
      }

      setIsSubmitting(true);
      try {
        await createDepositRequest({
            userId: user.uid,
            userName: appUser.displayName || 'N/A',
            amount: parseFloat(amount),
            upiId: activeUpi!.id,
            utr,
            screenshotFile: screenshot
        });
        setPaymentStep('submitted');
      } catch (error: any) {
        toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
      } finally {
        setIsSubmitting(false);
      }
  }

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
    // Primary color: #E63946 -> R: 230, G: 57, B: 70
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&color=230-57-70`;
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
    setPaymentStep('enter_amount');
    setActiveUpi(null);
    setScreenshot(null);
    setUtr('');
  }
  
  const renderContent = () => {
      switch (paymentStep) {
          case 'make_payment':
              return (
                 <>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-primary">Scan to Pay</CardTitle>
                        <CardDescription className="text-center">Use any UPI app to scan the QR code below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        {qrCodeUrl && (
                            <div className="p-4 border rounded-lg bg-white inline-block">
                                <Image src={qrCodeUrl} alt="UPI QR Code" width={250} height={250} data-ai-hint="qr code"/>
                            </div>
                        )}
                        <div className="text-2xl font-bold">
                            Pay: ₹{amount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p>To: {activeUpi?.name}</p>
                        </div>
                        <a href={upiLink}>
                        <Button className="w-full font-bold text-lg py-6 md:hidden">Pay with UPI</Button>
                        </a>
                        <Button variant="default" onClick={() => setPaymentStep('submit_proof')} className="w-full">
                            I Have Paid, Next Step
                        </Button>
                        <Button variant="outline" onClick={resetFlow} className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Cancel
                        </Button>
                    </CardContent>
                </>
              );
          case 'submit_proof':
              return (
                  <>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-primary">Submit Payment Proof</CardTitle>
                        <CardDescription className="text-center">Enter the transaction ID and upload the screenshot.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="utr">UPI Transaction ID (UTR)</Label>
                            <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 123456789012" />
                        </div>
                        <div>
                            <Label htmlFor="screenshot">Payment Screenshot</Label>
                            <Input
                                id="screenshot"
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                disabled={isSubmitting}
                            />
                            {screenshot && <p className="text-sm text-center text-muted-foreground mt-2">Selected: {screenshot.name}</p>}
                        </div>
                        <Button onClick={handleSubmitProof} className="w-full font-bold text-lg py-6" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="animate-spin"/> : 'Submit Request'}
                        </Button>
                         <Button variant="outline" onClick={() => setPaymentStep('make_payment')} className="w-full">
                            Back
                        </Button>
                    </CardContent>
                  </>
              );
        case 'submitted':
            return (
                 <CardContent className="space-y-4 text-center p-10">
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto animate-pulse"/>
                    <CardTitle className="text-center text-2xl font-semibold text-green-600">Request Submitted!</CardTitle>
                    <CardDescription className="text-center">
                        Your deposit request for ₹{amount} has been received. Please wait 5-10 minutes for verification. Your wallet will be updated automatically.
                    </CardDescription>
                     <Link href="/wallet">
                        <Button className="w-full">Go to Wallet</Button>
                     </Link>
                </CardContent>
            )
          case 'enter_amount':
          default:
            return (
                <>
                <CardHeader>
                  <CardTitle className="text-center text-xl font-semibold text-primary">Add Cash to Wallet</CardTitle>
                  <CardDescription className="text-center">100% Safe and Secure Payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-card pl-8 text-lg"
                        disabled={isLoadingUpi}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map((qAmount) => (
                        <Button 
                          key={qAmount}
                          variant="outline"
                          onClick={() => setAmount(qAmount.toString())}
                          disabled={isLoadingUpi}
                          className={`flex-col h-auto ${amount === qAmount.toString() ? 'border-primary' : ''}`}
                        >
                          ₹{qAmount}
                        </Button>
                      ))}
                    </div>
                    <Button onClick={handleProceed} className="w-full font-bold text-lg py-6" disabled={isLoadingUpi}>
                        {isLoadingUpi ? <Loader className="animate-spin"/> : 'Proceed to Add'}
                    </Button>
                  </div>
                  
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-center text-lg text-primary">Summary</CardTitle>
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
                      <div className="flex justify-between text-success">
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
            );
      }
  }


  return (
    <>
      <div className="flex flex-col min-h-screen bg-background font-body">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center">
              <Link href="/wallet">
                  <Button variant="outline">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                  </Button>
              </Link>
          </div>
          
          <Card className="max-w-md mx-auto">
             {renderContent()}
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
