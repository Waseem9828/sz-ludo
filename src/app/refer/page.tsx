
import Header from "@/components/play/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M16.75 13.96c.25.58.12 1.19-.29 1.59l-1.12 1.11c-.39.39-1 .4-1.4.03-.4-.36-.88-.78-1.4-1.25-.54-.48-1.07-.99-1.58-1.55-.5-.54-1-1.07-1.52-1.58-.46-.52-.87-1-1.22-1.43-.37-.41-.35-1.02.04-1.42l1.11-1.12c.39-.41.99-.54 1.57-.29.41.17.78.44 1.11.78.33.34.6.71.78 1.13Z" />
        <path d="M19.17 4.83A9.92 9.92 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.45 1.27 4.94L2 22l5.06-1.27c1.5.81 3.17 1.27 4.94 1.27h.01c5.52 0 10-4.48 10-10 0-2.76-1.12-5.26-2.9-7.07Zm-1.63 12.54a8.37 8.37 0 0 1-11.23-11.23 8.37 8.37 0 0 1 11.23 11.23Z" />
    </svg>
)

const TelegramIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
)


export default function ReferPage() {
    const referralCode = "6020032542";

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold">Your Referral Earnings</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Referred Players</p>
                            <p className="text-lg font-bold">0</p>
                        </div>
                        <div className="border-l mx-4"></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Referral Earning</p>
                            <p className="text-lg font-bold">₹0</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold">Referral Code</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="flex justify-center my-4">
                            <Image src="https://placehold.co/200x150.png" alt="Refer a friend" width={200} height={150} data-ai-hint="referral illustration"/>
                        </div>
                        <div className="flex">
                            <Input type="text" value={referralCode} readOnly className="text-center bg-muted border-r-0 rounded-r-none" />
                            <Button className="rounded-l-none">COPY</Button>
                        </div>
                        <div className="flex items-center my-4">
                            <hr className="w-full border-gray-300" />
                            <span className="mx-4 text-muted-foreground font-semibold">OR</span>
                            <hr className="w-full border-gray-300" />
                        </div>
                        <div className="space-y-3">
                            <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                                <WhatsAppIcon />
                                Share To WhatsApp
                            </Button>
                            <Button className="w-full bg-black hover:bg-gray-800 text-white">
                                <TelegramIcon />
                                Share To Telegram
                            </Button>
                            <Button variant="secondary" className="w-full">
                                Copy To Clipboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-lg font-semibold">How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        <p>You can refer and <span className="font-bold text-green-600">Earn 2%</span> of your referral winning, every time</p>
                        <p className="mt-2">Like if your player plays for <span className="font-bold text-green-600">₹10000</span> and wins, You will get <span className="font-bold text-green-600">₹200</span> as referral amount.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
