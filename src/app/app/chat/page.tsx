import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/date";

export const metadata: Metadata = {
  title: "Chat",
  robots: { index: false, follow: false },
};

interface ConvMessage {
  content: string;
  sent_at: string;
  sender_id: string;
  read_at: string | null;
}

export default async function ChatPage() {
  const { user, supabase } = await requireAuth();

  // Mark new_message notifications as read
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("type", "new_message")
    .is("read_at", null);

  // Get all conversations where user is participant
  const { data: participantRows } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const typedParticipantRows = (participantRows ?? []) as Array<{ conversation_id: string }>;
  const conversationIds = typedParticipantRows.map((r) => r.conversation_id);

  if (conversationIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Chat</h1>
        <div className="text-center py-16">
          <p className="text-lg font-medium text-foreground">No conversations yet</p>
        </div>
      </div>
    );
  }

  // Get conversations with last message and connection_request_id
  const { data: conversationsRaw } = await supabase
    .from("conversations")
    .select("id, created_at, connection_request_id, messages(content, sent_at, sender_id, read_at)")
    .in("id", conversationIds);

  const convList = (conversationsRaw ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    connection_request_id: string | null;
    messages: ConvMessage[];
  }>;

  // Fetch connection requests to find other user IDs (avoids RLS issue on conversation_participants)
  const connectionRequestIds = convList.map((c) => c.connection_request_id).filter(Boolean) as string[];
  const { data: connReqsRaw } = connectionRequestIds.length
    ? await supabase.from("connection_requests").select("id, sender_id, receiver_id").in("id", connectionRequestIds)
    : { data: [] };

  const connReqMap = new Map(
    (connReqsRaw ?? []).map((r: { id: string; sender_id: string; receiver_id: string }) => [
      r.id,
      r.sender_id === user.id ? r.receiver_id : r.sender_id,
    ])
  );

  const otherUserIds = [...new Set(connReqMap.values())];
  const { data: profilesRaw } = otherUserIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", otherUserIds)
    : { data: [] };

  const profileMap = new Map(
    (profilesRaw ?? []).map((p: { id: string; username: string; display_name: string | null }) => [p.id, p])
  );

  // Process conversations
  const processed = convList.map((conv) => {
    const otherUserId = conv.connection_request_id ? connReqMap.get(conv.connection_request_id) : undefined;
    const otherProfile = otherUserId ? profileMap.get(otherUserId) ?? null : null;
    const messages = conv.messages ?? [];
    const lastMessage = [...messages].sort(
      (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
    )[0];
    const unreadCount = messages.filter(
      (m) => m.sender_id !== user.id && !m.read_at
    ).length;

    return {
      id: conv.id,
      otherUser: otherProfile as { username: string; display_name: string | null } | null,
      lastMessage,
      unreadCount,
    };
  }).sort((a, b) => {
    const aTime = a.lastMessage?.sent_at ?? "0";
    const bTime = b.lastMessage?.sent_at ?? "0";
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Chat</h1>
      <div className="space-y-1">
        {processed.map((conv, index) => {
          const profile = conv.otherUser as { username: string; display_name: string | null } | null;
          const displayName = profile?.display_name || profile?.username || "Unknown";
          const username = profile?.username || "";

          return (
            <Link
              key={conv.id}
              href={`/app/chat/${conv.id}`}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted transition-colors animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              <InitialsAvatar
                username={username}
                displayName={profile?.display_name}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-medium truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
                    {displayName}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatDistanceToNow(conv.lastMessage.sent_at)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate flex-1 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {conv.lastMessage?.content ?? "No messages yet"}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge className="rounded-full text-[10px] px-1.5 py-0.5 min-w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
