-- ============================================================
-- SkillTrade — Match Computation Function
-- ============================================================

-- Returns match results for a given user, sorted by score descending
-- Excludes: self, blocked users, users who blocked the viewer,
--           already-connected users
-- Minimum score threshold: 20

CREATE OR REPLACE FUNCTION public.get_matches(p_user_id UUID)
RETURNS TABLE (
  user_id               UUID,
  username              TEXT,
  display_name          TEXT,
  location_city         TEXT,
  location_area         TEXT,
  connection_preference TEXT,
  score                 INTEGER,
  they_offer_my_wanted  TEXT[],
  i_offer_their_wanted  TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked_ids     UUID[];
  v_connected_ids   UUID[];
  v_my_city         TEXT;
  v_my_area         TEXT;
  v_my_preference   TEXT;
  v_my_wanted_count INTEGER;
  v_my_offered_count INTEGER;
BEGIN
  -- Get blocked IDs (both directions)
  v_blocked_ids := public.get_blocked_ids(p_user_id);

  -- Get already-accepted connection partner IDs
  SELECT ARRAY(
    SELECT CASE
      WHEN sender_id = p_user_id THEN receiver_id
      ELSE sender_id
    END
    FROM public.connection_requests
    WHERE (sender_id = p_user_id OR receiver_id = p_user_id)
      AND status = 'accepted'
  ) INTO v_connected_ids;

  -- Get current user's location and preference
  SELECT location_city, location_area, connection_preference
  INTO v_my_city, v_my_area, v_my_preference
  FROM public.profiles
  WHERE id = p_user_id;

  -- Count my skills
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
  -- Skills they offer that I want
  they_offer_i_want AS (
    SELECT
      us_them.user_id AS cand_id,
      ARRAY_AGG(DISTINCT s.canonical_name ORDER BY s.canonical_name) AS skills
    FROM public.user_skills us_them
    JOIN public.skills s ON s.id = us_them.skill_id
    WHERE us_them.skill_type = 'offered'
      AND us_them.skill_id IN (
        SELECT skill_id FROM public.user_skills
        WHERE user_id = p_user_id AND skill_type = 'wanted'
      )
      AND us_them.user_id IN (SELECT cand_id FROM candidates)
    GROUP BY us_them.user_id
  ),
  -- Skills I offer that they want
  i_offer_they_want AS (
    SELECT
      us_them.user_id AS cand_id,
      ARRAY_AGG(DISTINCT s.canonical_name ORDER BY s.canonical_name) AS skills
    FROM public.user_skills us_them
    JOIN public.skills s ON s.id = us_them.skill_id
    WHERE us_them.skill_type = 'wanted'
      AND us_them.skill_id IN (
        SELECT skill_id FROM public.user_skills
        WHERE user_id = p_user_id AND skill_type = 'offered'
      )
      AND us_them.user_id IN (SELECT cand_id FROM candidates)
    GROUP BY us_them.user_id
  ),
  scored AS (
    SELECT
      c.cand_id,
      COALESCE(toi.skills, '{}') AS they_offer_skills,
      COALESCE(iow.skills, '{}') AS i_offer_skills,
      -- Primary: they offer what I want (40 pts max)
      CASE
        WHEN v_my_wanted_count > 0
        THEN LEAST(40, (COALESCE(array_length(toi.skills, 1), 0) * 40 / v_my_wanted_count))
        ELSE 0
      END AS they_offer_score,
      -- Primary: I offer what they want (40 pts max)
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
      -- Location bonus (15 pts max)
      + CASE
          WHEN v_my_city IS NOT NULL AND p.location_city = v_my_city THEN
            CASE WHEN v_my_area IS NOT NULL AND p.location_area = v_my_area THEN 15 ELSE 10 END
          ELSE 0
        END
      -- Connection preference bonus (5 pts)
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
      p.location_city,
      p.location_area,
      p.connection_preference
    FROM scored s
    JOIN public.profiles p ON p.id = s.cand_id
  )
  SELECT
    f.cand_id          AS user_id,
    f.username,
    f.display_name,
    f.location_city,
    f.location_area,
    f.connection_preference,
    f.total_score      AS score,
    f.they_offer_skills AS they_offer_my_wanted,
    f.i_offer_skills    AS i_offer_their_wanted
  FROM final f
  WHERE f.total_score >= 20
  ORDER BY f.total_score DESC
  LIMIT 100;
END;
$$;
