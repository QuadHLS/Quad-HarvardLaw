// Edge Function: Google Calendar Import
// Purpose: Fetches events from Google Calendar API and saves to profiles table
// Route: POST /functions/v1/google-calendar-import

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to refresh access token if expired
async function getValidAccessToken(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: string
): Promise<string> {
  const now = new Date();
  const expiry = new Date(expiryDate);

  // If token expires in less than 5 minutes, refresh it
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!googleClientId || !googleClientSecret || !supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing OAuth credentials');
    }

    // Refresh the token
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh access token');
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const newExpiresIn = refreshData.expires_in;

    // Update tokens in database
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const newExpiryDate = new Date(Date.now() + newExpiresIn * 1000).toISOString();

    await supabaseAdmin
      .from('user_google_tokens')
      .update({
        access_token: newAccessToken,
        expiry_date: newExpiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return newAccessToken;
  }

  return accessToken;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
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

    // Extract the JWT token and decode to get user ID
    const token = authHeader.replace('Bearer ', '');
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

    // Create admin client to access tokens
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user's Google tokens
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokens) {
      return new Response(
        JSON.stringify({ error: 'Google Calendar not connected' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user's profile to check for sync token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_sync_token')
      .eq('id', user.id)
      .single();

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(
      user.id,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date
    );

    // Determine if this is a full sync or incremental sync
    const syncToken = profile?.google_sync_token;
    const isIncrementalSync = !!syncToken;

    // Build API URL - use syncToken for incremental, or timeMin/timeMax for full sync
    let apiUrl: string;
    if (isIncrementalSync) {
      // Incremental sync using sync token
      apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          syncToken: syncToken,
          maxResults: '2500',
          singleEvents: 'true',
        });
    } else {
      // Full sync - get events from 3 months ago to 9 months ahead
      const timeMin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 3 months in the past (90 days)
      const timeMax = new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(); // 9 months ahead (270 days)
      apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          maxResults: '2500',
          singleEvents: 'true',
          orderBy: 'startTime',
        });
    }

    const calendarResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Handle sync token expiration (410 Gone) - need to do full sync
    let calendarData: any;
    let events: any[];
    let nextSyncToken: string | undefined;
    let actuallyIncremental = isIncrementalSync; // Track if we're actually doing incremental after 410 handling
    
    if (calendarResponse.status === 410) {
      // Sync token expired, clear it and do full sync
      await supabaseAdmin
        .from('profiles')
        .update({ google_sync_token: null })
        .eq('id', user.id);
      
      // Retry with full sync (not incremental)
      actuallyIncremental = false;
      const timeMin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString();
      const retryResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          maxResults: '2500',
          singleEvents: 'true',
          orderBy: 'startTime',
        }),
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        console.error('Google Calendar API error on retry:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch events from Google Calendar' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      calendarData = await retryResponse.json();
      events = calendarData.items || [];
      nextSyncToken = calendarData.nextSyncToken;
    } else if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events from Google Calendar' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      calendarData = await calendarResponse.json();
      events = calendarData.items || [];
      nextSyncToken = calendarData.nextSyncToken;
    }

    // Transform Google Calendar events to our format
    // For incremental sync, events with status 'cancelled' are deletions
    const transformedEvents = events
      .filter((event: any) => {
        // Only include events with a start time
        return event.start && (event.start.dateTime || event.start.date);
      })
      .map((event: any) => {
        // Mark cancelled events for deletion
        const isDeleted = event.status === 'cancelled';
        const start = event.start.dateTime || event.start.date;
        const end = event.end?.dateTime || event.end?.date;
        
        // Get timezone from event (Google Calendar provides timezone in event.start.timeZone)
        // Default to America/New_York (EST/EDT) if not specified
        const eventTimeZone = event.start.timeZone || 'America/New_York';
        
        // Parse date and time - Google Calendar provides timezone info in ISO 8601 format
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : null;

        // Convert to the event's timezone (or EST/EDT) before extracting time components
        const convertToTimeZone = (date: Date, timeZone: string): { year: number; month: number; day: number; hours: number; minutes: number } => {
          // Use Intl.DateTimeFormat to get components in the specified timezone
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          const parts = formatter.formatToParts(date);
          const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
          const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
          const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
          const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
          const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
          
          return { year, month, day, hours, minutes };
        };

        const startLocal = convertToTimeZone(startDate, eventTimeZone);
        const endLocal = endDate ? convertToTimeZone(endDate, eventTimeZone) : null;

        // Format date as YYYY-MM-DD (using local timezone date)
        const date = `${startLocal.year}-${startLocal.month.toString().padStart(2, '0')}-${startLocal.day.toString().padStart(2, '0')}`;
        
        // Format time as HH:MM (24-hour format) using local timezone time
        const startTime = `${startLocal.hours.toString().padStart(2, '0')}:${startLocal.minutes.toString().padStart(2, '0')}`;
        const endTime = endLocal ? `${endLocal.hours.toString().padStart(2, '0')}:${endLocal.minutes.toString().padStart(2, '0')}` : startTime;

        return {
          id: event.id,
          source: 'google',
          event_title: event.summary || '(No title)',
          date,
          start_time: startTime,
          end_time: endTime,
          event_type: event.eventType || null,
          location: event.location || null,
          description: event.description || null,
          _deleted: isDeleted, // Mark for deletion in incremental sync
        };
      });

    // Get existing events for incremental sync merge
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('google_calendar_events')
      .eq('id', user.id)
      .single();

    let finalEvents: any[];
    
    if (actuallyIncremental && existingProfile?.google_calendar_events) {
      // Incremental sync: merge changes with existing events
      const existingEvents = Array.isArray(existingProfile.google_calendar_events) 
        ? existingProfile.google_calendar_events 
        : [];
      
      // Create a map of existing events by ID
      const existingEventsMap = new Map(
        existingEvents.map((e: any) => [e.id, e])
      );
      
      // Process transformed events: add new, update changed, mark deleted for removal
      transformedEvents.forEach((event: any) => {
        if (event._deleted) {
          // Remove deleted events
          existingEventsMap.delete(event.id);
        } else {
          // Add or update event (remove _deleted flag before storing)
          const { _deleted, ...eventToStore } = event;
          existingEventsMap.set(event.id, eventToStore);
        }
      });
      
      // Convert map back to array
      finalEvents = Array.from(existingEventsMap.values());
    } else {
      // Full sync: replace all events (remove _deleted flags)
      finalEvents = transformedEvents.map(({ _deleted, ...event }) => event);
    }

    // Update profiles table with merged events and sync token
    const updateData: any = {
      google_calendar_events: finalEvents,
      google_last_synced: new Date().toISOString(),
    };
    
    // Save nextSyncToken if we got one (for future incremental syncs)
    if (nextSyncToken) {
      updateData.google_sync_token = nextSyncToken;
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save events' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imported: transformedEvents.length,
        incremental: actuallyIncremental,
        totalEvents: finalEvents.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in google-calendar-import:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

