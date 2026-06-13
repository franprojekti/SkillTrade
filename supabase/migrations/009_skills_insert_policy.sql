-- Allow authenticated users to insert new skills with pending_review status.
-- This is needed for the free-text skill suggestion flow where the client
-- creates a new skill directly (no admin approval required for MVP).
-- Status is locked to 'pending_review' — only admins can set 'active'.

CREATE POLICY "skills_insert_authenticated"
  ON public.skills FOR INSERT
  TO authenticated
  WITH CHECK (status = 'pending_review');
