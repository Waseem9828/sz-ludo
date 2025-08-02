import Header from '@/components/play/header';
import ChallengeList from '@/components/play/challenge-list';
import BattleList from '@/components/play/battle-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PlayPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Input type="text" placeholder="Amount" className="bg-white" />
          <Button className="bg-gray-800 text-white">Set</Button>
        </div>
        
        <section>
           <div className="flex items-center justify-center my-4">
            <hr className="w-full border-gray-300" />
            <span className="mx-4 text-muted-foreground font-semibold whitespace-nowrap">
              🏆 Open Battles (Classic) 🏆
            </span>
            <hr className="w-full border-gray-300" />
          </div>
          <ChallengeList />
        </section>

        <section>
          <BattleList />
        </section>
      </main>
      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full bg-green-500 hover:bg-green-600 w-14 h-14">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle h-8 w-8 text-white"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        </Button>
      </div>
    </div>
  );
}
