-- Enable RLS on user_activity table
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only insert their own activity
-- (App only inserts, never reads directly from this table)
CREATE POLICY "Users can insert own activity" ON public.user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

