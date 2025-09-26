import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { NavigationSidebar } from './components/NavigationSidebar';
import { SearchSidebar } from './components/SearchSidebar';
import { OutlineViewer } from './components/OutlineViewer';
import { PDFViewer } from './components/PDFViewer';
import { DOCXViewer } from './components/DOCXViewer';
import { ReviewsPage } from './components/ReviewsPage';
import { HomePage } from './components/HomePage';
import { CoursePage } from './components/CoursePage';
import { BarReviewPage } from './components/BarReviewPage';
import { CalendarPage } from './components/CalendarPage';
import { ProfilePage } from './components/ProfilePage';
import { MessagingPage } from './components/MessagingPage';
import { ExamsPage } from './components/ExamsPage';
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
          .single();

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
          setIsVerified(profile.access_code_verified === true);
          // Set onboarding completion status based on classes_filled column
          setHasCompletedOnboarding(profile.classes_filled === true);
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
  const [showOutlines, setShowOutlines] = useState(true);
  const [showAttacks, setShowAttacks] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'upload'>(
    'search'
  );
  const [savedOutlines, setSavedOutlines] = useState<Outline[]>([]);
  const [hiddenOutlines, setHiddenOutlines] = useState<string[]>([]);

  // Exams state (separate from outlines)
  const [savedExams, setSavedExams] = useState<Outline[]>([]);
  const [hiddenExams, setHiddenExams] = useState<string[]>([]);
  
  // Preview state
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedCourseForSearch, setSelectedCourseForSearch] =
    useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const [sortBy, setSortBy] = useState('Highest Rated');

  // Shared calendar events state
  const [calendarEvents] = useState<CalendarEvent[]>([]);

  // Fetch outlines from Supabase with pagination
  useEffect(() => {
    const fetchOutlines = async () => {
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
        setOutlines(allOutlines);
      } catch (error) {
        console.error('Error fetching outlines:', error);
      } finally {
        setOutlinesLoading(false);
      }
    };

    fetchOutlines();
  }, []);

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
    // Don't show any outlines unless BOTH a course AND instructor are selected
    if (selectedCourseForSearch === '' || selectedInstructor === '') {
      return false;
    }

    // Exclude hidden outlines
    if (hiddenOutlines.includes(outline.id)) {
      return false;
    }

    const matchesSearch = true; // No search term filtering for now

    const matchesCourse = outline.course === selectedCourseForSearch;
    const matchesInstructor = outline.instructor === selectedInstructor;
    const matchesGrade = !selectedGrade || outline.grade === selectedGrade;
    const matchesYear = !selectedYear || outline.year === selectedYear;

    // Filter by Outline/Attack type based on page count
    const isAttack = outline.pages <= 25;
    const isOutline = outline.pages > 25;
    const matchesType =
      (isAttack && showAttacks) || (isOutline && showOutlines);

    return (
      matchesSearch &&
      matchesCourse &&
      matchesInstructor &&
      matchesGrade &&
      matchesYear &&
      matchesType
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


  const handleSaveOutline = (outline: Outline) => {
    setSavedOutlines((prev) => {
      // Check if outline is already saved
      if (prev.some((saved) => saved.id === outline.id)) {
        return prev; // Don't add duplicates
      }
      return [...prev, outline];
    });
  };

  const handleRemoveSavedOutline = (outlineId: string) => {
    setSavedOutlines((prev) =>
      prev.filter((outline) => outline.id !== outlineId)
    );
  };

  const handleToggleSaveOutline = (outline: Outline) => {
    setSavedOutlines((prev) => {
      const isAlreadySaved = prev.some((saved) => saved.id === outline.id);
      if (isAlreadySaved) {
        return prev.filter((saved) => saved.id !== outline.id);
      } else {
        return [...prev, outline];
      }
    });
  };

  const handleHideOutline = (outlineId: string) => {
    setHiddenOutlines((prev) => [...prev, outlineId]);
  };

  const handleUnhideAllOutlines = () => {
    setHiddenOutlines([]);
  };

  // Exam handlers (separate from outlines)
  const handleSaveExam = (exam: Outline) => {
    setSavedExams((prev) => {
      // Check if exam is already saved
      if (prev.some((saved) => saved.id === exam.id)) {
        return prev; // Don't add duplicates
      }
      return [...prev, exam];
    });
  };

  const handleRemoveSavedExam = (examId: string) => {
    setSavedExams((prev) =>
      prev.filter((exam) => exam.id !== examId)
    );
  };

  const handleToggleSaveExam = (exam: Outline) => {
    setSavedExams((prev) => {
      const isAlreadySaved = prev.some((saved) => saved.id === exam.id);
      if (isAlreadySaved) {
        return prev.filter((saved) => saved.id !== exam.id);
      } else {
        return [...prev, exam];
      }
    });
  };

  const handleHideExam = (examId: string) => {
    setHiddenExams((prev) => [...prev, examId]);
  };

  const handleUnhideAllExams = () => {
    setHiddenExams([]);
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
        // Refresh profile data to check classes_filled status
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('classes_filled')
            .eq('id', currentUser.id)
            .single();
          
          if (profile) {
            setHasCompletedOnboarding(profile.classes_filled === true);
          }
        }
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

      {/* Search Sidebar - Only show when in outlines section */}
      {activeSection === 'outlines' && (
        <SearchSidebar
          outlines={sortedOutlines}
          allOutlines={outlines}
          selectedCourse={selectedCourseForSearch}
          setSelectedCourse={setSelectedCourseForSearch}
          selectedInstructor={selectedInstructor}
          setSelectedInstructor={setSelectedInstructor}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showOutlines={showOutlines}
          setShowOutlines={setShowOutlines}
          showAttacks={showAttacks}
          setShowAttacks={setShowAttacks}
          selectedOutline={selectedOutline}
          onSelectOutline={setSelectedOutline}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          savedOutlines={savedOutlines}
          onRemoveSavedOutline={handleRemoveSavedOutline}
          onToggleSaveOutline={handleToggleSaveOutline}
          hiddenOutlines={hiddenOutlines}
          onHideOutline={handleHideOutline}
          onUnhideAllOutlines={handleUnhideAllOutlines}
          loading={outlinesLoading}
          previewFile={previewFile}
          setPreviewFile={setPreviewFile}
          previewLoading={previewLoading}
          setPreviewLoading={setPreviewLoading}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-40'}`} style={{ transition: 'margin-left 300ms ease-in-out' }}>
        {activeSection === 'outlines' ? (
          activeTab === 'upload' ? (
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <div className="text-center p-8">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-medium text-gray-700 mb-4">
                  Upload Your Outline
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Use the upload form in the sidebar to share your study
                  materials with the community.
                </p>
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Upload Guidelines:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2 text-left">
                    <li>• Accepted formats: PDF, DOC, DOCX</li>
                    <li>• Maximum file size: 50MB</li>
                    <li>• Only upload your original work</li>
                    <li>
                      • Include accurate course and instructor information
                    </li>
                    <li>• Use descriptive titles for better discoverability</li>
                  </ul>
                </div>
              </div>
            </div>
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
                <DOCXViewer
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
              outline={selectedOutline}
              onSaveOutline={handleSaveOutline}
              isSaved={
                selectedOutline
                  ? savedOutlines.some(
                      (saved) => saved.id === selectedOutline.id
                    )
                  : false
              }
            />
          )
        ) : activeSection === 'exams' ? (
          <ExamsPage
            allOutlines={outlines}
            savedOutlines={savedExams}
            hiddenOutlines={hiddenExams}
            onSaveOutline={handleSaveExam}
            onRemoveSavedOutline={handleRemoveSavedExam}
            onToggleSaveOutline={handleToggleSaveExam}
            onHideOutline={handleHideExam}
            onUnhideAllOutlines={handleUnhideAllExams}
          />
        ) : activeSection === 'reviews' ? (
          <ReviewsPage />
        ) : activeSection === 'home' ? (
        <HomePage
          onNavigateToCourse={handleNavigateToCourse}
          user={user}
        />
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
