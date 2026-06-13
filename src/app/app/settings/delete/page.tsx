import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = {
  title: "Delete Account",
  robots: { index: false, follow: false },
};

export default async function DeleteAccountPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-md mx-auto">
      <Link href="/app/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-bold text-foreground mb-2">Delete Account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This will permanently delete your account, profile, skills, messages, and all other data.
          This action cannot be undone.
        </p>
        <DeleteAccountForm username={profile?.username ?? ""} />
      </div>
    </div>
  );
}
