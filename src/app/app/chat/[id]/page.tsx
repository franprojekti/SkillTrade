import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { ChatView } from "./chat-view";

export const metadata: Metadata = {
  title: "Chat",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { id: conversationId } = await params;
  const { user, supabase } = await requireAuth();

  // Verify user is a participant
  const { data: participant, error: participantError } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (participantError || !participant) notFound();

  // Get other participant via the connection request
  const { data: conversationRaw } = await supabase
    .from("conversations")
    .select("connection_request_id")
    .eq("id", conversationId)
    .single();

  let otherUserId: string | null = null;
  if (conversationRaw?.connection_request_id) {
    const { data: connReq } = await supabase
      .from("connection_requests")
      .select("sender_id, receiver_id")
      .eq("id", conversationRaw.connection_request_id)
      .single();
    if (connReq) {
      otherUserId = connReq.sender_id === user.id ? connReq.receiver_id : connReq.sender_id;
    }
  }

  const { data: otherProfileRaw } = otherUserId
    ? await supabase.from("profiles").select("id, username, display_name").eq("id", otherUserId).single()
    : { data: null };

  const otherParticipantTyped = otherProfileRaw as {
    id: string;
    username: string;
    display_name: string | null;
  } | null;

  // Get messages
  const { data: messagesRaw } = await supabase
    .from("messages")
    .select("id, content, sent_at, sender_id, read_at")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });

  interface MessageRow {
    id: string;
    content: string;
    sent_at: string;
    sender_id: string;
    read_at: string | null;
  }

  const messages = (messagesRaw ?? []) as MessageRow[];

  // Mark messages from other user as read
  const unreadIds = messages
    .filter((m) => m.sender_id !== user.id && !m.read_at)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  // Mark new_message notifications for this conversation as read
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("type", "new_message")
    .is("read_at", null)
    .filter("payload->>conversation_id", "eq", conversationId);

  return (
    <ChatView
      conversationId={conversationId}
      currentUserId={user.id}
      otherUserId={otherUserId ?? ""}
      otherUsername={otherParticipantTyped?.username ?? ""}
      otherDisplayName={otherParticipantTyped?.display_name ?? null}
      initialMessages={messages}
    />
  );
}
