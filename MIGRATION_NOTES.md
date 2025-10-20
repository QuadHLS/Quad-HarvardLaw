# Migration Notes - Course Enrollments Sync

## What Was Done

### 1. Removed `feedcourses` Table Dependency
- Updated all code to use `Courses` table directly via UUIDs
- Removed `cleanCourseName` logic (no more stripping "1", "2", "3" from course names)
- Each course section now has its own distinct feed based on UUID from `Courses` table

### 2. Course Data Flow
- **Onboarding**: User selects courses → `profiles.classes` stores course data with `course_id` UUID
- **Posts**: `posts.course_id` now references `Courses.id` directly (not `feedcourses`)
- **Feeds**: CoursePage and HomePage feeds filter by course UUID

### 3. Course Enrollments Table
- **Purpose**: Efficiently query "all students in a course" without scanning every user's JSONB
- **How it works**: Automatic triggers keep `course_enrollments` in sync with `profiles.classes`
- **Triggers**:
  - INSERT: When new user completes onboarding
  - UPDATE: When user changes their courses
- **Function**: `sync_course_enrollments(user_id)` extracts course UUIDs from `profiles.classes` JSONB

### 4. Database Changes Applied
1. `migration_fix_course_references.sql` - Fixed foreign keys and RLS policies after feedcourses removal
2. `20250120000001_course_enrollments_sync.sql` - Set up automatic course_enrollments syncing

## Files Kept
- `migration_fix_course_references.sql` - Foreign key and RLS fixes
- `fix_trigger_final.sql` - Final trigger configuration (applied to DB)
- `supabase/migrations/20250120000001_course_enrollments_sync.sql` - Clean migration for future reference

## Testing Done
- ✅ CoursePage feed works with UUID-based course logic
- ✅ HomePage "My Courses" feed works with UUID-based course logic
- ✅ Likes, comments, polls all work correctly
- ✅ Course enrollments sync automatically on onboarding
- ✅ Triggers handle INSERT and UPDATE on profiles table

