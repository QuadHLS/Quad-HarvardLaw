-- FIX ALL RLS PERFORMANCE ISSUES
-- This script fixes "Auth RLS Initialization Plan" performance issues
-- by replacing auth.<function>() with (select auth.<function>()) in ALL RLS policies

-- ==============================================
-- Step 1: Fix calendar_events policies
-- ==============================================

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

-- ==============================================
-- Step 2: Fix conversation_participants policies
-- ==============================================

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

-- ==============================================
-- Step 3: Fix conversations policies
-- ==============================================

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

-- ==============================================
-- Step 4: Fix course_reviews policies
-- ==============================================

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

-- ==============================================
-- Step 5: Fix courses policies
-- ==============================================

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

-- ==============================================
-- Step 6: Fix exams policies
-- ==============================================

DROP POLICY IF EXISTS "Authenticated users can update exams" ON public.exams;
CREATE POLICY "Authenticated users can update exams" ON public.exams
FOR UPDATE
TO authenticated
USING (
    (select auth.role()) = 'authenticated'
)
WITH CHECK (
    (select auth.role()) = 'authenticated'
);

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

-- ==============================================
-- Step 7: Fix invite_list policies
-- ==============================================

DROP POLICY IF EXISTS "Service role only" ON public.invite_list;
CREATE POLICY "Service role only" ON public.invite_list
FOR ALL
TO public
USING (
    ((select auth.role()) = 'service_role')
)
WITH CHECK (
    ((select auth.role()) = 'service_role')
);

DROP POLICY IF EXISTS "Users read invite list" ON public.invite_list;
CREATE POLICY "Users read invite list" ON public.invite_list
FOR SELECT
TO authenticated
USING (
    (select is_user_verified())
);

-- ==============================================
-- Step 8: Fix messages policies
-- ==============================================

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

-- ==============================================
-- Step 9: Fix outlines policies
-- ==============================================

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

-- ==============================================
-- Step 10: Fix professor_courses policies
-- ==============================================

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

-- ==============================================
-- Step 11: Fix professors policies
-- ==============================================

DROP POLICY IF EXISTS "Authenticated users can manage professors" ON public.professors;
CREATE POLICY "Authenticated users can manage professors" ON public.professors
FOR ALL
TO public
USING (
    (select auth.role()) = 'authenticated'
);

-- ==============================================
-- Step 12: Fix profiles policies
-- ==============================================

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

-- ==============================================
-- Step 13: Fix resource_ratings policies
-- ==============================================

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

-- ==============================================
-- Step 14: Fix resources policies
-- ==============================================

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

-- ==============================================
-- Step 15: Fix review_engagement policies
-- ==============================================

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

-- ==============================================
-- Step 16: Fix reviews policies
-- ==============================================

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

-- ==============================================
-- Step 17: Fix user_courses policies
-- ==============================================

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

-- ==============================================
-- Step 18: Fix user_saved_resources policies
-- ==============================================

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

-- ==============================================
-- Step 19: Fix view_logs policies
-- ==============================================

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
-- Step 20: Verification
-- ==============================================

-- Check that all policies now use optimized auth function calls
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(select auth.%' OR with_check LIKE '%(select auth.%' THEN 'OPTIMIZED'
        WHEN qual LIKE '%auth.%' OR with_check LIKE '%auth.%' THEN 'NEEDS OPTIMIZATION'
        ELSE 'NO AUTH CALLS'
    END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
