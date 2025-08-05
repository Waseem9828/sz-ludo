

'use client'

import Header from '@/components/header';
import KycInfo from '@/components/kyc-info';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/ui/splash-screen';
import { getSettings, AppSettings } from '@/lib/firebase/settings';
import GameListing from '@/components/game-listing';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FestiveDialog, FestiveBackground } from '@/components/ui/festive-dialog';

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
      let activeSettings = appSettings;
      const today = new Date();
      const month = today.getMonth(); // 0-indexed (0 for Jan, 7 for Aug)
      const day = today.getDate();

      // Automatically trigger Independence Day theme from Aug 1 to Aug 15
      if (month === 7 && day >= 1 && day <= 15) {
        activeSettings = {
          ...appSettings,
          festiveGreeting: {
            enabled: true,
            type: 'IndependenceDay',
            message: 'Happy Independence Day!',
          }
        };
        setShowFestiveBackground(true);
      }

      setSettings(activeSettings);
      
      if (activeSettings.festiveGreeting?.enabled) {
          const lastShownKey = `festiveGreetingLastShown_${activeSettings.festiveGreeting.type}`;
          const lastShown = localStorage.getItem(lastShownKey);
          const now = new Date().getTime();
          // Show if never shown or if it has been more than 24 hours
          if (!lastShown || (now - Number(lastShown) > 24 * 60 * 60 * 1000)) {
              setShowFestiveDialog(true);
              localStorage.setItem(lastShownKey, now.toString());
          }
      }
    });

  }, [user, loading, router]);

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
            {showFestiveDialog && settings?.festiveGreeting && (
                <FestiveDialog
                  isOpen={showFestiveDialog}
                  setIsOpen={setShowFestiveDialog}
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
              <GameListing />
              
              <div className="text-center my-4">
                <p className="text-lg font-semibold text-muted-foreground">Or, choose from a running game below</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section>
                      <div className="flex items-center justify-between my-4">
                          <span className="text-red-600 font-semibold whitespace-nowrap text-lg animate-shine">
                          ≤--------------🏆Open Battles🏆------------&gt;
                          </span>
                          <Link href="/play">
                              <Button variant="outline" size="sm">Create New</Button>
                          </Link>
                      </div>
                      <ChallengeList />
                  </section>

                  <section>
                      <div className="flex items-center justify-center my-4">
                          <span className="text-red-600 font-semibold whitespace-nowrap text-lg animate-shine">
                          ⚔️ Ongoing Battles
                          </span>
                      </div>
                      <BattleList />
                  </section>
              </div>

            </main>
            {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
            <div className="h-20 md:hidden" />
          </div>
      </div>
    </>
  );
}
