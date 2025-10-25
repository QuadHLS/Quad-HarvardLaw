import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { email } = await req.json();
    
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
    
    console.log('Email validation request for:', email);
    
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
    
    console.log('Email validation passed for:', emailLower);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Email is valid for Harvard Law School'
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred during email validation',
      success: false
    }), {
      headers: corsHeaders,
      status: 400
    });
  }
});