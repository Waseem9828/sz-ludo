
'use client'

import Header from "@/components/play/header";
import Typewriter from "@/components/ui/typewriter";

export default function RefundPolicyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center text-red-600">Refund Policy</h1>
                    
                    <Typewriter speed={10}>
                    <div className="space-y-6 text-foreground">
                        <p>प्रभावी तिथि: 2 अगस्त 2025</p>
                        <p>आखिरी अपडेट: 2 अगस्त 2025</p>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">1. 🔁 रिफंड नीति का उद्देश्य:</h2>
                            <p>SZ-Ludo.com पर हमारा लक्ष्य है कि सभी उपयोगकर्ताओं को सुरक्षित और पारदर्शी लेन-देन का अनुभव मिले। हम उपयोगकर्ताओं को एक-दूसरे से कनेक्ट करने और Ludo King जैसे गेम्स खेलने के लिए एक प्लेटफॉर्म प्रदान करते हैं। चूंकि हम खुद कोई गेम या विनिंग राशि प्रदान नहीं करते, बल्कि सिर्फ कनेक्टिविटी और वॉलेट सर्विस प्रोवाइड करते हैं, इसलिए रिफंड पॉलिसी कुछ शर्तों पर आधारित है।</p>
                        </div>

                        <hr className="my-4"/>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">2. 💳 रिफंड के लिए पात्रता:</h2>
                            <p>नीचे दिए गए मामलों में ही रिफंड की संभावना होगी:</p>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>यदि उपयोगकर्ता का वॉलेट से अमाउंट डेबिट हो गया है लेकिन मैच में पार्टनर जुड़ नहीं पाया हो।</li>
                                <li>यदि तकनीकी त्रुटि के कारण भुगतान प्रोसेस हुआ लेकिन सेवा प्रदान नहीं हो सकी।</li>
                                <li>यदि पेमेंट किया गया लेकिन नेटवर्क फेलियर या ऐप/वेबसाइट डाउन होने के कारण गेम कनेक्शन संभव नहीं हो सका।</li>
                                <li>यदि पेमेंट डबल हो गया हो।</li>
                            </ul>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">3. ❌ रिफंड नहीं मिलेगा इन मामलों में:</h2>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>यदि उपयोगकर्ता गेम हार गया हो।</li>
                                <li>यदि उपयोगकर्ता ने गलत रूम कोड एंटर किया हो।</li>
                                <li>यदि उपयोगकर्ता ने अपने मन से गेम से एग्जिट कर दिया हो।</li>
                                <li>अगर किसी कारण से Ludo King ऐप की ओर से कनेक्टिविटी फेल हो (जैसे नेटवर्क इश्यू)।</li>
                                <li>यदि गेम खेला जा चुका हो और दोनों यूज़र सहमत थे।</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>
                        
                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">4. 📝 रिफंड के लिए प्रक्रिया:</h2>
                            <ol className="list-decimal list-inside pl-4 space-y-2">
                                <li>उपयोगकर्ता को 24 घंटे के भीतर support@sz-ludo.com पर ईमेल करना होगा या [WhatsApp: 9982749204] पर संपर्क करना होगा।</li>
                                <li>
                                    ईमेल में निम्नलिखित जानकारी देना अनिवार्य है:
                                    <ul className="list-disc list-inside pl-6 space-y-1 mt-1">
                                        <li>रजिस्टर्ड नाम और मोबाइल नंबर</li>
                                        <li>ट्रांज़ैक्शन आईडी और स्क्रीनशॉट</li>
                                        <li>गेम कोड और दिनांक</li>
                                        <li>समस्या का पूरा विवरण</li>
                                    </ul>
                                </li>
                                <li>हमारी टीम 48 घंटों के भीतर अनुरोध की समीक्षा करेगी और 5–7 कार्यदिवसों में रिफंड प्रोसेस करेगी (यदि मान्य हुआ तो)।</li>
                            </ol>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">5. 💰 रिफंड का तरीका:</h2>
                            <p>रिफंड उपयोगकर्ता के SZ-Ludo वॉलेट में जोड़ा जाएगा या उसी माध्यम से किया जाएगा जिससे पेमेंट प्राप्त हुआ था (जैसे UPI, बैंक ट्रांसफर आदि)।</p>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">6. 🕐 समयसीमा:</h2>
                             <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>रिफंड अनुरोध अधिकतम 24 घंटे में भेजा जाना चाहिए।</li>
                                <li>24 घंटे के बाद किए गए अनुरोधों पर विचार नहीं किया जाएगा।</li>
                            </ul>
                        </div>
                        
                        <hr className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold font-headline mb-3 text-red-600">7. 📌 विशेष नोट:</h2>
                            <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                <li>हमारी पॉलिसी समय-समय पर अपडेट हो सकती है।</li>
                                <li>उपयोगकर्ताओं को यह सुनिश्चित करना होगा कि उन्होंने हमारी [Terms of Service] और [Privacy Policy] को पढ़ा और स्वीकार किया है।</li>
                            </ul>
                        </div>

                        <hr className="my-4"/>

                        <div>
                           <p className="font-bold text-center">आपका विश्वास ही हमारी सबसे बड़ी जीत है।</p>
                           <p className="mt-4 font-semibold text-center">कोई भी सहायता हेतु संपर्क करें:</p>
                           <ul className="list-disc list-inside pl-4 space-y-1 mt-2 text-center list-none">
                                <li>📧 Email: support@sz-ludo.com</li>
                                <li>📱 WhatsApp: 9982749204</li>
                                <li>🌐 Website: www.sz-ludo.com</li>
                           </ul>
                        </div>

                    </div>
                    </Typewriter>
                </div>
            </main>
        </div>
    );
}
