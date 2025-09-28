-- FINAL FIX FOR INVITE_LIST POLICY CONFLICT
-- The issue is that both policies apply to authenticated role for SELECT
-- We need to completely separate the roles

-- Drop both existing policies
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

-- Create a single policy that handles both roles with proper conditions
CREATE POLICY "Invite list access policy" ON public.invite_list
FOR ALL TO public USING (
    (select auth.role()) = 'service_role' OR 
    ((select auth.role()) = 'authenticated' AND (select is_user_verified()))
);

-- Alternative approach: Create separate policies with different actions
-- If the above doesn't work, try this instead:
/*
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

-- Service role gets full access (INSERT, UPDATE, DELETE)
CREATE POLICY "Service role manage invite list" ON public.invite_list
FOR INSERT, UPDATE, DELETE TO public USING ((select auth.role()) = 'service_role');

-- Authenticated users get read-only access (SELECT only)
CREATE POLICY "Authenticated read invite list" ON public.invite_list
FOR SELECT TO authenticated USING ((select is_user_verified()));
*/
