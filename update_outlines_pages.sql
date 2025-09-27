-- Update all pages column values in outlines table to 1
-- This will set every row's pages field to 1

UPDATE outlines 
SET pages = 1;

-- Verify the update
SELECT COUNT(*) as total_rows, 
       COUNT(CASE WHEN pages = 1 THEN 1 END) as rows_with_pages_1,
       COUNT(CASE WHEN pages != 1 THEN 1 END) as rows_with_other_pages
FROM outlines;

-- Show a sample of the updated data
SELECT id, title, pages, created_at 
FROM outlines 
ORDER BY created_at DESC 
LIMIT 10;


