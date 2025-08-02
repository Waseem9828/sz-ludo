import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Wallet, Bell, PlusCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="avatar person" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-headline font-bold text-primary">Ludo Lounge</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="w-4 h-4" />
              <span>₹1,250.00</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="rounded-full font-bold">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Cash
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
