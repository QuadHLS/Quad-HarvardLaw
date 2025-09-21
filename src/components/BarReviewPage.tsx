import { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, Users, ExternalLink, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BarReviewEvent {
  id: string;
  venue_name: string;
  venue_address: string;
  venue_phone?: string;
  description?: string;
  map_embed_url?: string;
  special_offers?: string[];
  event_date: string;
  start_time: string;
  end_time?: string;
  rsvp_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface BarReviewPageProps {}

export function BarReviewPage({}: BarReviewPageProps) {
  const { user } = useAuth();
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(47);
  const [showAttendeeList, setShowAttendeeList] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<BarReviewEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

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

        if (currentEventData) {
          console.log('Current event data:', currentEventData);
          console.log('Map embed URL:', currentEventData.map_embed_url);
          setCurrentEvent(currentEventData);
          
          // Fetch actual RSVP count from bar_count table
          const { count: rsvpCountData, error: countError } = await supabase
            .from('bar_count')
            .select('*', { count: 'exact', head: true });

          console.log('RSVP count fetch result:', { rsvpCountData, countError });

          if (!countError && rsvpCountData !== null) {
            setRsvpCount(rsvpCountData);
          } else {
            console.log('Error fetching RSVP count, using 0');
            setRsvpCount(0);
          }

          // Check if current user has RSVPed
          if (user) {
            const { data: userRsvp, error: userRsvpError } = await supabase
              .from('bar_count')
              .select('*')
              .eq('identity', user.id)
              .single();

            console.log('User RSVP check:', { userRsvp, userRsvpError });
            setIsRSVPed(!!userRsvp && !userRsvpError);
          }
        } else {
          // Try to get the most recent event as fallback
          const { data: recentEventData, error: recentError } = await supabase
            .from('bar_review_events')
            .select('*')
            .order('event_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentEventData && !recentError) {
            setCurrentEvent(recentEventData);
            
            // Fetch actual RSVP count for recent event too
            const { count: recentRsvpCount, error: recentCountError } = await supabase
              .from('bar_count')
              .select('*', { count: 'exact', head: true });

            if (!recentCountError && recentRsvpCount !== null) {
              setRsvpCount(recentRsvpCount);
            } else {
              setRsvpCount(0);
            }

            // Check if current user has RSVPed for recent event too
            if (user) {
              const { data: userRsvp, error: userRsvpError } = await supabase
                .from('bar_count')
                .select('*')
                .eq('identity', user.id)
                .single();

              console.log('User RSVP check (recent event):', { userRsvp, userRsvpError });
              setIsRSVPed(!!userRsvp && !userRsvpError);
            }
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
  }, []);

  // Fetch attendees when attendee list is opened
  useEffect(() => {
    if (showAttendeeList && currentEvent) {
      fetchAttendees();
    }
  }, [showAttendeeList, currentEvent]);

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
    if (!currentEvent) return;
    
    setAttendeesLoading(true);
    try {
      // Get all user IDs who RSVPed
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('bar_count')
        .select('identity');

      if (rsvpError) {
        console.error('Error fetching RSVPs:', rsvpError);
        return;
      }

      if (rsvpData && rsvpData.length > 0) {
        // Get user IDs
        const userIds = rsvpData.map(rsvp => rsvp.identity);
        
        // Fetch full names from profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('full_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Extract names and filter out null/empty names
        const names = profilesData
          ?.map(profile => profile.full_name)
          .filter(name => name && name.trim() !== '') || [];

        setAttendees(names);
      } else {
        setAttendees([]);
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setAttendeesLoading(false);
    }
  };

  // Fallback venue data if no event is found in database
  const fallbackVenue = {
    name: "Murphy's Pub & Grill",
    address: "2847 University Avenue, Madison, WI 53705",
    phone: "(608) 555-0123",
    description: "Join us for our weekly law school bar review! Great drinks, food, and company to unwind after a long week of classes.",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2914.123456789!2d-89.4012345!3d43.0731234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDA0JzIzLjIiTiA4OcKwMjQnMDQuNCJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus",
    specialOffers: [
      "$3 Miller High Life bottles",
      "$5 Well drinks", 
      "$2 off appetizers",
      "Happy hour 8-10pm"
    ]
  };

  // Use current event data or fallback to mock data
  const currentVenue = currentEvent ? {
    name: currentEvent.venue_name,
    address: currentEvent.venue_address,
    phone: currentEvent.venue_phone || "",
    description: currentEvent.description || "Join us for our weekly law school bar review! Great drinks, food, and company to unwind after a long week of classes.",
    mapEmbedUrl: currentEvent.map_embed_url || fallbackVenue.mapEmbedUrl,
    specialOffers: Array.isArray(currentEvent.special_offers) ? currentEvent.special_offers : fallbackVenue.specialOffers
  } : fallbackVenue;


  const handleRSVP = async () => {
    console.log('RSVP clicked. User:', user?.id, 'isRSVPed:', isRSVPed);
    console.log('User object:', user);
    console.log('User role:', user?.role);
    
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
        console.log('Attempting to insert RSVP for user:', user.id);
        console.log('User role:', user.role);
        console.log('User aud:', user.aud);
        
        // Test the policy first
        const { data: testData, error: testError } = await supabase
          .from('bar_count')
          .select('*')
          .limit(1);
        console.log('Test select result:', { testData, testError });
        
        // Check if user already RSVPed to avoid duplicate key error
        const { data: existingRsvp } = await supabase
          .from('bar_count')
          .select('*')
          .eq('identity', user.id)
          .single();

        if (existingRsvp) {
          console.log('User already RSVPed, skipping insert');
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

        console.log('Insert RSVP result:', { data, insertError });

        if (insertError) {
          console.error('Insert error details:', insertError);
          throw insertError;
        }

        console.log('RSVP successful, updating UI');
        setIsRSVPed(true);
        // Fetch updated attendee list and count
        fetchAttendees();
        await fetchRsvpCount();
      } else {
        console.log('Attempting to delete RSVP for user:', user.id);
        
        // Remove user from bar_count table
        const { data, error: deleteError } = await supabase
          .from('bar_count')
          .delete()
          .eq('identity', user.id)
          .select();

        console.log('Delete RSVP result:', { data, deleteError });

        if (deleteError) {
          console.error('Delete error details:', deleteError);
          throw deleteError;
        }

        console.log('RSVP cancellation successful, updating UI');
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
      <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} overflow-auto">
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
      <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} overflow-auto">
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
    <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">Bar Review</h1>
          <p className="text-gray-600">Weekly Thursday night social for law students</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Event Card */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {/* Event Header */}
              <div className="bg-[#752432] text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium">This Week's Bar Review</h2>
                  <div className="flex items-center gap-2 text-white/90">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{rsvpCount} attending</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{getEventDate()}</span>
                  </div>
                  <div className="flex items-center gap-2">
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

              {/* Venue Details */}
              <div className="p-6">
                <div className="mb-6">
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

                {/* Special Offers */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Tonight's Specials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentVenue.specialOffers && currentVenue.specialOffers.length > 0 ? (
                      currentVenue.specialOffers.map((offer, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-[#752432] rounded-full"></div>
                          <span>{offer}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No specials available</div>
                    )}
                  </div>
                </div>

                {/* RSVP Button */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleRSVP}
                    disabled={rsvpLoading || !user}
                    className={`${
                      isRSVPed 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-[#752432] hover:bg-[#752432]/90'
                    }`}
                  >
                    {rsvpLoading ? (
                      'Processing...'
                    ) : isRSVPed ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        You're Going!
                      </>
                    ) : (
                      "Join Event"
                    )}
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(currentVenue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Get Directions
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Map */}
            <Card className="mt-6 overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Location</h3>
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
                      onLoad={() => console.log('Map iframe loaded')}
                      onError={() => console.log('Map iframe failed to load')}
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
              <div className="text-center mb-4">
                <div className="text-3xl font-medium text-[#752432]">{rsvpCount}</div>
                <div className="text-sm text-gray-600">people attending</div>
              </div>

              {/* Attendee List Dropdown */}
              <Collapsible open={showAttendeeList} onOpenChange={setShowAttendeeList}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between text-sm text-gray-600 hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} mb-3"
                  >
                    <span>See who's going</span>
                    {showAttendeeList ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0">
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} mb-4">
                    <div className="grid grid-cols-1 gap-0.5 p-2">
                      {attendeesLoading ? (
                        <div className="text-xs text-gray-500 py-2 text-center">
                          Loading attendees...
                        </div>
                      ) : attendees.length > 0 ? (
                        attendees.map((name, index) => (
                          <div 
                            key={index} 
                            className="text-xs text-gray-700 py-1 px-2 hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded transition-colors"
                          >
                            {name}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 py-2 text-center">
                          No attendees yet
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {!isRSVPed && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Will you be joining us?</p>
                  <Button 
                    onClick={handleRSVP}
                    disabled={rsvpLoading || !user}
                    size="sm" 
                    className="bg-[#752432] hover:bg-[#752432]/90 w-full"
                  >
                    {rsvpLoading ? 'Processing...' : 'Count Me In!'}
                  </Button>
                </div>
              )}
            </Card>

            {/* Weekly Schedule */}



            {/* Contact Info */}
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Questions?</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>Contact the Bar Review Committee:</p>
                <p className="text-[#752432]">barreview@lawschool.edu</p>
                <p>Or find us on social media @LawSchoolBarReview</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}