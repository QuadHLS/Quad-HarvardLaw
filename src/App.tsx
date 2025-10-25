/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions */
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NavigationSidebar } from './components/NavigationSidebar';
import { OutlinePage } from './components/OutlinePage';
import { ExamPage } from './components/ExamPage';
import { ReviewsPage } from './components/ReviewsPage';
import { PlannerPage } from './components/PlannerPage';
import { HomePage } from './components/HomePage';
import { CoursePage } from './components/CoursePage';
import { BarReviewPage } from './components/BarReviewPage';
import { ProfilePage } from './components/ProfilePage';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { supabase } from './lib/supabase';
import type { Outline } from './types';


function AppContent({ user }: { user: any }) {
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndProfile = async () => {
      try {
        let currentUser = user;
        if (!currentUser) {
          const { data } = await supabase.auth.getSession();
          currentUser = data.session?.user ?? null;
        }

        if (!currentUser) {
          if (isMounted) {
            setIsVerified(false);
            setAuthLoading(false);
            setHasCompletedOnboarding(false);
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('classes_filled')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
        if (isMounted) {
          setHasCompletedOnboarding(false);
          setAuthLoading(false);
        }
          return;
        }

        if (isMounted) {
          setHasCompletedOnboarding(false);
          setAuthLoading(false);
        }
      } catch (_err) {
        if (isMounted) {
          setAuthLoading(false);
          setHasCompletedOnboarding(false);
        }
      }
    };

    checkAuthAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAuthAndProfile();
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [user]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(() => {
    return window.location.pathname === '/reset-password';
  });
  const [showAuthCallback, setShowAuthCallback] = useState(() => {
    return window.location.pathname === '/auth/callback';
  });

  // Check if we're on special auth pages
  useEffect(() => {
    const checkSpecialPages = () => {
      console.log('Checking URL:', window.location.pathname);
      
      if (window.location.pathname === '/reset-password') {
        console.log('Setting showResetPassword to true');
        setShowResetPassword(true);
        setShowAuthCallback(false);
      } else if (window.location.pathname === '/auth/callback') {
        console.log('Setting showAuthCallback to true - OAuth callback detected');
        setShowAuthCallback(true);
        setShowResetPassword(false);
      } else {
        setShowResetPassword(false);
        setShowAuthCallback(false);
      }
    };

    checkSpecialPages();
    window.addEventListener('popstate', checkSpecialPages);
    
    return () => window.removeEventListener('popstate', checkSpecialPages);
  }, []);
  
  // Outlines state
  const [outlines, setOutlines] = useState<Outline[]>([]);

  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | undefined>(
    undefined
  );
  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    undefined
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(['Attack', 'Outline']);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'upload'>(
    'search'
  );
  const [savedOutlines, setSavedOutlines] = useState<Outline[]>([]);
  const fetchedOutlinesOnceRef = useRef(false);

  // Exam-specific state (mirroring outlines structure)
  // Note: These variables are kept for future exam UI implementation
  // @ts-ignore - Suppressing unused variable warnings for future exam UI
  const [exams, setExams] = useState<Outline[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Outline | null>(null);
  const [selectedCourseForExams, setSelectedCourseForExams] = useState('');
  const [selectedInstructorForExams, setSelectedInstructorForExams] = useState('');
  const [selectedGradeForExams, setSelectedGradeForExams] = useState<string | undefined>(undefined);
  const [selectedYearForExams, setSelectedYearForExams] = useState<string | undefined>(undefined);
  const [showExams, setShowExams] = useState(true);
  const [showExamAttacks, setShowExamAttacks] = useState(true);
  const [activeExamTab, setActiveExamTab] = useState<'search' | 'saved' | 'upload'>('search');
  const [savedExams, setSavedExams] = useState<Outline[]>([]);
  const [selectedTagsForExams, setSelectedTagsForExams] = useState<string[]>(['Attack', 'Outline']);
  const fetchedExamsOnceRef = useRef(false);

  // Derive courses and instructors from exams data
  const examCourses = [...new Set(exams.map(e => e.course))].sort();
  const examInstructors = [...new Map(exams.map(e => [e.instructor, { id: e.instructor, name: e.instructor, courses: Array.from(new Set(exams.filter(x => x.instructor === e.instructor).map(x => x.course))) }])).values()] as any;
  
  // Exam-specific search term and myCourses (empty for now)
  const examSearchTerm = '';
  const examMyCourses: string[] = [];

  // Filter exams based on search criteria
  const filteredExams = exams.filter((exam) => {
    // Require BOTH a course AND instructor selection
    if (selectedCourseForExams === '' || selectedInstructorForExams === '') {
      return false;
    }

    const matchesCourse = exam.course === selectedCourseForExams;
    const matchesInstructor = exam.instructor === selectedInstructorForExams;
    const matchesGrade = !selectedGradeForExams || exam.grade === selectedGradeForExams;
    const matchesYear = !selectedYearForExams || exam.year === selectedYearForExams;

    // Tag filtering: 'Attack' = pages <= 25, 'Outline' = pages > 25
    const isAttack = exam.pages <= 25;
    const isOutline = exam.pages > 25;
    const matchesTags =
      selectedTagsForExams.length === 0 ||
      (selectedTagsForExams.includes('Attack') && isAttack) ||
      (selectedTagsForExams.includes('Outline') && isOutline);

    return matchesCourse && matchesInstructor && matchesGrade && matchesYear && matchesTags;
  });


  // Load saved outlines from database
  useEffect(() => {
    const loadSavedOutlines = async () => {
      if (!user?.id) return;

      try {
        // Get user's saved outline IDs from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('saved_outlines')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading saved outlines:', profileError);
          return;
        }

        if (!profile?.saved_outlines || profile.saved_outlines.length === 0) {
          setSavedOutlines([]);
          return;
        }

        // Fetch the actual outline data for saved outline IDs
        const { data: outlines, error: outlinesError } = await supabase
          .from('outlines')
          .select('*')
          .in('id', profile.saved_outlines);

        if (outlinesError) {
          console.error('Error fetching saved outline details:', outlinesError);
          return;
        }

        setSavedOutlines(outlines || []);
      } catch (error) {
        console.error('Error loading saved outlines:', error);
      }
    };

    loadSavedOutlines();
  }, [user?.id]);

  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedCourseForSearch, setSelectedCourseForSearch] =
    useState<string>('');
  const [previousSection, setPreviousSection] = useState<string>('home');

  // Get current section from URL path
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path.startsWith('/outlines')) return 'outlines';
    if (path.startsWith('/exams')) return 'exams';
    if (path.startsWith('/reviews')) return 'reviews';
    if (path.startsWith('/planner')) return 'planner';
    if (path.startsWith('/barreview')) return 'barreview';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/course')) return 'course';
    if (path.startsWith('/student-profile')) return 'student-profile';
    return 'home';
  };

  const activeSection = getCurrentSection();

  const [sortBy] = useState('Highest Rated');

  // Wrapper components for dynamic routes
  const CoursePageWrapper = () => {
    const { courseName } = useParams<{ courseName: string }>();
    const decodedCourseName = courseName ? decodeURIComponent(courseName) : '';
    console.log('CoursePageWrapper - courseName param:', courseName);
    console.log('CoursePageWrapper - decoded course name:', decodedCourseName);
    return (
      <CoursePage
        courseName={decodedCourseName}
        onBack={handleBackFromCourse}
        onNavigateToOutlines={handleNavigateToOutlines}
        onNavigateToOutlinesPage={handleNavigateToOutlinesPage}
        onNavigateToStudentProfile={handleNavigateToStudentProfile}
      />
    );
  };

  const StudentProfileWrapper = () => {
    const { studentName } = useParams<{ studentName: string }>();
    const decodedStudentName = studentName ? decodeURIComponent(studentName) : '';
    return (
      <ProfilePage
        studentName={decodedStudentName}
        onBack={handleBackFromStudentProfile}
        fromBarReview={previousSection === 'barreview'}
      />
    );
  };


  // Fetch outlines from Supabase with pagination (only after login)
  useEffect(() => {
    const fetchOutlines = async () => {
      // Wait for authentication to be ready and a user session to exist
      if (authLoading || !user) {
        return;
      }

      // Prevent duplicate fetches on auth state changes
      if (fetchedOutlinesOnceRef.current) {
        return;
      }

      try {
        const allOutlines: Outline[] = [];
        const batchSize = 1000;
        let from = 0;
        let hasMore = true;

        console.log('Starting to fetch outlines with pagination...');

        while (hasMore) {
          const { data, error } = await supabase
            .from('outlines')
            .select('*')
            .order('course', { ascending: true })
            .range(from, from + batchSize - 1);

          if (error) {
            console.error('Error fetching outlines batch:', error);
            break;
          }

          if (data && data.length > 0) {
            allOutlines.push(...data);
            console.log(`Fetched batch: ${data.length} records (total: ${allOutlines.length})`);
            
            // If we got less than batchSize, we've reached the end
            if (data.length < batchSize) {
              hasMore = false;
            } else {
              from += batchSize;
            }
          } else {
            hasMore = false;
          }
        }

        console.log(`Finished fetching outlines: ${allOutlines.length} total records`);
        
        // Transform database data to match Outline interface
        const transformedOutlines = allOutlines.map((item: any): Outline => ({
          id: item.id,
          title: item.title,
          file_name: item.file_name,
          file_path: item.file_path,
          file_type: item.file_type,
          file_size: item.file_size,
          course: item.course,
          instructor: item.instructor,
          year: item.year,
          pages: item.pages || 0,
          description: item.description,
          rating: item.rating || 0,
          rating_count: item.rating_count || 0,
          download_count: item.download_count || 0,
          created_at: item.created_at,
          updated_at: item.updated_at,
          grade: item.grade || 'P', // Use database 'grade' field directly
          type: item.pages <= 25 ? 'attack' : 'outline' // Determine type based on page count
        }));
        
        console.log('Transformed outlines sample:', transformedOutlines.slice(0, 3));
        setOutlines(transformedOutlines);
        fetchedOutlinesOnceRef.current = true;
      } catch (error) {
        console.error('Error fetching outlines:', error);
      }
    };

    fetchOutlines();
  }, [authLoading, user]);

  // Fetch exams from Supabase with pagination
  useEffect(() => {
    const fetchExams = async () => {
      // Wait for authentication to be ready and a user session to exist
      if (authLoading || !user) {
        return;
      }

      // Prevent duplicate fetches on auth state changes
      if (fetchedExamsOnceRef.current) {
        return;
      }

      try {
        setExamsLoading(true);
        const allExams: Outline[] = [];
        const batchSize = 1000;
        let from = 0;
        let hasMore = true;

        console.log('Starting to fetch exams with pagination...');

        while (hasMore) {
          const { data, error } = await supabase
            .from('exams')
            .select('*')
            .order('course', { ascending: true })
            .range(from, from + batchSize - 1);

          if (error) {
            console.error('Error fetching exams batch:', error);
            break;
          }

          if (data && data.length > 0) {
            allExams.push(...data);
            console.log(`Fetched exam batch: ${data.length} records (total: ${allExams.length})`);
            
            // If we got less than batchSize, we've reached the end
            if (data.length < batchSize) {
              hasMore = false;
            } else {
              from += batchSize;
            }
          } else {
            hasMore = false;
          }
        }

        console.log(`Finished fetching exams: ${allExams.length} total records`);
        setExams(allExams);
        fetchedExamsOnceRef.current = true;
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setExamsLoading(false);
      }
    };

    fetchExams();
  }, [authLoading, user]);

  // Load saved exams from database
  useEffect(() => {
    const loadSavedExams = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('saved_exams')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching saved exams:', error);
          return;
        }

        const savedExamIds = profile?.saved_exams || [];
        if (savedExamIds.length === 0) {
          setSavedExams([]);
          return;
        }

        // Fetch the actual exam objects
        const { data: savedExamObjects, error: fetchError } = await supabase
          .from('exams')
          .select('*')
          .in('id', savedExamIds);

        if (fetchError) {
          console.error('Error fetching saved exam objects:', fetchError);
          return;
        }

        setSavedExams(savedExamObjects || []);
      } catch (error) {
        console.error('Error loading saved exams:', error);
      }
    };

    loadSavedExams();
  }, [user?.id, exams]);



  const handleNavigateToOutlines = (
    courseName: string,
    outlineName: string
  ) => {
    // Find the outline that matches the course and name
    const outline = outlines.find(
      (o) => o.course === courseName && o.title === outlineName
    );

    if (outline) {
      // Set the course and instructor to show the outline
      setSelectedCourseForSearch(courseName);
      setSelectedInstructor(outline.instructor);
      setSelectedOutline(outline);

      // Navigate to outlines section
      navigate('/outlines');
      setActiveTab('search');
    }
  };

  const handleNavigateToCourse = (courseName: string) => {
    const encodedCourseName = encodeURIComponent(courseName);
    navigate(`/course/${encodedCourseName}`);
  };

  const handleBackFromCourse = () => {
    navigate('/');
  };

  const handleNavigateToOutlinesPage = (courseName: string) => {
    // Set the course for the outlines search but don't select a specific outline
    setSelectedCourseForSearch(courseName);
    // Get any instructor for this course to enable the outline display
    const courseInstructors = outlines
      .filter((outline) => outline.course === courseName)
      .map((outline) => outline.instructor)
      .filter((instructor, index, self) => self.indexOf(instructor) === index);
    if (courseInstructors.length > 0) {
      setSelectedInstructor(courseInstructors[0]);
    }
    setSelectedOutline(null);
    navigate('/outlines');
    setActiveTab('search');
  };

  const handleNavigateToStudentProfile = (studentName: string) => {
    setPreviousSection(activeSection); // Remember where we came from
    const encodedStudentName = encodeURIComponent(studentName);
    navigate(`/student-profile/${encodedStudentName}`);
  };

  const handleBackFromStudentProfile = () => {
    navigate(previousSection === 'home' ? '/' : `/${previousSection}`);
  };


  // Filter outlines based on search criteria
  const filteredOutlines = outlines.filter((outline) => {
    // Require BOTH a course AND instructor selection
    if (selectedCourseForSearch === '' || selectedInstructor === '') {
      return false;
    }

    const matchesCourse = outline.course === selectedCourseForSearch;
    const matchesInstructor = outline.instructor === selectedInstructor;
    const matchesGrade = !selectedGrade || outline.grade === selectedGrade;
    const matchesYear = !selectedYear || outline.year === selectedYear;

    // Tag filtering: 'Attack' = pages <= 25, 'Outline' = pages > 25
    const isAttack = outline.pages <= 25;
    const isOutline = outline.pages > 25;
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => (tag === 'Attack' && isAttack) || (tag === 'Outline' && isOutline));

    return (
      matchesCourse &&
      matchesInstructor &&
      matchesGrade &&
      matchesYear &&
      matchesTags
    );
  });


  // Sort outlines
  const sortedOutlines = [...filteredOutlines].sort((a, b) => {
    if (sortBy === 'Highest Rated') {
      return b.rating - a.rating;
    }
    if (sortBy === 'Newest') {
      return parseInt(b.year) - parseInt(a.year);
    }
    return a.title.localeCompare(b.title);
  });


  const handleSaveOutline = async (outline: Outline) => {
    if (!user?.id) return;

    // Check if outline is already saved locally
    if (savedOutlines.some((saved) => saved.id === outline.id)) {
      return; // Don't add duplicates
    }

    try {
      // Get current saved outlines from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching current saved outlines:', profileError);
        return;
      }

      const currentSavedOutlines = profile?.saved_outlines || [];
      
      // Add new outline ID to the array
      const updatedSavedOutlines = [...currentSavedOutlines, outline.id];

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ saved_outlines: updatedSavedOutlines })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving outline:', updateError);
        return;
      }

      // Update local state
      setSavedOutlines((prev) => [...prev, outline]);
    } catch (error) {
      console.error('Error saving outline:', error);
    }
  };

  const handleRemoveSavedOutline = async (outlineId: string) => {
    if (!user?.id) return;

    try {
      // Get current saved outlines from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saved_outlines')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching current saved outlines:', profileError);
        return;
      }

      const currentSavedOutlines = profile?.saved_outlines || [];
      
      // Remove outline ID from the array
      const updatedSavedOutlines = currentSavedOutlines.filter((id: string) => id !== outlineId);

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ saved_outlines: updatedSavedOutlines })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error removing saved outline:', updateError);
        return;
      }

      // Update local state
      setSavedOutlines((prev) =>
        prev.filter((outline) => outline.id !== outlineId)
      );
    } catch (error) {
      console.error('Error removing saved outline:', error);
    }
  };

  const handleToggleSaveOutline = async (outline: Outline) => {
    if (!user?.id) return;

    const isAlreadySaved = savedOutlines.some((saved) => saved.id === outline.id);
    
    if (isAlreadySaved) {
      // Remove from saved
      await handleRemoveSavedOutline(outline.id);
    } else {
      // Add to saved
      await handleSaveOutline(outline);
    }
  };

  // Exam-specific functions
  const handleSaveExam = async (exam: Outline) => {
    if (!user?.id) return;

    // Check if exam is already saved locally
    if (savedExams.some((saved) => saved.id === exam.id)) {
      return; // Don't add duplicates
    }

    try {
      // Get current saved exams from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saved_exams')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching current saved exams:', profileError);
        return;
      }

      const currentSavedExams = profile?.saved_exams || [];
      
      // Add new exam ID to the array
      const updatedSavedExams = [...currentSavedExams, exam.id];

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ saved_exams: updatedSavedExams })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving exam:', updateError);
        return;
      }

      // Update local state
      setSavedExams((prev) => [...prev, exam]);
    } catch (error) {
      console.error('Error saving exam:', error);
    }
  };

  const handleRemoveSavedExam = async (examId: string) => {
    if (!user?.id) return;

    try {
      // Get current saved exams from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saved_exams')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching current saved exams:', profileError);
        return;
      }

      const currentSavedExams = profile?.saved_exams || [];
      
      // Remove exam ID from the array
      const updatedSavedExams = currentSavedExams.filter((id: string) => id !== examId);

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ saved_exams: updatedSavedExams })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error removing saved exam:', updateError);
        return;
      }

      // Update local state
      setSavedExams((prev) =>
        prev.filter((exam) => exam.id !== examId)
      );
    } catch (error) {
      console.error('Error removing saved exam:', error);
    }
  };

  const handleToggleSaveExam = async (exam: Outline) => {
    if (!user?.id) return;

    const isAlreadySaved = savedExams.some((saved) => saved.id === exam.id);
    
    if (isAlreadySaved) {
      // Remove from saved
      await handleRemoveSavedExam(exam.id);
    } else {
      // Add to saved
      await handleSaveExam(exam);
    }
  };



  const handleSectionChange = (section: string) => {
    // Navigate to the appropriate route
    if (section === 'home') {
      navigate('/');
    } else {
      navigate(`/${section}`);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Debounced auth loading indicator (only show if >150ms)
  const [showAuthLoading, setShowAuthLoading] = React.useState(false);
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (authLoading) {
      timer = setTimeout(() => setShowAuthLoading(true), 150);
    } else {
      setShowAuthLoading(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [authLoading]);

  // Show loading state while checking authentication
  if (showAuthLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 fade-in-overlay" style={{ backgroundColor: '#faf3ef' }}>
        <div className="text-center">
          <img
            src="/Quad SVG.svg"
            alt="Quad Logo"
            className="w-24 h-24 mx-auto"
          />
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  // Show auth callback page if user is on auth callback route (check this first)
  if (showAuthCallback) {
    console.log('Rendering AuthCallback');
    return <AuthCallback />;
  }

  // Show reset password page if user is on reset password route
  if (showResetPassword) {
    console.log('Rendering ResetPasswordPage');
    return <ResetPasswordPage />;
  }

  // Show login page if user is not authenticated (unless we're on special auth pages)
  if (!user && !showResetPassword && !showAuthCallback) {
    return <AuthPage />;
  }

  // Show onboarding flow if user hasn't completed onboarding (unless we're on reset password page or in password recovery)
  const isPasswordRecovery = sessionStorage.getItem('isPasswordRecovery') === 'true';
  if (!hasCompletedOnboarding && !showResetPassword && !isPasswordRecovery) {
    return (
      <OnboardingFlow onComplete={async () => {
        // Mark classes_filled as true in the database
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { error } = await supabase
            .from('profiles')
            .update({ classes_filled: true })
            .eq('id', currentUser.id);
          
          if (error) {
            console.error('Error updating classes_filled:', error);
          } else {
            console.log('Onboarding completed successfully');
          }
        }
        
        // Immediately show main website after completion
        setHasCompletedOnboarding(true);
      }} />
    );
  }

  return (
    <div className="h-screen flex min-w-0" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* Navigation Sidebar */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* OutlinePage manages its own header/filters; no left sidebar */}


      {/* Main Content */}
      <div className={`flex-1 overflow-hidden ${sidebarCollapsed ? 'ml-16' : 'ml-40'}`} style={{ transition: 'margin-left 300ms ease' }}>
        <Routes>
          <Route path="/" element={
            <HomePage
              onNavigateToCourse={handleNavigateToCourse}
              onNavigateToStudentProfile={handleNavigateToStudentProfile}
              user={user}
            />
          } />
          <Route path="/home" element={
            <HomePage
              onNavigateToCourse={handleNavigateToCourse}
              onNavigateToStudentProfile={handleNavigateToStudentProfile}
              user={user}
            />
          } />
          <Route path="/outlines" element={
            <OutlinePage
              outlines={sortedOutlines}
              allOutlines={outlines}
              courses={[...new Set(outlines.map(o => o.course))].sort()}
              instructors={[...new Map(outlines.map(o => [o.instructor, { id: o.instructor, name: o.instructor, courses: Array.from(new Set(outlines.filter(x => x.instructor === o.instructor).map(x => x.course))) }])).values()] as any}
              searchTerm={''}
              setSearchTerm={() => {}}
              selectedCourse={selectedCourseForSearch}
              setSelectedCourse={setSelectedCourseForSearch}
              selectedInstructor={selectedInstructor}
              setSelectedInstructor={setSelectedInstructor}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              myCourses={[]}
              selectedOutline={selectedOutline}
              onSelectOutline={setSelectedOutline}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              savedOutlines={savedOutlines}
              onRemoveSavedOutline={handleRemoveSavedOutline}
              onToggleSaveOutline={handleToggleSaveOutline}
              hiddenOutlines={[]}
              onHideOutline={() => {}}
              onUnhideAllOutlines={() => {}}
            />
          } />
          <Route path="/exams" element={
            <ExamPage
              exams={filteredExams}
              allExams={exams}
              courses={examCourses}
              instructors={examInstructors}
              searchTerm={examSearchTerm}
              setSearchTerm={() => {}}
              selectedCourse={selectedCourseForExams}
              setSelectedCourse={setSelectedCourseForExams}
              selectedInstructor={selectedInstructorForExams}
              setSelectedInstructor={setSelectedInstructorForExams}
              selectedGrade={selectedGradeForExams}
              setSelectedGrade={setSelectedGradeForExams}
              selectedYear={selectedYearForExams}
              setSelectedYear={setSelectedYearForExams}
              selectedTags={selectedTagsForExams}
              setSelectedTags={setSelectedTagsForExams}
              myCourses={examMyCourses}
              selectedExam={selectedExam}
              onSelectExam={setSelectedExam}
              activeTab={activeExamTab}
              setActiveTab={setActiveExamTab}
              savedExams={savedExams}
              onRemoveSavedExam={handleRemoveSavedExam}
              onToggleSaveExam={handleToggleSaveExam}
              hiddenExams={[]}
              onHideExam={() => {}}
              onUnhideAllExams={() => {}}
            />
          } />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/barreview" element={<BarReviewPage onNavigateToStudentProfile={handleNavigateToStudentProfile} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/course/:courseName" element={<CoursePageWrapper />} />
          <Route path="/student-profile/:studentName" element={<StudentProfileWrapper />} />
          <Route path="*" element={
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl text-gray-600">📄</span>
                </div>
                <h2 className="text-2xl font-medium text-gray-700 mb-4">
                  Page Not Found
                </h2>
                <p className="text-gray-600 max-w-md">
                  The page you're looking for doesn't exist.
                </p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

// Main App Component with AuthProvider and Router
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </Router>
  );
}

// App component that uses AuthContext
function AppWithAuth() {
  const { user } = useAuth();

  return <AppContent user={user} />;
}