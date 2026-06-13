-- Fix: conversation_participants SELECT policy was self-referential (EXISTS subquery
-- referenced the same table), causing PostgreSQL to detect infinite recursion and
-- error on every query. This made the chat page always return 404 because
-- participantError was always truthy.
--
-- Fix: replace with simple user_id = auth.uid() check. Every query in the app
-- only checks whether the current user is a participant — no feature reads
-- other users' rows from this table.

DROP POLICY IF EXISTS "conversation_participants_select" ON public.conversation_participants;

CREATE POLICY "conversation_participants_select"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));
