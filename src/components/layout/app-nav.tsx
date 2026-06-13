"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Bookmark,
  User,
  UserPlus,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppNavProps {
  username: string;
  displayName?: string | null;
  unreadNotifications?: number;
  unreadMessages?: number;
  newMatches?: number;
}

const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Dashboard", icon: Home },
  { href: "/app/matches", label: "Matches", icon: Users },
  { href: "/app/requests", label: "Requests", icon: UserPlus },
  { href: "/app/chat", label: "Chat", icon: MessageSquare },
  { href: "/app/saved", label: "Saved", icon: Bookmark },
];

export function AppNav({
  username,
  displayName,
  unreadNotifications = 0,
  unreadMessages = 0,
  newMatches = 0,
}: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    const supabase = createClient();
    supabase.auth.signOut(); // global invalidation in background
    window.location.replace("/");
  }

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/app/dashboard"
            className="hover:opacity-80 transition-opacity"
          >
            <Image src="/logo.png" alt="SkillTrade" width={130} height={52} className="object-contain h-13 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              const badge =
                href === "/app/chat"
                  ? unreadMessages
                  : href === "/app/requests"
                  ? unreadNotifications
                  : href === "/app/matches"
                  ? newMatches
                  : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {badge > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open profile menu">
              <InitialsAvatar
                username={username}
                displayName={displayName}
                size="sm"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                @{username}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/app/profile")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/app/settings")}
                className="cursor-pointer"
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            const badge =
              href === "/app/chat"
                ? unreadMessages
                : href === "/app/requests"
                ? unreadNotifications
                : href === "/app/matches"
                ? newMatches
                : 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0",
                  isActive ? "bg-muted/80 text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
                {badge > 0 && !isActive && (
                  <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors outline-none",
                pathname.startsWith("/app/profile")
                  ? "bg-muted/80 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <InitialsAvatar username={username} displayName={displayName} size="sm" />
              <span className="text-[10px] font-medium">Profile</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48 mb-2">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">@{username}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/app/profile")} className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/app/settings")} className="cursor-pointer">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
