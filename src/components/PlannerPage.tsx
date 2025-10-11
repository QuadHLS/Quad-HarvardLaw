import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Clock, MapPin, Trash2, Calendar, Download, Save, FileText, ChevronDown, ChevronUp, FolderOpen, Grid, List, Send, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// Course color mapping based on type
const courseColors = {
  'Course': '#0080BD',      // Blue
  'Seminar': '#04913A',     // Green
  'Reading Group': '#F22F21', // Red
  'Clinic': '#FFBB06'       // Yellow
};

// Helper function to get course color based on type
const getCourseColor = (courseType: string): string => {
  return courseColors[courseType as keyof typeof courseColors] || courseColors['Course'];
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Real course data interface matching database schema
interface PlannerCourse {
  id: string;
  name: string;
  course_number: string;
  term: string;
  faculty: string;
  credits: number;
  type: string;
  subject_areas: string;
  delivery_mode: string;
  days: string;
  times: string;
  location: string;
  prerequisites: string;
  exam_type: string;
  course_description: string;
  notes: string;
}

interface ScheduledCourse extends PlannerCourse {
  scheduledId: string;
}

// Function to fetch real course data from Supabase
const fetchCourses = async (): Promise<PlannerCourse[]> => {
  try {
    // console.log('Starting fetchCourses...');
    // console.log('Supabase client:', supabase);
    
    const { data, error } = await supabase
      .from('planner')
      .select('*')
      .order('name', { ascending: true });

    // console.log('Raw data from Supabase:', data);
    // console.log('Error from Supabase:', error);

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    if (!data) {
      console.error('No data returned from Supabase');
      return [];
    }

    // console.log('Raw data length:', data.length);
    // console.log('First few raw courses:', data.slice(0, 3));

    // Transform the data to handle null values and format properly
    const transformedData = data.map((course: any) => ({
      id: course.id || '',
      name: course.name || 'TBD',
      course_number: course.course_number || 'TBD',
      term: course.term || 'TBD',
      faculty: course.faculty || 'TBD',
      credits: course.credits || 0,
      type: course.type || 'TBD',
      subject_areas: course.subject_areas || 'TBD',
      delivery_mode: course.delivery_mode || 'TBD',
      days: course.days || 'TBD',
      times: course.times || 'TBD',
      location: course.location || 'TBD',
      prerequisites: course.prerequisites || 'TBD',
      exam_type: course.exam_type || 'TBD',
      course_description: course.course_description || 'TBD',
      notes: course.notes || 'TBD'
    }));

    // console.log('Transformed data length:', transformedData.length);
    // console.log('First few transformed courses:', transformedData.slice(0, 3));
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};
const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Generate subject areas from actual course data
const getSubjectAreas = (courses: PlannerCourse[]): string[] => {
  const areas = new Set<string>();
  courses.forEach(course => {
    if (course.subject_areas) {
      course.subject_areas.split(';').forEach(area => {
        const trimmedArea = area.trim();
        if (trimmedArea) {
          areas.add(trimmedArea);
        }
      });
    }
  });
  return Array.from(areas).sort();
};

// Generate course types from actual course data (using delivery_mode column)
const getCourseTypes = (courses: PlannerCourse[]): string[] => {
  const types = new Set<string>();
  courses.forEach(course => {
    if (course.delivery_mode) {
      types.add(course.delivery_mode);
    }
  });
  return Array.from(types).sort();
};


// Interface for saved schedules
interface SavedSchedule {
  id: string;
  name: string;
  createdAt: string;
  semesters: ('FA' | 'WI' | 'SP')[];
  courses: ScheduledCourse[];
}
interface PlannerPageProps {
  onNavigateToReviews?: (professorName?: string) => void;
}
export function PlannerPage({ onNavigateToReviews }: PlannerPageProps = {}) {
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<'FA' | 'WI' | 'SP'>('FA');
  const [selectedAreaOfInterest, setSelectedAreaOfInterest] = useState<string>('all-areas');
  const [selectedType, setSelectedType] = useState<string>('all-types');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showSavedSchedulesDialog, setShowSavedSchedulesDialog] = useState(false);
  const [showCourseDetailDialog, setShowCourseDetailDialog] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<PlannerCourse | null>(null);
  const [saveScheduleName, setSaveScheduleName] = useState('');
  const [selectedSemestersForSave, setSelectedSemestersForSave] = useState<('FA' | 'WI' | 'SP')[]>([]);
  const [selectedSemestersForDownload, setSelectedSemestersForDownload] = useState<('FA' | 'WI' | 'SP')[]>([]);
  // AI Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{id: string, type: 'user' | 'ai', content: string, timestamp: Date}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  // Saved schedules state with mock data
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);


  // State for real course data
  const [courses, setCourses] = useState<PlannerCourse[]>([]);

  // Function to load saved schedules from database
  const loadSavedSchedules = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // User not logged in, clear saved schedules
        setSavedSchedules([]);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('saved_schedules')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, no saved schedules
        setSavedSchedules([]);
        return;
      } else if (profileError) {
        console.error('Error fetching saved schedules:', profileError);
        return;
      }

      const savedSchedules: SavedSchedule[] = profileData?.saved_schedules || [];
      setSavedSchedules(savedSchedules);
    } catch (error) {
      console.error('Error loading saved schedules:', error);
    }
  };

  // Fetch real course data and saved schedules on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load courses
        const fetchedCourses = await fetchCourses();
        setCourses(fetchedCourses);
        
        // Load saved schedules
        await loadSavedSchedules();
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      }
    };

    loadData();
  }, []);




  // Helper function to clean course name by removing redundant words
  const getCleanCourseName = (name: string, type: string) => {
    if (type === 'Seminar' && name.includes('Seminar')) {
      return name.replace(/\s*Seminar\s*/g, ' ').trim();
    }
    if (type === 'Reading Group' && name.includes('Reading Group')) {
      return name.replace(/\s*Reading Group\s*/g, ' ').trim();
    }
    if (type === 'Clinic' && name.includes('Clinic')) {
      return name.replace(/\s*Clinic\s*/g, ' ').trim();
    }
    return name;
  };

  // Debug: Log current filter values (can be removed in production)
  // console.log('Current filter values:', {
  //   searchTerm,
  //   selectedTerm,
  //   selectedAreaOfInterest,
  //   selectedType,
  //   selectedDays,
  //   totalCourses: courses.length
  // });

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.faculty.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Primary filter: only show courses for the selected semester
    // Handle different term formats: '2026SP' -> 'SP', '2026FA' -> 'FA', etc.
    const getTermFromCourse = (term: string) => {
      if (term.endsWith('SP')) return 'SP';
      if (term.endsWith('FA')) return 'FA';
      if (term.endsWith('WI')) return 'WI';
      return term; // fallback to original term
    };
    
    const courseTerm = getTermFromCourse(course.term);
    const matchesTerm = courseTerm === selectedTerm;
    
    const matchesAreaOfInterest = selectedAreaOfInterest === 'all-areas' ||
      course.subject_areas.split(';').some(area => 
        area.trim().toLowerCase().includes(selectedAreaOfInterest.toLowerCase())
      );

    const matchesType = selectedType === 'all-types' ||
      course.delivery_mode === selectedType;

    const matchesDays = selectedDays.length === 0 ||
      selectedDays.some(selectedDay => {
        // Map full day names to abbreviations
        const dayMapping: { [key: string]: string[] } = {
          'monday': ['mon', 'monday'],
          'tuesday': ['tue', 'tues', 'tuesday'],
          'wednesday': ['wed', 'wednesday'],
          'thursday': ['thu', 'thur', 'thurs', 'thursday'],
          'friday': ['fri', 'friday']
        };
        
        const selectedDayLower = selectedDay.toLowerCase();
        const possibleAbbreviations = dayMapping[selectedDayLower] || [selectedDayLower];
        
        return possibleAbbreviations.some(abbr => 
          course.days.toLowerCase().includes(abbr)
        );
      });
    
    // Don't show courses that are already scheduled
    const notScheduled = !scheduledCourses.some(scheduled => scheduled.id === course.id);
    
    const result = matchesSearch && matchesTerm && matchesAreaOfInterest && 
           matchesType && matchesDays && notScheduled;
    
    // Debug logging for first few courses (can be removed in production)
    // if (courses.indexOf(course) < 3) {
    //   console.log('Course filter debug:', {
    //     courseName: course.name,
    //     courseTerm: course.term,
    //     convertedTerm: courseTerm,
    //     selectedTerm,
    //     matchesTerm,
    //     matchesSearch,
    //     matchesAreaOfInterest,
    //     matchesType,
    //     matchesDays,
    //     notScheduled,
    //     result
    //   });
    // }
    
    return result;
  }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by course name

  // Calculate totals
  const totalCredits = scheduledCourses.reduce((sum, course) => sum + course.credits, 0);
  const semesterCredits = scheduledCourses
    .filter(course => {
      const getTermFromCourse = (term: string) => {
        if (term.endsWith('SP')) return 'SP';
        if (term.endsWith('FA')) return 'FA';
        if (term.endsWith('WI')) return 'WI';
        return term;
      };
      const courseTerm = getTermFromCourse(course.term);
      return courseTerm === selectedTerm;
    })
    .reduce((sum, course) => sum + course.credits, 0);

  // Get time slot index for positioning
  const getTimeSlotIndex = (time: string) => {
    const exactMatch = timeSlots.indexOf(time);
    if (exactMatch !== -1) {
      return exactMatch;
    }
    
    // For times not in the exact slots, calculate fractional position
    const timeInMinutes = timeToMinutes(time);
    const startTimeInMinutes = timeToMinutes('8:00 AM'); // First slot
    const minutesFromStart = timeInMinutes - startTimeInMinutes;
    const slotIndex = minutesFromStart / 60; // Each slot is 1 hour
    
    
    return Math.max(0, slotIndex);
  };

  // Show course detail popup
  const showCourseDetail = (course: PlannerCourse) => {
    setSelectedCourseForDetail(course);
    setShowCourseDetailDialog(true);
  };

  // Check if a course is already scheduled
  const isCourseScheduled = (course: PlannerCourse) => {
    return scheduledCourses.some(scheduled => scheduled.id === course.id);
  };

  // Get scheduled course by original course id
  const getScheduledCourse = (course: PlannerCourse) => {
    return scheduledCourses.find(scheduled => scheduled.id === course.id);
  };

  // Add course to schedule
  const addCourseToSchedule = (course: PlannerCourse, fromPopup: boolean = false) => {
    // Check for conflicts and show warning but still allow adding
    if (hasTimeConflict(course)) {
      const conflictDetails = getConflictDetails(course);
      if (conflictDetails) {
        // Time conflict detected but course will still be added
      }
    }

    const scheduledId = `${course.id}_${Date.now()}`;
    const scheduledCourse: ScheduledCourse = {
      ...course,
      scheduledId
    };
    setScheduledCourses(prev => [...prev, scheduledCourse]);
    
    // Close popup if adding from popup
    if (fromPopup) {
      setShowCourseDetailDialog(false);
    }
  };

  // Remove course from schedule
  const removeCourseFromSchedule = (scheduledId: string) => {
    const courseToRemove = scheduledCourses.find(course => course.scheduledId === scheduledId);
    setScheduledCourses(prev => prev.filter(course => course.scheduledId !== scheduledId));
    if (courseToRemove) {
      // Course removed from calendar
    }
  };

  // Helper function to parse time string (e.g., "1:30 PM - 3:30 PM | 4:00 PM - 5:00 PM")
  const parseTimeString = (timeStr: string) => {
    if (!timeStr || timeStr === 'TBD') {
      return { start: '9:00 AM', end: '10:00 AM' }; // Default fallback
    }
    
    // Split by pipe to get individual time blocks
    const timeBlocks = timeStr.split('|').map(block => block.trim());
    
    // Use the first time block (for courses with multiple days, we'll use the first occurrence)
    const firstBlock = timeBlocks[0];
    
    if (firstBlock) {
      const parts = firstBlock.split(' - ');
      if (parts.length === 2) {
        return {
          start: parts[0].trim(),
          end: parts[1].trim()
        };
      }
    }
    
    // Fallback if parsing fails
    return { start: '9:00 AM', end: '10:00 AM' };
  };

  // Helper function to clean up times display - show time only once if same for all days
  const getCleanTimesDisplay = (times: string): string => {
    if (!times || times === 'TBD') {
      return 'TBD';
    }
    
    const timeBlocks = times.split('|').map(block => block.trim());
    
    // If all time blocks are the same, return just one
    if (timeBlocks.length > 1 && timeBlocks.every(block => block === timeBlocks[0])) {
      return timeBlocks[0];
    }
    
    // If different times, return the original format
    return times;
  };

  // Helper function to get the specific time for a given day
  const getTimeForDay = (course: ScheduledCourse, targetDay: string): string => {
    if (!course.days || !course.times || course.times === 'TBD') {
      return 'TBD';
    }
    
    // Split days and times
    const days = course.days.split(',').map(d => d.trim().toLowerCase());
    const timeBlocks = course.times.split('|').map(block => block.trim());
    
    // Create day mapping for abbreviated to full day names
    const dayMapping: { [key: string]: string[] } = {
      'monday': ['mon', 'monday'],
      'tuesday': ['tue', 'tues', 'tuesday'],
      'wednesday': ['wed', 'wednesday'],
      'thursday': ['thu', 'thur', 'thurs', 'thursday'],
      'friday': ['fri', 'friday']
    };
    
    const targetDayLower = targetDay.toLowerCase();
    const possibleTargetDays = dayMapping[targetDayLower] || [targetDayLower];
    
    // Find the index of the target day in the days array
    let dayIndex = -1;
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (possibleTargetDays.some(targetDay => day.includes(targetDay))) {
        dayIndex = i;
        break;
      }
    }
    
    // Return the corresponding time block, or the first one if not found
    if (dayIndex >= 0 && dayIndex < timeBlocks.length) {
      return timeBlocks[dayIndex];
    } else if (timeBlocks.length > 0) {
      return timeBlocks[0]; // Fallback to first time block
    }
    
    return 'TBD';
  };

  // Check for time conflicts - highlight if ANY day/time overlaps
  const hasTimeConflict = (newCourse: PlannerCourse) => {
    // Get all days for the new course
    const newCourseDays = newCourse.days.split(',').map(d => d.trim().toLowerCase());
    
    return scheduledCourses.some(scheduled => {
      const scheduledTimes = parseTimeString(scheduled.times);
      const scheduledStartMinutes = timeToMinutes(scheduledTimes.start);
      const scheduledEndMinutes = timeToMinutes(scheduledTimes.end);
      
      // Only check for conflicts if courses are in the same semester
      const getTermFromCourse = (term: string) => {
        if (term.endsWith('SP')) return 'SP';
        if (term.endsWith('FA')) return 'FA';
        if (term.endsWith('WI')) return 'WI';
        return term;
      };
      const newCourseTerm = getTermFromCourse(newCourse.term);
      const scheduledTerm = getTermFromCourse(scheduled.term);
      const sameSemester = newCourseTerm === scheduledTerm;
      
      if (!sameSemester) return false;
      
      // Check if ANY day of the new course overlaps with ANY day of the scheduled course
      const scheduledDays = scheduled.days.split(',').map(d => d.trim().toLowerCase());
      
      const hasDayOverlap = newCourseDays.some(newDay => {
        return scheduledDays.some(scheduledDay => {
          // Handle day abbreviations (e.g., 'mon' matches 'monday')
          const dayMapping: { [key: string]: string[] } = {
            'mon': ['mon', 'monday'],
            'tue': ['tue', 'tues', 'tuesday'],
            'wed': ['wed', 'wednesday'],
            'thu': ['thu', 'thur', 'thurs', 'thursday'],
            'fri': ['fri', 'friday']
          };
          
          const newDayVariants = dayMapping[newDay] || [newDay];
          const scheduledDayVariants = dayMapping[scheduledDay] || [scheduledDay];
          
          return newDayVariants.some(nv => scheduledDayVariants.some(sv => nv === sv));
        });
      });
      
      if (!hasDayOverlap) return false;
      
      // Check for time overlap
      const newTimes = parseTimeString(newCourse.times);
      const newStartMinutes = timeToMinutes(newTimes.start);
      const newEndMinutes = timeToMinutes(newTimes.end);
      
      const timeOverlap = (newStartMinutes < scheduledEndMinutes && newEndMinutes > scheduledStartMinutes);
      
      return timeOverlap;
    });
  };

  // Get specific conflict details
  const getConflictDetails = (newCourse: PlannerCourse) => {
    // Get all days for the new course
    const newCourseDays = newCourse.days.split(',').map(d => d.trim().toLowerCase());
    
    const conflictingCourse = scheduledCourses.find(scheduled => {
      const scheduledTimes = parseTimeString(scheduled.times);
      const scheduledStartMinutes = timeToMinutes(scheduledTimes.start);
      const scheduledEndMinutes = timeToMinutes(scheduledTimes.end);
      
      // Only check for conflicts if courses are in the same semester
      const getTermFromCourse = (term: string) => {
        if (term.endsWith('SP')) return 'SP';
        if (term.endsWith('FA')) return 'FA';
        if (term.endsWith('WI')) return 'WI';
        return term;
      };
      const newCourseTerm = getTermFromCourse(newCourse.term);
      const scheduledTerm = getTermFromCourse(scheduled.term);
      const sameSemester = newCourseTerm === scheduledTerm;
      
      if (!sameSemester) return false;
      
      // Check if ANY day of the new course overlaps with ANY day of the scheduled course
      const scheduledDays = scheduled.days.split(',').map(d => d.trim().toLowerCase());
      
      const hasDayOverlap = newCourseDays.some(newDay => {
        return scheduledDays.some(scheduledDay => {
          // Handle day abbreviations (e.g., 'mon' matches 'monday')
          const dayMapping: { [key: string]: string[] } = {
            'mon': ['mon', 'monday'],
            'tue': ['tue', 'tues', 'tuesday'],
            'wed': ['wed', 'wednesday'],
            'thu': ['thu', 'thur', 'thurs', 'thursday'],
            'fri': ['fri', 'friday']
          };
          
          const newDayVariants = dayMapping[newDay] || [newDay];
          const scheduledDayVariants = dayMapping[scheduledDay] || [scheduledDay];
          
          return newDayVariants.some(nv => scheduledDayVariants.some(sv => nv === sv));
        });
      });
      
      if (!hasDayOverlap) return false;
      
      // Check for time overlap
      const newTimes = parseTimeString(newCourse.times);
      const newStartMinutes = timeToMinutes(newTimes.start);
      const newEndMinutes = timeToMinutes(newTimes.end);
      
      const timeOverlap = (newStartMinutes < scheduledEndMinutes && newEndMinutes > scheduledStartMinutes);
      
      return timeOverlap;
    });
    
    if (conflictingCourse) {
      return {
        course: conflictingCourse,
        days: conflictingCourse.days,
        time: conflictingCourse.times
      };
    }
    
    return null;
  };

  // Extract last name from faculty
  const getLastName = (fullName: string) => {
    // Handle "lastname, firstname" format
    if (fullName.includes(',')) {
      return fullName.split(',')[0].trim();
    }
    // Fallback to original logic for other formats
    const parts = fullName.replace('Professor ', '').split(' ');
    return parts[parts.length - 1];
  };

  // Get full faculty name without "Professor" prefix
  const getFullFacultyName = (fullName: string) => {
    // Handle "lastname, firstname" format - convert to "firstname lastname"
    if (fullName.includes(',')) {
      const parts = fullName.split(',');
      const lastName = parts[0].trim();
      const firstName = parts[1].trim();
      return `${firstName} ${lastName}`;
    }
    return fullName.replace('Professor ', '');
  };

  // Handle professor name click to navigate to reviews
  const handleProfessorClick = (instructorName: string) => {
    if (onNavigateToReviews) {
      const fullName = getFullFacultyName(instructorName);
      onNavigateToReviews(fullName);
    }
  };


  // Convert time to minutes for better calculation
  const timeToMinutes = (time: string): number => {
    if (!time || typeof time !== 'string') {
      return 540; // Default to 9:00 AM (9 * 60 = 540 minutes)
    }
    
    const parts = time.split(' ');
    if (parts.length < 2) {
      return 540; // Default fallback
    }
    
    const [timePart, period] = parts;
    const timeComponents = timePart.split(':');
    
    if (timeComponents.length < 2) {
      return 540; // Default fallback
    }
    
    const hours = parseInt(timeComponents[0], 10);
    const minutes = parseInt(timeComponents[1], 10) || 0;
    
    if (isNaN(hours) || isNaN(minutes)) {
      return 540; // Default fallback
    }
    
    const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : 
                         period === 'AM' && hours === 12 ? 0 : hours;
    return adjustedHours * 60 + minutes;
  };

  // Calculate course height based on duration
  const getCourseHeight = (startTime: string, endTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;
    // Each hour slot is 64px high, so calculate proportionally
    return Math.max(64, (durationMinutes / 60) * 64);
  };

  // Calculate course top position
  const getCourseTopPosition = (startTime: string): number => {
    const startIndex = getTimeSlotIndex(startTime);
    return startIndex * 64; // 64px per hour slot (no need to add header height since it's positioned within the relative container)
  };

  // Save schedule functionality
  const handleSaveSchedule = async () => {
    if (!saveScheduleName.trim()) {
      toast.error('Please enter a schedule name');
      return;
    }

    if (selectedSemestersForSave.length === 0) {
      toast.error('Please select at least one semester');
      return;
    }

    const coursesToSave = scheduledCourses.filter(course => 
      selectedSemestersForSave.some(sem => course.term.includes(sem))
    );

    if (coursesToSave.length === 0) {
      toast.error('No courses selected for the chosen semesters');
      return;
    }

    const newSavedSchedule: SavedSchedule = {
      id: `schedule_${Date.now()}`,
      name: saveScheduleName.trim(),
      createdAt: new Date().toISOString(),
      semesters: selectedSemestersForSave,
      courses: coursesToSave
    };

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Please log in to save schedules');
        return;
      }

      // Get current saved schedules from the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('saved_schedules')
        .eq('id', user.id)
        .single();

      console.log('Profile fetch result:', { profileData, profileError });

      // Get existing saved schedules or initialize empty array
      let existingSchedules: SavedSchedule[] = [];
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            saved_schedules: []
          });
        
        if (createError) {
          console.error('Error creating profile:', createError);
          toast.error('Error creating user profile');
          return;
        }
        existingSchedules = [];
      } else if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Error loading saved schedules');
        return;
      } else {
        existingSchedules = profileData?.saved_schedules || [];
      }
      
      // Add new schedule to existing ones
      const updatedSchedules = [...existingSchedules, newSavedSchedule];

      // Update the profile with new saved schedules
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          saved_schedules: updatedSchedules
        })
        .eq('id', user.id);

      console.log('Update result:', { updateError, updatedSchedules });

      if (updateError) {
        console.error('Error saving schedule:', updateError);
        toast.error('Error saving schedule');
        return;
      }

      // Update local state
      setSavedSchedules(updatedSchedules);
      setSaveScheduleName('');
      setSelectedSemestersForSave([]);
      setShowSaveDialog(false);
      
      toast.success(`Schedule "${newSavedSchedule.name}" saved successfully`);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Error saving schedule');
    }
  };

  // Download schedule functionality
  const handleDownloadSchedule = () => {
    if (selectedSemestersForDownload.length === 0) {
      toast.error('Please select at least one semester to download');
      return;
    }

    const coursesToDownload = scheduledCourses.filter(course => 
      selectedSemestersForDownload.some(sem => course.term.includes(sem))
    );

    if (coursesToDownload.length === 0) {
      toast.error('No courses found for the selected semesters');
      return;
    }

    // Simulate PDF download
    const semesterNames = selectedSemestersForDownload.join(', ');
    toast.success(`Downloading PDF for ${semesterNames} schedule...`);
    
    setSelectedSemestersForDownload([]);
    setShowDownloadDialog(false);
  };


  // Load saved schedule
  const handleLoadSavedSchedule = (savedSchedule: SavedSchedule) => {
    // Clear current schedule and load the saved one
    setScheduledCourses(savedSchedule.courses);
    setShowSavedSchedulesDialog(false);
    toast.success(`Loaded schedule "${savedSchedule.name}"`);
  };

  // Delete saved schedule
  const handleDeleteSavedSchedule = async (scheduleId: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Please log in to delete schedules');
        return;
      }

      // Update local state first
      const updatedSchedules = savedSchedules.filter(schedule => schedule.id !== scheduleId);
      setSavedSchedules(updatedSchedules);

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          saved_schedules: updatedSchedules
        })
        .eq('id', user.id);

      console.log('Delete update result:', { updateError, updatedSchedules });

      if (updateError) {
        console.error('Error deleting schedule:', updateError);
        toast.error('Error deleting schedule');
        // Revert local state on error
        setSavedSchedules(savedSchedules);
        return;
      }

      toast.success('Schedule deleted');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Error deleting schedule');
      // Revert local state on error
      setSavedSchedules(savedSchedules);
    }
  };

  // Get available semesters that have courses
  const getAvailableSemesters = (): ('FA' | 'WI' | 'SP')[] => {
    const semesters = new Set<'FA' | 'WI' | 'SP'>();
    scheduledCourses.forEach(course => {
      if (course.term.endsWith('FA')) semesters.add('FA');
      if (course.term.endsWith('WI')) semesters.add('WI');
      if (course.term.endsWith('SP')) semesters.add('SP');
    });
    return Array.from(semesters).sort((a, b) => {
      const order = { FA: 0, WI: 1, SP: 2 };
      return order[a] - order[b];
    });
  };

  // Handle opening the save dialog with pre-selected semesters
  const handleOpenSaveDialog = () => {
    const availableSemesters = getAvailableSemesters();
    setSelectedSemestersForSave(availableSemesters);
    setShowSaveDialog(true);
  };

  // Handle opening the download dialog with pre-selected semesters
  const handleOpenDownloadDialog = () => {
    const availableSemesters = getAvailableSemesters();
    setSelectedSemestersForDownload(availableSemesters);
    setShowDownloadDialog(true);
  };

  // AI Chatbot functionality
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      type: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content);
      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'ai' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Schedule-related queries
    if (input.includes('schedule') || input.includes('time') || input.includes('conflict')) {
      return "I can help you organize your schedule! I see you're looking at " + selectedTerm + " courses. Would you like me to recommend courses that fit specific time slots or help you avoid scheduling conflicts?";
    }
    
    // Interest-based queries
    if (input.includes('business') || input.includes('corporate')) {
      const businessCourses = filteredCourses.filter(c => c.subject_areas.toLowerCase().includes('business')).slice(0, 3);
      if (businessCourses.length > 0) {
        return `Great choice! I found ${businessCourses.length} business law courses for ${selectedTerm}: ${businessCourses.map(c => `${c.name} (${c.faculty})`).join(', ')}. Would you like details about any of these?`;
      }
    }
    
    if (input.includes('environmental') || input.includes('green')) {
      const envCourses = filteredCourses.filter(c => c.subject_areas.toLowerCase().includes('environmental')).slice(0, 3);
      if (envCourses.length > 0) {
        return `Perfect! Environmental law is fascinating. I found ${envCourses.length} environmental courses: ${envCourses.map(c => `${c.name} (${c.faculty})`).join(', ')}. These courses focus on sustainability and policy.`;
      }
    }
    
    if (input.includes('litigation') || input.includes('trial') || input.includes('court')) {
      const litigationCourses = filteredCourses.filter(c => c.subject_areas.toLowerCase().includes('litigation')).slice(0, 3);
      if (litigationCourses.length > 0) {
        return `Excellent! For litigation practice, I recommend: ${litigationCourses.map(c => `${c.name} (${c.faculty})`).join(', ')}. These will give you great courtroom experience.`;
      }
    }
    
    // Credit-related queries
    if (input.includes('credit') || input.includes('load')) {
      const currentCredits = scheduledCourses.filter(c => c.term.includes(selectedTerm)).reduce((sum, c) => sum + c.credits, 0);
      return `You currently have ${currentCredits} credits for ${selectedTerm}. The recommended range is 10-16 credits. ${currentCredits < 10 ? 'You might want to add more courses.' : currentCredits > 16 ? 'Consider reducing your course load.' : 'Your credit load looks good!'}`;
    }
    
    // Prerequisites
    if (input.includes('prerequisite') || input.includes('requirement')) {
      return "I can help you check prerequisites! Many upper-level courses require foundational courses like Contract Law, Torts, or Civil Procedure. What specific course are you interested in?";
    }
    
    // General recommendation
    if (input.includes('recommend') || input.includes('suggest') || input.includes('help')) {
      return `I'd be happy to help! I can recommend courses based on your interests, help avoid scheduling conflicts, or suggest courses that fulfill specific requirements. What area of law interests you most? (Business, Environmental, Litigation, Immigration, Civil Rights, etc.)`;
    }
    
    // Morning/afternoon preferences
    if (input.includes('morning') || input.includes('early')) {
      const morningCourses = filteredCourses.filter(c => {
        const times = c.times.toLowerCase();
        return times.includes('am') && (times.includes('8:') || times.includes('9:') || times.includes('10:') || times.includes('11:'));
      }).slice(0, 4);
      return `Here are some great morning courses for ${selectedTerm}: ${morningCourses.map(c => `${c.name} (${c.times})`).join(', ')}. Early classes can help you maintain a good work-life balance!`;
    }
    
    if (input.includes('afternoon') || input.includes('later')) {
      const afternoonCourses = filteredCourses.filter(c => {
        const times = c.times.toLowerCase();
        return times.includes('pm') && (times.includes('2:') || times.includes('3:') || times.includes('4:') || times.includes('5:'));
      }).slice(0, 4);
      return `Here are some excellent afternoon courses: ${afternoonCourses.map(c => `${c.name} (${c.times})`).join(', ')}. Afternoon classes can give you more flexibility in your morning routine!`;
    }
    
    // Default responses
    const defaultResponses = [
      `Hi there! I'm Quadly! 😊 I'm here to help you plan your perfect ${selectedTerm} schedule. I can recommend courses based on your interests, help you avoid conflicts, or suggest courses that meet specific requirements. What would you like to know?`,
      `Hello! I'm Quadly, and I can help you explore the ${filteredCourses.length} available courses for ${selectedTerm}! Tell me about your interests or scheduling preferences, and I'll suggest some great options.`,
      `Hey! Looking for course recommendations? I'm Quadly, and I can help you find courses in specific areas like Business Law, Environmental Law, Litigation, or Civil Rights. What interests you most?`,
      `Hi! I'm Quadly, your friendly course planning assistant! 🤖 I can help you build a balanced schedule, avoid time conflicts, and find courses that match your career goals. How can I help you today?`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#FAF5EF' }}>
      {/* Header */}
      <div className="border-b border-gray-200 shadow-sm" style={{ backgroundColor: '#752432' }}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-white">Course Planner</h1>
              {/* Term Selector */}
              <div className="relative bg-white/10 rounded-lg p-1 backdrop-blur-sm border border-white/20">
                <div className="flex items-center">
                  {(['FA', 'WI', 'SP'] as const).map((term) => (
                    <button
                      key={term}
                      onClick={() => setSelectedTerm(term)}
                      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        selectedTerm === term
                          ? 'text-[#752432] shadow-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      style={selectedTerm === term ? {
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      } : {}}
                    >
                      {term === 'FA' ? 'Fall' : term === 'WI' ? 'Winter' : 'Spring'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons - Only show when courses are scheduled */}
              {scheduledCourses.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenSaveDialog}
                    className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenDownloadDialog}
                    className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            
            {/* Summary Stats and Actions */}
            <div className="flex items-center gap-6">
              <TooltipProvider>
                <div className="text-sm">
                  {(() => {
                    // For Fall/Spring semesters: show red for 1-9 credits and 16+ credits (with hover), white for 0 and 10-16 credits (no hover)
                    // For other semesters: always show white with no hover
                    const isFallOrSpring = selectedTerm === 'FA' || selectedTerm === 'SP';
                    const shouldShowRed = isFallOrSpring && ((semesterCredits >= 1 && semesterCredits <= 9) || semesterCredits > 16);
                    const shouldShowHover = isFallOrSpring && semesterCredits > 0 && ((semesterCredits >= 1 && semesterCredits <= 9) || semesterCredits > 16);
                    
                    if (shouldShowHover) {
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-pointer">
                              <span className="text-white/80">Semester Credits: </span>
                              <span className="font-medium text-white">{semesterCredits}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Min 10 – Max 16</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    } else {
                      return (
                        <>
                          <span className="text-white/80">Semester Credits: </span>
                          <span className="font-medium text-white">{semesterCredits}</span>
                        </>
                      );
                    }
                  })()}
                </div>
              </TooltipProvider>
              <div className="text-sm">
                <span className="text-white/80">Total Credits: </span>
                <span className="font-medium text-white">{totalCredits}</span>
              </div>
              
              {scheduledCourses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Only clear courses for the currently selected semester
                    setScheduledCourses(prev => 
                      prev.filter(course => {
                        const getTermFromCourse = (term: string) => {
                          if (term.endsWith('SP')) return 'SP';
                          if (term.endsWith('FA')) return 'FA';
                          if (term.endsWith('WI')) return 'WI';
                          return term;
                        };
                        const courseTerm = getTermFromCourse(course.term);
                        return courseTerm !== selectedTerm;
                      })
                    );
                  }}
                  className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
              
              {/* Saved Schedules Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSavedSchedulesDialog(true);
                  loadSavedSchedules(); // Refresh saved schedules when opening dialog
                }}
                className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
              >
                <FolderOpen className="w-4 h-4" />
                Saved Schedules
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Course List Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col" style={{ backgroundColor: '#FEFBF6', height: 'calc(100vh - 73px)' }}>
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0 relative" style={{ backgroundColor: '#752432' }}>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 focus:border-white focus:ring-white"
                />
              </div>
              
              {showFilters && (
                <div className="space-y-3 pt-3 border-t border-white/20">
                  {/* Area of Interest */}
                  <div className="relative">
                    <Select value={selectedAreaOfInterest} onValueChange={setSelectedAreaOfInterest}>
                      <SelectTrigger className={`bg-white border-gray-300 ${selectedAreaOfInterest !== 'all-areas' ? 'pr-10' : 'pr-3'}`}>
                        <SelectValue placeholder="Area of Interest" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-areas">All Areas</SelectItem>
                        {getSubjectAreas(courses).map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAreaOfInterest !== 'all-areas' && (
                      <button
                        onClick={() => setSelectedAreaOfInterest('all-areas')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* Course Type */}
                  <div className="relative">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className={`bg-white border-gray-300 ${selectedType !== 'all-types' ? 'pr-10' : 'pr-3'}`}>
                        <SelectValue placeholder="Course Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-types">All Types</SelectItem>
                        {getCourseTypes(courses).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedType !== 'all-types' && (
                      <button
                        onClick={() => setSelectedType('all-types')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>


                  {/* Days of Week Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white">Days of Week</label>
                    <div className="flex gap-2 items-center mt-3">
                      {['M', 'T', 'W', 'Th', 'F'].map((dayLetter, index) => {
                        const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        const fullDay = fullDayNames[index];
                        const isSelected = selectedDays.includes(fullDay);
                        
                        return (
                          <button
                            key={dayLetter}
                            onClick={() => {
                              setSelectedDays(prev => 
                                isSelected
                                  ? prev.filter(day => day !== fullDay)
                                  : [...prev, fullDay]
                              );
                            }}
                            className={`w-6 h-6 text-xs font-medium rounded-full transition-all duration-200 flex items-center justify-center ${
                              isSelected
                                ? 'bg-white text-[#752432] border border-white'
                                : 'text-white border border-white/20 bg-transparent'
                            }`}
                          >
                            {dayLetter}
                          </button>
                        );
                      })}
                      {selectedDays.length > 0 && (
                        <button
                          onClick={() => setSelectedDays([])}
                          className="ml-2 p-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* View Mode Controls and Filter Toggle Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle Buttons */}
                  <div className="flex items-center bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white text-[#752432]'
                          : 'text-white bg-transparent'
                      }`}
                      title="Grid view"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white text-[#752432]'
                          : 'text-white bg-transparent'
                      }`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* AI Chatbot Robot Button */}
                  <button
                    onClick={() => setShowChatbot(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                    title="Quadly - Your AI Course Assistant"
                  >
                    {/* Cute Pixel Art Robot - Quadly */}
                    <div className="w-4 h-4 relative">
                      <svg viewBox="0 0 16 16" className="w-full h-full">
                        {/* Robot head - rounder and cuter */}
                        <rect x="3" y="2" width="10" height="8" rx="2" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="4" y="3" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/60" />
                        
                        {/* Heart eyes for extra cuteness */}
                        <path d="M5.5 4.5 L6 4 L6.5 4.5 L6 5.5 Z" fill="currentColor" className="text-pink-400 group-hover:text-pink-300" />
                        <path d="M9.5 4.5 L10 4 L10.5 4.5 L10 5.5 Z" fill="currentColor" className="text-pink-400 group-hover:text-pink-300" />
                        
                        {/* Happy smile */}
                        <path d="M5.5 7 Q8 8.5 10.5 7" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-white/90" />
                        
                        {/* Cute antenna with sparkle */}
                        <rect x="7.5" y="0" width="1" height="2" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <circle cx="8" cy="0.5" r="0.8" fill="currentColor" className="text-yellow-400 group-hover:text-yellow-200" />
                        <circle cx="8.3" cy="0.2" r="0.2" fill="currentColor" className="text-white" />
                        
                        {/* Round body */}
                        <rect x="4.5" y="10" width="7" height="4" rx="1.5" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <circle cx="6.5" cy="11.5" r="0.3" fill="currentColor" className="text-green-400" />
                        <circle cx="9.5" cy="11.5" r="0.3" fill="currentColor" className="text-blue-400" />
                        
                        {/* Stubby arms */}
                        <rect x="1.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="11.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        
                        {/* Little feet */}
                        <rect x="5.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="8.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                      </svg>
                    </div>
                  </button>
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Course List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {/* Semester Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">{selectedTerm === 'FA' ? 'Fall' : selectedTerm === 'WI' ? 'Winter' : 'Spring'} Courses</h3>
              <Badge variant="outline" className="text-sm bg-white">
                {filteredCourses.length} available
              </Badge>
            </div>
            
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-1">No courses available</p>
                <p className="text-sm">Try adjusting your filters or select a different semester</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3' : 'space-y-1'}>
                {filteredCourses.map(course => {
                  const hasConflict = hasTimeConflict(course);
                  const conflictDetails = hasConflict ? getConflictDetails(course) : null;
                  
                  if (viewMode === 'list') {

                    // List view - compact layout with course name, type, credits, professor, days and times
                    return (
                      <div 
                        key={course.id}
                        className={`group transition-all duration-200 cursor-pointer hover:bg-gray-50 bg-white border-2 ${
                          hasConflict ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onClick={() => showCourseDetail(course)}
                      >
                        <div className="px-3 py-1.5 relative">
                          {/* First line: Course Name (bold) on left, Credits on right */}
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="font-bold text-gray-900 text-xs leading-tight flex-1 pr-2 flex items-center gap-2">
                              <span className="group-hover:hidden">
                                {getCleanCourseName(course.name, course.delivery_mode)}
                              </span>
                              <span className="hidden group-hover:inline">
                                {(() => {
                                  const cleanName = getCleanCourseName(course.name, course.delivery_mode);
                                  // For Reading Groups only, truncate to 13 characters on hover
                                  if (course.delivery_mode === 'Reading Group') {
                                    return cleanName.length > 13 ? cleanName.substring(0, 13) + '...' : cleanName;
                                  }
                                  // For all other course types, show full name on hover
                                  return cleanName;
                                })()}
                              </span>
                              
                              {/* Course Type badge appears next to name on hover */}
                              <Badge 
                                variant="outline"
                                className="px-1 py-0 h-auto leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ 
                                  borderColor: getCourseColor(course.delivery_mode), 
                                  color: getCourseColor(course.delivery_mode),
                                  fontSize: '9px'
                                }}
                              >
                                {course.delivery_mode}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center flex-shrink-0">
                              {/* Credits badge */}
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant="outline" 
                                  className="px-1 py-0 h-auto leading-tight"
                                  style={{ 
                                    backgroundColor: getCourseColor(course.delivery_mode), 
                                    borderColor: getCourseColor(course.delivery_mode),
                                    color: 'white',
                                    fontSize: '9px'
                                  }}
                                >
                                  {course.credits}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Second line: Days and Times on left, Professor Last Name on right */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="leading-tight">{course.days}</span>
                              <span className="leading-tight">{getCleanTimesDisplay(course.times)}</span>
                            </div>
                            <span className="leading-tight">{getLastName(course.faculty)}</span>
                          </div>
                          
                          {/* Conflict warning if needed */}
                          {hasConflict && conflictDetails && (
                            <div className="text-xs text-red-600 font-medium leading-tight mt-0.5">
                              <span className="text-red-700 font-semibold">Conflicts with:</span> {getCleanCourseName(conflictDetails.course.name, conflictDetails.course.delivery_mode)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Grid view - original card layout
                    return (
                      <Card 
                        key={course.id}
                        className={`group transition-all duration-200 border-2 cursor-pointer hover:shadow-lg relative ${
                          hasConflict 
                            ? 'border-red-500 bg-red-50' 
                            : 'bg-white'
                        }`}
                        style={hasConflict ? {} : {
                          '--tw-border-opacity': '0.2',
                          borderColor: `${getCourseColor(course.delivery_mode)}33`,
                          '--hover-border-color': `${getCourseColor(course.delivery_mode)}80`,
                          '--hover-bg-color': `${getCourseColor(course.delivery_mode)}08`
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03)';
                          if (!hasConflict) {
                            e.currentTarget.style.borderColor = `${getCourseColor(course.delivery_mode)}80`;
                            e.currentTarget.style.backgroundColor = `${getCourseColor(course.delivery_mode)}08`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          if (!hasConflict) {
                            e.currentTarget.style.borderColor = `${getCourseColor(course.delivery_mode)}33`;
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                        onClick={() => showCourseDetail(course)}
                      >
                        <CardContent className="p-4 relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">{getCleanCourseName(course.name, course.delivery_mode)}</h3>
                              <p className="text-sm text-gray-600 mb-2">{getLastName(course.faculty)}</p>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline"
                                  className="text-xs"
                                  style={{ borderColor: getCourseColor(course.delivery_mode), color: getCourseColor(course.delivery_mode) }}
                                >
                                  {course.delivery_mode}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="text-sm font-medium"
                                style={{ 
                                  backgroundColor: getCourseColor(course.delivery_mode), 
                                  borderColor: getCourseColor(course.delivery_mode),
                                  color: 'white'
                                }}
                              >
                                {course.credits}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{course.days}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{getCleanTimesDisplay(course.times)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{course.location}</span>
                            </div>
                            {hasConflict && conflictDetails && (
                              <div className="text-xs text-red-600 font-medium">
                                <span className="text-red-700 font-semibold">Conflicts with:</span> {getCleanCourseName(conflictDetails.course.name, conflictDetails.course.delivery_mode)}
                              </div>
                            )}
                          </div>
                          
                          {/* Add to Calendar Button - Bottom Right Corner */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addCourseToSchedule(course);
                            }}
                            className="absolute right-3 w-6 h-6 rounded-sm flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                            style={{ 
                              backgroundColor: getCourseColor(course.delivery_mode),
                              color: 'white',
                              bottom: '12px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.bottom = '20px';
                              const currentBg = getCourseColor(course.delivery_mode);
                              // Darken the color on hover
                              const rgb = hexToRgb(currentBg);
                              if (rgb) {
                                e.currentTarget.style.backgroundColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.bottom = '12px';
                              e.currentTarget.style.backgroundColor = getCourseColor(course.delivery_mode);
                            }}
                            title="Add to calendar"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </CardContent>
                      </Card>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col relative" style={{ height: 'calc(100vh - 80px)' }}>
          {/* Calendar */}
          <div className="flex-1 p-6" style={{ backgroundColor: '#FAF5EF', overflowY: 'auto' }}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="grid grid-cols-6">
                {/* Time column */}
                <div className="border-r border-gray-200">
                  {/* Header cell */}
                  <div 
                    className="h-12 flex items-center justify-center border-b border-gray-200"
                    style={{ backgroundColor: '#752432' }}
                  >
                    <span className="text-white font-medium text-sm">Time</span>
                  </div>
                  
                  {/* Time slots */}
                  {timeSlots.map((time, index) => (
                    <div 
                      key={time}
                      className={`h-16 flex items-center justify-center text-sm text-gray-600 border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {daysOfWeek.map((day, dayIndex) => (
                  <div key={day} className={`relative ${dayIndex < 4 ? 'border-r border-gray-200' : ''}`}>
                    {/* Day header */}
                    <div 
                      className="h-12 flex items-center justify-center border-b border-gray-200"
                      style={{ backgroundColor: '#752432' }}
                    >
                      <span className="text-white font-medium text-sm">{day}</span>
                    </div>
                    
                    {/* Background time slots grid */}
                    <div className="relative">
                      {timeSlots.map((time, timeIndex) => (
                        <div 
                          key={`${day}-${time}-bg`}
                          className={`h-16 border-b border-gray-200 ${
                            timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                        />
                      ))}
                      
                      {/* Overlay courses */}
                      {(() => {
                        // Group courses by time slot to handle conflicts
                        const coursesInDay = scheduledCourses.filter(course => {
                          // First check if course is in the selected semester
                          const getTermFromCourse = (term: string) => {
                            if (term.endsWith('SP')) return 'SP';
                            if (term.endsWith('FA')) return 'FA';
                            if (term.endsWith('WI')) return 'WI';
                            return term;
                          };
                          const courseTerm = getTermFromCourse(course.term);
                          const matchesSemester = courseTerm === selectedTerm;
                          
                          if (!matchesSemester) return false;
                          
                          // Then check if course is on this day
                          const dayMapping: { [key: string]: string[] } = {
                            'monday': ['mon', 'monday'],
                            'tuesday': ['tue', 'tues', 'tuesday'],
                            'wednesday': ['wed', 'wednesday'],
                            'thursday': ['thu', 'thur', 'thurs', 'thursday'],
                            'friday': ['fri', 'friday']
                          };
                          
                          const dayLower = day.toLowerCase();
                          const courseDaysLower = course.days.toLowerCase();
                          
                          // Check if any of the mapped day abbreviations match
                          const possibleDays = dayMapping[dayLower] || [dayLower];
                          const matches = possibleDays.some(dayAbbr => courseDaysLower.includes(dayAbbr));
                          return matches;
                        });
                        
                        // Create time slot groups
                        const timeSlotGroups = new Map();
                        coursesInDay.forEach(course => {
                          const times = parseTimeString(course.times);
                          const startTime = times.start;
                          const endTime = times.end;
                          const key = `${startTime}-${endTime}`;
                          
                          if (!timeSlotGroups.has(key)) {
                            timeSlotGroups.set(key, []);
                          }
                          timeSlotGroups.get(key).push(course);
                        });
                        
                        return Array.from(timeSlotGroups.entries()).map(([_timeKey, courses]) => {
                          const firstCourse = courses[0];
                          const times = parseTimeString(firstCourse.times);
                          const height = getCourseHeight(times.start, times.end);
                          const top = getCourseTopPosition(times.start);
                          
                          
                          return courses.map((course: ScheduledCourse, index: number) => {
                            const courseColor = getCourseColor(course.delivery_mode);
                            const isConflicted = courses.length > 1;
                            const courseWidth = isConflicted ? `calc(${100 / courses.length}% - 1px)` : '100%';
                            const leftOffset = isConflicted ? `calc(${(100 / courses.length) * index}% + ${index}px)` : '0px';
                            
                            // Check if this course has conflicts with other scheduled courses
                            const hasTimeConflict = scheduledCourses.some(scheduled => {
                              if (scheduled.scheduledId === course.scheduledId) return false; // Don't conflict with itself
                              
                              // Only check for conflicts if courses are in the same semester
                              const getTermFromCourse = (term: string) => {
                                if (term.endsWith('SP')) return 'SP';
                                if (term.endsWith('FA')) return 'FA';
                                if (term.endsWith('WI')) return 'WI';
                                return term;
                              };
                              const courseTerm = getTermFromCourse(course.term);
                              const scheduledTerm = getTermFromCourse(scheduled.term);
                              const sameSemester = courseTerm === scheduledTerm;
                              
                              if (!sameSemester) return false;
                              
                              const scheduledTimes = parseTimeString(scheduled.times);
                              const courseTimes = parseTimeString(course.times);
                              
                              const scheduledStartMinutes = timeToMinutes(scheduledTimes.start);
                              const scheduledEndMinutes = timeToMinutes(scheduledTimes.end);
                              const courseStartMinutes = timeToMinutes(courseTimes.start);
                              const courseEndMinutes = timeToMinutes(courseTimes.end);
                              
                              // Check if courses are on the same day
                              const scheduledDays = scheduled.days.split(',').map(d => d.trim().toLowerCase());
                              const courseDays = course.days.split(',').map(d => d.trim().toLowerCase());
                              const sameDay = scheduledDays.some(day => courseDays.includes(day));
                              
                              if (!sameDay) return false;
                              
                              // Check if times overlap
                              return (courseStartMinutes < scheduledEndMinutes && courseEndMinutes > scheduledStartMinutes);
                            });
                            
                            return (
                              <div 
                                key={`${course.scheduledId}-${day}`}
                                className={`absolute group p-2 rounded-sm shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                                  hasTimeConflict ? 'border-red-500' : 'border-white/20'
                                }`}
                                style={{ 
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  left: leftOffset,
                                  width: courseWidth,
                                  backgroundColor: hasTimeConflict ? '#FEE2E2' : `${courseColor}CC`, // Red background for conflicts, normal color otherwise
                                  zIndex: 10 + index
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showCourseDetail(course);
                                }}
                              >
                                {/* Conflict overlay with diagonal lines */}
                                {isConflicted && (
                                  <div 
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: 'rgba(239, 68, 68, 0.3)', // Transparent red
                                      backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 4px,
                                        rgba(239, 68, 68, 0.4) 4px,
                                        rgba(239, 68, 68, 0.4) 8px
                                      )`,
                                      zIndex: 1
                                    }}
                                  />
                                )}
                                
                                <div className="relative z-10">
                                  <div className={`text-xs font-medium mb-0.5 leading-tight ${
                                    hasTimeConflict ? 'text-red-900' : 'text-white'
                                  }`}>
                                    {getCleanCourseName(course.name, course.delivery_mode)}
                                  </div>
                                  <div className={`text-xs mb-0.5 ${
                                    hasTimeConflict ? 'text-red-800 opacity-90' : 'text-white opacity-90'
                                  }`}>
                                    {course.credits} • {getLastName(course.faculty)}
                                  </div>
                                  <div className={`text-xs mb-1 ${
                                    hasTimeConflict ? 'text-red-700 opacity-60' : 'text-white opacity-60'
                                  }`}>
                                    {getTimeForDay(course, day)}
                                  </div>
                                  <div className={`text-xs mb-1 ${
                                    hasTimeConflict ? 'text-red-700 opacity-60' : 'text-white opacity-60'
                                  }`}>
                                    {course.location}
                                  </div>
                                </div>
                                
                                {/* Remove button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeCourseFromSchedule(course.scheduledId);
                                  }}
                                  className={`absolute top-1 right-1 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 ${
                                    hasTimeConflict 
                                      ? 'bg-red-200 hover:bg-red-300' 
                                      : 'bg-white/20 hover:bg-white/30'
                                  }`}
                                >
                                  <X className={`w-3 h-3 ${
                                    hasTimeConflict ? 'text-red-800' : 'text-white'
                                  }`} />
                                </button>
                              </div>
                            );
                          });
                        }).flat();
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Empty state for calendar - Centered on Wednesday */}
          {scheduledCourses.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center" style={{ transform: 'translateX(calc(16.67% + 2%))' }}>
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Your schedule is empty</h3>
                <p className="text-gray-400">Click on courses from the left to add them to your calendar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Schedule Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Schedule</DialogTitle>
            <DialogDescription>
              Choose which semesters to include and name your schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Schedule Name</label>
              <Input
                placeholder="Enter schedule name..."
                value={saveScheduleName}
                onChange={(e) => setSaveScheduleName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Semesters to Save</label>
              <div className="space-y-2">
                {getAvailableSemesters().map((semester) => (
                  <div key={semester} className="flex items-center space-x-2">
                    <div className="relative">
                      <div
                        className={`w-4 h-4 border-2 rounded-sm cursor-pointer flex items-center justify-center transition-colors ${
                          selectedSemestersForSave.includes(semester)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => {
                          if (selectedSemestersForSave.includes(semester)) {
                            setSelectedSemestersForSave(prev => prev.filter(s => s !== semester));
                          } else {
                            setSelectedSemestersForSave(prev => [...prev, semester]);
                          }
                        }}
                      >
                        {selectedSemestersForSave.includes(semester) && (
                          <Check className="w-3 h-3 text-white" style={{ strokeWidth: 3 }} />
                        )}
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label htmlFor={`save-${semester}`} className="text-sm font-medium">
                            {semester} ({scheduledCourses.filter(c => c.term.includes(semester)).reduce((sum, course) => sum + course.credits, 0)} credits) • {scheduledCourses.filter(c => c.term.includes(semester)).length} courses
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            {scheduledCourses.filter(c => c.term.includes(semester)).map((course, _index) => (
                              <p key={course.scheduledId} className="text-2xs">
                                {course.name}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSchedule} style={{ backgroundColor: '#752432' }}>
                Save Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Schedule Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Schedule PDF</DialogTitle>
            <DialogDescription>
              Select which semesters you'd like to download as PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Semesters to Download</label>
              <div className="space-y-2">
                {getAvailableSemesters().map((semester) => (
                  <div key={semester} className="flex items-center space-x-2">
                    <Checkbox
                      id={`download-${semester}`}
                      checked={selectedSemestersForDownload.includes(semester)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSemestersForDownload(prev => [...prev, semester]);
                        } else {
                          setSelectedSemestersForDownload(prev => prev.filter(s => s !== semester));
                        }
                      }}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label htmlFor={`download-${semester}`} className="text-sm font-medium">
                            {semester} ({scheduledCourses.filter(c => c.term.includes(semester)).reduce((sum, course) => sum + course.credits, 0)} credits) • {scheduledCourses.filter(c => c.term.includes(semester)).length} courses
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            {scheduledCourses.filter(c => c.term.includes(semester)).map((course, _index) => (
                              <p key={course.scheduledId} className="text-2xs">
                                {course.name}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownloadSchedule} style={{ backgroundColor: '#752432' }}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Schedules Dialog */}
      <Dialog open={showSavedSchedulesDialog} onOpenChange={setShowSavedSchedulesDialog}>
        <DialogContent className="sm:max-w-2xl">
          <TooltipProvider>
            <DialogHeader>
              <DialogTitle>Saved Schedules</DialogTitle>
              <DialogDescription>
                Select a saved schedule to load onto the planner.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
            {savedSchedules.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No saved schedules</h3>
                <p className="text-gray-400">Save a schedule to see it here.</p>
              </div>
            ) : (
              savedSchedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>{schedule.semesters.join(', ')}</span>
                        <span className="mx-2">•</span>
                        <span>{schedule.courses.length} courses</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span>Saved {new Date(schedule.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {schedule.semesters.map((semester) => (
                          <Tooltip key={semester}>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-50 transition-colors">
                                  {semester} ({schedule.courses.filter(c => c.term.includes(semester)).reduce((sum, course) => sum + course.credits, 0)} credits)
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" >
                                <div className="max-w-xs">
                                  {schedule.courses.filter(c => c.term.includes(semester)).map((course, _index) => (
                                    <p key={course.scheduledId} className="text-2xs">
                                      • {getCleanCourseName(course.name, course.delivery_mode)}
                                    </p>
                                  ))}
                                </div>
                              </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleLoadSavedSchedule(schedule)}
                        style={{ backgroundColor: '#752432' }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSavedSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSavedSchedulesDialog(false)}>
              Close
            </Button>
          </div>
          </TooltipProvider>
        </DialogContent>
      </Dialog>

      {/* Course Detail Dialog */}
      <Dialog open={showCourseDetailDialog} onOpenChange={setShowCourseDetailDialog}>
        <DialogContent 
          className="p-0"
          style={{ 
            width: '700px', 
            height: '600px', 
            maxWidth: '700px', 
            maxHeight: '600px',
            minWidth: '700px',
            minHeight: '600px'
          }}
        >
          <div className="w-full h-full flex flex-col" style={{ height: '600px' }}>
            <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
            <div className="flex items-center">
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {selectedCourseForDetail ? getCleanCourseName(selectedCourseForDetail.name, selectedCourseForDetail.delivery_mode) : 'Course Details'}
                {selectedCourseForDetail && (
                  <Badge 
                    variant="outline" 
                    className="text-xs font-medium"
                    style={{ 
                      backgroundColor: getCourseColor(selectedCourseForDetail.delivery_mode), 
                      borderColor: getCourseColor(selectedCourseForDetail.delivery_mode),
                      color: 'white'
                    }}
                  >
                    {selectedCourseForDetail.credits}
                  </Badge>
                )}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              View detailed information about this course including schedule, requirements, and enrollment details.
            </DialogDescription>
            <div className="flex items-center gap-3 mt-2">
              {selectedCourseForDetail && (
                <Badge 
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: getCourseColor(selectedCourseForDetail.delivery_mode), color: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                >
                  {selectedCourseForDetail.delivery_mode}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {selectedCourseForDetail && (
              <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ height: '400px' }}>
              {/* Course Description */}
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedCourseForDetail.course_description}
                </p>
              </div>
              
              {/* Course Information Grid */}
              <div className="space-y-4">
                {/* Days and Times row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Days</label>
                    <p className="text-sm text-gray-900">{selectedCourseForDetail.days}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Times</label>
                    <p className="text-sm text-gray-900">{getCleanTimesDisplay(selectedCourseForDetail.times)}</p>
                  </div>
                </div>
                
                {/* Professor and Location row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Professor</label>
                    <button
                      onClick={() => handleProfessorClick(selectedCourseForDetail.faculty)}
                      className="text-sm underline cursor-pointer bg-transparent border-none p-0 font-normal"
                      style={{ color: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                    >
                      {getFullFacultyName(selectedCourseForDetail.faculty)}
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                    <p className="text-sm text-gray-900">{selectedCourseForDetail.location}</p>
                  </div>
                </div>
                
                {/* Prerequisites and Exam row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Prerequisites</label>
                    <p className="text-sm text-gray-900">
                      {selectedCourseForDetail.prerequisites || 'None'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Exam</label>
                    <p className="text-sm text-gray-900">
                      {selectedCourseForDetail.exam_type || 'No Exam'}
                    </p>
                  </div>
                </div>
              </div>
              
                </div>
              )}
              
            {/* Action Buttons - Fixed at bottom */}
            {selectedCourseForDetail && (
              <div className="flex-shrink-0 flex justify-end gap-3 p-6 pt-4 border-t bg-white">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCourseDetailDialog(false)}
                >
                  Close
                </Button>
{(() => {
                  const isScheduled = isCourseScheduled(selectedCourseForDetail);
                  const scheduledCourse = getScheduledCourse(selectedCourseForDetail);
                  
                  return (
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (isScheduled && scheduledCourse) {
                          removeCourseFromSchedule(scheduledCourse.scheduledId);
                          setShowCourseDetailDialog(false);
                        } else {
                          addCourseToSchedule(selectedCourseForDetail, true);
                        }
                      }}
                      style={{ backgroundColor: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                      className="text-white"
                      onMouseEnter={(e) => {
                        const currentBg = getCourseColor(selectedCourseForDetail.delivery_mode);
                        const rgb = hexToRgb(currentBg);
                        if (rgb) {
                          const darkerColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                          e.currentTarget.style.backgroundColor = darkerColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = getCourseColor(selectedCourseForDetail.delivery_mode);
                      }}
                    >
                      {isScheduled ? (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Remove from Calendar
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add to Calendar
                        </>
                      )}
                    </Button>
                  );
                })()}
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chatbot Dialog */}
      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2" style={{ backgroundColor: '#752432' }}>
            <DialogTitle className="text-white flex items-center gap-2">
              {/* Quadly Robot Icon */}
              <div className="w-5 h-5 relative">
                <svg viewBox="0 0 16 16" className="w-full h-full">
                  {/* Quadly's head - rounder and cuter */}
                  <rect x="3" y="2" width="10" height="8" rx="2" fill="currentColor" className="text-yellow-300" />
                  <rect x="4" y="3" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/60" />
                  
                  {/* Heart eyes for extra cuteness */}
                  <path d="M5.5 4.5 L6 4 L6.5 4.5 L6 5.5 Z" fill="currentColor" className="text-pink-400" />
                  <path d="M9.5 4.5 L10 4 L10.5 4.5 L10 5.5 Z" fill="currentColor" className="text-pink-400" />
                  
                  {/* Happy smile */}
                  <path d="M5.5 7 Q8 8.5 10.5 7" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-white/90" />
                  
                  {/* Cute antenna with sparkle */}
                  <rect x="7.5" y="0" width="1" height="2" fill="currentColor" className="text-yellow-300" />
                  <circle cx="8" cy="0.5" r="0.8" fill="currentColor" className="text-yellow-200" />
                  <circle cx="8.3" cy="0.2" r="0.2" fill="currentColor" className="text-white" />
                  
                  {/* Round body */}
                  <rect x="4.5" y="10" width="7" height="4" rx="1.5" fill="currentColor" className="text-yellow-300" />
                  <circle cx="6.5" cy="11.5" r="0.3" fill="currentColor" className="text-green-400" />
                  <circle cx="9.5" cy="11.5" r="0.3" fill="currentColor" className="text-blue-400" />
                  
                  {/* Stubby arms */}
                  <rect x="1.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-yellow-300" />
                  <rect x="11.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-yellow-300" />
                  
                  {/* Little feet */}
                  <rect x="5.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-yellow-300" />
                  <rect x="8.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-yellow-300" />
                </svg>
              </div>
              Quadly
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm">
              Your friendly AI course planning assistant is here to help!
            </DialogDescription>
          </DialogHeader>
          
          {/* Chat Messages */}
          <div 
            ref={chatMessagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {chatMessages.length === 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-[#752432]">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#752432] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-3 h-3">
                      <svg viewBox="0 0 16 16" className="w-full h-full">
                        <rect x="3" y="2" width="10" height="8" fill="currentColor" className="text-yellow-300" />
                        <rect x="5" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                        <rect x="9" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                        <rect x="6" y="7" width="4" height="1" fill="currentColor" className="text-white" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>Hi! I'm Quadly, your friendly course planning assistant! 🤗 I can help you:</p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li>• Find courses that match your interests</li>
                      <li>• Avoid scheduling conflicts</li>
                      <li>• Balance your credit load</li>
                      <li>• Check prerequisites</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-500">
                      Try asking: "I'm interested in business law" or "Show me morning courses"
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-[#752432] text-white'
                      : 'bg-white text-gray-700 shadow-sm border-l-4 border-[#752432]'
                  }`}
                >
                  {message.type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#752432] flex items-center justify-center flex-shrink-0">
                        <div className="w-2.5 h-2.5">
                          <svg viewBox="0 0 16 16" className="w-full h-full">
                            <rect x="3" y="2" width="10" height="8" fill="currentColor" className="text-yellow-300" />
                            <rect x="5" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                            <rect x="9" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                            <rect x="6" y="7" width="4" height="1" fill="currentColor" className="text-white" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#752432]">Quadly</span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t bg-white">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me about courses..."
                className="flex-1 text-sm"
                maxLength={500}
              />
              <Button
                type="submit"
                disabled={!chatInput.trim()}
                style={{ backgroundColor: '#752432' }}
                className="text-white hover:opacity-90 disabled:opacity-50"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              You're viewing {selectedTerm} courses • {filteredCourses.length} available
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}