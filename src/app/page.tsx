
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
                <div className="flex items-center justify-between my-4">
                    <span className="text-red-600 font-semibold whitespace-nowrap text-lg">
                    🏆 Open Challenges
                    </span>
                    <Link href="/play">
                        <Button variant="outline" size="sm">Create New</Button>
                    </Link>
                </div>
                <ChallengeList />
            </section>

            <section>
                <div className="flex items-center justify-center my-4">
                    <span className="text-red-600 font-semibold whitespace-nowrap text-lg">
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
  );
}
