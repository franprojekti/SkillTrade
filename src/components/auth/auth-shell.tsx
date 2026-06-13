"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="relative z-10 w-full max-w-sm">
      {/* Card */}
      <div className="bg-card border border-border rounded-xl px-8 pt-8 pb-8 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <Image src="/logo.png" alt="SkillTrade" width={120} height={120} className="object-contain" priority />
        </div>

        {/* Login / Register toggle */}
        <div className="flex bg-muted rounded-full p-1 mb-7 gap-1">
          <Link
            href="/login"
            className={cn(
              "flex-1 text-center py-2 text-sm font-semibold rounded-full transition-colors",
              isLogin
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Login
          </Link>
          <Link
            href="/register"
            className={cn(
              "flex-1 text-center py-2 text-sm font-semibold rounded-full transition-colors",
              !isLogin
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Register
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
