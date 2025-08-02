
'use client'

import Header from "@/components/play/header";
import Typewriter from "@/components/ui/typewriter";

export default function GstPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center text-red-600">GST पॉलिसी (GST Policy)</h1>
                    
                    <Typewriter speed={10}>
                    <div className="space-y-6 text-foreground">
                        <p>अंतिम संशोधन तिथि: 02 अगस्त 2025</p>
                        <p>वेबसाइट: www.sz-ludo.com</p>
                        <p>स्वामी: SZ TAHIR KHAN</p>
                        <p>Gmail: tahirkhan@gmail.com</p>
                        <p>WhatsApp: 9982749204</p>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">1. GST (वस्तु और सेवा कर) का उद्देश्य</h2>
                            <p>SZ Ludo भारत सरकार द्वारा निर्धारित GST नियमों का पूरी तरह पालन करता है। हमारा उद्देश्य सभी डिजिटल सेवाओं पर लागू GST को सही तरीके से वसूल करना और सरकार को समय पर भुगतान करना है।</p>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">2. GST नंबर</h2>
                            <p>हमारी कंपनी एक रजिस्टर्ड GST व्यवसाय है। हमारा GSTIN (GST Identification Number): [यहाँ अपना GST नंबर डालें]</p>
                            <p>यदि आपके पास GSTIN नहीं है, तो आपको उपयोगकर्ता के रूप में व्यक्तिगत दर पर सेवाएं मिलेंगी (B2C)।</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">3. GST दरें (Applicable Rates)</h2>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border-b p-2">सेवा का नाम</th>
                                        <th className="border-b p-2">लागू GST दर (Rate)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border-b p-2">गेम एंट्री फीस</td>
                                        <td className="border-b p-2">18%</td>
                                    </tr>
                                    <tr>
                                        <td className="border-b p-2">प्रोसेसिंग फीस</td>
                                        <td className="border-b p-2">18%</td>
                                    </tr>
                                     <tr>
                                        <td className="border-b p-2">रिचार्ज या ऐड फंड</td>
                                        <td className="border-b p-2">0% (यदि सिर्फ वॉलेट में जोड़ा गया हो)</td>
                                    </tr>
                                     <tr>
                                        <td className="border-b p-2">सेवाएं/सबसक्रिप्शन</td>
                                        <td className="border-b p-2">18%</td>
                                    </tr>
                                     <tr>
                                        <td className="border-b p-2">रिडीम / विड्रॉल प्रोसेसिंग</td>
                                        <td className="border-b p-2">0% (User payout पर GST नहीं लगता)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">4. इनवॉइसिंग और बिलिंग</h2>
                            <p>सभी लेन-देन पर उपयोगकर्ता को GST बिल जारी किया जाएगा।</p>
                            <p>बिल में CGST (9%) + SGST (9%) या IGST (18%) को अलग-अलग दर्शाया जाएगा।</p>
                            <p>उपयोगकर्ता को अपने ईमेल और वेबसाइट डैशबोर्ड पर इनवॉइस की कॉपी मिलेगी।</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">5. इनपुट टैक्स क्रेडिट (ITC)</h2>
                            <p>यदि उपयोगकर्ता कोई कंपनी या व्यवसाय है और GSTIN प्रदान करता है, तो वह इनपुट टैक्स क्रेडिट का दावा कर सकता है।</p>
                            <p>उसके लिए कंपनी से संबंधित वैध दस्तावेज और GSTIN नंबर देना आवश्यक होगा।</p>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">6. GST भुगतान की जिम्मेदारी</h2>
                            <p>SZ Ludo सभी GST को मासिक और तिमाही रिटर्न में दाखिल करता है।</p>
                            <p>हम सरकार को GST समय पर जमा करते हैं, ताकि यूजर पर कोई अतिरिक्त टैक्स बर्डन न हो।</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">7. रिफंड पर GST</h2>
                            <p>यदि किसी कारणवश रिफंड किया जाता है, तो संबंधित GST राशि भी रिफंड की जाएगी।</p>
                            <p>रिफंड की स्थिति में पूरा इनवॉइस रिवर्स किया जाएगा।</p>
                        </div>

                        <hr className="my-4"/>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">8. विवाद की स्थिति में</h2>
                            <p>कोई भी विवाद GST से जुड़ा हुआ है तो वह भारत सरकार के अप्रत्यक्ष कर न्यायाधिकरण (Indirect Tax Tribunal) के अधीन होगा।</p>
                            <p>SZ Ludo केवल उन्हीं सेवाओं पर GST चार्ज करता है जो कानूनी रूप से टैक्स योग्य हैं।</p>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">9. संपर्क करें</h2>
                            <p>यदि आपके पास GST से संबंधित कोई प्रश्न है, तो कृपया हमसे नीचे दिए गए माध्यमों से संपर्क करें:</p>
                            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                               <li>📧 Email: tahirkhan@gmail.com</li>
                               <li>📞 WhatsApp: 9982749204</li>
                               <li>🌐 Website: www.sz-ludo.com</li>
                            </ul>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">नोट:</h2>
                            <p>यह पॉलिसी समय-समय पर सरकार की टैक्स गाइडलाइन के अनुसार अपडेट की जा सकती है।</p>
                        </div>
                    </div>
                    </Typewriter>
                </div>
            </main>
        </div>
    );
}
