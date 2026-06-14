-- Merge the two SELECT policies on blocks into one to avoid the
-- "multiple permissive policies" performance warning.
-- blocks_select_own (blocker_id) + blocks_select_blocked (blocked_id) → blocks_select_party
DROP POLICY IF EXISTS "blocks_select_own" ON public.blocks;
DROP POLICY IF EXISTS "blocks_select_blocked" ON public.blocks;

CREATE POLICY "blocks_select_party"
  ON public.blocks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = blocker_id OR (select auth.uid()) = blocked_id);
