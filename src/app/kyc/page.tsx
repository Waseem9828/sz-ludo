
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/play/header';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const kycFormSchema = z.object({
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Aadhaar number must be 12 digits.'),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format.'),
  bankAccount: z.string().min(1, 'Bank account number is required.'),
  ifsc: z.string().min(1, 'IFSC code is required.'),
  bankName: z.string().min(1, 'Bank name is required.'),
  upiId: z.string().min(1, 'UPI ID is required.'),
});

export default function KycPage() {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof kycFormSchema>>({
        resolver: zodResolver(kycFormSchema),
        defaultValues: {
            aadhaar: '',
            pan: '',
            bankAccount: '',
            ifsc: '',
            bankName: '',
            upiId: '',
        },
    });

    function onSubmit(values: z.infer<typeof kycFormSchema>) {
        console.log(values);
        toast({
            title: 'KYC Details Submitted',
            description: 'Your KYC information has been submitted for verification.',
        });
        form.reset();
    }

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold font-headline">
                            KYC Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Aadhaar Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="aadhaar"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Aadhaar Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your 12-digit Aadhaar number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">PAN Card Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="pan"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>PAN Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your PAN number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Bank Account Details</CardTitle>
                                        <CardDescription>For receiving deposit and withdrawal confirmations.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="bankAccount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Account Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your bank account number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ifsc"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>IFSC Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your bank's IFSC code" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="bankName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your bank's name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="upiId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>UPI ID</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter your UPI ID" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                                
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Important Notice</AlertTitle>
                                    <AlertDescription>
                                    To ensure successful transactions, please make sure the name on your bank account matches the name on your Aadhaar card. We will be unable to process payments and update your wallet balance if the names do not match.
                                    </AlertDescription>
                                </Alert>

                                <Button type="submit" className="w-full font-bold text-lg py-6">
                                    Submit for Verification
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
