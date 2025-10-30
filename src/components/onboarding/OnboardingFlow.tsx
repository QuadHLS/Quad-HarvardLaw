import { useState, useEffect } from 'react';
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

  // Fetch existing profile data to auto-fill fields
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, phone')
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

  // Go back to course selection (page 2)
  const handleBackToCourseSelection = () => {
    setCurrentStep('page2');
  };

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
    };
    
    if (currentStep === 'page2') {
      return { ...baseProps, onComplete: handlePage2Complete, initialPage: 2, setSkipCourses };
    }
    return { ...baseProps, onComplete: handlePage1Complete, initialPage: 1, setSkipCourses };
  };

  return <OnboardingPage {...getOnboardingProps()} />;
}
