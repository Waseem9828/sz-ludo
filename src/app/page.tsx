import Header from '@/components/header';
import KycInfo from '@/components/kyc-info';
import GameListing from '@/components/game-listing';

export default function Home() {
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
