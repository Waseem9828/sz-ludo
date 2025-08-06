'use client'

import React, { useState, useEffect } from 'react';
import Header from '@/components/play/header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/ui/splash-screen';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';
import Link from 'next/link';
import { getSettings, AppSettings } from '@/lib/firebase/settings';

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    getSettings().then(setSettings);
  }, [user, loading, router]);


  if (loading || !user) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
       {settings?.promotionBannerText && (
          <div className="bg-red-600 text-white text-center py-2 text-sm font-semibold animate-shine-bg">
            {settings.promotionBannerText}
          </div>
        )}
      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
                <div className="flex flex-col sm:flex-row items-center justify-between my-4 gap-2">
                    <h2 className="text-red-600 font-semibold text-lg text-center">
                      🏆 Open Battles 🏆
                    </h2>
                    <Link href="/play/create" className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full">Create New</Button>
                    </Link>
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
      </main>
    </div>
  );
}
