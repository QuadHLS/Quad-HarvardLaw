import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type ClassYear = '1L' | '2L' | '3L';



  // Check if a course is a required 1L course (including LRW)
const isRequired1LCourse = (courseName: string): boolean => {
  const requiredCourses = [
    'Contracts',
    'Torts', 
    'Civil Procedure',
    'Criminal Law',
    'Property',
    'Constitutional Law',
    'Legislation and Regulation',
    'First Year Legal Research and Writing',
    'Legal Research and Writing',
    'LRW'
  ];
  
  return requiredCourses.some(required => 
    courseName.toLowerCase().includes(required.toLowerCase())
  );
};



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
  course_uuid?: string;
}



const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM'
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface OnboardingPageProps {
  onComplete: () => void;
  initialPage?: number;
  // Basic info form
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  classYear: '1L' | '2L' | '3L' | 'LLM' | '';
  setClassYear: (classYear: '1L' | '2L' | '3L' | 'LLM' | '') => void;
  section: string;
  setSection: (section: string) => void;
  lrwSection: 'A' | 'B' | '';
  setLrwSection: (lrwSection: 'A' | 'B' | '') => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Course selection
  selectedCourses: CourseData[];
  setSelectedCourses: (courses: CourseData[] | ((prev: CourseData[]) => CourseData[])) => void;
  currentSemester: 'Fall 2025' | 'Winter 2026' | 'Spring 2026';
  setCurrentSemester: (semester: 'Fall 2025' | 'Winter 2026' | 'Spring 2026') => void;
  allCourseData: any[];
  setAllCourseData: (data: any[]) => void;
  coursesLoading: boolean;
  setCoursesLoading: (loading: boolean) => void;
  
  // Course search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  availableCourses: any[];
  setAvailableCourses: (courses: any[]) => void;
  showMaxCourseWarning: boolean;
  setShowMaxCourseWarning: (show: boolean) => void;
}

export function OnboardingPage(props: OnboardingPageProps) {
  const { 
    onComplete, 
    initialPage = 1,
    name, setName,
    phone, setPhone,
    classYear, setClassYear,
    section, setSection,
    lrwSection, setLrwSection,
    loading, setLoading,
    selectedCourses, setSelectedCourses,
    currentSemester, setCurrentSemester,
    allCourseData, setAllCourseData,
    coursesLoading, setCoursesLoading,
    searchQuery, setSearchQuery,
    availableCourses, setAvailableCourses,
    showMaxCourseWarning, setShowMaxCourseWarning,
  } = props;
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Update currentPage when initialPage changes (for back navigation)
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);
  
  // Add keyframes for the rotating border animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes lrw-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // All state is now managed by OnboardingFlow and passed as props
  
  // View mode removed; always list view

  // Get first time only (for courses with multiple time slots)
  const getFirstTime = (times: string | undefined): string => {
    if (!times) return 'TBA';
    // Split by | and take the first time slot
    const firstTime = times.split('|')[0]?.trim();
    return firstTime || 'TBA';
  };

  // Hide section numbers for 1L courses in display
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

  // Convert semester codes to readable names

  // Get individual semesters from a code
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
    
    // Last 2 characters are the semester code
    const semesterCode = courseTerm.slice(-2);
    const semesters = getSemestersFromCode(semesterCode);
    
    return semesters.includes(selectedSemester);
  };

  // Normalize a course semester field into codes ['FA'|'WI'|'SP'] for flexible matching
  const normalizeSemesterToCodes = (term: string | undefined | null): ('FA'|'WI'|'SP')[] => {
    if (!term) return [];
    const t = String(term).trim();
    if (!t) return [];
    const upper = t.toUpperCase();
    // Exact 2-letter codes or combined codes e.g., FA, WI, SP, FS, FW, WS
    if (upper.length === 2) {
      return getSemestersFromCode(upper);
    }
    // Words or mixed, support combinations
    const hasFall = /FALL|\bFA\b/i.test(t);
    const hasWinter = /WINTER|\bWI\b/i.test(t);
    const hasSpring = /SPRING|\bSP\b/i.test(t);
    const codes: ('FA'|'WI'|'SP')[] = [];
    if (hasFall) codes.push('FA');
    if (hasWinter) codes.push('WI');
    if (hasSpring) codes.push('SP');
    // If still empty but looks like combined letters e.g., "FS" in a longer string
    if (codes.length === 0) {
      const condensed = upper.replace(/[^FWS]/g, '');
      if (condensed === 'FS') return ['FA','SP'];
      if (condensed === 'FW') return ['FA','WI'];
      if (condensed === 'WS') return ['WI','SP'];
      if (condensed === 'F') return ['FA'];
      if (condensed === 'W') return ['WI'];
      if (condensed === 'S') return ['SP'];
    }
    return codes;
  };

  const getSelectedSemesterCode = (): 'FA'|'WI'|'SP' => {
    if (currentSemester.includes('Fall')) return 'FA';
    if (currentSemester.includes('Winter')) return 'WI';
    return 'SP';
  };


  // Extract last name from instructor string
  const extractLastName = (instructor: string | undefined | null): string => {
    if (!instructor) return '';
    // Use first instructor if multiple
    const firstInstructor = instructor.split(';')[0]?.trim() || '';
    const value = firstInstructor;
    if (!value) return '';
    if (value.includes(',')) {
      // "Last, First" format - take part before comma as last name
      const parts = value.split(',');
      return (parts[0] || '').trim() || value.trim();
    }
    // Assume last token is last name
    const parts = value.split(/\s+/);
    return parts[parts.length - 1] || value;
  };

  // Convert day names to three-letter codes
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

  // Clean up time range formatting
  const normalizeTimeRange = (raw: string | undefined | null): string => {
    if (!raw) return 'TBD';
    let s = String(raw).trim();
    s = s.replace(/[–—]/g, '-');
    s = s.replace(/\s*-\s*/g, '-');
    s = s.replace(/(\d)\s*(AM|PM)\b/gi, '$1 $2');
    s = s.replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
    return s;
  };

  // Remove AM/PM suffix for compact calendar labels
  const stripAmPm = (t: string): string => t.replace(/\s*(AM|PM)\b/gi, '');

  const handleNext = async () => {
    console.log('handleNext called', { currentPage, isStep1Valid: isStep1Valid(), user: user?.id });
    
    if (currentPage === 1) {
      // Save basic info to profiles table
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

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Strip non-numeric characters
    const phoneNumber = value.replace(/[^\d]/g, '');
    
    // Skip formatting if empty
    if (!phoneNumber) return '';
    
    // Format based on input length
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

  // Capitalize name properly
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

  // Course selection helpers

  // Validate course requirements
  const areRequirementsMet = () => {
    if (classYear === '1L') {
      // 1L needs 9 required courses (7 initial + 2 LRW), 10th elective optional
      return selectedCourses.length >= 9 && selectedCourses.length <= 10;
    } else if (classYear === '2L' || classYear === '3L') {
      // 2L/3L need at least 3 required courses, max 10 total
      return selectedCourses.length >= 3 && selectedCourses.length <= 10;
    }
    return false;
  };






  const handleCourseSelect = (course: any) => {
    // Check if user has reached maximum course limit
    let maxCourses = 10;
    
    if (classYear === '1L') {
      // For 1L: 7 required + 2 LRW + 1 elective = 10 total
      // Count how many elective courses (non-required, non-LRW) are already selected
      const currentElectiveCourses = selectedCourses.filter(course => 
        !isRequired1LCourse(course.courseName) && 
        !/First Year Legal Research and Writing|Legal Research and Writing|^LRW\b/.test(course.courseName)
      ).length;
      
      // 1L students can only select 1 elective course from the available courses list
      if (currentElectiveCourses >= 1) {
        setShowMaxCourseWarning(true);
        setTimeout(() => setShowMaxCourseWarning(false), 4000);
        return;
      }
    }
    
    if (selectedCourses.length >= maxCourses) {
      setShowMaxCourseWarning(true);
      setTimeout(() => setShowMaxCourseWarning(false), 4000);
      return;
    }
    
    // Check if course is already selected
    const isAlreadySelected = selectedCourses.some(selected => 
      selected.courseName === course.course_name && 
      selected.professor === course.instructor
    );
    
    if (isAlreadySelected) {
      return; // Don't add duplicate courses
    }
    
    // Add the selected course to My Courses
    const newCourse: CourseData = {
      id: `${course.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // UI instance ID
      courseName: course.course_name,
      professor: course.instructor || 'TBA',
      credits: course.credits || 3,
      semester: course.semester as 'Spring' | 'Fall' | 'Winter' || 'Fall', // Use actual semester from course data
      days: course.days ? (typeof course.days === 'string' ? course.days.split(';').map((d: string) => d.trim()) : course.days) : ['TBA'],
      time: course.times ? normalizeTimeRange(course.times.split('|').map((t: string) => t.trim())[0]) : 'TBA',
      location: course.location,
      original_course_id: course.original_course_id,
      course_uuid: course.id
    };
    
    setSelectedCourses((prev: CourseData[]) => [...prev, newCourse]);
    
    // Clear the search bar and focus it for immediate typing
    setSearchQuery('');
    
    // Focus and select the search input after a brief delay to ensure the state update has completed
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Search courses"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }, 50);
  };

  const filteredCourses = (searchQuery 
    ? availableCourses.filter(course => {
        const q = searchQuery.toLowerCase();
        const nameMatch = (course.course_name || '').toLowerCase().includes(q);
        const instructor = course.instructor || '';
        // consider multiple instructors separated by ';'
        const lastNames = String(instructor)
          .split(';')
          .map((s: string) => extractLastName(s)?.toLowerCase())
          .filter(Boolean);
        const profMatch = lastNames.some((ln: string) => ln.includes(q));
        return nameMatch || profMatch;
      })
    : availableCourses)
    .filter(course => {
      const selectedCode = getSelectedSemesterCode();
      const codes = normalizeSemesterToCodes(course.semester);
      return codes.includes(selectedCode);
    });

  // Filter out courses that are already selected
  const availableCoursesFiltered = filteredCourses.filter(course => {
    return !selectedCourses.some(selected => 
      selected.courseName === course.course_name && 
      selected.professor === course.instructor
    );
  });



  const getCoursesForTimeSlot = (day: string, timeSlot: string) => {
    const filteredCourses = selectedCourses.filter(course => {
      
      const dayMap: { [key: string]: string } = {
        'Mon': 'Mon',
        'Tue': 'Tue', 
        'Wed': 'Wed',
        'Thu': 'Thu',
        'Fri': 'Fri'
      };
      
      // Handle array or comma-separated days
      let courseDays: string[];
      if (Array.isArray(course.days)) {
        // Flatten comma-separated strings in array
        courseDays = course.days.flatMap(d => 
          typeof d === 'string' && d.includes(',') 
            ? d.split(',').map(day => day.trim())
            : [d]
        );
      } else if (typeof course.days === 'string') {
        // Split string by comma
        courseDays = (course.days as string).split(',').map((d: string) => d.trim());
      } else {
        courseDays = [];
      }
      
      // Show course only in starting time slot
      if (!courseDays.includes(dayMap[day])) {
        return false;
      }
      
      // Filter by current semester
      const currentSemesterCode = currentSemester === 'Fall 2025' ? 'FA' : 
                                  currentSemester === 'Winter 2026' ? 'WI' : 
                                  currentSemester === 'Spring 2026' ? 'SP' : 'FA';
      
      // Check if course matches current semester
      if (!courseMatchesSemester(course.semester as string, currentSemesterCode)) {
        return false;
      }

      // Parse time range
      const timeParts = course.time.split('-');
      if (timeParts.length !== 2) return false;
      
      let startTime = timeParts[0].trim();
      let endTime = timeParts[1].trim();
      
      // Handle AM/PM only on end time
      const endAmPm = endTime.match(/(AM|PM)/i);
      if (endAmPm && !startTime.match(/(AM|PM)/i)) {
        startTime += ' ' + endAmPm[0];
      }
      
      // Handle both times with AM/PM
      if (course.time.includes('AM') && course.time.includes('PM')) {
        const fullTimeMatch = course.time.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
        if (fullTimeMatch) {
          startTime = `${fullTimeMatch[1]} ${fullTimeMatch[2]}`;
          endTime = `${fullTimeMatch[3]} ${fullTimeMatch[4]}`;
        }
      }
      
      // Convert to 24-hour format
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
      
      // Show course only in starting time slot
      const courseStartHour = Math.floor(courseStart / 60) * 60; // Round DOWN to nearest hour
      const slotHour = slotTime;
      
      // Check if this slot is the starting slot for the course
      const matches = courseStartHour === slotHour;
      
      return matches;
    });
    
    return filteredCourses;
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

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      if (classYear === '1L' || classYear === '2L' || classYear === '3L') {
        console.log('Fetching courses for class year:', classYear);
        setCoursesLoading(true);
        try {
          // Get courses from Courses table
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

          // Get all courses for now
          const allCourses = courses || [];

          // Transform to expected format
          const transformedCourses = allCourses.map((course: any) => ({
            id: course.id,
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
          setAvailableCourses(allCourses); // Set available courses for the new interface
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

  // Auto-populate 1L required courses or clear courses when class year changes
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

        // Remove ALL existing 1L required courses (the 7 core courses) but keep LRW and other courses
        const existingCourses = selectedCourses.filter(course => {
          const courseName = course.courseName.toLowerCase();
          const isCore1L = ['civil procedure', 'contracts', 'criminal law', 'torts', 'constitutional law', 'property', 'legislation and regulation'].some(name => 
            courseName.includes(name)
          );
          return !isCore1L; // Keep everything except the 7 core 1L courses
        });

        const newSelectedCourses: CourseData[] = [...existingCourses];

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
              days: course.days ? (typeof course.days === 'string' ? course.days.split(';').map((d: string) => normalizeDay(d)) : course.days) : [],
              time: course.times ? normalizeTimeRange(course.times.split('|').map((t: string) => t.trim())[0]) : 'TBD',
              location: course.location || undefined,
              course_uuid: course.id
            };
            

            newSelectedCourses.push(courseData);
          }
        }

        setSelectedCourses(newSelectedCourses);
      } else if (classYear !== '1L') {
        // Clear courses when switching away from 1L or when class year is deselected
        setSelectedCourses([]);
        setLrwSection(''); // Also clear LRW section selection
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
        setSelectedCourses(prevCourses => {
          const filteredCourses = prevCourses.filter(course =>
            !/First Year Legal Research and Writing|Legal Research and Writing|^LRW\b/.test(course.courseName)
          );
          
          // Find both Fall and Spring LRW entries for the chosen section
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
              location: course.location || undefined,
              course_uuid: course.id
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

            return [...filteredCourses, ...newLrwCourses];
          }
          
          return filteredCourses;
        });
        
        return; // Exit early since we're handling everything in setSelectedCourses
      }
    };

    handleLRWCourse();
  }, [lrwSection, classYear, section, allCourseData]);

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f9f5f0', minHeight: '100vh' }}>
      <div className={currentPage === 1 ? "max-w-4xl mx-auto" : "max-w-7xl mx-auto"}>
        {/* Go Back to Sign In Button - Only show on first page */}
        {currentPage === 1 && (
          <div className="mb-4 flex justify-start">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-3 h-3" />
              Sign In
            </button>
          </div>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="flex justify-center">
              <img 
                src="/Quad SVG.svg" 
                alt="Quad Logo" 
                className="w-auto object-contain"
                style={{ height: '80px', transform: 'scale(1.2)', transformOrigin: 'center', willChange: 'transform' }}
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
                        {classYear === '2L' || classYear === '3L' ? 'Former Section *' : 'Section *'}
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
                <span className="text-sm text-gray-600">Step 1 of 3 - Basic Information</span>
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ 
                    backgroundColor: isStep1Valid() ? '#752531' : '#d1d5db' 
                  }}
                ></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                    </div>
                          </>
                        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl text-gray-900 mb-2">Onboarding</h1>
              <p className="text-gray-600">Add your current course enrollments</p>
            </div>

            <div className="flex gap-8">
              {/* Left Side - Course Search and Browse */}
              <div className="w-80 flex-shrink-0 flex flex-col rounded-lg overflow-hidden shadow-md" style={{ backgroundColor: '#FEFBF6', height: 'calc(100vh - 80px)' }}>
                {/* Search and Filters */}
                <div className="p-4 flex-shrink-0 relative" style={{ backgroundColor: '#752432' }}>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search courses or professors…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 bg-white border-gray-300 focus:border-white focus:ring-white ${searchQuery ? 'pr-10' : 'pr-3'}`}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    {/* Class Year | Section Display */}
                    <div className="flex items-center justify-between">
                      <div className="text-white text-sm font-medium">
                        {classYear} | Section {section}
                      </div>
                    </div>

                    {/* Semester Filter Buttons */}
                    <div className="inline-block">
                      <div className="relative bg-white/10 rounded-lg p-1 backdrop-blur-sm border border-white/20">
                        <div className="flex items-center">
                          {(['Fall 2025','Winter 2026','Spring 2026'] as const).map(label => {
                            const isActive = currentSemester === label;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setCurrentSemester(label)}
                                aria-pressed={isActive}
                                title={`Show ${label.split(' ')[0]} courses`}
                                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? 'text-[#752432] shadow-sm'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                                style={isActive ? {
                                  backgroundColor: 'white',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                } : {}}
                              >
                                {label.split(' ')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>

                {/* LRW Selection - Only for 1L. Show at the top after semester selection. */}
                {classYear === '1L' && selectedCourses.length >= 7 && (
                  <div className="px-4 pb-3" style={{ backgroundColor: '#752432' }}>
                    <div className="relative" style={{ minHeight: '80px' }}>
                      {/* Multiple pulsing white circle effects - behind content */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <div className="onboarding-pulse onboarding-pulse-1"></div>
                        <div className="onboarding-pulse onboarding-pulse-2"></div>
                        <div className="onboarding-pulse onboarding-pulse-3"></div>
                        <div className="onboarding-pulse onboarding-pulse-4"></div>
                      </div>
                      <div className={`relative p-2 rounded-lg h-[80px] ${lrwSection ? 'bg-blue-50' : 'bg-red-50'}`} style={{ zIndex: 10, margin: '2px' }}>
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
                              <p className={`text-xs font-medium mb-2 ${lrwSection ? 'text-blue-800' : 'text-red-700'}`}>
                                {!lrwSection ? '⚠️ Select LRW professor:' : 'LRW Professor:'}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setLrwSection('A');
                                  }}
                                  className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                                    lrwSection === 'A'
                                      ? 'bg-blue-600 text-white'
                                      : !lrwSection
                                      ? 'bg-white text-red-700 border border-red-400 hover:bg-red-50'
                                      : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-100'
                                  }`}
                                >
                                  {lastA}
                                </button>
                                <button
                                  onClick={() => {
                                    setLrwSection('B');
                                  }}
                                  className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                                    lrwSection === 'B'
                                      ? 'bg-blue-600 text-white'
                                      : !lrwSection
                                      ? 'bg-white text-red-700 border border-red-400 hover:bg-red-50'
                                      : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-100'
                                  }`}
                                >
                                  {lastB}
                                </button>
                              </div>
                              <p className={`text-xs mt-1 ${lrwSection ? 'text-blue-700' : 'text-red-600 font-medium'}`}>
                                {!lrwSection
                                  ? `Required: LRW ${section}A or ${section}B (Fall & Spring)`
                                  : `Selected: LRW ${section}${lrwSection} (Fall & Spring)`}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Course List - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#752531 transparent'
                }}>
                  {/* Semester Header */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">Available Courses</h3>
                  <Badge variant="outline" className="text-sm bg-white">
                    {availableCoursesFiltered.length} available
                  </Badge>
                  </div>
                  
                  {coursesLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Loading courses...</p>
                    </div>
                  ) : availableCoursesFiltered.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium mb-1">No courses available</p>
                      <p className="text-sm">Try adjusting your search or select a different semester</p>
                    </div>
                  ) : (
                    <div className="transition-all duration-500 ease-in-out space-y-1">
                      {availableCoursesFiltered.map((course, index) => {
                        // Simple color rotation: green, blue, yellow, red
                        const colors = ['#04913A', '#0080BD', '#FFBB06', '#F22F21'];
                        const courseColor = colors[index % 4];
                        
                        // List view only - compact layout
                        return (
                          <div 
                            key={`${course.id}-${index}`}
                            className="group transition-all duration-500 ease-in-out cursor-pointer hover:bg-gray-50 bg-white border-2 rounded-lg border-gray-200"
                            style={{
                              borderColor: `${courseColor}66`,
                              '--hover-border-color': `${courseColor}CC`,
                              '--hover-bg-color': `${courseColor}08`
                            } as React.CSSProperties}
                            onClick={() => handleCourseSelect(course)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.01)';
                              e.currentTarget.style.borderColor = `${courseColor}CC`;
                              e.currentTarget.style.backgroundColor = `${courseColor}08`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.borderColor = `${courseColor}66`;
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                          >
                            <div className="px-3 py-1.5 relative">
                              {/* First line: Course Name (bold) on left, Credits on right */}
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="font-bold text-gray-900 text-xs leading-tight flex-1 pr-2 flex items-center gap-2">
                                  <span className="group-hover:hidden line-clamp-2 overflow-hidden">
                                    {formatDisplayCourseName(course.course_name)}
                                  </span>
                                  <span className="hidden group-hover:inline line-clamp-2 overflow-hidden">
                                    {formatDisplayCourseName(course.course_name)}
                                  </span>
                                  
                                </div>
                                
                                <div className="flex items-center flex-shrink-0"></div>
                              </div>
                              
                              {/* Second line: Days and Times on left, Professor Last Name on right */}
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="leading-tight">{course.days || 'TBA'}</span>
                                  <span className="leading-tight">{getFirstTime(course.times)}</span>
                                </div>
                                
                                <span className="leading-tight">{course.instructor ? extractLastName(course.instructor) || 'TBD' : 'TBD'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Warning Message */}
                {showMaxCourseWarning && (
                  <div className="p-3 bg-red-50 border-2 border-red-400 rounded-lg m-4">
                    <div className="flex items-start gap-3">
                      <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800 mb-1">Maximum Course Limit Reached</p>
                        <p className="text-xs text-red-700">
                          {classYear === '1L' 
                            ? "You can only select 1 elective course. Please remove your current elective before adding a new one."
                            : "You cannot add more than 10 courses. Please remove an elective course before adding a new one."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                        <CardTitle className="text-4xl font-bold text-gray-900" style={{ color: '#752432' }}>
                          {currentSemester.split(' ')[0]}
                        </CardTitle>
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
                              
                              return (
                                <div 
                                  key={`${day}-${timeSlot}`} 
                                  className="min-h-12 border-r border-gray-200 p-1 relative last:border-r-0 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  {courses.length > 0 && (
                                    <>
                                      {courses.map((course, courseIndex) => {
                                        // Parse course time to get start and end times
                                        const timeParts = course.time.split('-');
                                        let startTime = timeParts[0]?.trim() || '';
                                        let endTime = timeParts[1]?.trim() || '';
                                        
                                        // Handle AM/PM only on end time
                                        const endAmPm = endTime.match(/(AM|PM)/i);
                                        if (endAmPm && !startTime.match(/(AM|PM)/i)) {
                                          startTime += ' ' + endAmPm[0];
                                        }
                                        
                                        // Handle both times with AM/PM
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
                                        const totalHeightPixels = (totalDurationMinutes / 60) * 48 - 2; // 48px per hour, minus 2px for border/padding
                                        
                                        // Calculate width and left position for multiple courses in same slot
                                        const courseWidth = courses.length > 1 ? `calc(${100/courses.length}% - 4px)` : 'calc(100% - 8px)';
                                        const courseLeft = courses.length > 1 ? `${(courseIndex * 100/courses.length) + 2}%` : '4px';
                                        
                                        // Get course color based on its position in the selected courses list
                                        const courseListIndex = selectedCourses.findIndex(selected => selected.id === course.id);
                                        const colors = ['#04913A', '#0080BD', '#FFBB06', '#F22F21'];
                                        const courseColor = colors[courseListIndex % 4];
                                        
                                        return (
                                          <div 
                                            key={`${course.id}-${day}-${timeSlot}-${courseIndex}`}
                                            className="absolute text-white text-xs p-1 rounded flex flex-col justify-center border border-white/20 group"
                                            style={{ 
                                              backgroundColor: `${courseColor}CC`,
                                              top: `${topPercent}%`,
                                              height: `${totalHeightPixels}px`,
                                              width: courseWidth,
                                              left: courseLeft,
                                              minHeight: '20px',
                                              zIndex: 10 + courseIndex // Each course gets a higher z-index
                                            }}
                                          >
                                            {/* Course info */}
                                            <div className="flex flex-col justify-center h-full">
                                              <div className="font-medium leading-tight mb-1 truncate text-center">
                                                {formatDisplayCourseName(course.courseName)}
                                              </div>
                                              <div className="text-xs opacity-75 leading-tight truncate text-center">
                                                {stripAmPm(startTime)}-{stripAmPm(endTime)}
                                              </div>
                                              {/* Location display removed */}
                                            </div>
                                            
                                            {/* Remove button - only show if not a 1L required course */}
                                            {!(classYear === '1L' && isRequired1LCourse(course.courseName)) && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedCourses((prev: CourseData[]) => prev.filter((selected: CourseData) => selected.id !== course.id));
                                                }}
                                                className="absolute top-0 right-0 w-5 h-5 rounded-md bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ zIndex: 100 + courseIndex }} // Higher z-index for buttons
                                                aria-label="Remove from calendar"
                                              >
                                                <X className="w-3 h-3 text-red-600" />
                                              </button>
                                            )}
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
                <span className="text-sm text-gray-600">Step 2 of 3 - Course Selection</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#752531' }}></div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#752531' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </div>
            </div>

            {/* Complete Setup Button */}
            <div className="flex-1 flex justify-end gap-3">
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
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
            </button>
            <Button
              disabled={!areRequirementsMet()}
              onClick={() => {
                // Don't save to database here - will be saved after page 3
                onComplete();
              }}
              className={`text-white px-8 py-2 disabled:opacity-50 ${areRequirementsMet() ? 'hover:bg-green-700' : ''}`}
              style={{
                backgroundColor: areRequirementsMet() ? '#00962c' : '#752531'
              }}
            >
              Done!
            </Button>
            </div>
          </div>
                )}
      </div>

    </div>
  );
}