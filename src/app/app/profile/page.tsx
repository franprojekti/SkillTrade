import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { formatConnectionPref, formatLocation, getDisplayName } from "@/lib/format";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Pencil, Users, Wifi } from "lucide-react";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, years_experience, location_city, location_area, location_country, connection_preference, is_active, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: userSkills } = await supabase
    .from("user_skills")
    .select("skill_id, skill_type, skills(canonical_name, category)")
    .eq("user_id", user.id);

  type UserSkillRow = { skill_type: string; skills: { canonical_name: string; category: string } | null };
  const typedUserSkills = (userSkills ?? []) as unknown as UserSkillRow[];

  const offeredSkills = typedUserSkills
    .filter((s) => s.skill_type === "offered" && s.skills)
    .map((s) => s.skills!);

  const wantedSkills = typedUserSkills
    .filter((s) => s.skill_type === "wanted" && s.skills)
    .map((s) => s.skills!);

  const displayName = getDisplayName(profile);

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in-0 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <InitialsAvatar
            username={profile.username}
            displayName={profile.display_name}
            size="xl"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.location_city && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {formatLocation(profile)}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              {profile.connection_preference === "online" ? (
                <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                Meets: {formatConnectionPref(profile.connection_preference)}
              </span>
            </div>
          </div>
        </div>
        <Link href="/app/profile/edit" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit Profile
        </Link>
      </div>

      {/* Role + years */}
      {(profile.bio || profile.years_experience != null) ? (
        <div className="mb-6">
          <p className="text-sm text-foreground">
            <span className="text-xs text-muted-foreground mr-1">Role:</span>
            {profile.bio}
            {profile.bio && profile.years_experience != null && (
              <span className="text-muted-foreground"> · {profile.years_experience} {profile.years_experience === 1 ? "yr" : "yrs"} exp</span>
            )}
            {!profile.bio && profile.years_experience != null && (
              <span className="text-muted-foreground">{profile.years_experience} {profile.years_experience === 1 ? "yr" : "yrs"} exp</span>
            )}
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">No role set yet.</p>
          <Link href="/app/profile/edit" className="text-sm text-primary hover:underline">
            Add your role
          </Link>
        </div>
      )}

      {/* Skills */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Offers:</p>
          {offeredSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {offeredSkills.map((skill) => (
                <Badge key={skill.canonical_name} className="bg-muted text-foreground border-0 text-sm">
                  {skill.canonical_name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-3 text-center">
              <p className="text-sm text-muted-foreground">No skills yet.</p>
              <Link href="/app/profile/edit" className="text-sm text-primary hover:underline">
                Add skills
              </Link>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Wants to learn:</p>
          {wantedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {wantedSkills.map((skill) => (
                <Badge key={skill.canonical_name} className="bg-muted text-foreground border-0 text-sm">
                  {skill.canonical_name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-3 text-center">
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
              <Link href="/app/profile/edit" className="text-sm text-primary hover:underline">
                Add skills
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile completeness hint */}
      {(!profile.onboarding_completed || offeredSkills.length === 0 || wantedSkills.length === 0) && (
        <div className="mt-6 rounded-lg bg-accent border border-primary/20 p-4">
          <p className="text-sm text-accent-foreground">
            <strong>Complete your profile</strong> to get better matches. Add skills you offer and skills you want to learn.
          </p>
          <Link href="/app/profile/edit" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
            Complete Profile
          </Link>
        </div>
      )}

    </div>
  );
}
