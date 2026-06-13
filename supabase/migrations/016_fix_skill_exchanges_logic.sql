-- Fix skill_exchanges creation logic.
-- Previous approach: JOIN user_skills on exact skill_id overlap (teacher offers what learner wants).
-- Problem: fuzzy matching creates connections between users with similar but different skill IDs,
-- so the cross-join found no overlap and created 0 rows.
--
-- New approach: when a connection is accepted, each user teaches the other
-- ALL of their offered skills. No overlap check needed.
-- Result: A teaches B everything A offers; B teaches A everything B offers.

-- Clear existing rows (backfill used old logic, will re-backfill below)
DELETE FROM public.skill_exchanges;

-- Update the trigger function
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

-- Re-backfill with new logic
INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
SELECT cr.sender_id, cr.receiver_id, us.skill_id, cr.id
FROM public.connection_requests cr
JOIN public.user_skills us ON us.user_id = cr.sender_id AND us.skill_type = 'offered'
WHERE cr.status = 'accepted'
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
SELECT cr.receiver_id, cr.sender_id, us.skill_id, cr.id
FROM public.connection_requests cr
JOIN public.user_skills us ON us.user_id = cr.receiver_id AND us.skill_type = 'offered'
WHERE cr.status = 'accepted'
ON CONFLICT DO NOTHING;
