# 100% Automatic Club Account Setup

## The Best Solution: Auth Hook (Pure SQL)

**This is 100% automatic - no Edge Functions, no webhooks, just SQL!**

### Step 1: Run the SQL Migration

Run this SQL file in your Supabase SQL Editor:
- `migrations/auto_setup_club_accounts_auth_hook.sql`

This creates a function that automatically sets `app_metadata` BEFORE users are created.

### Step 2: Configure the Hook in Dashboard (One-Time)

1. Go to: **Authentication → Hooks** in Supabase Dashboard
2. Find **"Before User Created"** hook section
3. Click **"Add Hook"** or **"Configure"**
4. Select **"Postgres Function"** as the type
5. Set the URI to: `pg-functions://postgres/public/before_user_created_hook`
6. Click **"Save"**

### That's It!

Now **every time** you create a user with an email ending in `@club.quad.com`:
- The hook runs BEFORE the user is created
- Automatically sets `app_metadata: {"user_type": "club_account"}`
- User is created with the correct metadata
- **100% automatic - zero manual steps!**

## Test It

1. Create a test user: `test@club.quad.com`
2. Check the user's `app_metadata` in Dashboard
3. It should automatically be: `{"user_type": "club_account"}`

## How It Works

1. You create user with `@club.quad.com` email
2. Supabase Auth calls the hook BEFORE creating the user
3. Hook modifies `app_metadata` to include `user_type: 'club_account'`
4. User is created with the modified metadata
5. Done! No delays, no manual steps, no Edge Functions needed.

This is the **simplest and most reliable** solution - pure SQL, runs synchronously, no external dependencies.
