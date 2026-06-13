-- Fix missing ON DELETE CASCADE on conversations.connection_request_id
-- Without this, deleting a user (or their connection_requests) is blocked
-- by conversations that still reference the deleted request.
--
-- Impact on other users: zero. Their profiles and data are untouched.
-- They simply lose access to conversations where the other party deleted
-- their account — which is the correct expected behaviour.

ALTER TABLE public.conversations
  DROP CONSTRAINT conversations_connection_request_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_connection_request_id_fkey
  FOREIGN KEY (connection_request_id)
  REFERENCES public.connection_requests(id)
  ON DELETE CASCADE;
