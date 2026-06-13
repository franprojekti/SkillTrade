"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function DeleteAccountForm({ username }: { username: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const isMatch = confirmation === username;

  async function handleDelete() {
    if (!isMatch) return;
    setLoading(true);

    const supabase = createClient();
    // Sign out first, then delete via server action or API route
    // For MVP: call the Supabase deleteUser (requires service role on server)
    // We'll use a server action approach
    const res = await fetch("/api/delete-account", { method: "DELETE" });

    if (!res.ok) {
      toast.error("Failed to delete account");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="confirm_username">
          Type your username <strong>{username}</strong> to confirm
        </Label>
        <Input
          id="confirm_username"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={username}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={!isMatch || loading}
          className="flex-1"
        >
          {loading ? "Deleting..." : "Delete My Account"}
        </Button>
        <Link
          href="/app/settings"
          className={cn(buttonVariants({ variant: "outline" }), loading && "pointer-events-none opacity-50")}
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
