import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Clock, MapPin, Users, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'exam' | 'assignment' | 'study' | 'meeting' | 'personal';
  course?: string;
  location?: string;
  description?: string;
}

interface CalendarPageProps {
  additionalEvents?: CalendarEvent[];
}

interface HLSDate {
  id: string;
  date: string;
  event: string;
  description?: string;
}

export function CalendarPage({ additionalEvents = [] }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isAcademicYearCollapsed, setIsAcademicYearCollapsed] = useState(true);
  const [isTodayEventsCollapsed, setIsTodayEventsCollapsed] = useState(false);
  const [isUpcomingEventsCollapsed, setIsUpcomingEventsCollapsed] = useState(false);
  
  // Event type filters
  const [showClasses, setShowClasses] = useState(true);
  const [showClubMeetings, setShowClubMeetings] = useState(true);
  const [showLunchEvents, setShowLunchEvents] = useState(true);
  const [showRecruitingEvents, setShowRecruitingEvents] = useState(true);
  const [showOtherEvents, setShowOtherEvents] = useState(true);

  // Mock HLS dates - sorted chronologically
  const hlsDates: HLSDate[] = [
    {
      id: '2',
      date: 'September 1, 2025',
      event: 'Fall Semester Begins',
      description: 'First day of classes for fall semester'
    },
    {
      id: '1',
      date: 'October 10, 2025',
      event: 'New Student Orientation',
      description: 'Welcome and introduction for first-year students'
    },
    {
      id: '9',
      date: 'October 15, 2025',
      event: 'Alumni Weekend',
      description: 'Annual alumni reunion and events'
    },
    {
      id: '3',
      date: 'November 25-29, 2025',
      event: 'Thanksgiving Break',
      description: 'University closed for Thanksgiving holiday'
    },
    {
      id: '4',
      date: 'December 15, 2025',
      event: 'Fall Semester Ends',
      description: 'Last day of classes for fall semester'
    },
    {
      id: '5',
      date: 'January 20, 2026',
      event: 'Spring Semester Begins',
      description: 'First day of classes for spring semester'
    },
    {
      id: '10',
      date: 'February 14, 2026',
      event: 'Bar Review Information Session',
      description: 'Overview of bar exam preparation programs'
    },
    {
      id: '6',
      date: 'March 15-22, 2026',
      event: 'Spring Break',
      description: 'Spring recess week'
    },
    {
      id: '7',
      date: 'May 15, 2026',
      event: 'Spring Semester Ends',
      description: 'Last day of classes for spring semester'
    },
    {
      id: '8',
      date: 'May 25, 2026',
      event: 'Commencement',
      description: 'Graduation ceremony'
    }
  ];

  // Mock events data
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Torts Class',
      date: '2025-09-05',
      startTime: '9:00',
      endTime: '10:30',
      type: 'class',
      course: 'Torts',
      location: 'Room 204',
      description: 'Negligence and Strict Liability'
    },
    {
      id: '2',
      title: 'Property Law Class',
      date: '2025-09-05',
      startTime: '11:30',
      endTime: '12:30',
      type: 'class',
      course: 'Property Law',
      location: 'Room 150',
      description: 'Real Property Rights'
    },
    {
      id: '3',
      title: 'Constitutional Law Exam',
      date: '2025-09-08',
      startTime: '14:00',
      endTime: '17:00',
      type: 'exam',
      course: 'Constitutional Law',
      location: 'Hall A',
      description: 'Midterm Examination'
    },
    {
      id: '4',
      title: 'Civil Procedure Assignment Due',
      date: '2025-09-08',
      startTime: '23:59',
      endTime: '23:59',
      type: 'assignment',
      course: 'Civil Procedure',
      description: 'Research Paper on Jurisdiction'
    },
    {
      id: '5',
      title: 'Study Group - Contract Law',
      date: '2025-09-06',
      startTime: '15:00',
      endTime: '17:00',
      type: 'study',
      course: 'Contract Law',
      location: 'Library Room B',
      description: 'Review for upcoming quiz'
    },
    {
      id: '6',
      title: 'Law Review Meeting',
      date: '2025-09-05',
      startTime: '20:00',
      endTime: '22:00',
      type: 'meeting',
      location: 'Murphy\'s Pub',
      description: 'Weekly club meeting'
    },
    {
      id: '7',
      title: 'Evidence Class',
      date: '2025-09-09',
      startTime: '10:00',
      endTime: '11:30',
      type: 'class',
      course: 'Evidence',
      location: 'Room 301',
      description: 'Hearsay Rules'
    },
    {
      id: '8',
      title: 'Office Hours - Prof. Johnson',
      date: '2025-09-10',
      startTime: '14:00',
      endTime: '16:00',
      type: 'meeting',
      course: 'Torts',
      location: 'Office 412',
      description: 'Discuss assignment questions'
    },
    {
      id: '9',
      title: 'Lunch & Learn: IP Law',
      date: '2025-09-07',
      startTime: '12:00',
      endTime: '13:00',
      type: 'personal',
      location: 'Faculty Lounge',
      description: 'Lunch event with guest speaker'
    },
    {
      id: '10',
      title: 'BigLaw Recruiting Event',
      date: '2025-09-11',
      startTime: '18:00',
      endTime: '20:00',
      type: 'personal',
      location: 'Main Auditorium',
      description: 'Career networking opportunity'
    },
    {
      id: '11',
      title: 'Student Bar Association Meeting',
      date: '2025-09-12',
      startTime: '17:00',
      endTime: '18:00',
      type: 'meeting',
      location: 'Room 205',
      description: 'Monthly SBA meeting'
    }
  ];

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'class':
        return 'bg-[#752432] text-white';
      case 'exam':
        return 'bg-rose-500 text-white';
      case 'assignment':
        return 'bg-amber-500 text-white';
      case 'study':
        return 'bg-slate-500 text-white';
      case 'meeting':
        return 'bg-emerald-500 text-white';
      case 'personal':
        return 'bg-indigo-500 text-white';
      default:
        return 'text-white';
    }
  };

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'class':
        return 'Class';
      case 'exam':
        return 'Exam';
      case 'assignment':
        return 'Assignment';
      case 'study':
        return 'Study';
      case 'meeting':
        return 'Meeting';
      case 'personal':
        return 'Personal';
      default:
        return 'Event';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    const filteredEvents = getFilteredEvents();
    return filteredEvents.filter(event => event.date === today);
  };

  const getUpcomingEvents = () => {
    const filteredEvents = getFilteredEvents();
    return filteredEvents
      .filter(event => new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const parseAndNavigateToDate = (dateString: string) => {
    // Handle date ranges by taking the first date
    const cleanDateString = dateString.includes('-') ? dateString.split('-')[0].trim() : dateString;
    
    try {
      // Parse dates in format "October 10, 2025" or "September 1, 2025"
      const parsedDate = new Date(cleanDateString);
      
      // Check if the date is valid
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
        setSelectedDate(parsedDate);
      }
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
    }
  };

  const handleDayClick = (day: number) => {
    const selectedDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selectedDay);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getFilteredEvents = () => {
    // Combine mock events with additional events from Events page
    const allEvents = [...mockEvents, ...additionalEvents];
    return allEvents.filter(event => {
      switch (event.type) {
        case 'class':
          return showClasses;
        case 'meeting':
          if (event.title.toLowerCase().includes('lunch') || event.description?.toLowerCase().includes('lunch')) {
            return showLunchEvents;
          } else if (event.title.toLowerCase().includes('recruiting') || event.description?.toLowerCase().includes('recruiting')) {
            return showRecruitingEvents;
          }
          return showClubMeetings;
        case 'personal':
          if (event.title.toLowerCase().includes('lunch') || event.description?.toLowerCase().includes('lunch')) {
            return showLunchEvents;
          } else if (event.title.toLowerCase().includes('recruiting') || event.description?.toLowerCase().includes('recruiting')) {
            return showRecruitingEvents;
          }
          return showOtherEvents;
        default:
          return showOtherEvents;
      }
    });
  };

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    
    const filteredEvents = getFilteredEvents();
    return filteredEvents.filter(event => event.date === dateStr);
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      <div className="flex-1 p-4 pl-2 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-medium text-gray-900 mb-2">Calendar</h1>
            <p className="text-gray-600">Manage your academic schedule and events</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-lg" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
              >
                Month
              </Button>
            </div>
            <Button className="bg-[#752432] hover:bg-[#752432]/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          {/* Event Filters & Academic Year */}
          <div className="lg:col-span-1 space-y-4 flex flex-col min-h-0">
            {/* Event Filters */}
            <Card className="overflow-hidden">
              <div className="bg-[#752432] text-white p-4 pb-3">
                <h3 className="font-medium text-white">Event Filters</h3>
              </div>
              <div className="p-3 pt-0 -mt-3" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="class-toggle" className="text-sm">Class</Label>
                    <Switch
                      id="class-toggle"
                      checked={showClasses}
                      onCheckedChange={setShowClasses}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="club-toggle" className="text-sm">Club Meetings</Label>
                    <Switch
                      id="club-toggle"
                      checked={showClubMeetings}
                      onCheckedChange={setShowClubMeetings}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm">Events</Label>
                    <div className="pl-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lunch-toggle" className="text-xs text-gray-600">Lunch</Label>
                        <Switch
                          id="lunch-toggle"
                          checked={showLunchEvents}
                          onCheckedChange={setShowLunchEvents}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="recruiting-toggle" className="text-xs text-gray-600">Recruiting</Label>
                        <Switch
                          id="recruiting-toggle"
                          checked={showRecruitingEvents}
                          onCheckedChange={setShowRecruitingEvents}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="other-toggle" className="text-xs text-gray-600">Other</Label>
                        <Switch
                          id="other-toggle"
                          checked={showOtherEvents}
                          onCheckedChange={setShowOtherEvents}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Academic Year Dates */}
            <Card className={`overflow-hidden flex flex-col ${!isAcademicYearCollapsed ? 'flex-1 min-h-0' : ''}`}>
              <div className="bg-[#752432] text-white p-4 pb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsAcademicYearCollapsed(!isAcademicYearCollapsed)}
                >
                  <h3 className="font-medium text-white">Academic Year 2025-2026</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-white/20"
                  >
                    {isAcademicYearCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-white" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>
              
              {!isAcademicYearCollapsed && (
                <div className="flex-1 min-h-0" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                  <div className="p-3 pt-3 h-full overflow-y-auto">
                    <div className="space-y-3">
                      {hlsDates.map((hlsDate) => (
                        <div key={hlsDate.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                          <div 
                            className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                            onClick={() => parseAndNavigateToDate(hlsDate.date)}
                          >
                            <div className="flex-shrink-0 mt-1">
                              <CalendarIcon className="w-3 h-3 text-[#752432]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900">
                                {hlsDate.event}
                              </p>
                              <p className="text-xs text-[#752432] font-medium hover:underline">
                                {hlsDate.date}
                              </p>
                              {hlsDate.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {hlsDate.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <Card className="overflow-hidden flex flex-col flex-1 min-h-0">
              {/* Calendar Header */}
              <div className="bg-[#752432] text-white p-4 pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">
                    {formatDate(currentDate)}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-white/20 text-white"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-white/20 text-white"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-white/20 text-white"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="flex-1 min-h-0 flex flex-col" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                {/* Week day headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-sm font-medium text-gray-500" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 flex-1 overflow-hidden">
                  {calendarDays.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = day && 
                      new Date().toDateString() === 
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    const isSelected = day && selectedDate &&
                      selectedDate.toDateString() === 
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`p-2 border-b border-r border-gray-200 flex flex-col ${
                          day ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`}
                        style={{ minHeight: '120px' }}
                        onClick={() => day && handleDayClick(day)}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${
                              isSelected
                                ? 'text-white bg-[#752432] w-6 h-6 rounded-full flex items-center justify-center'
                                : isToday && selectedDate === null
                                ? 'text-white bg-[#752432] w-6 h-6 rounded-full flex items-center justify-center'
                                : isToday && selectedDate !== null
                                ? 'text-gray-600 bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center' 
                                : 'text-gray-900'
                            }`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.type)}`}
                                  title={`${event.title} (${event.startTime} - ${event.endTime})`}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4 flex flex-col min-h-0">
            {/* Today's Events */}
            <Card className="overflow-hidden">
              <div className="bg-[#752432] text-white p-4 pb-3">
                <h3 className="font-medium text-white">Today's Events</h3>
              </div>
              
              <div className="p-3 pt-0 -mt-3" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                {todayEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">No events scheduled for today</p>
                ) : (
                  <div className="space-y-3">
                    {todayEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                            {getEventTypeLabel(event.type)}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="overflow-hidden">
              <div className="bg-[#752432] text-white p-4 pb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsUpcomingEventsCollapsed(!isUpcomingEventsCollapsed)}
                >
                  <h3 className="font-medium text-white">Upcoming Events</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-white/20"
                  >
                    {isUpcomingEventsCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-white" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </div>
              </div>
              
              {!isUpcomingEventsCollapsed && (
                <div className="p-3 pt-0 -mt-3" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming events</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{event.startTime} - {event.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <CalendarIcon className="w-3 h-3" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}