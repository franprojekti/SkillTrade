"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureConversation(
  connectionRequestId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_conversation_for_request", {
    p_request_id: connectionRequestId,
  });

  if (error) throw error;
  return data as string | null;
}
