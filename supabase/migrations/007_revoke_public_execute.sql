-- ============================================================
-- SkillTrade — Revoke PUBLIC EXECUTE on SECURITY DEFINER functions
-- ============================================================
-- Migration 006 issued REVOKE FROM anon/authenticated but PostgreSQL grants
-- EXECUTE TO PUBLIC by default for all new functions. REVOKE from a specific
-- role doesn't strip the PUBLIC inheritance. Fix: REVOKE FROM PUBLIC, then
-- GRANT back only to roles that need direct RPC access.
--
-- Also documents create_conversation_for_request which existed in the live DB
-- but was missing from local migrations.

-- ============================================================
-- Document create_conversation_for_request (already in live DB)
-- ============================================================
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

-- ============================================================
-- Strip PUBLIC grant from all SECURITY DEFINER functions
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_request_accepted() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_connection_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_message() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_blocked_ids(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_matches(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_conversation_for_request(UUID) FROM PUBLIC;

-- ============================================================
-- Grant back only to roles that need direct RPC access
-- ============================================================
-- Trigger-only functions: no grant — PostgreSQL trigger engine uses owner privileges
-- get_blocked_ids: no grant — only called internally from get_matches (owner context)
GRANT EXECUTE ON FUNCTION public.get_matches(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_conversation_for_request(UUID) TO authenticated;

-- Supabase auto-grants anon/authenticated/service_role on every CREATE OR REPLACE FUNCTION.
-- REVOKE FROM PUBLIC above doesn't cover these explicit per-role grants.
-- Must explicitly revoke anon from the RPC functions, and authenticated from get_blocked_ids.
REVOKE EXECUTE ON FUNCTION public.get_matches(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_conversation_for_request(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_blocked_ids(UUID) FROM authenticated;
