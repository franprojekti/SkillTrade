-- 1. Revoke anon access to get_matches (authenticated can still call it)
REVOKE EXECUTE ON FUNCTION public.get_matches(uuid) FROM anon;

-- 2. Revoke PUBLIC access to handle_user_skills_changed (trigger-only, not a REST endpoint)
REVOKE EXECUTE ON FUNCTION public.handle_user_skills_changed() FROM PUBLIC;

-- 3. Merge bookmarks SELECT policies (two permissive → one)
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_select_as_target" ON public.bookmarks;

CREATE POLICY "bookmarks_select"
  ON public.bookmarks FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_id OR
    (select auth.uid()) = bookmarked_user_id
  );

-- 4. Merge connection_requests UPDATE policies (two permissive → one)
--    Security is preserved: receiver can only set accepted/declined, sender only cancelled
DROP POLICY IF EXISTS "connection_requests_update_receiver" ON public.connection_requests;
DROP POLICY IF EXISTS "connection_requests_update_sender" ON public.connection_requests;

CREATE POLICY "connection_requests_update"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (
    ((select auth.uid()) = receiver_id AND status = 'pending') OR
    ((select auth.uid()) = sender_id AND status = 'pending')
  )
  WITH CHECK (
    ((select auth.uid()) = receiver_id AND status IN ('accepted', 'declined')) OR
    ((select auth.uid()) = sender_id AND status = 'cancelled')
  );
