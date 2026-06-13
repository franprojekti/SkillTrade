"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { formatConnectionPref } from "@/lib/format";

export interface ConnectedUser {
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  locationCity: string | null;
  locationArea: string | null;
}

export interface MatchRow {
  out_user_id: string;
  out_username: string;
  out_display_name: string | null;
  out_bio: string | null;
  out_years_experience: number | null;
  out_score: number;
  out_location_city: string | null;
  out_location_area: string | null;
  out_connection_pref: string;
  out_they_offer_wanted: string[];
  out_i_offer_wanted: string[];
  out_updated_at: string;
}

interface MatchesClientProps {
  connectedUsers: ConnectedUser[];
  matches: MatchRow[];
  sentToIds: string[];
  connectedIds: string[];
  error: boolean;
  lastViewedAt: string | null;
}

export function MatchesClient({
  connectedUsers,
  matches,
  sentToIds,
  connectedIds,
  error,
  lastViewedAt,
}: MatchesClientProps) {
  const [query, setQuery] = useState("");

  const q = query.toLowerCase();

  const filteredConnected = q
    ? connectedUsers.filter(
        (cu) =>
          cu.username.toLowerCase().includes(q) ||
          cu.displayName?.toLowerCase().includes(q) ||
          cu.bio?.toLowerCase().includes(q)
      )
    : connectedUsers;

  const filteredMatches = q
    ? matches.filter(
        (m) =>
          m.out_username.toLowerCase().includes(q) ||
          m.out_display_name?.toLowerCase().includes(q) ||
          m.out_bio?.toLowerCase().includes(q) ||
          m.out_they_offer_wanted.some((s) => s.toLowerCase().includes(q)) ||
          m.out_i_offer_wanted.some((s) => s.toLowerCase().includes(q))
      )
    : matches;

  const sentToSet = new Set(sentToIds);
  const connectedSet = new Set(connectedIds);

  const hasResults = filteredConnected.length > 0 || filteredMatches.length > 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your Matches</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search matches..."
            className="pl-9"
            aria-label="Search matches"
          />
        </div>
      </div>

      {error && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Something went wrong loading matches. Please refresh.</p>
        </div>
      )}

      {!error && !hasResults && (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-foreground">
            {query ? "No matches found" : "No matches yet"}
          </p>
        </div>
      )}

      {filteredConnected.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-muted-foreground mb-3">Connected</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredConnected.map((cu, index) => {
              const displayName = cu.displayName || cu.username;
              return (
                <Link
                  key={cu.userId}
                  href={`/app/matches/${cu.userId}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start gap-3">
                    <InitialsAvatar username={cu.username} displayName={cu.displayName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{displayName}</p>
                      {cu.bio && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{cu.bio}</p>
                      )}
                      {cu.locationCity && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {[cu.locationArea, cu.locationCity].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {filteredMatches.length > 0 && (
        <div>
          {filteredConnected.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3">Suggested</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredMatches.map((match, index) => {
              const isConnected = connectedSet.has(match.out_user_id);
              const requestSent = sentToSet.has(match.out_user_id);
              const displayName = match.out_display_name || match.out_username;
              const isNew = !lastViewedAt || new Date(match.out_updated_at) > new Date(lastViewedAt);

              return (
                <Link
                  key={match.out_user_id}
                  href={`/app/matches/${match.out_user_id}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start gap-3">
                    <InitialsAvatar
                      username={match.out_username}
                      displayName={match.out_display_name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{displayName}</p>
                        {isNew && (
                          <Badge variant="secondary" className="text-[10px] font-medium text-primary flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      {match.out_bio && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {match.out_bio}
                          {match.out_years_experience != null ? ` · ${match.out_years_experience} yrs` : ""}
                        </p>
                      )}
                      {match.out_location_city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {[match.out_location_area, match.out_location_city].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {match.out_they_offer_wanted.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Teaches you:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.out_they_offer_wanted.slice(0, 3).map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-muted text-foreground hover:bg-muted/80 border-0 text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {match.out_they_offer_wanted.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{match.out_they_offer_wanted.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {match.out_i_offer_wanted.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Learns from you:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.out_i_offer_wanted.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {match.out_i_offer_wanted.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{match.out_i_offer_wanted.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Meets: {formatConnectionPref(match.out_connection_pref)}
                    </span>
                    {isConnected && (
                      <span className="text-xs font-medium text-primary">Connected</span>
                    )}
                    {requestSent && !isConnected && (
                      <span className="text-xs text-muted-foreground">Request sent</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
