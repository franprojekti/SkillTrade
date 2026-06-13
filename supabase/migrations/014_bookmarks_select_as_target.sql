-- Allow users to see bookmark rows where they are the bookmarked person.
-- Needed for the mutual bookmark check on the Saved page.
-- Multiple SELECT policies are OR'd, so this adds to the existing
-- "bookmarks_select_own" policy (user_id = auth.uid()).
CREATE POLICY "bookmarks_select_as_target"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING (bookmarked_user_id = (select auth.uid()));
