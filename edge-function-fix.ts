import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Connection': 'keep-alive'
};

console.info('validate-harvard-email function started');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { email, password } = await req.json();
    
    // Check if email is provided
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email is required',
        success: false
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    // Check if password is provided
    if (!password) {
      return new Response(JSON.stringify({
        error: 'Password is required',
        success: false
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    console.log('Email received:', JSON.stringify(email));
    
    // Check if email is allowed
    const emailLower = email.toLowerCase().trim();
    const allowedDomains = [
      '@llm25.law.harvard.edu',
      '@jd25.law.harvard.edu',
      '@llm26.law.harvard.edu',
      '@jd26.law.harvard.edu',
      '@jd27.law.harvard.edu',
      '@jd28.law.harvard.edu'
    ];
    const specialException = 'justin031607@gmail.com';
    
    // Check if email ends with allowed domain OR is the special exception
    const isAllowedDomain = allowedDomains.some((domain) => emailLower.endsWith(domain));
    const isSpecialException = emailLower === specialException;
    
    if (!isAllowedDomain && !isSpecialException) {
      console.log('Email validation failed - not in allowed domains or special exception');
      return new Response(JSON.stringify({
        error: 'Please use your Harvard Law School email address',
        success: false
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    // Password strength validation
    if (password.length < 8) {
      return new Response(JSON.stringify({
        error: 'Password must be at least 8 characters',
        success: false
      }), {
        headers: corsHeaders,
        status: 400
      });
    }
    
    console.log('Email validation passed, creating user with Admin API');
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Create user with email_confirm: false (requires confirmation, sends Supabase's default email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password: password,
      email_confirm: false, // This will send Supabase's default confirmation email
      user_metadata: {
        signup_source: 'edge_function',
        signup_timestamp: new Date().toISOString()
      }
    });
    
    if (error) {
      console.error('Admin API error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to create account. Please try again.',
        success: false
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
    
    console.log('User created successfully:', data.user?.id);
    console.log('Confirmation email sent successfully');
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      },
      message: 'Account created successfully. Please check your email to verify your account.'
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred during account creation',
      success: false
    }), {
      headers: corsHeaders,
      status: 400
    });
  }
});