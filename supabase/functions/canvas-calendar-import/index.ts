// Edge Function: Canvas Calendar Import
// Purpose: Fetches events from Canvas iCal feed and saves to profiles table
// Route: POST /functions/v1/canvas-calendar-import

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple iCal parser - parses basic iCal format
function parseICal(icalText: string): any[] {
  const events: any[] = [];
  const lines = icalText.split(/\r?\n/);
  
  let currentEvent: any = null;
  let currentPropertyName = '';
  let currentPropertyValue = '';
  let inEvent = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuation (lines starting with space or tab)
    if ((line.startsWith(' ') || line.startsWith('\t')) && currentPropertyName) {
      currentPropertyValue += line.substring(1);
      continue;
    }
    
    // If we have a pending property, save it before processing new line
    if (currentPropertyName && currentEvent) {
      switch (currentPropertyName) {
        case 'UID':
          currentEvent.id = currentPropertyValue;
          break;
        case 'SUMMARY':
          currentEvent.summary = currentPropertyValue;
          break;
        case 'DESCRIPTION':
          currentEvent.description = currentPropertyValue || '';
          break;
        case 'LOCATION':
          currentEvent.location = currentPropertyValue || '';
          break;
        case 'DTSTART':
          currentEvent.dtstart = currentPropertyValue;
          break;
        case 'DTEND':
          currentEvent.dtend = currentPropertyValue;
          break;
        case 'DUE':
          // Some iCal feeds use DUE instead of DTEND for assignments
          if (!currentEvent.dtend) {
            currentEvent.dtend = currentPropertyValue;
          }
          break;
        case 'DTSTAMP':
          currentEvent.dtstamp = currentPropertyValue;
          break;
      }
      currentPropertyName = '';
      currentPropertyValue = '';
    }
    
    // Parse property (format: PROPERTY:VALUE or PROPERTY;PARAMS:VALUE)
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const propertyPart = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);
    
    const semicolonIndex = propertyPart.indexOf(';');
    const property = semicolonIndex !== -1 ? propertyPart.substring(0, semicolonIndex) : propertyPart;
    
    // Start of event
    if (property === 'BEGIN' && value === 'VEVENT') {
      inEvent = true;
      currentEvent = {};
      currentPropertyName = '';
      currentPropertyValue = '';
      continue;
    }
    
    // End of event
    if (property === 'END' && value === 'VEVENT') {
      // Save any pending property before ending event
      if (currentPropertyName && currentEvent) {
        switch (currentPropertyName) {
          case 'UID':
            currentEvent.id = currentPropertyValue;
            break;
          case 'SUMMARY':
            currentEvent.summary = currentPropertyValue;
            break;
          case 'DESCRIPTION':
            currentEvent.description = currentPropertyValue || '';
            break;
          case 'LOCATION':
            currentEvent.location = currentPropertyValue || '';
            break;
          case 'DTSTART':
            currentEvent.dtstart = currentPropertyValue;
            break;
          case 'DTEND':
            currentEvent.dtend = currentPropertyValue;
            break;
          case 'DUE':
            // Some iCal feeds use DUE instead of DTEND for assignments
            if (!currentEvent.dtend) {
              currentEvent.dtend = currentPropertyValue;
            }
            break;
          case 'DTSTAMP':
            currentEvent.dtstamp = currentPropertyValue;
            break;
        }
      }
      if (currentEvent) {
        events.push(currentEvent);
      }
      inEvent = false;
      currentEvent = null;
      currentPropertyName = '';
      currentPropertyValue = '';
      continue;
    }
    
    // Store property name and value for processing
    if (inEvent && currentEvent) {
      currentPropertyName = property;
      currentPropertyValue = value;
    }
  }
  
  // Handle any remaining property at end of file
  if (currentPropertyName && currentEvent) {
    switch (currentPropertyName) {
      case 'UID':
        currentEvent.id = currentPropertyValue;
        break;
      case 'SUMMARY':
        currentEvent.summary = currentPropertyValue;
        break;
      case 'DESCRIPTION':
        currentEvent.description = currentPropertyValue || '';
        break;
      case 'LOCATION':
        currentEvent.location = currentPropertyValue || '';
        break;
      case 'DTSTART':
        currentEvent.dtstart = currentPropertyValue;
        break;
      case 'DTEND':
        currentEvent.dtend = currentPropertyValue;
        break;
      case 'DUE':
        // Some iCal feeds use DUE instead of DTEND for assignments
        if (!currentEvent.dtend) {
          currentEvent.dtend = currentPropertyValue;
        }
        break;
      case 'DTSTAMP':
        currentEvent.dtstamp = currentPropertyValue;
        break;
    }
  }
  
  return events;
}

// Parse iCal date-time and extract components directly (no timezone conversion)
function parseICalDateTime(icalDateTime: string): { year: number; month: number; day: number; hour: number; minute: number } {
  // iCal format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  // Remove Z and T, then parse components directly
  const cleaned = icalDateTime.replace(/[TZ]/g, '');
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)); // Keep as 1-12 (not 0-indexed)
  const day = parseInt(cleaned.substring(6, 8));
  const hour = cleaned.length > 8 ? parseInt(cleaned.substring(9, 11)) : 0;
  const minute = cleaned.length > 10 ? parseInt(cleaned.substring(11, 13)) : 0;
  
  // Return components directly - use whatever Canvas provides
  return { year, month, day, hour, minute };
}

// Escape HTML entities to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Clean up Canvas description text - remove iCal escaping and extract Canvas URLs
function cleanCanvasDescription(text: string): { cleaned: string; canvasUrl?: string } {
  if (!text) return { cleaned: '' };
  
  // Replace iCal escaped characters
  // \n becomes actual newline
  // \, becomes comma
  // \\ becomes backslash
  // Remove other escape sequences
  let cleaned = text
    .replace(/\\n/g, '\n')           // Convert \n to actual newline
    .replace(/\\,/g, ',')            // Convert \, to comma
    .replace(/\\\\/g, '\\')          // Convert \\ to single backslash
    .replace(/\\(.)/g, '$1')         // Remove any other escape sequences
    .trim();                         // Remove leading/trailing whitespace
  
  // Extract Canvas file URLs before escaping HTML
  // Pattern: [filename] (https://canvas.wisc.edu/...)
  const bracketMatch = cleaned.match(/\[([^\]]+)\]\s*\((https:\/\/canvas\.wisc\.edu\/[^)]+)\)/);
  // Pattern: (https://canvas.wisc.edu/...) at the end
  const urlMatch = cleaned.match(/\s*\((https:\/\/canvas\.wisc\.edu\/[^)]+)\)\s*$/);
  
  const canvasUrl = bracketMatch ? bracketMatch[2] : (urlMatch ? urlMatch[1] : undefined);
  const filename = bracketMatch ? bracketMatch[1] : undefined;
  
  // Store the original URL and filename before HTML escaping
  const originalUrl = canvasUrl;
  const originalFilename = filename;
  
  // Replace Canvas file URLs with clickable HTML links
  // Pattern: [filename] (https://canvas.wisc.edu/...) -> <a href="url" target="_blank" rel="noopener noreferrer">filename</a>
  if (bracketMatch && originalUrl && originalFilename) {
    const escapedUrl = escapeHtml(originalUrl);
    const escapedFilename = escapeHtml(originalFilename);
    cleaned = cleaned.replace(
      /\[([^\]]+)\]\s*\(https:\/\/canvas\.wisc\.edu\/[^)]+\)/g,
      `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="text-[#752432] hover:text-[#5a1c26] underline">${escapedFilename}</a>`
    );
  }
  
  // Also handle URLs at the end without brackets: (https://canvas.wisc.edu/...)
  // Replace with "View in Canvas" link
  if (urlMatch && !bracketMatch && originalUrl) {
    const escapedUrl = escapeHtml(originalUrl);
    cleaned = cleaned.replace(
      /\s*\(https:\/\/canvas\.wisc\.edu\/[^)]+\)\s*$/g,
      ` <a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="text-[#752432] hover:text-[#5a1c26] underline">View in Canvas</a>`
    );
  }
  
  // Escape HTML entities in the remaining text (but preserve the links we just added)
  // We'll do this by splitting on the links, escaping the text parts, then rejoining
  const linkRegex = /<a href="[^"]*"[^>]*>.*?<\/a>/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(cleaned)) !== null) {
    // Add text before the link (escaped)
    if (match.index > lastIndex) {
      parts.push(escapeHtml(cleaned.substring(lastIndex, match.index)));
    }
    // Add the link as-is (already contains escaped content)
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text (escaped)
  if (lastIndex < cleaned.length) {
    parts.push(escapeHtml(cleaned.substring(lastIndex)));
  }
  
  // If no links were found, escape the entire string
  if (parts.length === 0) {
    cleaned = escapeHtml(cleaned);
  } else {
    cleaned = parts.join('');
  }
  
  return { cleaned: cleaned.trim(), canvasUrl };
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
    
    // Create admin client (will be reused for profile query)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      userId = payload.sub;
      
      if (!userId) {
        throw new Error('User ID not found in token');
      }
      
      // Verify the user exists using Admin API
      const { data: { user: adminUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !adminUser) {
        console.error('User verification error:', userError);
        return new Response(
          JSON.stringify({
            error: 'Unauthorized - Invalid token',
            details: userError?.message || 'User not found',
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      user = adminUser;
    } catch (error) {
      console.error('Token decode error:', error);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized - Invalid token',
          details: error?.message || 'Could not decode token',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user's profile to check Canvas connection
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('canvas_feed_url, canvas_calendar_events, canvas_calendar_connected')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile.canvas_feed_url) {
      return new Response(
        JSON.stringify({ error: 'Canvas feed URL not configured' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the iCal feed
    const feedResponse = await fetch(profile.canvas_feed_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!feedResponse.ok) {
      console.error('Canvas feed fetch error:', feedResponse.status, feedResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Canvas calendar feed' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const icalText = await feedResponse.text();
    
    // Parse iCal feed
    const icalEvents = parseICal(icalText);
    
    // Filter events to only include those within our date range (3 months past, 9 months future)
    const now = new Date();
    const timeMin = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months ago
    const timeMax = new Date(now.getTime() + 270 * 24 * 60 * 60 * 1000); // 9 months ahead
    
    // Transform Canvas events to our format
    const transformedEvents = icalEvents
      .filter((event: any) => {
        if (!event.dtstart) return false;
        // Parse date components to check if within range
        // For date filtering, we need to handle UTC times properly
        const isUTC = event.dtstart.endsWith('Z');
        const components = parseICalDateTime(event.dtstart);
        const eventDate = isUTC 
          ? new Date(Date.UTC(components.year, components.month - 1, components.day))
          : new Date(components.year, components.month - 1, components.day);
        return eventDate >= timeMin && eventDate <= timeMax;
      })
      .map((event: any) => {
        // Extract date from DTEND (preferred) or DTSTART
        const dateTime = event.dtend || event.dtstart;
        if (!dateTime) return null;
        
        // Extract date only (first 8 characters: YYYYMMDD)
        // Remove any time component and parameters
        const dateOnly = dateTime.substring(0, 8);
        
        // Always set due time to 11:59 PM in local timezone (no Z suffix)
        // The frontend will parse this as local time, not UTC
        const rawDueTime = `${dateOnly}T235900`; // 11:59:00 PM local time
        
        // Parse date for filtering
        const year = parseInt(dateOnly.substring(0, 4));
        const month = parseInt(dateOnly.substring(4, 6));
        const day = parseInt(dateOnly.substring(6, 8));
        const eventDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Clean description and extract Canvas URL
        const descriptionResult = event.description ? cleanCanvasDescription(event.description) : { cleaned: undefined, canvasUrl: undefined };
        const locationResult = event.location ? cleanCanvasDescription(event.location) : { cleaned: undefined, canvasUrl: undefined };
        
        return {
          id: event.id || `canvas-${Date.now()}-${Math.random()}`,
          source: 'canvas',
          event_title: event.summary || 'Untitled Event',
          date: eventDate,
          raw_due_time: rawDueTime, // Always "YYYYMMDDT235900" (11:59 PM local time)
          event_type: (event.description?.toLowerCase().includes('assignment') || event.summary?.toLowerCase().includes('assignment') || event.summary?.toLowerCase().includes('challenge') || event.summary?.toLowerCase().includes('quiz') || event.summary?.toLowerCase().includes('exam')) ? 'assignment' : 'event',
          location: locationResult.cleaned,
          description: descriptionResult.cleaned,
          canvas_url: descriptionResult.canvasUrl || locationResult.canvasUrl, // Store Canvas URL if found
        };
      })
      .filter((event: any) => event !== null);

    // Update profile with new events and sync timestamp
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        canvas_calendar_events: transformedEvents,
        canvas_last_synced: new Date().toISOString(),
        canvas_calendar_connected: true,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save Canvas events' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        imported: transformedEvents.length,
        message: `Successfully imported ${transformedEvents.length} Canvas events`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in canvas-calendar-import:', error);
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

