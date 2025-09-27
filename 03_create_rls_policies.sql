-- Enable Row Level Security on all tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_courses ENABLE ROW LEVEL SECURITY;

-- Reviews table policies
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

-- Professor/Course table policies - Allow public read access
CREATE POLICY "Anyone can read professors" ON professors FOR SELECT USING (true);
CREATE POLICY "Anyone can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Anyone can read professor_courses" ON professor_courses FOR SELECT USING (true);

-- Only allow authenticated users to manage professor/course data (for admin purposes)
CREATE POLICY "Authenticated users can manage professors" ON professors 
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage courses" ON courses 
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage professor_courses" ON professor_courses 
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a table to track user engagement to prevent duplicate votes
CREATE TABLE review_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
    engagement_type TEXT NOT NULL CHECK (engagement_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, review_id)
);

-- Enable RLS on review_engagement table
ALTER TABLE review_engagement ENABLE ROW LEVEL SECURITY;

-- Policy for review_engagement: Users can only see their own engagement
CREATE POLICY "Users can manage their own engagement" ON review_engagement
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create a function to safely vote on reviews with duplicate prevention
CREATE OR REPLACE FUNCTION vote_on_review(
    review_id UUID,
    engagement_type TEXT -- 'helpful' or 'not_helpful'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    existing_engagement RECORD;
BEGIN
    -- Check if user has already voted on this review
    SELECT * INTO existing_engagement 
    FROM review_engagement 
    WHERE user_id = auth.uid() AND review_id = vote_on_review.review_id;
    
    IF existing_engagement IS NOT NULL THEN
        -- User has already voted, return error
        RETURN json_build_object(
            'success', false,
            'message', 'You have already voted on this review'
        );
    END IF;
    
    -- Insert the engagement record
    INSERT INTO review_engagement (user_id, review_id, engagement_type)
    VALUES (auth.uid(), review_id, engagement_type);
    
    -- Update the review count
    IF engagement_type = 'helpful' THEN
        UPDATE reviews 
        SET helpful_count = helpful_count + 1,
            updated_at = NOW()
        WHERE id = review_id;
    ELSIF engagement_type = 'not_helpful' THEN
        UPDATE reviews 
        SET not_helpful_count = not_helpful_count + 1,
            updated_at = NOW()
        WHERE id = review_id;
    END IF;
    
    -- Return success with updated counts
    SELECT json_build_object(
        'success', true,
        'message', 'Vote recorded successfully',
        'helpful_count', helpful_count,
        'not_helpful_count', not_helpful_count
    ) INTO result
    FROM reviews
    WHERE id = review_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the voting function
GRANT EXECUTE ON FUNCTION vote_on_review(UUID, TEXT) TO authenticated;

-- Create indexes for performance
CREATE INDEX idx_review_engagement_user_review ON review_engagement(user_id, review_id);
CREATE INDEX idx_review_engagement_review_id ON review_engagement(review_id);

