// Edge Function: Google OAuth Start
// Purpose: Initiates Google OAuth flow for Calendar integration
// Route: GET /functions/v1/google-oauth-start

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!googleClientId) {
      throw new Error('GOOGLE_CLIENT_ID not found');
    }
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not found');
    }

    // Get the authorization header to extract user token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT to get user ID (simple base64 decode of payload)
    // JWT format: header.payload.signature
    let userId: string;
    let user: any;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      userId = payload.sub; // 'sub' is the user ID in JWT
      
      if (!userId) {
        throw new Error('User ID not found in token');
      }

      // Verify the user exists using Admin API
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Get user to verify they exist
      const { data: { user: adminUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !adminUser) {
        console.error('User verification error:', userError);
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized - Invalid token', 
            details: userError?.message || 'User not found'
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      user = adminUser;
    } catch (error: any) {
      console.error('Token decode error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized - Invalid token', 
          details: error?.message || 'Could not decode token'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate state parameter (CSRF protection + user identification)
    const randomState = crypto.randomUUID();
    const state = `user_id:${user.id}|state:${randomState}`;
    
    // Use custom domain for redirect URI (auth.quadhls.com)
    // This will be displayed in the Google OAuth consent screen
    const customDomain = 'auth.quadhls.com';
    const baseUrl = `https://${customDomain}`;
    
    // Build Google OAuth URL
    const redirectUri = `${baseUrl}/functions/v1/google-oauth-callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.readonly';
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', googleClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline'); // Required to get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to get refresh token
    authUrl.searchParams.set('state', state);

    // Return the OAuth URL and state
    return new Response(
      JSON.stringify({ 
        authUrl: authUrl.toString(),
        state: state 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in google-oauth-start:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

