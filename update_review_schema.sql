-- Script to update review-related tables to match the new simplified structure
-- Run this in your Supabase SQL editor

-- First, let's drop the existing tables and recreate them with the new structure
-- This ensures we have a clean slate

-- Drop existing tables in dependency order
DROP TABLE IF EXISTS review_engagement CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS professor_courses CASCADE;
DROP TABLE IF EXISTS professor_stats CASCADE;
DROP TABLE IF EXISTS professor_summary CASCADE;
DROP TABLE IF EXISTS professor_course_list CASCADE;
DROP TABLE IF EXISTS recent_reviews CASCADE;

-- Drop any related functions (try different parameter types)
DROP FUNCTION IF EXISTS vote_on_review(text, text) CASCADE;
DROP FUNCTION IF EXISTS vote_on_review(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS vote_on_review(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_votes(text[]) CASCADE;
DROP FUNCTION IF EXISTS get_user_votes(uuid[]) CASCADE;

-- Also try to drop any functions with the same name but different signatures
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes 
              FROM pg_proc 
              WHERE proname IN ('vote_on_review', 'get_user_votes')) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.proname || '(' || r.argtypes || ') CASCADE';
    END LOOP;
END $$;

-- Create the new simplified reviews table
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    professor_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    semester TEXT NOT NULL,
    year TEXT NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    cold_calls TEXT NOT NULL CHECK (cold_calls IN ('Yes', 'No', 'Panel')),
    final_type TEXT NOT NULL CHECK (final_type IN ('Take Home', 'In-Person', 'Paper', 'None')),
    electronics_allowed BOOLEAN NOT NULL DEFAULT false,
    overall_review TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review_engagement table for voting
CREATE TABLE review_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    engagement_type TEXT NOT NULL CHECK (engagement_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, review_id)
);

-- Create professor_courses junction table
CREATE TABLE professor_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professor_id, course_id)
);

-- Create professor_course_list view
CREATE VIEW professor_course_list AS
SELECT 
    pc.professor_id,
    p.name as professor_name,
    pc.course_id,
    c.name as course_name,
    pc.created_at as assignment_date
FROM professor_courses pc
JOIN professors p ON pc.professor_id = p.id
JOIN courses c ON pc.course_id = c.id;

-- Create recent_reviews view
CREATE VIEW recent_reviews AS
SELECT 
    r.id,
    r.user_id,
    r.professor_name,
    r.course_name,
    r.semester,
    r.year,
    r.overall_rating,
    r.cold_calls,
    r.final_type,
    r.electronics_allowed,
    r.overall_review,
    r.created_at,
    r.updated_at
FROM reviews r
ORDER BY r.created_at DESC;

-- Create professor_stats view
CREATE VIEW professor_stats AS
SELECT 
    r.professor_name,
    r.course_name,
    COUNT(*) as total_reviews,
    ROUND(AVG(r.overall_rating), 2) as avg_overall_rating,
    COUNT(CASE WHEN r.cold_calls = 'Yes' THEN 1 END) as cold_calls_yes_count,
    COUNT(CASE WHEN r.cold_calls = 'No' THEN 1 END) as cold_calls_no_count,
    COUNT(CASE WHEN r.cold_calls = 'Panel' THEN 1 END) as cold_calls_panel_count,
    COUNT(CASE WHEN r.final_type = 'Take Home' THEN 1 END) as take_home_count,
    COUNT(CASE WHEN r.final_type = 'In-Person' THEN 1 END) as in_person_count,
    COUNT(CASE WHEN r.final_type = 'Paper' THEN 1 END) as paper_count,
    COUNT(CASE WHEN r.final_type = 'None' THEN 1 END) as none_count,
    COUNT(CASE WHEN r.electronics_allowed = true THEN 1 END) as electronics_allowed_count,
    COUNT(CASE WHEN r.electronics_allowed = false THEN 1 END) as electronics_prohibited_count
FROM reviews r
GROUP BY r.professor_name, r.course_name;

-- Create professor_summary view
CREATE VIEW professor_summary AS
SELECT 
    r.professor_name,
    COUNT(DISTINCT r.course_name) as total_courses,
    COUNT(*) as total_reviews,
    ROUND(AVG(r.overall_rating), 2) as avg_overall_rating,
    COUNT(CASE WHEN r.cold_calls = 'Yes' THEN 1 END) as cold_calls_yes_count,
    COUNT(CASE WHEN r.cold_calls = 'No' THEN 1 END) as cold_calls_no_count,
    COUNT(CASE WHEN r.cold_calls = 'Panel' THEN 1 END) as cold_calls_panel_count,
    COUNT(CASE WHEN r.final_type = 'Take Home' THEN 1 END) as take_home_count,
    COUNT(CASE WHEN r.final_type = 'In-Person' THEN 1 END) as in_person_count,
    COUNT(CASE WHEN r.final_type = 'Paper' THEN 1 END) as paper_count,
    COUNT(CASE WHEN r.final_type = 'None' THEN 1 END) as none_count,
    COUNT(CASE WHEN r.electronics_allowed = true THEN 1 END) as electronics_allowed_count,
    COUNT(CASE WHEN r.electronics_allowed = false THEN 1 END) as electronics_prohibited_count
FROM reviews r
GROUP BY r.professor_name;

-- Create RPC functions for voting
CREATE OR REPLACE FUNCTION get_user_votes(p_review_ids uuid[])
RETURNS TABLE (review_id uuid, engagement_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.review_id,
    re.engagement_type
  FROM
    public.review_engagement re
  WHERE
    re.user_id = auth.uid() AND re.review_id = ANY(p_review_ids);
END;
$$;

CREATE OR REPLACE FUNCTION vote_on_review(p_review_id uuid, p_engagement_type text)
RETURNS TABLE (helpful_count integer, not_helpful_count integer, user_vote text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  existing_engagement_type text;
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to vote on reviews.';
  END IF;

  -- Get existing engagement for this user and review
  SELECT engagement_type INTO existing_engagement_type
  FROM public.review_engagement
  WHERE user_id = current_user_id AND review_id = p_review_id;

  IF existing_engagement_type IS NOT NULL THEN
    -- User has already engaged with this review
    IF existing_engagement_type = p_engagement_type THEN
      -- User clicked the same button again, so unvote
      DELETE FROM public.review_engagement
      WHERE user_id = current_user_id AND review_id = p_review_id;
      user_vote := NULL;
    ELSE
      -- User changed their vote
      UPDATE public.review_engagement
      SET engagement_type = p_engagement_type, created_at = NOW()
      WHERE user_id = current_user_id AND review_id = p_review_id;
      user_vote := p_engagement_type;
    END IF;
  ELSE
    -- No existing engagement, insert new vote
    INSERT INTO public.review_engagement (user_id, review_id, engagement_type)
    VALUES (current_user_id, p_review_id, p_engagement_type);
    user_vote := p_engagement_type;
  END IF;

  -- Recalculate helpful and not_helpful counts
  SELECT
    COUNT(CASE WHEN engagement_type = 'helpful' THEN 1 END),
    COUNT(CASE WHEN engagement_type = 'not_helpful' THEN 1 END)
  INTO
    helpful_count,
    not_helpful_count
  FROM
    public.review_engagement
  WHERE
    review_id = p_review_id;

  RETURN NEXT;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS) policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_courses ENABLE ROW LEVEL SECURITY;

-- Policies for reviews table
CREATE POLICY "Users can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for review_engagement table
CREATE POLICY "Users can view review engagement" ON review_engagement
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own review engagement" ON review_engagement
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review engagement" ON review_engagement
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review engagement" ON review_engagement
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for professor_courses table
CREATE POLICY "Users can view professor courses" ON professor_courses
    FOR SELECT USING (true);

-- Note: Professor-course relationships are created in a separate script
-- Run 'fix_professor_courses.sql' after this script to populate the relationships

-- Note: Sample reviews are not inserted here because they require an authenticated user
-- You can add sample reviews through the UI once the schema is set up

-- Grant necessary permissions
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON review_engagement TO authenticated;
GRANT ALL ON professor_courses TO authenticated;
GRANT SELECT ON professor_stats TO authenticated;
GRANT SELECT ON professor_summary TO authenticated;
GRANT SELECT ON professor_course_list TO authenticated;
GRANT SELECT ON recent_reviews TO authenticated;
