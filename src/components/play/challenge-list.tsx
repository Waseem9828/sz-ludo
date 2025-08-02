
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const challenges = [
  {
    name: "bos...",
    amount: 50,
    avatar: "https://placehold.co/40x40/E62E2D/FFFFFF.png",
    avatarFallback: "B"
  },
  {
    name: "Tahir...",
    amount: 500,
    avatar: "https://placehold.co/40x40/F5A623/FFFFFF.png",
    avatarFallback: "T"
  }
];

export default function ChallengeList() {
  return (
    <div className="space-y-4">
      {challenges.map((challenge, index) => (
        <Card key={index} className="bg-card shadow-sm">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Challenge set by</span>
                <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={challenge.avatar} alt={challenge.name} />
                        <AvatarFallback>{challenge.avatarFallback}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{challenge.name}</span>
                </div>
            </div>
            <div className="text-right">
              <p className="text-green-600 font-bold">₹ {challenge.amount}</p>
              <Link href={`/play/game?amount=${challenge.amount}`}>
                <Button size="sm" className="mt-1">Play</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
