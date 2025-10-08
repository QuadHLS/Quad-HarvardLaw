-- Remove the unused review_engagement table and related voting functions
-- Since voting functionality was completely removed from the frontend

-- Step 1: Drop RPC functions that use review_engagement
DROP FUNCTION IF EXISTS get_user_votes(uuid[]) CASCADE;
DROP FUNCTION IF EXISTS vote_on_review(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS vote_on_review(text, text) CASCADE;
DROP FUNCTION IF EXISTS vote_on_review(uuid, engagement_type) CASCADE;

-- Try to drop any other variations
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

-- Step 2: Drop the review_engagement table (this will cascade delete any related policies)
DROP TABLE IF EXISTS review_engagement CASCADE;

-- Step 3: Drop the engagement_type enum if it exists
DROP TYPE IF EXISTS engagement_type CASCADE;

-- Verify removal
SELECT 'VERIFICATION - review_engagement table removed:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'review_engagement'
) as table_still_exists;

SELECT 'VERIFICATION - voting functions removed:' as info;
SELECT COUNT(*) as remaining_voting_functions
FROM pg_proc
WHERE proname IN ('vote_on_review', 'get_user_votes');

SELECT 'Review engagement system completely removed!' as result;

