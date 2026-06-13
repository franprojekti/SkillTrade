import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { ChangePasswordForm } from "./change-password-form";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      {/* Change password */}
      <section className="space-y-4">
        <h2 className="font-semibold text-foreground">Change Password</h2>
        <ChangePasswordForm username={profile?.username ?? ""} />
      </section>

      <Separator className="my-8" />

      {/* Danger zone */}
      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">Danger Zone</h2>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-foreground mb-1">Delete Account</p>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all your data. This cannot be undone.
          </p>
          <Link href="/app/settings/delete" className={buttonVariants({ variant: "destructive", size: "sm" })}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete My Account
          </Link>
        </div>
      </section>
    </div>
  );
}
