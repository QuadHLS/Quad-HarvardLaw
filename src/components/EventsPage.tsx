import { useState } from 'react';
import { Search, Calendar, MapPin, Clock, Users, Building, Utensils, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

interface CampusEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'school' | 'firm';
  location?: string;
  description?: string;
  hasLunch: boolean;
  organizer: string;
  attendeeCount?: number;
  maxAttendees?: number;
  category: 'academic' | 'recruiting' | 'social' | 'workshop' | 'networking' | 'information';
}

interface EventsPageProps {
  onAddToCalendar: (event: CampusEvent) => void;
}

export function EventsPage({ onAddToCalendar }: EventsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSchoolEvents, setShowSchoolEvents] = useState(true);
  const [showFirmEvents, setShowFirmEvents] = useState(true);
  const [showLunchEvents, setShowLunchEvents] = useState(true);
  const [showNonLunchEvents, setShowNonLunchEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [compactView, setCompactView] = useState(false);

  // Mock campus events data
  const mockCampusEvents: CampusEvent[] = [
    {
      id: 'ce1',
      title: 'Constitutional Law Study Session',
      date: '2025-09-05',
      startTime: '16:00',
      endTime: '18:00',
      type: 'school',
      location: 'Library Room A',
      description: 'Join fellow students for a comprehensive review session on constitutional law principles and recent cases.',
      hasLunch: false,
      organizer: 'Student Academic Services',
      attendeeCount: 24,
      maxAttendees: 30,
      category: 'academic'
    },
    {
      id: 'ce2',
      title: 'BigLaw Summer Associate Info Session',
      date: '2025-09-05',
      startTime: '18:30',
      endTime: '20:00',
      type: 'firm',
      location: 'Main Auditorium',
      description: 'Learn about summer associate opportunities at top law firms. Panel discussion with current associates.',
      hasLunch: false,
      organizer: 'Cravath, Swaine & Moore',
      attendeeCount: 156,
      maxAttendees: 200,
      category: 'recruiting'
    },
    {
      id: 'ce3',
      title: 'Lunch & Learn: IP Law Trends',
      date: '2025-09-06',
      startTime: '12:00',
      endTime: '13:30',
      type: 'school',
      location: 'Faculty Lounge',
      description: 'Explore the latest trends in intellectual property law with Professor Davis. Lunch will be provided.',
      hasLunch: true,
      organizer: 'IP Law Society',
      attendeeCount: 45,
      maxAttendees: 50,
      category: 'academic'
    },
    {
      id: 'ce4',
      title: 'Mock Trial Competition',
      date: '2025-09-06',
      startTime: '14:00',
      endTime: '17:00',
      type: 'school',
      location: 'Courtroom 1',
      description: 'Annual mock trial competition. Students will argue a complex civil case before real judges.',
      hasLunch: false,
      organizer: 'Mock Trial Society',
      attendeeCount: 32,
      maxAttendees: 40,
      category: 'academic'
    },
    {
      id: 'ce5',
      title: 'Skadden Networking Reception',
      date: '2025-09-07',
      startTime: '17:00',
      endTime: '19:00',
      type: 'firm',
      location: 'Student Center Ballroom',
      description: 'Network with Skadden attorneys and learn about career opportunities. Cocktails and hors d\'oeuvres provided.',
      hasLunch: false,
      organizer: 'Skadden, Arps, Slate, Meagher & Flom',
      attendeeCount: 89,
      maxAttendees: 100,
      category: 'networking'
    },
    {
      id: 'ce6',
      title: 'Legal Writing Workshop',
      date: '2025-09-08',
      startTime: '10:00',
      endTime: '12:00',
      type: 'school',
      location: 'Room 205',
      description: 'Improve your legal writing skills with hands-on exercises and peer review sessions.',
      hasLunch: false,
      organizer: 'Writing Center',
      attendeeCount: 18,
      maxAttendees: 25,
      category: 'workshop'
    },
    {
      id: 'ce7',
      title: 'Environmental Law Lunch Symposium',
      date: '2025-09-08',
      startTime: '12:00',
      endTime: '14:00',
      type: 'school',
      location: 'Green Hall',
      description: 'Symposium on climate change legislation and environmental policy. Includes networking lunch.',
      hasLunch: true,
      organizer: 'Environmental Law Society',
      attendeeCount: 67,
      maxAttendees: 80,
      category: 'academic'
    },
    {
      id: 'ce8',
      title: 'Wachtell Information Session',
      date: '2025-09-09',
      startTime: '18:00',
      endTime: '20:00',
      type: 'firm',
      location: 'Room 150',
      description: 'Learn about opportunities at Wachtell, Lipton, Rosen & Katz. Q&A with partners and associates.',
      hasLunch: false,
      organizer: 'Wachtell, Lipton, Rosen & Katz',
      attendeeCount: 78,
      maxAttendees: 100,
      category: 'information'
    },
    {
      id: 'ce9',
      title: 'Student Bar Association Social',
      date: '2025-09-10',
      startTime: '19:00',
      endTime: '22:00',
      type: 'school',
      location: 'Murphy\'s Pub',
      description: 'Monthly SBA social event. Connect with classmates and enjoy drinks and appetizers.',
      hasLunch: false,
      organizer: 'Student Bar Association',
      attendeeCount: 124,
      maxAttendees: 150,
      category: 'social'
    },
    {
      id: 'ce10',
      title: 'Corporate Law Lunch Series',
      date: '2025-09-11',
      startTime: '12:30',
      endTime: '14:00',
      type: 'school',
      location: 'Faculty Conference Room',
      description: 'Weekly lunch series featuring corporate law practitioners discussing M&A trends. Lunch provided.',
      hasLunch: true,
      organizer: 'Corporate Law Society',
      attendeeCount: 35,
      maxAttendees: 40,
      category: 'academic'
    },
    {
      id: 'ce11',
      title: 'Sullivan & Cromwell Coffee Chat',
      date: '2025-09-11',
      startTime: '16:00',
      endTime: '17:30',
      type: 'firm',
      location: 'Student Lounge',
      description: 'Informal coffee chat with S&C attorneys. Discuss firm culture and summer associate experience.',
      hasLunch: false,
      organizer: 'Sullivan & Cromwell',
      attendeeCount: 42,
      maxAttendees: 50,
      category: 'networking'
    },
    {
      id: 'ce12',
      title: 'Diversity in Law Panel',
      date: '2025-09-12',
      startTime: '17:30',
      endTime: '19:00',
      type: 'school',
      location: 'Main Auditorium',
      description: 'Panel discussion on diversity and inclusion in the legal profession featuring diverse attorneys.',
      hasLunch: false,
      organizer: 'Diversity & Inclusion Committee',
      attendeeCount: 98,
      maxAttendees: 120,
      category: 'academic'
    }
  ];

  const getEventTypeColor = (type: CampusEvent['type']) => {
    switch (type) {
      case 'school':
        return 'bg-[#752432] text-white';
      case 'firm':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getEventTypeLabel = (type: CampusEvent['type']) => {
    switch (type) {
      case 'school':
        return 'School';
      case 'firm':
        return 'Firm';
      default:
        return 'Event';
    }
  };

  const getCategoryColor = (category: CampusEvent['category']) => {
    switch (category) {
      case 'academic':
        return 'bg-green-100 text-green-800';
      case 'recruiting':
        return 'bg-purple-100 text-purple-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      case 'workshop':
        return 'bg-orange-100 text-orange-800';
      case 'networking':
        return 'bg-indigo-100 text-indigo-800';
      case 'information':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentDateEvents = () => {
    if (viewMode === 'day') {
      const today = currentDate.toISOString().split('T')[0];
      return getFilteredEvents().filter(event => event.date === today);
    } else {
      // Week view - return empty array since we'll use getWeekEvents instead
      return [];
    }
  };

  const getWeekEvents = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const weekEvents = [];
    
    // Get events for each day of the week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dayString = dayDate.toISOString().split('T')[0];
      
      const dayEvents = getFilteredEvents().filter(event => event.date === dayString)
        .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());
      
      weekEvents.push({
        date: dayDate,
        dateString: dayString,
        events: dayEvents
      });
    }
    
    return weekEvents;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getFilteredEvents = () => {
    return mockCampusEvents.filter(event => {
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = 
        (event.type === 'school' && showSchoolEvents) ||
        (event.type === 'firm' && showFirmEvents);

      const matchesLunch = 
        (event.hasLunch && showLunchEvents) ||
        (!event.hasLunch && showNonLunchEvents);

      return matchesSearch && matchesType && matchesLunch;
    });
  };

  const currentEvents = getCurrentDateEvents();
  const weekEventsData = viewMode === 'week' ? getWeekEvents() : [];
  const totalWeekEvents = weekEventsData.reduce((total, day) => total + day.events.length, 0);

  const handleAddToCalendar = (event: CampusEvent) => {
    onAddToCalendar(event);
    toast.success(`${event.title} added to your calendar!`);
    setSelectedEvent(null);
  };

  return (
    <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} flex">
      {/* Dark Sidebar */}
      <div className="w-80 bg-[#752432] text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-medium text-white mb-2">Events Calendar</h1>
        </div>

        {/* Mini Calendar */}
        <div className="p-6 border-b border-white/10">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="h-8 w-8 p-0 text-white hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="h-8 w-8 p-0 text-white hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-xs text-white/60 p-2 font-medium">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              
              {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                const isToday = dayDate.toDateString() === new Date().toDateString();
                const isSelected = dayDate.toDateString() === currentDate.toDateString();
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentDate(dayDate)}
                  className={`p-2 text-sm rounded hover:bg-white/10 transition-colors ${
                      isSelected ? 'bg-white/20 text-white' : 
                      isToday ? 'bg-white/10 text-white' : 
                      'text-white/80'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search by keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
            />
          </div>
        </div>

        {/* Event Filters */}
        <div className="p-6 border-b border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Event Types</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="school-toggle" className="text-sm text-white/80">School Events</Label>
                <Switch
                  id="school-toggle"
                  checked={showSchoolEvents}
                  onCheckedChange={setShowSchoolEvents}
                  className="data-[state=checked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20 data-[state=unchecked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="firm-toggle" className="text-sm text-white/80">Firm Events</Label>
                <Switch
                  id="firm-toggle"
                  checked={showFirmEvents}
                  onCheckedChange={setShowFirmEvents}
                  className="data-[state=checked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20 data-[state=unchecked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white mb-3">Food Options</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lunch-toggle" className="text-sm text-white/80">With Food</Label>
                <Switch
                  id="lunch-toggle"
                  checked={showLunchEvents}
                  onCheckedChange={setShowLunchEvents}
                  className="data-[state=checked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20 data-[state=unchecked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="no-lunch-toggle" className="text-sm text-white/80">Without Food</Label>
                <Switch
                  id="no-lunch-toggle"
                  checked={showNonLunchEvents}
                  onCheckedChange={setShowNonLunchEvents}
                  className="data-[state=checked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20 data-[state=unchecked]:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Event Button */}
        <div className="p-6 mt-auto">
          <Button className="w-full bg-white text-[#752432] hover:bg-white/90">
            Submit an Event
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#f9f5f0]">
        {/* Main Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-medium text-gray-900">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <span className="text-sm text-gray-500">
              {viewMode === 'day' ? currentEvents.length : totalWeekEvents} events
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
                className="text-gray-600 hover:text-gray-900"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                className="text-gray-600 hover:text-gray-900"
              >
                Next
              </Button>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
              >
                Week
              </Button>
            </div>

            {/* Compact View Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="compact-view" className="text-sm text-gray-600">Compact View</Label>
              <Switch
                id="compact-view"
                checked={compactView}
                onCheckedChange={setCompactView}
              />
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'day' ? (
            /* Day View */
            currentEvents.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                  <p className="text-gray-600">
                    No events scheduled for this day. Try selecting a different date.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {currentEvents
                  .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime())
                  .map((event) => (
                  <div key={event.id} className="cursor-pointer" onClick={() => setSelectedEvent(event)}>
                    {compactView ? (
                      /* Compact Event Card */
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-medium text-gray-900">
                                {new Date(event.date).getDate()}
                              </div>
                              <div className="text-xs text-gray-500 uppercase">
                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900">{event.title}</h3>
                                <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                                  {getEventTypeLabel(event.type)}
                                </Badge>
                                {event.hasLunch && (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs border-0">
                                    <Utensils className="w-3 h-3 mr-1" />
                                    Food
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{event.startTime} - {event.endTime}</span>
                                {event.location && <span>{event.location}</span>}
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-[#752432] hover:bg-[#752432]/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCalendar(event);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      /* Full Event Card */
                      <Card className="p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-6">
                          {/* Date Column */}
                          <div className="text-center flex-shrink-0">
                            <div className="bg-[#752432] text-white rounded-lg p-3 mb-2">
                              <div className="text-2xl font-medium">
                                {new Date(event.date).getDate()}
                              </div>
                              <div className="text-xs uppercase">
                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </div>

                          {/* Event Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-medium text-gray-900">{event.title}</h3>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getEventTypeColor(event.type)}`}>
                                      {getEventTypeLabel(event.type)}
                                    </Badge>
                                    <Badge variant="outline" className={`${getCategoryColor(event.category)} border-0`}>
                                      {event.category}
                                    </Badge>
                                    {event.hasLunch && (
                                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-0">
                                        <Utensils className="w-4 h-4 mr-1" />
                                        Food Provided
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-gray-600 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{event.startTime} - {event.endTime}</span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Building className="w-4 h-4" />
                                    <span>{event.organizer}</span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                className="bg-[#752432] hover:bg-[#752432]/90"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCalendar(event);
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Calendar
                              </Button>
                            </div>
                            
                            <p className="text-gray-700 mb-3">{event.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>{event.attendeeCount ?? 0} attending</span>
                                {typeof event.maxAttendees === 'number' && (
                                  <span>• {(event.maxAttendees ?? 0) - (event.attendeeCount ?? 0)} spots left</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Week View - Grouped by Day */
            totalWeekEvents === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                  <p className="text-gray-600">
                    No events scheduled for this week. Try selecting a different week or adjusting your filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {weekEventsData.map((dayData) => (
                  <div key={dayData.dateString}>
                    {/* Day Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-2xl font-medium text-gray-900">
                            {dayData.date.getDate()}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">
                            {dayData.date.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {dayData.date.toLocaleDateString('en-US', { weekday: 'long' })}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {dayData.events.length} event{dayData.events.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Events for this day */}
                    {dayData.events.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-sm">No events scheduled</div>
                      </div>
                    ) : (
                      <div className="space-y-4 ml-8">
                        {dayData.events.map((event) => (
                          <div key={event.id} className="cursor-pointer" onClick={() => setSelectedEvent(event)}>
                            <Card className="p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                                        {getEventTypeLabel(event.type)}
                                      </Badge>
                                      <Badge variant="outline" className={`${getCategoryColor(event.category)} text-xs border-0`}>
                                        {event.category}
                                      </Badge>
                                      {event.hasLunch && (
                                        <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs border-0">
                                          <Utensils className="w-3 h-3 mr-1" />
                                          Food
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{event.startTime} - {event.endTime}</span>
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.location}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Building className="w-4 h-4" />
                                      <span>{event.organizer}</span>
                                    </div>
                                  </div>
                                  
                                  <p className="text-gray-700 text-sm line-clamp-2">{event.description}</p>
                                </div>
                                
                                <Button 
                                  size="sm" 
                                  className="bg-[#752432] hover:bg-[#752432]/90 ml-4"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCalendar(event);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </Card>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent 
          className="max-w-2xl"
          aria-describedby="event-detail-description"
        >
          <div id="event-detail-description" className="sr-only">
            Event details for {selectedEvent?.title}
          </div>
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-xl mb-2">{selectedEvent.title}</DialogTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${getEventTypeColor(selectedEvent.type)}`}>
                        {getEventTypeLabel(selectedEvent.type)}
                      </Badge>
                      <Badge variant="outline" className={`${getCategoryColor(selectedEvent.category)} border-0`}>
                        {selectedEvent.category}
                      </Badge>
                      {selectedEvent.hasLunch && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-0">
                          <Utensils className="w-3 h-3 mr-1" />
                          Food Provided
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    className="bg-[#752432] hover:bg-[#752432]/90"
                    onClick={() => handleAddToCalendar(selectedEvent)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                <DialogDescription className="text-base">
                  {selectedEvent.description}
                </DialogDescription>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                      </div>
                      {selectedEvent.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{selectedEvent.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{selectedEvent.organizer}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Attendance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
            <span>{selectedEvent.attendeeCount ?? 0} registered</span>
                      </div>
                      {typeof selectedEvent.maxAttendees === 'number' && (
                        <div className="text-gray-600">
                          {(selectedEvent.maxAttendees ?? 0) - (selectedEvent.attendeeCount ?? 0)} spots remaining
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}