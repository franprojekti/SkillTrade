-- ============================================================
-- SkillTrade — Skill Exchanges Table
-- ============================================================
-- Tracks which skills are being taught/learned between connected users.
-- Rows are auto-created by handle_request_accepted() when a connection
-- is accepted. One row per (teacher, learner, skill) triplet.

CREATE TABLE public.skill_exchanges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id              UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  connection_request_id UUID NOT NULL REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (teacher_id != learner_id)
);

-- Partial unique: only one active exchange per teacher/learner/skill
-- (allows 'completed' rows if users reconnect later)
CREATE UNIQUE INDEX skill_exchanges_active_unique
  ON public.skill_exchanges (teacher_id, learner_id, skill_id) WHERE status = 'active';

CREATE INDEX idx_skill_exchanges_teacher    ON public.skill_exchanges (teacher_id);
CREATE INDEX idx_skill_exchanges_learner    ON public.skill_exchanges (learner_id);
CREATE INDEX idx_skill_exchanges_connection ON public.skill_exchanges (connection_request_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.skill_exchanges ENABLE ROW LEVEL SECURITY;

-- Teacher or learner can see their own exchanges
CREATE POLICY "skill_exchanges_select"
  ON public.skill_exchanges FOR SELECT TO authenticated
  USING ((select auth.uid()) = teacher_id OR (select auth.uid()) = learner_id);

-- Teacher or learner can update status (e.g. mark completed)
CREATE POLICY "skill_exchanges_update_status"
  ON public.skill_exchanges FOR UPDATE TO authenticated
  USING ((select auth.uid()) = teacher_id OR (select auth.uid()) = learner_id)
  WITH CHECK ((select auth.uid()) = teacher_id OR (select auth.uid()) = learner_id);

-- No direct INSERT (trigger-only), no DELETE by users

-- ============================================================
-- Extend handle_request_accepted() to also create skill_exchanges
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

    -- Sender teaches receiver: sender offers what receiver wants
    INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
    SELECT NEW.sender_id, NEW.receiver_id, us_t.skill_id, NEW.id
    FROM public.user_skills us_t
    JOIN public.user_skills us_l
      ON us_l.skill_id = us_t.skill_id
      AND us_l.user_id = NEW.receiver_id
      AND us_l.skill_type = 'wanted'
    WHERE us_t.user_id = NEW.sender_id
      AND us_t.skill_type = 'offered'
    ON CONFLICT DO NOTHING;

    -- Receiver teaches sender: receiver offers what sender wants
    INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
    SELECT NEW.receiver_id, NEW.sender_id, us_t.skill_id, NEW.id
    FROM public.user_skills us_t
    JOIN public.user_skills us_l
      ON us_l.skill_id = us_t.skill_id
      AND us_l.user_id = NEW.sender_id
      AND us_l.skill_type = 'wanted'
    WHERE us_t.user_id = NEW.receiver_id
      AND us_t.skill_type = 'offered'
    ON CONFLICT DO NOTHING;

  END IF;
  RETURN NEW;
END;
$$;

-- Re-revoke PUBLIC execute (CREATE OR REPLACE resets grants to default)
REVOKE EXECUTE ON FUNCTION public.handle_request_accepted() FROM PUBLIC;

-- ============================================================
-- Backfill: create skill_exchanges for existing accepted connections
-- ============================================================

INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
SELECT cr.sender_id, cr.receiver_id, us_t.skill_id, cr.id
FROM public.connection_requests cr
JOIN public.user_skills us_t ON us_t.user_id = cr.sender_id AND us_t.skill_type = 'offered'
JOIN public.user_skills us_l
  ON us_l.skill_id = us_t.skill_id
  AND us_l.user_id = cr.receiver_id
  AND us_l.skill_type = 'wanted'
WHERE cr.status = 'accepted'
ON CONFLICT DO NOTHING;

INSERT INTO public.skill_exchanges (teacher_id, learner_id, skill_id, connection_request_id)
SELECT cr.receiver_id, cr.sender_id, us_t.skill_id, cr.id
FROM public.connection_requests cr
JOIN public.user_skills us_t ON us_t.user_id = cr.receiver_id AND us_t.skill_type = 'offered'
JOIN public.user_skills us_l
  ON us_l.skill_id = us_t.skill_id
  AND us_l.user_id = cr.sender_id
  AND us_l.skill_type = 'wanted'
WHERE cr.status = 'accepted'
ON CONFLICT DO NOTHING;
