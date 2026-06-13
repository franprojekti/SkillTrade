import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { formatConnectionPref, formatLocation } from "@/lib/format";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileActions } from "./profile-actions";
import { ArrowLeft, MapPin, Wifi, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchProfilePage({ params }: Props) {
  const { id: targetUserId } = await params;
  const { user, supabase } = await requireAuth();
  if (targetUserId === user.id) redirect("/app/profile");

  // Check if blocked (either direction)
  const { data: blockCheck } = await supabase
    .from("blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`
    )
    .limit(1);

  if (blockCheck && blockCheck.length > 0) {
    notFound();
  }

  // Get target profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, years_experience, location_city, location_area, connection_preference, is_active"
    )
    .eq("id", targetUserId)
    .eq("is_active", true)
    .single();

  const profile = profileRaw as {
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    years_experience: number | null;
    location_city: string | null;
    location_area: string | null;
    connection_preference: string;
    is_active: boolean;
  } | null;

  if (!profile) notFound();

  // Get their skills
  const { data: theirSkillsRaw } = await supabase
    .from("user_skills")
    .select("skill_id, skill_type, skills(canonical_name, category)")
    .eq("user_id", targetUserId);

  const theirSkills = (theirSkillsRaw ?? []) as unknown as Array<{
    skill_id: string;
    skill_type: string;
    skills: { canonical_name: string; category: string } | null;
  }>;

  const offeredSkills = theirSkills
    .filter((s) => s.skill_type === "offered" && s.skills)
    .map((s) => s.skills!);

  const wantedSkills = theirSkills
    .filter((s) => s.skill_type === "wanted" && s.skills)
    .map((s) => s.skills!);

  // Check connection status
  const { data: connectionRequestRaw } = await supabase
    .from("connection_requests")
    .select("id, status, sender_id, receiver_id")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`
    )
    .limit(1)
    .single();

  const connectionRequest = connectionRequestRaw as {
    id: string;
    status: string;
    sender_id: string;
    receiver_id: string;
  } | null;

  // Get conversation if connected
  let conversationId: string | null = null;
  if (connectionRequest?.status === "accepted") {
    const { data: convRaw } = await supabase
      .from("conversations")
      .select("id")
      .eq("connection_request_id", connectionRequest.id)
      .single();
    const conv = convRaw as { id: string } | null;
    conversationId = conv?.id ?? null;
  }

  // Check if bookmarked
  const { data: bookmark } = await supabase
    .from("bookmarks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("bookmarked_user_id", targetUserId)
    .single();

  const displayName = profile.display_name || profile.username;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in-0 duration-300">
      <Link href="/app/matches" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-6">
        <InitialsAvatar
          username={profile.username}
          displayName={profile.display_name}
          size="xl"
        />
        <div className="flex-1 min-w-0">
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

      {/* Role */}
      {(profile.bio || profile.years_experience != null) && (
        <div className="mb-5">
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
      )}

      {/* Skills */}
      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Offers:</p>
          {offeredSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {offeredSkills.map((skill) => (
                <Badge
                  key={skill.canonical_name}
                  className="text-sm border-0 bg-muted text-foreground"
                >
                  {skill.canonical_name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Wants to learn:</p>
          {wantedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {wantedSkills.map((skill) => (
                <Badge
                  key={skill.canonical_name}
                  className="text-sm border-0 bg-muted text-foreground"
                >
                  {skill.canonical_name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <ProfileActions
        viewerId={user.id}
        targetUserId={targetUserId}
        connectionRequest={connectionRequest ?? null}
        conversationId={conversationId}
        isBookmarked={!!bookmark}
      />
    </div>
  );
}
