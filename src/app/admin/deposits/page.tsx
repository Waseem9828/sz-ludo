
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import Link from 'next/link';

export default function DepositsPage() {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manual Deposits (Deprecated)</CardTitle>
                <CardDescription>Manual deposits via QR code have been replaced by the automated Paytm Gateway.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>System Update</AlertTitle>
                    <AlertDescription>
                        This page is no longer in use. All deposit transactions are now automatically processed via the Paytm payment gateway and can be tracked in the user's transaction history. 
                        You can view individual user transactions by navigating to the <Link href="/admin/users" className="font-semibold underline">Users page</Link> and selecting a user.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
