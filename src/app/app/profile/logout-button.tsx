"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    const supabase = createClient();
    supabase.auth.signOut(); // global invalidation in background
    window.location.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      Log out
    </button>
  );
}
