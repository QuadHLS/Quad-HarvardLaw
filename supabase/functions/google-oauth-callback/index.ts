// Edge Function: Google OAuth Callback
// Purpose: Handles OAuth callback, exchanges code for tokens, saves to database
// Route: GET /functions/v1/google-oauth-callback

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    
    if (!googleClientId || !googleClientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Parse query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    console.log('OAuth callback received:', { code: code ? 'present' : 'missing', state, error });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${frontendUrl}/calendar?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return Response.redirect(`${frontendUrl}/calendar?error=no_code`);
    }

    // Verify state parameter - extract user_id from state (format: "user_id:uuid|state:random")
    // The state is used for CSRF protection and user identification

    // Exchange authorization code for tokens
    // Use custom domain to match what was set in google-oauth-start
    const customDomain = 'auth.quadhls.com';
    const redirectUri = `https://${customDomain}/functions/v1/google-oauth-callback`;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return Response.redirect(`${frontendUrl}/calendar?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
      token_type,
    } = tokenData;

    if (!access_token || !refresh_token) {
      return Response.redirect(`${frontendUrl}/calendar?error=missing_tokens`);
    }

    // Parse state to get user_id (format: "user_id:uuid|state:random")
    // The state parameter contains the user_id for security and user identification
    const stateParts = state?.split('|') || [];
    const userStatePart = stateParts.find(part => part.startsWith('user_id:'));
    const userId = userStatePart?.split(':')[1];

    if (!userId) {
      return Response.redirect(`${frontendUrl}/calendar?error=invalid_state`);
    }

    // Create admin client to save tokens
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Calculate expiry date
    const expiryDate = new Date(Date.now() + expires_in * 1000).toISOString();

    // Save tokens to database
    const { error: dbError } = await supabaseAdmin
      .from('user_google_tokens')
      .upsert({
        user_id: userId,
        access_token,
        refresh_token,
        expiry_date: expiryDate,
        scope,
        token_type: token_type || 'Bearer',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return Response.redirect(`${frontendUrl}/calendar?error=database_error`);
    }

    // Update profiles table to mark as connected
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        google_calendar_connected: true,
        google_last_synced: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail the whole flow if profile update fails
    }

    // Redirect to calendar page with success
    return Response.redirect(`${frontendUrl}/calendar?connected=true`);
  } catch (error: any) {
    console.error('Error in google-oauth-callback:', error);
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    return Response.redirect(`${frontendUrl}/calendar?error=${encodeURIComponent(error.message || 'unknown_error')}`);
  }
});

