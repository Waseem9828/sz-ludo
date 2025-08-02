
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, Download, Settings, Wallet, ChevronRight, Dice5, History, User, Gift, FileText, Shield, LifeBuoy, ShieldCheck, Sun, Moon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const { setTheme } = useTheme()

  const navItems = [
    { icon: Dice5, label: "Play", href: "/play" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: ShieldCheck, label: "KYC", href: "/kyc" },
    { icon: History, label: "History", href: "#" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Gift, label: "Refer & Earn", href: "/refer" },
    { icon: FileText, label: "Term & Conditions", href: "/terms" },
    { icon: FileText, label: "GST Policy", href: "/gst-policy" },
    { icon: Shield, label: "Privacy Policy", href: "/privacy-policy" },
    { icon: Shield, label: "Refund Policy", href: "/refund-policy" },
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
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
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
          <div className="flex items-center gap-1">
            <Link href="/">
              <Image src="/ak-logo.png" alt="AKADDA Logo" width={24} height={24} />
            </Link>
            <Link href="/">
              <h1 className="text-xl font-headline font-bold">AKADDA</h1>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="border-green-500 text-green-500">
            <Download className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
