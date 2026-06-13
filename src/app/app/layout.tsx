import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { AppNav } from "@/components/layout/app-nav";
import { SessionWatcher } from "@/components/auth/session-watcher";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, supabase } = await requireAuth();

  // Fetch profile for nav
  const { data: profileData } = await supabase
    .from("profiles")
    .select("username, display_name, onboarding_completed, last_matches_viewed_at")
    .eq("id", user.id)
    .single();

  const profile = profileData as { username: string; display_name: string | null; onboarding_completed: boolean; last_matches_viewed_at: string | null } | null;

  if (!profile) {
    redirect("/login");
  }

  // Get unread counts + actual match count for nav badges
  const [{ count: unreadNotifications }, { count: unreadMessages }, matchesResult] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null)
        .in("type", ["connection_request"]),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null)
        .eq("type", "new_message"),
      supabase.rpc("get_matches", { p_user_id: user.id }),
    ]);

  const newMatchesCount = matchesResult.data?.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Bottom green gradient */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[60vh] pointer-events-none z-0"
        style={{
          background: "linear-gradient(to top, rgba(34,197,94,0.20) 0%, rgba(34,197,94,0.07) 45%, transparent 100%)",
        }}
      />
      <SessionWatcher />
      <AppNav
        username={profile.username}
        displayName={profile.display_name}
        unreadNotifications={unreadNotifications ?? 0}
        unreadMessages={unreadMessages ?? 0}
        newMatches={profile.onboarding_completed ? (newMatchesCount ?? 0) : 0}
      />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
