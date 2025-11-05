// Edge Function: Auto-setup Club Account
// Purpose: Automatically set app_metadata for users with @club.quad.com emails
// Can be called manually or set up as a webhook

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get service role key for admin operations
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not found');
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get request body - handle both webhook payload and manual calls
    const body = await req.json();
    
    // Webhook payload format: { type: 'INSERT', table: 'users', record: { id, email, ... } }
    // Manual call format: { user_id: '...', email: '...' }
    const user_id = body.record?.id || body.user_id;
    const email = body.record?.email || body.email;

    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: 'Either user_id or email must be provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get email from user record if not provided directly
    let targetEmail = email;
    if (!targetEmail && user_id) {
      const userResponse = await supabaseAdmin.auth.admin.getUserById(user_id);
      targetEmail = userResponse.data.user?.email;
    }
    
    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: 'Could not determine email address' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!targetEmail.toLowerCase().endsWith('@club.quad.com')) {
      return new Response(
        JSON.stringify({ 
          message: 'Email does not end with @club.quad.com, skipping setup',
          email: targetEmail
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user ID - prefer provided user_id, otherwise look up by email
    let userId = user_id;
    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      const user = data.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found with email: ' + targetEmail }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      userId = user.id;
    }

    // Update app_metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          user_type: 'club_account'
        }
      }
    );

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Club account app_metadata set successfully',
        user_id: userId,
        email: targetEmail
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

