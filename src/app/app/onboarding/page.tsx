import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = {
  title: "Set Up Your Profile",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, username")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/app/matches");
  }

  // Fetch all active skills for the selector
  const { data: skills } = await supabase
    .from("skills")
    .select("id, canonical_name, slug, category, aliases, status, created_at")
    .in("status", ["active", "pending_review"])
    .order("category")
    .order("canonical_name");

  return (
    <OnboardingWizard
      userId={user.id}
      username={profile?.username ?? ""}
      allSkills={skills ?? []}
    />
  );
}
