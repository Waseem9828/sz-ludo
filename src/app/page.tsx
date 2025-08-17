
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
import AnimatedBanner from '@/components/animated-banner';

function Home() {
  const { user, appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [showFestiveDialog, setShowFestiveDialog] = useState(false);
  const [showFestiveBackground, setShowFestiveBackground] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (user && appUser) {
        getSettings().then(appSettings => {
            setSettings(appSettings);

            if (appSettings.festiveGreeting?.enabled && appSettings.festiveGreeting.type !== 'None') {
                setShowFestiveBackground(true);
                const lastShownKey = `festiveGreetingLastShown_${appSettings.festiveGreeting.type}`;
                const lastShown = localStorage.getItem(lastShownKey);
                const now = new Date().getTime();
                
                if (!lastShown || (now - Number(lastShown) > 24 * 60 * 60 * 1000)) {
                    setShowFestiveDialog(true);
                    localStorage.setItem(lastShownKey, now.toString());
                }
            }
        }).finally(() => {
            setSettingsLoading(false);
        });
    } else if (!authLoading) {
        setSettingsLoading(false);
    }
  }, [user, appUser, authLoading]);
  
  const handleDialogClose = (isOpen: boolean) => {
    setShowFestiveDialog(isOpen);
    if (!isOpen) {
        setShowFestiveBackground(false); 
    }
  }

  if (authLoading || settingsLoading) {
    return <SplashScreen />;
  }
  
  if (!user || !appUser) {
    // This case should be handled by the redirect effect, but as a fallback:
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
              <AnimatedBanner text={settings.promotionBannerText} />
            )}
            <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
              {isKycPending && (
                <KycInfo 
                  title="Verify Your Account"
                  description="Complete KYC to unlock all features."
                />
              )}
              {settings && settings.homePageCards && <GameListing cards={settings.homePageCards} />}
            </main>
          </div>
      </div>
    </>
  );
}

export default Home;
