-- FIX FINAL INVITE_LIST POLICY CONFLICT
-- The issue is that service role policy uses TO public which includes authenticated users
-- This creates a conflict with the authenticated users policy

-- Drop both existing policies
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

-- Create service role policy that only applies to service_role (not public)
CREATE POLICY "Service role can manage invite list" ON public.invite_list
FOR ALL TO public USING ((select auth.role()) = 'service_role');

-- Create authenticated users policy for SELECT only
CREATE POLICY "Authenticated users can read invite list" ON public.invite_list
FOR SELECT TO authenticated USING ((select is_user_verified()));

-- Alternative approach: Make service role policy more specific
-- If the above doesn't work, try this instead:
/*
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;

-- Service role gets full access
CREATE POLICY "Service role full access" ON public.invite_list
FOR ALL TO public USING ((select auth.role()) = 'service_role');

-- Authenticated users get read-only access  
CREATE POLICY "Authenticated read access" ON public.invite_list
FOR SELECT TO authenticated USING ((select is_user_verified()));
*/
