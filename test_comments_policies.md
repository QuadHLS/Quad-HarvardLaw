# Testing Comments RLS Policy Changes

## After running the SQL, test these scenarios:

### ✅ **1. View Comments (SELECT)**
- **Test**: Open a post with comments (in Feed or Course page)
- **Expected**: Comments should load and display normally
- **If broken**: You'll see an error or no comments appear

### ✅ **2. Create Comment (INSERT)**
- **Test**: Add a new comment to any post
- **Expected**: Comment appears immediately after submitting
- **If broken**: Error message or comment doesn't save

### ✅ **3. Create Reply (INSERT)**
- **Test**: Reply to an existing comment
- **Expected**: Reply appears nested under the parent comment
- **If broken**: Error message or reply doesn't save

### ✅ **4. Edit Comment (UPDATE)**
- **Test**: Edit your own comment
- **Expected**: Comment updates with "edited" indicator
- **If broken**: Error message or edit doesn't save

### ✅ **5. Delete Comment (DELETE)**
- **Test**: Delete your own comment
- **Expected**: Comment disappears from view
- **If broken**: Error message or comment doesn't delete

### ✅ **6. Cannot Edit Others' Comments**
- **Test**: Try to edit someone else's comment (if possible in UI)
- **Expected**: Should be blocked or not show edit option
- **If broken**: You'd be able to edit others' comments (security issue)

### ✅ **7. Cannot Delete Others' Comments**
- **Test**: Try to delete someone else's comment
- **Expected**: Should be blocked or not show delete option
- **If broken**: You'd be able to delete others' comments (security issue)

### ✅ **8. Like/Comment Interaction**
- **Test**: Like/unlike comments
- **Expected**: Like counts update correctly
- **If broken**: Likes don't work or counts don't update

---

## Quick Test Script (Run in Supabase SQL Editor)

```sql
-- Test 1: Verify policies are correctly set
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'comments';

-- Should show all policies with roles = {authenticated}

-- Test 2: Verify you can read comments (while logged in)
-- Run this while authenticated in your app
SELECT COUNT(*) FROM comments;

-- Should return a number (not error)

-- Test 3: Try to insert as anonymous (should fail)
-- Don't run this - just know it would fail if someone tried
```

---

## What to Check in Browser Console

1. **Open Browser DevTools Console (F12)**
2. **After running SQL, refresh the page**
3. **Look for any red errors** related to comments
4. **Common errors if broken:**
   - "new row violates row-level security policy"
   - "permission denied for table comments"
   - Any Supabase client errors

---

## Quick Verification Commands

Run these in Supabase SQL Editor to verify the policies are correctly applied:

```sql
-- Check all policies are authenticated
SELECT 
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE tablename = 'comments'
ORDER BY cmd;

-- All should show: roles = {authenticated}
```

---

## If Something Breaks

### Rollback SQL (Run this to revert):
```sql
-- Drop new policies
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Recreate original policies (public role, not optimized)
CREATE POLICY "Users can view all comments" ON comments
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create comments" ON comments
FOR INSERT
TO public
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON comments
FOR UPDATE
TO public
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
FOR DELETE
TO public
USING (auth.uid() = author_id);
```

