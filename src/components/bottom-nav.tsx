import { Home, Wallet, BookText, User } from "lucide-react";

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: "Home", href: "#", active: true },
    { icon: Wallet, label: "Wallet", href: "#", active: false },
    { icon: BookText, label: "Rules", href: "#", active: false },
    { icon: User, label: "Profile", href: "#", active: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${
              item.active ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
