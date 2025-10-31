-- ============================================
-- Add SELECT Policy for user_activity
-- ============================================
-- Required for user_engagement view to work with SECURITY INVOKER
-- Users need to SELECT their own rows so the view can aggregate them

CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

