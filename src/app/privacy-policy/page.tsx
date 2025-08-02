
'use client'

import Header from "@/components/play/header";
import Typewriter from "@/components/ui/typewriter";

export default function PrivacyPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center text-red-600">Privacy Policy</h1>
                    
                    <Typewriter speed={10}>
                    <div className="space-y-6 text-foreground">
                        <p>Effective Date: August 02, 2024</p>
                        <p>Website: https://sz-ludo.com</p>
                        <p>Contact: tahirkhan@gmail.com</p>
                        <p>WhatsApp: +91-9982749204</p>
                        <p>Owner: SZ Tahir Khan</p>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">1. Introduction</h2>
                            <p>At SZ Ludo, we are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform or use our services.</p>
                            <p>By using our website or mobile app, you agree to the terms of this Privacy Policy.</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">2. Information We Collect</h2>
                            <p>We may collect the following types of information from users:</p>
                            <div className="pl-4">
                                <h3 className="font-semibold mt-2">a. Personal Information</h3>
                                <ul className="list-disc list-inside pl-4 space-y-1 mt-1">
                                    <li>Name</li>
                                    <li>Mobile number</li>
                                    <li>Email address</li>
                                    <li>City/Location</li>
                                    <li>Payment details (e.g., wallet balance, transaction IDs)</li>
                                    <li>WhatsApp contact</li>
                                    <li>Aadhaar KYC (if enabled)</li>
                                </ul>

                                <h3 className="font-semibold mt-2">b. Device and Technical Data</h3>
                                 <ul className="list-disc list-inside pl-4 space-y-1 mt-1">
                                    <li>IP Address</li>
                                    <li>Browser type and version</li>
                                    <li>Operating system</li>
                                    <li>Device type and ID</li>
                                </ul>

                                <h3 className="font-semibold mt-2">c. Game-related Data</h3>
                                 <ul className="list-disc list-inside pl-4 space-y-1 mt-1">
                                    <li>Room code created</li>
                                    <li>Game join time</li>
                                    <li>Opponent match data</li>
                                    <li>Game result reports (win/loss)</li>
                                </ul>
                            </div>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">3. How We Use Your Information</h2>
                            <p>We use your information for the following purposes:</p>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>To connect players through room codes.</li>
                                <li>To deduct the chosen entry fee from wallets.</li>
                                <li>To match players in real-time for Ludo King games.</li>
                                <li>To process payments and manage wallet balances.</li>
                                <li>To ensure fair play and prevent fraud.</li>
                                <li>To provide customer support.</li>
                                <li>To improve user experience and security.</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">4. Information Sharing</h2>
                            <p>We do not sell or rent your personal data to any third parties. However, we may share your data with:</p>
                            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>Government authorities (if legally required)</li>
                                <li>Payment gateways for transaction processing</li>
                                <li>Firebase or database providers (for data storage)</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">5. Data Security</h2>
                            <p>We use industry-standard security measures to protect your information. All data is encrypted and stored securely.</p>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>HTTPS protocol on all pages</li>
                                <li>Firebase/Firestore encryption</li>
                                <li>Regular database audits</li>
                                <li>Limited access control</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">6. User Rights</h2>
                             <p>You have the right to:</p>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>Access your data</li>
                                <li>Update or correct your information</li>
                                <li>Request deletion of your account and data</li>
                                <li>Withdraw consent at any time</li>
                            </ul>
                            <p className="mt-2">To exercise these rights, contact us at: tahirkhan@gmail.com</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">7. Cookies and Tracking</h2>
                             <p>We may use cookies or similar tracking tools to:</p>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>Analyze usage patterns</li>
                                <li>Improve functionality</li>
                                <li>Remember user preferences</li>
                            </ul>
                            <p className="mt-2">You can control cookies through your browser settings.</p>
                        </div>
                        
                        <hr className="my-4"/>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">8. Children’s Privacy</h2>
                            <p>Our platform is intended for users 18 years and older. We do not knowingly collect data from children under 18. If we become aware, we will delete the data immediately.</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">9. Third-Party Links</h2>
                            <p>Our website may contain links to external websites (e.g., Ludo King). We are not responsible for the privacy practices of those sites. Always read their policies separately.</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">10. Policy Changes</h2>
                            <p>We may update this policy from time to time. When we do, we will revise the “Effective Date” at the top of this page and notify users as necessary.</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">11. Contact Us</h2>
                            <p>If you have any questions about this Privacy Policy or how we handle your data, please contact:</p>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>Owner Name: SZ Tahir Khan</li>
                                <li>Email: tahirkhan@gmail.com</li>
                                <li>Website: https://sz-ludo.com</li>
                                <li>WhatsApp: +91-9982749204</li>
                            </ul>
                        </div>
                    </div>
                    </Typewriter>
                </div>
            </main>
        </div>
    );
}
