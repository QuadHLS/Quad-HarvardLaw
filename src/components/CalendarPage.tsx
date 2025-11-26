import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Calendar as CalendarIcon,
  X,
  LayoutGrid,
  List,
  MapPin,
  Users,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';

// ToggleGroup Component
interface ToggleGroupProps {
  type?: 'single' | 'multiple';
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const ToggleGroup: React.FC<ToggleGroupProps> = ({
  value,
  onValueChange,
  children,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-gray-300 overflow-hidden',
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement<ToggleGroupItemProps>(child)) {
          const childValue = (child.props as ToggleGroupItemProps).value;
          return React.cloneElement(child, {
            isSelected: childValue === value,
            onClick: () => onValueChange(childValue),
          });
        }
        return child;
      })}
    </div>
  );
};

interface ToggleGroupItemProps {
  value: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

const ToggleGroupItem: React.FC<ToggleGroupItemProps> = ({
  value,
  children,
  isSelected,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <button
      className={cn(
        'px-3 py-1.5 text-sm border-none bg-transparent text-gray-700 cursor-pointer transition-all border-r border-gray-300 last:border-r-0 hover:bg-gray-100',
        isSelected && 'bg-[#752432] text-white hover:bg-[#5A1C28]',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Helper function to get organization abbreviation
const getOrgAbbreviation = (orgName: string | undefined): string => {
  if (!orgName) return '';
  return orgName;
};

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  course?: string;
  location?: string;
  organization?: string;
  description?: string;
}

interface CalendarPageProps {
  additionalEvents?: Event[];
}

export function CalendarPage({ additionalEvents = [] }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showEventsMenu, setShowEventsMenu] = useState(false);
  const [isClosingEventsMenu, setIsClosingEventsMenu] = useState(false);
  const [eventsViewMode, setEventsViewMode] = useState<'grid' | 'list'>('grid');
  const [addedEventIds, setAddedEventIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOrgFilterDialog, setShowOrgFilterDialog] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [eventsFilter, setEventsFilter] = useState<'all' | 'my-events'>('all');
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    type: 'personal',
    location: '',
    description: '',
  });
  const [customEvents, setCustomEvents] = useState<Event[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calendar category filters
  const [showClasses, setShowClasses] = useState(true);
  const [showClubEvents, setShowClubEvents] = useState(true);
  const [showOther, setShowOther] = useState(true);

  // Scroll to top on mount
  useEffect(() => {
    if (scrollRef.current && viewMode === 'week') {
      scrollRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  const allEvents = [...additionalEvents, ...customEvents];

  // Filter events based on category checkboxes
  const filterEventsByCategory = (event: Event): boolean => {
    if (event.type === 'class') {
      return showClasses;
    } else if (event.type === 'club-event') {
      return showClubEvents;
    } else {
      return showOther;
    }
  };

  const filteredEvents = allEvents.filter(filterEventsByCategory);

  // Handler to add event to calendar
  const handleAddEvent = (eventId: string) => {
    if (!addedEventIds.includes(eventId)) {
      setAddedEventIds([...addedEventIds, eventId]);
    }
  };

  // Handler to remove event from calendar
  const handleRemoveEvent = (eventId: string) => {
    setAddedEventIds(addedEventIds.filter((id) => id !== eventId));
  };

  // Handler to toggle event
  const handleToggleEvent = (eventId: string) => {
    if (addedEventIds.includes(eventId)) {
      handleRemoveEvent(eventId);
    } else {
      handleAddEvent(eventId);
    }
  };

  // Check if an event is on the calendar
  const isEventOnCalendar = (event: Event): boolean => {
    return event.type === 'class' || addedEventIds.includes(event.id);
  };

  // Handler to create new event
  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      return;
    }

    const createdEvent: Event = {
      id: `custom-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      type: newEvent.type || 'personal',
      location: newEvent.location,
      description: newEvent.description,
    };

    setCustomEvents([...customEvents, createdEvent]);
    setAddedEventIds([...addedEventIds, createdEvent.id]);
    setShowCreateDialog(false);

    // Reset form
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      type: 'personal',
      location: '',
      description: '',
    });
  };

  const getCourseColor = (_course?: string): string => {
    // Return default color for all courses
    // Course-specific colors should come from the database
    return '#3B82F6';
  };

  const getEventColor = (event: Event): string => {
    if (event.type === 'class') {
      return getCourseColor(event.course);
    }
    switch (event.type) {
      case 'exam':
        return '#DC2626';
      case 'assignment':
        return '#F59E0B';
      case 'study':
        return '#64748B';
      case 'meeting':
        return '#10B981';
      case 'personal':
        return '#6366F1';
      case 'lunch':
        return '#10B981';
      case 'panel':
        return '#3B82F6';
      case 'club-event':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      if (direction === 'prev') {
        newDate.setDate(currentDate.getDate() - 1);
      } else {
        newDate.setDate(currentDate.getDate() + 1);
      }
    } else if (viewMode === 'week') {
      if (direction === 'prev') {
        newDate.setDate(currentDate.getDate() - 7);
      } else {
        newDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      if (direction === 'prev') {
        newDate.setMonth(currentDate.getMonth() - 1);
      } else {
        newDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekDays = (): Date[] => {
    if (viewMode === 'day') {
      return [currentDate];
    }

    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getEventsForDay = (day: Date): Event[] => {
    const dateStr = day.toISOString().split('T')[0];
    return filteredEvents.filter(
      (event) => event.date === dateStr && isEventOnCalendar(event)
    );
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const weekDays = getWeekDays();
  const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();

  // Generate hours from 12 AM to 11 PM
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get current time for the red line indicator
  const now = new Date();
  const currentTimePosition = now.getHours() + now.getMinutes() / 60;

  // Get month calendar days for month view
  const getMonthCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day: day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Next month days to fill grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day: day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day),
      });
    }

    return days;
  };

  // Mini calendar helper
  const getMiniCalendarDays = (): (number | null)[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const miniCalendarDays = getMiniCalendarDays();
  const monthCalendarDays = getMonthCalendarDays();

  // Get events for the current view
  const getEventsForCurrentView = (): Event[] => {
    let events = filteredEvents.filter((event) => event.type !== 'class');

    if (eventsFilter === 'my-events') {
      events = events.filter((event) => addedEventIds.includes(event.id));
    }

    if (viewMode === 'day') {
      const dateStr = currentDate.toISOString().split('T')[0];
      return events.filter((event) => event.date === dateStr);
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays();
      const weekDateStrs = weekDays.map((d) => d.toISOString().split('T')[0]);
      return events.filter((event) => weekDateStrs.includes(event.date));
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      return events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      });
    }
  };

  // Group events by day
  const groupEventsByDay = (events: Event[]): Record<string, Event[]> => {
    const grouped: Record<string, Event[]> = {};
    events.forEach((event) => {
      const date = new Date(event.date);
      const dayName = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }
      grouped[dayName].push(event);
    });
    return grouped;
  };

  const currentViewEvents = getEventsForCurrentView();
  const groupedEvents = viewMode !== 'day' ? groupEventsByDay(currentViewEvents) : {};

  return (
    <div
      className="h-full flex flex-col calendar-page"
      style={{ backgroundColor: '#f9f5f2' }}
    >
      <style>{`
        .calendar-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }
        
        /* Dialog overlay styles - override default Dialog styles */
        .calendar-page [data-slot="dialog-overlay"] {
          background-color: rgba(0, 0, 0, 0.5) !important;
          animation: fadeIn 0.2s;
        }
        
        .calendar-page [data-slot="dialog-content"] {
          background-color: #FEFBF6 !important;
          border: 1px solid #E5DFD4 !important;
          border-radius: 0.5rem !important;
          padding: 1.5rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          animation: zoomIn 0.2s;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoomIn {
          from { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
        
        .calendar-page .events-panel {
          animation: slideInFromRight 0.3s ease-out;
        }
        
        .calendar-page .events-panel.closing {
          animation: slideOutToRight 0.3s ease-in;
        }
        
        /* Input field styling to match original */
        .calendar-page input[type="text"],
        .calendar-page input[type="date"],
        .calendar-page input[type="time"],
        .calendar-page select,
        .calendar-page textarea {
          border: 1px solid #D1D5DB;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        
        .calendar-page input[type="text"]:focus,
        .calendar-page input[type="date"]:focus,
        .calendar-page input[type="time"]:focus,
        .calendar-page select:focus,
        .calendar-page textarea:focus {
          outline: none;
          ring: 2px;
          ring-color: #752432;
          border-color: transparent;
        }
        
        /* Hide scrollbar but keep scrolling functionality */
        .calendar-page,
        .calendar-page * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .calendar-page ::-webkit-scrollbar,
        .calendar-page * ::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
          width: 0;
          height: 0;
        }
        
        /* Ensure Tailwind opacity classes work */
        .calendar-page .bg-blue-50\\/30 {
          background-color: rgba(239, 246, 255, 0.3);
        }
        
        /* Checkbox styling for calendar categories */
        .calendar-page input[type="checkbox"] {
          position: relative;
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid #D1D5DB;
          border-radius: 3px;
          cursor: pointer;
          background-color: white;
        }
        
        .calendar-page input[type="checkbox"].checkbox-classes:checked {
          background-color: #752432;
          border-color: #752432;
        }
        
        .calendar-page input[type="checkbox"].checkbox-club-events:checked {
          background-color: #8B5CF6;
          border-color: #8B5CF6;
        }
        
        .calendar-page input[type="checkbox"].checkbox-other:checked {
          background-color: #10B981;
          border-color: #10B981;
        }
        
        /* Make checkmark black for all checkboxes */
        .calendar-page input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid #000000;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5DFD4] bg-[#F8F4ED]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5 3h14v2H5z"/>
                <path fill="#4285F4" d="M3 5h2v14H3z"/>
                <path fill="#34A853" d="M19 5h2v14h-2z"/>
                <path fill="#FBBC04" d="M5 19h14v2H5z"/>
                <rect x="7" y="7" width="10" height="10" fill="#fff" stroke="#DADCE0" strokeWidth="2"/>
                <text x="12" y="15" fontSize="8" fill="#5F6368" textAnchor="middle" fontWeight="bold">22</text>
              </svg>
            </div>
            <span className="text-xl text-gray-700">Calendar</span>
          </div>

          <Button variant="outline" onClick={goToToday} className="border-gray-300 text-gray-700 hover:bg-gray-100">
            Today
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="h-9 w-9 p-0 text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
              className="h-9 w-9 p-0 text-gray-700 hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <h2 className="text-xl text-gray-700">{formatDate(currentDate)}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as 'day' | 'week' | 'month')}
              className="border border-gray-300 rounded-lg"
            >
              <ToggleGroupItem value="day" aria-label="Day view" className="text-gray-700">
                Day
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Week view" className="text-gray-700">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Month view" className="text-gray-700">
                Month
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Events Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (showEventsMenu) {
                setIsClosingEventsMenu(true);
                setTimeout(() => {
                  setShowEventsMenu(false);
                  setIsClosingEventsMenu(false);
                }, 300);
              } else {
                setShowEventsMenu(true);
              }
            }}
            className={cn(
              'border-gray-300 text-gray-700 hover:bg-[#F5F1E8] gap-2',
              showEventsMenu && 'bg-[#F5F1E8]'
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            Events
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettingsDialog(true)}
            className="h-9 w-9 p-0 text-gray-600 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-56 border-r border-[#E5DFD4] bg-[#F8F4ED] flex flex-col">
          <div className="p-4">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-[#F5F1E8] shadow-sm justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create
            </Button>
          </div>

          {/* Mini Calendar */}
          <div className="px-4 pb-4">
            <div className="text-sm mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDayLabels.map((label, idx) => (
                  <div key={idx} className="text-xs text-gray-500 py-1">
                    {label}
                  </div>
                ))}
                {miniCalendarDays.map((day, index) => {
                  const isToday =
                    day &&
                    new Date().toDateString() ===
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                  const isSelected =
                    day &&
                    currentDate.getDate() === day &&
                    currentDate.getMonth() ===
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getMonth();

                  const dayDate = day
                    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    : null;

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (day && dayDate) {
                          setCurrentDate(dayDate);
                        }
                      }}
                      className={cn(
                        'text-xs py-1 rounded-full cursor-pointer transition-colors',
                        day
                          ? isToday && isSelected
                            ? 'bg-[#752432] text-white font-medium'
                            : isToday
                            ? 'bg-[#752432] text-white font-medium'
                            : isSelected
                            ? 'bg-[#F5F1E8] text-gray-900 font-medium ring-2 ring-[#752432] ring-inset'
                            : 'text-gray-700 hover:bg-[#F5F1E8]'
                          : ''
                      )}
                    >
                      {day || ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* My Calendars */}
          <div className="px-4 pb-4 flex-1 overflow-y-auto">
            <div className="text-sm text-gray-700 font-medium mb-2">My calendars</div>
            <div className="space-y-1">
              <div
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#F5F1E8] rounded px-2"
                onClick={() => setShowClasses(!showClasses)}
              >
                <input
                  type="checkbox"
                  checked={showClasses}
                  onChange={(e) => {
                    e.stopPropagation();
                    setShowClasses(!showClasses);
                  }}
                  className="rounded checkbox-classes"
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm text-gray-700 truncate">Classes</span>
                </div>
              </div>
              <div
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#F5F1E8] rounded px-2"
                onClick={() => setShowClubEvents(!showClubEvents)}
              >
                <input
                  type="checkbox"
                  checked={showClubEvents}
                  onChange={(e) => {
                    e.stopPropagation();
                    setShowClubEvents(!showClubEvents);
                  }}
                  className="rounded checkbox-club-events"
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#8B5CF6' }} />
                  <span className="text-sm text-gray-700 truncate">Club Events</span>
                </div>
              </div>
              <div
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#F5F1E8] rounded px-2"
                onClick={() => setShowOther(!showOther)}
              >
                <input
                  type="checkbox"
                  checked={showOther}
                  onChange={(e) => {
                    e.stopPropagation();
                    setShowOther(!showOther);
                  }}
                  className="rounded checkbox-other"
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-sm text-gray-700 truncate">Other</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar View - Continue in next part due to length */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {viewMode === 'month' ? (
            // Month View
            <div className="flex-1 flex flex-col bg-[#FEFBF6]">
              {/* Month header */}
              <div className="border-b-2 border-[#E5DFD4] bg-[#F8F4ED]">
                <div className="grid grid-cols-7">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                    (day, idx) => (
                      <div
                        key={idx}
                        className="border-r border-[#E5DFD4] py-3 text-center last:border-r-0 bg-gradient-to-b from-[#F8F4ED] to-[#F5F1E8] shadow-sm"
                      >
                        <div className="text-sm font-bold text-gray-800 tracking-wide uppercase">
                          {day}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex-1 grid grid-rows-6 overflow-y-auto">
                {Array.from({ length: 6 }).map((_, weekIdx) => (
                  <div key={weekIdx} className="grid grid-cols-7 flex-1">
                    {monthCalendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((dayObj, dayIdx) => {
                      const isToday = dayObj.date.toDateString() === today.toDateString();
                      const events = getEventsForDay(dayObj.date);
                      const nonClassEvents = events.filter((event) => event.type !== 'class');

                      return (
                        <div
                          key={dayIdx}
                          className={cn(
                            'border-r border-b border-[#E5DFD4] last:border-r-0 p-2',
                            !dayObj.isCurrentMonth ? 'bg-[#F5F1E8]' : 'bg-[#FEFBF6]',
                            isToday && 'bg-blue-50/30'
                          )}
                        >
                          <div
                            className={cn(
                              'text-sm mb-1',
                              isToday
                                ? 'bg-[#752432] text-white rounded-full w-6 h-6 flex items-center justify-center font-medium'
                                : dayObj.isCurrentMonth
                                ? 'text-gray-700'
                                : 'text-gray-400'
                            )}
                          >
                            {dayObj.day}
                          </div>
                          <div className="space-y-1">
                            {nonClassEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                                style={{ backgroundColor: getEventColor(event), color: 'white' }}
                              >
                                {event.startTime} {event.title}
                              </div>
                            ))}
                            {nonClassEvents.length > 3 && (
                              <div className="text-xs text-gray-500 pl-1">
                                +{nonClassEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Week/Day View
            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#FEFBF6]">
              <div className="relative min-h-full">
                {/* Header Row - Sticky */}
                <div className="sticky top-0 z-40 bg-[#F8F4ED] border-b-2 border-[#E5DFD4]">
                  <div 
                    className="grid"
                    style={{
                      gridTemplateColumns: viewMode === 'day' 
                        ? '60px 1fr' 
                        : '60px repeat(7, minmax(0, 1fr))'
                    }}
                  >
                    {/* Empty time column header - fixed width */}
                    <div className="border-r border-[#E5DFD4] bg-[#F8F4ED]"></div>
                    
                    {/* Day headers */}
                    {viewMode === 'day' ? (
                      (() => {
                        const day = currentDate;
                        const isToday = day.toDateString() === today.toDateString();

                        return (
                          <div className="border-r border-[#E5DFD4] py-3 px-2 text-center bg-gradient-to-b from-[#F8F4ED] to-[#F5F1E8] shadow-sm">
                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                              {day.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                            </div>
                            <div
                              className={cn(
                                'text-xl font-medium inline-flex items-center justify-center',
                                isToday && 'bg-[#752432] text-white rounded-full w-10 h-10'
                              )}
                              style={{ marginTop: '4px' }}
                            >
                              {day.getDate()}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      weekDays.map((day, idx) => {
                        const isToday = day.toDateString() === today.toDateString();
                        return (
                          <div
                            key={idx}
                            className="border-r border-[#E5DFD4] last:border-r-0 py-3 text-center bg-gradient-to-b from-[#F8F4ED] to-[#F5F1E8] shadow-sm"
                          >
                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                              {day.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                            </div>
                            <div
                              className={cn(
                                'text-xl font-medium inline-flex items-center justify-center',
                                isToday && 'bg-[#752432] text-white rounded-full w-10 h-10'
                              )}
                              style={{ marginTop: '4px' }}
                            >
                              {day.getDate()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Time Rows */}
                <div className="relative">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="grid"
                      style={{
                        height: '60px',
                        gridTemplateColumns: viewMode === 'day' 
                          ? '60px 1fr' 
                          : '60px repeat(7, minmax(0, 1fr))'
                      }}
                    >
                      {/* Time label - fixed width */}
                      <div className="border-r border-[#E5DFD4] pr-2 text-right bg-[#F8F4ED] relative" style={{ paddingTop: 0 }}>
                        <span className="text-xs text-gray-500 absolute" style={{ top: '-6px', right: '8px', lineHeight: '1' }}>
                          {hour === 0
                            ? '12 AM'
                            : hour < 12
                            ? `${hour} AM`
                            : hour === 12
                            ? '12 PM'
                            : `${hour - 12} PM`}
                        </span>
                      </div>
                      
                      {/* Day columns */}
                      {viewMode === 'day' ? (
                        (() => {
                          const day = currentDate;
                          const isToday = day.toDateString() === today.toDateString();
                          const events = getEventsForDay(day);
                          // Get all events that overlap with this hour
                          const hourEvents = events.filter((event) => {
                            const eventStart = parseTime(event.startTime);
                            const eventEnd = parseTime(event.endTime);
                            // Event overlaps with this hour if it starts before hour+1 and ends after hour
                            return eventStart < hour + 1 && eventEnd > hour;
                          });

                          return (
                            <div
                              className={cn(
                                'relative border-r border-b border-[#E5DFD4]',
                                isToday ? 'bg-blue-50/30' : 'bg-[#FEFBF6]'
                              )}
                            >
                              {/* Current time indicator */}
                              {isToday && hour === Math.floor(currentTimePosition) && (
                                <div
                                  className="absolute left-0 right-0 z-30"
                                  style={{
                                    top: `${((currentTimePosition % 1) * 60)}px`,
                                  }}
                                >
                                  <div className="absolute -left-1 w-3 h-3 bg-red-600 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                                  <div className="h-0.5 bg-red-600" style={{ backgroundColor: '#DC2626' }} />
                                </div>
                              )}

                              {/* Event blocks */}
                              {hourEvents.map((event) => {
                                const eventStart = parseTime(event.startTime);
                                const eventEnd = parseTime(event.endTime);
                                
                                // Calculate position within this hour row
                                const startInHour = Math.max(0, eventStart - hour);
                                const endInHour = Math.min(1, eventEnd - hour);
                                const durationInHour = endInHour - startInHour;
                                
                                const heightMultiplier = 60; // 60px per hour
                                const eventHeight = Math.max(durationInHour * heightMultiplier - 2, 20);
                                const topOffset = startInHour * heightMultiplier;
                                const color = getEventColor(event);

                                return (
                                  <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="absolute left-0.5 right-0.5 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow z-20 overflow-hidden"
                                    style={{
                                      backgroundColor: color,
                                      height: `${eventHeight}px`,
                                      top: `${topOffset + 1}px`,
                                      border: `1px solid ${color}`,
                                    }}
                                  >
                                    <div className="p-1 h-full flex flex-col text-white">
                                      <div className="text-xs font-medium leading-tight truncate">
                                        {event.title}
                                      </div>
                                      <div className="text-xs leading-tight opacity-90 truncate">
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                      </div>
                                      {event.location && eventHeight > 50 && (
                                        <div className="text-xs leading-tight opacity-80 truncate">
                                          {event.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                                })}
                            </div>
                          );
                        })()
                      ) : (
                        weekDays.map((day, dayIdx) => {
                          const isToday = day.toDateString() === today.toDateString();
                          const events = getEventsForDay(day);
                          // Get all events that overlap with this hour
                          const hourEvents = events.filter((event) => {
                            const eventStart = parseTime(event.startTime);
                            const eventEnd = parseTime(event.endTime);
                            // Event overlaps with this hour if it starts before hour+1 and ends after hour
                            return eventStart < hour + 1 && eventEnd > hour;
                          });

                          return (
                            <div
                              key={dayIdx}
                              className={cn(
                                'relative border-r border-b border-[#E5DFD4] last:border-r-0',
                                isToday ? 'bg-blue-50/30' : 'bg-[#FEFBF6]'
                              )}
                            >
                              {/* Current time indicator */}
                              {isToday && hour === Math.floor(currentTimePosition) && (
                                <div
                                  className="absolute left-0 right-0 z-30"
                                  style={{
                                    top: `${((currentTimePosition % 1) * 60)}px`,
                                  }}
                                >
                                  <div className="absolute -left-1 w-3 h-3 bg-red-600 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                                  <div className="h-0.5 bg-red-600" style={{ backgroundColor: '#DC2626' }} />
                                </div>
                              )}

                              {/* Event blocks */}
                              {hourEvents.map((event) => {
                                const eventStart = parseTime(event.startTime);
                                const eventEnd = parseTime(event.endTime);
                                
                                // Calculate position within this hour row
                                const startInHour = Math.max(0, eventStart - hour);
                                const endInHour = Math.min(1, eventEnd - hour);
                                const durationInHour = endInHour - startInHour;
                                
                                const heightMultiplier = 60; // 60px per hour
                                const eventHeight = Math.max(durationInHour * heightMultiplier - 2, 20);
                                const topOffset = startInHour * heightMultiplier;
                                const color = getEventColor(event);

                                return (
                                  <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="absolute left-0.5 right-0.5 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow z-20 overflow-hidden"
                                    style={{
                                      backgroundColor: color,
                                      height: `${eventHeight}px`,
                                      top: `${topOffset + 1}px`,
                                      border: `1px solid ${color}`,
                                    }}
                                  >
                                    <div className="p-1 h-full flex flex-col text-white">
                                      <div className="text-xs font-medium leading-tight truncate">
                                        {event.title}
                                      </div>
                                      <div className="text-xs leading-tight opacity-90 truncate">
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                      </div>
                                      {event.location && eventHeight > 50 && (
                                        <div className="text-xs leading-tight opacity-80 truncate">
                                          {event.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  );
                                })}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Events Panel */}
        {showEventsMenu && (
          <div className={cn("events-panel absolute right-0 top-0 bottom-0 w-80 border-l border-[#E5DFD4] bg-[#F8F4ED] flex flex-col z-10 shadow-lg", isClosingEventsMenu && "closing")} style={{ backgroundColor: '#F8F4ED' }}>
            <div className="p-4 border-b border-[#E5DFD4]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  {viewMode === 'day'
                    ? "Today's Events"
                    : viewMode === 'week'
                    ? "This Week's Events"
                    : "This Month's Events"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setIsClosingEventsMenu(true);
                    setTimeout(() => {
                      setShowEventsMenu(false);
                      setIsClosingEventsMenu(false);
                    }, 300);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-3">
                <ToggleGroup
                  type="single"
                  value={eventsFilter}
                  onValueChange={(value) => value && setEventsFilter(value as 'all' | 'my-events')}
                >
                  <ToggleGroupItem
                    value="all"
                    aria-label="All events"
                    className="text-gray-700 flex-1"
                  >
                    All Events
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="my-events"
                    aria-label="My events"
                    className="text-gray-700 flex-1"
                  >
                    My Events
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <ToggleGroup
                type="single"
                value={eventsViewMode}
                onValueChange={(value) => value && setEventsViewMode(value as 'grid' | 'list')}
              >
                <ToggleGroupItem value="grid" aria-label="Grid view" className="text-gray-700 flex-1">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view" className="text-gray-700 flex-1">
                  <List className="h-4 w-4 mr-1" />
                  List
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentViewEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p>No events for this {viewMode}</p>
                </div>
              ) : viewMode === 'day' ? (
                eventsViewMode === 'list' ? (
                  <div className="space-y-0.5">
                    {currentViewEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="flex items-center justify-between p-1.5 hover:bg-[#F5F1E8] rounded cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="flex-1 min-w-0 truncate">
                            <span className="text-xs text-gray-900">
                              {event.organization && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap mr-1.5">
                                  {getOrgAbbreviation(event.organization)}
                                </span>
                              )}
                              {event.title} • {formatTime(event.startTime)}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEvent(event.id);
                          }}
                        >
                          {addedEventIds.includes(event.id) ? (
                            <X className="h-3 w-3 text-red-600" />
                          ) : (
                            <Plus className="h-3 w-3 text-gray-700" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentViewEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="p-3 hover:bg-[#F5F1E8] rounded-lg cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {event.organization && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap inline-block mb-1">
                                {getOrgAbbreviation(event.organization)}
                              </span>
                            )}
                            <div className="font-medium text-sm text-gray-900">{event.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {event.startTime} - {event.endTime}
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-500">{event.location}</div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEvent(event.id);
                            }}
                          >
                            {addedEventIds.includes(event.id) ? (
                              <X className="h-4 w-4 text-red-600" />
                            ) : (
                              <Plus className="h-4 w-4 text-gray-700" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                Object.keys(groupedEvents).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>No events for this {viewMode}</p>
                  </div>
                ) : eventsViewMode === 'list' ? (
                  Object.entries(groupedEvents).map(([dayName, dayEvents]) => (
                    <div key={dayName} className="mb-3">
                      <div className="text-xs text-gray-700 uppercase font-bold mb-1.5 bg-gradient-to-r from-[#752432] to-[#8B2E3F] text-white px-3 py-1.5 rounded-md shadow-sm border-l-4 border-[#5A1C28]">
                        {dayName}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="flex items-center justify-between p-1.5 hover:bg-[#F5F1E8] rounded cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <div className="flex-1 min-w-0 truncate">
                                <span className="text-xs text-gray-900">
                                  {event.organization && (
                                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap mr-1.5">
                                      {getOrgAbbreviation(event.organization)}
                                    </span>
                                  )}
                                  {event.title} • {formatTime(event.startTime)}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleEvent(event.id);
                              }}
                            >
                              {addedEventIds.includes(event.id) ? (
                                <X className="h-3 w-3 text-red-600" />
                              ) : (
                                <Plus className="h-3 w-3 text-gray-700" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  Object.entries(groupedEvents).map(([dayName, dayEvents]) => (
                    <div key={dayName} className="mb-4">
                      <div className="text-xs text-gray-700 uppercase font-bold mb-2 bg-gradient-to-r from-[#752432] to-[#8B2E3F] text-white px-3 py-1.5 rounded-md shadow-sm border-l-4 border-[#5A1C28]">
                        {dayName}
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="p-3 hover:bg-[#F5F1E8] rounded-lg cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                {event.organization && (
                                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap inline-block mb-1">
                                    {getOrgAbbreviation(event.organization)}
                                  </span>
                                )}
                                <div className="font-medium text-sm text-gray-900">{event.title}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {event.startTime} - {event.endTime}
                                </div>
                                {event.location && (
                                  <div className="text-xs text-gray-500">{event.location}</div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleEvent(event.id);
                                }}
                              >
                                {addedEventIds.includes(event.id) ? (
                                  <X className="h-4 w-4 text-red-600" />
                                ) : (
                                  <Plus className="h-4 w-4 text-gray-700" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            <div className="p-4 border-t border-[#E5DFD4]">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-gray-700 hover:bg-[#F5F1E8] border-gray-300"
                onClick={() => setShowOrgFilterDialog(true)}
              >
                View my Organizations
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-[#FEFBF6] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Calendar Settings</DialogTitle>
            <DialogDescription className="text-gray-600">
              Connect your calendar to external services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Connect to Google Calendar */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4 border-gray-300 hover:bg-[#F5F1E8]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200">
                <CalendarIcon className="w-5 h-5" style={{ color: '#752432' }} />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900">Connect to Google Calendar</div>
                <div className="text-sm text-gray-600">Sync your events with Google Calendar</div>
              </div>
            </Button>

            {/* Connect to Canvas */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4 border-gray-300 hover:bg-[#F5F1E8]"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#DC3545] border border-gray-200">
                <div className="w-5 h-5 bg-white rounded" />
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-gray-900">Connect to Canvas</div>
                <div className="text-sm text-gray-600">Import assignments and events from Canvas</div>
              </div>
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSettingsDialog(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#FEFBF6] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Create New Event</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a new event to your calendar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Event Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Event Title *
              </label>
              <Input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
                className="w-full"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label>
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Start Time *
                </label>
                <Input
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">End Time *</label>
                <Input
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Event Type</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#752432] focus:border-transparent bg-white"
              >
                <option value="personal">Personal</option>
                <option value="study">Study</option>
                <option value="meeting">Meeting</option>
                <option value="exam">Exam</option>
                <option value="assignment">Assignment</option>
                <option value="club-event">Club Event</option>
                <option value="panel">Panel</option>
                <option value="lunch">Lunch & Learn</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
              <Input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Enter location (optional)"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Enter description (optional)"
                rows={3}
                className="w-full resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowCreateDialog(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime}
              className="bg-[#752432] text-white hover:bg-[#5A1C28] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="bg-[#FEFBF6] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-gray-900">{selectedEvent.title}</DialogTitle>
              <DialogDescription className="sr-only">
                View event details including date, time, location, and organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                  </div>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-900">{selectedEvent.location}</div>
                </div>
              )}

              {selectedEvent.organization && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-900">{selectedEvent.organization}</div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: getEventColor(selectedEvent) }}
                >
                  {selectedEvent.type.charAt(0).toUpperCase() +
                    selectedEvent.type.slice(1).replace('-', ' ')}
                </div>
              </div>

              {selectedEvent.description && (
                <div className="text-sm text-gray-700">{selectedEvent.description}</div>
              )}
            </div>

            <div className="flex gap-2">
              {isEventOnCalendar(selectedEvent) ? (
                <Button
                  onClick={() => {
                    handleRemoveEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  variant="outline"
                  className="flex-1 border-red-300 hover:border-red-400"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#DC2626' }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove from Calendar
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    handleAddEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  variant="outline"
                  className="flex-1 border-green-300 hover:border-green-400"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16A34A' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
              )}
              <Button
                onClick={() => setSelectedEvent(null)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Organization Filter Dialog */}
      <Dialog open={showOrgFilterDialog} onOpenChange={setShowOrgFilterDialog}>
        <DialogContent className="bg-[#FEFBF6] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">My Organizations</DialogTitle>
            <DialogDescription className="text-gray-600">
              Select which organizations you want to see events for
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {Array.from(
                new Set(allEvents.filter((e) => e.organization).map((e) => e.organization))
              )
                .sort()
                .map((org) => (
                  <div
                    key={org}
                    className="flex items-center gap-3 p-3 hover:bg-[#F5F1E8] rounded-lg cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                    onClick={() => {
                      const newSelected = new Set(selectedOrgs);
                      if (newSelected.has(org!)) {
                        newSelected.delete(org!);
                      } else {
                        newSelected.add(org!);
                      }
                      setSelectedOrgs(newSelected);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrgs.has(org!)}
                      onChange={() => {}}
                      className="rounded w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{org}</div>
                      <div className="text-xs text-gray-600">
                        {allEvents.filter((e) => e.organization === org).length} events
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowOrgFilterDialog(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowOrgFilterDialog(false);
              }}
              className="bg-[#752432] text-white hover:bg-[#5A1C28]"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
