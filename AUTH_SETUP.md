# Authentication Setup Guide

## Overview
This project now includes a complete authentication system using Supabase Auth with the following features:

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

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase

#### Microsoft OAuth:
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI: `https://your-supabase-project.supabase.co/auth/v1/callback`
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
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, signOut, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Next Steps

1. **Get Supabase credentials from Nick** and add them to `.env`
2. **Test the authentication flow** in development
3. **Configure OAuth providers** in Supabase dashboard
4. **Deploy to Vercel** with environment variables
5. **Test OAuth redirects** in production

## Notes

- The auth system is fully integrated with the existing UI
- All routes are protected by default
- User metadata (name, graduation year, section) is collected during signup
- The system handles loading states and error messages
- OAuth redirects are properly configured for both dev and production
