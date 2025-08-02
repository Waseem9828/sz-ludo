
'use client';

import React, { useState } from 'react';
import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AddCashPage() {
  const [amount, setAmount] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();

  const upiId = 'example@upi';
  const payeeName = 'Akadda';

  const handleGenerateQr = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to add.',
        variant: 'destructive',
      });
      setQrCodeUrl('');
      return;
    }

    const upiUrl = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${numericAmount}&cu=INR`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    setQrCodeUrl(qrApiUrl);
  };

  const handlePaymentDone = () => {
    if (!qrCodeUrl) {
       toast({
        title: 'No QR Code',
        description: 'Please generate a QR code first.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Payment Confirmation Sent',
      description: 'Your request has been sent to the admin. Your balance will be updated after verification.',
    });
    setAmount('');
    setQrCodeUrl('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center">
            <Link href="/wallet">
                <Button variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Wallet
                </Button>
            </Link>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold">Add Cash to Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (₹)
              </label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white"
                />
                <Button onClick={handleGenerateQr}>Generate QR</Button>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with your UPI app to pay ₹{amount}
                </p>
                <div className="flex justify-center p-4 bg-white rounded-md border">
                  <Image src={qrCodeUrl} alt="UPI QR Code" width={200} height={200} />
                </div>
                <Button onClick={handlePaymentDone} className="w-full font-bold text-lg py-6 bg-green-600 hover:bg-green-700">
                  I have paid
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
