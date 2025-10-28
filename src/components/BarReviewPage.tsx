import { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, Users, ExternalLink } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BarReviewEvent {
  id: string;
  venue_name: string;
  venue_address: string;
  venue_phone?: string;
  description?: string;
  map_embed_url?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  rsvp_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface BarReviewPageProps {
  onNavigateToStudentProfile?: (studentName: string) => void;
}

export function BarReviewPage({ onNavigateToStudentProfile }: BarReviewPageProps) {
  const { user } = useAuth();
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(47);
  const [currentEvent, setCurrentEvent] = useState<BarReviewEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [attendees, setAttendees] = useState<{name: string, id: string}[]>([]);

  // Fetch bar review events from Supabase
  useEffect(() => {
    const fetchBarReviewEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current week's event (assuming events are stored with event_date)
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 4); // Thursday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        // Fetch current week's event
        const { data: currentEventData, error: currentError } = await supabase
          .from('bar_review_events')
          .select('*')
          .gte('event_date', startOfWeek.toISOString().split('T')[0])
          .lte('event_date', endOfWeek.toISOString().split('T')[0])
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (currentError) {
          console.error('Error fetching current event:', currentError);
          throw currentError;
        }

        let eventData = currentEventData;

        // If no current event, get the most recent event as fallback
        if (!eventData) {
          const { data: recentEventData, error: recentError } = await supabase
            .from('bar_review_events')
            .select('*')
            .order('event_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentError) {
            console.error('Error fetching recent event:', recentError);
            throw recentError;
          }

          eventData = recentEventData;
        }

        if (eventData) {
          setCurrentEvent(eventData);
          
          // Run all remaining queries in parallel for better performance
          const [rsvpCountResult, userRsvpResult] = await Promise.all([
            // Fetch RSVP count
            supabase
              .from('bar_count')
              .select('*', { count: 'exact', head: true }),
            
            // Check if current user has RSVPed (only if user exists)
            user ? supabase
              .from('bar_count')
              .select('*')
              .eq('identity', user.id)
              .maybeSingle() : Promise.resolve({ data: null, error: null })
          ]);

          // Set RSVP count
          if (!rsvpCountResult.error && rsvpCountResult.count !== null) {
            setRsvpCount(rsvpCountResult.count);
          } else {
            setRsvpCount(0);
          }

          // Set user RSVP status
          if (user) {
            setIsRSVPed(!!userRsvpResult.data && !userRsvpResult.error);
          }
        }

      } catch (err) {
        console.error('Error fetching bar review events:', err);
        setError('Failed to load bar review events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarReviewEvents();
  }, [user]);

  // Fetch attendees when component loads
  useEffect(() => {
    if (currentEvent) {
      fetchAttendees();
    }
  }, [currentEvent]);

  // Fetch RSVP count from bar_count table
  const fetchRsvpCount = async () => {
    try {
      const { count: rsvpCountData, error: countError } = await supabase
        .from('bar_count')
        .select('*', { count: 'exact', head: true });

      if (!countError && rsvpCountData !== null) {
        setRsvpCount(rsvpCountData);
      } else {
        console.error('Error fetching RSVP count:', countError);
        setRsvpCount(0);
      }
    } catch (error) {
      console.error('Error fetching RSVP count:', error);
      setRsvpCount(0);
    }
  };

  // Fetch attendee names from profiles table
  const fetchAttendees = async () => {
    try {
      // Get all user IDs who RSVPed
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('bar_count')
        .select('identity');

      if (rsvpError) {
        console.error('Error fetching RSVPs:', rsvpError);
        setAttendees([]);
        return;
      }

      if (rsvpData && rsvpData.length > 0) {
        // Get user IDs
        const userIds = rsvpData.map(rsvp => rsvp.identity);
        
        // Fetch full names from profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setAttendees([]);
          return;
        }

        // Extract names and IDs, filter out null/empty names, and sort alphabetically
        const attendeeData = profilesData
          ?.map(profile => ({
            name: profile.full_name,
            id: profile.id
          }))
          .filter(attendee => attendee.name && attendee.name.trim() !== '')
          .sort((a, b) => a.name.localeCompare(b.name)) || [];
        
        // If we have fewer names than RSVPs, show a message
        if (attendeeData.length < rsvpData.length) {
          const missingCount = rsvpData.length - attendeeData.length;
          attendeeData.push({
            name: `${missingCount} user${missingCount > 1 ? 's' : ''} (name not available)`,
            id: 'unknown'
          });
        }
        
        setAttendees(attendeeData);
      } else {
        setAttendees([]);
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setAttendees([]);
    }
  };

  // Fallback venue data if no event is found in database
  const fallbackVenue = {
    name: "Murphy's Pub & Grill",
    address: "2847 University Avenue, Madison, WI 53705",
    phone: "(608) 555-0123",
    description: "Join us for our weekly law school bar review! Great drinks, food, and company to unwind after a long week of classes.",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2914.123456789!2d-89.4012345!3d43.0731234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDA0JzIzLjIiTiA4OcKwMjQnMDQuNCJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
  };

  // Use current event data or fallback to mock data
  const currentVenue = currentEvent ? {
    name: currentEvent.venue_name,
    address: currentEvent.venue_address,
    phone: currentEvent.venue_phone || "",
    description: currentEvent.description || "Join us for our weekly law school bar review! Great drinks, food, and company to unwind after a long week of classes.",
    mapEmbedUrl: currentEvent.map_embed_url || fallbackVenue.mapEmbedUrl
  } : fallbackVenue;


  const handleRSVP = async () => {
    
    if (!user) {
      alert('Please log in to RSVP');
      return;
    }

    if (!currentEvent) {
      alert('No event available to RSVP for');
      return;
    }

    setRsvpLoading(true);

    try {
      if (!isRSVPed) {
        
        // Test the policy first
        const { data: testData, error: testError } = await supabase
          .from('bar_count')
          .select('*')
          .limit(1);
        
        // Check if user already RSVPed to avoid duplicate key error
        const { data: existingRsvp } = await supabase
          .from('bar_count')
          .select('*')
          .eq('identity', user.id)
          .maybeSingle();

        if (existingRsvp) {
          setIsRSVPed(true);
          return;
        }

        // Add user to bar_count table
        const { data, error: insertError } = await supabase
          .from('bar_count')
          .insert({
            identity: user.id
          })
          .select();


        if (insertError) {
          console.error('Insert error details:', insertError);
          throw insertError;
        }

        setIsRSVPed(true);
        // Fetch updated attendee list and count
        fetchAttendees();
        await fetchRsvpCount();
      } else {
        
        // Remove user from bar_count table
        const { data, error: deleteError } = await supabase
          .from('bar_count')
          .delete()
          .eq('identity', user.id)
          .select();


        if (deleteError) {
          console.error('Delete error details:', deleteError);
          throw deleteError;
        }

        setIsRSVPed(false);
        // Fetch updated attendee list and count
        fetchAttendees();
        await fetchRsvpCount();
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      alert(`Failed to update RSVP: ${error.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (!currentEvent || !currentEvent.venue_address) {
      alert('Venue address not available');
      return;
    }

    // Create a Google Maps URL with the venue address
    const encodedAddress = encodeURIComponent(currentEvent.venue_address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    // Open in new tab
    window.open(mapsUrl, '_blank');
  };

  const getEventDate = () => {
    // Use event_date from database if available, otherwise calculate current Thursday
    if (currentEvent && currentEvent.event_date) {
      // Parse the date in local timezone to avoid timezone shift issues
      const [year, month, day] = currentEvent.event_date.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day); // month is 0-indexed
      return eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      });
    }
    
    // Fallback to calculating current Thursday
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 4 = Thursday
    const daysUntilThursday = (4 - currentDay + 7) % 7;
    const thisThursday = new Date(today);
    thisThursday.setDate(today.getDate() + daysUntilThursday);
    
    return thisThursday.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-full overflow-auto" style={{ 
        backgroundColor: 'var(--background-color, #f9f5f0)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#752531 transparent'
      }}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-gray-900 mb-2">Bar Review</h1>
            <p className="text-gray-600">Weekly Thursday night social for law students</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#752432] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bar review events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full overflow-auto" style={{ 
        backgroundColor: 'var(--background-color, #f9f5f0)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#752531 transparent'
      }}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-gray-900 mb-2">Bar Review</h1>
            <p className="text-gray-600">Weekly Thursday night social for law students</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-[#752432] hover:bg-[#752432]/90"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ 
      backgroundColor: 'var(--background-color, #f9f5f0)',
      scrollbarWidth: 'thin',
      scrollbarColor: '#752531 transparent'
    }}>
      <div className="max-w-6xl mx-auto p-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Event Card */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Event Header */}
              <div className="text-white p-8" style={{ backgroundColor: '#0080bd' }}>
                <div className="flex items-center justify-between h-full">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-medium mb-3">Bar Review</h2>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{getEventDate()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 text-white/90">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{rsvpCount} attending</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>
                        {currentEvent && currentEvent.start_time 
                          ? new Date(`2000-01-01T${currentEvent.start_time}`).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            }) + ' - Late'
                          : '8:00 PM - Late'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue Details */}
              <div className="px-4 pt-1 pb-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{currentVenue.name}</h3>
                  <div className="flex items-start gap-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{currentVenue.address}</p>
                      <p className="text-sm">{currentVenue.phone}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{currentVenue.description}</p>
                </div>

                {/* Action Button */}
                <div className="flex justify-start mt-6">
                  <Button 
                    variant="outline" 
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium shadow-sm hover:shadow px-8"
                    onClick={handleGetDirections}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>

              </div>
            </Card>

            {/* Map */}
            <Card className="mt-6 overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Map</h3>
              </div>
              <div className="relative h-96 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}">
                {currentVenue.mapEmbedUrl ? (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
                      Debug: {currentVenue.mapEmbedUrl.substring(0, 100)}...
                    </div>
                    <iframe
                      src={currentVenue.mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0"
                      title="Bar Review Venue Location"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p>Map not available</p>
                      <p className="text-sm">No map URL provided</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Summary */}
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Who's Going</h3>
              
              {/* Large centered number */}
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-red-600">{rsvpCount}</div>
                <div className="text-sm text-gray-600">{rsvpCount === 1 ? 'person attending' : 'people attending'}</div>
              </div>

              {/* Always visible attendee list */}
              <div className="text-center mb-4">
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-white" style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#752531 transparent'
                }}>
                  <div className="grid grid-cols-1 gap-2 p-3">
                    {attendees.length > 0 ? (
                      attendees.map((attendee, index) => (
                        <div 
                          key={index} 
                          className="text-xs text-gray-700 py-1 px-2 bg-[#f9f5f0] border border-gray-200 rounded-md hover:bg-[#f0ebe5] hover:border-gray-300 cursor-pointer transition-colors shadow-sm"
                          onClick={() => {
                            // Navigate to user profile using the same pattern as CoursePage
                            if (attendee.id !== 'unknown' && onNavigateToStudentProfile) {
                              onNavigateToStudentProfile(attendee.name);
                            }
                          }}
                        >
                          {attendee.name}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 py-4 text-center">
                        No attendees yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Centered call to action */}
              <div className="text-center">
                <Button 
                  onClick={handleRSVP}
                  disabled={rsvpLoading || !user}
                  size="sm" 
                  className="text-white w-full font-medium"
                  style={{ backgroundColor: '#3da44b' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d7a3d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3da44b';
                  }}
                >
                  {rsvpLoading ? 'Processing...' : (isRSVPed ? "You're Going!" : 'Count Me In!')}
                </Button>
              </div>
            </Card>

            {/* Weekly Schedule */}



          </div>
        </div>
      </div>
    </div>
  );
}