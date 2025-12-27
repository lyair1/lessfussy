"use client";

import { useState, createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Baby,
  Home,
  History,
  Settings,
  Menu,
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

// Helper to get current baby ID from URL
function getBabyIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/baby\/([^/]+)/);
  return match ? match[1] : null;
}

// Helper to build nav items based on current baby
function getNavItems(babyId: string | null) {
  if (babyId) {
    return [
      { href: `/baby/${babyId}`, icon: Home, label: "Home" },
      { href: `/baby/${babyId}/history`, icon: History, label: "History" },
      { href: "/babies", icon: Baby, label: "Babies" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ];
  }
  return [
    { href: "/", icon: Home, label: "Home" },
    { href: "/babies", icon: Baby, label: "Babies" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];
}

interface DashboardShellProps {
  user: User;
  babies: BabyWithMeta[];
  children: React.ReactNode;
}

export function DashboardShell({ user, babies, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get baby ID from URL
  const babyIdFromUrl = getBabyIdFromPath(pathname);
  
  // Find the baby from URL or default to first baby
  const [selectedBaby, setSelectedBaby] = useState<BabyWithMeta | null>(() => {
    if (babyIdFromUrl) {
      return babies.find((b) => b.id === babyIdFromUrl) || babies[0] || null;
    }
    return babies[0] || null;
  });

  // Sync selectedBaby with URL changes
  useEffect(() => {
    if (babyIdFromUrl) {
      const baby = babies.find((b) => b.id === babyIdFromUrl);
      if (baby && baby.id !== selectedBaby?.id) {
        setSelectedBaby(baby);
      }
    }
  }, [babyIdFromUrl, babies, selectedBaby?.id]);

  // Handle baby selection from dropdown - navigate to that baby's page
  const handleBabySelect = (baby: BabyWithMeta) => {
    setSelectedBaby(baby);
    
    // If we're on a baby-specific route, navigate to the same route for the new baby
    if (babyIdFromUrl) {
      const newPath = pathname.replace(`/baby/${babyIdFromUrl}`, `/baby/${baby.id}`);
      router.push(newPath);
    } else {
      // If we're on a non-baby route (like /), navigate to the baby's dashboard
      router.push(`/baby/${baby.id}`);
    }
  };

  const navItems = getNavItems(selectedBaby?.id || null);
  
  // Check if current path matches nav item (handle both exact and prefix matches)
  const isActiveNav = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href.startsWith("/baby/") && pathname.startsWith("/baby/")) {
      // For baby routes, check if it's the same baby and same sub-route
      const hrefParts = href.split("/");
      const pathParts = pathname.split("/");
      
      // Match /baby/[id] exactly or /baby/[id]/history exactly
      if (hrefParts.length === 3 && pathParts.length === 3) {
        // Both are /baby/[id] - home
        return hrefParts[2] === pathParts[2];
      }
      if (hrefParts.length === 4 && pathParts.length >= 4) {
        // Check /baby/[id]/history matches
        return hrefParts[2] === pathParts[2] && hrefParts[3] === pathParts[3];
      }
      // /baby/[id] matches /baby/[id] but not /baby/[id]/something
      if (hrefParts.length === 3 && pathParts.length > 3) {
        return false;
      }
    }
    return pathname === href;
  };

  return (
    <BabyContext.Provider value={{ selectedBaby, setSelectedBaby, babies }}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="w-full flex h-14 items-center justify-between px-4 md:px-6">
            {/* Logo and baby selector */}
            <div className="flex items-center gap-3">
              <Link href={selectedBaby ? `/baby/${selectedBaby.id}` : "/"} className="flex items-center gap-2">
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
                        onClick={() => handleBabySelect(baby)}
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
                    variant={isActiveNav(item.href) ? "secondary" : "ghost"}
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
                            variant={isActiveNav(item.href) ? "secondary" : "ghost"}
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
                    isActiveNav(item.href) && "text-primary"
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
