-- FINAL REVIEWS SYSTEM SETUP
-- This script ensures everything is properly configured for the reviews system
-- Run this to make sure your database is completely set up correctly

-- 1. Update semester constraint to include Winter
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_semester_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_semester_check 
    CHECK (semester IN ('Fall', 'Winter', 'Spring', 'Summer'));

-- 2. Drop and recreate the voting function with full functionality
DROP FUNCTION IF EXISTS vote_on_review(UUID, TEXT);

CREATE FUNCTION vote_on_review(
    p_review_id UUID,
    p_engagement_type TEXT -- 'helpful', 'not_helpful', or 'unvote'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    existing_engagement RECORD;
    current_helpful_count INTEGER;
    current_not_helpful_count INTEGER;
BEGIN
    -- Check if user has already voted on this review
    SELECT * INTO existing_engagement 
    FROM review_engagement 
    WHERE user_id = auth.uid() AND review_id = p_review_id;
    
    -- Get current counts
    SELECT helpful_count, not_helpful_count 
    INTO current_helpful_count, current_not_helpful_count
    FROM reviews 
    WHERE id = p_review_id;
    
    -- Handle unvote request
    IF p_engagement_type = 'unvote' THEN
        IF existing_engagement IS NULL THEN
            RETURN json_build_object(
                'success', false,
                'message', 'You have not voted on this review yet'
            );
        END IF;
        
        DELETE FROM review_engagement 
        WHERE user_id = auth.uid() AND review_id = p_review_id;
        
        IF existing_engagement.engagement_type = 'helpful' THEN
            UPDATE reviews 
            SET helpful_count = GREATEST(helpful_count - 1, 0),
                updated_at = NOW()
            WHERE id = p_review_id;
            current_helpful_count := GREATEST(current_helpful_count - 1, 0);
        ELSIF existing_engagement.engagement_type = 'not_helpful' THEN
            UPDATE reviews 
            SET not_helpful_count = GREATEST(not_helpful_count - 1, 0),
                updated_at = NOW()
            WHERE id = p_review_id;
            current_not_helpful_count := GREATEST(current_not_helpful_count - 1, 0);
        END IF;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Vote removed successfully',
            'helpful_count', current_helpful_count,
            'not_helpful_count', current_not_helpful_count,
            'user_vote', null
        );
    END IF;
    
    -- Handle vote changing or new vote
    IF existing_engagement IS NOT NULL THEN
        IF existing_engagement.engagement_type = p_engagement_type THEN
            -- User is clicking the same button, treat as unvote
            DELETE FROM review_engagement 
            WHERE user_id = auth.uid() AND review_id = p_review_id;
            
            IF p_engagement_type = 'helpful' THEN
                UPDATE reviews 
                SET helpful_count = GREATEST(helpful_count - 1, 0),
                    updated_at = NOW()
                WHERE id = p_review_id;
                current_helpful_count := GREATEST(current_helpful_count - 1, 0);
            ELSIF p_engagement_type = 'not_helpful' THEN
                UPDATE reviews 
                SET not_helpful_count = GREATEST(not_helpful_count - 1, 0),
                    updated_at = NOW()
                WHERE id = p_review_id;
                current_not_helpful_count := GREATEST(current_not_helpful_count - 1, 0);
            END IF;
            
            RETURN json_build_object(
                'success', true,
                'message', 'Vote removed successfully',
                'helpful_count', current_helpful_count,
                'not_helpful_count', current_not_helpful_count,
                'user_vote', null
            );
        ELSE
            -- User is changing their vote
            IF existing_engagement.engagement_type = 'helpful' THEN
                UPDATE reviews 
                SET helpful_count = GREATEST(helpful_count - 1, 0),
                    updated_at = NOW()
                WHERE id = p_review_id;
                current_helpful_count := GREATEST(current_helpful_count - 1, 0);
            ELSIF existing_engagement.engagement_type = 'not_helpful' THEN
                UPDATE reviews 
                SET not_helpful_count = GREATEST(not_helpful_count - 1, 0),
                    updated_at = NOW()
                WHERE id = p_review_id;
                current_not_helpful_count := GREATEST(current_not_helpful_count - 1, 0);
            END IF;
            
            UPDATE review_engagement 
            SET engagement_type = p_engagement_type
            WHERE user_id = auth.uid() AND review_id = p_review_id;
        END IF;
    ELSE
        -- User is voting for the first time
        INSERT INTO review_engagement (user_id, review_id, engagement_type)
        VALUES (auth.uid(), p_review_id, p_engagement_type);
    END IF;
    
    -- Increase the new vote count
    IF p_engagement_type = 'helpful' THEN
        UPDATE reviews 
        SET helpful_count = helpful_count + 1,
            updated_at = NOW()
        WHERE id = p_review_id;
        current_helpful_count := current_helpful_count + 1;
    ELSIF p_engagement_type = 'not_helpful' THEN
        UPDATE reviews 
        SET not_helpful_count = not_helpful_count + 1,
            updated_at = NOW()
        WHERE id = p_review_id;
        current_not_helpful_count := current_not_helpful_count + 1;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Vote recorded successfully',
        'helpful_count', current_helpful_count,
        'not_helpful_count', current_not_helpful_count,
        'user_vote', p_engagement_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create or replace the get_user_votes function
CREATE OR REPLACE FUNCTION get_user_votes(p_review_ids UUID[])
RETURNS TABLE(review_id UUID, engagement_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT re.review_id, re.engagement_type
    FROM review_engagement re
    WHERE re.user_id = auth.uid() 
    AND re.review_id = ANY(p_review_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant all necessary permissions
GRANT EXECUTE ON FUNCTION vote_on_review(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_votes(UUID[]) TO authenticated;

-- 5. Ensure all tables have proper RLS policies
-- Reviews table policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

CREATE POLICY "Anyone can read reviews" ON reviews
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- Review engagement policies
DROP POLICY IF EXISTS "Users can manage their own engagement" ON review_engagement;
CREATE POLICY "Users can manage their own engagement" ON review_engagement
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Ensure all indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_reviews_professor_name ON reviews(professor_name);
CREATE INDEX IF NOT EXISTS idx_reviews_course_name ON reviews(course_name);
CREATE INDEX IF NOT EXISTS idx_reviews_semester_year ON reviews(semester, year);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_professor_course ON reviews(professor_name, course_name);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_engagement_user_review ON review_engagement(user_id, review_id);
CREATE INDEX IF NOT EXISTS idx_review_engagement_review_id ON review_engagement(review_id);

-- 7. Verify cascade delete is properly set up
-- This should already be set, but let's make sure
DO $$
BEGIN
    -- Check if the foreign key constraint exists with CASCADE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'review_engagement' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'review_id'
        AND tc.constraint_name LIKE '%CASCADE%'
    ) THEN
        -- If not, we need to recreate it
        ALTER TABLE review_engagement DROP CONSTRAINT IF EXISTS review_engagement_review_id_fkey;
        ALTER TABLE review_engagement ADD CONSTRAINT review_engagement_review_id_fkey 
            FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. Create a verification query to test the setup
-- This will show you the current state of your reviews system
SELECT 
    'Reviews Table' as component,
    COUNT(*) as count,
    'Active' as status
FROM reviews
UNION ALL
SELECT 
    'Review Engagement Table' as component,
    COUNT(*) as count,
    'Active' as status
FROM review_engagement
UNION ALL
SELECT 
    'Professors Table' as component,
    COUNT(*) as count,
    'Active' as status
FROM professors
UNION ALL
SELECT 
    'Courses Table' as component,
    COUNT(*) as count,
    'Active' as status
FROM courses
UNION ALL
SELECT 
    'Professor-Course Relationships' as component,
    COUNT(*) as count,
    'Active' as status
FROM professor_courses;
