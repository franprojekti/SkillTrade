-- ============================================================
-- SkillTrade — Security & Performance Fixes
-- Fixes Supabase linter warnings:
--   SECURITY: handle_updated_at search_path, pg_trgm in public,
--             messages_update_read WITH CHECK, SECURITY DEFINER callable by anon
--   PERF WARN: auth_rls_initplan (22 policies), duplicate profiles SELECT
--   PERF INFO: 7 missing FK indexes
-- ============================================================

-- ============================================================
-- PART 1: SECURITY
-- ============================================================

-- 1a. Fix handle_updated_at — add SECURITY DEFINER + SET search_path
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

-- 1b. Move pg_trgm to extensions schema
--     Must drop get_matches first (uses word_similarity from pg_trgm),
--     then the extension (CASCADE drops the GIN index), then recreate both.

DROP FUNCTION IF EXISTS public.get_matches(UUID);
DROP INDEX IF EXISTS public.skills_name_trgm;
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm SCHEMA extensions;

CREATE INDEX IF NOT EXISTS skills_name_trgm
  ON public.skills USING GIN (canonical_name extensions.gin_trgm_ops);

-- Recreate get_matches with updated search_path (public, extensions)
-- so word_similarity resolves without schema prefix in function body
DROP FUNCTION IF EXISTS public.get_matches(UUID);
CREATE OR REPLACE FUNCTION public.get_matches(p_user_id UUID)
RETURNS TABLE (
  out_user_id            UUID,
  out_username           TEXT,
  out_display_name       TEXT,
  out_bio                TEXT,
  out_years_experience   INTEGER,
  out_score              INTEGER,
  out_location_city      TEXT,
  out_location_area      TEXT,
  out_connection_pref    TEXT,
  out_they_offer_wanted  TEXT[],
  out_i_offer_wanted     TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_blocked_ids      UUID[];
  v_connected_ids    UUID[];
  v_my_city          TEXT;
  v_my_area          TEXT;
  v_my_preference    TEXT;
  v_my_wanted_count  INTEGER;
  v_my_offered_count INTEGER;
BEGIN
  v_blocked_ids := public.get_blocked_ids(p_user_id);

  SELECT ARRAY(
    SELECT CASE
      WHEN sender_id = p_user_id THEN receiver_id
      ELSE sender_id
    END
    FROM public.connection_requests
    WHERE (sender_id = p_user_id OR receiver_id = p_user_id)
      AND status = 'accepted'
  ) INTO v_connected_ids;

  SELECT location_city, location_area, connection_preference
  INTO v_my_city, v_my_area, v_my_preference
  FROM public.profiles
  WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_my_wanted_count
  FROM public.user_skills
  WHERE user_id = p_user_id AND skill_type = 'wanted';

  SELECT COUNT(*) INTO v_my_offered_count
  FROM public.user_skills
  WHERE user_id = p_user_id AND skill_type = 'offered';

  RETURN QUERY
  WITH candidates AS (
    SELECT p.id AS cand_id
    FROM public.profiles p
    WHERE p.id != p_user_id
      AND p.is_active = TRUE
      AND p.onboarding_completed = TRUE
      AND (v_blocked_ids IS NULL OR p.id != ALL(v_blocked_ids))
      AND (v_connected_ids IS NULL OR p.id != ALL(v_connected_ids))
  ),
  they_offer_i_want AS (
    SELECT
      us_them.user_id AS cand_id,
      ARRAY_AGG(DISTINCT s_them.canonical_name ORDER BY s_them.canonical_name) AS skills
    FROM public.user_skills us_them
    JOIN public.skills s_them ON s_them.id = us_them.skill_id
    WHERE us_them.skill_type = 'offered'
      AND us_them.user_id IN (SELECT cand_id FROM candidates)
      AND EXISTS (
        SELECT 1 FROM public.user_skills us_me
        JOIN public.skills s_me ON s_me.id = us_me.skill_id
        WHERE us_me.user_id = p_user_id AND us_me.skill_type = 'wanted'
          AND (
            us_them.skill_id = us_me.skill_id
            OR word_similarity(s_them.canonical_name, s_me.canonical_name) > 0.35
          )
      )
    GROUP BY us_them.user_id
  ),
  i_offer_they_want AS (
    SELECT
      us_them.user_id AS cand_id,
      ARRAY_AGG(DISTINCT s_them.canonical_name ORDER BY s_them.canonical_name) AS skills
    FROM public.user_skills us_them
    JOIN public.skills s_them ON s_them.id = us_them.skill_id
    WHERE us_them.skill_type = 'wanted'
      AND us_them.user_id IN (SELECT cand_id FROM candidates)
      AND EXISTS (
        SELECT 1 FROM public.user_skills us_me
        JOIN public.skills s_me ON s_me.id = us_me.skill_id
        WHERE us_me.user_id = p_user_id AND us_me.skill_type = 'offered'
          AND (
            us_them.skill_id = us_me.skill_id
            OR word_similarity(s_them.canonical_name, s_me.canonical_name) > 0.35
          )
      )
    GROUP BY us_them.user_id
  ),
  scored AS (
    SELECT
      c.cand_id,
      COALESCE(toi.skills, '{}') AS they_offer_skills,
      COALESCE(iow.skills, '{}') AS i_offer_skills,
      CASE
        WHEN v_my_wanted_count > 0
        THEN LEAST(40, (COALESCE(array_length(toi.skills, 1), 0) * 40 / v_my_wanted_count))
        ELSE 0
      END AS they_offer_score,
      CASE
        WHEN v_my_offered_count > 0
        THEN LEAST(40, (COALESCE(array_length(iow.skills, 1), 0) * 40 / v_my_offered_count))
        ELSE 0
      END AS i_offer_score
    FROM candidates c
    LEFT JOIN they_offer_i_want toi ON toi.cand_id = c.cand_id
    LEFT JOIN i_offer_they_want iow ON iow.cand_id = c.cand_id
    WHERE toi.cand_id IS NOT NULL OR iow.cand_id IS NOT NULL
  ),
  final AS (
    SELECT
      s.cand_id,
      s.they_offer_skills,
      s.i_offer_skills,
      s.they_offer_score + s.i_offer_score
      + CASE
          WHEN v_my_city IS NOT NULL AND p.location_city = v_my_city THEN
            CASE WHEN v_my_area IS NOT NULL AND p.location_area = v_my_area THEN 15 ELSE 10 END
          ELSE 0
        END
      + CASE
          WHEN p.connection_preference = v_my_preference
            OR p.connection_preference = 'both'
            OR v_my_preference = 'both'
          THEN 5
          ELSE 0
        END
      AS total_score,
      p.username,
      p.display_name,
      p.bio,
      p.years_experience,
      p.location_city,
      p.location_area,
      p.connection_preference
    FROM scored s
    JOIN public.profiles p ON p.id = s.cand_id
  )
  SELECT
    f.cand_id               AS out_user_id,
    f.username              AS out_username,
    f.display_name          AS out_display_name,
    f.bio                   AS out_bio,
    f.years_experience      AS out_years_experience,
    f.total_score           AS out_score,
    f.location_city         AS out_location_city,
    f.location_area         AS out_location_area,
    f.connection_preference AS out_connection_pref,
    f.they_offer_skills     AS out_they_offer_wanted,
    f.i_offer_skills        AS out_i_offer_wanted
  FROM final f
  WHERE f.total_score >= 20
  ORDER BY f.total_score DESC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_matches(UUID) TO authenticated;

-- 1c. REVOKE EXECUTE on SECURITY DEFINER functions from anon
--     Trigger-only functions should also not be callable by authenticated via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_request_accepted() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_connection_request() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_message() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_blocked_ids(UUID) FROM anon;
-- get_blocked_ids and get_matches remain callable by authenticated (used by app queries)

-- ============================================================
-- PART 2: PERFORMANCE — auth_rls_initplan + duplicate policies
-- ============================================================
-- Replace all bare auth.uid() with (select auth.uid()) across every policy.
-- Also merge the two permissive SELECT policies on profiles.

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR (select auth.uid()) = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- USER SKILLS
DROP POLICY IF EXISTS "user_skills_insert_own" ON public.user_skills;
DROP POLICY IF EXISTS "user_skills_delete_own" ON public.user_skills;

CREATE POLICY "user_skills_insert_own"
  ON public.user_skills FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_skills_delete_own"
  ON public.user_skills FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- SKILL SUGGESTIONS
DROP POLICY IF EXISTS "skill_suggestions_insert" ON public.skill_suggestions;

CREATE POLICY "skill_suggestions_insert"
  ON public.skill_suggestions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = suggested_by);

-- CONNECTION REQUESTS
DROP POLICY IF EXISTS "connection_requests_select" ON public.connection_requests;
DROP POLICY IF EXISTS "connection_requests_insert" ON public.connection_requests;
DROP POLICY IF EXISTS "connection_requests_update" ON public.connection_requests;

CREATE POLICY "connection_requests_select"
  ON public.connection_requests FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "connection_requests_insert"
  ON public.connection_requests FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "connection_requests_update"
  ON public.connection_requests FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = receiver_id OR (select auth.uid()) = sender_id)
  WITH CHECK ((select auth.uid()) = receiver_id OR (select auth.uid()) = sender_id);

-- CONVERSATIONS
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;

CREATE POLICY "conversations_select"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = (select auth.uid())
    )
  );

-- CONVERSATION PARTICIPANTS
DROP POLICY IF EXISTS "conversation_participants_select" ON public.conversation_participants;

CREATE POLICY "conversation_participants_select"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = (select auth.uid())
    )
  );

-- MESSAGES
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update_read" ON public.messages;

CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

-- Fix WITH CHECK: must mirror USING (was incorrectly TRUE before)
CREATE POLICY "messages_update_read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) != sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) != sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

-- BOOKMARKS
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;

CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- BLOCKS
DROP POLICY IF EXISTS "blocks_select_own" ON public.blocks;
DROP POLICY IF EXISTS "blocks_insert_own" ON public.blocks;
DROP POLICY IF EXISTS "blocks_delete_own" ON public.blocks;

CREATE POLICY "blocks_select_own"
  ON public.blocks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

CREATE POLICY "blocks_insert_own"
  ON public.blocks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = blocker_id);

CREATE POLICY "blocks_delete_own"
  ON public.blocks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

-- REPORTS
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;

CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = reporter_id);

CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reporter_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================
-- PART 3: PERFORMANCE — missing FK indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookmarks_bookmarked_user
  ON public.bookmarks (bookmarked_user_id);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user
  ON public.conversation_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_request
  ON public.conversations (connection_request_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_reports_reporter
  ON public.reports (reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_reported
  ON public.reports (reported_id);

CREATE INDEX IF NOT EXISTS idx_skill_suggestions_suggested_by
  ON public.skill_suggestions (suggested_by);
