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
    <Card className="bg-primary/10 border-primary/20 text-primary-foreground shadow-lg">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-full">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold font-headline text-lg text-red-600 animate-shine">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Link href="/kyc">
          <Button variant="default">
            Verify Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
