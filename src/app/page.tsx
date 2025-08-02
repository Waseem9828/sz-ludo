

'use client'

import Header from '@/components/header';
import KycInfo from '@/components/kyc-info';
import GameListing from '@/components/game-listing';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        <KycInfo 
          title="Verify Your Account"
          description="Complete KYC to unlock all features."
        />
        <GameListing />
      </main>
      {/* Spacer to prevent content from being hidden by the fixed bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
