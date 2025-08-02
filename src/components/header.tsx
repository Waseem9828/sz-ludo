
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Bell,
  PlusCircle,
  Menu,
  Home,
  History,
  User,
  Gift,
  FileText,
  Shield,
  LifeBuoy,
  ChevronRight,
  Dice5,
} from "lucide-react";
import Link from "next/link";

export default function Header() {
  const navItems = [
    { icon: Dice5, label: "Play", href: "/play" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: History, label: "History", href: "#" },
    { icon: User, label: "Profile", href: "#" },
    { icon: Gift, label: "Refer & Earn", href: "/refer" },
    { icon: FileText, label: "Term & Conditions", href: "#" },
    { icon: FileText, label: "GST Policy", href: "#" },
    { icon: Shield, label: "Privacy Policy", href: "#" },
    { icon: Shield, label: "Refund Policy", href: "#" },
    { icon: LifeBuoy, label: "Support", href: "#" },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-card">
              <SheetHeader className="p-4 border-b">
                 <SheetTitle>Navigation Menu</SheetTitle>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src="https://placehold.co/48x48.png"
                      alt="Waseem Akram"
                      data-ai-hint="avatar person"
                    />
                    <AvatarFallback>WA</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-bold font-headline">
                      Waseem Akram 👋
                    </h2>
                  </div>
                </div>
              </SheetHeader>
              <nav className="p-4">
                <ul>
                  {navItems.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <item.icon className="h-6 w-6 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
           <h1 className="text-xl font-headline font-bold text-primary">Ludo Lounge</h1>
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
