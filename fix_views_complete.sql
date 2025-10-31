-- ============================================
-- Complete Fix: Views to SECURITY INVOKER + Revoke Permissions
-- ============================================

-- Method 1: Use ALTER VIEW to change existing views to SECURITY INVOKER
-- (PostgreSQL 15+ and Supabase support this)

-- Fix 1: user_activity_summary
ALTER VIEW public.user_activity_summary
SET (security_invoker = true);

-- Explicitly revoke ALL permissions and re-grant only to service_role
REVOKE ALL ON public.user_activity_summary FROM authenticated;
REVOKE ALL ON public.user_activity_summary FROM anon;
REVOKE ALL ON public.user_activity_summary FROM PUBLIC;
GRANT SELECT ON public.user_activity_summary TO service_role;

-- Fix 2: user_engagement
ALTER VIEW public.user_engagement
SET (security_invoker = true);

-- Revoke from anon/PUBLIC, keep for authenticated
REVOKE ALL ON public.user_engagement FROM anon;
REVOKE ALL ON public.user_engagement FROM PUBLIC;
GRANT SELECT ON public.user_engagement TO authenticated;
GRANT SELECT ON public.user_engagement TO service_role;

-- Fix 3: resource_popularity
ALTER VIEW public.resource_popularity
SET (security_invoker = true);

-- Explicitly revoke ALL permissions and re-grant only to service_role
REVOKE ALL ON public.resource_popularity FROM authenticated;
REVOKE ALL ON public.resource_popularity FROM anon;
REVOKE ALL ON public.resource_popularity FROM PUBLIC;
GRANT SELECT ON public.resource_popularity TO service_role;

