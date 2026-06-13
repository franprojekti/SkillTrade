"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { createClient } from "@/lib/supabase/client";
import { formatTime, formatDateSeparator } from "@/lib/date";
import { toast } from "sonner";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

interface Message {
  id: string;
  content: string;
  sent_at: string;
  sender_id: string;
  read_at: string | null;
}

interface ChatViewProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string | null;
  initialMessages: Message[];
}

export function ChatView({
  conversationId,
  currentUserId,
  otherUserId,
  otherUsername,
  otherDisplayName,
  initialMessages,
}: ChatViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refresh layout so nav badge clears after opening conversation
  useEffect(() => {
    router.refresh();
  }, [router]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresInsertPayload<Message>) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if it's from the other user
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then(({ error }) => {
                if (error) console.error("Failed to mark message as read:", error);
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    const supabase = createClient();
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
      .select("id, content, sent_at, sender_id, read_at")
      .single();

    if (error) {
      setInput(content);
      toast.error("Failed to send message");
    } else if (inserted) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === (inserted as Message).id)) return prev;
        return [...prev, inserted as Message];
      });
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Group messages by date
  const groupedMessages = groupByDate(messages);
  const displayName = otherDisplayName || otherUsername;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -mx-4 -my-6 md:mx-0 md:my-0 md:h-[calc(100vh-6.5rem)] md:rounded-xl md:border md:border-border overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <Link
          href="/app/chat"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back to chat"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/app/matches/${otherUserId}`}>
          <InitialsAvatar
            username={otherUsername}
            displayName={otherDisplayName}
            size="md"
          />
        </Link>
        <div>
          <Link
            href={`/app/matches/${otherUserId}`}
            className="font-semibold text-foreground hover:text-primary leading-tight"
          >
            {displayName}
          </Link>
          <p className="text-xs text-muted-foreground">@{otherUsername}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">

        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground flex-shrink-0">{date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {dayMessages.map((msg, i) => {
              const isMine = msg.sender_id === currentUserId;
              const isLast =
                i === dayMessages.length - 1 ||
                dayMessages[i + 1].sender_id !== msg.sender_id;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                    isLast ? "mb-3" : "mb-0.5"
                  }`}
                >
                  <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {isLast && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                        {formatTime(msg.sent_at)}
                        {isMine && msg.read_at && " · Read"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-3">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={2000}
            disabled={sending}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-center pb-2 px-4">
          Do not share sensitive information for security reasons.
        </p>
      </div>
    </div>
  );
}

function groupByDate(messages: Message[]): Record<string, Message[]> {
  return messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const key = formatDateSeparator(msg.sent_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});
}
