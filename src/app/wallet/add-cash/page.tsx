
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
import { getActiveUpiId, UpiId } from '@/lib/firebase/settings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const quickAmounts = [100, 200, 500, 1000, 2000, 5000, 7500, 10000];

const PaymentLogos = () => (
    <div className="flex flex-wrap items-center justify-center gap-4">
        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjS39h23nTR75b-O8y7R9DDf2n25k2y5P2f-dso4j52i0BxrA3i_Z5a9wS4-yAI48s6FhSg3KzL2p0aN8k8wS9i7aJzL8Y5Q8i2P7w8kY9c4xT7gQ5f6wR/s1600/phonepe.png" alt="PhonePe" width={80} height={20} className="object-contain" data-ai-hint="PhonePe logo" />
        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg4r4hY4-k8v2qg8F0j2-X-3J7e8Q3b7eZ9c9k7vX6A7gQ8kY-zC9l5f3wR2t1yH_x5r_zC8vG7n5kY-x-C9vX/s1600/gpay.png" alt="Google Pay" width={50} height={20} className="object-contain" data-ai-hint="Google Pay logo" />
        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh4-U7s-p4vQ-k5j-S-w8eX-Z6y-Z-w-R-j-X-y-A/s1600/amazon-pay.png" alt="Amazon Pay" width={80} height={20} className="object-contain" data-ai-hint="Amazon Pay logo" />
        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgf_gY4-q-k8j-V-x-w-S-z-A-y-R/s1600/paytm.png" alt="Paytm" width={60} height={20} className="object-contain" data-ai-hint="Paytm logo" />
        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgj-x-w-R-z-A-y-Q-j-V-x-S-k/s1600/bhim.png" alt="BHIM" width={50} height={20} className="object-contain" data-ai-hint="BHIM logo" />
        <div className="flex items-center gap-1 text-muted-foreground">
             <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgs-x-w-R-z-A-y-Q-j-V-x-S-k/s1600/bank.png" alt="Bank" width={20} height={20} className="object-contain" data-ai-hint="bank icon" />
            <span className="text-sm font-semibold">50+ Banks</span>
        </div>
    </div>
);


export default function AddCashPage() {
  const [amount, setAmount] = useState('100');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQr, setShowQr] = useState(false);
  const { toast } = useToast();
  const [activeUpi, setActiveUpi] = useState<UpiId | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payeeName = 'SZ LUDO';

  useEffect(() => {
    async function fetchSettings() {
      try {
        const upiId = await getActiveUpiId();
        if (upiId) {
          setActiveUpi(upiId);
        } else {
            setError('No active payment methods available. Please contact support.');
            toast({
                title: 'Configuration Error',
                description: 'No active UPI IDs are configured. Please contact support.',
                variant: 'destructive'
            })
        }
      } catch (err) {
        console.error("Error fetching settings: ", err);
        setError('Could not load payment settings. Please try again later.');
      } finally {
        setLoadingSettings(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const handleProceed = () => {
    if (!activeUpi) {
       toast({
        title: 'Cannot Proceed',
        description: 'No active payment methods available. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to add.',
        variant: 'destructive',
      });
      setQrCodeUrl('');
      setShowQr(false);
      return;
    }

    const upiUrl = `upi://pay?pa=${activeUpi.id}&pn=${payeeName}&am=${numericAmount.toFixed(2)}&cu=INR`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    setQrCodeUrl(qrApiUrl);
    setShowQr(true);
  };

  const handlePaymentDone = () => {
    // In a real app, you would have a webhook or a manual process
    // to verify the payment and then update the user's wallet
    // and the upiId's currentAmount in Firestore.
    toast({
      title: 'Payment Confirmation Sent',
      description: 'Your request has been sent to the admin. Your balance will be updated after verification.',
    });
    setAmount('100');
    setQrCodeUrl('');
    setShowQr(false);
  };

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

  if (loadingSettings) {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 flex justify-center items-center">
                <Loader className="h-16 w-16 animate-spin" />
            </main>
        </div>
    )
  }

  return (
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
        
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold text-red-600">Buy Chips</CardTitle>
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
                  disabled={!!error}
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((qAmount) => (
                   <Button 
                    key={qAmount}
                    variant="outline"
                    onClick={() => setAmount(qAmount.toString())}
                    disabled={!!error}
                   >
                    ₹{qAmount}
                   </Button>
                ))}
              </div>
              <Button onClick={handleProceed} className="w-full font-bold text-lg py-6" disabled={!!error || showQr}>Proceed</Button>
            </div>
            
             {showQr ? (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-red-600">Scan & Pay</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">
                        Scan the QR code with your UPI app to pay ₹{amount}
                        </p>
                        <div className="flex justify-center p-4 bg-white rounded-md border">
                        {qrCodeUrl ? <Image src={qrCodeUrl} alt="UPI QR Code" width={200} height={200} /> : <Loader className="h-10 w-10 animate-spin" />}
                        </div>
                        <Button onClick={handlePaymentDone} className="w-full font-bold text-lg py-6 bg-green-600 hover:bg-green-700 text-white">
                        I have paid
                        </Button>
                    </CardContent>
                </Card>
             ) : (
                !error && (
                    <>
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center text-lg text-red-600">Payments Secured By</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PaymentLogos />
                            </CardContent>
                        </Card>
                    </>
                )
             )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
