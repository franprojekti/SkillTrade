"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { createClient } from "@/lib/supabase/client";
import { getDisplayName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReceivedRequest, SentRequest } from "./page";

interface RequestsTabsProps {
  received: ReceivedRequest[];
  sent: SentRequest[];
  currentUserId: string;
}

export function RequestsTabs({ received, sent, currentUserId }: RequestsTabsProps) {
  const [active, setActive] = useState<"received" | "sent">("received");

  return (
    <div>
      <div className="flex gap-1 mb-6" role="tablist">
        <button
          role="tab"
          aria-selected={active === "received"}
          onClick={() => setActive("received")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            active === "received"
              ? "bg-muted/80 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Received
          {received.length > 0 && (
            <span className={cn("text-xs", active === "received" ? "text-primary" : "text-muted-foreground")}>({received.length})</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={active === "sent"}
          onClick={() => setActive("sent")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            active === "sent"
              ? "bg-muted/80 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Sent
          {sent.length > 0 && (
            <span className={cn("text-xs", active === "sent" ? "text-primary" : "text-muted-foreground")}>({sent.length})</span>
          )}
        </button>
      </div>

      {active === "received" && (
        received.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-medium text-foreground">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {received.map((req, index) => (
              <ReceivedCard key={req.id} request={req} index={index} />
            ))}
          </div>
        )
      )}

      {active === "sent" && (
        sent.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-medium text-foreground">No sent requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sent.map((req, index) => (
              <SentCard key={req.id} request={req} index={index} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function ReceivedCard({ request, index }: { request: ReceivedRequest; index: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const profile = request.profiles;
  const displayName = getDisplayName(profile);

  async function handleAccept() {
    setLoading("accept");
    const supabase = createClient();
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) {
      toast.error("Failed to accept request");
    } else {
      toast.success(`Connected with ${displayName}`);
      router.refresh();
    }
    setLoading(null);
  }

  async function handleDecline() {
    setLoading("decline");
    const supabase = createClient();
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) {
      toast.error("Failed to decline request");
    } else {
      toast.success("Request declined");
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start gap-3">
        <Link href={`/app/matches/${request.sender_id}`} aria-label={`View ${displayName}'s profile`}>
          <InitialsAvatar
            username={profile.username}
            displayName={profile.display_name}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/app/matches/${request.sender_id}`}
            className="font-semibold text-foreground hover:text-primary"
          >
            {displayName}
          </Link>
          <p className="text-xs text-muted-foreground">@{profile.username}</p>
          {profile.location_city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {[profile.location_area, profile.location_city].filter(Boolean).join(", ")}
            </p>
          )}
          {request.message && (
            <p className="text-sm text-foreground mt-2 bg-muted rounded-md px-3 py-2">
              &ldquo;{request.message}&rdquo;
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={loading !== null}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          {loading === "accept" ? "Accepting..." : "Accept"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecline}
          disabled={loading !== null}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-1" />
          {loading === "decline" ? "Declining..." : "Decline"}
        </Button>
      </div>
    </div>
  );
}

function SentCard({ request, index }: { request: SentRequest; index: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const profile = request.profiles;
  const displayName = getDisplayName(profile);

  async function handleCancel() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) {
      toast.error("Failed to cancel request");
    } else {
      toast.success("Request cancelled");
      router.refresh();
    }
    setLoading(false);
  }

  const statusConfig = {
    pending: { label: "Pending", color: "text-amber-600 bg-amber-50", icon: Clock },
    accepted: { label: "Accepted", color: "text-primary bg-primary/10", icon: Check },
    declined: { label: "Declined", color: "text-muted-foreground bg-muted", icon: X },
    cancelled: { label: "Cancelled", color: "text-muted-foreground bg-muted", icon: X },
  }[request.status] ?? { label: request.status, color: "text-muted-foreground", icon: Clock };

  const Icon = statusConfig.icon;

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center gap-3">
        <Link href={`/app/matches/${request.receiver_id}`} aria-label={`View ${displayName}'s profile`}>
          <InitialsAvatar
            username={profile.username}
            displayName={profile.display_name}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/app/matches/${request.receiver_id}`}
            className="font-semibold text-foreground hover:text-primary"
          >
            {displayName}
          </Link>
          <p className="text-xs text-muted-foreground">@{profile.username}</p>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}>
          <Icon className="h-3 w-3" />
          {statusConfig.label}
        </div>
      </div>
      {request.status === "pending" && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="mt-3 w-full"
        >
          {loading ? "Cancelling..." : "Cancel Request"}
        </Button>
      )}
    </div>
  );
}
