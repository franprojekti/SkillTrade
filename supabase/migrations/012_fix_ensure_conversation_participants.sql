-- Fix: create_conversation_for_request used to return an existing conversation ID
-- without verifying participants were present. If the trigger created the conversation
-- but the participant insert failed (any transient error), the RPC returned the ID
-- and the chat page's participant check would 404.
-- Fix: always upsert participants even when returning an existing conversation.

CREATE OR REPLACE FUNCTION public.create_conversation_for_request(p_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id     UUID;
  v_sender_id   UUID;
  v_receiver_id UUID;
BEGIN
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM connection_requests
  WHERE id = p_request_id
    AND status = 'accepted'
    AND (sender_id = auth.uid() OR receiver_id = auth.uid());

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT id INTO v_conv_id FROM conversations WHERE connection_request_id = p_request_id;

  IF NOT FOUND THEN
    INSERT INTO conversations (connection_request_id) VALUES (p_request_id) RETURNING id INTO v_conv_id;
  END IF;

  -- Always ensure both participants exist (ON CONFLICT DO NOTHING handles duplicates)
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_sender_id), (v_conv_id, v_receiver_id)
  ON CONFLICT DO NOTHING;

  RETURN v_conv_id;
END;
$$;
