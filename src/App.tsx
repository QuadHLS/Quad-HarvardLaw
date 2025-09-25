import { useState } from 'react';
import { FileText } from 'lucide-react';
import { NavigationSidebar } from './components/NavigationSidebar';
import { SearchSidebar } from './components/SearchSidebar';
import { OutlineViewer } from './components/OutlineViewer';
import { ExamsPage } from './components/ExamsPage';
import { ReviewsPage } from './components/ReviewsPage';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { Outline, Instructor } from './types';

// Clean outline data - no mock data, just empty arrays for UI playground
const outlineData: Outline[] = [];
const instructorData: Instructor[] = [];
const courseData: string[] = [];

// Main App Content Component
function AppContent({ loading }: { loading: boolean }) {
  
  // Outlines state - clean and simple
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  const [showOutlines, setShowOutlines] = useState(true);
  const [showAttacks, setShowAttacks] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'upload'>('search');
  const [savedOutlines, setSavedOutlines] = useState<Outline[]>([]);
  const [hiddenOutlines, setHiddenOutlines] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState('outlines');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sortBy, setSortBy] = useState('Highest Rated');

  // Exams state - separate from outlines
  const [selectedExam, setSelectedExam] = useState<Outline | null>(null);
  const [examSearchTerm, setExamSearchTerm] = useState('');
  const [selectedExamCourse, setSelectedExamCourse] = useState('');
  const [selectedExamInstructor, setSelectedExamInstructor] = useState('');
  const [selectedExamGrade, setSelectedExamGrade] = useState<string | undefined>(undefined);
  const [selectedExamYear, setSelectedExamYear] = useState<string | undefined>(undefined);
  const [showExamOutlines, setShowExamOutlines] = useState(true);
  const [showExamAttacks, setShowExamAttacks] = useState(true);
  const [examActiveTab, setExamActiveTab] = useState<'search' | 'saved' | 'upload'>('search');
  const [savedExams, setSavedExams] = useState<Outline[]>([]);
  const [hiddenExams, setHiddenExams] = useState<string[]>([]);

  // Filter outlines based on search criteria
  const filteredOutlines = outlineData.filter((outline) => {
    // Don't show any outlines unless BOTH a course AND instructor are selected
    if (selectedCourse === '' || selectedInstructor === '') {
      return false;
    }

    // Exclude hidden outlines
    if (hiddenOutlines.includes(outline.id)) {
      return false;
    }

    const matchesSearch =
      searchTerm === '' ||
      outline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outline.course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = outline.course === selectedCourse;
    const matchesInstructor = outline.instructor === selectedInstructor;
    const matchesGrade = !selectedGrade || outline.type === selectedGrade;
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

  // Filter exams based on search criteria (separate from outlines)
  const filteredExams = outlineData.filter((exam) => {
    // Don't show any exams unless BOTH a course AND instructor are selected
    if (selectedExamCourse === '' || selectedExamInstructor === '') {
      return false;
    }

    // Exclude hidden exams
    if (hiddenExams.includes(exam.id)) {
      return false;
    }

    const matchesSearch =
      examSearchTerm === '' ||
      exam.title.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      exam.course.toLowerCase().includes(examSearchTerm.toLowerCase());

    const matchesCourse = exam.course === selectedExamCourse;
    const matchesInstructor = exam.instructor === selectedExamInstructor;
    const matchesGrade = !selectedExamGrade || exam.type === selectedExamGrade;
    const matchesYear = !selectedExamYear || exam.year === selectedExamYear;

    // Filter by Outline/Attack type based on page count
    const isAttack = exam.pages <= 25;
    const isOutline = exam.pages > 25;
    const matchesType =
      (isAttack && showExamAttacks) || (isOutline && showExamOutlines);

    return (
      matchesSearch &&
      matchesCourse &&
      matchesInstructor &&
      matchesGrade &&
      matchesYear &&
      matchesType
    );
  });

  // Sort exams (separate from outlines)
  const sortedExams = [...filteredExams].sort((a, b) => {
    if (sortBy === 'Highest Rated') {
      return b.rating - a.rating;
    }
    if (sortBy === 'Newest') {
      return parseInt(b.year) - parseInt(a.year);
    }
    return a.title.localeCompare(b.title);
  });

  // Outline handlers
  const handleSaveOutline = (outline: Outline) => {
    setSavedOutlines((prev) => {
      if (prev.some((saved) => saved.id === outline.id)) {
        return prev;
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
      if (prev.some((saved) => saved.id === exam.id)) {
        return prev;
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

  // Simplified loading state for playground
  if (loading) {
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

  // Skip authentication for playground - go straight to outline UI
  // if (!user) {
  //   return <AuthPage />;
  // }

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
          allOutlines={outlineData}
          courses={courseData}
          instructors={instructorData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
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
            outlines={sortedExams}
            allOutlines={outlineData}
            courses={courseData}
            instructors={instructorData}
            savedOutlines={savedExams}
            hiddenOutlines={hiddenExams}
            onSaveOutline={handleSaveExam}
            onRemoveSavedOutline={handleRemoveSavedExam}
            onToggleSaveOutline={handleToggleSaveExam}
            onHideOutline={handleHideExam}
            onUnhideAllOutlines={handleUnhideAllExams}
            // Exam-specific state
            selectedExam={selectedExam}
            setSelectedExam={setSelectedExam}
            examSearchTerm={examSearchTerm}
            setExamSearchTerm={setExamSearchTerm}
            selectedExamCourse={selectedExamCourse}
            setSelectedExamCourse={setSelectedExamCourse}
            selectedExamInstructor={selectedExamInstructor}
            setSelectedExamInstructor={setSelectedExamInstructor}
            selectedExamGrade={selectedExamGrade}
            setSelectedExamGrade={setSelectedExamGrade}
            selectedExamYear={selectedExamYear}
            setSelectedExamYear={setSelectedExamYear}
            showExamOutlines={showExamOutlines}
            setShowExamOutlines={setShowExamOutlines}
            showExamAttacks={showExamAttacks}
            setShowExamAttacks={setShowExamAttacks}
            examActiveTab={examActiveTab}
            setExamActiveTab={setExamActiveTab}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        ) : activeSection === 'reviews' ? (
          <ReviewsPage />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-600">📄</span>
              </div>
              <h2 className="text-2xl font-medium text-gray-700 mb-4">
                Clean Frontend Playground
              </h2>
              <p className="text-gray-600 max-w-md">
                This is a clean frontend UI playground with no mock data or backend dependencies.
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
  const { loading } = useAuth();

  return <AppContent loading={loading} />;
}
