
'use client'

import Header from "@/components/play/header";
import Typewriter from "@/components/ui/typewriter";

export default function TermsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center text-red-600">Terms and Conditions</h1>
                    
                    <Typewriter speed={10}>
                    <div className="space-y-6 text-foreground">
                        <p>Effective Date: 2 August 2025</p>
                        <p>Owner: SZ Tahir Khan</p>
                        <p>Email: tahirkhan@gmail.com</p>
                        <p>Website: www.sz-ludo.com</p>
                        <p>WhatsApp: 9982749204</p>
                        <p>City: Mumbai, India</p>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">1. Acceptance of Terms</h2>
                            <p>By accessing or using SZ Ludo (the "Platform"), you agree to comply with and be legally bound by the following terms and conditions ("Terms"). If you do not agree to these Terms, please do not use the Platform.</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">2. Nature of the Platform</h2>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>SZ Ludo is a matchmaking and wallet handling platform for players who wish to play Ludo King using their own room codes.</li>
                                <li>We do not provide or host any actual Ludo gameplay.</li>
                                <li>We only connect players for Ludo King matches and manage their entry fees/winnings securely.</li>
                                <li>Players are responsible for creating and sharing valid room codes from Ludo King.</li>
                            </ul>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">3. Player Wallet and Transactions</h2>
                             <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>All users must add funds into their SZ Ludo wallet before participating.</li>
                                <li>The selected match fee is deducted automatically from both players before connection.</li>
                                <li>Winners are decided based on self-declared game results and screenshots.</li>
                                <li>SZ Ludo reserves the right to verify any result before distributing rewards.</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">4. Fair Play Policy</h2>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>Players must not cheat, manipulate results, or use modified versions of Ludo King.</li>
                                <li>If any unfair play is detected, both players' wallets may be frozen during investigation.</li>
                                <li>Repeated misconduct may lead to permanent ban.</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">5. Refund Policy</h2>
                             <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>Refunds are not issued for completed games.</li>
                                <li>In case of match cancellation due to no opponent or app error, refunds will be credited to the user's wallet within 24–48 hours.</li>
                                <li>Fake or invalid room codes will lead to automatic cancellation without refund.</li>
                                <li>Full refund policy is listed here.</li>
                            </ul>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">6. GST and Legal Compliance</h2>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>SZ Ludo is compliant with Indian digital platform regulations.</li>
                                <li>GST will be applied wherever required as per Indian tax laws.</li>
                                <li>Users must retain their transaction history for GST invoice claims if needed.</li>
                            </ul>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">7. Privacy Policy</h2>
                             <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>Your personal data (email, mobile number, game results) is protected and will not be shared without consent.</li>
                                <li>Our detailed privacy policy is available here.</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">8. Age Restrictions</h2>
                            <p>You must be 18 years or older to participate. SZ Ludo reserves the right to verify user age and take necessary action if false information is provided.</p>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">9. Limitation of Liability</h2>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>SZ Ludo is not responsible for any losses arising from Ludo King app crashes, server errors, or third-party disconnections.</li>
                                <li>We act only as an intermediary and wallet manager.</li>
                                <li>Users play Ludo King at their own risk.</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">10. Contact and Support</h2>
                            <p>For issues, disputes, or support:</p>
                            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                               <li>📧 Email: tahirkhan@gmail.com</li>
                               <li>📱 WhatsApp: 9982749204</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                           <p className="font-bold">By using SZ Ludo, you agree to the above Terms and Conditions. These may be updated at any time without prior notice. Users are responsible for reviewing them regularly.</p>
                        </div>

                    </div>
                    </Typewriter>
                </div>
            </main>
        </div>
    );
}
