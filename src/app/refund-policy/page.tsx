
import Header from "@/components/play/header";

export default function RefundPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center">Refund Policy</h1>
                    
                    <div className="space-y-6 text-foreground">
                        <p>Thanks for being a patron with (referred as SZ LUDO) . If you are not entirely satisfied with your subscription, we are here to help.</p>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3">Refund</h2>
                            <p>Once we receive your Refund request, we will inspect it and notify you on the status of your refund. If your refund request is approved, we will initiate a refund to your credit card (or original method of payment) within 7 working days. You will receive the credit within a certain amount of days, depending on your card issuer's policies. In case of unforeseen technical glitch, would refund subscription upon reviewing the complaint. Final decision lies with the company.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
