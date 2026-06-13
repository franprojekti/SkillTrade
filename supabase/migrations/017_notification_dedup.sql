-- Prevent duplicate notifications by adding partial unique indexes.
-- Uses ON CONFLICT DO NOTHING in trigger functions so retries are idempotent.

CREATE UNIQUE INDEX IF NOT EXISTS notifications_uniq_connection_request
  ON public.notifications (user_id, (payload->>'request_id'))
  WHERE type = 'connection_request';

CREATE UNIQUE INDEX IF NOT EXISTS notifications_uniq_request_accepted
  ON public.notifications (user_id, (payload->>'conversation_id'))
  WHERE type = 'request_accepted';

-- Deduplicate any existing duplicates before adding constraints (keep oldest row).
DELETE FROM public.notifications n
WHERE type = 'connection_request'
  AND id NOT IN (
    SELECT DISTINCT ON (user_id, (payload->>'request_id')) id
    FROM public.notifications
    WHERE type = 'connection_request'
    ORDER BY user_id, (payload->>'request_id'), created_at ASC
  );

DELETE FROM public.notifications n
WHERE type = 'request_accepted'
  AND id NOT IN (
    SELECT DISTINCT ON (user_id, (payload->>'conversation_id')) id
    FROM public.notifications
    WHERE type = 'request_accepted'
    ORDER BY user_id, (payload->>'conversation_id'), created_at ASC
  );

-- Update handle_new_connection_request to use ON CONFLICT DO NOTHING
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
  )
  ON CONFLICT (user_id, (payload->>'request_id')) WHERE type = 'connection_request' DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_connection_request() FROM PUBLIC;

-- Update handle_request_accepted to use ON CONFLICT DO NOTHING for its notification
CREATE OR REPLACE FUNCTION public.handle_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Create conversation (or get existing)
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE connection_request_id = NEW.id;

    IF NOT FOUND THEN
      INSERT INTO public.conversations (connection_request_id)
      VALUES (NEW.id)
      RETURNING id INTO v_conversation_id;
    END IF;

    -- Add both participants (idempotent)
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES
      (v_conversation_id, NEW.sender_id),
      (v_conversation_id, NEW.receiver_id)
    ON CONFLICT DO NOTHING;

    -- Notify sender that request was accepted (idempotent)
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      NEW.sender_id,
      'request_accepted',
      jsonb_build_object(
        'from_user_id', NEW.receiver_id,
        'conversation_id', v_conversation_id
      )
    )
    ON CONFLICT (user_id, (payload->>'conversation_id')) WHERE type = 'request_accepted' DO NOTHING;

    -- Sender teaches receiver: all skills sender offers
    INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
    SELECT NEW.sender_id, NEW.receiver_id, us.skill_id, NEW.id
    FROM public.user_skills us
    WHERE us.user_id = NEW.sender_id AND us.skill_type = 'offered'
    ON CONFLICT DO NOTHING;

    -- Receiver teaches sender: all skills receiver offers
    INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
    SELECT NEW.receiver_id, NEW.sender_id, us.skill_id, NEW.id
    FROM public.user_skills us
    WHERE us.user_id = NEW.receiver_id AND us.skill_type = 'offered'
    ON CONFLICT DO NOTHING;

  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_request_accepted() FROM PUBLIC;
