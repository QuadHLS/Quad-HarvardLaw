# Authentication Setup Guide

## Overview

This project now includes a complete authentication system using Supabase Auth
with the following features:

- Email/Password authentication
- Google OAuth integration
- Microsoft OAuth integration
- Password reset functionality
- User profile management
- Protected routes

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Configuration

In your Supabase dashboard:

1. **Enable Authentication Providers:**

   - Go to Authentication > Providers
   - Enable Email provider
   - Enable Google OAuth (configure with your Google OAuth credentials)
   - Enable Microsoft OAuth (configure with your Microsoft OAuth credentials)

2. **Configure Redirect URLs:**

   - Add `http://localhost:5173/auth/callback` for development
   - Add your production domain + `/auth/callback` for production

3. **Set up Database Tables:**
   - The auth system expects a `profiles` table with user metadata
   - Nick will handle the database setup as per the roadmap

### 3. OAuth Provider Setup

#### Google OAuth Setup - Detailed Instructions:

##### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one:
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it (e.g., "HLS Quad Database")
   - Click "Create"

##### Step 2: Enable APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable:
   - Google+ API (for basic profile info)
   - People API (for additional user details)
3. Click "Enable" for each API

##### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have Google Workspace)
3. Fill in the required fields:
   - App name: "HLS Quad Database"
   - User support email: Your email
   - App logo: Upload if available
   - Application home page: `http://localhost:5173` (dev) or your production URL
   - Authorized domains: Add your production domain
   - Developer contact: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Save and continue through all steps

##### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Name: "HLS Quad Database Web Client"
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://your-production-domain.com` (for production)
6. Add Authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for local testing)
7. Click "Create"
8. Save the Client ID and Client Secret

##### Step 5: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Find Google and click "Enable"
4. Enter your Google OAuth credentials:
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)
5. Authorized Client IDs: Leave empty unless needed
6. Click "Save"

##### Step 6: Verify Redirect URLs in Supabase

1. Still in Supabase Authentication settings
2. Go to "URL Configuration"
3. Ensure these are set:
   - Site URL: `http://localhost:5173` (or your production URL)
   - Redirect URLs:
     - `http://localhost:5173/auth/callback`
     - `https://your-production-domain.com/auth/callback`

#### Microsoft OAuth:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI:
   `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Generate client secret
5. Copy Application ID and Client Secret to Supabase

## Features Implemented

### Components Created:

- `AuthPage.tsx` - Main authentication page with mode switching
- `LoginForm.tsx` - Email/password login with OAuth options
- `SignupForm.tsx` - User registration with profile data
- `ForgotPasswordForm.tsx` - Password reset functionality
- `AuthCallback.tsx` - OAuth redirect handler
- `UserProfile.tsx` - User dropdown with profile info and logout
- `ProtectedRoute.tsx` - Route protection wrapper

### Context & Hooks:

- `AuthContext.tsx` - Authentication state management
- `useAuth` hook - Easy access to auth functions

### Integration:

- Updated `App.tsx` to include authentication flow
- Added user profile to navigation
- Protected all main app routes

## Usage

### For Users:

1. Visit the app - you'll see the login page
2. Sign up with email/password or use OAuth
3. Complete email verification (if required)
4. Access the main application

### For Developers:

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, signOut, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Next Steps

1. **Get Supabase credentials from Nick** and add them to `.env`
2. **Test the authentication flow** in development
3. **Configure OAuth providers** in Supabase dashboard
4. **Deploy to Vercel** with environment variables
5. **Test OAuth redirects** in production

## Google OAuth Testing Checklist

### Prerequisites

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials generated (Client ID & Secret)
- [ ] OAuth consent screen configured
- [ ] Supabase Google provider enabled with credentials
- [ ] Environment variables set in `.env` file

### Development Testing

1. **Initial Setup Test:**

   - [ ] Start dev server: `npm run dev`
   - [ ] Navigate to `http://localhost:5173`
   - [ ] Verify redirect to login page

2. **Google Sign In Test (Login Page):**

   - [ ] Click "Continue with Google" button on login page
   - [ ] Verify redirect to Google consent screen
   - [ ] Select/enter Google account
   - [ ] Verify redirect back to app after authorization
   - [ ] Check user is logged in and redirected to home page
   - [ ] Verify user profile shows Google account info

3. **Google Sign In Test (Signup Page):**

   - [ ] Navigate to signup page
   - [ ] Click "Continue with Google" button
   - [ ] Verify same flow as login
   - [ ] Check if new user is created in Supabase Auth

4. **Error Handling Tests:**

   - [ ] Cancel Google consent (click cancel/close)
   - [ ] Verify proper error message displayed
   - [ ] Test with invalid redirect URLs
   - [ ] Verify error handling for network issues

5. **Session Persistence:**
   - [ ] Sign in with Google
   - [ ] Refresh the page
   - [ ] Verify user stays logged in
   - [ ] Close and reopen browser
   - [ ] Verify session persists

### Production Testing

1. **Deployment Verification:**

   - [ ] Environment variables set in Vercel/hosting platform
   - [ ] Production URLs added to Google Console
   - [ ] Production URLs added to Supabase redirect URLs

2. **Production OAuth Flow:**
   - [ ] Test complete sign-in flow on production URL
   - [ ] Verify redirect URLs work correctly
   - [ ] Test on different browsers (Chrome, Firefox, Safari)
   - [ ] Test on mobile devices

### Common Issues & Solutions

**Issue: "Redirect URI mismatch" error**

- Solution: Ensure redirect URIs in Google Console match exactly with Supabase
  callback URL
- Check for trailing slashes, http vs https

**Issue: "Invalid client" error**

- Solution: Verify Client ID and Secret are correctly copied to Supabase
- Check for extra spaces or characters

**Issue: User redirected to wrong URL after auth**

- Solution: Check Site URL in Supabase URL Configuration
- Verify redirect URLs in code match environment

**Issue: "This app is blocked" message**

- Solution: Complete OAuth consent screen verification
- Add test users if app is in testing mode

## Notes

- The auth system is fully integrated with the existing UI
- All routes are protected by default
- User metadata (name, graduation year, section) is collected during signup
- The system handles loading states and error messages
- OAuth redirects are properly configured for both dev and production
- Google OAuth buttons are now functional in both LoginForm and SignupForm
  components
