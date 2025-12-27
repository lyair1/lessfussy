"use client";

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Baby,
  Home,
  History,
  Settings,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User, Baby as BabyType } from "@/lib/db/schema";

type BabyWithMeta = BabyType & { isShared: boolean; role: string };

interface BabyContextType {
  selectedBaby: BabyWithMeta | null;
  setSelectedBaby: (baby: BabyWithMeta | null) => void;
  babies: BabyWithMeta[];
}

const BabyContext = createContext<BabyContextType>({
  selectedBaby: null,
  setSelectedBaby: () => {},
  babies: [],
});

export const useBaby = () => useContext(BabyContext);

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/history", icon: History, label: "History" },
  { href: "/babies", icon: Baby, label: "Babies" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface DashboardShellProps {
  user: User;
  babies: BabyWithMeta[];
  children: React.ReactNode;
}

export function DashboardShell({ user, babies, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<BabyWithMeta | null>(
    babies[0] || null
  );

  return (
    <BabyContext.Provider value={{ selectedBaby, setSelectedBaby, babies }}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="w-full flex h-14 items-center justify-between px-4 md:px-6">
            {/* Logo and baby selector */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">BabyTrack</span>
              </Link>

              {babies.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={selectedBaby?.photoUrl || undefined} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {selectedBaby?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium">
                        {selectedBaby?.name || "Select baby"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {babies.map((baby) => (
                      <DropdownMenuItem
                        key={baby.id}
                        onClick={() => setSelectedBaby(baby)}
                        className={cn(
                          "flex items-center gap-2",
                          selectedBaby?.id === baby.id && "bg-accent"
                        )}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={baby.photoUrl || undefined} />
                          <AvatarFallback className="bg-muted text-xs">
                            {baby.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{baby.name}</span>
                        {baby.isShared && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            shared
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />

              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-border">
                      <h2 className="font-semibold">Menu</h2>
                    </div>
                    <nav className="flex-1 p-4">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 mb-1"
                          >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                          </Button>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 w-full px-4 md:px-6 py-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-50">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2 px-3",
                    pathname === item.href && "text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </nav>

        {/* Spacer for mobile bottom nav */}
        <div className="md:hidden h-16" />
      </div>
    </BabyContext.Provider>
  );
}

