

'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Game, listenForGames } from "@/lib/firebase/games";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { Button } from "../ui/button";

export default function BattleList() {
  const [battles, setBattles] = useState<Game[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    // Listen only for 'ongoing' games where the user is a player.
    // Games 'under_review' will no longer be shown in this list.
    const unsubscribeOngoing = listenForGames((ongoingGames) => {
        const userBattles = ongoingGames.filter(b => b.player1?.uid === user.uid || b.player2?.uid === user.uid);
        setBattles(userBattles);
    }, 'ongoing');
    
    return () => {
        unsubscribeOngoing();
    };
  }, [user]);
  
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
    <div className="space-y-4">
      {battles.map((battle) => {
        if (!battle.player1 || !battle.player2) return null;
        
        const isPlayerInGame = battle.player1.uid === user.uid || battle.player2.uid === user.uid;

        return (
            <Card key={battle.id} className="bg-card shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={battle.player1.photoURL || undefined} alt={battle.player1.displayName || 'P1'} />
                        <AvatarFallback>{battle.player1.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{battle.player1.displayName}</span>
                    </div>

                    <div className="text-center">
                        <p className="font-bold text-red-600 text-lg animate-shine">₹{battle.amount}</p>
                        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEilS2_YhPAJBDjdcIRsoMJLTWafsJuIyola3KN50zXQAZYWSSIbhLhWhOJGMG6UYkUB5ZOiVKgsy2bVstr2af0LVf2g-eWjXHnGO4Z0IbaePP4E7TSDB9x_eK8OqTidX968zc5Wn9p6uGlkLoD9iglU3KZ28_2IbXgl29zHTZgwxzMWPvbN6zhA5AhyH7s/s1600/74920.png" alt="vs" width={64} height={32} className="mx-auto" data-ai-hint="versus icon" />
                        {isPlayerInGame && (
                             <Link href={`/play/game?id=${battle.id}`}>
                                <Button size="sm" variant="destructive" className="mt-1">
                                    View
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                    <span className="font-semibold">{battle.player2.displayName}</span>
                    <Avatar className="h-8 w-8">
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
