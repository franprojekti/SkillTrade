-- ============================================================
-- Migration 019: Security fixes
-- 1. get_matches: enforce p_user_id = auth.uid() (IDOR fix)
-- 2. connection_requests_update: split policy so sender cannot
--    self-accept their own request
-- ============================================================

-- -------------------------------------------------------
-- 1. Fix get_matches: add caller identity guard
-- -------------------------------------------------------
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
  out_i_offer_wanted     TEXT[],
  out_updated_at         TIMESTAMPTZ
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
  -- Security: only allow a user to fetch their own matches
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

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
      p.connection_preference,
      p.updated_at
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
    f.i_offer_skills        AS out_i_offer_wanted,
    f.updated_at            AS out_updated_at
  FROM final f
  WHERE f.total_score >= 20
  ORDER BY f.total_score DESC
  LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_matches(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_matches(UUID) TO authenticated;

-- -------------------------------------------------------
-- 2. Fix connection_requests_update: split into two policies
--    so a sender cannot set status = 'accepted' themselves.
-- -------------------------------------------------------
DROP POLICY IF EXISTS "connection_requests_update" ON public.connection_requests;

-- Receiver can accept or decline a pending request
CREATE POLICY "connection_requests_update_receiver"
  ON public.connection_requests FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = receiver_id
    AND status = 'pending'
  )
  WITH CHECK (
    (select auth.uid()) = receiver_id
    AND status IN ('accepted', 'declined')
  );

-- Sender can only cancel their own pending request
CREATE POLICY "connection_requests_update_sender"
  ON public.connection_requests FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = sender_id
    AND status = 'pending'
  )
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND status = 'cancelled'
  );
