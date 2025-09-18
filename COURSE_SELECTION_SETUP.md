# Course Selection Setup Guide

This guide explains how to set up and test the new course selection feature that
fetches 2L/3L courses from Supabase while keeping 1L courses hardcoded.

## Implementation Overview

1. **1L Students**: Continue to use hardcoded courses with pre-populated
   required courses
2. **2L/3L Students**: Fetch courses dynamically from the Supabase `courses`
   table

## Setup Instructions

### 1. Run the Database Migration

First, apply the migration to create the necessary tables:

```bash
npx supabase db push
```

This will create:

- `professors` table
- `courses` table
- `course_professors` junction table
- Sample data for testing

### 2. Deploy the Edge Function

Deploy the get-courses function:

```bash
npx supabase functions deploy get-courses
```

### 3. Environment Variables

Ensure your `.env.local` file has:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Testing Instructions

### Test 1L Selection

1. Go to the onboarding page
2. Select "1L" as the class year
3. Verify that 8 required courses are pre-populated
4. Verify that the 9th slot is available for electives
5. Confirm professors can be selected for each course

### Test 2L/3L Selection

1. Go to the onboarding page
2. Select "2L" or "3L" as the class year
3. Verify that courses are fetched from the API (check network tab)
4. Select courses from the dropdown - all courses should be available
5. Verify that professors are loaded for each selected course
6. Test selecting the same course multiple times (should be allowed)

### API Endpoint

The courses are fetched from:

```
GET /functions/v1/get-courses?year_level={year_level}
```

Response format:

```json
{
  "courses": [
    {
      "id": "uuid",
      "name": "Course Name",
      "code": "LAW101",
      "year_level": "1L|2L|3L|ALL",
      "is_required": true/false,
      "is_elective": true/false,
      "professors": [
        {
          "id": "uuid",
          "name": "Professor Name"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Courses not loading for 2L/3L

1. Check browser console for errors
2. Verify the edge function is deployed: `npx supabase functions list`
3. Check network tab to see if API call is made
4. Verify authentication - user must be logged in

### Migration issues

1. Check migration status: `npx supabase db migrations list`
2. Reset database if needed: `npx supabase db reset`

### Fallback behavior

If the API fails, the system falls back to the hardcoded course list to ensure
the feature remains functional.

## Future Enhancements

1. Add loading indicators while fetching courses
2. Implement course search/filtering
3. Add course descriptions and credits
4. Allow admins to manage courses through an interface
5. Track popular course combinations
