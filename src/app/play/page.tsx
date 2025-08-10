
'use client'

import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/ui/splash-screen';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';
import Link from 'next/link';
import { getSettings, AppSettings } from '@/lib/firebase/settings';
import AnimatedBanner from '@/components/animated-banner';
import { RefreshCw } from 'lucide-react';

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    getSettings().then(setSettings);
  }, [user, loading, router]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };


  if (loading || !user) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
       {settings?.promotionBannerText && (
          <AnimatedBanner text={settings.promotionBannerText} />
        )}
      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
                <div className="flex flex-col sm:flex-row items-center justify-between my-4 gap-2">
                    <h2 className="text-red-600 font-semibold text-lg text-center">
                      🏆 Open Battles 🏆
                    </h2>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCw className={isRefreshing ? 'animate-spin' : ''}/>
                        </Button>
                        <Link href="/play/create" className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="w-full">Create Open Battle</Button>
                        </Link>
                    </div>
                </div>
                <ChallengeList />
            </section>

            <section>
                <div className="flex items-center justify-center my-4">
                    <h2 className="text-red-600 font-semibold text-lg text-center">
                       ⚔️ Ongoing Battles ⚔️
                    </h2>
                </div>
                <BattleList />
            </section>
        </div>
        {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
        <div className="h-20 md:hidden" />
      </main>
    </div>
  );
}
