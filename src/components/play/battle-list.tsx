
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Game, listenForGames } from "@/lib/firebase/games";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function BattleList() {
  const [battles, setBattles] = useState<Game[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
        setBattles([]);
        return;
    }
    
    // This listener fetches ongoing games where the current user is a player.
    const unsubscribe = listenForGames((ongoingGames) => {
        const userBattles = ongoingGames.filter(b => b.player1?.uid === user.uid || b.player2?.uid === user.uid);
        setBattles(userBattles);
    }, 'ongoing');
    
    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [user]);
  
  const handleBattleClick = (gameId: string) => {
    router.push(`/play/game?id=${gameId}`);
  };

  if (!user) {
       return (
          <div className="text-center text-muted-foreground py-4">
              <p>Login to see your battles.</p>
          </div>
      )
  }

  if (battles.length === 0) {
      return (
          <div className="text-center text-muted-foreground py-4">
              <p>No ongoing battles.</p>
              <p className="text-xs">Accept a challenge to start a new battle!</p>
          </div>
      )
  }

  return (
    <div className="space-y-3">
      {battles.map((battle) => {
        if (!battle.player1 || !battle.player2) return null;
        
        return (
            <Card 
                key={battle.id} 
                className="bg-card shadow-sm hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleBattleClick(battle.id)}
            >
                <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 basis-2/5 overflow-hidden">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={battle.player1.photoURL || undefined} alt={battle.player1.displayName || 'P1'} />
                        <AvatarFallback>{battle.player1.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="flex items-center gap-1">
                        <span className="font-semibold truncate">{battle.player1.displayName}</span>
                        {battle.player1.isKycVerified && <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                    </div>
                    </div>

                    <div className="text-center basis-1/5">
                        <p className="font-bold text-red-600 text-lg animate-shine">₹{battle.amount}</p>
                        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEilS2_YhPAJBDjdcIRsoMJLTWafsJuIyola3KN50zXQAZYWSSIbhLhWhOJGMG6UYkUB5ZOiVKgsy2bVstr2af0LVf2g-eWjXHnGO4Z0IbaePP4E7TSDB9x_eK8OqTidX968zc5Wn9p6uGlkLoD9iglU3KZ28_2IbXgl29zHTZgwxzMWPvbN6zhA5AhyH7s/s1600/74920.png" alt="vs" width={48} height={24} className="mx-auto" data-ai-hint="versus icon" />
                    </div>

                    <div className="flex items-center justify-end gap-2 basis-2/5 overflow-hidden">
                     <div className="flex items-center gap-1">
                        <span className="font-semibold truncate">{battle.player2.displayName}</span>
                        {battle.player2.isKycVerified && <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                    </div>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={battle.player2.photoURL || undefined} alt={battle.player2.displayName || 'P2'} />
                        <AvatarFallback>{battle.player2.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    </div>
                </CardContent>
            </Card>
        )
    })}
    </div>
  );
}
