import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { MatchesClient, type MatchRow, type ConnectedUser } from "./matches-client";

export const metadata: Metadata = {
  title: "Matches",
  robots: { index: false, follow: false },
};

export default async function MatchesPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, last_matches_viewed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/app/onboarding");
  }

  const lastViewedAt = profile?.last_matches_viewed_at ?? null;

  // Update last_matches_viewed_at before fetching so next visit compares against now
  await supabase
    .from("profiles")
    .update({ last_matches_viewed_at: new Date().toISOString() })
    .eq("id", user.id);

  const { data: matchesRaw, error } = await supabase.rpc("get_matches", {
    p_user_id: user.id,
  });
  const matches = (matchesRaw ?? []) as MatchRow[];

  const { data: myRequests } = await supabase
    .from("connection_requests")
    .select("id, receiver_id, sender_id, status")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .in("status", ["pending", "accepted"]);

  const sentToIds = (myRequests ?? [])
    .filter((r) => r.sender_id === user.id && r.status === "pending")
    .map((r) => r.receiver_id);

  const acceptedRequests = (myRequests ?? []).filter((r) => r.status === "accepted");
  const connectedIds = acceptedRequests.map((r) =>
    r.sender_id === user.id ? r.receiver_id : r.sender_id
  );

  const partnerIds = acceptedRequests.map((r) =>
    r.sender_id === user.id ? r.receiver_id : r.sender_id
  );

  const connectedUsers: ConnectedUser[] = [];
  if (partnerIds.length > 0) {
    const { data: partnerProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio, location_city, location_area")
      .in("id", partnerIds)
      .eq("is_active", true);

    const profileMap = new Map((partnerProfiles ?? []).map((p) => [p.id, p]));
    for (const req of acceptedRequests) {
      const partnerId = req.sender_id === user.id ? req.receiver_id : req.sender_id;
      const p = profileMap.get(partnerId);
      if (!p) continue;
      connectedUsers.push({
        userId: partnerId,
        username: p.username,
        displayName: p.display_name,
        bio: p.bio,
        locationCity: p.location_city,
        locationArea: p.location_area,
      });
    }
  }

  return (
    <MatchesClient
      connectedUsers={connectedUsers}
      matches={matches}
      sentToIds={sentToIds}
      connectedIds={connectedIds}
      error={!!error}
      lastViewedAt={lastViewedAt}
    />
  );
}
