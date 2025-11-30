import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  Circle,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from './ui/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

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
        'px-3 py-1.5 text-sm border-none cursor-pointer transition-all border-r border-gray-300 last:border-r-0 flex items-center justify-center whitespace-nowrap',
        isSelected 
          ? 'bg-[#752432] text-white hover:bg-[#5A1C28]' 
          : 'bg-white text-gray-700 hover:bg-gray-100',
        className,
        isSelected && '!text-white'
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// UserCourse interface matching HomePage
interface UserCourse {
  course_id: string;
  class: string;
  professor: string;
  schedule?: {
    days?: string;
    times?: string;
    location?: string;
    semester?: string;
  };
}

// Semester logic functions (same as HomePage)
const getSemestersFromCode = (semesterCode: string): ('FA' | 'WI' | 'SP')[] => {
  switch (semesterCode) {
    case 'FA': return ['FA'];
    case 'WI': return ['WI'];
    case 'SP': return ['SP'];
    case 'FS': return ['FA', 'SP'];
    case 'FW': return ['FA', 'WI'];
    case 'WS': return ['WI', 'SP'];
    default: return [];
  }
};

const courseMatchesSemester = (courseTerm: string, selectedSemester: 'FA' | 'WI' | 'SP'): boolean => {
  if (!courseTerm || courseTerm === 'TBD') return false;
  
  const semesterCode = courseTerm.slice(-2);
  const semesters = getSemestersFromCode(semesterCode);
  
  return semesters.includes(selectedSemester);
};

const formatDisplayCourseName = (rawName: string): string => {
  if (!rawName) return rawName;
  const requiredPatterns = [
    'Civil Procedure',
    'Contracts',
    'Criminal Law',
    'Torts',
    'Constitutional Law',
    'Property',
    'Legislation and Regulation'
  ];
  const pattern = new RegExp(`^(?:${requiredPatterns.join('|')})\\s([1-7])$`);
  if (pattern.test(rawName)) {
    return rawName.replace(/\s[1-7]$/, '');
  }
  return rawName;
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
  canvasUrl?: string;
}

interface CalendarPageProps {
  additionalEvents?: Event[];
}

export function CalendarPage({ additionalEvents = [] }: CalendarPageProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showEventsMenu, setShowEventsMenu] = useState(false);
  const [isClosingEventsMenu, setIsClosingEventsMenu] = useState(false);
  const [eventsViewMode, setEventsViewMode] = useState<'grid' | 'list'>('grid');
  const [addedEventIds, setAddedEventIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCanvasEventsModal, setShowCanvasEventsModal] = useState(false);
  const [canvasEventsForDay, setCanvasEventsForDay] = useState<Event[]>([]);
  const [canvasEventsDay, setCanvasEventsDay] = useState<Date | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOrgFilterDialog, setShowOrgFilterDialog] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const isImportingRef = useRef(false);
  const [canvasFeedUrl, setCanvasFeedUrl] = useState('');
  const [canvasCalendarConnected, setCanvasCalendarConnected] = useState(false);
  const [isImportingCanvas, setIsImportingCanvas] = useState(false);
  
  // User courses state (same as HomePage)
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  
  // Get current semester using date-based logic (same as HomePage)
  const getCurrentSemester = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    // Fall: September 2 - November 25
    if ((month === 9 && day >= 2) || month === 10 || (month === 11 && day <= 25)) {
      return `${year}FA`;
    }
    // Winter: January 5 - January 21
    else if (month === 1 && day >= 5 && day <= 21) {
      return `${year}WI`;
    }
    // Spring: January 26 - April 24
    else if ((month === 1 && day >= 26) || month === 2 || month === 3 || (month === 4 && day <= 24)) {
      return `${year}SP`;
    }
    // Default to current year Fall if outside semester periods
    else {
      return `${year}FA`;
    }
  };
  
  const currentSemester = getCurrentSemester();
  const [selectedSemester, setSelectedSemester] = useState<string>(currentSemester);
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
  const eventsPanelRef = useRef<HTMLDivElement>(null);
  const eventsButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null); // Track which day is expanded (format: "YYYY-MM-DD")

  // Calendar category filters
  const [showClasses, setShowClasses] = useState(true);
  const [showClubEvents, setShowClubEvents] = useState(true);
  const [showOther, setShowOther] = useState(true);
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(true);
  const [showCanvasCalendar, setShowCanvasCalendar] = useState(true);

  // Current time state for real-time updates
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check URL params for OAuth callback results
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const connected = params.get('connected');
    const error = params.get('error');

    if (connected === 'true') {
      // Successfully connected
      setGoogleCalendarConnected(true);
      // Clear URL params
      navigate('/calendar', { replace: true });
      // Automatically sync once after connection
      // Pass skipConnectionCheck=true since we just connected but state might not be updated yet
      if (user) {
        setTimeout(() => {
          handleImportGoogleCalendar(true);
        }, 100);
      }
    } else if (error) {
      // Handle error
      console.error('Google Calendar connection error:', error);
      // Clear URL params
      navigate('/calendar', { replace: true });
      // Optionally show an error message
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate, user]);

  // Fetch user's profile, courses, and events (same as HomePage)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, classes, class_year, user_events, google_calendar_connected, google_calendar_events, canvas_calendar_connected, canvas_calendar_events, canvas_feed_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error?.message || "Unknown error");
          return;
        }

        if (profile) {
          setUserCourses(profile.classes || []);
          setGoogleCalendarConnected(profile.google_calendar_connected || false);
          setCanvasCalendarConnected(profile.canvas_calendar_connected || false);
          setCanvasFeedUrl(profile.canvas_feed_url || '');
          
          // Load user events from database
          if (profile.user_events && Array.isArray(profile.user_events)) {
            const loadedEvents: Event[] = profile.user_events.map((eventDb: any) => ({
              id: eventDb.id || `custom-${Date.now()}-${Math.random()}`,
              title: eventDb.event_title,
              date: eventDb.date,
              startTime: eventDb.start_time,
              endTime: eventDb.end_time,
              type: eventDb.event_type || 'personal',
              location: eventDb.location || undefined,
              description: eventDb.description || undefined,
            }));
            
            setCustomEvents(loadedEvents);
            setAddedEventIds(loadedEvents.map(e => e.id));
          }

          // Load Google Calendar events
          if (profile.google_calendar_events && Array.isArray(profile.google_calendar_events)) {
            const googleEvents: Event[] = profile.google_calendar_events.map((eventDb: any) => ({
              id: `google-${eventDb.id}`,
              title: eventDb.event_title,
              date: eventDb.date,
              startTime: eventDb.start_time,
              endTime: eventDb.end_time,
              type: eventDb.event_type || 'personal',
              location: eventDb.location || undefined,
              description: eventDb.description || undefined,
            }));
            
            // Merge with existing custom events
            setCustomEvents(prev => {
              const existingIds = new Set(prev.map(e => e.id));
              const newGoogleEvents = googleEvents.filter(e => !existingIds.has(e.id));
              // Also add Google Calendar event IDs to addedEventIds so they display
              setAddedEventIds(prevIds => {
                const newIds = newGoogleEvents.map(e => e.id);
                const existingIdSet = new Set(prevIds);
                return [...prevIds, ...newIds.filter(id => !existingIdSet.has(id))];
              });
              return [...prev, ...newGoogleEvents];
            });
          }

          // Load Canvas Calendar events
          if (profile.canvas_calendar_events && Array.isArray(profile.canvas_calendar_events)) {
            const canvasEvents: Event[] = profile.canvas_calendar_events.map((eventDb: any) => {
              // Parse raw Canvas time (extract time only, use date from database)
              const parsedTime = eventDb.raw_due_time ? parseCanvasTime(eventDb.raw_due_time) : '23:59';
              
              return {
                id: `canvas-${eventDb.id}`,
                title: eventDb.event_title,
                date: eventDb.date, // Use date from database, don't parse from raw_due_time
                startTime: parsedTime,
                endTime: parsedTime,
                type: eventDb.event_type || 'event',
                location: eventDb.location || undefined,
                description: eventDb.description || undefined,
                canvasUrl: eventDb.canvas_url || undefined,
              };
            });
            
            // Merge with existing events
            setCustomEvents(prev => {
              const existingIds = new Set(prev.map(e => e.id));
              const newCanvasEvents = canvasEvents.filter(e => !existingIds.has(e.id));
              // Add Canvas events to addedEventIds by default (so they show on calendar)
              setAddedEventIds(prevIds => {
                const newIds = newCanvasEvents.map(e => e.id);
                const existingIdSet = new Set(prevIds);
                return [...prevIds, ...newIds.filter(id => !existingIdSet.has(id))];
              });
              return [...prev, ...newCanvasEvents];
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error instanceof Error ? error.message : "Unknown error");
      }
    };

    fetchUserProfile();
  }, [user]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Auto-sync Canvas Calendar events with smart interval and error handling
  useEffect(() => {
    if (!user || !canvasCalendarConnected) return;

    let syncInterval: NodeJS.Timeout | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let immediateSyncTimeout: NodeJS.Timeout | null = null;
    let lastSyncTime = 0;
    let consecutiveErrors = 0;
    let minInterval = 5000; // Dynamic minimum interval (increases on errors)
    const BASE_INTERVAL = 300000; // Base interval: 5 minutes (Canvas feeds update less frequently)
    const MAX_INTERVAL = 1800000; // Maximum 30 minutes between syncs

    const syncWithBackoff = async () => {
      const now = Date.now();
      if (now - lastSyncTime < minInterval) {
        return;
      }
      try {
        await handleImportCanvasCalendar(true);
        lastSyncTime = now;
        consecutiveErrors = 0;
        minInterval = BASE_INTERVAL;
      } catch (error) {
        consecutiveErrors++;
        minInterval = Math.min(minInterval * 2, MAX_INTERVAL);
        console.warn(`Canvas sync failed (${consecutiveErrors} consecutive errors). Next retry in ${minInterval / 1000}s`);
        if (consecutiveErrors >= 5) {
          console.error('Too many Canvas sync errors. Pausing auto-sync.');
          if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
          }
          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }
          retryTimeout = setTimeout(() => {
            consecutiveErrors = 0;
            minInterval = BASE_INTERVAL;
            startSyncInterval();
            retryTimeout = null;
          }, 300000);
        }
      }
    };

    const startSyncInterval = () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      syncInterval = setInterval(() => {
        if (canvasCalendarConnected && document.visibilityState === 'visible') {
          syncWithBackoff();
        }
      }, BASE_INTERVAL);
    };

    const syncImmediately = () => {
      if (immediateSyncTimeout) {
        clearTimeout(immediateSyncTimeout);
      }
      immediateSyncTimeout = setTimeout(() => {
        syncWithBackoff();
        immediateSyncTimeout = null;
      }, 1000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && canvasCalendarConnected) {
        syncWithBackoff();
        minInterval = BASE_INTERVAL;
        consecutiveErrors = 0;
        startSyncInterval();
      }
    };

    const params = new URLSearchParams(location.search);
    if (params.get('connected') !== 'true') {
      syncImmediately();
    }
    startSyncInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (immediateSyncTimeout) {
        clearTimeout(immediateSyncTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, canvasCalendarConnected]);

  // Set classes to unselected by default in month view (only if Canvas or Google Calendar connected), selected in day/week views
  useEffect(() => {
    if (viewMode === 'month') {
      // Only unselect classes if Canvas or Google Calendar is connected
      if (canvasCalendarConnected || googleCalendarConnected) {
        setShowClasses(false);
      } else {
        setShowClasses(true);
      }
    } else if (viewMode === 'day' || viewMode === 'week') {
      setShowClasses(true);
    }
  }, [viewMode, canvasCalendarConnected, googleCalendarConnected]);

  // Auto-sync Google Calendar events with smart interval and error handling
  useEffect(() => {
    if (!user || !googleCalendarConnected) return;

    let syncInterval: NodeJS.Timeout | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let immediateSyncTimeout: NodeJS.Timeout | null = null;
    let lastSyncTime = 0;
    let consecutiveErrors = 0;
    let minInterval = 5000; // Dynamic minimum interval (increases on errors)
    const BASE_INTERVAL = 5000; // Base interval: 5 seconds
    const MAX_INTERVAL = 300000; // Maximum 5 minutes between syncs

    const syncWithBackoff = async () => {
      const now = Date.now();
      // Ensure minimum time between syncs (dynamic based on errors)
      if (now - lastSyncTime < minInterval) {
        return;
      }

      if (isImportingRef.current) {
        return;
      }

      try {
        await handleImportGoogleCalendar(true);
        lastSyncTime = now;
        // Reset error count and interval on success
        consecutiveErrors = 0;
        minInterval = BASE_INTERVAL;
      } catch (error) {
        consecutiveErrors++;
        // Exponential backoff: double the minimum interval on each error, up to max
        minInterval = Math.min(minInterval * 2, MAX_INTERVAL);
        console.warn(`Sync failed (${consecutiveErrors} consecutive errors). Next retry in ${minInterval / 1000}s`);
        
        // If we have too many errors, stop syncing for a while
        if (consecutiveErrors >= 5) {
          console.error('Too many sync errors. Pausing auto-sync.');
          if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
          }
          // Clear any existing retry timeout
          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }
          // Retry after 5 minutes
          retryTimeout = setTimeout(() => {
            consecutiveErrors = 0;
            minInterval = BASE_INTERVAL;
            startSyncInterval();
            retryTimeout = null;
          }, 300000);
        }
      }
    };

    const startSyncInterval = () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      syncInterval = setInterval(() => {
        if (googleCalendarConnected && document.visibilityState === 'visible') {
          syncWithBackoff();
        }
      }, BASE_INTERVAL);
    };

    // Sync immediately on mount (with delay to avoid race with initial load)
    const syncImmediately = () => {
      if (immediateSyncTimeout) {
        clearTimeout(immediateSyncTimeout);
      }
      immediateSyncTimeout = setTimeout(() => {
        syncWithBackoff();
        immediateSyncTimeout = null;
      }, 1000);
    };

    // Sync on page visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && googleCalendarConnected) {
        // Sync immediately when tab becomes visible (if enough time has passed)
        syncWithBackoff();
        // Reset interval and error count when tab becomes visible
        minInterval = BASE_INTERVAL;
        consecutiveErrors = 0;
        startSyncInterval();
      }
    };

    // Initial sync (skip if we just connected, as that already triggers a sync)
    const params = new URLSearchParams(location.search);
    if (params.get('connected') !== 'true') {
      syncImmediately();
    }

    // Start the sync interval
    startSyncInterval();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (immediateSyncTimeout) {
        clearTimeout(immediateSyncTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, googleCalendarConnected]);

  // Scroll to top on mount
  useEffect(() => {
    if (scrollRef.current && viewMode === 'week') {
      scrollRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  // Close events panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close events menu if event modal is open
      if (selectedEvent) {
        return;
      }
      
      if (
        showEventsMenu &&
        eventsPanelRef.current &&
        eventsButtonRef.current &&
        !eventsPanelRef.current.contains(event.target as Node) &&
        !eventsButtonRef.current.contains(event.target as Node)
      ) {
        // Check if click is on dialog overlay or content
        const target = event.target as HTMLElement;
        if (target.closest('[data-slot="dialog-overlay"]') || target.closest('[data-slot="dialog-content"]')) {
          return;
        }
        
        setIsClosingEventsMenu(true);
        setTimeout(() => {
          setShowEventsMenu(false);
          setIsClosingEventsMenu(false);
        }, 300);
      }
    };

    if (showEventsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventsMenu, selectedEvent]);

  const allEvents = [...additionalEvents, ...customEvents];

  // Filter events based on category checkboxes
  const filterEventsByCategory = (event: Event): boolean => {
    if (event.type === 'class') {
      return showClasses;
    } else if (event.type === 'club-event') {
      return showClubEvents;
    } else if (event.id.startsWith('google-')) {
      // Google Calendar events
      return showGoogleCalendar;
    } else if (event.id.startsWith('canvas-')) {
      // Canvas Calendar events
      return showCanvasCalendar;
    } else if (event.id.startsWith('custom-')) {
      // User-created events (Your Events)
      return showOther;
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
  const handleRemoveEvent = async (eventId: string) => {
    // Prevent deletion of Canvas events
    if (eventId.startsWith('canvas-')) {
      return;
    }
    
    // Check if this is a user-created event (starts with "custom-") or Google Calendar event (starts with "google-")
    const isUserEvent = eventId.startsWith('custom-') || eventId.startsWith('google-');
    
    if (isUserEvent && user) {
      // Remove from database
      try {
        // Fetch current profile data
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('user_events, google_calendar_events')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
        } else if (profile) {
          // Handle user-created events (custom-)
          // Note: user-created events store the ID with the "custom-" prefix in the database
          if (eventId.startsWith('custom-')) {
            if (profile.user_events && Array.isArray(profile.user_events)) {
              // Remove the event from the array (ID in DB includes the "custom-" prefix)
              const updatedEvents = (profile.user_events as any[]).filter(
                (eventDb: any) => eventDb.id !== eventId
              );

              // Update database
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ user_events: updatedEvents })
                .eq('id', user.id);

              if (updateError) {
                console.error('Error removing event from database:', updateError);
              }
            }
          }
          
          // Handle Google Calendar events (google-)
          // Note: Google Calendar events store the ID without the "google-" prefix in the database
          if (eventId.startsWith('google-')) {
            if (profile.google_calendar_events && Array.isArray(profile.google_calendar_events)) {
              // Extract the actual event ID (remove "google-" prefix)
              const actualEventId = eventId.replace('google-', '');
              // Remove the event from the array
              const updatedGoogleEvents = (profile.google_calendar_events as any[]).filter(
                (eventDb: any) => eventDb.id !== actualEventId
              );

              // Update database
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ google_calendar_events: updatedGoogleEvents })
                .eq('id', user.id);

              if (updateError) {
                console.error('Error removing Google Calendar event from database:', updateError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error removing event:', error);
      }
      
      // Remove from local state
      setCustomEvents(customEvents.filter((event) => event.id !== eventId));
      
      // Remove from added event IDs (only for non-Canvas events)
      setAddedEventIds(addedEventIds.filter((id) => id !== eventId));
    }
  };

  // Handler to toggle event
  const handleToggleEvent = (eventId: string) => {
    // Prevent toggling Canvas events (they should always be visible when Canvas calendar is connected)
    if (eventId.startsWith('canvas-')) {
      return;
    }
    
    if (addedEventIds.includes(eventId)) {
      handleRemoveEvent(eventId);
    } else {
      handleAddEvent(eventId);
    }
  };

  // Check if an event is on the calendar
  const isEventOnCalendar = (event: Event): boolean => {
    // Classes are always on the calendar
    if (event.type === 'class') return true;
    // User-created events (custom-) and Google Calendar events (google-) are always on the calendar
    if (event.id.startsWith('custom-') || event.id.startsWith('google-')) return true;
    // Canvas events and other events need to be in addedEventIds
    return addedEventIds.includes(event.id);
  };

  // Handler to create new event
  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      return;
    }

    if (!user) {
      console.error('User not authenticated');
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

    // Save to database
    try {
      // Fetch current user_events
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('user_events')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
      }

      // Get existing events or empty array
      const existingEvents = (profile?.user_events as any[]) || [];

      // Create event object for database (matching the structure from migration)
      const eventForDb = {
        id: createdEvent.id,
        event_title: createdEvent.title,
        date: createdEvent.date,
        start_time: createdEvent.startTime,
        end_time: createdEvent.endTime,
        event_type: createdEvent.type || 'personal',
        location: createdEvent.location || null,
        description: createdEvent.description || null,
      };

      // Add new event to array
      const updatedEvents = [...existingEvents, eventForDb];

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_events: updatedEvents })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving event to database:', updateError);
        // Still add to local state even if DB save fails
      }
    } catch (error) {
      console.error('Error saving event:', error);
      // Still add to local state even if DB save fails
    }

    // Update local state
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

  // Handler to connect Google Calendar
  const handleConnectGoogleCalendar = async () => {
    if (!user) {
      alert('Please log in to connect Google Calendar');
      console.error('User not authenticated');
      return;
    }

    try {
      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        alert('Supabase URL not configured. Please check your environment variables.');
        console.error('Supabase URL not configured');
        return;
      }

      if (!supabaseAnonKey) {
        alert('Supabase anon key not configured. Please check your environment variables.');
        console.error('Supabase anon key not configured');
        return;
      }

      // Call the OAuth start function
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        alert('Error getting session: ' + sessionError.message);
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session || !session.access_token) {
        alert('No active session. Please log in again.');
        console.error('No active session or access token');
        return;
      }

      console.log('Calling google-oauth-start...');
      console.log('Session token exists:', !!session.access_token);
      
      // Pass the frontend URL so callback can redirect back to the correct domain
      const frontendUrl = window.location.origin;
      const response = await fetch(`${supabaseUrl}/functions/v1/google-oauth-start?frontend_url=${encodeURIComponent(frontendUrl)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        alert('Error starting OAuth: ' + (errorData.error || 'Unknown error'));
        console.error('Error starting OAuth:', errorData);
        return;
      }

      const data = await response.json();
      console.log('OAuth start response:', data);
      
      if (!data.authUrl) {
        alert('No auth URL received from server');
        console.error('No authUrl in response:', data);
        return;
      }

      const { authUrl } = data;
      
      // Redirect to Google OAuth
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;
    } catch (error: any) {
      alert('Error connecting Google Calendar: ' + (error.message || 'Unknown error'));
      console.error('Error connecting Google Calendar:', error);
    }
  };

  // Handler to import Google Calendar events
  const handleImportGoogleCalendar = async (skipConnectionCheck = false) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!skipConnectionCheck && !googleCalendarConnected) {
      throw new Error('Google Calendar not connected');
    }

    setIsImporting(true);
    isImportingRef.current = true;

    try {
      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call the import function
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/google-calendar-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error importing events:', errorData);
        setIsImporting(false);
        isImportingRef.current = false;
        throw new Error(errorData.error || 'Failed to import Google Calendar events');
      }

      const result = await response.json();
      console.log(`Successfully imported ${result.imported} events`);

      // Refresh the profile to get updated events
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('google_calendar_events, google_last_synced')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        setIsImporting(false);
        isImportingRef.current = false;
        throw new Error(error?.message || 'Failed to fetch updated profile');
      }

      // Update Google Calendar connection status
      setGoogleCalendarConnected(true);

      // Load Google Calendar events
      if (profile.google_calendar_events && Array.isArray(profile.google_calendar_events)) {
        const googleEvents: Event[] = profile.google_calendar_events.map((eventDb: any) => ({
          id: `google-${eventDb.id}`,
          title: eventDb.event_title,
          date: eventDb.date,
          startTime: eventDb.start_time,
          endTime: eventDb.end_time,
          type: eventDb.event_type || 'personal',
          location: eventDb.location || undefined,
          description: eventDb.description || undefined,
        }));

        // Merge with existing events: update all Google Calendar events, keep user-created events
        setCustomEvents(prev => {
          // Separate user-created events (custom-) from Google Calendar events (google-)
          const userEvents = prev.filter(e => e.id.startsWith('custom-'));
          
          // Return user events + all current Google events (this replaces all Google events)
          return [...userEvents, ...googleEvents];
        });
        
        // Update addedEventIds separately to ensure React detects the change
        setAddedEventIds(prevIds => {
          const googleEventIds = new Set(googleEvents.map(e => e.id));
          // Remove old Google event IDs that no longer exist
          const filteredIds = prevIds.filter(id => 
            !id.startsWith('google-') || googleEventIds.has(id)
          );
          // Add new Google event IDs
          const existingIdSet = new Set(filteredIds);
          const newIds = googleEvents
            .map(e => e.id)
            .filter(id => !existingIdSet.has(id));
          return [...filteredIds, ...newIds];
        });
      } else {
        // No Google Calendar events - remove all Google events from state
        setCustomEvents(prev => prev.filter(e => !e.id.startsWith('google-')));
        setAddedEventIds(prevIds => prevIds.filter(id => !id.startsWith('google-')));
      }
    } catch (error) {
      console.error('Error importing Google Calendar:', error);
      throw error; // Re-throw so syncWithBackoff can handle it
    } finally {
      setIsImporting(false);
      isImportingRef.current = false;
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    if (!user) return;

    try {
      // Delete tokens from user_google_tokens table
      const { error: tokenError } = await supabase
        .from('user_google_tokens')
        .delete()
        .eq('user_id', user.id);

      if (tokenError) {
        console.error('Error deleting Google tokens:', tokenError);
      }

      // Clear Google Calendar data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          google_calendar_events: [],
          google_calendar_connected: false,
          google_last_synced: null,
          google_sync_token: null,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error clearing Google Calendar data:', profileError);
        return;
      }

      // Update local state
      setGoogleCalendarConnected(false);

      // Remove Google Calendar events from local state
      setCustomEvents(prev => prev.filter(e => !e.id.startsWith('google-')));
      setAddedEventIds(prevIds => prevIds.filter(id => !id.startsWith('google-')));

      console.log('Google Calendar disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
    }
  };

  // Handler to connect Canvas Calendar
  const handleConnectCanvasCalendar = async () => {
    if (!user) {
      alert('Please log in to connect Canvas Calendar');
      return;
    }

    if (!canvasFeedUrl || !canvasFeedUrl.trim()) {
      alert('Please enter a Canvas feed URL');
      return;
    }

    // Validate URL format
    try {
      new URL(canvasFeedUrl);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    try {
      // Save the feed URL to the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          canvas_feed_url: canvasFeedUrl.trim(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving Canvas feed URL:', updateError);
        alert('Error saving Canvas feed URL');
        return;
      }

      // Import Canvas events
      await handleImportCanvasCalendar(true);
    } catch (error: any) {
      alert('Error connecting Canvas Calendar: ' + (error.message || 'Unknown error'));
      console.error('Error connecting Canvas Calendar:', error);
    }
  };

  // Handler to import Canvas Calendar events
  const handleImportCanvasCalendar = async (skipConnectionCheck = false) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!skipConnectionCheck && !canvasCalendarConnected) {
      throw new Error('Canvas Calendar not connected');
    }

    setIsImportingCanvas(true);

    try {
      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call the import function
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/Canvas-Calendar-Import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error importing Canvas events:', errorData);
        setIsImportingCanvas(false);
        throw new Error(errorData.error || 'Failed to import Canvas Calendar events');
      }

      const result = await response.json();
      console.log(`Successfully imported ${result.imported} Canvas events`);

      // Refresh the profile to get updated events
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('canvas_calendar_events, canvas_last_synced, canvas_calendar_connected')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        setIsImportingCanvas(false);
        throw new Error(error?.message || 'Failed to fetch updated profile');
      }

      // Update Canvas Calendar connection status
      setCanvasCalendarConnected(true);

      // Load Canvas Calendar events
      if (profile.canvas_calendar_events && Array.isArray(profile.canvas_calendar_events)) {
        const canvasEvents: Event[] = profile.canvas_calendar_events.map((eventDb: any) => {
          // Parse raw Canvas time (extract time only, use date from database)
          const parsedTime = eventDb.raw_due_time ? parseCanvasTime(eventDb.raw_due_time) : '23:59';
          
          return {
            id: `canvas-${eventDb.id}`,
            title: eventDb.event_title,
            date: eventDb.date, // Use date from database, don't parse from raw_due_time
            startTime: parsedTime,
            endTime: parsedTime,
            type: eventDb.event_type || 'event',
            location: eventDb.location || undefined,
            description: eventDb.description || undefined,
            canvasUrl: eventDb.canvas_url || undefined,
          };
        });

        // Merge with existing events: update all Canvas events, keep user-created and Google events
        setCustomEvents(prev => {
          // Separate user-created and Google events from Canvas events
          const nonCanvasEvents = prev.filter(e => !e.id.startsWith('canvas-'));
          
          // Return non-Canvas events + all current Canvas events (this replaces all Canvas events)
          return [...nonCanvasEvents, ...canvasEvents];
        });
        
        // Update addedEventIds separately to ensure React detects the change
        setAddedEventIds(prevIds => {
          const canvasEventIds = new Set(canvasEvents.map(e => e.id));
          // Remove old Canvas event IDs that no longer exist
          const filteredIds = prevIds.filter(id => 
            !id.startsWith('canvas-') || canvasEventIds.has(id)
          );
          // Add new Canvas event IDs
          const existingIdSet = new Set(filteredIds);
          const newIds = canvasEvents
            .map(e => e.id)
            .filter(id => !existingIdSet.has(id));
          return [...filteredIds, ...newIds];
        });
      } else {
        // No Canvas Calendar events - remove all Canvas events from state
        setCustomEvents(prev => prev.filter(e => !e.id.startsWith('canvas-')));
        setAddedEventIds(prevIds => prevIds.filter(id => !id.startsWith('canvas-')));
      }
    } catch (error) {
      console.error('Error importing Canvas Calendar:', error);
      throw error;
    } finally {
      setIsImportingCanvas(false);
    }
  };

  const handleDisconnectCanvasCalendar = async () => {
    if (!user) return;

    try {
      // Clear Canvas Calendar data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          canvas_calendar_events: [],
          canvas_calendar_connected: false,
          canvas_feed_url: null,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error clearing Canvas Calendar data:', profileError);
        alert('Error disconnecting Canvas Calendar');
        return;
      }

      setCanvasCalendarConnected(false);
      setCanvasFeedUrl('');
      
      // Remove Canvas Calendar events from UI
      setCustomEvents(prev => prev.filter(e => !e.id.startsWith('canvas-')));
      setAddedEventIds(prevIds => prevIds.filter(id => !id.startsWith('canvas-')));
    } catch (error) {
      console.error('Error disconnecting Canvas Calendar:', error);
      alert('Error disconnecting Canvas Calendar');
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
    const today = new Date();
    setCurrentDate(today);
    
    // Scroll to current time in week/day view
    if (scrollRef.current && (viewMode === 'week' || viewMode === 'day')) {
      setTimeout(() => {
        if (scrollRef.current) {
          const currentHour = today.getHours() + today.getMinutes() / 60;
          const startHour = hours[0] || 8;
          // Calculate scroll position relative to start hour
          const scrollPosition = (currentHour - startHour) * 60; // 60px per hour
          scrollRef.current.scrollTop = Math.max(0, scrollPosition - 200); // Scroll to show current time with some offset
        }
      }, 100); // Small delay to ensure hours are calculated
    }
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

  const getCanvasEventsForDay = (day: Date): Event[] => {
    const dateStr = day.toISOString().split('T')[0];
    return filteredEvents.filter(
      (event) => event.date === dateStr && event.id.startsWith('canvas-') && isEventOnCalendar(event)
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

  // Parse Canvas raw iCal time string - extract time only (date comes from database)
  // Format: "20241101T235900Z" (UTC) or "20241101T235900" (local)
  const parseCanvasTime = (rawTime: string): string => {
    // Remove Z and T, then parse
    const cleaned = rawTime.replace(/[TZ]/g, '');
    
    // Extract time components (characters 8-13: HHMMSS)
    const hour = cleaned.length > 8 ? parseInt(cleaned.substring(8, 10)) : 23;
    const minute = cleaned.length > 10 ? parseInt(cleaned.substring(10, 12)) : 59;
    
    // Format time as HH:MM
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Format time range, only showing AM/PM on the second time if both have the same period
  const formatTimeRange = (startTime: string, endTime: string, eventId?: string): string => {
    const isCanvasEvent = eventId?.startsWith('canvas-');
    
    // If start and end times are the same, just show the time once (e.g., for Canvas due times)
    if (startTime === endTime) {
      const timeStr = formatTime(startTime);
      return isCanvasEvent ? `Due: ${timeStr}` : timeStr;
    }
    
    const formatStart = formatTime(startTime);
    const formatEnd = formatTime(endTime);
    
    // Extract periods
    const startPeriod = formatStart.includes('AM') ? 'AM' : 'PM';
    const endPeriod = formatEnd.includes('AM') ? 'AM' : 'PM';
    
    // If both have the same period, only show it on the end time
    if (startPeriod === endPeriod) {
      const startWithoutPeriod = formatStart.replace(/\s*(AM|PM)/i, '');
      const timeRange = `${startWithoutPeriod} - ${formatEnd}`;
      return isCanvasEvent ? `Due: ${timeRange}` : timeRange;
    }
    
    // If different periods, show both
    const timeRange = `${formatStart} - ${formatEnd}`;
    return isCanvasEvent ? `Due: ${timeRange}` : timeRange;
  };

  // Format course schedule time string (e.g., "9:00 AM - 10:30 AM" -> "9:00 - 10:30 AM")
  const formatCourseTime = (timeString: string): string => {
    if (!timeString || timeString === 'TBD') return timeString;
    
    // Parse time format like "9:00 AM - 10:30 AM" or "1:30 PM - 3:30 PM"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return timeString;
    
    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
    
    // If both have the same period, only show it on the end time
    if (startPeriod.toUpperCase() === endPeriod.toUpperCase()) {
      return `${startHour}:${startMin} - ${endHour}:${endMin} ${endPeriod}`;
    }
    
    // If different periods, show both
    return `${startHour}:${startMin} ${startPeriod} - ${endHour}:${endMin} ${endPeriod}`;
  };

  // Course parsing functions (same as HomePage)
  const parseCourseSchedule = (scheduleString: string) => {
    if (!scheduleString || scheduleString === 'TBD') return [];
    
    // Split by bullet points and commas
    const days = scheduleString.split(/[,\•]/).map(d => d.trim());
    const dayMap: { [key: string]: number } = {
      'Mon': 1, 'Monday': 1,
      'Tue': 2, 'Tuesday': 2, 'Tues': 2,
      'Wed': 3, 'Wednesday': 3,
      'Thu': 4, 'Thursday': 4, 'Thurs': 4,
      'Fri': 5, 'Friday': 5,
      'Sat': 6, 'Saturday': 6,
      'Sun': 0, 'Sunday': 0
    };
    
    return days.map(day => dayMap[day]).filter(day => day !== undefined);
  };

  // Get semester for a specific date (returns null if date is outside semester periods)
  const getSemesterForDate = (date: Date): string | null => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Fall: September 2 - November 25
    if ((month === 9 && day >= 2) || month === 10 || (month === 11 && day <= 25)) {
      return `${year}FA`;
    }
    // Winter: January 5 - January 21
    else if (month === 1 && day >= 5 && day <= 21) {
      return `${year}WI`;
    }
    // Spring: January 26 - April 24
    else if ((month === 1 && day >= 26) || month === 2 || month === 3 || (month === 4 && day <= 24)) {
      return `${year}SP`;
    }
    // Return null if outside semester periods (no classes should be displayed)
    else {
      return null;
    }
  };

  // Get courses for a specific day (same logic as HomePage)
  const getCoursesForDay = (day: Date): UserCourse[] => {
    // If date is outside semester periods, don't show any classes
    const semesterForDate = getSemesterForDate(day);
    if (!semesterForDate) {
      return [];
    }
    
    const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const selectedTerm = semesterForDate.slice(-2) as 'FA' | 'WI' | 'SP';
    
    return userCourses.filter(course => {
      // Check if course is for the semester of the date being viewed using multi-semester logic
      const courseSemester = course.schedule?.semester;
      
      if (!courseSemester || !courseMatchesSemester(courseSemester, selectedTerm)) {
        return false;
      }
      
      // Parse schedule days
      const scheduleDays = parseCourseSchedule(course.schedule?.days || '');
      
      // Check if course meets on selected day
      return scheduleDays.includes(dayOfWeek);
    });
  };

  // Parse time string and convert to position for calendar display (same calculation as HomePage, scaled to 60px/hour)
  const parseTimeToPosition = (timeString: string, startHourForCalc: number = 8) => {
    if (!timeString || timeString === 'TBD') return null;
    
    // Parse time format like "1:30PM - 3:30PM" or "8:00AM - 9:30AM"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return null;
    
    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
    
    // Convert to 24-hour format
    const startHour24 = parseInt(startHour) + (startPeriod.toUpperCase() === 'PM' && startHour !== '12' ? 12 : 0);
    const endHour24 = parseInt(endHour) + (endPeriod.toUpperCase() === 'PM' && endHour !== '12' ? 12 : 0);
    
    // Convert to minutes since midnight
    const startMinutes = startHour24 * 60 + parseInt(startMin);
    const endMinutes = endHour24 * 60 + parseInt(endMin);
    
    // Calculate position: each hour is 60px, starting from the first hour in the view
    // Time labels are positioned at top: -6px relative to each hour row
    // We align classes to match the time label vertical positions
    // Position = (minutes from start hour) * (60px per hour / 60 minutes per hour) - 1px for better alignment
    const startHourMinutes = startHourForCalc * 60; // Convert start hour to minutes
    const startPosition = ((startMinutes - startHourMinutes) / 60) * 60 - 1; // 60px per hour, -1px to align with labels
    const height = ((endMinutes - startMinutes) / 60) * 60; // 60px per hour
    
    return { startPosition, height };
  };

  // Parse event times and convert to position for calendar display (same as classes)
  const parseEventTimeToPosition = (startTime: string, endTime: string, startHourForCalc: number = 8) => {
    if (!startTime || !endTime) return null;
    
    // Parse time format like "09:00" or "9:00 AM"
    const parseTimeString = (timeStr: string): number => {
      // Handle 24-hour format (HH:MM)
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + minutes / 60;
      }
      // Handle 12-hour format (H:MM AM/PM)
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        const [, hour, min, period] = timeMatch;
        const hour24 = parseInt(hour) + (period.toUpperCase() === 'PM' && hour !== '12' ? 12 : 0);
        return hour24 + parseInt(min) / 60;
      }
      return 0;
    };
    
    const startHour = parseTimeString(startTime);
    const endHour = parseTimeString(endTime);
    
    // Convert to minutes since midnight
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    
    // Calculate position: each hour is 60px, starting from the first hour in the view
    const startHourMinutes = startHourForCalc * 60;
    const startPosition = ((startMinutes - startHourMinutes) / 60) * 60 - 1; // 60px per hour, -1px to align with labels
    const height = ((endMinutes - startMinutes) / 60) * 60; // 60px per hour
    
    return { startPosition, height };
  };

  // Course color mapping (same as HomePage)
  const colorCycle = ['#04913A', '#0080BD', '#FFBB06', '#F22F21'];
  const getCourseColor = (index: number): string => {
    return colorCycle[index % 4];
  };

  // Map course name -> color for schedule blocks
  const courseNameToColor = useMemo(() => {
    const map: Record<string, string> = {};
    userCourses.forEach((course, index) => {
      const displayName = formatDisplayCourseName(course.class);
      if (displayName && !map[displayName]) {
        map[displayName] = getCourseColor(index);
      }
    });
    return map;
  }, [userCourses]);

  // Helper function to extract end time from class schedule times (format: "9:00 AM - 10:30 AM")
  const extractEndTime = (timeString: string): string | null => {
    if (!timeString || timeString === 'TBD') return null;
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      const [, , , , endHour, endMin, endPeriod] = timeMatch;
      return `${endHour}:${endMin} ${endPeriod}`;
    }
    return null;
  };

  // Helper function to check if an event or class has ended (using end time)
  const isPastEvent = (date: string, time: string): boolean => {
    const now = new Date();
    let eventDateTime: Date;
    
    // Parse time - could be "HH:MM" (24-hour) or "H:MM AM/PM" format
    if (time.includes('AM') || time.includes('PM')) {
      // Parse "H:MM AM/PM" format
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        const [, hour, min, period] = timeMatch;
        let hour24 = parseInt(hour);
        if (period.toUpperCase() === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        eventDateTime = new Date(date + 'T00:00:00');
        eventDateTime.setHours(hour24, parseInt(min), 0, 0);
      } else {
        return false; // Can't parse, assume not past
      }
    } else {
      // Parse "HH:MM" (24-hour) format
      const [hours, minutes] = time.split(':').map(Number);
      eventDateTime = new Date(date + 'T00:00:00');
      eventDateTime.setHours(hours, minutes, 0, 0);
    }
    
    return eventDateTime < now;
  };

  const getEventColor = (event: Event): string => {
    if (event.type === 'class' && event.course) {
      // Use courseNameToColor map if available, otherwise default
      return courseNameToColor[event.course] || '#3B82F6';
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

  const weekDays = getWeekDays();
  const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();

  // Calculate dynamic hours based on events and classes
  // Default is 8AM-8PM, but extend if events exist outside this range
  const hours = useMemo(() => {
    let minHour = 8; // Default start: 8AM
    let maxHour = 20; // Default end: 8PM
    
    // Check all events and classes for the current view
    const daysToCheck = viewMode === 'day' 
      ? [currentDate] 
      : weekDays;
    
    daysToCheck.forEach(day => {
      // Check events (exclude Canvas events from height calculation)
      const dayEvents = getEventsForDay(day).filter(e => !e.id.startsWith('canvas-'));
      dayEvents.forEach(event => {
        if (event.startTime) {
          const startHour = parseTime(event.startTime);
          const endHour = event.endTime ? parseTime(event.endTime) : startHour + 1;
          minHour = Math.min(minHour, Math.floor(startHour));
          maxHour = Math.max(maxHour, Math.ceil(endHour));
        }
      });
      
      // Check classes - first pass with default 8AM to get actual hours
      if (showClasses) {
        const dayCourses = getCoursesForDay(day);
        dayCourses.forEach(course => {
          if (course.schedule?.times && course.schedule.times !== 'TBD') {
            const timeMatch = course.schedule.times.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (timeMatch) {
              const [, startHour, , startPeriod, endHour, , endPeriod] = timeMatch;
              const startHour24 = parseInt(startHour) + (startPeriod.toUpperCase() === 'PM' && startHour !== '12' ? 12 : 0);
              const endHour24 = parseInt(endHour) + (endPeriod.toUpperCase() === 'PM' && endHour !== '12' ? 12 : 0);
              minHour = Math.min(minHour, startHour24);
              maxHour = Math.max(maxHour, endHour24);
            }
          }
        });
      }
    });
    
    // Ensure we don't go below 0 or above 23
    minHour = Math.max(0, Math.floor(minHour));
    maxHour = Math.min(23, Math.ceil(maxHour));
    
    // Generate hours array
    const hourCount = maxHour - minHour + 1;
    return Array.from({ length: hourCount }, (_, i) => i + minHour);
  }, [viewMode, currentDate, weekDays, filteredEvents, showClasses, userCourses, selectedSemester]);
  
  const startHour = hours[0] || 8; // First hour in the array

  // Get current time for the red line indicator (using state for real-time updates)
  const currentTimePosition = currentTime.getHours() + currentTime.getMinutes() / 60;

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

  // Mini calendar helper - includes days from adjacent months
  const getMiniCalendarDays = (): Array<{ day: number; isCurrentMonth: boolean; date: Date }> => {
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

  const miniCalendarDays = getMiniCalendarDays();
  const monthCalendarDays = getMonthCalendarDays();

  // Get events for the current view (only user-created events)
  const getEventsForCurrentView = (): Event[] => {
    // Show user-created events, Google Calendar events, and Canvas events (exclude classes)
    let events = filteredEvents.filter((event) => event.type !== 'class' && (event.id.startsWith('custom-') || event.id.startsWith('google-') || event.id.startsWith('canvas-')));
    
    // Filter to only show events from today onwards (no past events)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    const todayStr = today.toISOString().split('T')[0];
    
    events = events.filter((event) => {
      const eventDate = event.date; // Format: "YYYY-MM-DD"
      return eventDate >= todayStr; // Only include today and future dates
    });

    if (viewMode === 'day') {
      const dateStr = currentDate.toISOString().split('T')[0];
      return events.filter((event) => event.date === dateStr);
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays();
      const weekDateStrs = weekDays.map((d) => d.toISOString().split('T')[0]);
      return events.filter((event) => weekDateStrs.includes(event.date));
    } else {
      // Month view: include events from all visible dates in the month grid (including adjacent months)
      const visibleDates = monthCalendarDays.map(dayObj => dayObj.date.toISOString().split('T')[0]);
      return events.filter((event) => visibleDates.includes(event.date));
    }
  };

  // Group events by day
  const groupEventsByDay = (events: Event[]): Record<string, Event[]> => {
    const grouped: Record<string, Event[]> = {};
    events.forEach((event) => {
      // Parse date string manually to avoid timezone issues
      // event.date is in format "YYYY-MM-DD"
      const [year, month, day] = event.date.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
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
          background-color: #faf5f1 !important;
          background: #faf5f1 !important;
          border: 1px solid rgba(255, 255, 255, 0.6) !important;
          border-radius: 24px !important;
          padding: 0 !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
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
        
        /* Input field styling to match review form */
        .calendar-page [data-slot="dialog-content"] input[type="text"],
        .calendar-page [data-slot="dialog-content"] input[type="date"],
        .calendar-page [data-slot="dialog-content"] input[type="time"],
        .calendar-page [data-slot="dialog-content"] select,
        .calendar-page [data-slot="dialog-content"] textarea {
          background-color: white !important;
          border: 1px solid #E5E7EB !important;
          border-radius: 16px !important;
          padding: 0.5rem 0.75rem !important;
          font-size: 12px !important;
          height: 36px !important;
          transition: all 0.2s !important;
          width: 100% !important;
          box-sizing: border-box !important;
          appearance: none !important;
          -webkit-appearance: none !important;
        }
        
        .calendar-page [data-slot="dialog-content"] input[type="date"],
        .calendar-page [data-slot="dialog-content"] input[type="time"] {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          flex-shrink: 1 !important;
          overflow: hidden !important;
        }
        
        .calendar-page [data-slot="dialog-content"] input[type="date"]::-webkit-calendar-picker-indicator,
        .calendar-page [data-slot="dialog-content"] input[type="time"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          padding: 0;
          margin-left: 0.5rem;
          opacity: 0.6;
          width: 16px !important;
          height: 16px !important;
        }
        
        .calendar-page [data-slot="dialog-content"] input[data-slot="input"][type="date"],
        .calendar-page [data-slot="dialog-content"] input[data-slot="input"][type="time"] {
          width: 100% !important;
          max-width: 100% !important;
        }
        
        .calendar-page [data-slot="dialog-content"] textarea {
          height: auto !important;
          min-height: 64px !important;
          border-radius: 24px !important;
        }
        
        .calendar-page [data-slot="dialog-content"] input[type="text"]:focus,
        .calendar-page [data-slot="dialog-content"] input[type="date"]:focus,
        .calendar-page [data-slot="dialog-content"] input[type="time"]:focus,
        .calendar-page [data-slot="dialog-content"] select:focus,
        .calendar-page [data-slot="dialog-content"] textarea:focus {
          outline: none !important;
          border-color: transparent !important;
          box-shadow: 0 0 0 2px rgba(117, 36, 50, 1) !important;
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
        
        .calendar-page input[type="checkbox"].checkbox-google-calendar:checked {
          background-color: #4285F4;
          border-color: #4285F4;
        }
        
        .calendar-page input[type="checkbox"].checkbox-canvas-calendar:checked {
          background-color: #F59E0B;
          border-color: #F59E0B;
        }
        
        /* Make checkmark white for all checkboxes */
        .calendar-page input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid #FFFFFF;
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
              <ToggleGroupItem value="day" aria-label="Day view">
                Day
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Week view">
                Week
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Month view">
                Month
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Events Button */}
          <Button
            ref={eventsButtonRef}
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
            className="h-9 w-9 p-0 text-gray-700 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-[#E5DFD4] bg-[#F8F4ED] flex flex-col">
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

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {weekDayLabels.map((label, idx) => (
                  <div key={idx} className="text-xs text-gray-500 py-1">
                    {label}
                  </div>
                ))}
                {miniCalendarDays.map((dayObj, index) => {
                  const isToday = dayObj.date.toDateString() === new Date().toDateString();
                  const isSelected = dayObj.date.toDateString() === currentDate.toDateString();

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setCurrentDate(dayObj.date);
                      }}
                      className={cn(
                        'text-xs py-1 rounded-md cursor-pointer transition-colors h-8 w-8 flex items-center justify-center font-medium',
                        isSelected
                          ? 'bg-[#752432] text-white'
                          : isToday
                          ? 'bg-[#752432]/10 text-[#752432] border border-[#752432]/20'
                          : dayObj.isCurrentMonth
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-400 hover:bg-gray-100'
                      )}
                    >
                      {dayObj.day}
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
              {googleCalendarConnected && (
                <div
                  className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#F5F1E8] rounded px-2"
                  onClick={() => setShowGoogleCalendar(!showGoogleCalendar)}
                >
                  <input
                    type="checkbox"
                    checked={showGoogleCalendar}
                    onChange={(e) => {
                      e.stopPropagation();
                      setShowGoogleCalendar(!showGoogleCalendar);
                    }}
                    className="rounded checkbox-google-calendar"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-gray-700 truncate">Google Calendar</span>
                  </div>
                </div>
              )}
              {canvasCalendarConnected && (
                <div
                  className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#F5F1E8] rounded px-2"
                  onClick={() => setShowCanvasCalendar(!showCanvasCalendar)}
                >
                  <input
                    type="checkbox"
                    checked={showCanvasCalendar}
                    onChange={(e) => {
                      e.stopPropagation();
                      setShowCanvasCalendar(!showCanvasCalendar);
                    }}
                    className="rounded checkbox-canvas-calendar"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-gray-700 truncate">Canvas</span>
                  </div>
                </div>
              )}
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
                  <span className="text-sm text-gray-700 truncate">Your Events</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar View - Continue in next part due to length */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {viewMode === 'month' ? (
            // Month View
            <div className="flex-1 flex flex-col bg-[#FEFBF6] min-h-0 overflow-hidden">
              {/* Month header */}
              <div className="border-b-2 border-[#E5DFD4] bg-[#F8F4ED] flex-shrink-0">
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

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-rows-6">
                {Array.from({ length: 6 }).map((_, weekIdx) => {
                  // Check if any day in this week is expanded
                  const weekDays = monthCalendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7);
                  const hasExpandedDay = weekDays.some(dayObj => {
                    const dateStr = dayObj.date.toISOString().split('T')[0];
                    return expandedDay === dateStr;
                  });
                  
                  return (
                    <div key={weekIdx} className="grid grid-cols-7" style={{ minHeight: hasExpandedDay ? 'auto' : undefined }}>
                      {weekDays.map((dayObj, dayIdx) => {
                      const isToday = dayObj.date.toDateString() === today.toDateString();
                      const events = getEventsForDay(dayObj.date);
                      const nonClassEvents = events.filter((event) => event.type !== 'class');
                      const dayCourses = showClasses ? getCoursesForDay(dayObj.date) : [];
                      const dateStr = dayObj.date.toISOString().split('T')[0];
                      const isExpanded = expandedDay === dateStr;

                      // Combine classes and events, then sort by start time
                      interface CalendarItem {
                        type: 'class' | 'event';
                        id: string;
                        startTime: number;
                        course?: UserCourse;
                        event?: Event;
                        courseIndex?: number;
                      }

                      const allItems: CalendarItem[] = [];
                      
                      // Add classes with their start times
                      dayCourses.forEach((course, courseIndex) => {
                        if (course.schedule?.times && course.schedule.times !== 'TBD') {
                          const timeMatch = course.schedule.times.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                          if (timeMatch) {
                            const [, hour, min, period] = timeMatch;
                            const hour24 = parseInt(hour) + (period.toUpperCase() === 'PM' && hour !== '12' ? 12 : 0);
                            const startTime = hour24 + parseInt(min) / 60;
                            allItems.push({
                              type: 'class',
                              id: `course-${courseIndex}`,
                              startTime,
                              course,
                              courseIndex
                            });
                          }
                        }
                      });
                      
                      // Add events with their start times
                      nonClassEvents.forEach((event) => {
                        const startTime = parseTime(event.startTime);
                        allItems.push({
                          type: 'event',
                          id: event.id,
                          startTime,
                          event
                        });
                      });
                      
                      // Sort all items by start time (earliest first)
                      allItems.sort((a, b) => a.startTime - b.startTime);
                      
                      // Determine how many items to show
                      const itemsToShow = isExpanded ? allItems : allItems.slice(0, 3);
                      const hasMore = allItems.length > 3;

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
                            {itemsToShow.map((item) => {
                              if (item.type === 'class' && item.course) {
                                const displayName = formatDisplayCourseName(item.course.class);
                                const bgColor = courseNameToColor[displayName] || getCourseColor(item.courseIndex || 0);
                                const dateStr = dayObj.date.toISOString().split('T')[0];
                                const endTime = item.course.schedule?.times ? extractEndTime(item.course.schedule.times) : null;
                                const isPast = endTime ? isPastEvent(dateStr, endTime) : false;
                                return (
                                  <div
                                    key={item.id}
                                    className="text-xs p-1 rounded truncate"
                                    style={{ backgroundColor: bgColor, color: 'white', opacity: isPast ? 0.5 : 1 }}
                                  >
                                    {displayName}
                                  </div>
                                );
                              } else if (item.type === 'event' && item.event) {
                                const isPast = isPastEvent(item.event.date, item.event.endTime);
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => setSelectedEvent(item.event!)}
                                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                                    style={{ backgroundColor: getEventColor(item.event), color: 'white', opacity: isPast ? 0.5 : 1 }}
                                  >
                                    {formatTime(item.event.startTime)} {item.event.title}
                                  </div>
                                );
                              }
                              return null;
                            })}
                            {hasMore && !isExpanded && (
                              <div 
                                className="text-xs text-gray-500 pl-1 cursor-pointer hover:text-gray-700 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDay(dateStr);
                                }}
                              >
                                +{allItems.length - 3} more
                              </div>
                            )}
                            {isExpanded && (
                              <div 
                                className="text-xs text-gray-500 pl-1 cursor-pointer hover:text-gray-700 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDay(null);
                                }}
                              >
                                Show less
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  );
                })}
                </div>
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

                        const canvasEvents = getCanvasEventsForDay(day);
                        const hasCanvasEvents = canvasEvents.length > 0;

                        return (
                          <div className="border-r border-[#E5DFD4] py-3 px-2 text-center bg-gradient-to-b from-[#F8F4ED] to-[#F5F1E8] shadow-sm flex flex-col items-center">
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
                            {hasCanvasEvents && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-1.5 h-6 px-2 text-xs bg-[#F59E0B] text-black border-[#F59E0B] hover:bg-[#D97706] hover:border-[#D97706]"
                                onClick={() => {
                                  setCanvasEventsForDay(canvasEvents);
                                  setCanvasEventsDay(day);
                                  setShowCanvasEventsModal(true);
                                }}
                              >
                                Canvas ({canvasEvents.length})
                              </Button>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      weekDays.map((day, idx) => {
                        const isToday = day.toDateString() === today.toDateString();
                        const canvasEvents = getCanvasEventsForDay(day);
                        const hasCanvasEvents = canvasEvents.length > 0;

                        return (
                          <div
                            key={idx}
                            className="border-r border-[#E5DFD4] last:border-r-0 py-3 text-center bg-gradient-to-b from-[#F8F4ED] to-[#F5F1E8] shadow-sm flex flex-col items-center"
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
                            {hasCanvasEvents && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-1.5 h-6 px-2 text-xs bg-[#F59E0B] text-black border-[#F59E0B] hover:bg-[#D97706] hover:border-[#D97706]"
                                onClick={() => {
                                  setCanvasEventsForDay(canvasEvents);
                                  setCanvasEventsDay(day);
                                  setShowCanvasEventsModal(true);
                                }}
                              >
                                Canvas ({canvasEvents.length})
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Time Rows */}
                <div className="relative" style={{ minHeight: `${hours.length * 60}px` }}>
                  {/* Class blocks - rendered absolutely across all hours (same as HomePage) */}
                  {showClasses && (viewMode === 'day' ? (
                    (() => {
                      const day = currentDate;
                      const dayCourses = getCoursesForDay(day);
                      return (
                        <div className="absolute left-[60px] right-0 top-0 z-20" style={{ height: `${hours.length * 60}px`, width: 'calc(100% - 60px)' }}>
                          {dayCourses.map((course, courseIndex) => {
                            const timePosition = parseTimeToPosition(course.schedule?.times || '', startHour);
                            if (!timePosition) return null;
                            
                            const displayName = formatDisplayCourseName(course.class);
                            const bgColor = courseNameToColor[displayName] || getCourseColor(courseIndex);
                            const dateStr = day.toISOString().split('T')[0];
                            const endTime = course.schedule?.times ? extractEndTime(course.schedule.times) : null;
                            const isPast = endTime ? isPastEvent(dateStr, endTime) : false;
                            
                            return (
                              <div
                                key={`course-${courseIndex}`}
                                className="absolute text-white rounded text-xs p-2 left-1 right-1 cursor-pointer hover:opacity-90"
                                style={{
                                  top: `${timePosition.startPosition}px`,
                                  height: `${timePosition.height}px`,
                                  backgroundColor: bgColor,
                                  opacity: isPast ? 0.5 : 1,
                                  pointerEvents: 'auto',
                                  zIndex: 20
                                }}
                              >
                                <div className="font-medium truncate">{displayName}</div>
                                <div className="text-white/90 mt-1 leading-none flex items-center">
                                  <span>{formatCourseTime(course.schedule?.times || 'TBD')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    weekDays.map((day, dayIdx) => {
                      const dayCourses = getCoursesForDay(day);
                      return (
                        <div
                          key={`courses-${dayIdx}`}
                          className="absolute top-0 z-10"
                          style={{
                            left: `calc(60px + ${dayIdx} * calc((100% - 60px) / 7))`,
                            width: `calc((100% - 60px) / 7)`,
                            height: `${hours.length * 60}px`,
                            minHeight: `${hours.length * 60}px`
                          }}
                        >
                          {dayCourses.map((course, courseIndex) => {
                            const timePosition = parseTimeToPosition(course.schedule?.times || '', startHour);
                            if (!timePosition) return null;
                            
                            const displayName = formatDisplayCourseName(course.class);
                            const bgColor = courseNameToColor[displayName] || getCourseColor(courseIndex);
                            const dateStr = day.toISOString().split('T')[0];
                            const endTime = course.schedule?.times ? extractEndTime(course.schedule.times) : null;
                            const isPast = endTime ? isPastEvent(dateStr, endTime) : false;
                            
                            return (
                              <div
                                key={`course-${dayIdx}-${courseIndex}`}
                                className="absolute text-white rounded text-xs p-2 left-1 right-1 z-10 overflow-hidden"
                                style={{
                                  top: `${timePosition.startPosition}px`,
                                  height: `${timePosition.height}px`,
                                  backgroundColor: bgColor,
                                  opacity: isPast ? 0.5 : 1
                                }}
                              >
                                <div className="font-medium overflow-hidden">{displayName}</div>
                                <div className="text-white/90 mt-1 leading-none overflow-hidden">
                                  <span>{formatCourseTime(course.schedule?.times || 'TBD')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ))}
                  
                  {/* User events - rendered absolutely like classes with overlap handling */}
                  {viewMode === 'day' ? (
                    (() => {
                      const day = currentDate;
                      const dayEvents = getEventsForDay(day).filter(e => e.type !== 'class' && !e.id.startsWith('canvas-'));
                      
                      // Group overlapping events (same logic as planner page)
                      const conflictGroups: Event[][] = [];
                      const processedEvents = new Set<string>();
                      
                      // Group overlapping events
                      dayEvents.forEach(event => {
                        if (processedEvents.has(event.id)) return;
                        
                        const eventStart = parseTime(event.startTime);
                        const eventEnd = parseTime(event.endTime);
                        const eventStartMinutes = eventStart * 60;
                        const eventEndMinutes = eventEnd * 60;
                        
                        // Find all events that overlap with this one
                        const conflictingEvents = [event];
                        processedEvents.add(event.id);
                        
                        dayEvents.forEach((otherEvent: Event) => {
                          if (processedEvents.has(otherEvent.id)) return;
                          
                          const otherStart = parseTime(otherEvent.startTime);
                          const otherEnd = parseTime(otherEvent.endTime);
                          const otherStartMinutes = otherStart * 60;
                          const otherEndMinutes = otherEnd * 60;
                          
                          // Check if times overlap
                          const hasOverlap = (eventStartMinutes < otherEndMinutes && eventEndMinutes > otherStartMinutes);
                          
                          if (hasOverlap) {
                            conflictingEvents.push(otherEvent);
                            processedEvents.add(otherEvent.id);
                          }
                        });
                        
                        // Sort events by start time (earliest first)
                        conflictingEvents.sort((a, b) => {
                          const aStart = parseTime(a.startTime);
                          const bStart = parseTime(b.startTime);
                          return aStart - bStart;
                        });
                        
                        conflictGroups.push(conflictingEvents);
                      });
                      
                      return (
                        <div className="absolute left-[60px] right-0 top-0 z-20" style={{ height: `${hours.length * 60}px`, width: 'calc(100% - 60px)' }}>
                          {conflictGroups.map((events) => {
                            return events.map((event, index) => {
                              const timePosition = parseEventTimeToPosition(event.startTime, event.endTime, startHour);
                              
                              if (!timePosition) return null;
                              
                              const color = getEventColor(event);
                              const isConflicted = events.length > 1;
                              const isPast = isPastEvent(event.date, event.endTime);
                              // Calculate width: each event gets equal share of available space
                              // Available space = 100% - 8px (padding) - (N-1)*2px (gaps)
                              const totalGaps = (events.length - 1) * 2;
                              const eventWidth = isConflicted 
                                ? `calc((100% - ${8 + totalGaps}px) / ${events.length})` 
                                : 'calc(100% - 8px)';
                              // Left offset: percentage of available space + gaps before + padding
                              // Available space percentage: (100% - 8px - totalGaps) / events.length * index
                              // Then add gaps (index * 2px) and padding (4px)
                              const leftOffset = isConflicted 
                                ? `calc((100% - ${8 + totalGaps}px) / ${events.length} * ${index} + ${index * 2}px + 4px)` 
                                : '4px';
                              
                              return (
                                <div
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className="absolute text-white rounded text-xs p-2 cursor-pointer hover:opacity-90 overflow-hidden"
                                  style={{
                                    top: `${timePosition.startPosition}px`,
                                    height: `${timePosition.height}px`,
                                    left: leftOffset,
                                    width: eventWidth,
                                    backgroundColor: color,
                                    opacity: isPast ? 0.5 : 1,
                                    pointerEvents: 'auto',
                                    zIndex: 20 + index,
                                    maxWidth: eventWidth
                                  }}
                                >
                                  <div className="font-medium overflow-hidden">{event.title}</div>
                                  <div className="text-white/90 mt-1 leading-none overflow-hidden">
                                    <span>{formatTimeRange(event.startTime, event.endTime, event.id)}</span>
                                  </div>
                                </div>
                              );
                            });
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    weekDays.map((day, dayIdx) => {
                      const dayEvents = getEventsForDay(day).filter(e => e.type !== 'class' && !e.id.startsWith('canvas-'));
                      
                      // Group overlapping events (same logic as planner page)
                      const conflictGroups: Event[][] = [];
                      const processedEvents = new Set<string>();
                      
                      // Group overlapping events
                      dayEvents.forEach(event => {
                        if (processedEvents.has(event.id)) return;
                        
                        const eventStart = parseTime(event.startTime);
                        const eventEnd = parseTime(event.endTime);
                        const eventStartMinutes = eventStart * 60;
                        const eventEndMinutes = eventEnd * 60;
                        
                        // Find all events that overlap with this one
                        const conflictingEvents = [event];
                        processedEvents.add(event.id);
                        
                        dayEvents.forEach(otherEvent => {
                          if (processedEvents.has(otherEvent.id)) return;
                          
                          const otherStart = parseTime(otherEvent.startTime);
                          const otherEnd = parseTime(otherEvent.endTime);
                          const otherStartMinutes = otherStart * 60;
                          const otherEndMinutes = otherEnd * 60;
                          
                          // Check if times overlap
                          const hasOverlap = (eventStartMinutes < otherEndMinutes && eventEndMinutes > otherStartMinutes);
                          
                          if (hasOverlap) {
                            conflictingEvents.push(otherEvent);
                            processedEvents.add(otherEvent.id);
                          }
                        });
                        
                        // Sort events by start time (earliest first)
                        conflictingEvents.sort((a, b) => {
                          const aStart = parseTime(a.startTime);
                          const bStart = parseTime(b.startTime);
                          return aStart - bStart;
                        });
                        
                        conflictGroups.push(conflictingEvents);
                      });
                      
                      return (
                        <div
                          key={`events-${dayIdx}`}
                          className="absolute top-0 z-10"
                          style={{
                            left: `calc(60px + ${dayIdx} * calc((100% - 60px) / 7))`,
                            width: `calc((100% - 60px) / 7)`,
                            height: `${hours.length * 60}px`,
                            minHeight: `${hours.length * 60}px`
                          }}
                        >
                          {conflictGroups.map((events) => {
                            return events.map((event, index) => {
                              const timePosition = parseEventTimeToPosition(event.startTime, event.endTime, startHour);
                              
                              if (!timePosition) return null;
                              
                              const color = getEventColor(event);
                              const isConflicted = events.length > 1;
                              const isPast = isPastEvent(event.date, event.endTime);
                              // Calculate width: each event gets equal share of available space
                              // Available space = 100% - 8px (padding) - (N-1)*2px (gaps)
                              const totalGaps = (events.length - 1) * 2;
                              const eventWidth = isConflicted 
                                ? `calc((100% - ${8 + totalGaps}px) / ${events.length})` 
                                : 'calc(100% - 8px)';
                              // Left offset: percentage of available space + gaps before + padding
                              // Available space percentage: (100% - 8px - totalGaps) / events.length * index
                              // Then add gaps (index * 2px) and padding (4px)
                              const leftOffset = isConflicted 
                                ? `calc((100% - ${8 + totalGaps}px) / ${events.length} * ${index} + ${index * 2}px + 4px)` 
                                : '4px';
                              
                              return (
                                <div
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className="absolute text-white rounded text-xs p-2 cursor-pointer hover:opacity-90 z-10 overflow-hidden"
                                  style={{
                                    top: `${timePosition.startPosition}px`,
                                    height: `${timePosition.height}px`,
                                    left: leftOffset,
                                    width: eventWidth,
                                    backgroundColor: color,
                                    opacity: isPast ? 0.5 : 1,
                                    zIndex: 10 + index,
                                    maxWidth: eventWidth
                                  }}
                                >
                                  <div className="font-medium overflow-hidden">{event.title}</div>
                                  <div className="text-white/90 mt-1 leading-none overflow-hidden">
                                    <span>{formatTimeRange(event.startTime, event.endTime, event.id)}</span>
                                  </div>
                                </div>
                              );
                            });
                          })}
                        </div>
                      );
                    })
                  )}
                  
                  {hours.map((hour) => {
                    // Check if any day in this row is today
                    const isTodayInRow = viewMode === 'day' 
                      ? currentDate.toDateString() === today.toDateString()
                      : weekDays.some(day => day.toDateString() === today.toDateString());
                    
                    // Find today's index in week view
                    const todayIndex = viewMode === 'week' 
                      ? weekDays.findIndex(day => day.toDateString() === today.toDateString())
                      : -1;
                    
                    // Calculate positioning for the red line
                    const getRedLineStyle = () => {
                      if (viewMode === 'day') {
                        // Day view: span full width
                        return {
                          left: '60px',
                          right: '0',
                        };
                      } else if (viewMode === 'week' && todayIndex >= 0) {
                        // Week view: only span today's column
                        const columnWidth = `calc((100% - 60px) / 7)`;
                        const leftOffset = `calc(60px + ${todayIndex} * ${columnWidth})`;
                        return {
                          left: leftOffset,
                          width: columnWidth,
                        };
                      }
                      return {};
                    };
                    
                    return (
                    <div
                      key={hour}
                      className="grid relative"
                      style={{
                        height: '60px',
                        gridTemplateColumns: viewMode === 'day' 
                          ? '60px 1fr' 
                          : '60px repeat(7, minmax(0, 1fr))'
                      }}
                    >
                      {/* Current time indicator - only spans current day in week view */}
                      {isTodayInRow && 
                       currentTimePosition >= startHour && 
                       currentTimePosition < (hours[hours.length - 1] + 1) && 
                       hour === Math.floor(currentTimePosition) && (
                        <div
                          className="absolute z-50 pointer-events-none"
                          style={{
                            ...getRedLineStyle(),
                            top: `${((currentTimePosition % 1) * 60)}px`,
                          }}
                        >
                          <div className="absolute left-0 w-2 h-2 bg-red-600 rounded-full" style={{ backgroundColor: '#DC2626', opacity: 0.75, transform: 'translate(-50%, -50%)', top: '50%' }} />
                          <div className="h-0.5 bg-red-600 w-full" style={{ backgroundColor: '#DC2626', opacity: 0.75 }} />
                        </div>
                      )}
                      
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
                      
                      {/* Day columns - just background cells, events rendered absolutely above */}
                      {viewMode === 'day' ? (
                        <div
                          className={cn(
                            'border-r border-b border-[#E5DFD4]',
                            currentDate.toDateString() === today.toDateString() ? 'bg-blue-50/30' : 'bg-[#FEFBF6]'
                          )}
                        />
                      ) : (
                        weekDays.map((day, dayIdx) => {
                          const isToday = day.toDateString() === today.toDateString();
                          return (
                            <div
                              key={dayIdx}
                              className={cn(
                                'border-r border-b border-[#E5DFD4] last:border-r-0',
                                isToday ? 'bg-blue-50/30' : 'bg-[#FEFBF6]'
                              )}
                            />
                          );
                        })
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Events Panel */}
        {showEventsMenu && (
          <div ref={eventsPanelRef} className={cn("events-panel absolute right-0 top-0 bottom-0 w-80 border-l border-[#E5DFD4] bg-[#F8F4ED] flex flex-col z-50 shadow-lg", isClosingEventsMenu && "closing")} style={{ backgroundColor: '#F8F4ED', zIndex: 9999 }}>
            <div className="p-4 border-b border-[#E5DFD4]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Future Events
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


              <ToggleGroup
                type="single"
                value={eventsViewMode}
                onValueChange={(value) => value && setEventsViewMode(value as 'grid' | 'list')}
              >
                <ToggleGroupItem value="grid" aria-label="Grid view" className="flex-1 min-w-[100px]">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view" className="flex-1 min-w-[100px]">
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
                  <div className="space-y-2">
                    {currentViewEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="flex items-center justify-between p-2 hover:bg-[#F5F1E8] rounded cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                          {/* Checkmark for Canvas events */}
                          {event.id.startsWith('canvas-') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleEvent(event.id);
                              }}
                              className="flex-shrink-0"
                            >
                              {isEventOnCalendar(event) ? (
                                <CheckCircle2 className="h-4 w-4 text-[#752432]" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400 hover:text-[#752432] transition-colors" />
                              )}
                            </button>
                          )}
                          {event.type && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap flex-shrink-0">
                              {event.type}
                            </span>
                          )}
                          {event.organization && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap flex-shrink-0">
                              {getOrgAbbreviation(event.organization)}
                            </span>
                          )}
                          <span className="text-xs text-gray-900 truncate">
                            {event.title}
                            {formatTimeRange(event.startTime, event.endTime, event.id) && ` • ${formatTimeRange(event.startTime, event.endTime, event.id)}`}
                            {event.location && ` • ${event.location}`}
                            {event.description && ` • ${event.description}`}
                          </span>
                        </div>
                        {!event.id.startsWith('google-') && !event.id.startsWith('canvas-') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 flex-shrink-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              // If it's a user-created event, always call handleRemoveEvent to delete from database
                              if (event.id.startsWith('custom-')) {
                                handleRemoveEvent(event.id);
                              } else {
                                handleToggleEvent(event.id);
                              }
                            }}
                          >
                            {addedEventIds.includes(event.id) || event.id.startsWith('custom-') ? (
                              <X className="h-3 w-3 text-red-600" />
                            ) : (
                              <Plus className="h-3 w-3 text-gray-700" />
                            )}
                          </Button>
                        )}
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
                          {/* Checkmark for Canvas events */}
                          {event.id.startsWith('canvas-') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleEvent(event.id);
                              }}
                              className="flex-shrink-0 mt-0.5"
                            >
                              {isEventOnCalendar(event) ? (
                                <CheckCircle2 className="h-4 w-4 text-[#752432]" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400 hover:text-[#752432] transition-colors" />
                              )}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            {event.type && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap inline-block mb-1">
                                {event.type}
                              </span>
                            )}
                            {event.organization && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap inline-block mb-1">
                                {getOrgAbbreviation(event.organization)}
                              </span>
                            )}
                            <div className="font-medium text-sm text-gray-900 mb-1">{event.title}</div>
                            <div className="text-xs text-gray-600 mb-1">
                              {formatTimeRange(event.startTime, event.endTime, event.id)}
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-600 mb-1">
                                {event.location}
                              </div>
                            )}
                            {event.description && (
                              <div 
                                className="text-xs text-gray-500 mt-1 line-clamp-2"
                                dangerouslySetInnerHTML={{ 
                                  __html: event.id.startsWith('canvas-') 
                                    ? event.description.replace(/(<a href="https:\/\/canvas\.wisc\.edu[^"]*"[^>]*>)/g, '<br /><br />$1')
                                    : event.description.replace(/\n/g, '<br />')
                                }}
                              />
                            )}
                          </div>
                          {!event.id.startsWith('google-') && !event.id.startsWith('canvas-') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // If it's a user-created event, always call handleRemoveEvent to delete from database
                                if (event.id.startsWith('custom-')) {
                                  handleRemoveEvent(event.id);
                                } else {
                                  handleToggleEvent(event.id);
                                }
                              }}
                            >
                              {addedEventIds.includes(event.id) || event.id.startsWith('custom-') ? (
                                <X className="h-4 w-4 text-red-600" />
                              ) : (
                                <Plus className="h-4 w-4 text-gray-700" />
                              )}
                            </Button>
                          )}
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
                  Object.entries(groupedEvents).map(([dayName, dayEvents]) => {
                    // Check if this date is today
                    const today = new Date();
                    const isToday = dayEvents.length > 0 && (() => {
                      const [year, month, day] = dayEvents[0].date.split('-').map(Number);
                      const eventDate = new Date(year, month - 1, day);
                      return eventDate.toDateString() === today.toDateString();
                    })();
                    
                    return (
                    <div key={dayName} className="mb-3">
                      <div className="text-xs text-gray-700 uppercase font-bold mb-2 bg-[#752432] text-white px-3 py-1.5 rounded-md shadow-sm border-l-4 border-[#5A1C28]">
                        {isToday ? `TODAY • ${dayName}` : dayName}
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="flex items-center justify-between p-2 hover:bg-[#F5F1E8] rounded cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                              {/* Checkmark for Canvas events */}
                              {event.id.startsWith('canvas-') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEvent(event.id);
                                  }}
                                  className="flex-shrink-0"
                                >
                                  {isEventOnCalendar(event) ? (
                                    <CheckCircle2 className="h-4 w-4 text-[#752432]" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400 hover:text-[#752432] transition-colors" />
                                  )}
                                </button>
                              )}
                              {event.type && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap flex-shrink-0">
                                  {event.type}
                                </span>
                              )}
                              {event.organization && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap flex-shrink-0">
                                  {getOrgAbbreviation(event.organization)}
                                </span>
                              )}
                              <span className="text-xs text-gray-900 truncate">
                                {event.title}
                                {formatTimeRange(event.startTime, event.endTime, event.id) && ` • ${formatTimeRange(event.startTime, event.endTime, event.id)}`}
                                {event.location && ` • ${event.location}`}
                                {event.description && ` • ${event.description}`}
                              </span>
                            </div>
                            {!event.id.startsWith('google-') && !event.id.startsWith('canvas-') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 flex-shrink-0 ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // If it's a user-created event, always call handleRemoveEvent to delete from database
                                  if (event.id.startsWith('custom-')) {
                                    handleRemoveEvent(event.id);
                                  } else {
                                    handleToggleEvent(event.id);
                                  }
                                }}
                              >
                                {addedEventIds.includes(event.id) || event.id.startsWith('custom-') ? (
                                  <X className="h-3 w-3 text-red-600" />
                                ) : (
                                  <Plus className="h-3 w-3 text-gray-700" />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })
                ) : (
                  Object.entries(groupedEvents).map(([dayName, dayEvents]) => {
                    // Check if this date is today
                    const today = new Date();
                    const isToday = dayEvents.length > 0 && (() => {
                      const [year, month, day] = dayEvents[0].date.split('-').map(Number);
                      const eventDate = new Date(year, month - 1, day);
                      return eventDate.toDateString() === today.toDateString();
                    })();
                    
                    return (
                    <div key={dayName} className="mb-4">
                      <div className="text-xs text-gray-700 uppercase font-bold mb-2 bg-[#752432] text-white px-3 py-1.5 rounded-md shadow-sm border-l-4 border-[#5A1C28]">
                        {isToday ? `TODAY • ${dayName}` : dayName}
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="p-3 hover:bg-[#F5F1E8] rounded-lg cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                          >
                            <div className="flex items-start gap-2">
                              {/* Checkmark for Canvas events */}
                              {event.id.startsWith('canvas-') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEvent(event.id);
                                  }}
                                  className="flex-shrink-0 mt-0.5"
                                >
                                  {isEventOnCalendar(event) ? (
                                    <CheckCircle2 className="h-4 w-4 text-[#752432]" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400 hover:text-[#752432] transition-colors" />
                                  )}
                                </button>
                              )}
                              <div className="flex-1 min-w-0">
                                {event.type && (
                                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap inline-block mb-1">
                                    {event.type}
                                  </span>
                                )}
                                {event.organization && (
                                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap inline-block mb-1">
                                    {getOrgAbbreviation(event.organization)}
                                  </span>
                                )}
                                <div className="font-medium text-sm text-gray-900 mb-1">{event.title}</div>
                                <div className="text-xs text-gray-600 mb-1">
                                  {formatTimeRange(event.startTime, event.endTime, event.id)}
                                </div>
                                {event.location && (
                                  <div className="text-xs text-gray-600 mb-1">
                                    {event.location}
                                  </div>
                                )}
                                {event.description && (
                                  <div 
                                    className="text-xs text-gray-500 mt-1 line-clamp-2"
                                    dangerouslySetInnerHTML={{ 
                                      __html: event.id.startsWith('canvas-') 
                                        ? event.description.replace(/(<a href="https:\/\/canvas\.wisc\.edu[^"]*"[^>]*>)/g, '<br />$1')
                                        : event.description.replace(/\n/g, '<br />')
                                    }}
                                  />
                                )}
                              </div>
                              {!event.id.startsWith('google-') && !event.id.startsWith('canvas-') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // If it's a user-created event, always call handleRemoveEvent to delete from database
                                    if (event.id.startsWith('custom-')) {
                                      handleRemoveEvent(event.id);
                                    } else {
                                      handleToggleEvent(event.id);
                                    }
                                  }}
                                >
                                  {addedEventIds.includes(event.id) || event.id.startsWith('custom-') ? (
                                    <X className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Plus className="h-4 w-4 text-gray-700" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-[#FEFBF6] max-w-md" style={{ backgroundColor: '#FEFBF6' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">Calendar Settings</DialogTitle>
            <DialogDescription className="text-gray-600">
              Connect your calendar to external services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Connect to Google Calendar */}
            <div className="border border-gray-300 rounded-md p-4 hover:bg-[#F5F1E8] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-lg flex items-center justify-center bg-white border border-gray-200 overflow-hidden" style={{ width: '40px', height: '40px' }}>
                    <img 
                      src="/Google_Calendar_icon_(2020).svg.png" 
                      alt="Google Calendar" 
                      className="max-w-full max-h-full object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">Connect Google Calendar</div>
                    <div className="text-sm text-gray-600">Sync your events with Google Calendar</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-auto py-1 px-2 text-xs",
                      googleCalendarConnected
                        ? "bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700"
                        : "border-gray-300 hover:bg-white"
                    )}
                    onClick={googleCalendarConnected ? handleDisconnectGoogleCalendar : handleConnectGoogleCalendar}
                  >
                    {googleCalendarConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Connect to Canvas */}
            <div className="border border-gray-300 rounded-md p-4 hover:bg-[#F5F1E8] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="rounded-lg flex items-center justify-center bg-white border border-gray-200 overflow-hidden" style={{ width: '40px', height: '40px' }}>
                    <img 
                      src="/Logo_Canvas_Red_Vertical-768x593.png" 
                      alt="Canvas" 
                      style={{ width: '40px', height: 'auto', transform: 'scale(1.50)', transformOrigin: 'center' }}
                    />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">Connect Canvas</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!canvasCalendarConnected && (
                    <input
                      type="text"
                      placeholder="Paste Canvas feed URL"
                      value={canvasFeedUrl}
                      onChange={(e) => setCanvasFeedUrl(e.target.value)}
                      className="h-8 px-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white text-gray-900 placeholder-gray-500"
                      style={{ width: '150px' }}
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 py-1 px-2 text-xs whitespace-nowrap",
                      canvasCalendarConnected
                        ? "bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700"
                        : "border-gray-300 hover:bg-white"
                    )}
                    onClick={canvasCalendarConnected ? handleDisconnectCanvasCalendar : handleConnectCanvasCalendar}
                    disabled={isImportingCanvas}
                  >
                    {isImportingCanvas ? 'Connecting...' : canvasCalendarConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>
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
        <DialogContent className="rounded-[24px] shadow-2xl border border-white/60 overflow-hidden p-0" style={{ backgroundColor: '#faf5f1', borderRadius: 24, width: '500px', maxWidth: '92vw' }}>
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-white/60">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">Create New Event</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a new event to your calendar
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
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
                className="w-full h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs"
                style={{ backgroundColor: 'white', borderRadius: 16, fontSize: '12px' }}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs"
                style={{ backgroundColor: 'white', borderRadius: 16, fontSize: '12px', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs"
                  style={{ backgroundColor: 'white', borderRadius: 16, fontSize: '12px', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">End Time *</label>
                <input
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="w-full h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs"
                  style={{ backgroundColor: 'white', borderRadius: 16, fontSize: '12px', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Event Type</label>
              <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                <SelectTrigger className="mt-1 h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs" style={{ backgroundColor: 'white', borderRadius: 16 }}>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'white' }}>
                  <SelectItem value="personal" className="hover:bg-white focus:bg-white">Personal</SelectItem>
                  <SelectItem value="study" className="hover:bg-white focus:bg-white">Study</SelectItem>
                  <SelectItem value="meeting" className="hover:bg-white focus:bg-white">Meeting</SelectItem>
                  <SelectItem value="exam" className="hover:bg-white focus:bg-white">Exam</SelectItem>
                  <SelectItem value="assignment" className="hover:bg-white focus:bg-white">Assignment</SelectItem>
                  <SelectItem value="club-event" className="hover:bg-white focus:bg-white">Club Event</SelectItem>
                  <SelectItem value="panel" className="hover:bg-white focus:bg-white">Panel</SelectItem>
                  <SelectItem value="lunch" className="hover:bg-white focus:bg-white">Lunch & Learn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
              <Input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Enter location (optional)"
                className="w-full h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs"
                style={{ backgroundColor: 'white', borderRadius: 16, fontSize: '12px' }}
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
                className="w-full resize-none rounded-3xl border border-gray-200 focus:outline-none focus:ring-0 focus:border-gray-200 transition text-sm"
                style={{ backgroundColor: 'white', borderRadius: 24 }}
              />
            </div>
          </div>

          <div className="sticky bottom-0 -mx-6 px-6 py-3 border-t border-white/60 flex justify-center" style={{ backgroundColor: '#faf5f1' }}>
            <div className="flex gap-3">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="bg-[#FEFBF6] max-w-md" style={{ backgroundColor: '#FEFBF6' }}>
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
                    {(() => {
                      // Parse date string manually to avoid timezone issues
                      // selectedEvent.date is in format "YYYY-MM-DD"
                      const [year, month, day] = selectedEvent.date.split('-').map(Number);
                      const date = new Date(year, month - 1, day); // month is 0-indexed
                      return date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTimeRange(selectedEvent.startTime, selectedEvent.endTime, selectedEvent.id)}
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
                <div 
                  className="text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedEvent.id.startsWith('canvas-') 
                      ? selectedEvent.description.replace(/(<a href="https:\/\/canvas\.wisc\.edu[^"]*"[^>]*>)/g, '<br /><br />$1')
                      : selectedEvent.description.replace(/\n/g, '<br />')
                  }}
                />
              )}
              
              {selectedEvent.canvasUrl && !selectedEvent.description?.includes('href=') && (
                <a
                  href={selectedEvent.canvasUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#752432] hover:text-[#5a1c26] underline font-medium mt-2 inline-block"
                >
                  View in Canvas
                </a>
              )}
            </div>

            <div className="flex gap-2">
              {!selectedEvent.id.startsWith('google-') && !selectedEvent.id.startsWith('canvas-') && (
                <>
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
                </>
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

      {/* Canvas Events Modal */}
      <Dialog open={showCanvasEventsModal} onOpenChange={setShowCanvasEventsModal}>
        <DialogContent className="bg-[#FEFBF6] max-w-md flex flex-col" style={{ backgroundColor: '#FEFBF6', maxHeight: '80vh' }}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl text-gray-900">
              Canvas Events - {canvasEventsDay ? canvasEventsDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Assignments and events due on this day
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 flex-1 overflow-y-auto min-h-0">
            {canvasEventsForDay.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-40" />
                <p>No Canvas events due on this day</p>
              </div>
            ) : (
              canvasEventsForDay
                .sort((a, b) => {
                  // Sort by due time first, then alphabetically by title
                  const timeA = parseTime(a.endTime);
                  const timeB = parseTime(b.endTime);
                  if (timeA !== timeB) return timeA - timeB;
                  return a.title.localeCompare(b.title);
                })
                .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowCanvasEventsModal(false);
                    }}
                    className="flex items-center justify-between p-2 hover:bg-[#F5F1E8] rounded cursor-pointer border border-[#E5DFD4] bg-[#FEFBF6]"
                  >
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        {event.type && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap flex-shrink-0">
                            {event.type}
                          </span>
                        )}
                        {event.organization && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5E9EB] text-[#752432] border border-[#E5D5D8] whitespace-nowrap flex-shrink-0">
                            {getOrgAbbreviation(event.organization)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-900 truncate font-medium">
                          {event.title}
                        </div>
                        {formatTimeRange(event.startTime, event.endTime, event.id) && (
                          <div className="text-xs text-gray-600">
                            {formatTimeRange(event.startTime, event.endTime, event.id)}
                          </div>
                        )}
                        {(event.location || event.description) && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {event.location && event.location}
                            {event.location && event.description && ` • `}
                            {event.description && event.description.replace(/<[^>]*>/g, '')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
