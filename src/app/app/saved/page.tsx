import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { formatConnectionPref, getDisplayName } from "@/lib/format";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Saved Profiles",
  robots: { index: false, follow: false },
};

export default async function SavedPage() {
  const { user, supabase } = await requireAuth();

  const [{ data: bookmarks }, { data: whoBookmarkedMe }] = await Promise.all([
    supabase
      .from("bookmarks")
      .select(
        `bookmarked_user_id,
         created_at,
         profiles!bookmarks_bookmarked_user_id_fkey(
           id, username, display_name, bio,
           location_city, location_area,
           connection_preference, is_active
         )`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookmarks")
      .select("user_id")
      .eq("bookmarked_user_id", user.id),
  ]);

  type BookmarkRow = {
    bookmarked_user_id: string;
    created_at: string;
    profiles: {
      id: string;
      username: string;
      display_name: string | null;
      bio: string | null;
      location_city: string | null;
      location_area: string | null;
      connection_preference: string;
      is_active: boolean;
    } | null;
  };

  const typedBookmarks = (bookmarks ?? []) as unknown as BookmarkRow[];
  const activeBookmarks = typedBookmarks.filter((b) => b.profiles?.is_active);
  const mutualSet = new Set((whoBookmarkedMe ?? []).map((r) => r.user_id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Profiles</h1>
      </div>

      {activeBookmarks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-foreground">No saved profiles yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeBookmarks.map((b) => {
            const profile = b.profiles;
            if (!profile) return null;
            const displayName = getDisplayName(profile);
            const isMutual = mutualSet.has(b.bookmarked_user_id);

            return (
              <Link
                key={b.bookmarked_user_id}
                href={`/app/matches/${b.bookmarked_user_id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <InitialsAvatar
                    username={profile.username}
                    displayName={profile.display_name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{displayName}</p>
                      {isMutual && (
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0 text-primary">
                          Mutual Interest
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    {profile.location_city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {[profile.location_area, profile.location_city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {profile.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-medium text-foreground">Role:</span> {profile.bio}
                  </p>
                )}
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    Meets: {formatConnectionPref(profile.connection_preference)}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
