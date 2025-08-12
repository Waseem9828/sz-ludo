
'use client';

import Header from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import Image from "next/image";

const faqs = [
    {
        question: "KYC सत्यापन में कितना समय लगता है?",
        answer: "KYC सत्यापन आमतौर पर 24 घंटे के भीतर पूरा हो जाता है। यदि अधिक समय लगता है, तो कृपया हमारे समर्थन से संपर्क करें।"
    },
    {
        question: "मैं पैसे कैसे निकाल सकता हूँ?",
        answer: "आप अपने 'वॉलेट' पेज से पैसे निकाल सकते हैं। न्यूनतम निकासी राशि ₹300 है और इसके लिए आपका KYC सत्यापित होना चाहिए।"
    },
    {
        question: "गेम का परिणाम गलत अपडेट होने पर क्या करें?",
        answer: "यदि आपको लगता है कि गेम का परिणाम गलत है, तो कृपया गेम पेज पर 'dispute' विकल्प का उपयोग करें या स्क्रीनशॉट के साथ हमारे समर्थन से संपर्क करें। गलत रिपोर्ट करने पर पेनल्टी लग सकती है।"
    },
    {
        question: "रेफरल कमीशन कैसे काम करता है?",
        answer: "जब आपका रेफर्ड दोस्त कोई गेम जीतता है, तो आपको उनकी जीती हुई राशि का 2% कमीशन मिलता है। यह कमीशन सीधे आपके विनिंग वॉलेट में जुड़ जाता है।"
    }
];

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
        <path d="M16.75 13.96c.25.58.12 1.19-.29 1.59l-1.12 1.11c-.39.39-1 .4-1.4.03-.4-.36-.88-.78-1.4-1.25-.54-.48-1.07-.99-1.58-1.55-.5-.54-1-1.07-1.52-1.58-.46-.52-.87-1-1.22-1.43-.37-.41-.35-1.02.04-1.42l1.11-1.12c.39-.41.99-.54 1.57-.29.41.17.78.44 1.11.78.33.34.6.71.78 1.13Z" />
        <path d="M19.17 4.83A9.92 9.92 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.45 1.27 4.94L2 22l5.06-1.27c1.5.81 3.17 1.27 4.94 1.27h.01c5.52 0 10-4.48 10-10 0-2.76-1.12-5.26-2.9-7.07Zm-1.63 12.54a8.37 8.37 0 0 1-11.23-11.23 8.37 8.37 0 0 1 11.23 11.23Z" />
    </svg>
)

export default function SupportPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-red-600">Support Center</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <Image src="https://placehold.co/600x400.png" alt="Support Illustration" width={300} height={200} className="mx-auto rounded-lg" data-ai-hint="support customer service"/>
                        <p className="text-muted-foreground">
                            Have questions? We're here to help!
                        </p>
                        <a href="https://wa.me/YOUR_WHATSAPP_NUMBER" target="_blank" rel="noopener noreferrer">
                            <Button className="w-full bg-green-500 hover:bg-green-600">
                                <WhatsAppIcon />
                                Contact on WhatsApp
                            </Button>
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-xl font-semibold text-red-600">Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
                 <div className="h-20 md:hidden" />
            </main>
        </div>
    );
}
