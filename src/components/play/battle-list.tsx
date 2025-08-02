import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

const battles = [
  {
    player1: { name: "cuvbd...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "C" },
    player2: { name: "MnMBR...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "M" },
    amount: 450,
  },
  {
    player1: { name: "IfffN...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "I" },
    player2: { name: "Shri...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "S" },
    amount: 150,
  },
  {
    player1: { name: "Mohit...", avatar: "https://placehold.co/40x40/F5A623/FFFFFF.png", fallback: "M" },
    player2: { name: "JvNqA...", avatar: "https://placehold.co/40x40/4A90E2/FFFFFF.png", fallback: "J" },
    amount: 3500,
  },
  {
    player1: { name: "Sahil...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "S" },
    player2: { name: "UmIIR...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "U" },
    amount: 650,
  },
  {
    player1: { name: "tevPN...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "T" },
    player2: { name: "Loose...", avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png", fallback: "L" },
    amount: 200,
  },
];

export default function BattleList() {
  return (
    <div className="space-y-4">
      {battles.map((battle, index) => (
        <Card key={index} className="bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={battle.player1.avatar} alt={battle.player1.name} />
                <AvatarFallback>{battle.player1.fallback}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{battle.player1.name}</span>
            </div>

            <div className="flex flex-col items-center">
              <Image src="/vs.png" alt="vs" width={24} height={24} />
              <span className="text-green-600 font-bold mt-1">Rs {battle.amount}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">{battle.player2.name}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={battle.player2.avatar} alt={battle.player2.name} />
                <AvatarFallback>{battle.player2.fallback}</AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
