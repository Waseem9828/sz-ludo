import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

interface KycInfoProps {
  title: string;
  description: string;
}

export default function KycInfo({ title, description }: KycInfoProps) {
  return (
    <Card className="bg-accent/20 border-accent/50 text-accent-foreground shadow-lg">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-accent/30 p-3 rounded-full">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-bold font-headline text-lg text-red-600">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Link href="/kyc">
          <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold">
            Verify Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
