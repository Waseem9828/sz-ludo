
'use client'

import Header from "@/components/play/header";
import Typewriter from "@/components/ui/typewriter";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/firebase/settings";
import { SplashScreen } from "@/components/ui/splash-screen";
import { Remarkable } from 'remarkable';

export default function TermsPage() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSettings().then(settings => {
            if (settings.termsContent) {
                const md = new Remarkable();
                setContent(md.render(settings.termsContent));
            } else {
                setContent("Terms and Conditions have not been configured yet.");
            }
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background font-body">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-6 space-y-6">
                <div className="bg-card p-6 md:p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold mb-6 font-headline text-center text-red-600">Terms and Conditions</h1>
                    
                    <Typewriter speed={10}>
                         <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                    </Typewriter>
                </div>
            </main>
        </div>
    );
}
