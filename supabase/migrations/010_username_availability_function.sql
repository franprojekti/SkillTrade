-- SECURITY DEFINER function callable by anon so the register page can check
-- username availability without an auth session. Returns only a boolean —
-- no profile data is exposed to unauthenticated callers.
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username TEXT := lower(trim(p_username));
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    RETURN FALSE;
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_username || '@internal.skilltrade.app') THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_username_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO authenticated;
