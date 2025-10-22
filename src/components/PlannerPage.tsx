import { useState, useEffect } from 'react';
import { Search, Plus, X, Clock, MapPin, Trash2, Calendar, Save, FileText, ChevronDown, ChevronUp, FolderOpen, Grid, List, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
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

// Get course color by type
const getCourseColor = (courseType: string): string => {
  return courseColors[courseType as keyof typeof courseColors] || courseColors['Course'];
};

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Convert semester code to full name
const getSemesterFullName = (abbreviation: 'FA' | 'WI' | 'SP' | 'FS' | 'FW' | 'WS'): string => {
  switch (abbreviation) {
    case 'FA': return 'Fall';
    case 'WI': return 'Winter';
    case 'SP': return 'Spring';
    case 'FS': return 'Fall & Spring';
    case 'FW': return 'Fall & Winter';
    case 'WS': return 'Winter & Spring';
    default: return abbreviation;
  }
};

// Get individual semesters from code
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

// Check if course term matches selected semester
const courseMatchesSemester = (courseTerm: string, selectedSemester: 'FA' | 'WI' | 'SP'): boolean => {
  if (!courseTerm || courseTerm === 'TBD') return false;
  
  // Get the semester code from the course term (last 2 characters)
  const semesterCode = courseTerm.slice(-2);
  const semesters = getSemestersFromCode(semesterCode);
  
  return semesters.includes(selectedSemester);
};

// Determine current term by date (matches Home page logic)
const getCurrentTermByDate = (): 'FA' | 'WI' | 'SP' => {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate();

  // Fall: September 2 - November 25
  if ((month === 9 && day >= 2) || month === 10 || (month === 11 && day <= 25)) {
    return 'FA';
  }
  // Winter: January 5 - January 21
  if (month === 1 && day >= 5 && day <= 21) {
    return 'WI';
  }
  // Spring: January 26 - April 24
  if ((month === 1 && day >= 26) || month === 2 || month === 3 || (month === 4 && day <= 24)) {
    return 'SP';
  }
  // Default to Fall
  return 'FA';
};

// Truncate text to 125 words
const truncateText = (text: string, maxWords: number = 125): { truncated: string; isTruncated: boolean } => {
  if (!text || text === 'TBD') return { truncated: text, isTruncated: false };
  
  // Remove HTML tags for word counting
  const textWithoutHtml = text.replace(/<br\s*\/?>/gi, ' ');
  const words = textWithoutHtml.split(' ');
  
  if (words.length <= maxWords) {
    return { truncated: text, isTruncated: false };
  }
  
  // Find the position in the original HTML text that corresponds to the word limit
  const wordsToKeep = words.slice(0, maxWords);
  const textToKeep = wordsToKeep.join(' ');
  
  // Find this text in the original HTML text and truncate there
  const htmlBreakPoint = text.indexOf(textToKeep) + textToKeep.length;
  const truncated = text.substring(0, htmlBreakPoint) + '...';
  
  return { truncated, isTruncated: true };
};

// Format course description with proper spacing
const formatCourseDescription = (text: string): string => {
  if (!text || text === 'TBD') return text;
  
  let formatted = text;
  
  // Make specific text patterns bold
  const boldPatterns = [
    'Prerequisite:',
    'Prerequisites:',
    'Exam Type:',
    'Note:',
    'Co-/Pre-Requisite:',
    'LLM Students:',
    'By Permission:',
    'Add/Drop Deadline:'
  ];
  
  boldPatterns.forEach(pattern => {
    const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`, 'gi');
    formatted = formatted.replace(regex, `<strong>${pattern}</strong>`);
  });
  
  // Add line break before "Prerequisite:" or "Prerequisites:" only if there's text before it
  formatted = formatted.replace(/([^\s])\s*<strong>Prerequisite:<\/strong>/gi, '$1<br/><br/><strong>Prerequisite:</strong>');
  formatted = formatted.replace(/([^\s])\s*<strong>Prerequisites:<\/strong>/gi, '$1<br/><br/><strong>Prerequisites:</strong>');
  // Add line break before "Note:" only if there's text before it
  formatted = formatted.replace(/([^\s])\s*<strong>Note:<\/strong>/gi, '$1<br/><br/><strong>Note:</strong>');
  
  // Add line breaks around "Exam Type:" regardless of the specific value shown
  // Add line break before only if there's non-whitespace before it
  formatted = formatted.replace(/([^\s])\s*<strong>Exam Type:<\/strong>/gi, '$1<br/><br/><strong>Exam Type:</strong>');
  // Add line break after recognized Exam Type tokens (supports combinations and optional commas)
  formatted = formatted.replace(/(<strong>Exam Type:<\/strong>\s*(?:(?:No\s+Exam|One-?Day|Take\s*Home|In\s*Class)(?:\s+|\s*,\s*)?)+)/gi, '$1<br/><br/>' );
  
  return formatted;
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
  course_description: string;
  requirements: string;
}

interface ScheduledCourse extends PlannerCourse {
  scheduledId: string;
}

// Function to fetch real course data from Supabase
const fetchCourses = async (): Promise<PlannerCourse[]> => {
  try {
    const { data, error } = await supabase
      .from('planner')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    if (!data) {
      console.error('No data returned from Supabase');
      return [];
    }

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
        course_description: course.course_description || 'TBD',
        requirements: course.requirements || 'TBD'
    }));

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

// Generate requirements from actual course data
const getRequirements = (courses: PlannerCourse[]): string[] => {
  const requirements = new Set<string>();
  courses.forEach(course => {
    if (course.requirements && course.requirements !== 'TBD') {
      course.requirements.split(';').forEach(req => {
        const trimmedReq = req.trim();
        if (trimmedReq) {
          requirements.add(trimmedReq);
        }
      });
    }
  });
  return Array.from(requirements).sort();
};

// Filter options based on search term
const getFilteredAreas = (courses: PlannerCourse[], searchTerm: string): string[] => {
  const areas = getSubjectAreas(courses);
  if (!searchTerm) return areas;
  return areas.filter(area => 
    area.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

const getFilteredTypes = (courses: PlannerCourse[], searchTerm: string): string[] => {
  const types = getCourseTypes(courses);
  if (!searchTerm) return types;
  return types.filter(type => 
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

const getFilteredRequirements = (courses: PlannerCourse[], searchTerm: string): string[] => {
  const requirements = getRequirements(courses);
  if (!searchTerm) return requirements;
  return requirements.filter(req => 
    req.toLowerCase().includes(searchTerm.toLowerCase())
  );
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
  // Default selection: if Fall or Winter, select Spring; if Spring, select Fall
  const [selectedTerm, setSelectedTerm] = useState<'FA' | 'WI' | 'SP'>(() => {
    const current = getCurrentTermByDate();
    return current === 'SP' ? 'FA' : 'SP';
  });
  const [selectedAreaOfInterest, setSelectedAreaOfInterest] = useState<string>('all-areas');
  const [selectedType, setSelectedType] = useState<string>('all-types');
  const [selectedRequirements, setSelectedRequirements] = useState<string>('all-requirements');
  
  // Search states for filters
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [requirementsSearchTerm, setRequirementsSearchTerm] = useState('');
  
  // Popover states for searchable filters
  const [areaPopoverOpen, setAreaPopoverOpen] = useState(false);
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);
  const [requirementsPopoverOpen, setRequirementsPopoverOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedSchedulesDialog, setShowSavedSchedulesDialog] = useState(false);
  const [showCourseDetailDialog, setShowCourseDetailDialog] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<PlannerCourse | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [saveScheduleName, setSaveScheduleName] = useState('');
  const [selectedSemestersForSave, setSelectedSemestersForSave] = useState<('FA' | 'WI' | 'SP')[]>([]);
  // AI Assistant state
  const [showChatbot, setShowChatbot] = useState(false);
  // Saved schedules state with mock data
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);


  // State for real course data
  const [courses, setCourses] = useState<PlannerCourse[]>([]);

  // Clear all search terms when filters are reset
  const clearAllSearchTerms = () => {
    setAreaSearchTerm('');
    setTypeSearchTerm('');
    setRequirementsSearchTerm('');
  };

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




  // Clean course name by removing redundant words
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

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.faculty.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Primary filter: only show courses for the selected semester
    const matchesTerm = courseMatchesSemester(course.term, selectedTerm);
    
    const matchesAreaOfInterest = selectedAreaOfInterest === 'all-areas' ||
      course.subject_areas.split(';').some(area => 
        area.trim().toLowerCase().includes(selectedAreaOfInterest.toLowerCase())
      );

    const matchesType = selectedType === 'all-types' ||
      course.delivery_mode === selectedType;

    const matchesRequirements = selectedRequirements === 'all-requirements' ||
      (course.requirements && course.requirements !== 'TBD' && 
       course.requirements.split(';').some(req => 
         req.trim().toLowerCase().includes(selectedRequirements.toLowerCase())
       ));

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
           matchesType && matchesRequirements && matchesDays && notScheduled;
    
    
    return result;
  }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by course name

  // Calculate totals
  const totalCredits = scheduledCourses.reduce((sum, course) => sum + course.credits, 0);
  const semesterCredits = scheduledCourses
    .filter(course => courseMatchesSemester(course.term, selectedTerm))
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
    setIsDescriptionExpanded(false); // Reset description expansion state
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

  // Parse time string
  const parseTimeString = (timeStr: string) => {
    if (!timeStr || timeStr === 'TBD') {
      return null; // No fallback - TBD courses shouldn't be parsed
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
    return null;
  };

  // Clean up times display - show time only once if same for all days
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

  // Get specific time for a given day
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
    // Skip conflict detection if either course has TBD times
    if (!newCourse.times || newCourse.times === 'TBD') {
      return false;
    }
    
    // Get all days for the new course
    const newCourseDays = newCourse.days.split(',').map(d => d.trim().toLowerCase());
    
    return scheduledCourses.some(scheduled => {
      // Skip if scheduled course has TBD times
      if (!scheduled.times || scheduled.times === 'TBD') {
        return false;
      }
      
      const scheduledTimes = parseTimeString(scheduled.times);
      if (!scheduledTimes) return false; // Skip if parsing failed
      
      const scheduledStartMinutes = timeToMinutes(scheduledTimes.start);
      const scheduledEndMinutes = timeToMinutes(scheduledTimes.end);
      
      // Only check for conflicts if courses are in the same semester
      const newCourseSemesters = getSemestersFromCode(newCourse.term.slice(-2));
      const scheduledSemesters = getSemestersFromCode(scheduled.term.slice(-2));
      
      // Check if any semesters overlap
      const hasOverlappingSemester = newCourseSemesters.some(sem => scheduledSemesters.includes(sem));
      
      if (!hasOverlappingSemester) return false;
      
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
      if (!newTimes) return false; // Skip if parsing failed
      
      const newStartMinutes = timeToMinutes(newTimes.start);
      const newEndMinutes = timeToMinutes(newTimes.end);
      
      const timeOverlap = (newStartMinutes < scheduledEndMinutes && newEndMinutes > scheduledStartMinutes);
      
      return timeOverlap;
    });
  };

  // Get specific conflict details
  const getConflictDetails = (newCourse: PlannerCourse) => {
    // Skip conflict detection if new course has TBD times
    if (!newCourse.times || newCourse.times === 'TBD') {
      return null;
    }
    
    // Get all days for the new course
    const newCourseDays = newCourse.days.split(',').map(d => d.trim().toLowerCase());
    
    const conflictingCourse = scheduledCourses.find(scheduled => {
      // Skip if scheduled course has TBD times
      if (!scheduled.times || scheduled.times === 'TBD') {
        return false;
      }
      
      const scheduledTimes = parseTimeString(scheduled.times);
      if (!scheduledTimes) return false; // Skip if parsing failed
      
      const scheduledStartMinutes = timeToMinutes(scheduledTimes.start);
      const scheduledEndMinutes = timeToMinutes(scheduledTimes.end);
      
      // Only check for conflicts if courses are in the same semester
      const newCourseSemesters = getSemestersFromCode(newCourse.term.slice(-2));
      const scheduledSemesters = getSemestersFromCode(scheduled.term.slice(-2));
      
      // Check if any semesters overlap
      const hasOverlappingSemester = newCourseSemesters.some(sem => scheduledSemesters.includes(sem));
      
      if (!hasOverlappingSemester) return false;
      
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
      if (!newTimes) return false; // Skip if parsing failed
      
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

  // Format a single professor name from "lastname, firstname" to "Firstname Lastname"
  const formatSingleProfessor = (name: string): string => {
    console.log('formatSingleProfessor input:', name);
    
    if (name.includes(',')) {
      const parts = name.split(',');
      const lastName = parts[0].trim();
      const firstName = parts[1].trim();
      const result = `${firstName} ${lastName}`;
      console.log('formatSingleProfessor result:', result);
      return result;
    }
    const result = name.replace('Professor ', '');
    console.log('formatSingleProfessor result (no comma):', result);
    return result;
  };

  // Extract last name from faculty (for display in compact views)
  const getLastName = (fullName: string): string => {
    // Handle multiple professors separated by ";"
    if (fullName.includes(';')) {
      const professors = fullName.split(';').map(p => p.trim());
      if (professors.length === 1) {
        return getLastName(professors[0]);
      } else if (professors.length === 2) {
        return `${getLastName(professors[0])}; ${getLastName(professors[1])}`;
      } else {
        return `${getLastName(professors[0])}; et al.`;
      }
    }
    
    // Handle single professor "lastname, firstname" format
    if (fullName.includes(',')) {
      return fullName.split(',')[0].trim();
    }
    // Fallback for other formats
    const parts = fullName.replace('Professor ', '').split(' ');
    return parts[parts.length - 1];
  };

  // Get full faculty name without "Professor" prefix (for detailed views)
  const getFullFacultyName = (fullName: string): string => {
    console.log('getFullFacultyName input:', fullName);
    
    // Handle multiple professors separated by ";"
    if (fullName.includes(';')) {
      const professors = fullName.split(';').map(p => p.trim());
      const result = professors.map(formatSingleProfessor).join('; ');
      console.log('Multiple professors result:', result);
      return result;
    }
    
    // Handle single professor "lastname, firstname" format - convert to "First Name Last Name"
    const result = formatSingleProfessor(fullName);
    console.log('Single professor result:', result);
    return result;
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

  // Save schedule
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
      selectedSemestersForSave.some(sem => courseMatchesSemester(course.term, sem))
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
      
      toast.success(`Schedule "${newSavedSchedule.name}" saved successfully`, { duration: 2000 });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Error saving schedule');
    }
  };



  // Load saved schedule
  const handleLoadSavedSchedule = (savedSchedule: SavedSchedule) => {
    // Clear current schedule and load the saved one
    setScheduledCourses(savedSchedule.courses);
    setShowSavedSchedulesDialog(false);
    toast.success(`Loaded schedule "${savedSchedule.name}"`, { duration: 2000 });
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

      toast.success('Schedule deleted', { duration: 2000 });
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
      const semesterCode = course.term.slice(-2);
      const courseSemesters = getSemestersFromCode(semesterCode);
      courseSemesters.forEach(sem => semesters.add(sem));
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



  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#FAF5EF' }}>
      {/* Header */}
      <div className="border-b border-gray-200 shadow-sm" style={{ backgroundColor: '#752432' }}>
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title and controls - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-2xl font-semibold text-white whitespace-nowrap">Course Planner</h1>
            <div className="flex items-center gap-4">
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

              {/* Action Buttons - removed duplicate Save, now shown next to Clear All */}
              </div>
            </div>
            
            {/* Summary Stats and Actions */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex flex-col gap-0.5">
                <div className="text-xs">
                  <span className="text-white/80">Total Credits: </span>
                  <span className="font-medium text-white">{totalCredits}</span>
                </div>
                <TooltipProvider>
                  <div className="text-xs">
                    {(() => {
                      // For Fall/Spring semesters: show red for 1-9 credits and 16+ credits (with hover), white for 0 and 10-16 credits (no hover)
                      // For other semesters: always show white with no hover
                      const isFallOrSpring = selectedTerm === 'FA' || selectedTerm === 'SP';
                      const shouldShowHover = isFallOrSpring && semesterCredits > 0 && ((semesterCredits >= 1 && semesterCredits <= 9) || semesterCredits > 16);
                      
                      // Determine credit color: 0 => white, 1-9 => red, 10-16 => white, 17+ => red
                      const creditColor = (semesterCredits > 0 && semesterCredits <= 9) || semesterCredits >= 17 ? 'text-red-500' : 'text-white';
                      
                      if (shouldShowHover) {
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <span className="text-white/80">Semester Credits: </span>
                                <span className={`font-medium ${creditColor}`}>{semesterCredits}</span>
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
                            <span className={`font-medium ${creditColor}`}>{semesterCredits}</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                </TooltipProvider>
              </div>
              
              {scheduledCourses.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Only clear courses for the currently selected semester
                      setScheduledCourses(prev => 
                        prev.filter(course => !courseMatchesSemester(course.term, selectedTerm))
                      );
                    }}
                  className="flex items-center gap-1.5 bg-white/10 border-white/30 text-white hover:bg-white hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                </>
              )}

              {/* Save Button - always visible; disabled if no courses scheduled */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSaveDialog}
                disabled={scheduledCourses.length === 0}
                className={`flex items-center gap-1.5 bg-white/10 border-white/30 text-white ${
                  scheduledCourses.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-[#752432]'
                }`}
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              
              {/* Saved Schedules Button - stays to the right */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSavedSchedulesDialog(true);
                  loadSavedSchedules(); // Refresh saved schedules when opening dialog
                }}
                className="flex items-center gap-1.5 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
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
                  placeholder="Search courses or professors…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 bg-white border-gray-300 focus:border-white focus:ring-white ${searchTerm ? 'pr-10' : 'pr-3'}`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {showFilters && (
                <div className="space-y-3 pt-3 border-t border-white/20">
                  {/* Area of Interest */}
                  <div className="relative">
                    <Popover open={areaPopoverOpen} onOpenChange={setAreaPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={areaPopoverOpen}
                          className="w-full justify-between bg-white border-gray-300 pr-3 pl-3"
                        >
                          <span className="text-left flex-1">{selectedAreaOfInterest === 'all-areas' ? 'All Areas' : selectedAreaOfInterest}</span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] h-[250px] p-0" align="start">
                        <Command className="h-full flex flex-col">
                          <CommandInput 
                            placeholder="Search areas..." 
                            value={areaSearchTerm}
                            onValueChange={setAreaSearchTerm}
                            className="flex-shrink-0"
                          />
                          <CommandList className="flex-1 overflow-y-auto">
                            <CommandEmpty>No areas found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all-areas"
                                onSelect={() => {
                                  setSelectedAreaOfInterest('all-areas');
                                  setAreaSearchTerm('');
                                  setAreaPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedAreaOfInterest === 'all-areas' ? 'opacity-100' : 'opacity-0'
                                  }`}
                                />
                                All Areas
                              </CommandItem>
                              {getFilteredAreas(courses, areaSearchTerm).map((area) => (
                                <CommandItem
                                  key={area}
                                  value={area}
                                  onSelect={() => {
                                    setSelectedAreaOfInterest(area);
                                    setAreaSearchTerm('');
                                    setAreaPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedAreaOfInterest === area ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  />
                                  {area}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Course Type */}
                  <div className="relative">
                    <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={typePopoverOpen}
                          className="w-full justify-between bg-white border-gray-300 pr-3 pl-3"
                        >
                          <span className="text-left flex-1">{selectedType === 'all-types' ? 'All Types' : selectedType}</span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] h-[250px] p-0" align="start">
                        <Command className="h-full flex flex-col">
                          <CommandInput 
                            placeholder="Search types..." 
                            value={typeSearchTerm}
                            onValueChange={setTypeSearchTerm}
                            className="flex-shrink-0"
                          />
                          <CommandList className="flex-1 overflow-y-auto">
                            <CommandEmpty>No types found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all-types"
                                onSelect={() => {
                                  setSelectedType('all-types');
                                  setTypeSearchTerm('');
                                  setTypePopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedType === 'all-types' ? 'opacity-100' : 'opacity-0'
                                  }`}
                                />
                                All Types
                              </CommandItem>
                              {getFilteredTypes(courses, typeSearchTerm).map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={() => {
                                    setSelectedType(type);
                                    setTypeSearchTerm('');
                                    setTypePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedType === type ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  />
                                  {type}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Requirements */}
                  <div className="relative">
                    <Popover open={requirementsPopoverOpen} onOpenChange={setRequirementsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={requirementsPopoverOpen}
                          className="w-full justify-between bg-white border-gray-300 pr-3 pl-3"
                        >
                          <span className="text-left flex-1">{selectedRequirements === 'all-requirements' ? 'All Requirements' : selectedRequirements}</span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] h-[250px] p-0" align="start">
                        <Command className="h-full flex flex-col">
                          <CommandInput 
                            placeholder="Search requirements..." 
                            value={requirementsSearchTerm}
                            onValueChange={setRequirementsSearchTerm}
                            className="flex-shrink-0"
                          />
                          <CommandList className="flex-1 overflow-y-auto">
                            <CommandEmpty>No requirements found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all-requirements"
                                onSelect={() => {
                                  setSelectedRequirements('all-requirements');
                                  setRequirementsSearchTerm('');
                                  setRequirementsPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedRequirements === 'all-requirements' ? 'opacity-100' : 'opacity-0'
                                  }`}
                                />
                                All Requirements
                              </CommandItem>
                              {getFilteredRequirements(courses, requirementsSearchTerm).map((requirement) => (
                                <CommandItem
                                  key={requirement}
                                  value={requirement}
                                  onSelect={() => {
                                    setSelectedRequirements(requirement);
                                    setRequirementsSearchTerm('');
                                    setRequirementsPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedRequirements === requirement ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  />
                                  {requirement}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                  
                  {/* AI Assistant Button */}
                  <button
                    onClick={() => setShowChatbot(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                    title="Quadly - Your AI Course Assistant"
                  >
                    <div className="w-4 h-4 relative">
                      <svg viewBox="0 0 16 16" className="w-full h-full">
                        {/* Robot head */}
                        <rect x="3" y="2" width="10" height="8" rx="2" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="4" y="3" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/60" />
                        
                        {/* Eyes */}
                        <circle cx="6" cy="5" r="0.8" fill="currentColor" className="text-blue-400" />
                        <circle cx="10" cy="5" r="0.8" fill="currentColor" className="text-blue-400" />
                        
                        {/* Smile */}
                        <path d="M6 7 Q8 8.5 10 7" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-white/90" />
                        
                        {/* Antenna */}
                        <rect x="7.5" y="0" width="1" height="2" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <circle cx="8" cy="0.5" r="0.8" fill="currentColor" className="text-yellow-400 group-hover:text-yellow-200" />
                        <circle cx="8.3" cy="0.2" r="0.2" fill="currentColor" className="text-white" />
                        
                        {/* Body */}
                        <rect x="4.5" y="10" width="7" height="4" rx="1.5" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        
                        {/* Arms */}
                        <rect x="1.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="11.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        
                        {/* Feet */}
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
              <h3 className="font-medium text-gray-900">{getSemesterFullName(selectedTerm)} Courses</h3>
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
                        className={`group transition-all duration-200 cursor-pointer hover:bg-gray-50 bg-white border-2 rounded-lg ${
                          hasConflict ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                        style={hasConflict ? {} : { borderColor: `${getCourseColor(course.delivery_mode)}66` }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onClick={() => addCourseToSchedule(course)}
                      >
                        <div className="px-3 py-1.5 relative">
                          {/* First line: Course Name (bold) on left, Credits on right */}
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="font-bold text-gray-900 text-xs leading-tight flex-1 pr-2 flex items-center gap-2">
                              <span className="group-hover:hidden line-clamp-2 break-words">
                                {getCleanCourseName(course.name, course.delivery_mode)}
                              </span>
                              <span className="hidden group-hover:inline line-clamp-2 break-words">
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
                                  {course.credits} CR
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
                            <div className="text-xs text-red-600 font-medium leading-tight mt-0.5 line-clamp-2 break-words">
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
                          // Move plus button up when card is hovered
                          const plusButton = e.currentTarget.querySelector('button[title="Add to calendar"]') as HTMLElement;
                          if (plusButton) {
                            plusButton.style.bottom = '20px';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          if (!hasConflict) {
                            e.currentTarget.style.borderColor = `${getCourseColor(course.delivery_mode)}33`;
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                          // Move plus button back down when card is not hovered
                          const plusButton = e.currentTarget.querySelector('button[title="Add to calendar"]') as HTMLElement;
                          if (plusButton) {
                            plusButton.style.bottom = '12px';
                          }
                        }}
                        onClick={() => showCourseDetail(course)}
                      >
                        <CardContent className="p-3 relative">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1 text-sm line-clamp-2 break-words">{getCleanCourseName(course.name, course.delivery_mode)}</h3>
                              <p className="text-xs text-gray-600 mb-1">{getLastName(course.faculty)}</p>
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
                            <div className="flex flex-col items-center gap-2 ml-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs font-medium"
                                style={{ 
                                  backgroundColor: getCourseColor(course.delivery_mode), 
                                  borderColor: getCourseColor(course.delivery_mode),
                                  color: 'white'
                                }}
                              >
                                {course.credits} CR
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
                              <div className="text-xs text-red-600 font-medium line-clamp-2 break-words">
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
                              const currentBg = getCourseColor(course.delivery_mode);
                              // Darken the color on hover
                              const rgb = hexToRgb(currentBg);
                              if (rgb) {
                                e.currentTarget.style.backgroundColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                              }
                            }}
                            onMouseLeave={(e) => {
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
            <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
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
                          const matchesSemester = courseMatchesSemester(course.term, selectedTerm);
                          
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
                          if (!times) return; // Skip TBD courses
                          
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
                          if (!times) return null; // Skip TBD courses
                          
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
                              
                              // Skip conflict detection if either course has TBD times
                              if (!course.times || course.times === 'TBD' || !scheduled.times || scheduled.times === 'TBD') {
                                return false;
                              }
                              
                              // Only check for conflicts if courses are in the same semester
                              const courseSemesters = getSemestersFromCode(course.term.slice(-2));
                              const scheduledSemesters = getSemestersFromCode(scheduled.term.slice(-2));
                              
                              // Check if any semesters overlap
                              const hasOverlappingSemester = courseSemesters.some(sem => scheduledSemesters.includes(sem));
                              
                              if (!hasOverlappingSemester) return false;
                              
                              const scheduledTimes = parseTimeString(scheduled.times);
                              const courseTimes = parseTimeString(course.times);
                              
                              if (!scheduledTimes || !courseTimes) return false; // Skip if parsing failed
                              
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
                                  <div className={`text-xs font-medium mb-0.5 leading-tight line-clamp-2 break-words ${
                                    hasTimeConflict ? 'text-red-900' : 'text-white'
                                  }`}>
                                    {getCleanCourseName(course.name, course.delivery_mode)}
                                  </div>
                                  <div className={`text-xs mb-0.5 ${
                                    hasTimeConflict ? 'text-red-800 opacity-90' : 'text-white opacity-90'
                                  }`}>
                                    {course.credits} CR • {getLastName(course.faculty)}
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
                                  className={`absolute top-0 right-0 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30 ${
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
                        }).filter(Boolean).flat();
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
                <h3 className="text-lg font-medium text-gray-500">Your schedule is empty</h3>
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
                            ? 'border-[#752531]'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{
                          backgroundColor: selectedSemestersForSave.includes(semester) ? '#752531' : 'transparent'
                        }}
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
                            {getSemesterFullName(semester)} ({scheduledCourses.filter(c => courseMatchesSemester(c.term, semester)).reduce((sum, course) => sum + course.credits, 0)} credits) • {scheduledCourses.filter(c => courseMatchesSemester(c.term, semester)).length} courses
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            {scheduledCourses.filter(c => courseMatchesSemester(c.term, semester)).map((course, _index) => (
                              <p key={course.scheduledId} className="text-xs">
                                • {getCleanCourseName(course.name, course.delivery_mode)}
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


      {/* Saved Schedules Dialog */}
      <Dialog open={showSavedSchedulesDialog} onOpenChange={setShowSavedSchedulesDialog}>
        <DialogContent className="sm:max-w-lg">
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
                        <span>{schedule.semesters.map(sem => getSemesterFullName(sem)).join(', ')}</span>
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
                                <div>
                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-50 transition-colors">
                                    {getSemesterFullName(semester)} ({schedule.courses.filter(c => courseMatchesSemester(c.term, semester)).reduce((sum, course) => sum + course.credits, 0)} credits)
                                </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" >
                                <div className="max-w-xs">
                                  {schedule.courses.filter(c => courseMatchesSemester(c.term, semester)).map((course, _index) => (
                                    <p key={course.scheduledId} className="text-xs">
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
            width: '805px', 
            height: '690px', 
            maxWidth: '805px', 
            maxHeight: '690px',
            minWidth: '805px',
            minHeight: '690px'
          }}
        >
          <div className="w-full h-full flex flex-col" style={{ height: '690px' }}>
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
                    {selectedCourseForDetail.credits} {selectedCourseForDetail.credits === 1 ? 'Credit' : 'Credits'}
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
              <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ height: '490px' }}>
              {/* Course Description */}
              <div>
                {(() => {
                  const formattedDescription = formatCourseDescription(selectedCourseForDetail.course_description);
                  const { truncated, isTruncated } = truncateText(formattedDescription);
                  return (
              <div>
                 <p 
                   className="text-sm text-gray-600 leading-relaxed"
                   dangerouslySetInnerHTML={{ 
                     __html: isDescriptionExpanded ? formattedDescription : truncated 
                   }}
                 />
                      {isTruncated && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-sm font-medium mt-2 transition-colors"
                          style={{ 
                            color: getCourseColor(selectedCourseForDetail.delivery_mode)
                          }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.8'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
                        >
                          {isDescriptionExpanded ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Course Information Grid */}
              <div className="space-y-4">
                {/* Days and Times row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Days</label>
                    <p 
                      className="text-sm"
                      style={{ color: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                    >
                      {selectedCourseForDetail.days}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Times</label>
                    <p 
                      className="text-sm"
                      style={{ color: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                    >
                      {getCleanTimesDisplay(selectedCourseForDetail.times)}
                    </p>
                  </div>
                </div>
                
                {/* Professor and Location row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Professor</label>
                    {selectedCourseForDetail.faculty.includes(';') ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {selectedCourseForDetail.faculty
                          .split(';')
                          .map((name) => name.trim())
                          .filter((name) => name.length > 0)
                          .map((name, idx, arr) => (
                            <span key={`${name}-${idx}`} className="flex items-center">
                              <button
                                onClick={() => handleProfessorClick(name)}
                                className="text-sm underline cursor-pointer bg-transparent border-none p-0 font-normal"
                                style={{ color: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                              >
                                {getFullFacultyName(name)}
                              </button>
                              {idx < arr.length - 1 && <span className="px-2 text-gray-400">|</span>}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleProfessorClick(selectedCourseForDetail.faculty)}
                        className="text-sm underline cursor-pointer bg-transparent border-none p-0 font-normal"
                        style={{ color: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                      >
                        {getFullFacultyName(selectedCourseForDetail.faculty)}
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                    <p 
                      className="text-sm"
                      style={{ color: getCourseColor(selectedCourseForDetail.delivery_mode) }}
                    >
                      {selectedCourseForDetail.location}
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

      {/* AI Assistant Coming Soon */}
      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              AI Assistant - Coming Soon
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Quadly AI Assistant</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Your personal course planning companion that will help you build the perfect schedule and achieve your academic goals!
                    </p>
                  </div>
                </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">How Quadly Will Help You:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                  <span><strong>Smart Recommendations:</strong> Get personalized course suggestions that align with your interests and career goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                  <span><strong>Conflict Detection:</strong> Never worry about scheduling conflicts again - we'll catch them before you do</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                  <span><strong>Prerequisite Intelligence:</strong> Stay on track with automatic verification of course requirements and pathways</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                  <span><strong>Credit Optimization:</strong> Graduate on time with perfectly balanced course loads tailored to your needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#752432] mt-2 flex-shrink-0"></div>
                  <span><strong>Conversational AI:</strong> Ask questions naturally and get instant, helpful answers about your academic journey</span>
                </li>
              </ul>
          </div>
          
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 text-center">
                Coming soon! Quadly will transform how you plan your academic journey and help you succeed.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}