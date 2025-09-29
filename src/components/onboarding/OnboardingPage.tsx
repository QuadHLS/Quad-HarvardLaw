import React, { useState, useEffect } from 'react';
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
      // 1L: Need 8 required courses (7 initial + 1 LRW), 9th elective is optional
      return selectedCourses.length >= 8 && selectedCourses.length <= 9;
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
                        courseToRemove.courseName.includes('First Year Legal Research and Writing');
      
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
      
      const validSemesters = semesterMap[currentSemester] || [];
      if (!validSemesters.includes(course.semester)) {
        return false;
      }
      
      const dayMap: { [key: string]: string } = {
        'Mon': 'Mon',
        'Tue': 'Tue', 
        'Wed': 'Wed',
        'Thu': 'Thu',
        'Fri': 'Fri'
      };
      
      const courseDays = course.days.map(d => d);
      
      // Only show course in its starting time slot
      if (!courseDays.includes(dayMap[day])) {
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
      
      const validSemesters = semesterMap[currentSemester] || [];
      if (!validSemesters.includes(course.semester)) return false;
      
      if (!course.days.includes(dayMap[day])) return false;
      
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
      return slotTime > courseStartHour && slotTime < courseEnd;
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
      console.log('Auto-populate check:', { classYear, section, allCourseDataLength: allCourseData.length });
      
      if (classYear === '1L' && section && allCourseData.length > 0) {
        console.log('Auto-populating 1L Section', section, 'courses...');
        console.log('Available courses:', allCourseData.map(c => c.course_name));
        
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

        console.log('Required courses:', requiredCourses);

        const newSelectedCourses: CourseData[] = [];

        for (let i = 0; i < 7; i++) {
          const courseName = requiredCourses[i];
          
          // Search for course by name in the Courses library
          const matchingCourses = allCourseData.filter(
            (course) => course.course_name === courseName
          );

          console.log(`Looking for ${courseName}, found ${matchingCourses.length} matches`);

          if (matchingCourses.length > 0) {
            const course = matchingCourses[0];
            
            const courseData: CourseData = {
              id: `${courseName}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
              courseName: course.course_name,
              professor: course.instructor,
              credits: course.credits,
              semester: course.semester as 'Spring' | 'Fall' | 'Winter',
              days: course.days ? course.days.split(';').map((d: string) => d.trim()) : [],
              time: course.times ? course.times.split(';').map((t: string) => t.trim())[0] || 'TBD' : 'TBD',
              location: course.location || undefined
            };
            
            console.log('Created course data:', {
              ...courseData,
              daysString: course.days,
              timesString: course.times,
              semesterString: course.semester
            });

            newSelectedCourses.push(courseData);
            console.log('Added course:', courseData);
          }
        }

        console.log('Final selected courses:', newSelectedCourses);
        setSelectedCourses(newSelectedCourses);
      }
    };

    autoPopulate1L();
  }, [classYear, section, allCourseData]);

  // Add/Update LRW course when user selects A or B
  useEffect(() => {
    const handleLRWCourse = async () => {
      if (classYear === '1L' && section && lrwSection && allCourseData.length > 0) {
        const lrwCourseName = `First Year Legal Research and Writing ${section}${lrwSection}`;
        
        // Remove any existing LRW courses first
        const filteredCourses = selectedCourses.filter(course => 
          !course.courseName.includes('First Year Legal Research and Writing')
        );

        // Find the course in the database
        const matchingCourses = allCourseData.filter(
          (course) => course.course_name === lrwCourseName
        );

        if (matchingCourses.length > 0) {
          const course = matchingCourses[0];
          
          const courseData: CourseData = {
            id: `${lrwCourseName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            courseName: course.course_name,
            professor: course.instructor,
            credits: course.credits,
            semester: course.semester as 'Spring' | 'Fall' | 'Winter',
            days: course.days ? course.days.split(';').map((d: string) => d.trim()) : [],
            time: course.times ? course.times.split(';').map((t: string) => t.trim())[0] || 'TBD' : 'TBD',
            location: course.location || undefined
          };

          setSelectedCourses([...filteredCourses, courseData]);
          console.log('Updated LRW course:', courseData);
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
                src="/Quad Logo.png" 
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
                      {classYear} | Section {section}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {classYear === '1L'
                        ? `8 Required + 1 Elective (${totalCredits} Credits)` 
                        : classYear === '2L' 
                        ? `3 Required | 10 Max (${totalCredits} Credits)` 
                        : `3 Required | 10 Max (${totalCredits} Credits)`
                      }
                    </p>
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                      <div>Selected Courses: {selectedCourses.length}</div>
                      <div>Current Semester: {currentSemester}</div>
                      <div>Courses for {currentSemester}: {selectedCourses.filter(c => {
                        const semesterMap: { [key: string]: string[] } = {
                          'Fall 2025': ['Fall', 'Fall 2025', '2025FA'],
                          'Winter 2026': ['Winter', 'Winter 2026', '2026WI'],
                          'Spring 2026': ['Spring', 'Spring 2026', '2026SP']
                        };
                        const validSemesters = semesterMap[currentSemester] || [];
                        return validSemesters.includes(c.semester);
                      }).length}</div>
                      <div>Course Semesters: {selectedCourses.map(c => c.semester).join(', ')}</div>
                    </div>
                    <hr className="border-gray-200 mt-2" />
                  </CardHeader>
                  <CardContent className="pt-0 px-6 pb-6">
                    {/* Course Cards */}
                    <div className="space-y-4 mb-6">
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
                            course.courseName.includes('First Year Legal Research and Writing') // LRW is always required
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
                              <p className="text-xs text-gray-600 mb-0.5">Semester: {course.semester}</p>
                              <p className="text-xs text-gray-600 mb-0.5">Professor: {course.professor}</p>
                              <p className="text-xs text-gray-600 mb-0.5">{course.days.join(', ')} {course.time}</p>
                              <p className="text-xs text-gray-600 mb-0.5">Location: {course.location || 'Location TBD'}</p>
                              <p className="text-xs text-gray-600">{course.credits} Credits</p>
                    </div>
                          );
                        })
                      )}
                    </div>

                    {/* LRW Section Selector - Only for 1L */}
                    {classYear === '1L' && selectedCourses.length >= 7 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 font-medium mb-2">
                          {!lrwSection ? 'Select LRW section:' : 'Change LRW section:'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setLrwSection('A')}
                            className={`px-3 py-1 rounded-md text-xs font-medium ${
                              lrwSection === 'A' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            A
                          </button>
                          <button
                            onClick={() => setLrwSection('B')}
                            className={`px-3 py-1 rounded-md text-xs font-medium ${
                              lrwSection === 'B' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            B
                          </button>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          {!lrwSection 
                            ? `Adds "LRW ${section}A" or "LRW ${section}B"`
                            : `Current: "LRW ${section}${lrwSection}"`
                          }
                        </p>
                      </div>
                    )}

                    {/* Add Class Button */}
                    <button
                      onClick={handleAddCourse}
                      className="w-full text-white py-2 text-sm font-medium rounded-md border border-[#752531]"
                      style={{ 
                        backgroundColor: '#752531',
                        minHeight: '36px',
                        display: 'block',
                        marginTop: '16px'
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
                    <div className="flex items-center justify-center gap-4">
                      {/* Left Arrow - only show for Winter and Spring */}
                      {currentSemester !== 'Fall 2025' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSemesterNavigation('prev')}
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      )}
                      
                      {/* Semester Title */}
                      <CardTitle className="text-2xl text-center text-gray-900">
                        {currentSemester} Schedule
                      </CardTitle>
                      
                      {/* Right Arrow - only show for Fall and Winter */}
                      {currentSemester !== 'Spring 2026' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSemesterNavigation('next')}
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      )}
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
                                  {courses.length > 0 && !isOccupied && (
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
                                        
                                        return (
                                          <div 
                                            key={`${course.id}-${day}-${timeSlot}-${index}`}
                                            className="absolute text-white text-xs p-1 rounded flex flex-col justify-center z-10 border border-white/20"
                                            style={{ 
                                              backgroundColor: '#752531',
                                              top: `${topPercent}%`,
                                              height: `${totalHeightPixels}px`,
                                              width: 'calc(100% - 8px)',
                                              left: '4px',
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
                              <p className="text-xs text-gray-600 mb-0.5">Semester: {
                                course.semester === 'Fall' || course.semester === 'Fall 2025' ? '2025FA' :
                                course.semester === 'Winter' || course.semester === 'Winter 2026' ? '2026WI' :
                                course.semester === 'Spring' || course.semester === 'Spring 2026' ? '2026SP' :
                                course.semester
                              }</p>
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
          <div className="flex-shrink-0 p-4 border-t-2 border-gray-400 bg-gray-50 min-h-[60px]">
            <div className="flex justify-between items-center gap-4 h-full">
              <button 
                onClick={() => {
                  if (selectedCourse) {
                    // Add the selected course to My Courses
                    const newCourse: CourseData = {
                      id: `${selectedCourse.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                      courseName: selectedCourse.course_name,
                      professor: selectedCourse.instructor || 'TBA',
                      credits: selectedCourse.credits || 3,
                      semester: selectedCourse.semester as 'Spring' | 'Fall' | 'Winter' || 'Fall', // Use actual semester from course data
                      days: selectedCourse.days ? selectedCourse.days.split(',').map((d: string) => d.trim()) : ['TBA'],
                      time: selectedCourse.times || 'TBA',
                      location: selectedCourse.location,
                      original_course_id: selectedCourse.original_course_id
                    };
                    
                    console.log('Adding course with original_course_id:', newCourse.original_course_id);
                    setSelectedCourses(prev => [...prev, newCourse]);
                    
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