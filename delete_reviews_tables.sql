-- Delete all review-related tables and views
-- Run this to clean up before creating new ones

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS recent_reviews CASCADE;
DROP VIEW IF EXISTS professor_stats CASCADE;
DROP VIEW IF EXISTS professor_summary CASCADE;
DROP VIEW IF EXISTS professor_course_list CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS review_engagement CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS professor_courses CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS professors CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS vote_on_review(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_reviews_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Note: This will delete ALL review data permanently
-- Make sure you want to do this before running!

