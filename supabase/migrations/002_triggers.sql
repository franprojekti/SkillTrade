-- ============================================================
-- SkillTrade — Triggers & Functions
-- ============================================================

-- ============================================================
-- TRIGGER: Auto-create profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    LOWER(TRIM(NEW.raw_user_meta_data ->> 'username'))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-update profiles.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: Auto-create conversation when request is accepted
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Only fire when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Create conversation
    INSERT INTO public.conversations (connection_request_id)
    VALUES (NEW.id)
    RETURNING id INTO v_conversation_id;

    -- Add both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES
      (v_conversation_id, NEW.sender_id),
      (v_conversation_id, NEW.receiver_id);

    -- Notify sender that request was accepted
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      NEW.sender_id,
      'request_accepted',
      jsonb_build_object(
        'from_user_id', NEW.receiver_id,
        'conversation_id', v_conversation_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_connection_request_accepted ON public.connection_requests;
CREATE TRIGGER on_connection_request_accepted
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_request_accepted();

-- ============================================================
-- TRIGGER: Create notification when connection request is sent
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (
    NEW.receiver_id,
    'connection_request',
    jsonb_build_object(
      'from_user_id', NEW.sender_id,
      'request_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_connection_request ON public.connection_requests;
CREATE TRIGGER on_new_connection_request
  AFTER INSERT ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_connection_request();

-- ============================================================
-- TRIGGER: Create notification when new message is sent
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Find the other participant (recipient)
  SELECT user_id INTO v_recipient_id
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      v_recipient_id,
      'new_message',
      jsonb_build_object(
        'from_user_id', NEW.sender_id,
        'conversation_id', NEW.conversation_id,
        'message_preview', LEFT(NEW.content, 80)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- ============================================================
-- FUNCTION: Get blocked user IDs (both directions)
-- Used in match and profile queries to exclude blocked users
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_blocked_ids(p_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT blocked_id FROM public.blocks WHERE blocker_id = p_user_id
    UNION
    SELECT blocker_id FROM public.blocks WHERE blocked_id = p_user_id
  );
$$;
