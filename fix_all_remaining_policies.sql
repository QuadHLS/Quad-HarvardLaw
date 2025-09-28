-- FIX ALL REMAINING UNOPTIMIZED POLICIES
-- This script fixes all 34 remaining policies that still use auth.<function>() directly

-- ==============================================
-- Step 1: Get all unoptimized policies first
-- ==============================================

-- Find all policies that still need optimization
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    (qual LIKE '%auth.%' AND qual NOT LIKE '%(select auth.%') OR 
    (with_check LIKE '%auth.%' AND with_check NOT LIKE '%(select auth.%')
)
ORDER BY tablename, policyname;

-- ==============================================
-- Step 2: Fix all remaining policies systematically
-- ==============================================

-- Fix bar_count policies
DROP POLICY IF EXISTS "Users can delete their own RSVP" ON public.bar_count;
CREATE POLICY "Users can delete their own RSVP" ON public.bar_count
FOR DELETE
TO authenticated
USING (
    (identity = (select auth.uid())::text)
);

DROP POLICY IF EXISTS "Users can insert their own RSVP" ON public.bar_count;
CREATE POLICY "Users can insert their own RSVP" ON public.bar_count
FOR INSERT
TO authenticated
WITH CHECK (
    (identity = (select auth.uid())::text)
);

-- Fix bar_review_events policies
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.bar_review_events;
CREATE POLICY "Authenticated users can view events" ON public.bar_review_events
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

-- Fix Courses policies (note the capital C)
DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON public."Courses";
CREATE POLICY "Allow authenticated users to read courses" ON public."Courses"
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can view Courses" ON public."Courses";
CREATE POLICY "Authenticated users can view Courses" ON public."Courses"
FOR SELECT
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
);

-- Fix access_codes policies
DROP POLICY IF EXISTS "Service role only" ON public.access_codes;
CREATE POLICY "Service role only" ON public.access_codes
FOR ALL
TO public
USING (
    ((select auth.role()) = 'service_role')
)
WITH CHECK (
    ((select auth.role()) = 'service_role')
);

-- Fix any remaining calendar_events policies
DROP POLICY IF EXISTS "Users manage own calendar events" ON public.calendar_events;
CREATE POLICY "Users manage own calendar events" ON public.calendar_events
FOR ALL
TO authenticated
USING (
    (user_id = (select auth.uid())) 
    AND (select is_user_verified())
)
WITH CHECK (
    (user_id = (select auth.uid())) 
    AND (select is_user_verified())
);

-- Fix any remaining conversation_participants policies
DROP POLICY IF EXISTS "Users join conversations" ON public.conversation_participants;
CREATE POLICY "Users join conversations" ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
    (user_id = (select auth.uid())) 
    AND (select is_user_verified())
);

DROP POLICY IF EXISTS "Users leave conversations" ON public.conversation_participants;
CREATE POLICY "Users leave conversations" ON public.conversation_participants
FOR DELETE
TO authenticated
USING (
    (user_id = (select auth.uid())) 
    AND (select is_user_verified())
);

DROP POLICY IF EXISTS "Users read conversation participants" ON public.conversation_participants;
CREATE POLICY "Users read conversation participants" ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
    (select is_user_verified()) 
    AND (conversation_id IN (
        SELECT conversation_participants.conversation_id 
        FROM conversation_participants 
        WHERE (conversation_participants.user_id = (select auth.uid()))
    ))
);

-- Fix any remaining conversations policies
DROP POLICY IF EXISTS "Users create conversations" ON public.conversations;
CREATE POLICY "Users create conversations" ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
    (select is_user_verified())
);

DROP POLICY IF EXISTS "Users read all conversations" ON public.conversations;
CREATE POLICY "Users read all conversations" ON public.conversations
FOR SELECT
TO authenticated
USING (
    (select is_user_verified())
);

-- Fix any remaining course_reviews policies
DROP POLICY IF EXISTS "Users create course reviews" ON public.course_reviews;
CREATE POLICY "Users create course reviews" ON public.course_reviews
FOR INSERT
TO authenticated
WITH CHECK (
    (select is_user_verified())
);

DROP POLICY IF EXISTS "Users read all course reviews" ON public.course_reviews;
CREATE POLICY "Users read all course reviews" ON public.course_reviews
FOR SELECT
TO authenticated
USING (
    (select is_user_verified())
);

-- Fix any remaining courses policies
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;
CREATE POLICY "Authenticated users can manage courses" ON public.courses
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- Fix any remaining exams policies
DROP POLICY IF EXISTS "Authenticated users can manage exams" ON public.exams;
CREATE POLICY "Authenticated users can manage exams" ON public.exams
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- Fix any remaining invite_list policies
DROP POLICY IF EXISTS "Service role can manage invite list" ON public.invite_list;
CREATE POLICY "Service role can manage invite list" ON public.invite_list
FOR ALL
TO public
USING (
    ((select auth.role()) = 'service_role')
)
WITH CHECK (
    ((select auth.role()) = 'service_role')
);

DROP POLICY IF EXISTS "Authenticated users can read invite list" ON public.invite_list;
CREATE POLICY "Authenticated users can read invite list" ON public.invite_list
FOR SELECT
TO authenticated
USING (
    (select is_user_verified())
);

-- Fix any remaining messages policies
DROP POLICY IF EXISTS "Users read messages in their conversations" ON public.messages;
CREATE POLICY "Users read messages in their conversations" ON public.messages
FOR SELECT
TO authenticated
USING (
    (select is_user_verified()) 
    AND (conversation_id IN (
        SELECT conversation_participants.conversation_id 
        FROM conversation_participants 
        WHERE (conversation_participants.user_id = (select auth.uid()))
    ))
);

DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    (select is_user_verified()) 
    AND (conversation_id IN (
        SELECT conversation_participants.conversation_id 
        FROM conversation_participants 
        WHERE (conversation_participants.user_id = (select auth.uid()))
    ))
);

-- Fix any remaining outlines policies
DROP POLICY IF EXISTS "Allow authenticated users to insert outlines" ON public.outlines;
CREATE POLICY "Allow authenticated users to insert outlines" ON public.outlines
FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

DROP POLICY IF EXISTS "Allow authenticated users to update outlines" ON public.outlines;
CREATE POLICY "Allow authenticated users to update outlines" ON public.outlines
FOR UPDATE
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- Fix any remaining professor_courses policies
DROP POLICY IF EXISTS "Public can read professor_courses" ON public.professor_courses;
CREATE POLICY "Public can read professor_courses" ON public.professor_courses
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage professor_courses" ON public.professor_courses;
CREATE POLICY "Authenticated users can manage professor_courses" ON public.professor_courses
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- Fix any remaining professors policies
DROP POLICY IF EXISTS "Public can read professors" ON public.professors;
CREATE POLICY "Public can read professors" ON public.professors
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage professors" ON public.professors;
CREATE POLICY "Authenticated users can manage professors" ON public.professors
FOR ALL
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

-- Fix any remaining profiles policies
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE
TO authenticated
USING (
    (id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    (id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (
    (id = (select auth.uid()))
)
WITH CHECK (
    (id = (select auth.uid()))
);

-- Fix any remaining resource_ratings policies
DROP POLICY IF EXISTS "Users delete own resource ratings" ON public.resource_ratings;
CREATE POLICY "Users delete own resource ratings" ON public.resource_ratings
FOR DELETE
TO authenticated
USING (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
);

DROP POLICY IF EXISTS "Users manage own resource ratings" ON public.resource_ratings;
CREATE POLICY "Users manage own resource ratings" ON public.resource_ratings
FOR INSERT
TO authenticated
WITH CHECK (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
);

DROP POLICY IF EXISTS "Users read all resource ratings" ON public.resource_ratings;
CREATE POLICY "Users read all resource ratings" ON public.resource_ratings
FOR SELECT
TO authenticated
USING (
    (select is_user_verified())
);

DROP POLICY IF EXISTS "Users update own resource ratings" ON public.resource_ratings;
CREATE POLICY "Users update own resource ratings" ON public.resource_ratings
FOR UPDATE
TO authenticated
USING (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
)
WITH CHECK (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
);

-- Fix any remaining resources policies
DROP POLICY IF EXISTS "Users delete own resources" ON public.resources;
CREATE POLICY "Users delete own resources" ON public.resources
FOR DELETE
TO authenticated
USING (
    ((uploader_id = (select auth.uid())) AND (select is_user_verified()))
);

DROP POLICY IF EXISTS "Users read all resources" ON public.resources;
CREATE POLICY "Users read all resources" ON public.resources
FOR SELECT
TO authenticated
USING (
    (select is_user_verified())
);

DROP POLICY IF EXISTS "Users update own resources" ON public.resources;
CREATE POLICY "Users update own resources" ON public.resources
FOR UPDATE
TO authenticated
USING (
    ((uploader_id = (select auth.uid())) AND (select is_user_verified()))
)
WITH CHECK (
    ((uploader_id = (select auth.uid())) AND (select is_user_verified()))
);

DROP POLICY IF EXISTS "Users upload own resources" ON public.resources;
CREATE POLICY "Users upload own resources" ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (
    ((uploader_id = (select auth.uid())) AND (select is_user_verified()))
);

-- Fix any remaining review_engagement policies
DROP POLICY IF EXISTS "Users can manage their own engagement" ON public.review_engagement;
CREATE POLICY "Users can manage their own engagement" ON public.review_engagement
FOR ALL
TO public
USING (
    ((select auth.uid()) = user_id)
)
WITH CHECK (
    ((select auth.uid()) = user_id)
);

-- Fix any remaining reviews policies
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
FOR DELETE
TO public
USING (
    ((select auth.uid()) = user_id)
);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews" ON public.reviews
FOR INSERT
TO public
WITH CHECK (
    ((select auth.uid()) = user_id)
);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
FOR UPDATE
TO public
USING (
    ((select auth.uid()) = user_id)
)
WITH CHECK (
    ((select auth.uid()) = user_id)
);

-- Fix any remaining user_courses policies
DROP POLICY IF EXISTS "Users manage own courses" ON public.user_courses;
CREATE POLICY "Users manage own courses" ON public.user_courses
FOR ALL
TO authenticated
USING (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
)
WITH CHECK (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
);

-- Fix any remaining user_saved_resources policies
DROP POLICY IF EXISTS "Users manage own saved resources" ON public.user_saved_resources;
CREATE POLICY "Users manage own saved resources" ON public.user_saved_resources
FOR ALL
TO authenticated
USING (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
)
WITH CHECK (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
);

-- Fix any remaining view_logs policies
DROP POLICY IF EXISTS "Users see own view logs" ON public.view_logs;
CREATE POLICY "Users see own view logs" ON public.view_logs
FOR ALL
TO authenticated
USING (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
)
WITH CHECK (
    ((user_id = (select auth.uid())) AND (select is_user_verified()))
);

-- ==============================================
-- Step 3: Final verification
-- ==============================================

-- Check for any remaining unoptimized policies
SELECT 
    'REMAINING UNOPTIMIZED POLICIES' as status,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    (qual LIKE '%auth.%' AND qual NOT LIKE '%(select auth.%') OR 
    (with_check LIKE '%auth.%' AND with_check NOT LIKE '%(select auth.%')
);

-- Show summary of all policies
SELECT 
    schemaname,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%(select auth.%' OR with_check LIKE '%(select auth.%' THEN 1 END) as optimized_policies,
    COUNT(CASE WHEN qual LIKE '%auth.%' OR with_check LIKE '%auth.%' THEN 1 END) as total_auth_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
