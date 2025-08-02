
'use client'

import Header from "@/components/play/header";
import Typewriter from "@/components/ui/typewriter";

export default function GstPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center text-red-600">GST Policy</h1>
                    
                    <Typewriter speed={10}>
                    <div className="space-y-6 text-foreground">
                        <p>Welcome to our GST Policy page. As a responsible business, we are fully committed to complying with all Goods and Services Tax (GST) regulations applicable to our operations. Below is a brief overview of our GST-related policies:</p>
                        <p>From 1st October 2023, a new 28% Government Tax (GST) is applicable on the deposits. Let's understand the new GST regime.. If a player deposits Rs.100 to play a game, there will be an inclusive 28% GST levied on the deposit amount, and the user will need to complete a transaction of Rs.100 (Rs. 78.13 + 28% of Rs. 78.13). Thus, Rs. 100 will be settled in the user’s deposit wallet, and Rs. 21.88 will be accounted for as GST paid. The exact GST amount will be credited to the user's bonus wallet. The details of GST paid by the user can be viewed in the View Transactions section on the application.</p>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">GST Registration</h2>
                            <p>We are registered under GST, and all the applicable taxes are charged on our services and products as per the latest GST guidelines.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">GST on Transactions</h2>
                            <p>All transactions will be subject to the applicable GST rates. The tax will be included in the total price at checkout. For more details, refer to the official GST tax rate schedule.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">Tax Invoices</h2>
                            <p>We provide GST-compliant invoices for all payments made. These invoices include all the necessary details, including the GST amount, for your record-keeping and tax filing purposes.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">GST Refunds</h2>
                            <p>In case of any overpayment of GST, refunds will be processed as per the government regulations.</p>
                        </div>
                    </div>
                    </Typewriter>
                </div>
            </main>
        </div>
    );
}
