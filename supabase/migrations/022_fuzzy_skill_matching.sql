-- Substring skill matching in get_matches.
-- "Web" matches "Web Development", "Photo" matches "Photography", etc.
-- Both directions checked: their skill contains mine OR mine contains theirs.
-- Minimum 3 chars to avoid single-letter false positives.

DROP FUNCTION IF EXISTS public.get_matches(uuid);

CREATE FUNCTION public.get_matches(p_user_id UUID)
RETURNS TABLE (
  out_user_id           UUID,
  out_username          TEXT,
  out_display_name      TEXT,
  out_bio               TEXT,
  out_years_experience  INTEGER,
  out_score             INTEGER,
  out_location_city     TEXT,
  out_location_area     TEXT,
  out_connection_pref   TEXT,
  out_they_offer_wanted TEXT[],
  out_i_offer_wanted    TEXT[],
  out_updated_at        TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
      WHEN cr.sender_id = p_user_id THEN cr.receiver_id
      ELSE cr.sender_id
    END
    FROM public.connection_requests cr
    WHERE (cr.sender_id = p_user_id OR cr.receiver_id = p_user_id)
      AND cr.status = 'accepted'
  ) INTO v_connected_ids;

  SELECT pr.location_city, pr.location_area, pr.connection_preference
  INTO v_my_city, v_my_area, v_my_preference
  FROM public.profiles pr
  WHERE pr.id = p_user_id;

  SELECT COUNT(*) INTO v_my_wanted_count
  FROM public.user_skills us
  WHERE us.user_id = p_user_id AND us.skill_type = 'wanted';

  SELECT COUNT(*) INTO v_my_offered_count
  FROM public.user_skills us
  WHERE us.user_id = p_user_id AND us.skill_type = 'offered';

  RETURN QUERY
  WITH candidates AS (
    SELECT pr2.id AS cand_id
    FROM public.profiles pr2
    WHERE pr2.id != p_user_id
      AND pr2.is_active = TRUE
      AND pr2.onboarding_completed = TRUE
      AND (v_blocked_ids IS NULL OR pr2.id != ALL(v_blocked_ids))
      AND (v_connected_ids IS NULL OR pr2.id != ALL(v_connected_ids))
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
        SELECT 1
        FROM public.user_skills us_me
        JOIN public.skills s_me ON s_me.id = us_me.skill_id
        WHERE us_me.user_id = p_user_id
          AND us_me.skill_type = 'wanted'
          AND LENGTH(s_me.canonical_name) >= 3
          AND LENGTH(s_them.canonical_name) >= 3
          AND (
            s_them.canonical_name ILIKE '%' || s_me.canonical_name || '%'
            OR s_me.canonical_name ILIKE '%' || s_them.canonical_name || '%'
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
        SELECT 1
        FROM public.user_skills us_me
        JOIN public.skills s_me ON s_me.id = us_me.skill_id
        WHERE us_me.user_id = p_user_id
          AND us_me.skill_type = 'offered'
          AND LENGTH(s_me.canonical_name) >= 3
          AND LENGTH(s_them.canonical_name) >= 3
          AND (
            s_them.canonical_name ILIKE '%' || s_me.canonical_name || '%'
            OR s_me.canonical_name ILIKE '%' || s_them.canonical_name || '%'
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
          WHEN v_my_city IS NOT NULL AND pr3.location_city = v_my_city THEN
            CASE WHEN v_my_area IS NOT NULL AND pr3.location_area = v_my_area THEN 15 ELSE 10 END
          ELSE 0
        END
      + CASE
          WHEN pr3.connection_preference = v_my_preference
            OR pr3.connection_preference = 'both'
            OR v_my_preference = 'both'
          THEN 5
          ELSE 0
        END
      AS total_score,
      pr3.username,
      pr3.display_name,
      pr3.bio,
      pr3.years_experience,
      pr3.location_city,
      pr3.location_area,
      pr3.connection_preference,
      pr3.updated_at
    FROM scored s
    JOIN public.profiles pr3 ON pr3.id = s.cand_id
  )
  SELECT
    f.cand_id,
    f.username,
    f.display_name,
    f.bio,
    f.years_experience,
    f.total_score,
    f.location_city,
    f.location_area,
    f.connection_preference,
    f.they_offer_skills,
    f.i_offer_skills,
    f.updated_at
  FROM final f
  WHERE f.total_score >= 20
  ORDER BY f.total_score DESC
  LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_matches(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_matches(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_matches(uuid) TO authenticated;
