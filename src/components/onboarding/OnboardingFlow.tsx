import { useState, useEffect, useRef } from 'react';
import { OnboardingPage } from './OnboardingPage';
import { OnboardingStepThree } from './OnboardingStepThree';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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

// Helper function to normalize time range (same as in OnboardingPage)
const normalizeTimeRange = (raw: string | undefined | null): string => {
  if (!raw) return 'TBD';
  let s = String(raw).trim();
  s = s.replace(/[–—]/g, '-');
  s = s.replace(/\s*-\s*/g, '-');
  s = s.replace(/(\d)\s*(AM|PM)\b/gi, '$1 $2');
  s = s.replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
  return s;
};

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'page1' | 'page2' | 'profile'>('page1');
  
  // Lift all state from OnboardingPage to preserve across navigation
  // Basic info form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [classYear, setClassYear] = useState<'1L' | '2L' | '3L' | 'LLM' | ''>('');
  const [section, setSection] = useState('');
  const [lrwSection, setLrwSection] = useState<'A' | 'B' | ''>('');
  const [loading, setLoading] = useState(false);

  // Store original classYear to detect if user changed it
  const [originalClassYear, setOriginalClassYear] = useState<'1L' | '2L' | '3L' | 'LLM' | '' | null>(null);
  const [profileClasses, setProfileClasses] = useState<any[]>([]);
  const hasAutoPopulatedRef = useRef(false);

  // Fetch existing profile data to auto-fill fields
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, phone, class_year, section, classes')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profile) {
          // Auto-fill name if it exists and is not empty
          if (profile.full_name && profile.full_name.trim() !== '') {
            setName(profile.full_name);
          }
          // Auto-fill phone if it exists and is not empty
          if (profile.phone && profile.phone.trim() !== '') {
            setPhone(profile.phone);
          }
          // Auto-fill classYear if it exists and is not empty
          if (profile.class_year && profile.class_year.trim() !== '') {
            setClassYear(profile.class_year as '1L' | '2L' | '3L' | 'LLM');
            setOriginalClassYear(profile.class_year as '1L' | '2L' | '3L' | 'LLM');
          }
          // Auto-fill section if it exists and is not empty
          if (profile.section && profile.section.trim() !== '') {
            setSection(profile.section);
          }
          // Store classes for auto-population
          if (profile.classes && Array.isArray(profile.classes) && profile.classes.length > 0) {
            setProfileClasses(profile.classes);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Course selection
  const [selectedCourses, setSelectedCourses] = useState<CourseData[]>([]);
  const [currentSemester, setCurrentSemester] = useState<'Fall 2025' | 'Winter 2026' | 'Spring 2026'>('Fall 2025');
  const [allCourseData, setAllCourseData] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [skipCourses, setSkipCourses] = useState(false);
  
  // Course search
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [showMaxCourseWarning, setShowMaxCourseWarning] = useState(false);

  // When page 1 completes, go to page 2
  const handlePage1Complete = () => {
    setCurrentStep('page2');
  };

  // When page 2 completes, go to profile step
  const handlePage2Complete = () => {
    setCurrentStep('profile');
  };

  // When profile step is done, complete the entire onboarding
  const handleProfileComplete = () => {
    onComplete();
  };

  const handleBackToPage1 = () => {
    setCurrentStep('page1');
  };

  // Go back to course selection (page 2)
  const handleBackToCourseSelection = () => {
    setCurrentStep('page2');
  };

  // Reset auto-populate flag when classYear changes or when going back to page 1
  useEffect(() => {
    if (currentStep === 'page1') {
      hasAutoPopulatedRef.current = false;
    }
  }, [currentStep]);

  // Reset auto-populate flag if user changes classYear from original
  useEffect(() => {
    if (classYear !== originalClassYear && originalClassYear !== null) {
      hasAutoPopulatedRef.current = false;
    }
  }, [classYear, originalClassYear]);

  // Auto-populate courses for 2L/3L/LLM when on page 2
  useEffect(() => {
    const autoPopulateCourses = async () => {
      // Only auto-populate if:
      // 1. We're on page 2 (course selection)
      // 2. classYear is not '1L' (1L has its own logic, 2L/3L/LLM use this logic)
      // 3. classYear hasn't changed from original
      // 4. profileClasses has data
      // 5. allCourseData is loaded
      // 6. We haven't already auto-populated
      if (
        currentStep !== 'page2' ||
        classYear === '1L' ||
        classYear !== originalClassYear ||
        profileClasses.length === 0 ||
        allCourseData.length === 0 ||
        hasAutoPopulatedRef.current
      ) {
        return;
      }

      // Mark that we've auto-populated
      hasAutoPopulatedRef.current = true;

      // For each class in profileClasses, find the course by UUID and add it
      const coursesToAdd: CourseData[] = [];
      for (const classData of profileClasses) {
        if (!classData.course_id) continue; // Skip if no course_id UUID

        // Find the course in allCourseData by UUID
        const course = allCourseData.find(c => c.id === classData.course_id);
        
        if (course) {
          // Create a CourseData object similar to what handleCourseSelect does
          const newCourse: CourseData = {
            id: `${course.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            courseName: course.course_name,
            professor: course.instructor || classData.professor || 'TBA',
            credits: course.credits || 3,
            semester: (course.semester as 'Spring' | 'Fall' | 'Winter') || 'Fall',
            days: course.days ? (typeof course.days === 'string' ? course.days.split(';').map((d: string) => d.trim()) : course.days) : ['TBA'],
            time: course.times ? normalizeTimeRange(course.times.split('|').map((t: string) => t.trim())[0]) : 'TBA',
            location: course.location,
            original_course_id: course.original_course_id,
            course_uuid: course.id
          };

          coursesToAdd.push(newCourse);
        }
      }

      // Add all courses at once to avoid multiple re-renders
      if (coursesToAdd.length > 0) {
        setSelectedCourses((prev: CourseData[]) => {
          // Filter out duplicates
          const existing = new Set(prev.map(c => `${c.courseName}-${c.professor}`));
          const newCourses = coursesToAdd.filter(c => 
            !existing.has(`${c.courseName}-${c.professor}`)
          );
          return [...prev, ...newCourses];
        });
      }
    };

    autoPopulateCourses();
  }, [currentStep, classYear, originalClassYear, profileClasses, allCourseData]);

  // Show profile step
  if (currentStep === 'profile') {
    return <OnboardingStepThree 
      onDone={handleProfileComplete} 
      onBack={handleBackToCourseSelection}
      selectedCourses={selectedCourses}
      userInfo={{ name, phone, classYear, section }}
      skipCourses={skipCourses}
    />;
  }

  // Show the onboarding page with appropriate props
  const getOnboardingProps = () => {
    const baseProps = {
      // Basic info form
      name, setName,
      phone, setPhone,
      classYear, setClassYear,
      section, setSection,
      lrwSection, setLrwSection,
      loading, setLoading,
      
      // Course selection
      selectedCourses, setSelectedCourses,
      currentSemester, setCurrentSemester,
      allCourseData, setAllCourseData,
      coursesLoading, setCoursesLoading,
      
      // Course search
      searchQuery, setSearchQuery,
      availableCourses, setAvailableCourses,
      showMaxCourseWarning, setShowMaxCourseWarning,
      onBackToPage1: handleBackToPage1,
    };
    
    if (currentStep === 'page2') {
      return { ...baseProps, onComplete: handlePage2Complete, initialPage: 2, setSkipCourses };
    }
    return { ...baseProps, onComplete: handlePage1Complete, initialPage: 1, setSkipCourses };
  };

  return <OnboardingPage {...getOnboardingProps()} />;
}
