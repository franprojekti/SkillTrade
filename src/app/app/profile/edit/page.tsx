import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { EditProfileForm } from "./edit-profile-form";

export const metadata: Metadata = {
  title: "Edit Profile",
  robots: { index: false, follow: false },
};

export default async function EditProfilePage() {
  const { user, supabase } = await requireAuth();

  const [{ data: profile }, { data: skills }, { data: userSkills }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
      supabase
        .from("skills")
        .select("id, canonical_name, slug, category, aliases, status, created_at")
        .in("status", ["active", "pending_review"])
        .order("category")
        .order("canonical_name"),
      supabase
        .from("user_skills")
        .select("id, skill_id, skill_type")
        .eq("user_id", user.id),
    ]);

  if (!profile) redirect("/login");

  const offeredIds = (userSkills ?? [])
    .filter((s) => s.skill_type === "offered")
    .map((s) => s.skill_id);

  const wantedIds = (userSkills ?? [])
    .filter((s) => s.skill_type === "wanted")
    .map((s) => s.skill_id);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/app/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Edit Profile</h1>
      <EditProfileForm
        userId={user.id}
        profile={profile}
        allSkills={skills ?? []}
        offeredSkillIds={offeredIds}
        wantedSkillIds={wantedIds}
      />
    </div>
  );
}
