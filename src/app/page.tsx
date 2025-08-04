
'use client'

import Header from '@/components/header';
import KycInfo from '@/components/kyc-info';
import GameListing from '@/components/game-listing';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/ui/splash-screen';
import { getSettings, AppSettings } from '@/lib/firebase/settings';

export default function Home() {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    getSettings().then(setSettings);

  }, [user, loading, router]);

  if (loading || !user || !appUser) {
    return <SplashScreen />;
  }

  const isKycPending = !appUser.kycStatus || appUser.kycStatus === 'Pending' || appUser.kycStatus === 'Rejected';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      {settings?.promotionBannerText && (
        <div className="bg-red-600 text-white text-center py-2 text-sm font-semibold">
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
      </main>
      {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}

    