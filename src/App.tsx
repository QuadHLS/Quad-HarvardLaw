import { useEffect, useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import { NavigationSidebar } from './components/NavigationSidebar';
import { OutlinePage } from './components/OutlinePage';
import { PDFViewer } from './components/PDFViewer';
import { OfficeWebViewer } from './components/OfficeWebViewer';
import { ReviewsPage } from './components/ReviewsPage';
import { HomePage } from './components/HomePage';
import { CoursePage } from './components/CoursePage';
import { BarReviewPage } from './components/BarReviewPage';
import { CalendarPage } from './components/CalendarPage';
import { ProfilePage } from './components/ProfilePage';
import { MessagingPage } from './components/MessagingPage';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import AccessCodeVerification from './components/AccessCodeVerification';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { supabase } from './lib/supabase';
import type { Outline } from './types';

// Courses will be derived from outlines data

// Calendar Event Interface
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'exam' | 'assignment' | 'study' | 'meeting' | 'personal';
  course?: string;
  location?: string;
  description?: string;
}

// Main App Content Component
function AppContent({ user }: { user: any }) {
  // Local auth state: remove authGuard and check directly here
  const [authLoading, setAuthLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndProfile = async () => {
      try {
        // Determine current user
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

        // Check if user has already verified their access code and completed onboarding
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('access_code_verified, classes_filled')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          // If profile doesn't exist or error, require verification
          if (isMounted) {
            setIsVerified(false);
            setHasCompletedOnboarding(false);
            setAuthLoading(false);
          }
          return;
        }

        if (isMounted) {
          // Set verification status based on database
          setIsVerified(profile?.access_code_verified === true);
          // Temporarily disable database check for testing - always start with onboarding
          setHasCompletedOnboarding(false);
          setAuthLoading(false);
        }
      } catch (_err) {
        if (isMounted) {
          setIsVerified(false);
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
  
  // Outlines state
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [outlinesLoading, setOutlinesLoading] = useState(true);

  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
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
  const [exams, setExams] = useState<Outline[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Outline | null>(null);
  // TODO: Implement outline selection callback in SearchSidebar
  // setSelectedExam will be used once SearchSidebar supports exam selection
  const [selectedCourseForExams, setSelectedCourseForExams] = useState('');
  const [selectedInstructorForExams, setSelectedInstructorForExams] = useState('');
  const [selectedGradeForExams, setSelectedGradeForExams] = useState<string | undefined>(undefined);
  const [selectedYearForExams, setSelectedYearForExams] = useState<string | undefined>(undefined);
  const [showExams, setShowExams] = useState(true);
  const [showExamAttacks, setShowExamAttacks] = useState(true);
  const [activeExamTab, setActiveExamTab] = useState<'search' | 'saved' | 'upload'>('search');
  const [savedExams, setSavedExams] = useState<Outline[]>([]);
  const fetchedExamsOnceRef = useRef(false);

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

  
  // Preview state
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadFormHasPreview, setUploadFormHasPreview] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedCourseForSearch, setSelectedCourseForSearch] =
    useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const [sortBy] = useState('Highest Rated');

  // Shared calendar events state
  const [calendarEvents] = useState<CalendarEvent[]>([]);

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
        setOutlinesLoading(true);
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
      } finally {
        setOutlinesLoading(false);
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

      // Switch to outlines section
      setActiveSection('outlines');
      setActiveTab('search');
    }
  };

  const handleNavigateToCourse = (courseName: string) => {
    setSelectedCourse(courseName);
    setActiveSection('course');
  };

  const handleBackFromCourse = () => {
    setSelectedCourse('');
    setActiveSection('home');
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
    setActiveSection('outlines');
    setActiveTab('search');
  };

  const handleNavigateToStudentProfile = (studentName: string) => {
    setSelectedStudent(studentName);
    setActiveSection('student-profile');
  };

  const handleBackFromStudentProfile = () => {
    setSelectedStudent('');
    setActiveSection('home');
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
    setActiveSection(section);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 text-white rounded-full mb-4"
            style={{ backgroundColor: '#752432' }}
          >
            <span className="text-2xl font-semibold">HLS</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Always require access code verification
  if (!isVerified) {
    return (
      <AccessCodeVerification
        onVerified={async () => {
          // Update the access_code_verified column in the database
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { error } = await supabase
              .from('profiles')
              .update({ access_code_verified: true })
              .eq('id', currentUser.id);
            
            if (error) {
              console.error('Error updating access_code_verified:', error);
            }
          }
          
          // Mark verified locally
          setIsVerified(true);
        }}
      />
    );
  }

  // Show onboarding flow if user hasn't completed onboarding
  if (!hasCompletedOnboarding) {
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
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* OutlinePage manages its own header/filters; no left sidebar */}

      {/* Search Sidebar - Only show when in exams section */}
      {activeSection === 'exams' && (
        <SearchSidebar
          outlines={exams.filter(exam => {
            const matchesCourse = !selectedCourseForExams || exam.course === selectedCourseForExams;
            const matchesInstructor = !selectedInstructorForExams || exam.instructor === selectedInstructorForExams;
            const matchesGrade = !selectedGradeForExams || exam.grade === selectedGradeForExams;
            const matchesYear = !selectedYearForExams || exam.year === selectedYearForExams;
            return matchesCourse && matchesInstructor && matchesGrade && matchesYear;
          })}
          allOutlines={exams}
          selectedCourse={selectedCourseForExams}
          setSelectedCourse={setSelectedCourseForExams}
          selectedInstructor={selectedInstructorForExams}
          setSelectedInstructor={setSelectedInstructorForExams}
          selectedGrade={selectedGradeForExams}
          setSelectedGrade={setSelectedGradeForExams}
          selectedYear={selectedYearForExams}
          setSelectedYear={setSelectedYearForExams}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showOutlines={showExams}
          setShowOutlines={setShowExams}
          showAttacks={showExamAttacks}
          setShowAttacks={setShowExamAttacks}
          activeTab={activeExamTab}
          setActiveTab={setActiveExamTab}
          savedOutlines={savedExams}
          onRemoveSavedOutline={handleRemoveSavedExam}
          onToggleSaveOutline={handleToggleSaveExam}
          loading={examsLoading}
          previewFile={previewFile}
          setPreviewFile={setPreviewFile}
          setPreviewLoading={setPreviewLoading}
          uploadFormHasPreview={uploadFormHasPreview}
          setUploadFormHasPreview={setUploadFormHasPreview}
          bucketName="Exams"
          tableName="exams"
          documentType="exam"
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 border-l border-gray-300 overflow-hidden ${sidebarCollapsed ? 'ml-16' : 'ml-40'}`} style={{ transition: 'margin-left 300ms ease-in-out' }}>
        {activeSection === 'outlines' ? (
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
        ) : activeSection === 'exams' ? (
          activeExamTab === 'upload' ? (
            uploadFormHasPreview ? (
              // Show preview in main content area when upload form has preview
              <div className="h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                {previewFile?.type.toLowerCase() === 'pdf' ? (
                  <PDFViewer
                    fileUrl={previewFile.url}
                    fileName={previewFile.name}
                    onDownload={() => {
                      const link = document.createElement('a');
                      link.href = previewFile.url;
                      link.download = previewFile.name;
                      link.click();
                      document.body.removeChild(link);
                    }}
                    onClose={() => {
                      setPreviewFile(null);
                      setUploadFormHasPreview(false);
                    }}
                    hideSearch={true}
                    hideDownload={true}
                  />
                ) : previewFile?.type.toLowerCase() === 'docx' ? (
                  <OfficeWebViewer
                    fileUrl={previewFile.url}
                    fileName={previewFile.name}
                    onDownload={() => {
                      const link = document.createElement('a');
                      link.href = previewFile.url;
                      link.download = previewFile.name;
                      link.click();
                      document.body.removeChild(link);
                    }}
                    onClose={() => {
                      setPreviewFile(null);
                      setUploadFormHasPreview(false);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Preview is not available for {previewFile?.type} files.
                      </p>
                      <button
                        onClick={() => {
                          if (previewFile) {
                            const link = document.createElement('a');
                            link.href = previewFile.url;
                            link.download = previewFile.name;
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Download File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                <div className="text-center p-8">
                  <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-medium text-gray-700 mb-4">
                    Upload Your Exam
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Use the upload form in the sidebar to share your exam
                    materials with the community.
                  </p>
                  <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
                    <h3 className="font-medium text-gray-800 mb-3">
                      Upload Guidelines:
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li>• Accepted formats: PDF and DOCX</li>
                      <li>• Maximum file size: 10MB</li>
                      <li>• Only upload your original work</li>
                      <li>
                        • Include accurate course, instructor, and grade information
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )
          ) : previewLoading ? (
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Loading Preview...
                </h3>
                <p className="text-gray-500 text-sm">
                  Please wait while we load the file for preview.
                </p>
              </div>
            </div>
          ) : previewFile ? (
            <div className="h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              {previewFile.type.toLowerCase() === 'pdf' ? (
                <PDFViewer
                  fileUrl={previewFile.url}
                  fileName={previewFile.name}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = previewFile.url;
                    link.download = previewFile.name;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  onClose={() => setPreviewFile(null)}
                />
              ) : previewFile.type.toLowerCase() === 'docx' ? (
                <OfficeWebViewer
                  fileUrl={previewFile.url}
                  fileName={previewFile.name}
                  onDownload={() => {
                    const link = document.createElement('a');
                    link.href = previewFile.url;
                    link.download = previewFile.name;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  onClose={() => setPreviewFile(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Preview Not Available
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Preview is not available for {previewFile.type} files.
                    </p>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewFile.url;
                        link.download = previewFile.name;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <OutlineViewer
              outline={selectedExam}
              onSaveOutline={handleSaveExam}
              documentType="exam"
              onClose={() => setSelectedExam(null)}
              isSaved={
                selectedExam
                  ? savedExams.some(
                      (saved) => saved.id === selectedExam.id
                    )
                  : false
              }
            />
          )
        ) : activeSection === 'reviews' ? (
          <ReviewsPage />
        ) : activeSection === 'home' ? (
          <HomePage
            onNavigateToCourse={handleNavigateToCourse}
            user={user}
          />
        ) : activeSection === 'feed' ? (
          <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            <div className="text-center p-8">
              <h2 className="text-2xl font-medium text-gray-700 mb-2">Feed</h2>
              <p className="text-gray-600">Coming soon.</p>
            </div>
          </div>
        ) : activeSection === 'course' ? (
          <CoursePage
            courseName={selectedCourse}
            onBack={handleBackFromCourse}
            onNavigateToOutlines={handleNavigateToOutlines}
            onNavigateToOutlinesPage={handleNavigateToOutlinesPage}
            onNavigateToStudentProfile={handleNavigateToStudentProfile}
          />
        ) : activeSection === 'student-profile' ? (
          <ProfilePage
            studentName={selectedStudent}
            onBack={handleBackFromStudentProfile}
          />
        ) : activeSection === 'calendar' ? (
          <CalendarPage additionalEvents={calendarEvents} />
        ) : activeSection === 'barreview' ? (
          <BarReviewPage />
        ) : activeSection === 'profile' ? (
          <ProfilePage />
        ) : activeSection === 'messaging' ? (
          <MessagingPage />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-600">📄</span>
              </div>
              <h2 className="text-2xl font-medium text-gray-700 mb-4">
                Coming Soon
              </h2>
              <p className="text-gray-600 max-w-md">
                This section is currently under development.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main App Component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// App component that uses AuthContext
function AppWithAuth() {
  const { user } = useAuth();

  return <AppContent user={user} />;
}