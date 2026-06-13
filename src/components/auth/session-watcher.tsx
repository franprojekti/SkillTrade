"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Redirect immediately on SIGNED_OUT (token refresh failure, explicit sign-out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    // Also check when user returns to the tab — catches manual DB deletion faster
    async function checkSession() {
      const { error } = await supabase.auth.getUser();
      if (error) router.replace("/login");
    }

    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", checkSession);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [router]);

  return null;
}
