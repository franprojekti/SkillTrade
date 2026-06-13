"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  username: string;
  displayName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

const ICON_CLASSES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
};

export function InitialsAvatar({
  username,
  displayName,
  size = "md",
  className,
}: InitialsAvatarProps) {
  const name = displayName || username;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 bg-muted",
        SIZE_CLASSES[size],
        className
      )}
      aria-label={`Avatar for ${name}`}
    >
      <User className={cn("text-primary", ICON_CLASSES[size])} />
    </div>
  );
}
