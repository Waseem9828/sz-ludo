import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function KycInfo() {
  return (
    <Card className="bg-accent/20 border-accent/50 text-accent-foreground shadow-lg">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-accent/30 p-3 rounded-full">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-bold font-headline text-lg text-foreground">Verify Your Account</h2>
            <p className="text-sm text-muted-foreground">Complete KYC to unlock all features.</p>
          </div>
        </div>
        <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-bold">
          Verify Now
        </Button>
      </CardContent>
    </Card>
  );
}
