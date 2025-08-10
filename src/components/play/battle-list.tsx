
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Game, listenForGames } from "@/lib/firebase/games";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { motion } from 'framer-motion';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

export default function BattleList() {
  const [battles, setBattles] = useState<Game[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = listenForGames(setBattles, 'ongoing');
    return () => unsubscribe();
  }, []); 
  
  const handleBattleClick = (gameId: string) => {
    router.push(`/play/game?id=${gameId}`);
  };

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
            <motion.div 
                key={battle.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Card 
                    className="bg-card shadow-sm hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleBattleClick(battle.id)}
                >
                    <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 basis-2/5 overflow-hidden">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={battle.player1.photoURL || defaultAvatar} alt={battle.player1.displayName || 'P1'} />
                            <AvatarFallback>{battle.player1.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                         <div className="flex-grow overflow-hidden">
                            <div className="flex items-center gap-1">
                                <span className="font-semibold truncate">{battle.player1.displayName}</span>
                                {battle.player1.isKycVerified && <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {battle.player1_result ? 'Result Submitted' : 'Waiting for Result'}
                            </p>
                        </div>
                        </div>

                        <div className="text-center basis-1/5">
                            <p className="font-bold text-red-600">₹{battle.amount}</p>
                            <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEilS2_YhPAJBDjdcIRsoMJLTWafsJuIyola3KN50zXQAZYWSSIbhLhWhOJGMG6UYkUB5ZOiVKgsy2bVstr2af0LVf2g-eWjXHnGO4Z0IbaePP4E7TSDB9x_eK8OqTidX968zc5Wn9p6uGlkLoD9iglU3KZ28_2IbXgl29zHTZgwxzMWPvbN6zhA5AhyH7s/s1600/74920.png" alt="vs" width={32} height={16} className="mx-auto" data-ai-hint="versus icon" />
                        </div>

                        <div className="flex items-center justify-end gap-2 basis-2/5 overflow-hidden">
                        <div className="flex-grow overflow-hidden text-right">
                             <div className="flex items-center justify-end gap-1">
                                <span className="font-semibold truncate">{battle.player2.displayName}</span>
                                {battle.player2.isKycVerified && <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                            </div>
                             <p className="text-xs text-muted-foreground">
                                {battle.player2_result ? 'Result Submitted' : 'Waiting for Result'}
                            </p>
                        </div>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={battle.player2.photoURL || defaultAvatar} alt={battle.player2.displayName || 'P2'} />
                            <AvatarFallback>{battle.player2.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    })}
    </div>
  );
}
