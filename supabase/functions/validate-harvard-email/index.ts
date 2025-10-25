import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Connection': 'keep-alive'
};
console.info('validate-harvard-email function started');
Deno.serve(async (req)=>{
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
    // DEBUG: Log the email details
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
    const isAllowedDomain = allowedDomains.some((domain)=>emailLower.endsWith(domain));
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
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Create user with email_confirm: false (user must verify)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password: password,
      email_confirm: false,
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
    
    // Generate the confirmation link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: emailLower,
      password: password,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/callback`
      }
    });
    
    if (linkError) {
      console.error('Error generating confirmation link:', linkError);
      return new Response(JSON.stringify({
        error: 'Failed to generate confirmation link. Please try again.',
        success: false
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
    
    // Send confirmation email using Resend
    console.log('Sending confirmation email to:', emailLower);
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found');
      return new Response(JSON.stringify({
        error: 'Email service not configured. Please try again.',
        success: false
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Quad <noreply@quadhls.com>',
        to: [emailLower],
        subject: 'Verify your email • Quad',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <title>Verify your email • Quad</title>
            <style>
              *{box-sizing:border-box}
              body{
                margin:0;padding:0;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;color:#e8e9ee;
                background:#000;
                background-image:
                  radial-gradient(70% 90% at 20% 20%, rgba(165,28,48,.45) 0%, rgba(0,0,0,0) 70%),
                  radial-gradient(80% 80% at 85% 15%, rgba(116,58,213,.35) 0%, rgba(0,0,0,0) 65%),
                  radial-gradient(85% 85% at 30% 100%, rgba(0,217,163,.28) 0%, rgba(0,0,0,0) 60%),
                  linear-gradient(180deg, #050508 0%, #000 100%);
              }
              .wrap{max-width:680px;margin:60px auto;padding:0 16px}
              .shell{
                position:relative;border-radius:26px;padding:2px;
                background:linear-gradient(135deg,rgba(255,255,255,.25),rgba(255,255,255,.05));
                box-shadow:0 25px 70px rgba(0,0,0,.7), inset 0 2px 8px rgba(255,255,255,.15);
              }
              .card{
                border-radius:24px;overflow:hidden;background:rgba(15,15,18,.72);
                backdrop-filter:saturate(160%) blur(16px);
                border:1px solid rgba(255,255,255,.12);
                box-shadow:inset 0 0 60px rgba(255,255,255,.05);
              }
              .hdr{
                padding:48px 22px 38px;text-align:center;color:#fff;
                background:
                  radial-gradient(160% 120% at 100% -20%, rgba(255,255,255,.14) 0%, rgba(0,0,0,0) 70%),
                  linear-gradient(135deg,#a51c30 0%,#9d253f 40%,#441221 100%);
              }
              .hdr .main{font-size:26px;font-weight:900;letter-spacing:.4px}
              .hdr .sub{margin-top:10px;font-size:18px;font-weight:700;opacity:.98}
              .content{padding:32px 28px 36px;background:transparent}
              .title{margin:0 0 16px;font-size:26px;font-weight:900;color:#fff}
              .lead{margin:0 0 22px;font-size:16px;line-height:1.65;color:#e0e1e8}
              .benefits{
                margin:20px 0;padding:18px;border-radius:18px;
                background:linear-gradient(180deg,#132018,#0e1912);
                border:1px solid #2a5a39;color:#c9f0d1;font-size:15px;line-height:1.7;
                box-shadow:0 0 20px rgba(0,255,128,.1) inset
              }
              .cta{text-align:center;margin:32px 0}
              .btn{
                display:inline-block;text-decoration:none;
                background:linear-gradient(135deg,#a51c30 0%,#e14561 100%);
                color:#000!important;padding:16px 34px;border-radius:999px;
                font-weight:900;font-size:17px;letter-spacing:.3px;
                box-shadow:0 12px 28px rgba(165,28,48,.45), inset 0 1px 0 rgba(255,255,255,.3)
              }
              .fallback{
                margin-top:26px;font-size:12px;color:#a3a9b3;word-break:break-all;
                background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.18);
                padding:14px;border-radius:12px
              }
              .fallback a{color:#000!important;text-decoration:underline}
              .ftr{padding:18px;font-size:12px;color:#9aa0aa;text-align:center;background:rgba(255,255,255,.02)}
              .disclaimer{margin-top:6px;font-size:11px;color:#888}
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="shell">
                <div class="card">
                  <div class="hdr">
                    <div class="main">Designed for Harvard Law Students</div>
                    <div class="sub">Quad</div>
                  </div>
                  <div class="content">
                    <h1 class="title">Verify your email 🚀</h1>
                    <p class="lead">Click below to activate your Quad account and unlock curated outlines, resources, and tools.</p>
                    <div class="benefits">
                      Access curated resources<br/>
                      Connect with classmates<br/>
                      Stay organized with todos and events
                    </div>
                    <div class="cta"><a class="btn" href="${linkData.properties.action_link}">Verify my email</a></div>
                    <div class="fallback">If the button doesn't work, copy this link:<br/><a href="${linkData.properties.action_link}">${linkData.properties.action_link}</a></div>
                  </div>
                  <div class="ftr">© ${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')} • Quad<div class="disclaimer">Quad is an independent student resource and is not affiliated with Harvard Law School or Harvard University.</div></div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(JSON.stringify({
        error: 'Failed to send confirmation email. Please try again.',
        success: false
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
    
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
