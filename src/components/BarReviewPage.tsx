import { useState } from 'react';
import { MapPin, Clock, Calendar, Users, ExternalLink, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface BarReviewPageProps {}

export function BarReviewPage({}: BarReviewPageProps) {
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(47);
  const [showAttendeeList, setShowAttendeeList] = useState(false);

  // Mock attendee data - this would typically come from an API
  const attendees = [
    "Sarah Chen", "Michael Rodriguez", "Emily Watson", "David Kim", 
    "Jessica Martinez", "Ryan Thompson", "Amanda Foster", "James Wilson",
    "Lisa Park", "Christopher Lee", "Natalie Brown", "Alexander Garcia",
    "Rachel Johnson", "Tyler Davis", "Megan Adams", "Brandon Miller",
    "Hannah Taylor", "Justin Anderson", "Samantha White", "Kevin Lopez",
    "Ashley Harris", "Daniel Clark", "Olivia Lewis", "Matthew Walker",
    "Chloe Hall", "Nicholas Young", "Victoria King", "Andrew Wright",
    "Sophia Allen", "Ethan Scott", "Grace Turner", "Caleb Phillips",
    "Zoe Campbell", "Lucas Evans", "Ava Mitchell", "Noah Parker",
    "Emma Roberts", "Liam Carter", "Isabella Torres", "Mason Reed",
    "Abigail Cooper", "Logan Bailey", "Madison Rivera", "Jacob Cox",
    "Ella Richardson", "William Ward", "Addison Peterson"
  ];

  // Mock venue data - this would typically come from an API
  const currentVenue = {
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

  const upcomingVenues = [
    { date: "Oct 10", name: "The Plaza Club", address: "702 Langdon St" },
    { date: "Oct 17", name: "State Street Brats", address: "603 State St" },
    { date: "Oct 24", name: "KK's Pub", address: "1934 Monroe St" },
  ];

  const handleRSVP = () => {
    if (!isRSVPed) {
      setRsvpCount(prev => prev + 1);
      setIsRSVPed(true);
      // Add current user to attendees list (simulated)
    } else {
      setRsvpCount(prev => prev - 1);
      setIsRSVPed(false);
      // Remove current user from attendees list (simulated)
    }
  };

  const getCurrentThursday = () => {
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
                    <span>{getCurrentThursday()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>8:00 PM - Late</span>
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
                    {currentVenue.specialOffers.map((offer, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-[#752432] rounded-full"></div>
                        <span>{offer}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RSVP Button */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleRSVP}
                    className={`${
                      isRSVPed 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-[#752432] hover:bg-[#752432]/90'
                    }`}
                  >
                    {isRSVPed ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        You're Going!
                      </>
                    ) : (
                      'RSVP for Tonight'
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
                      {attendees.slice(0, rsvpCount).map((name, index) => (
                        <div 
                          key={index} 
                          className="text-xs text-gray-700 py-1 px-2 hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded transition-colors"
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {!isRSVPed && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Will you be joining us?</p>
                  <Button 
                    onClick={handleRSVP}
                    size="sm" 
                    className="bg-[#752432] hover:bg-[#752432]/90 w-full"
                  >
                    Count Me In!
                  </Button>
                </div>
              )}
            </Card>

            {/* Weekly Schedule */}


            {/* Upcoming Venues */}
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Upcoming Venues</h3>
              <div className="space-y-3">
                {upcomingVenues.map((venue, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{venue.name}</div>
                      <div className="text-xs text-gray-600">{venue.address}</div>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0 ml-2">{venue.date}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600">
                  Venues rotate weekly. Check back for updates!
                </p>
              </div>
            </Card>

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