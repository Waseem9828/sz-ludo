
'use client'

import Header from '@/components/header';
import KycInfo from '@/components/kyc-info';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/ui/splash-screen';
import { getSettings, AppSettings } from '@/lib/firebase/settings';
import GameListing from '@/components/game-listing';
import { FestiveDialog, FestiveBackground } from '@/components/ui/festive-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showFestiveDialog, setShowFestiveDialog] = useState(false);
  const [showFestiveBackground, setShowFestiveBackground] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    getSettings().then(appSettings => {
      let activeSettings = { ...appSettings };
      const today = new Date();
      const month = today.getMonth(); // 0-indexed (0 for Jan, 7 for Aug)
      const day = today.getDate();

      // Automatically trigger Independence Day theme from Aug 1 to Aug 15, overriding admin settings
      if (month === 7 && day >= 1 && day <= 15) {
        activeSettings.festiveGreeting = {
          enabled: true,
          type: 'IndependenceDay',
          message: 'Happy Independence Day!',
        };
      }

      setSettings(activeSettings);

      // Show background if any festive greeting is enabled
      if (activeSettings.festiveGreeting?.enabled && activeSettings.festiveGreeting.type !== 'None') {
        setShowFestiveBackground(true);

        // Logic to show the popup dialog only once per 24 hours
        const lastShownKey = `festiveGreetingLastShown_${activeSettings.festiveGreeting.type}`;
        const lastShown = localStorage.getItem(lastShownKey);
        const now = new Date().getTime();
        
        if (!lastShown || (now - Number(lastShown) > 24 * 60 * 60 * 1000)) {
          setShowFestiveDialog(true);
          localStorage.setItem(lastShownKey, now.toString());
        }
      }
    });

  }, [user, loading, router]);
  
  const handleDialogClose = (isOpen: boolean) => {
    setShowFestiveDialog(isOpen);
    // if the background should disappear when the dialog is manually closed
    if (!isOpen) {
        setShowFestiveBackground(false); 
    }
  }

  if (loading || !user || !appUser) {
    return <SplashScreen />;
  }
  
  const isKycPending = !appUser.kycStatus || appUser.kycStatus === 'Pending' || appUser.kycStatus === 'Rejected';

  return (
    <>
      <div className="relative min-h-screen">
          {showFestiveBackground && settings?.festiveGreeting && (
            <FestiveBackground type={settings.festiveGreeting.type} />
          )}
          <div className="relative z-10 flex flex-col min-h-screen bg-transparent text-foreground font-body">
            {settings?.festiveGreeting && (
                <FestiveDialog
                  isOpen={showFestiveDialog}
                  setIsOpen={handleDialogClose}
                  type={settings.festiveGreeting.type}
                  message={settings.festiveGreeting.message}
                />
            )}
            <Header />
            {settings?.promotionBannerText && (
              <div className="bg-red-600 text-white text-center py-2 text-sm font-semibold animate-shine-bg">
                {settings.promotionBannerText}
              </div>
            )}
            <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
              {isKycPending && (
                <KycInfo 
                  title="Verify Your Account"
                  description="Complete KYC to unlock all features."
                />
              )}
              {settings && <GameListing cards={settings.homePageCards} />}
            </main>
          </div>
      </div>
    </>
  );
}
