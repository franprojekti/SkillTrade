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

  const connectedUsers: ConnectedUser[] = [];
  for (const req of acceptedRequests) {
    const partnerId = req.sender_id === user.id ? req.receiver_id : req.sender_id;
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio, location_city, location_area")
      .eq("id", partnerId)
      .eq("is_active", true)
      .single();
    if (!partnerProfile) continue;
    connectedUsers.push({
      userId: partnerId,
      username: partnerProfile.username,
      displayName: partnerProfile.display_name,
      bio: partnerProfile.bio,
      locationCity: partnerProfile.location_city,
      locationArea: partnerProfile.location_area,
    });
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
