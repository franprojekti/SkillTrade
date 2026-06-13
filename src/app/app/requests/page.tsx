import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-guard";
import { RequestsTabs } from "./requests-tabs";

export const metadata: Metadata = {
  title: "Requests",
  robots: { index: false, follow: false },
};

export default async function RequestsPage() {
  const { user, supabase } = await requireAuth();

  // Mark all connection_request notifications as read
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("type", "connection_request")
    .is("read_at", null);

  // Get received requests (pending)
  const { data: received, error: receivedError } = await supabase
    .from("connection_requests")
    .select(
      "id, status, message, created_at, sender_id, profiles!connection_requests_sender_id_fkey(username, display_name, location_city, location_area)"
    )
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Get sent requests
  const { data: sent, error: sentError } = await supabase
    .from("connection_requests")
    .select(
      "id, status, message, created_at, receiver_id, profiles!connection_requests_receiver_id_fkey(username, display_name, location_city)"
    )
    .eq("sender_id", user.id)
    .in("status", ["pending", "accepted", "declined"])
    .order("created_at", { ascending: false });

  if (receivedError || sentError) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Connection Requests</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Something went wrong loading requests. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Connection Requests</h1>
      </div>
      <RequestsTabs
        received={(received ?? []) as unknown as ReceivedRequest[]}
        sent={(sent ?? []) as unknown as SentRequest[]}
        currentUserId={user.id}
      />
    </div>
  );
}

export interface ReceivedRequest {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  sender_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    location_city: string | null;
    location_area: string | null;
  };
}

export interface SentRequest {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  receiver_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    location_city: string | null;
  };
}
