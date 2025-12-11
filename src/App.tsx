/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions */
// App component - main entry point
// Trigger deployment
import React, { useEffect, useState, useRef, Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationSidebar } from './components/NavigationSidebar';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { MobileComingSoon } from './components/MobileComingSoon';
import { isPhone } from './components/ui/use-mobile';
import { supabase } from './lib/supabase';
import { queryClient } from './lib/queryClient';
import type { Outline } from './types';
import { PostLoginLoading } from './components/PostLoginLoading';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Keep HomePage in initial bundle (likely first page)
import { HomePage } from './components/HomePage';

// Lazy-load all other pages for code splitting
// These will be split into separate chunks and only loaded when needed
// Using named exports, so we wrap them as default for lazy loading
const OutlinePage = lazy(() => import('./components/OutlinePage').then(module => ({ default: module.OutlinePage })));
const ExamPage = lazy(() => import('./components/ExamPage').then(module => ({ default: module.ExamPage })));
const ReviewsPage = lazy(() => import('./components/ReviewsPage').then(module => ({ default: module.ReviewsPage })));
const PlannerPage = lazy(() => import('./components/PlannerPage').then(module => ({ default: module.PlannerPage })));
const CalendarPage = lazy(() => import('./components/CalendarPage').then(module => ({ default: module.CalendarPage })));
const CoursePage = lazy(() => import('./components/CoursePage').then(module => ({ default: module.CoursePage })));
const BarReviewPage = lazy(() => import('./components/BarReviewPage').then(module => ({ default: module.BarReviewPage })));
const ProfilePage = lazy(() => import('./components/NewProfilePage').then(module => ({ default: module.ProfilePage })));
const FeedbackPage = lazy(() => import('./components/FeedbackPage').then(module => ({ default: module.FeedbackPage })));
const DirectoryPage = lazy(() => import('./components/DirectoryPage').then(module => ({ default: module.DirectoryPage })));
const ClubsPage = lazy(() => import('./components/ClubsPage').then(module => ({ default: module.ClubsPage })));
const ClubDetailPage = lazy(() => import('./components/ClubDetailPage').then(module => ({ default: module.ClubDetailPage })));
const ClubAccountPage = lazy(() => import('./components/ClubAccountPage').then(module => ({ default: module.ClubAccountPage })));
const BigLawGuidePage = lazy(() => import('./components/BigLawGuidePage').then(module => ({ default: module.BigLawGuidePage })));
const QuadlePage = lazy(() => import('./components/QuadlePage').then(module => ({ default: module.QuadlePage })));
const MessagingPage = lazy(() => import('./components/MessagingPage').then(module => ({ default: module.MessagingPage })));

// Loading fallback component for Suspense boundaries - using skeleton instead of spinner
import { PageSkeleton } from './components/ui/skeletons';

const PageLoadingFallback = () => <PageSkeleton />;


function AppContent({ user }: { user: any }) {
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isFadingOut, setIsFadingOut] = React.useState(false);

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
            setAuthLoading(false);
            setHasCompletedOnboarding(false);
            setIsClubAccount(false);
          }
          return;
        }

        // Check if user is a club account
        const userMetadata = currentUser.app_metadata;
        const isClub = userMetadata?.user_type === 'club_account';
        
        if (isMounted) {
          setIsClubAccount(isClub);
        }

        // If club account, skip profile check and onboarding
        if (isClub) {
          if (isMounted) {
            setAuthLoading(false);
            setHasCompletedOnboarding(true); // Set to true so they don't see onboarding
            // Redirect to club account page if not already there
            if (window.location.pathname !== '/club-account') {
              navigate('/club-account', { replace: true });
            }
          }
          return;
        }

        // For regular users, check profile and onboarding
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('classes_filled')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error?.message || "Unknown error");
          if (isMounted) {
            setHasCompletedOnboarding(false);
            setAuthLoading(false);
          }
          return;
        }

        // Check if user has completed onboarding (classes_filled = true)
        const onboardingCompleted = profile?.classes_filled === true;
        
        if (isMounted) {
          setHasCompletedOnboarding(onboardingCompleted);
          setAuthLoading(false);
        }
      } catch (_err) {
        if (isMounted) {
          setAuthLoading(false);
          setHasCompletedOnboarding(false);
          setIsClubAccount(false);
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
  }, [user, navigate]);
  
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isClubAccount, setIsClubAccount] = useState<boolean>(false);
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(() => {
    return window.location.pathname === '/reset-password';
  });
  const [showAuthCallback, setShowAuthCallback] = useState(() => {
    return window.location.pathname === '/auth/callback';
  });

  // Check if we're on special auth pages
  useEffect(() => {
    const checkSpecialPages = () => {
      if (window.location.pathname === '/reset-password') {
        setShowResetPassword(true);
        setShowAuthCallback(false);
      } else if (window.location.pathname === '/auth/callback') {
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Default: no selection (show all)
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'upload'>(
    'search'
  );
  const [savedOutlines, setSavedOutlines] = useState<Outline[]>([]);
  const fetchedOutlinesOnceRef = useRef(false);

  // Exam-specific state (mirroring outlines structure)
  // Note: These variables are kept for future exam UI implementation
  // @ts-ignore - Suppressing unused variable warnings for future exam UI
  const [exams, setExams] = useState<Outline[]>([]);
  const [selectedExam, setSelectedExam] = useState<Outline | null>(null);
  const [selectedCourseForExams, setSelectedCourseForExams] = useState('');
  const [selectedInstructorForExams, setSelectedInstructorForExams] = useState('');
  const [selectedGradeForExams, setSelectedGradeForExams] = useState<string | undefined>(undefined);
  const [selectedYearForExams, setSelectedYearForExams] = useState<string | undefined>(undefined);
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

  // Filter exams based on search criteria (memoized for performance)
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
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
  }, [exams, selectedCourseForExams, selectedInstructorForExams, selectedGradeForExams, selectedYearForExams, selectedTagsForExams]);


  // Load saved outlines from database - DEFERRED: only load when "saved" tab is active
  // This improves initial load performance by not fetching data until needed
  const [outlineActiveTab, setOutlineActiveTab] = useState<'search' | 'saved' | 'upload'>('search');
  
  useEffect(() => {
    const loadSavedOutlines = async () => {
      // Only load if user is on "saved" tab
      if (!user?.id || outlineActiveTab !== 'saved') return;

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
        console.error('Error loading saved outlines:', error instanceof Error ? error.message : "Unknown error");
      }
    };

    loadSavedOutlines();
  }, [user?.id, activeTab]);

  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedCourseForSearch, setSelectedCourseForSearch] =
    useState<string>('');
  const [previousSection, setPreviousSection] = useState<string>('home');
  const [previousUrl, setPreviousUrl] = useState<string>('/');

  // Get current section from URL path
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path.startsWith('/outlines')) return 'outlines';
    if (path.startsWith('/exams')) return 'exams';
    if (path.startsWith('/reviews')) return 'reviews';
    if (path.startsWith('/planner')) return 'planner';
    if (path.startsWith('/directory')) return 'directory';
    if (path.startsWith('/clubs')) return 'clubs';
    if (path.startsWith('/barreview')) return 'barreview';
    if (path.startsWith('/biglaw-guide')) return 'biglaw-guide';
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
        fromDirectory={previousSection === 'directory'}
        fromHome={previousSection === 'home'}
      />
    );
  };

  const ClubDetailPageWrapper = () => {
    const { clubId } = useParams<{ clubId: string }>();
    const handleBackFromClub = () => {
      navigate('/clubs', { replace: false });
    };
    return (
      <ClubDetailPage
        clubId={clubId || ''}
        onBack={handleBackFromClub}
      />
    );
  };


  // Fetch outlines from Supabase with pagination (only after login)
  // Start fetching only when animation starts fading out to prevent lag
  useEffect(() => {
    const fetchOutlines = async () => {
      // Only start fetching when animation is fading out (isFadingOut is true)
      if (!user || !isFadingOut) {
        return;
      }

      // Prevent duplicate fetches on auth state changes
      if (fetchedOutlinesOnceRef.current) {
        return;
      }
      
      // Start fetching when fade begins

      try {
        const allOutlines: Outline[] = [];
        const batchSize = 1000;
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('outlines')
            .select('*')
            .order('course', { ascending: true })
            .range(from, from + batchSize - 1);

          if (error) {
            console.error('Error fetching outlines batch:', error?.message || "Unknown error");
            break;
          }

          if (data && data.length > 0) {
            allOutlines.push(...data);
            
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
        
        // Transform database data to match Outline interface
        // Break up transformation to avoid blocking main thread
        const transformedOutlines: Outline[] = [];
        const transformBatchSize = 100;
        
        for (let i = 0; i < allOutlines.length; i += transformBatchSize) {
          const batch = allOutlines.slice(i, i + transformBatchSize);
          const transformedBatch = batch.map((item: any): Outline => ({
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
            created_at: item.created_at,
            updated_at: item.updated_at,
            grade: item.grade || 'P', // Use database 'grade' field directly
            type: item.pages <= 25 ? 'attack' : 'outline' // Determine type based on page count
          }));
          transformedOutlines.push(...transformedBatch);
          
          // Yield to main thread every batch to prevent blocking
          if (i + transformBatchSize < allOutlines.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
        
        setOutlines(transformedOutlines);
        fetchedOutlinesOnceRef.current = true;
      } catch (error) {
        console.error('Error fetching outlines:', error instanceof Error ? error.message : "Unknown error");
      }
    };

    fetchOutlines();
  }, [user, isFadingOut]); // Start fetching when fade begins

  // Fetch exams from Supabase with pagination
  // Start fetching only when animation starts fading out to prevent lag
  useEffect(() => {
    const fetchExams = async () => {
      // Only start fetching when animation is fading out (isFadingOut is true)
      if (!user || !isFadingOut) {
        return;
      }

      // Prevent duplicate fetches on auth state changes
      if (fetchedExamsOnceRef.current) {
        return;
      }
      
      // Start fetching when fade begins

      try {
        const allExams: Outline[] = [];
        const batchSize = 1000;
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('exams')
            .select('*')
            .order('course', { ascending: true })
            .range(from, from + batchSize - 1);

          if (error) {
            console.error('Error fetching exams batch:', error?.message || "Unknown error");
            break;
          }

          if (data && data.length > 0) {
            allExams.push(...data);
            
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

        setExams(allExams);
        fetchedExamsOnceRef.current = true;
      } catch (error) {
        console.error('Error fetching exams:', error instanceof Error ? error.message : "Unknown error");
      }
    };

    fetchExams();
  }, [user, isFadingOut]); // Start fetching when fade begins

  // Load saved exams from database - DEFERRED: only load when "saved" tab is active
  // This improves initial load performance by not fetching data until needed
  useEffect(() => {
    const loadSavedExams = async () => {
      // Only load if user is on "saved" tab
      if (!user?.id || activeExamTab !== 'saved') return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('saved_exams')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching saved exams:', error?.message || "Unknown error");
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
        console.error('Error loading saved exams:', error instanceof Error ? error.message : "Unknown error");
      }
    };

    loadSavedExams();
  }, [user?.id, activeExamTab]);



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
    setPreviousUrl(location.pathname); // Remember the full URL we came from
    const encodedStudentName = encodeURIComponent(studentName);
    navigate(`/student-profile/${encodedStudentName}`);
  };

  const handleBackFromStudentProfile = () => {
    navigate(previousUrl);
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
      console.error('Error saving outline:', error instanceof Error ? error.message : "Unknown error");
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
      console.error('Error removing saved outline:', error instanceof Error ? error.message : "Unknown error");
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
      console.error('Error saving exam:', error instanceof Error ? error.message : "Unknown error");
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
      console.error('Error removing saved exam:', error instanceof Error ? error.message : "Unknown error");
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

  // Ensure loading screen shows for minimum duration (3.0s overlay; animation completes in ~2.0s)
  // Only show animation when the playLoginAnimation flag is set (manual login)
  // NOTHING loads during animation - data fetching and website rendering only start when fade begins
  const previousUserRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (user) {
      const shouldPlayAnimation = sessionStorage.getItem('playLoginAnimation') === 'true';
      
      if (shouldPlayAnimation) {
        // Manual login just occurred - show animation for minimum duration
        // NO data fetching or rendering happens during animation - only when fade starts
        setMinLoadingTimeElapsed(false);
        setIsFadingOut(false);
        
        // Start fade out immediately after animation completes (2.0s), then hide completely after fade
        // This is when data fetching and website rendering will begin
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true); // This triggers all data fetching and website rendering
        }, 2000); // Start fading immediately when animation completes (no hold)
        
        const hideTimer = setTimeout(() => {
          setMinLoadingTimeElapsed(true);
          sessionStorage.removeItem('playLoginAnimation');
          sessionStorage.removeItem('playLoginAnimationSetAt');
        }, 3000); // Hide completely after fade completes (2.0s + 1.0s fade)
        
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
        };
      } else {
        // No animation requested - skip immediately and allow data fetching
        setMinLoadingTimeElapsed(true);
        setIsFadingOut(true); // Set to true to allow data fetching even without animation
        sessionStorage.removeItem('playLoginAnimation');
        sessionStorage.removeItem('playLoginAnimationSetAt');
      }
    } else {
      // Reset timer when there is no authenticated user
      setMinLoadingTimeElapsed(false);
      setIsFadingOut(false);
      
      // Reset fetch flags so data can be re-fetched on next login
      fetchedOutlinesOnceRef.current = false;
      fetchedExamsOnceRef.current = false;

      // Only clear animation flags if the previous state had a user (i.e., an actual logout)
      if (previousUserRef.current) {
        sessionStorage.removeItem('playLoginAnimation');
        sessionStorage.removeItem('playLoginAnimationSetAt');
      }
    }

    previousUserRef.current = user;
  }, [user]);

  // Show auth callback page if user is on auth callback route (check this first)
  if (showAuthCallback) {
    return <AuthCallback />;
  }

  // Show reset password page if user is on reset password route
  if (showResetPassword) {
    return <ResetPasswordPage />;
  }

  // Show login page if user is not authenticated (unless we're on special auth pages)
  if (!user && !showResetPassword && !showAuthCallback) {
    return <AuthPage />;
  }

  // Show mobile coming soon message if user is on a phone (after login) - applies to all users including club accounts
  if (user && isPhone()) {
    return <MobileComingSoon />;
  }

  // Show club account page if user is a club account
  if (user && isClubAccount) {
    return <ClubAccountPage />;
  }

  // Show loading state while checking authentication OR checking onboarding status
  // Animation ends after 2.3s regardless of data loading status
  // Only show animation when explicitly requested by manual login
  const shouldPlayAnimationFlag = sessionStorage.getItem('playLoginAnimation') === 'true';
  
  // Show animation only when flag is set (manual login)
  const shouldShowAnimation = shouldPlayAnimationFlag && 
    (user && hasCompletedOnboarding !== null && !minLoadingTimeElapsed);
  
  // Show regular loading (no animation) while checking onboarding on page refresh
  // Skip if animation should show (to avoid showing logo before animation)
  const shouldShowRegularLoading = (showAuthLoading || 
    (hasCompletedOnboarding === null && user)) && !shouldShowAnimation;
  
  // Always render the website content, but show animation overlay on top when needed
  const websiteContent = (
    <div className="h-screen flex min-w-0" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* Navigation Sidebar */}
      <NavigationSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Main Content */}
      <main 
        className="flex-1 overflow-hidden" 
        style={{ 
          marginLeft: sidebarCollapsed ? '4rem' : '10rem',
          transition: 'margin-left 300ms ease',
          willChange: 'margin-left'
        }}
      >
        <Suspense fallback={<PageLoadingFallback />}>
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
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/barreview" element={<BarReviewPage onNavigateToStudentProfile={handleNavigateToStudentProfile} />} />
          <Route path="/directory" element={<DirectoryPage onNavigateToStudentProfile={handleNavigateToStudentProfile} />} />
          <Route path="/biglaw-guide" element={<BigLawGuidePage />} />
          <Route path="/quadle" element={<QuadlePage />} />
          <Route path="/clubs" element={<ClubsPage onNavigateToClub={(clubId) => navigate(`/club/${clubId}`)} />} />
          <Route path="/club/:clubId" element={<ClubDetailPageWrapper />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/club-account" element={<ClubAccountPage />} />
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
        </Suspense>
      </main>
    </div>
  );

  // Wrap routes with ErrorBoundary to catch errors
  const websiteContentWithErrorBoundary = (
    <ErrorBoundary>
      {websiteContent}
    </ErrorBoundary>
  );

  if (shouldShowAnimation) {
    return (
      <>
        {/* Always render website content behind animation so it shows through as animation fades */}
        {websiteContentWithErrorBoundary}
        <PostLoginLoading isFadingOut={isFadingOut} />
      </>
    );
  }
  
  // Show minimal loading state (no animation) for page refreshes
  if (shouldShowRegularLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 fade-in-overlay" style={{ backgroundColor: '#faf3ef' }}>
        <div className="text-center">
          <img
            src="/QUAD.svg"
            alt="Quad Logo"
            className="w-24 h-24 mx-auto"
          />
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700 mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  // Show onboarding flow if user hasn't completed onboarding (unless we're on reset password page or in password recovery)
  const isPasswordRecovery = sessionStorage.getItem('isPasswordRecovery') === 'true';
  if (hasCompletedOnboarding === false && !showResetPassword && !isPasswordRecovery) {
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
            console.error('Error updating classes_filled:', error?.message || "Unknown error");
          }
        }
        
        // Immediately show main website after completion
        setHasCompletedOnboarding(true);
      }} />
    );
  }

  return websiteContentWithErrorBoundary;
}

// App component that uses AuthContext - must be defined before App
function AppWithAuth() {
  const { user } = useAuth();

  return <AppContent user={user} />;
}

// Main App Component with QueryClientProvider, AuthProvider and Router
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppWithAuth />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}