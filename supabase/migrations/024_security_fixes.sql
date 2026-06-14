-- ============================================================
-- Migration 024: Security fixes
-- Fix 1: blocks RLS — allow blocked_id to read their own block records
--   (without this, the profile page block check silently misses the
--    case where you are the blocked_id, so blocked users can view blockers)
-- Fix 2: connection_requests UPDATE — prevent re-sending when receiver
--   has blocked the sender (bypassed by upserting declined→pending)
-- ============================================================

-- Fix 1: Merge blocks SELECT policies into one (both blocker and blocked can read)
-- Applied via migration 025 after initial split — see 025 for final form.
DROP POLICY IF EXISTS "blocks_select_own" ON public.blocks;
DROP POLICY IF EXISTS "blocks_select_blocked" ON public.blocks;

CREATE POLICY "blocks_select_party"
  ON public.blocks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = blocker_id OR (select auth.uid()) = blocked_id);

-- Fix 2: Replace connection_requests UPDATE policy to add block guard
-- Sender can only set status to pending if receiver hasn't blocked them.
DROP POLICY IF EXISTS "connection_requests_update" ON public.connection_requests;

CREATE POLICY "connection_requests_update"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (
    ((select auth.uid()) = receiver_id AND status IN ('pending', 'declined')) OR
    ((select auth.uid()) = sender_id   AND status IN ('pending', 'declined'))
  )
  WITH CHECK (
    ((select auth.uid()) = receiver_id AND status IN ('accepted', 'declined', 'pending')) OR
    (
      (select auth.uid()) = sender_id
      AND status IN ('cancelled', 'pending')
      -- When re-sending (new status = pending), ensure receiver hasn't blocked the sender
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE blocker_id = receiver_id
          AND blocked_id = (select auth.uid())
      )
    )
  );
