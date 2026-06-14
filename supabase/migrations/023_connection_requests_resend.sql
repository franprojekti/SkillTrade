-- Allow both sender and receiver to re-open a declined request (set back to pending)
DROP POLICY IF EXISTS "connection_requests_update" ON public.connection_requests;

CREATE POLICY "connection_requests_update"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (
    ((select auth.uid()) = receiver_id AND status IN ('pending', 'declined')) OR
    ((select auth.uid()) = sender_id   AND status IN ('pending', 'declined'))
  )
  WITH CHECK (
    ((select auth.uid()) = receiver_id AND status IN ('accepted', 'declined', 'pending')) OR
    ((select auth.uid()) = sender_id   AND status IN ('cancelled', 'pending'))
  );
