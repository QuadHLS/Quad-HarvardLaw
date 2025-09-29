-- CHECK OUTLINES AND EXAMS SEPARATION
-- This script verifies that outlines and exams are properly separated in the database

-- ==============================================
-- Check Table Structures
-- ==============================================

-- Check outlines table structure
SELECT 'OUTLINES TABLE STRUCTURE' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'outlines'
ORDER BY ordinal_position;

-- Check exams table structure  
SELECT 'EXAMS TABLE STRUCTURE' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'exams'
ORDER BY ordinal_position;

-- ==============================================
-- Check Data Separation
-- ==============================================

-- Count records in each table
SELECT 'RECORD COUNTS' as check_type;
SELECT 
    'outlines' as table_name,
    COUNT(*) as record_count
FROM public.outlines
UNION ALL
SELECT 
    'exams' as table_name,
    COUNT(*) as record_count
FROM public.exams;

-- Check sample data from outlines
SELECT 'SAMPLE OUTLINES DATA' as check_type;
SELECT 
    id,
    title,
    course,
    instructor,
    year,
    file_type,
    created_at
FROM public.outlines
ORDER BY created_at DESC
LIMIT 5;

-- Check sample data from exams
SELECT 'SAMPLE EXAMS DATA' as check_type;
SELECT 
    id,
    title,
    course,
    instructor,
    year,
    file_type,
    created_at
FROM public.exams
ORDER BY created_at DESC
LIMIT 5;

-- ==============================================
-- Check RLS Policies
-- ==============================================

-- Check RLS status
SELECT 'RLS STATUS' as check_type;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('outlines', 'exams')
ORDER BY tablename;

-- Check policies for each table
SELECT 'OUTLINES POLICIES' as check_type;
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'outlines'
ORDER BY policyname;

SELECT 'EXAMS POLICIES' as check_type;
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'exams'
ORDER BY policyname;

-- ==============================================
-- Check Data Integrity
-- ==============================================

-- Check for any data overlap (should be none)
SELECT 'DATA OVERLAP CHECK' as check_type;
SELECT 
    'outlines_in_exams' as overlap_type,
    COUNT(*) as overlap_count
FROM public.outlines o
INNER JOIN public.exams e ON o.id = e.id
UNION ALL
SELECT 
    'exams_in_outlines' as overlap_type,
    COUNT(*) as overlap_count
FROM public.exams e
INNER JOIN public.outlines o ON e.id = o.id;

-- Check unique constraints
SELECT 'UNIQUE CONSTRAINTS' as check_type;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('outlines', 'exams')
AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;

-- Final summary
SELECT 'SEPARATION CHECK COMPLETE' as status;
