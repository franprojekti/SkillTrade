"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MessageSquare, UserPlus, Bookmark, BookmarkCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ensureConversation } from "@/app/actions/ensure-conversation";

interface ConnectionRequest {
  id: string;
  status: string;
  sender_id: string;
  receiver_id: string;
}

interface ProfileActionsProps {
  viewerId: string;
  targetUserId: string;
  connectionRequest: ConnectionRequest | null;
  conversationId: string | null;
  isBookmarked: boolean;
}

export function ProfileActions({
  viewerId,
  targetUserId,
  connectionRequest,
  conversationId,
  isBookmarked: initialBookmarked,
}: ProfileActionsProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(connectionRequest?.status ?? null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [resolvedConvId, setResolvedConvId] = useState(conversationId);

  async function handleOpenChat() {
    if (resolvedConvId) {
      router.push(`/app/chat/${resolvedConvId}`);
      return;
    }
    if (!connectionRequest) return;
    setChatLoading(true);
    const convId = await ensureConversation(connectionRequest.id);
    setChatLoading(false);
    if (convId) {
      setResolvedConvId(convId);
      router.push(`/app/chat/${convId}`);
    } else {
      toast.error("Could not open chat");
    }
  }

  async function handleSendRequest() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("connection_requests").upsert(
      { sender_id: viewerId, receiver_id: targetUserId, status: "pending", updated_at: new Date().toISOString() },
      { onConflict: "sender_id,receiver_id" }
    );
    if (error) {
      toast.error("Failed to send request");
    } else {
      setRequestStatus("pending");
      toast.success("Connection request sent");
    }
    setLoading(false);
  }

  async function handleCancelRequest() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "cancelled" })
      .eq("sender_id", viewerId)
      .eq("receiver_id", targetUserId);
    if (error) {
      toast.error("Failed to cancel request");
    } else {
      setRequestStatus("cancelled");
      toast.success("Request cancelled");
    }
    setLoading(false);
  }

  async function toggleBookmark() {
    setBookmarkLoading(true);
    const supabase = createClient();
    if (bookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", viewerId)
        .eq("bookmarked_user_id", targetUserId);
      if (error) {
        toast.error("Failed to remove bookmark");
      } else {
        setBookmarked(false);
        toast.success("Removed from saved profiles");
      }
    } else {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: viewerId,
        bookmarked_user_id: targetUserId,
      });
      if (error) {
        toast.error("Failed to save profile");
      } else {
        setBookmarked(true);
        toast.success("Profile saved");
      }
    }
    setBookmarkLoading(false);
  }

  const isAccepted = requestStatus === "accepted";
  const isPending = requestStatus === "pending";
  const isReceivedPending =
    connectionRequest?.status === "pending" &&
    connectionRequest?.receiver_id === viewerId;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isAccepted ? (
        <Button onClick={handleOpenChat} disabled={chatLoading}>
          <MessageSquare className="h-4 w-4 mr-2" />
          {chatLoading ? "Opening..." : "Chat"}
        </Button>
      ) : isReceivedPending ? (
        <Link href="/app/requests" className={buttonVariants({ variant: "outline" })}>
          <UserPlus className="h-4 w-4 mr-2" />
          Respond to Request
        </Link>
      ) : isPending ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Request sent</span>
          <Button variant="outline" size="sm" onClick={handleCancelRequest} disabled={loading}>
            {loading ? "Cancelling..." : "Cancel"}
          </Button>
        </div>
      ) : requestStatus === "declined" ? (
        <p className="text-sm text-muted-foreground">This request was declined.</p>
      ) : (
        <Button onClick={handleSendRequest} disabled={loading}>
          <UserPlus className="h-4 w-4 mr-2" />
          Send Request
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={toggleBookmark}
        disabled={bookmarkLoading}
        aria-label={bookmarked ? "Remove from saved" : "Save profile"}
      >
        {bookmarked ? (
          <BookmarkCheck className="h-4 w-4 text-primary" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
