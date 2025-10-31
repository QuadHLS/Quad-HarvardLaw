# Page Count Protection Documentation

This document outlines the protections in place to ensure page count values remain accurate and are not accidentally modified.

## Current Protection Status

### ✅ Safe Operations

1. **New Uploads**: Insert with `pages: NULL` (calculated separately)
   - Location: `src/components/OutlinePage.tsx` (line 504)
   - Location: `src/components/ExamPage.tsx` (line 518)
   - **Constraint**: Pages column requires `pages > 0`, so we use `NULL` instead of `0`
   - Only affects new uploads, never updates existing outlines

2. **Python Script**: Only processes outlines with `pages = 1`
   - Location: `update_outline_page_counts.py` (line 306)
   - Filter: `.eq('pages', 1)` - prevents accidental modification of other outlines

### ⚠️ Potential Risk

**RLS Policy**: Currently allows any authenticated user to UPDATE any outline
- Policy: "Allow authenticated users to update outlines"
- Risk: No frontend code does this, but the policy is permissive
- Mitigation: See Step 1 below

## Protection Steps

### Step 1: Restrict RLS UPDATE Policy

**Purpose**: Prevent users from updating existing outlines (including page counts)

**Note**: This step is optional for defense-in-depth security. If you want to restrict UPDATE operations:

```sql
-- Drop the existing permissive UPDATE policy
DROP POLICY IF EXISTS "Allow authenticated users to update outlines" ON public.outlines;
```

**Implementation Notes**:
- Currently, there's no frontend feature that updates existing outlines
- Removing the UPDATE policy would prevent accidental modifications
- The Python script uses service role key, so it won't be affected
- **Current status**: UPDATE policy remains permissive (no restrictions)

### Step 2: Add Warning Comment to Script

**Purpose**: Prevent accidental modification of the filter that could affect all outlines

**Script Modification** (`update_outline_page_counts.py` line ~298):

```python
# ============================================================================
# ⚠️  CRITICAL WARNING ⚠️
# ============================================================================
# This script is configured to ONLY process outlines with pages = 1
# DO NOT modify the filter below without explicit approval
# Modifying '.eq('pages', 1)' to '.neq('pages', 1)' or removing the filter
# could accidentally modify ALL outlines, potentially overwriting accurate
# page counts that were already calculated.
# ============================================================================
# Fetch outlines with pages = 1 (to verify with Tier 2 conversion)
print("Fetching outlines with pages = 1 (to verify with Tier 2 DOCX→PDF conversion)...")
```

## Related Files

### SQL Scripts
- All SQL scripts have been executed or are no longer needed
- Current constraint: `CHECK ((pages > 0))` - NULL is allowed because column is nullable

### Python Script
- `update_outline_page_counts.py` - Main script for calculating page counts
- Uses service role key (bypasses RLS)
- Current filter: Only processes `pages = 1`

### Documentation
- `PAGE_COUNT_EXTRACTION_METHODS.md` - Complete documentation: Tier 1 & Tier 2 extraction methods, setup, troubleshooting, and code

## Verification Commands

Check current RLS policies:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'outlines' AND cmd = 'UPDATE';
```

Check page count distribution:
```sql
SELECT 
  COUNT(*) FILTER (WHERE pages = 1) as one_page,
  COUNT(*) FILTER (WHERE pages > 1) as multi_page,
  COUNT(*) FILTER (WHERE pages IS NULL) as null_pages,
  COUNT(*) as total
FROM public.outlines;
```

## Implementation Status

- [ ] Step 1: RLS Policy Restriction (SQL script ready, needs execution)
- [ ] Step 2: Warning Comment in Script (ready to add)
- [x] Code Review: Confirmed no frontend UPDATE operations
- [x] Database Review: No triggers/functions modify pages column

