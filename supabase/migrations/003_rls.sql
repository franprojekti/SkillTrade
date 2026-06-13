-- ============================================================
-- SkillTrade — Row Level Security Policies
-- ============================================================
-- Note: all auth.uid() calls wrapped as (select auth.uid()) for
-- auth_rls_initplan optimization (evaluated once per query, not per row).

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

-- Merged: active profiles visible to all, own profile always visible
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR (select auth.uid()) = id);

-- User can update their own profile only
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Profile insert is handled by the trigger (service role), not directly by user

-- ============================================================
-- SKILLS
-- ============================================================

-- Anyone authenticated can read active skills (for autocomplete, matching)
CREATE POLICY "skills_select_authenticated"
  ON public.skills FOR SELECT
  TO authenticated
  USING (TRUE);

-- ============================================================
-- USER SKILLS
-- ============================================================

-- Any authenticated user can read user skills (needed for matching)
CREATE POLICY "user_skills_select_authenticated"
  ON public.user_skills FOR SELECT
  TO authenticated
  USING (TRUE);

-- User can only add their own skills
CREATE POLICY "user_skills_insert_own"
  ON public.user_skills FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- User can only delete their own skills
CREATE POLICY "user_skills_delete_own"
  ON public.user_skills FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- SKILL SUGGESTIONS
-- ============================================================

-- Any authenticated user can read suggestions (for dedup checking)
CREATE POLICY "skill_suggestions_select"
  ON public.skill_suggestions FOR SELECT
  TO authenticated
  USING (TRUE);

-- User can insert their own suggestions
CREATE POLICY "skill_suggestions_insert"
  ON public.skill_suggestions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = suggested_by);

-- ============================================================
-- CONNECTION REQUESTS
-- ============================================================

-- User can see requests where they are sender or receiver
CREATE POLICY "connection_requests_select"
  ON public.connection_requests FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

-- User can create requests where they are the sender
CREATE POLICY "connection_requests_insert"
  ON public.connection_requests FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

-- Receiver can update status (accept/decline); sender can cancel
CREATE POLICY "connection_requests_update"
  ON public.connection_requests FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = receiver_id OR (select auth.uid()) = sender_id)
  WITH CHECK ((select auth.uid()) = receiver_id OR (select auth.uid()) = sender_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================

-- User can see conversations they participate in
CREATE POLICY "conversations_select"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================

-- User can only see their own participation rows (avoids infinite recursion from self-reference)
CREATE POLICY "conversation_participants_select"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- MESSAGES
-- ============================================================

-- User can read messages in their conversations
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

-- User can insert messages in their conversations as themselves
CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

-- User can update read_at on messages addressed to them (mark as read)
-- WITH CHECK mirrors USING — only allows the exact rows the USING clause permits
CREATE POLICY "messages_update_read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) != sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) != sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- BOOKMARKS
-- ============================================================

CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Allows seeing rows where you are the bookmarked person (for mutual bookmark detection)
CREATE POLICY "bookmarks_select_as_target"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING (bookmarked_user_id = (select auth.uid()));

CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- BLOCKS
-- ============================================================

CREATE POLICY "blocks_select_own"
  ON public.blocks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

CREATE POLICY "blocks_insert_own"
  ON public.blocks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = blocker_id);

CREATE POLICY "blocks_delete_own"
  ON public.blocks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

-- ============================================================
-- REPORTS
-- ============================================================

-- User can only see reports they filed
CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = reporter_id);

-- User can file reports as themselves
CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reporter_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
