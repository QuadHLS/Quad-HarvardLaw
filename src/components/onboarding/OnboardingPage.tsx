import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type ClassYear = '1L' | '2L' | '3L';

interface CourseData {
  id: string;
  courseName: string;
  professor: string;
  credits: number;
  semester: 'Spring' | 'Fall' | 'Winter' | 'Spring 2026' | 'Fall 2025' | 'Winter 2026';
  days: string[];
  time: string;
  location?: string;
  original_course_id?: number;
}



const timeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const courseListRef = useRef<HTMLDivElement>(null);
  
  // Form state for Page 1
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [classYear, setClassYear] = useState<ClassYear | ''>('');
  const [section, setSection] = useState('');
  const [lrwSection, setLrwSection] = useState<'A' | 'B' | ''>('');
  const [loading, setLoading] = useState(false);

  // Form state for Page 2
  const [selectedCourses, setSelectedCourses] = useState<CourseData[]>([]);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<'Fall 2025' | 'Winter 2026' | 'Spring 2026'>('Fall 2025');
  const [allCourseData, setAllCourseData] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  
  // Course dialog state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [visuallySelectedCourseIndex, setVisuallySelectedCourseIndex] = useState<number | null>(null);
  const [showMaxCourseWarning, setShowMaxCourseWarning] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Display-only formatter: hide trailing section number (1-7) for 1L required courses.
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
    const match = rawName.match(pattern);
    if (match) {
      return rawName.replace(/\s[1-7]$/, '');
    }
    return rawName;
  };

  // Display-only formatter: map semester codes to names
  const formatDisplaySemester = (value: string | undefined | null): string => {
    if (!value) return 'TBD';
    const v = value.trim();
    if (/^2025FA$/i.test(v) || /Fall/i.test(v)) return 'Fall';
    if (/^2026WI$/i.test(v) || /Winter/i.test(v)) return 'Winter';
    if (/^2026SP$/i.test(v) || /Spring/i.test(v)) return 'Spring';
    return v;
  };

  // Normalize semester values for comparisons (handles codes, names, and whitespace)
  const normalizeSemesterValue = (value: string | undefined | null): string => {
    if (!value) return '';
    const v = String(value).trim();
    if (/^2025FA$/i.test(v) || /Fall/i.test(v)) return 'Fall';
    if (/^2026WI$/i.test(v) || /Winter/i.test(v)) return 'Winter';
    if (/^2026SP$/i.test(v) || /Spring/i.test(v)) return 'Spring';
    return v;
  };

  // Helper to extract a likely last name from an instructor string
  // Handles formats like "Last, First Middle" or "First Middle Last"
  const extractLastName = (instructor: string | undefined | null): string => {
    if (!instructor) return '';
    // If multiple instructors are present, use the first one's last name
    const firstInstructor = instructor.split(';')[0]?.trim() || '';
    const value = firstInstructor;
    if (!value) return '';
    if (value.includes(',')) {
      // Current format is "First, Last" → take the part after the comma
      const parts = value.split(',');
      return (parts[1] || '').trim() || value.trim();
    }
    // Otherwise assume last token is last name
    const parts = value.split(/\s+/);
    return parts[parts.length - 1] || value;
  };

  // Normalize day strings to three-letter codes to match calendar dayMap
  const normalizeDay = (day: string): string => {
    const d = (day || '').trim();
    const map: Record<string, string> = {
      Monday: 'Mon', Mon: 'Mon',
      Tuesday: 'Tue', Tue: 'Tue',
      Wednesday: 'Wed', Wed: 'Wed',
      Thursday: 'Thu', Thu: 'Thu',
      Friday: 'Fri', Fri: 'Fri',
    };
    return map[d] || d;
  };

  // Normalize time ranges like "3:45PM – 5:45PM" → "3:45 PM-5:45 PM"
  const normalizeTimeRange = (raw: string | undefined | null): string => {
    if (!raw) return 'TBD';
    let s = String(raw).trim();
    // Replace en/em dashes with hyphen
    s = s.replace(/[–—]/g, '-');
    // Collapse spaces around hyphen
    s = s.replace(/\s*-\s*/g, '-');
    // Ensure space before AM/PM
    s = s.replace(/(\d)\s*(AM|PM)\b/gi, '$1 $2');
    // Uppercase AM/PM
    s = s.replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
    return s;
  };

  const handleNext = async () => {
    console.log('handleNext called', { currentPage, isStep1Valid: isStep1Valid(), user: user?.id });
    
    if (currentPage === 1) {
      // Save basic information to profiles table
      if (!isStep1Valid()) {
        console.log('Form not valid:', { name, classYear, section });
        alert('Please fill in all required fields');
        return;
      }
      
      if (!user?.id) {
        console.log('No user ID');
        alert('User not authenticated. Please refresh and try again.');
        return;
      }

      setLoading(true);
      try {
        const profileData = {
          id: user.id,
          email: user.email || '',
          full_name: name.trim(),
          phone: phone.trim() || null,
          class_year: classYear,
          section: section,
          updated_at: new Date().toISOString(),
        };

        console.log('Saving profile data:', profileData);

        const { error } = await supabase
          .from('profiles')
          .upsert(profileData);

        if (error) {
          console.error('Error saving profile:', error);
          alert('Error saving your information. Please try again.');
          return;
        }

        console.log('Profile data saved successfully');
        setCurrentPage(2);
        } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving your information. Please try again.');
        } finally {
        setLoading(false);
        }
      } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentPage === 2) {
      setCurrentPage(1);
    }
  };

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/[^\d]/g, '');
    
    // Don't format if empty
    if (!phoneNumber) return '';
    
    // Format based on length
    if (phoneNumber.length <= 3) {
      return `(${phoneNumber}`;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} - ${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Name capitalization function
  const capitalizeName = (value: string) => {
    return value
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalizedName = capitalizeName(e.target.value);
    setName(capitalizedName);
  };

  const isStep1Valid = () => {
    return name.trim() && classYear && section;
  };

  // Page 2 helper functions
  const totalCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);

  // Check if course requirements are met
  const areRequirementsMet = () => {
    if (classYear === '1L') {
      // 1L: Need 9 required courses (7 initial + 2 LRW), 10th elective is optional
      return selectedCourses.length >= 9 && selectedCourses.length <= 10;
    } else if (classYear === '2L' || classYear === '3L') {
      // 2L/3L: Need at least 3 required courses, max 10 total courses
      return selectedCourses.length >= 3 && selectedCourses.length <= 10;
    }
    return false;
  };

  const handleRemoveCourse = (courseId: string) => {
    const courseToRemove = selectedCourses.find(course => course.id === courseId);
    
    // Check if this is a required course that cannot be removed
    if (courseToRemove && classYear === '1L') {
      const isRequired = selectedCourses.indexOf(courseToRemove) < 7 || 
                        courseToRemove.courseName.includes('First Year Legal Research and Writing') ||
                        courseToRemove.courseName.includes('Legal Research and Writing') ||
                        courseToRemove.courseName.includes('LRW');
      
      if (isRequired) {
        console.log('Cannot remove required course:', courseToRemove.courseName);
        return; // Don't remove required courses
      }
    }
    
    setSelectedCourses(prev => prev.filter(course => course.id !== courseId));
  };



  const handleAddCourse = () => {
    setShowCourseDialog(true);
    setSelectedCourse(null); // Clear any previously selected course
    setVisuallySelectedCourseIndex(null); // Clear visual selection
    setSearchQuery(''); // Clear search query
    fetchAllCourses();
  };

  const fetchAllCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('Courses')
        .select('*')
        .order('course_name');
      
      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }
      
      setAvailableCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCourseSelect = (course: any) => {
    setSelectedCourse(course);
    setSearchQuery(course.course_name);
  };

  const filteredCourses = searchQuery 
    ? availableCourses.filter(course =>
        course.course_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableCourses;



  const getCoursesForTimeSlot = (day: string, timeSlot: string) => {
    const filteredCourses = selectedCourses.filter(course => {
      // Filter by current semester
      const semesterMap: { [key: string]: string[] } = {
        'Fall 2025': ['Fall', 'Fall 2025', '2025FA'],
        'Winter 2026': ['Winter', 'Winter 2026', '2026WI'],
        'Spring 2026': ['Spring', 'Spring 2026', '2026SP']
      };
      
      const dayMap: { [key: string]: string } = {
        'Mon': 'Mon',
        'Tue': 'Tue', 
        'Wed': 'Wed',
        'Thu': 'Thu',
        'Fri': 'Fri'
      };
      
      // Handle both array format and comma-separated string format for days
      let courseDays: string[];
      if (Array.isArray(course.days)) {
        // If it's already an array, flatten any comma-separated strings within it
        courseDays = course.days.flatMap(d => 
          typeof d === 'string' && d.includes(',') 
            ? d.split(',').map(day => day.trim())
            : [d]
        );
      } else if (typeof course.days === 'string') {
        // If it's a string, split by comma
        courseDays = course.days.split(',').map(d => d.trim());
      } else {
        courseDays = [];
      }
      
      // Only show course in its starting time slot
      if (!courseDays.includes(dayMap[day])) {
        return false;
      }
      
      // Filter by current semester (normalize values to be robust against spacing/case)
      const validSemesters = (semesterMap[currentSemester] || []).map(normalizeSemesterValue);
      const normalizedCourseSemester = normalizeSemesterValue(course.semester as unknown as string);
      
      if (!validSemesters.includes(normalizedCourseSemester)) {
        return false;
      }

      // Parse course time range
      const timeParts = course.time.split('-');
      if (timeParts.length !== 2) return false;
      
      let startTime = timeParts[0].trim();
      let endTime = timeParts[1].trim();
      
      // Handle cases where AM/PM is only on the end time
      const endAmPm = endTime.match(/(AM|PM)/i);
      if (endAmPm && !startTime.match(/(AM|PM)/i)) {
        startTime += ' ' + endAmPm[0];
      }
      
      // Handle cases where both times have AM/PM
      if (course.time.includes('AM') && course.time.includes('PM')) {
        const fullTimeMatch = course.time.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
        if (fullTimeMatch) {
          startTime = `${fullTimeMatch[1]} ${fullTimeMatch[2]}`;
          endTime = `${fullTimeMatch[3]} ${fullTimeMatch[4]}`;
        }
      }
      
      // Convert times to 24-hour format for comparison
      const convertTo24Hour = (time: string) => {
        const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes; // Return total minutes
      };
      
      const courseStart = convertTo24Hour(startTime);
      const slotTime = convertTo24Hour(timeSlot);
      
      if (!courseStart || !slotTime) return false;
      
      // Only show course in its starting time slot
      const courseStartHour = Math.floor(courseStart / 60) * 60; // Round DOWN to nearest hour
      const slotHour = slotTime;
      
      // Check if this slot is the starting slot for the course
      const matches = courseStartHour === slotHour;
      
      return matches;
    });
    
    return filteredCourses;
  };

  // Calculate how many time slots a course spans
  const getCourseSpan = (course: CourseData) => {
    const timeParts = course.time.split('-');
    if (timeParts.length !== 2) return 1;
    
    let startTime = timeParts[0].trim();
    let endTime = timeParts[1].trim();
    
    // Handle cases where AM/PM is only on the end time
    const endAmPm = endTime.match(/(AM|PM)/i);
    if (endAmPm && !startTime.match(/(AM|PM)/i)) {
      startTime += ' ' + endAmPm[0];
    }
    
    // Handle cases where both times have AM/PM (e.g., "9:00 AM-1:00 PM")
    if (course.time.includes('AM') && course.time.includes('PM')) {
      const fullTimeMatch = course.time.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
      if (fullTimeMatch) {
        startTime = `${fullTimeMatch[1]} ${fullTimeMatch[2]}`;
        endTime = `${fullTimeMatch[3]} ${fullTimeMatch[4]}`;
      }
    }
    
    const convertTo24Hour = (time: string) => {
      const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };
    
    const courseStart = convertTo24Hour(startTime);
    const courseEnd = convertTo24Hour(endTime);
    
    if (!courseStart || !courseEnd) return 1;
    
    const durationInMinutes = courseEnd - courseStart;
    return Math.ceil(durationInMinutes / 60); // Each time slot is 1 hour
  };

  // Check if a time slot should be hidden (part of a multi-hour course)
  const isTimeSlotOccupied = (day: string, timeSlot: string) => {
    const dayMap: { [key: string]: string } = {
      'Mon': 'Mon',
      'Tue': 'Tue', 
      'Wed': 'Wed',
      'Thu': 'Thu',
      'Fri': 'Fri'
    };

    return selectedCourses.some(course => {
      // Filter by current semester
      const semesterMap: { [key: string]: string[] } = {
        'Fall 2025': ['Fall', 'Fall 2025', '2025FA'],
        'Winter 2026': ['Winter', 'Winter 2026', '2026WI'],
        'Spring 2026': ['Spring', 'Spring 2026', '2026SP']
      };
      
      const validSemesters = (semesterMap[currentSemester] || []).map(normalizeSemesterValue);
      const normalizedCourseSemester = normalizeSemesterValue(course.semester as unknown as string);
      if (!validSemesters.includes(normalizedCourseSemester)) return false;
      
      // Handle both array format and comma-separated string format for days
      let courseDays: string[];
      if (Array.isArray(course.days)) {
        // If it's already an array, flatten any comma-separated strings within it
        courseDays = course.days.flatMap(d => 
          typeof d === 'string' && d.includes(',') 
            ? d.split(',').map(day => day.trim())
            : [d]
        );
      } else if (typeof course.days === 'string') {
        // If it's a string, split by comma
        courseDays = course.days.split(',').map(d => d.trim());
      } else {
        courseDays = [];
      }
      
      if (!courseDays.includes(dayMap[day])) return false;
      
      const timeParts = course.time.split('-');
      if (timeParts.length !== 2) return false;
      
      let startTime = timeParts[0].trim();
      let endTime = timeParts[1].trim();
      
      const endAmPm = endTime.match(/(AM|PM)/i);
      if (endAmPm && !startTime.match(/(AM|PM)/i)) {
        startTime += ' ' + endAmPm[0];
      }
      
      // Handle cases where both times have AM/PM (e.g., "9:00 AM-1:00 PM")
      if (course.time.includes('AM') && course.time.includes('PM')) {
        const fullTimeMatch = course.time.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
        if (fullTimeMatch) {
          startTime = `${fullTimeMatch[1]} ${fullTimeMatch[2]}`;
          endTime = `${fullTimeMatch[3]} ${fullTimeMatch[4]}`;
        }
      }
      
      const convertTo24Hour = (time: string) => {
        const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      };
      
      const courseStart = convertTo24Hour(startTime);
      const courseEnd = convertTo24Hour(endTime);
      const slotTime = convertTo24Hour(timeSlot);
      
      if (!courseStart || !courseEnd || !slotTime) return false;
      
      // Round course start time to nearest hour for consistency
      const courseStartHour = Math.floor(courseStart / 60) * 60;
      
      // Check if this slot is within the course time but not the starting slot
      // A slot is occupied if it's part of a multi-hour course that started in a previous slot
      return slotTime >= courseStartHour && slotTime < courseEnd && slotTime !== courseStartHour;
    });
  };

  const handleSemesterNavigation = (direction: 'prev' | 'next') => {
    if (currentSemester === 'Fall 2025' && direction === 'next') {
      setCurrentSemester('Winter 2026');
    } else if (currentSemester === 'Winter 2026' && direction === 'prev') {
      setCurrentSemester('Fall 2025');
    } else if (currentSemester === 'Winter 2026' && direction === 'next') {
      setCurrentSemester('Spring 2026');
    } else if (currentSemester === 'Spring 2026' && direction === 'prev') {
      setCurrentSemester('Winter 2026');
    }
  };

  // Fetch courses from API for all students (1L, 2L, 3L)
  useEffect(() => {
    const fetchCourses = async () => {
      if (classYear === '1L' || classYear === '2L' || classYear === '3L') {
        console.log('Fetching courses for class year:', classYear);
        setCoursesLoading(true);
        try {
          // Use the Courses table which has all the course information
          const { data: courses, error } = await supabase
            .from('Courses')
            .select('*')
            .order('course_name');

          console.log('Course fetch response:', { courses, error });
          console.log('First course sample:', courses?.[0]);
          console.log('First course original_course_id:', courses?.[0]?.original_course_id);
          console.log('All columns in first course:', Object.keys(courses?.[0] || {}));

          if (error) {
            console.error('Error fetching courses:', error);
            setAllCourseData([]);
            return;
          }

          // Filter courses by year level if the table has that column
          // For now, get all courses since we don't know the exact structure
          const allCourses = courses || [];

          // Transform to match the expected format for auto-population
          const transformedCourses = allCourses.map((course: any) => ({
            course_number: course.course_number || course.id,
          course_name: course.course_name,
            semester: course.semester || 'Fall',
            instructor: course.instructor || 'TBD',
            credits: course.credits || 4,
            days: course.days || 'Monday;Wednesday;Friday',
            times: course.times || '9:00 AM-10:00 AM',
            location: course.location || 'TBD',
            original_course_id: course.original_course_id
          }));

          console.log('Transformed courses:', transformedCourses);
          console.log('First transformed course original_course_id:', transformedCourses[0]?.original_course_id);
          console.log('All columns in first transformed course:', Object.keys(transformedCourses[0] || {}));
          setAllCourseData(transformedCourses);
        } catch (error) {
          console.error('Error fetching courses:', error);
          setAllCourseData([]);
        } finally {
          setCoursesLoading(false);
        }
      }
    };

    fetchCourses();
  }, [classYear]);

  // Auto-populate 1L required courses when section is selected
  useEffect(() => {
    const autoPopulate1L = () => {
      if (classYear === '1L' && section && allCourseData.length > 0) {
        
        const sectionNumber = section;
        const requiredCourses = [
          `Civil Procedure ${sectionNumber}`,
          `Contracts ${sectionNumber}`, 
          `Criminal Law ${sectionNumber}`,
          `Torts ${sectionNumber}`,
          `Constitutional Law ${sectionNumber}`,
          `Property ${sectionNumber}`,
          `Legislation and Regulation ${sectionNumber}`
        ];

        const newSelectedCourses: CourseData[] = [];

        for (let i = 0; i < 7; i++) {
          const courseName = requiredCourses[i];
          
          // Search for course by name in the Courses library
          const matchingCourses = allCourseData.filter(
            (course) => course.course_name === courseName
          );

          if (matchingCourses.length > 0) {
            const course = matchingCourses[0];
            
            const courseData: CourseData = {
              id: `${courseName}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
              courseName: course.course_name,
              professor: course.instructor,
              credits: course.credits,
              semester: course.semester as 'Spring' | 'Fall' | 'Winter',
              days: course.days ? course.days.split(';').map((d: string) => normalizeDay(d)) : [],
              time: course.times ? normalizeTimeRange(course.times.split('|').map((t: string) => t.trim())[0]) : 'TBD',
              location: course.location || undefined
            };
            

            newSelectedCourses.push(courseData);
          }
        }

        setSelectedCourses(newSelectedCourses);
      }
    };

    autoPopulate1L();
  }, [classYear, section, allCourseData]);

  // Add/Update LRW course when user selects A or B
  useEffect(() => {
    const handleLRWCourse = async () => {
      if (classYear === '1L' && section && lrwSection && allCourseData.length > 0) {
        
        // Support multiple naming variants and spacing, e.g.:
        // "First Year Legal Research and Writing 1A", "First Year Legal Research and Writing 1 A",
        // "Legal Research and Writing 1A", "LRW 1 A"
        const lrwBases = [
          'First Year Legal Research and Writing',
          'Legal Research and Writing',
          'LRW'
        ];
        
        // Remove any existing LRW courses first
        const filteredCourses = selectedCourses.filter(course =>
          !/First Year Legal Research and Writing|Legal Research and Writing|^LRW\b/.test(course.courseName)
        );

        // Find both Fall and Spring LRW entries for the chosen section (same name, different semesters)
        const matchingCourses = allCourseData.filter((course) => {
          const name = String(course?.course_name || '').trim();
          if (!name) return false;
          
          // Try exact matches first
          const exactMatches = [
            `First Year Legal Research and Writing ${section}${lrwSection}`,
            `First Year Legal Research and Writing ${section} ${lrwSection}`,
            `Legal Research and Writing ${section}${lrwSection}`,
            `Legal Research and Writing ${section} ${lrwSection}`,
            `LRW ${section}${lrwSection}`,
            `LRW ${section} ${lrwSection}`
          ];
          
          if (exactMatches.includes(name)) {
            return true;
          }
          
          // Fallback: match base + section and A/B suffix with optional space
          const matches = lrwBases.some((base) => {
            const pattern = new RegExp(`^${base}\\s+${section}\\s*${lrwSection}$`, 'i');
            return pattern.test(name);
          });
          
          return matches;
        });


        if (matchingCourses.length > 0) {
          const newLrwCourses: CourseData[] = matchingCourses.map((course: any) => ({
            id: `${course.course_name}-${course.semester}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            courseName: course.course_name,
            professor: course.instructor,
            credits: course.credits,
            semester: course.semester as 'Spring' | 'Fall' | 'Winter',
            days: course.days ? course.days.split(';').map((d: string) => normalizeDay(d)) : [],
            time: course.times ? normalizeTimeRange(course.times.split('|').map((t: string) => t.trim())[0]) : 'TBD',
            location: course.location || undefined
          }));

          // Sort by semester priority: Fall first, then Spring
          const sortBySemesterPriority = (a: CourseData, b: CourseData) => {
            const priority = (s: string) => {
              if (/Fall/i.test(s) || /FA$/i.test(s)) return 0;
              if (/Spring/i.test(s) || /SP$/i.test(s)) return 1;
              return 2;
            };
            return priority(a.semester) - priority(b.semester);
          };
          newLrwCourses.sort(sortBySemesterPriority);

          setSelectedCourses([...filteredCourses, ...newLrwCourses]);
        }
      }
    };

    handleLRWCourse();
  }, [lrwSection, classYear, section, allCourseData]);

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f9f5f0', minHeight: '100vh' }}>
      <div className={currentPage === 1 ? "max-w-4xl mx-auto" : "max-w-7xl mx-auto"}>
        {/* Go Back to Sign In Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => signOut()}
            className="px-3 py-1 text-sm text-white rounded hover:opacity-90"
            style={{ backgroundColor: '#752432' }}
          >
            Go Back to Sign In
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="flex justify-center">
              <img 
                src="/Quad SVG.svg" 
                alt="Quad Logo" 
                className="w-auto object-contain"
                style={{ height: '80px' }}
              />
            </div>
          </div>
        </div>

        {/* Page Content */}
        {currentPage === 1 ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl text-gray-900 mb-2">Welcome to Quad</h1>
              <p className="text-gray-600">Let's get your basic information first</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-center text-gray-900">Basic Information</CardTitle>
          </CardHeader>

          <CardContent>
                <div className="space-y-8">
                  {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={name}
                        onChange={handleNameChange}
                          placeholder="Enter your full name"
                        className="bg-gray-100"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={phone}
                        onChange={handlePhoneChange}
                          placeholder="Enter your phone number"
                        className="bg-gray-100"
                        />
                      {/* Centered under phone number box only */}
                      <div className="text-center">
                        <p className="text-sm text-gray-600 italic">Get free food and swag! 😊</p>
                      </div>
                      </div>
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="classYear">Class Year *</Label>
                      <Select value={classYear} onValueChange={(value: ClassYear) => setClassYear(value)}>
                        <SelectTrigger id="classYear" className="bg-gray-100">
                          <SelectValue placeholder="Select your class year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1L">1L</SelectItem>
                          <SelectItem value="2L">2L</SelectItem>
                          <SelectItem value="3L">3L</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor="section">
                        {classYear === '1L' ? 'Section *' : 'Former Section *'}
                        </Label>
                      <Select 
                        value={section} 
                        onValueChange={setSection}
                        disabled={!classYear}
                      >
                        <SelectTrigger id="section" className="bg-gray-100">
                          <SelectValue placeholder={
                            !classYear 
                              ? "Select class year first" 
                              : classYear === '1L' 
                                ? "Select your section" 
                                : "Select your former 1L section"
                          } />
                          </SelectTrigger>
                          <SelectContent>
                          {(classYear === '1L' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7, 8]).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              Section {num}
                            </SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>


                  {/* Next Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      onClick={handleNext}
                      disabled={!isStep1Valid() || loading}
                      className="text-white px-8 py-2 disabled:opacity-50"
                      style={{ 
                        backgroundColor: '#752531',
                        minWidth: '200px',
                        height: '40px'
                      }}
                    >
                      {loading ? 'Saving...' : 'Next: Course Selection'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
                <span className="text-sm text-gray-600">Step 1 of 2 - Basic Information</span>
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ 
                    backgroundColor: isStep1Valid() ? '#752531' : '#d1d5db' 
                  }}
                ></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                    </div>
                          </>
                        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl text-gray-900 mb-2">Course Selection</h1>
              <p className="text-gray-600">Choose your courses and preview your schedule</p>
            </div>

            <div className="flex gap-8">
              {/* Left Side - My Courses */}
              <div className="w-80 flex-shrink-0">
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-gray-900">
                      My Courses
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {classYear} | Section {section} | {totalCredits} Credits
                    </p>
                    <hr className="border-gray-200 mt-2" />
                  </CardHeader>
                  <CardContent className="pt-0 px-6 pb-6 flex flex-col h-full">
                    {/* Course Cards - Scrollable */}
                    <div className="relative">
                      {/* Scroll indicator - show for all class years when they have more than 4 courses */}
                      {showScrollIndicator && selectedCourses.length > 4 && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none mb-5 animate-bounce opacity-70">
                          <div className="bg-gray-800 text-white rounded-full px-3 py-1 text-xs flex items-center gap-1 shadow-lg">
                            <span>Scroll</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div 
                        ref={courseListRef} 
                        className="overflow-y-auto mb-4" 
                        style={{ maxHeight: '480px', scrollBehavior: 'smooth' }}
                        onScroll={() => setShowScrollIndicator(false)}
                      >
                        <div className="space-y-4">
                        {coursesLoading ? (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">Loading courses...</p>
                          </div>
                        ) : selectedCourses.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No courses selected yet</p>
                            <p className="text-xs mt-1">
                              {classYear === '1L' ? 'Courses will auto-populate when section is selected' : 'Click "Add Class" to get started'}
                            </p>
                          </div>
                        ) : (
                          selectedCourses.map((course, index) => {
                            // Check if this is a 1L required course
                            const isRequired1L = classYear === '1L' && (
                              index < 7 || // First 7 courses are always required
                              course.courseName.includes('First Year Legal Research and Writing') || // LRW is always required
                              course.courseName.includes('Legal Research and Writing') ||
                              course.courseName.includes('LRW')
                            );
                            
                            return (
                              <div key={course.id} className={`p-3 rounded-lg border ${isRequired1L ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-900 text-sm">{formatDisplayCourseName(course.courseName)}</h3>
                                    {isRequired1L && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                        Required
                          </span>
                                    )}
                        </div>
                                  {!isRequired1L && (
                                    <button
                                      onClick={() => handleRemoveCourse(course.id)}
                                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors ml-6"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                          )}
                        </div>
                                <p className="text-xs text-gray-600 mb-0.5">Semester: {formatDisplaySemester(course.semester)}</p>
                                <p className="text-xs text-gray-600 mb-0.5">Professor: {course.professor}</p>
                                <p className="text-xs text-gray-600 mb-0.5">{course.days.join(', ')} {course.time}</p>
                                <p className="text-xs text-gray-600 mb-0.5">Location: {course.location || 'Location TBD'}</p>
                                <p className="text-xs text-gray-600">{course.credits} Credits</p>
                      </div>
                            );
                          })
                        )}
                        </div>
                      </div>
                      {/* Fade overlays */}
                      <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-b from-white to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-white to-transparent" style={{ marginBottom: '1rem' }}></div>
                    </div>

                    {/* LRW Selection - Only for 1L. Show two professor last names for the selected section. */}
                    {classYear === '1L' && selectedCourses.length >= 7 && (
                      <div className={`mb-4 p-4 rounded-lg border-2 ${lrwSection ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-400'}`}>
                        {(() => {
                          // Build LRW options for the selected section from available course data
                          const lrwBases = [
                            'First Year Legal Research and Writing',
                            'Legal Research and Writing',
                            'LRW'
                          ];
                          
                          // Find all LRW courses for this section
                          const lrwCoursesForSection = allCourseData.filter(c => {
                            const name = String(c?.course_name || '').trim();
                            if (!name) return false;
                            
                            return lrwBases.some(base => {
                              const pattern = new RegExp(`^${base}\\s+${section}[AB]`, 'i');
                              return pattern.test(name);
                            });
                          });
                          
                          // Find A and B options (prefer Fall semester for professor names)
                          const optionA = lrwCoursesForSection.find((c: any) => {
                            const name = String(c.course_name || '');
                            return (/A\s*$/.test(name) || name.endsWith(`${section}A`)) && 
                                   (/Fall/i.test(c.semester) || /FA$/i.test(c.semester));
                          }) || lrwCoursesForSection.find((c: any) => /A\s*$/.test(c.course_name) || c.course_name.endsWith(`${section}A`));
                          
                          const optionB = lrwCoursesForSection.find((c: any) => {
                            const name = String(c.course_name || '');
                            return (/B\s*$/.test(name) || name.endsWith(`${section}B`)) && 
                                   (/Fall/i.test(c.semester) || /FA$/i.test(c.semester));
                          }) || lrwCoursesForSection.find((c: any) => /B\s*$/.test(c.course_name) || c.course_name.endsWith(`${section}B`));
                          
                          const lastA = extractLastName(optionA?.instructor) || 'A';
                          const lastB = extractLastName(optionB?.instructor) || 'B';
                          return (
                            <>
                              <p className={`text-sm font-semibold mb-3 ${lrwSection ? 'text-blue-800' : 'text-red-700'}`}>
                                {!lrwSection ? '⚠️ Select your LRW professor:' : 'LRW Professor:'}
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setLrwSection('A');
                                    setTimeout(() => {
                                      if (courseListRef.current) {
                                        courseListRef.current.scrollTop = courseListRef.current.scrollHeight;
                                      }
                                    }, 100);
                                  }}
                                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    lrwSection === 'A'
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : !lrwSection
                                      ? 'bg-white text-red-700 border-2 border-red-400 hover:bg-red-50 hover:border-red-500'
                                      : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-100'
                                  }`}
                                >
                                  {lastA}
                                </button>
                                <button
                                  onClick={() => {
                                    setLrwSection('B');
                                    setTimeout(() => {
                                      if (courseListRef.current) {
                                        courseListRef.current.scrollTop = courseListRef.current.scrollHeight;
                                      }
                                    }, 100);
                                  }}
                                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    lrwSection === 'B'
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : !lrwSection
                                      ? 'bg-white text-red-700 border-2 border-red-400 hover:bg-red-50 hover:border-red-500'
                                      : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-100'
                                  }`}
                                >
                                  {lastB}
                                </button>
                              </div>
                              <p className={`text-xs mt-2 ${lrwSection ? 'text-blue-700' : 'text-red-600 font-medium'}`}>
                                {!lrwSection
                                  ? `Required: This will add LRW ${section}A or ${section}B (Fall & Spring)`
                                  : `Selected: "LRW ${section}${lrwSection}" (Fall & Spring)`}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Add Class Button - Outside scroll area */}
                    <button
                      onClick={handleAddCourse}
                      className="w-full text-white py-2 text-sm font-medium rounded-md border border-[#752531] flex-shrink-0"
                      style={{ 
                        backgroundColor: '#752531',
                        minHeight: '36px'
                      }}
                    >
                      + Add Class
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Weekly Calendar */}
              <div className="flex-1">
                <Card className="shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between px-2">
                      {/* Left Arrow - only show for Winter and Spring */}
                      <div className="w-10">
                        {currentSemester !== 'Fall 2025' && (
                          <button
                            onClick={() => handleSemesterNavigation('prev')}
                            className="h-10 w-10 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 active:scale-95"
                            style={{ color: '#752432' }}
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                      
                      {/* Semester Title */}
                      <div className="flex-1 text-center">
                        <CardTitle className="text-3xl font-bold text-gray-900" style={{ color: '#752432' }}>
                          {currentSemester.split(' ')[0]}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Schedule • {(() => {
                            // Calculate credits for current semester
                            const semesterMap: { [key: string]: string[] } = {
                              'Fall 2025': ['Fall', 'Fall 2025', '2025FA'],
                              'Winter 2026': ['Winter', 'Winter 2026', '2026WI'],
                              'Spring 2026': ['Spring', 'Spring 2026', '2026SP']
                            };
                            const validSemesters = (semesterMap[currentSemester] || []).map(normalizeSemesterValue);
                            const semesterCourses = selectedCourses.filter(course => {
                              const normalizedCourseSemester = normalizeSemesterValue(course.semester as unknown as string);
                              return validSemesters.includes(normalizedCourseSemester);
                            });
                            const semesterCredits = semesterCourses.reduce((sum, course) => sum + course.credits, 0);
                            return `${semesterCredits} Credits`;
                          })()}
                        </p>
                      </div>
                      
                      {/* Right Arrow - only show for Fall and Winter */}
                      <div className="w-10">
                        {currentSemester !== 'Spring 2026' && (
                          <button
                            onClick={() => handleSemesterNavigation('next')}
                            className="h-10 w-10 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 active:scale-95"
                            style={{ color: '#752432' }}
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Calendar Grid */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {/* Calendar Header Row */}
                      <div className="grid grid-cols-6 gap-0 border-b border-gray-200" style={{ backgroundColor: '#752531' }}>
                        <div className="p-3 text-center font-semibold text-white text-sm">Time</div>
                        {days.map(day => (
                          <div 
                            key={day} 
                            className="p-3 text-center font-semibold text-white border-l border-white/30 text-sm"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Body */}
                      <div className="divide-y divide-gray-200">
                        {timeSlots.map((timeSlot) => (
                          <div key={timeSlot} className="grid grid-cols-6 gap-0 min-h-12">
                            {/* Time Label */}
                            <div className="p-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                              {timeSlot}
                            </div>
                            
                            {/* Day Cells */}
                            {days.map(day => {
                              const courses = getCoursesForTimeSlot(day, timeSlot);
                              const isOccupied = isTimeSlotOccupied(day, timeSlot);
                              
                              return (
                                <div 
                                  key={`${day}-${timeSlot}`} 
                                  className="min-h-12 border-r border-gray-200 p-1 relative last:border-r-0 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  {courses.length > 0 && (
                                    <>
                                      {courses.map((course, index) => {
                                        // Parse course time to get start and end times
                                        const timeParts = course.time.split('-');
                                        let startTime = timeParts[0]?.trim() || '';
                                        let endTime = timeParts[1]?.trim() || '';
                                        
                                        // Handle cases where AM/PM is only on the end time
                                        const endAmPm = endTime.match(/(AM|PM)/i);
                                        if (endAmPm && !startTime.match(/(AM|PM)/i)) {
                                          startTime += ' ' + endAmPm[0];
                                        }
                                        
                                        // Handle cases where both times have AM/PM
                                        if (course.time.includes('AM') && course.time.includes('PM')) {
                                          const fullTimeMatch = course.time.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
                                          if (fullTimeMatch) {
                                            startTime = `${fullTimeMatch[1]} ${fullTimeMatch[2]}`;
                                            endTime = `${fullTimeMatch[3]} ${fullTimeMatch[4]}`;
                                          }
                                        }
                                        
                                        const convertTo24Hour = (time: string) => {
                                          const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                                          if (!match) return null;
                                          
                                          let hours = parseInt(match[1]);
                                          const minutes = parseInt(match[2]);
                                          const ampm = match[3].toUpperCase();
                                          
                                          if (ampm === 'PM' && hours !== 12) hours += 12;
                                          if (ampm === 'AM' && hours === 12) hours = 0;
                                          
                                          return hours * 60 + minutes;
                                        };
                                        
                                        const courseStart = convertTo24Hour(startTime);
                                        const courseEnd = convertTo24Hour(endTime);
                                        const slotTime = convertTo24Hour(timeSlot);
                                        
                                        if (!courseStart || !courseEnd || !slotTime) return null;
                                        
                                        // Calculate position within the starting hour slot
                                        const slotStart = slotTime;
                                        
                                        // Calculate top position within the slot (where course starts)
                                        const topPercent = ((courseStart - slotStart) / 60) * 100;
                                        
                                        // Calculate total height across all slots the course spans
                                        const totalDurationMinutes = courseEnd - courseStart;
                                        const totalHeightPixels = (totalDurationMinutes / 60) * 48; // 48px per hour
                                        
                                        // Calculate width and left position for multiple courses in same slot
                                        const courseWidth = courses.length > 1 ? `calc(${100/courses.length}% - 4px)` : 'calc(100% - 8px)';
                                        const courseLeft = courses.length > 1 ? `${(index * 100/courses.length) + 2}%` : '4px';
                                        
                                        return (
                                          <div 
                                            key={`${course.id}-${day}-${timeSlot}-${index}`}
                                            className="absolute text-white text-xs p-1 rounded flex flex-col justify-center z-10 border border-white/20"
                                            style={{ 
                                              backgroundColor: '#752531',
                                              top: `${topPercent}%`,
                                              height: `${totalHeightPixels}px`,
                                              width: courseWidth,
                                              left: courseLeft,
                                              minHeight: '20px'
                                            }}
                                          >
                                            {/* Course info */}
                                            <div className="flex flex-col justify-center h-full">
                                              <div className="font-medium leading-tight mb-1 truncate text-center">
                                                {formatDisplayCourseName(course.courseName)}
                                              </div>
                                              <div className="text-xs opacity-75 leading-tight truncate text-center">
                                                {startTime}-{endTime}
                                              </div>
                                              {course.location && (
                                                <div className="text-xs opacity-75 leading-tight truncate text-center">
                                                  {course.location}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {courses.length > 1 && (
                                        <div className="absolute top-1 right-1 bg-white text-gray-700 text-xs px-1 py-0.5 rounded z-20">
                                          {courses.length}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                        );
                      })}
                    </div>
                        ))}
                  </div>
                </div>
                  </CardContent>
                </Card>
                    </div>
                  </div>
                          </>
                        )}

        {/* Bottom Navigation and Progress Indicator - All in one line */}
        {currentPage === 2 && (
          <div className="flex items-center mt-8">
            {/* Back Button */}
            <div className="flex-1 flex justify-start">
                  <Button
              onClick={handleBack}
              variant="outline"
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
                  </Button>
            </div>

            {/* Progress Indicator - Center */}
            <div className="flex-1 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
                <span className="text-sm text-gray-600">Step 2 of 2 - Course Selection</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#752531' }}></div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#752531' }}></div>
              </div>
            </div>

            {/* Complete Setup Button */}
            <div className="flex-1 flex justify-end gap-3">
            <Button
              className="text-white hover:bg-red-800"
              style={{ backgroundColor: '#752531' }}
              onClick={async () => {
                // Save empty classes array to profiles table
                if (user) {
                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ 
                        classes: [] // Empty array instead of selected courses
                      })
                      .eq('id', user.id);

                    if (error) {
                      console.error('Error updating profile with empty classes:', error);
                    } else {
                      console.log('Profile updated with empty classes');
                    }
                  } catch (error) {
                    console.error('Error saving empty classes:', error);
                  }
                }
                
                // Navigate to home page
                onComplete();
              }}
            >
              Skip for now
            </Button>
            <Button
              disabled={!areRequirementsMet()}
              onClick={async () => {
                // Save selected courses to profiles table
                if (user && selectedCourses.length > 0) {
                  try {
                    // Transform selectedCourses to the required format
                    const classesData = selectedCourses.map(course => {
                      // Use the actual semester value directly from the course
                      const semesterCode = course.semester;
                      
                      console.log('Course semester:', {
                        courseName: course.courseName,
                        semester: course.semester
                      });
                      

                      return {
                        class: course.courseName,
                        schedule: {
                          days: course.days.join(' • '),
                          times: course.time,
                          credits: course.credits,
                          location: course.location || 'Location TBD',
                          semester: semesterCode,
                          instructor: course.professor,
                          course_name: course.courseName,
                          course_number: 1
                        },
                        professor: course.professor
                      };
                    });

                    const { error } = await supabase
                      .from('profiles')
                      .update({ classes: classesData })
                      .eq('id', user.id);

                    if (error) {
                      console.error('Error saving classes:', error);
                    } else {
                      console.log('Classes saved successfully:', classesData);
                    }
                  } catch (error) {
                    console.error('Error saving classes:', error);
                  }
                }
                
                onComplete();
              }}
              className={`${
                areRequirementsMet() 
                  ? 'text-white hover:bg-green-700' 
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              style={{
                backgroundColor: areRequirementsMet() ? '#00962c' : '#f3f4f6'
              }}
            >
              Complete Setup
            </Button>
            </div>
          </div>
                )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCourseDialog(false);
          setSelectedCourse(null);
          setVisuallySelectedCourseIndex(null);
          setSearchQuery('');
        }
      }}>
          <DialogContent 
            className="p-0 overflow-hidden [&>button]:hidden flex flex-col"
            style={{
              maxWidth: '60vw',
              width: '60vw',
              height: '70vh',
              maxHeight: '70vh'
            }}
            aria-describedby="course-selection-description"
          >
          {/* Header */}
          <DialogHeader className="flex-shrink-0 p-4 pb-3 border-b bg-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">Add New Course</DialogTitle>
                <p id="course-selection-description" className="text-sm text-gray-600 mt-1">
                  Search and select a course to add to your schedule
                </p>
              </div>
                  <Button
                variant="outline" 
                onClick={() => setShowCourseDialog(false)} 
                size="sm"
                className="h-6 w-6 p-0"
              >
                ×
                  </Button>
                </div>
          </DialogHeader>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Single Panel */}
            <div className="w-full flex flex-col bg-gray-50 relative overflow-hidden min-h-0">
              {/* Search Bar */}
              <div className="flex-shrink-0 p-3 pt-0.5 bg-white border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search course name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    className="pl-10 w-full"
                  />
              </div>
      </div>

              {/* Course Results */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredCourses.length > 0 ? (
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">
                        {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                      </h3>
                    </div>
                    {filteredCourses.map((course, index) => (
                      <div
                        key={course.id}
                        className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer min-h-[120px]"
                        style={{
                          backgroundColor: visuallySelectedCourseIndex === index ? '#75253110' : 'white',
                          borderColor: visuallySelectedCourseIndex === index ? '#752531' : '#e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          if (visuallySelectedCourseIndex !== index) {
                            e.currentTarget.style.backgroundColor = '#75253110';
                            e.currentTarget.style.borderColor = '#752531';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (visuallySelectedCourseIndex !== index) {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                        onClick={() => {
                          setVisuallySelectedCourseIndex(index);
                          handleCourseSelect(course);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {formatDisplayCourseName(course.course_name)}
                            </h4>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 mb-0.5">Semester: {formatDisplaySemester(course.semester)}</p>
                              <p className="text-xs text-gray-600 mb-0.5">Professor: {course.instructor || 'TBD'}</p>
                              <p className="text-xs text-gray-600 mb-0.5">{course.days || 'TBA'} • {course.times || 'TBA'}</p>
                              <p className="text-xs text-gray-600 mb-0.5">Location: {course.location && course.location !== 'null' ? course.location : 'Location TBD'}</p>
                              <p className="text-xs text-gray-600">{course.credits || 3} Credits</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No courses found</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Fixed Position */}
          <div className="flex-shrink-0 border-t-2 border-gray-400 bg-gray-50">
            {/* Warning Message */}
            {showMaxCourseWarning && (
              <div className="px-4 pt-3 pb-2">
                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 flex items-start gap-3">
                  <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-1">Maximum Course Limit Reached</p>
                    <p className="text-xs text-red-700">
                      You cannot add more than 10 courses. Please remove an elective course before adding a new one.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center gap-4 p-4">
              <button 
                onClick={() => {
                  if (selectedCourse) {
                    // Check if user has reached maximum course limit
                    const maxCourses = classYear === '1L' ? 10 : 10;
                    if (selectedCourses.length >= maxCourses) {
                      setShowMaxCourseWarning(true);
                      setTimeout(() => setShowMaxCourseWarning(false), 4000);
                      return;
                    }
                    
                    // Add the selected course to My Courses
                    const newCourse: CourseData = {
                      id: `${selectedCourse.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                      courseName: selectedCourse.course_name,
                      professor: selectedCourse.instructor || 'TBA',
                      credits: selectedCourse.credits || 3,
                      semester: selectedCourse.semester as 'Spring' | 'Fall' | 'Winter' || 'Fall', // Use actual semester from course data
                      days: selectedCourse.days ? selectedCourse.days.split(';').map((d: string) => d.trim()) : ['TBA'],
                      time: selectedCourse.times ? normalizeTimeRange(selectedCourse.times.split('|').map((t: string) => t.trim())[0]) : 'TBA',
                      location: selectedCourse.location,
                      original_course_id: selectedCourse.original_course_id
                    };
                    
                    setSelectedCourses(prev => [...prev, newCourse]);
                    
                    // Scroll to bottom of course list
                    setTimeout(() => {
                      if (courseListRef.current) {
                        courseListRef.current.scrollTop = courseListRef.current.scrollHeight;
                      }
                    }, 100);
                    
                    // Close dialog and reset
                    setShowCourseDialog(false);
                    setSelectedCourse(null);
                    setVisuallySelectedCourseIndex(null);
                    setSearchQuery('');
                  }
                }} 
                className="px-4 py-1.5 text-sm font-medium bg-[#752531] hover:bg-[#6B1F2A] text-white rounded-md border-0 cursor-pointer"
                style={{
                  backgroundColor: '#752531',
                  color: 'white'
                }}
              >
                Add Course
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}