import { useState, useEffect, useRef } from 'react';
import { 
  Download,
  Bookmark,
  FileText,
  Grid,
  List,
  Calendar,
  User,
  BookOpen,
  Award,
  X,
  Upload,
  Clock,
  CloudUpload,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';
import type { Outline, Instructor } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { trackPreview, trackDownload, checkUserMonthlyLimit } from '../utils/activityTracker';

interface ExamPageProps {
  exams: Outline[];
  allExams: Outline[];
  courses: string[];
  instructors: Instructor[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  selectedInstructor: string;
  setSelectedInstructor: (instructor: string) => void;
  selectedGrade?: string;
  setSelectedGrade: (grade: string | undefined) => void;
  selectedYear?: string;
  setSelectedYear: (year: string | undefined) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[] | ((prev: string[]) => string[])) => void;
  myCourses: string[];
  selectedExam: Outline | null;
  onSelectExam: (exam: Outline) => void;
  activeTab: 'search' | 'saved' | 'upload';
  setActiveTab: (tab: 'search' | 'saved' | 'upload') => void;
  savedExams: Outline[];
  onRemoveSavedExam: (id: string) => void;
  onToggleSaveExam: (exam: Outline) => void;
  hiddenExams: string[];
  onHideExam: (id: string) => void;
  onUnhideAllExams: () => void;
}

export function ExamPage({
  exams,
  allExams,
  courses,
  instructors,
  searchTerm,
  setSearchTerm,
  selectedCourse,
  setSelectedCourse,
  selectedInstructor,
  setSelectedInstructor,
  selectedGrade,
  setSelectedGrade,
  selectedYear,
  setSelectedYear,
  selectedTags,
  setSelectedTags,
  myCourses: _myCourses,
  selectedExam,
  onSelectExam,
  activeTab,
  setActiveTab,
  savedExams,
  onRemoveSavedExam: _onRemoveSavedExam,
  onToggleSaveExam,
  hiddenExams: _hiddenExams,
  onHideExam: _onHideExam,
  onUnhideAllExams: _onUnhideAllExams
}: ExamPageProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [previewExam, setPreviewExam] = useState<Outline | null>(selectedExam);
  const [searchSearchTerm, setSearchSearchTerm] = useState('');
  const [savedCourseFilter, setSavedCourseFilter] = useState<string>('');
  // Separate filter states for saved tab
  const [savedGradeFilter, setSavedGradeFilter] = useState<string | undefined>(undefined);
  const [savedYearFilter, setSavedYearFilter] = useState<string | undefined>(undefined);
  const [savedTagsFilter, setSavedTagsFilter] = useState<string[]>(['Attack', 'Outline']);
  // Combobox states
  const [courseComboboxOpen, setCourseComboboxOpen] = useState(false);
  const [professorComboboxOpen, setProfessorComboboxOpen] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    course: '',
    professor: '',
    year: new Date().getFullYear().toString(),
    grade: '',
    termsAccepted: false
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Define bucket name for this component
  const bucketName = 'Exams';

  const displaySelectedCourse = selectedCourse || '';
  const displaySelectedInstructor = selectedInstructor || '';

  useEffect(() => {
    setPreviewExam(selectedExam);
  }, [selectedExam]);

  // Reset grade and year when course or professor changes
  useEffect(() => {
    if (selectedGrade && !availableGradesForSelection.includes(selectedGrade)) {
      setSelectedGrade(undefined);
    }
    if (selectedYear && !availableYearsForSelection.includes(selectedYear)) {
      setSelectedYear(undefined);
    }
  }, [selectedCourse, selectedInstructor, selectedGrade, selectedYear]);

  // Reset grade and year when saved course filter changes
  useEffect(() => {
    if (savedGradeFilter && !availableGradesForSaved.includes(savedGradeFilter)) {
      setSavedGradeFilter(undefined);
    }
    if (savedYearFilter && !availableYearsForSaved.includes(savedYearFilter)) {
      setSavedYearFilter(undefined);
    }
  }, [savedCourseFilter, savedGradeFilter, savedYearFilter]);

  // When the search results are empty (Discover state), clear the preview so the right panel shows the empty state
  useEffect(() => {
    if (activeTab === 'search' && exams.length === 0) {
      setPreviewExam(null);
    }
  }, [activeTab, exams]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'DS': return 'bg-green-50 border-green-200';
      case 'H': return 'bg-amber-50 border-amber-200';
      case 'P': return '';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case 'DS': return { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#00bc7c' };
      case 'H': return { backgroundColor: '#fffbeb', borderColor: '#fed7aa', color: '#fd9906' };
      case 'P': return { backgroundColor: '#f8fafc', borderColor: '#e8ecf2', color: '#63758e' };
      default: return {};
    }
  };

  const getGradeBorderClass = (grade: string) => {
    switch (grade) {
      case 'DS': return 'border-l-4';
      case 'H': return 'border-l-4';
      case 'P': return 'border-l-4';
      default: return 'border-l-4';
    }
  };

  const getGradeBorderColor = (grade: string) => {
    switch (grade) {
      case 'DS': return '#00bc7c';
      case 'H': return '#fd9906';
      case 'P': return '#63758e';
      default: return '#9ca3af';
    }
  };

  // Upload functions
  const getRandomFileName = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('file_names')
        .select('name')
        .order('random()')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching random file name:', error);
        return 'Default Title';
      }
      
      return data?.name || 'Default Title';
    } catch (error) {
      console.error('Error in getRandomFileName:', error);
      return 'Default Title';
    }
  };

  const ensureFolderStructure = async (course: string, instructor: string, year: string, grade: string) => {
    try {
      
      // Check if the Exam folder exists
      const examPath = 'Exam/';
      const { data: examList } = await supabase.storage
        .from(bucketName)
        .list('', { search: 'Exam' });
      
      if (!examList || examList.length === 0) {
        // Create Exam folder by uploading an empty file (placeholder)
        await supabase.storage
          .from(bucketName)
          .upload(`${examPath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }
      
      // Check if the course folder exists
      const coursePath = `Exam/${course}/`;
      const { data: courseList } = await supabase.storage
        .from(bucketName)
        .list('Exam', { search: course });
      
      if (!courseList || courseList.length === 0) {
        // Create course folder by uploading an empty file (placeholder)
        await supabase.storage
          .from(bucketName)
          .upload(`${coursePath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }

      // Check if the instructor folder exists
      const instructorPath = `Exam/${course}/${instructor}/`;
      const { data: instructorList } = await supabase.storage
        .from(bucketName)
        .list(`Exam/${course}`, { search: instructor });
      
      if (!instructorList || instructorList.length === 0) {
        // Create instructor folder
        await supabase.storage
          .from(bucketName)
          .upload(`${instructorPath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }

      // Check if the year folder exists
      const yearPath = `Exam/${course}/${instructor}/${year}/`;
      const { data: yearList } = await supabase.storage
        .from(bucketName)
        .list(`Exam/${course}/${instructor}`, { search: year });
      
      if (!yearList || yearList.length === 0) {
        // Create year folder
        await supabase.storage
          .from(bucketName)
          .upload(`${yearPath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }

      // Check if the grade folder exists
      const gradePath = `Exam/${course}/${instructor}/${year}/${grade}/`;
      const { data: gradeList } = await supabase.storage
        .from(bucketName)
        .list(`Exam/${course}/${instructor}/${year}`, { search: grade });
      
      if (!gradeList || gradeList.length === 0) {
        // Create grade folder
        await supabase.storage
          .from(bucketName)
          .upload(`${gradePath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }
    } catch (error) {
      console.error('Error ensuring folder structure:', error);
      // Don't throw error here, let the upload continue
      // The upload will create the folders if they don't exist
    }
  };

  const filteredInstructors = instructors.filter(instructor =>
    selectedCourse === '' || instructor.courses.includes(selectedCourse)
  );

  const availableYears = Array.from(
    new Set(allExams.map(exam => exam.year))
  ).sort((a, b) => parseInt(b) - parseInt(a));

  // Available years for selected course and professor
  const availableYearsForSelection = selectedCourse && selectedInstructor 
    ? Array.from(
        new Set(
          allExams
            .filter(exam => exam.course === selectedCourse && exam.instructor === selectedInstructor)
            .map(exam => exam.year)
        )
      ).sort((a, b) => parseInt(b) - parseInt(a))
    : selectedCourse
    ? Array.from(
        new Set(
          allExams
            .filter(exam => exam.course === selectedCourse)
            .map(exam => exam.year)
        )
      ).sort((a, b) => parseInt(b) - parseInt(a))
    : availableYears;

  // Available grades for selected course and professor
  const availableGradesForSelection = selectedCourse && selectedInstructor
    ? Array.from(
        new Set(
          allExams
            .filter(exam => exam.course === selectedCourse && exam.instructor === selectedInstructor)
            .map(exam => exam.grade)
        )
      ).sort((a, b) => {
        const gradeOrder: Record<string, number> = { 'DS': 0, 'H': 1, 'P': 2 };
        return (gradeOrder[a] || 3) - (gradeOrder[b] || 3);
      })
    : selectedCourse
    ? Array.from(
        new Set(
          allExams
            .filter(exam => exam.course === selectedCourse)
            .map(exam => exam.grade)
        )
      ).sort((a, b) => {
        const gradeOrder: Record<string, number> = { 'DS': 0, 'H': 1, 'P': 2 };
        return (gradeOrder[a] || 3) - (gradeOrder[b] || 3);
      })
    : ['DS', 'H', 'P'];

  const groupExamsByYear = (inputExams: Outline[]) => {
    const grouped = inputExams.reduce((acc, exam) => {
      if (!acc[exam.year]) {
        acc[exam.year] = [];
      }
      acc[exam.year].push(exam);
      return acc;
    }, {} as Record<string, Outline[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, examsForYear]) => ({ year, exams: examsForYear }));
  };

  const groupExamsByCourse = (inputExams: Outline[]) => {
    const grouped = inputExams.reduce((acc, exam) => {
      if (!acc[exam.course]) {
        acc[exam.course] = [];
      }
      acc[exam.course].push(exam);
      return acc;
    }, {} as Record<string, Outline[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([course, examsForCourse]) => ({ course, exams: examsForCourse }));
  };

  const handleTabChange = (tab: 'search' | 'saved' | 'upload') => {
    if (activeTab === 'search' && tab === 'saved') {
      setSearchSearchTerm(searchTerm);
      setSearchTerm('');
    } else if (activeTab === 'saved' && tab === 'search') {
      setSearchTerm(searchSearchTerm);
    }
    // Reset document viewer to galaxy view when switching tabs
    setPreviewExam(null);
    setActiveTab(tab);
  };

  const filteredSavedExams = savedExams.filter(exam => {
    if (!savedCourseFilter) return true;
    return exam.course === savedCourseFilter;
  });

  const savedCourses = Array.from(new Set(savedExams.map(exam => exam.course))).sort();

  // Available years for saved exams based on selected course
  const availableYearsForSaved = savedCourseFilter
    ? Array.from(
        new Set(
          savedExams
            .filter(exam => exam.course === savedCourseFilter)
            .map(exam => exam.year)
        )
      ).sort((a, b) => parseInt(b) - parseInt(a))
    : Array.from(
        new Set(savedExams.map(exam => exam.year))
      ).sort((a, b) => parseInt(b) - parseInt(a));

  // Available grades for saved exams based on selected course
  const availableGradesForSaved = savedCourseFilter
    ? Array.from(
        new Set(
          savedExams
            .filter(exam => exam.course === savedCourseFilter)
            .map(exam => exam.grade)
        )
      ).sort((a, b) => {
        const gradeOrder: Record<string, number> = { 'DS': 0, 'H': 1, 'P': 2 };
        return (gradeOrder[a] || 3) - (gradeOrder[b] || 3);
      })
    : Array.from(
        new Set(savedExams.map(exam => exam.grade))
      ).sort((a, b) => {
        const gradeOrder: Record<string, number> = { 'DS': 0, 'H': 1, 'P': 2 };
        return (gradeOrder[a] || 3) - (gradeOrder[b] || 3);
      });


  // Handle download
  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a PDF or DOCX file.');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 50MB.');
      return;
    }

    setUploadFile(file);
    setUploadError('');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.course || !uploadForm.professor || !uploadForm.grade) {
      setUploadError("Please fill in all required fields and select a file.");
      return;
    }

    if (!uploadForm.termsAccepted) {
      setUploadError("Please confirm that you agree to the terms before uploading.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      
      // Create a unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileExtension = uploadFile.name.split('.').pop();
      const baseFileName = uploadFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const uniqueFileName = `${baseFileName}_${timestamp}.${fileExtension}`;
      
      // Create the file path in the Exams bucket: Exam/Course/Instructor/Year/Grade/
      const filePath = `Exam/${uploadForm.course}/${uploadForm.professor}/${uploadForm.year}/${uploadForm.grade}/${uniqueFileName}`;
      
      // Ensure the folder structure exists by creating missing folders
      await ensureFolderStructure(uploadForm.course, uploadForm.professor, uploadForm.year, uploadForm.grade);
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, uploadFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Get random file name from database
      const formattedName = await getRandomFileName();
      
      // Get file size
      const fileSize = uploadFile.size;
      
      // Page count will be calculated separately (set to NULL for now)
      // Note: pages column constraint requires pages > 0, so we use NULL instead of 0
      const pageCount = null;

      // Create new row in exams table
      const { error: insertError } = await supabase
        .from('exams')
        .insert({
          title: formattedName,
          file_name: uploadFile.name, // Keep original filename for display
          course: uploadForm.course,
          instructor: uploadForm.professor,
          year: uploadForm.year,
          grade: uploadForm.grade,
          file_path: filePath, // This uses the unique filename for storage
          file_size: fileSize,
          file_type: fileExtension,
          pages: pageCount
        })
        .select();

      if (insertError) {
        console.error('Database insert error:', insertError);
        setUploadError(`Database error: ${insertError.message}`);
        
        // Try to clean up the uploaded file if database insert failed
        await supabase.storage.from(bucketName).remove([filePath]);
        return;
      }

      // Success! Clear the form
      setUploadFile(null);
      setUploadForm({
        course: '',
        professor: '',
        year: new Date().getFullYear().toString(),
        grade: '',
        termsAccepted: false
      });
      setUploadError("");
      
      // Show success message in UI
      setUploadSuccess(`Outline uploaded successfully! 🎉`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadSuccess("");
      }, 5000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (exam: Outline) => {
    if (!user) {
      toast.error('Please log in to download files');
      return;
    }

    // Check monthly usage limit before allowing download
    const limitCheck = await checkUserMonthlyLimit(user.id, exam.file_size || 0);
    if (!limitCheck.allowed) {
      toast.error(limitCheck.message || 'Monthly download limit exceeded');
      return;
    }

    try {
      // Try different file path formats
      const possiblePaths = [
        exam.file_path,
        exam.file_name,
        `Exam/${exam.file_path}`,
        `Exam/${exam.file_name}`,
        exam.file_path?.replace(/^out\//, ''), // Remove 'out/' prefix if present
        exam.file_path?.replace(/^exams\//, ''), // Remove 'exams/' prefix if present
        exam.file_name?.replace(/^out\//, ''), // Remove 'out/' prefix from file_name
        exam.file_name?.replace(/^exams\//, '') // Remove 'exams/' prefix from file_name
      ].filter((f): f is string => Boolean(f));

      for (const path of possiblePaths) {
        try {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(path, 3600); // 1 hour expiry

          if (!error && data?.signedUrl) {
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = `${exam.title}.${exam.file_type?.toLowerCase() || 'pdf'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log(`Successfully downloaded file from path: ${path}`);
            
            // Track download activity
            if (user) {
              await trackDownload(
                user,
                'exam',
                exam.id,
                exam.title,
                exam.file_type || 'pdf',
                exam.file_size
              );
            }
            
            return;
          }
        } catch (pathError) {
          console.log(`Failed to download from path: ${path}`, pathError);
          continue;
        }
      }

      console.error('All download path attempts failed for exam:', exam.title);
    } catch (error) {
      console.error('Error downloading exam:', error);
    }
  };


  const clearSearchFilters = () => {
    setSelectedCourse('');
    setSelectedInstructor('');
    setSelectedGrade(undefined);
    setSelectedYear(undefined);
    setSelectedTags(['Attack', 'Outline']); // Reset to default state (both tags selected)
  };

  const clearSavedFilters = () => {
    setSavedCourseFilter('');
    setSavedGradeFilter(undefined);
    setSavedYearFilter(undefined);
    setSavedTagsFilter(['Attack', 'Outline']); // Reset to default state (both tags selected)
  };

  const activeSearchFilterCount = [
    selectedCourse && selectedCourse !== '' ? 1 : 0,
    selectedInstructor && selectedInstructor !== '' ? 1 : 0,
    selectedGrade && selectedGrade !== '' ? 1 : 0,
    selectedYear && selectedYear !== '' ? 1 : 0,
    selectedTags.length !== 2 ? 1 : 0 // Only count if not both Attack and Outline selected (default state)
  ].reduce((sum, count) => sum + count, 0);

  const activeSavedFilterCount = [
    savedCourseFilter && savedCourseFilter !== '' ? 1 : 0,
    savedGradeFilter && savedGradeFilter !== '' ? 1 : 0,
    savedYearFilter && savedYearFilter !== '' ? 1 : 0,
    savedTagsFilter.length !== 2 ? 1 : 0 // Only count if not both Attack and Outline selected (default state)
  ].reduce((sum, count) => sum + count, 0);

  const ExamListItem = ({ exam, activeTab }: { exam: Outline, activeTab?: string }) => (
    <div 
      className={`group cursor-pointer transition-all duration-200 hover:bg-[#F5F1E8] border-l-4 ${
        previewExam?.id === exam.id ? 'bg-[#F5F1E8] shadow-sm' : 'bg-[#FFFBF8]'
      }`}
      style={{ 
        borderLeftColor: getGradeBorderColor(exam.grade),
        backgroundColor: previewExam?.id === exam.id ? '#F5F1E8' : '#FFFBF8'
      }}
      onClick={() => {
        onSelectExam(exam);
        setPreviewExam(exam);
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">
              {exam.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Badge 
                className={`${getGradeColor(exam.grade)} border font-medium px-1.5 py-0.5 text-xs`}
                style={getGradeBadgeStyle(exam.grade)}
              >
                {exam.grade}
              </Badge>
              <User className="w-3 h-3" />
              <span>{activeTab === 'saved' ? exam.instructor : exam.instructor.split(' ').pop()}</span>
              {activeTab === 'saved' && (
                <>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  <span>{exam.year}</span>
                </>
              )}
              <span>•</span>
              <FileText className="w-3 h-3" />
              <span>{exam.file_type?.toUpperCase?.() === 'DOCX' ? 'DOC' : exam.file_type?.toUpperCase?.() || exam.file_type}</span>
              
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-[14px] w-[14px] p-0 transition-all border-[#752432] text-[#752432] hover:bg-[#752432] hover:text-white hover:shadow-sm active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaveExam(exam);
            }}
          >
            <Bookmark 
              className="h-[8px] w-[8px]" 
              fill={savedExams.some(saved => saved.id === exam.id) ? "currentColor" : "none"}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-[14px] w-[14px] p-0 transition-all border-[#752432] text-[#752432] hover:bg-[#752432] hover:text-white hover:shadow-sm active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(exam);
            }}
          >
            <Download className="h-[8px] w-[8px]" />
          </Button>
        </div>
      </div>
    </div>
  );

  const ExamCard = ({ exam, activeTab }: { exam: Outline, activeTab?: string }) => (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${getGradeBorderClass(exam.grade)} overflow-hidden ${
        previewExam?.id === exam.id ? 'ring-2 ring-[#752432] shadow-xl transform -translate-y-1' : ''
      }`}
      style={{ 
        backgroundColor: previewExam?.id === exam.id ? '#F5F1E8' : '#FFFBF8',
        borderLeftColor: getGradeBorderColor(exam.grade)
      }}
      onClick={() => {
        onSelectExam(exam);
        setPreviewExam(exam);
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {exam.title}
              </h3>
              
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{activeTab === 'saved' ? exam.instructor : exam.instructor.split(' ').pop()}</span>
              {activeTab === 'saved' && (
                <>
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>{exam.year}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <Badge 
            className={`${getGradeColor(exam.grade)} border font-medium px-2 py-0.5 text-xs`}
            style={getGradeBadgeStyle(exam.grade)}
          >
            {exam.grade}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span>{exam.file_type?.toUpperCase?.() === 'DOCX' ? 'DOC' : exam.file_type?.toUpperCase?.() || exam.file_type}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 transition-all border-[#752432] text-[#752432] hover:bg-[#752432] hover:text-white hover:shadow-sm active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSaveExam(exam);
              }}
            >
              <Bookmark 
                className="h-3 w-3" 
                fill={savedExams.some(saved => saved.id === exam.id) ? "currentColor" : "none"}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 transition-all border-[#752432] text-[#752432] hover:bg-[#752432] hover:text-white hover:shadow-sm active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(exam);
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Document Viewer Component with PDF and Word support
  const DocumentViewer = ({ exam }: { exam: Outline }) => {
    const [limitError, setLimitError] = useState<string | null>(null);
    const [hasCheckedLimit, setHasCheckedLimit] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isVisibleRef = useRef(false);

    // Check monthly usage limit before allowing preview
    useEffect(() => {
      const checkLimit = async () => {
        if (!user || hasCheckedLimit) return;

        try {
          const limitCheck = await checkUserMonthlyLimit(user.id, exam.file_size || 0);
          if (!limitCheck.allowed) {
            setLimitError(limitCheck.message || 'Monthly preview limit exceeded');
          } else {
            // Track preview activity when limit check passes
            await trackPreview(
              user,
              'exam',
              exam.id,
              exam.title,
              exam.file_type || 'pdf',
              exam.file_size
            );
          }
        } catch (err) {
          console.error('Error checking limit:', err);
        } finally {
          setHasCheckedLimit(true);
        }
      };

      checkLimit();
    }, [exam.id, user, exam.file_size, exam.title, exam.file_type]);

    // IntersectionObserver: only load when visible (prevents too many iframes at once)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const checkVisibility = () => {
        const rect = container.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight + 200 && rect.bottom > -200;
        if (isInView) {
          isVisibleRef.current = true;
        }
      };

      checkVisibility();

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            isVisibleRef.current = true;
          }
        },
        { rootMargin: '200px' }
      );

      observer.observe(container);
      return () => observer.disconnect();
    }, [exam.id]);

    // Early return for limit errors
    if (limitError) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Preview Unavailable</h3>
            <p className="text-gray-300 mb-6">{limitError}</p>
          </div>
        </div>
      );
    }

    // Get signed URL for PDFs (direct browser support), use proxy for DOCX
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [urlLoading, setUrlLoading] = useState(true);

    useEffect(() => {
      const getUrl = async () => {
        if (!isVisibleRef.current) return;
        
        setUrlLoading(true);
        const fileType = exam.file_type?.toLowerCase() || 'pdf';
        
        // For PDFs, use signed URLs directly (no proxy needed)
        if (fileType === 'pdf') {
          const possiblePaths = [
            exam.file_path,
            exam.file_name,
            `Exam/${exam.file_path}`,
            `Exam/${exam.file_name}`,
            exam.file_path?.replace(/^out\//, ''),
            exam.file_path?.replace(/^exams\//, ''),
            exam.file_name?.replace(/^out\//, ''),
            exam.file_name?.replace(/^exams\//, '')
          ].filter((f): f is string => Boolean(f));

          for (const path of possiblePaths) {
            try {
              const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(path, 3600);

              if (!error && data?.signedUrl) {
                setDocumentUrl(data.signedUrl);
                setUrlLoading(false);
                return;
              }
            } catch (err) {
              continue;
            }
          }
          setUrlLoading(false);
        } else {
          // For DOCX, get signed URL and use Office Online Viewer
          const possiblePaths = [
            exam.file_path,
            exam.file_name,
            `Exam/${exam.file_path}`,
            `Exam/${exam.file_name}`,
            exam.file_path?.replace(/^out\//, ''),
            exam.file_path?.replace(/^exams\//, ''),
            exam.file_name?.replace(/^out\//, ''),
            exam.file_name?.replace(/^exams\//, '')
          ].filter((f): f is string => Boolean(f));

          for (const path of possiblePaths) {
            try {
              const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(path, 3600);

              if (!error && data?.signedUrl) {
                // Use Office Online Viewer with the signed URL
                const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(data.signedUrl)}`;
                setDocumentUrl(officeViewerUrl);
                setUrlLoading(false);
                return;
              }
            } catch (err) {
              continue;
            }
          }
          setUrlLoading(false);
        }
      };

      getUrl();
    }, [exam.id, exam.file_path, exam.file_name, exam.file_type, bucketName]);

    const fileType = exam.file_type?.toLowerCase() || 'pdf';

    // Only show preview for supported file types
    if (fileType === 'pdf' || fileType === 'docx' || fileType === 'doc') {
      const documentType = fileType === 'pdf' ? 'PDF' : 'Word';
      const iconColor = fileType === 'pdf' ? 'bg-red-500' : 'bg-blue-500';
      
      return (
        <div className="h-full flex flex-col" ref={containerRef}>
          {urlLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white">Loading document...</p>
              </div>
            </div>
          ) : documentUrl ? (
            // For both PDF and DOCX, use signed URLs (DOCX goes through Office Viewer)
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-600 bg-gray-800">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${iconColor} rounded flex items-center justify-center`}>
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{exam.title}</h3>
                    <p className="text-gray-400 text-xs">{documentType} Document</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDownload(exam)}
                  size="sm"
                  className="bg-[#752432] hover:bg-[#5a1a26] text-white h-7 px-3 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
              <iframe
                src={documentUrl}
                className="w-full flex-1 border-0"
                title={`${documentType} Preview: ${exam.title}`}
              />
            </div>
          ) : (
            // Error state - couldn't load document
            <div className="h-full flex items-center justify-center bg-gray-800">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Preview Unavailable</h3>
                <p className="text-gray-300 mb-6">Unable to load document. Please try downloading.</p>
                <Button
                  onClick={() => handleDownload(exam)}
                  className="bg-[#752432] hover:bg-[#5a1a26] text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Unsupported file type
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Preview Not Supported</h3>
            <p className="text-gray-300 mb-6">This file type cannot be previewed in the browser</p>
            <Button
              onClick={() => handleDownload(exam)}
              className="bg-[#752432] hover:bg-[#5a1a26] text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      );
    }
  };

  const FilePreview = () => (
    <div className="h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      <div className="absolute inset-0">
        {Array.from({ length: 100 }).map((_, i) => {
          const size = Math.random() * 3 + 1;
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const delay = Math.random() * 3;
          return (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          );
        })}
      </div>
      
      {previewExam ? (
        <div className="h-full relative z-10">
          <DocumentViewer exam={previewExam} />
        </div>
      ) : (
        <div className="h-full flex items-center justify-center relative z-10">
          <div className="text-center p-8 max-w-lg">
            <div className="relative mb-8">
              <img 
                src="/Screenshot%202025-09-30%20at%203.59.32%E2%80%AFPM.png" 
                alt="Document Icon" 
                className="mx-auto object-contain drop-shadow-lg"
                style={{ 
                  width: '180px',
                  height: 'auto',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' 
                }}
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">
                Pull an Exam from the Void 🚀
              </h2>
              <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
                Select any exam from the library to preview its content before downloading.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#F8F4ED] w-full">
      <div className="" style={{ backgroundColor: '#752432' }}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-white">
                {activeTab === 'saved' 
                  ? 'Saved Exams'
                  : activeTab === 'upload'
                    ? 'Upload Exam'
                    : selectedCourse && selectedInstructor 
                      ? `${selectedCourse} • ${selectedInstructor.split(' ').pop()}`
                      : 'Exam Library'
                }
              </h1>
              {activeTab !== 'upload' && (
                <>
                  {activeTab === 'saved' && savedExams.length > 0 && (
                    <Badge variant="secondary" className="bg-white text-[#752432]">
                      {savedExams.length} found
                    </Badge>
                  )}
                  {activeTab === 'search' && selectedCourse && selectedInstructor && (
                    <Badge variant="secondary" className="bg-white text-[#752432]">
                      {exams.length} found
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'search' | 'saved' | 'upload')}>
              <TabsList className="bg-white/10 border-0 rounded-md shadow-sm">
                <TabsTrigger 
                  value="search" 
                  className={`rounded-sm text-white hover:bg-white/20 transition-all active:scale-95 data-[state=active]:bg-white data-[state=active]:text-[#752432] ${activeTab === 'search' ? 'bg-white text-[#752432]' : ''}`}
                >
                  Search
                </TabsTrigger>
                <TabsTrigger 
                  value="saved" 
                  className={`rounded-sm text-white hover:bg-white/20 transition-all active:scale-95 data-[state=active]:bg-white data-[state=active]:text-[#752432] ${activeTab === 'saved' ? 'bg-white text-[#752432]' : ''}`}
                >
                  Saved
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className={`rounded-sm text-white hover:bg-white/20 transition-all active:scale-95 data-[state=active]:bg-white data-[state=active]:text-[#752432] ${activeTab === 'upload' ? 'bg-white text-[#752432]' : ''}`}
                >
                  Upload
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Filters Row - Only show for Search and Saved tabs */}
        {activeTab !== 'upload' && (
          <div className="p-3 border-t-0">
            <div className="flex items-center gap-4 flex-wrap">
              {activeTab === 'search' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium flex items-center gap-1 text-white">
                      <BookOpen className="w-4 h-4" />
                      Course:
                    </label>
                    <Popover open={courseComboboxOpen} onOpenChange={setCourseComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={courseComboboxOpen}
                          className="justify-between bg-input-background border-border hover:bg-gray-100 transition-colors"
                          style={{ width: '160px', minWidth: '160px', maxWidth: '160px' }}
                        >
                          <span className="truncate text-left flex-1 overflow-hidden">
                            {displaySelectedCourse ? displaySelectedCourse : 'Select Course'}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <Command>
                          <CommandInput placeholder="Search courses..." />
                          <CommandList>
                            <CommandEmpty>No course found.</CommandEmpty>
                            <CommandGroup>
                              {courses.map((course) => (
                                <CommandItem
                                  key={course}
                                  value={course}
                                  onSelect={() => {
                                    setSelectedCourse(course);
                                    setSelectedInstructor('');
                                    setCourseComboboxOpen(false);
                                  }}
                                >
                                  {course}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium flex items-center gap-1 text-white">
                      <User className="w-4 h-4" />
                      Professor:
                    </label>
                    <Popover open={professorComboboxOpen} onOpenChange={setProfessorComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={professorComboboxOpen}
                          className="justify-between bg-input-background border-border hover:bg-gray-100 transition-colors"
                          style={{ width: '160px', minWidth: '160px', maxWidth: '160px' }}
                          disabled={!selectedCourse}
                        >
                          <span className="text-left flex-1 min-w-0">
                            {displaySelectedInstructor ? (
                              <span className="truncate block overflow-hidden">{displaySelectedInstructor}</span>
                            ) : (
                              'Select Professor'
                            )}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Search professors..." />
                          <CommandList>
                            <CommandEmpty>No professor found.</CommandEmpty>
                            <CommandGroup>
                              {filteredInstructors.map((instructor) => (
                                <CommandItem
                                  key={instructor.id}
                                  value={instructor.name}
                                  onSelect={() => {
                                    setSelectedInstructor(instructor.name);
                                    setProfessorComboboxOpen(false);
                                  }}
                                >
                                  {instructor.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium flex items-center gap-1 text-white">
                      <Award className="w-4 h-4" />
                      Grade:
                    </label>
                    <Select value={selectedGrade || 'all-grades'} onValueChange={(value) => setSelectedGrade(value === 'all-grades' ? undefined : value)}>
                      <SelectTrigger 
                        className="bg-input-background border-border hover:bg-gray-100 transition-colors px-2"
                        style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}
                      >
                        <SelectValue placeholder="All" className="truncate overflow-hidden text-sm" />
                      </SelectTrigger>
                      <SelectContent style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                        <SelectItem value="all-grades">All</SelectItem>
                        {availableGradesForSelection.map(grade => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium flex items-center gap-1 text-white">
                      <Calendar className="w-4 h-4" />
                      Year:
                    </label>
                    <div className="flex items-center gap-2">
                      <Select value={selectedYear || 'all-years'} onValueChange={(value) => setSelectedYear(value === 'all-years' ? undefined : value)}>
                        <SelectTrigger 
                          className="bg-input-background border-border hover:bg-gray-100 transition-colors px-2"
                          style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                        >
                          <SelectValue placeholder="All" className="truncate overflow-hidden text-sm" />
                        </SelectTrigger>
                        <SelectContent style={{ width: '72px', minWidth: '72px', maxWidth: '72px' }}>
                          <SelectItem value="all-years">All</SelectItem>
                          {availableYearsForSelection.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {activeSearchFilterCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSearchFilters}
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 h-7 px-2 py-0 flex items-center gap-1 transition-all active:scale-95"
                          title="Clear filters"
                        >
                          <X className="w-3 h-3" />
                          <span className="text-xs">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>

                </>
              )}

              {activeTab === 'saved' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium flex items-center gap-1 text-white">
                      <BookOpen className="w-4 h-4" />
                      Course:
                    </label>
                    <Select value={savedCourseFilter || 'all-courses'} onValueChange={(value) => setSavedCourseFilter(value === 'all-courses' ? '' : value)}>
                      <SelectTrigger 
                        className="bg-input-background border-border hover:bg-gray-100 transition-colors"
                        style={{ width: '160px', minWidth: '160px', maxWidth: '160px' }}
                      >
                        <SelectValue placeholder="All courses..." className="truncate overflow-hidden" />
                      </SelectTrigger>
                      <SelectContent className="w-80">
                        <SelectItem value="all-courses">All Courses</SelectItem>
                        {savedCourses.map(course => (
                          <SelectItem key={course} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium flex items-center gap-1 text-white">
                      <Award className="w-4 h-4" />
                      Grade:
                    </label>
                    <Select value={savedGradeFilter || 'all-grades'} onValueChange={(value) => setSavedGradeFilter(value === 'all-grades' ? undefined : value)}>
                      <SelectTrigger 
                        className="bg-input-background border-border hover:bg-gray-100 transition-colors px-2"
                        style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}
                      >
                        <SelectValue placeholder="All" className="truncate min-w-0 overflow-hidden text-sm" />
                      </SelectTrigger>
                      <SelectContent style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                        <SelectItem value="all-grades">All</SelectItem>
                        {availableGradesForSaved.map(grade => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium flex items-center gap-1 text-white">
                      <Calendar className="w-4 h-4" />
                      Year:
                    </label>
                    <div className="flex items-center gap-2">
                      <Select value={savedYearFilter || 'all-years'} onValueChange={(value) => setSavedYearFilter(value === 'all-years' ? undefined : value)}>
                        <SelectTrigger 
                          className="bg-input-background border-border hover:bg-gray-100 transition-colors px-2"
                          style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                        >
                          <SelectValue placeholder="All" className="truncate min-w-0 overflow-hidden text-sm" />
                        </SelectTrigger>
                        <SelectContent style={{ width: '72px', minWidth: '72px', maxWidth: '72px' }}>
                          <SelectItem value="all-years">All</SelectItem>
                          {availableYearsForSaved.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {activeSavedFilterCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSavedFilters}
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 h-7 px-2 py-0 flex items-center gap-1 transition-all active:scale-95"
                          title="Clear saved filters"
                        >
                          <X className="w-3 h-3" />
                          <span className="text-xs">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>

                </>
              )}

              <div className="flex-1"></div>

              {/* Right-side clear buttons removed; compact X placed next to Year */}

              {(activeTab === 'search' || activeTab === 'saved') && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-transform active:scale-95 ${
                      viewMode === 'list' 
                        ? 'bg-white text-[#752432] hover:bg-white/90' 
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-transform active:scale-95 ${
                      viewMode === 'grid' 
                        ? 'bg-white text-[#752432] hover:bg-white/90' 
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${activeTab === 'upload' ? 'flex-1' : 'w-[800px] shrink min-w-0'} overflow-auto bg-[#F8F4ED]`} style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#752531 transparent',
          maxWidth: activeTab === 'upload' ? 'none' : '800px'
        }}>
          {activeTab === 'search' && (
            <div className="h-full flex flex-col">
              {exams.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="relative mb-8">
                    <img
                      src="/Screenshot%202025-09-30%20at%201.46.44%E2%80%AFPM.png"
                      alt="Exams hero"
                      className="h-auto object-contain"
                      style={{ width: '160px' }}
                    />
                  </div>
                  
                  <div className="text-center max-w-md">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-3 -mt-2">
                      Discover Law Exams
                    </h3>
                    <p className="text-gray-600 mb-1 leading-relaxed">
                      Browse our comprehensive database of {allExams.length}+ law exams.
                    </p>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {!selectedCourse && !selectedInstructor ? (
                        <>Select a course and professor above to begin exploring.</>
                      ) : selectedCourse && !selectedInstructor ? (
                        <>Select a professor above to begin exploring.</>
                      ) : (
                        <>No exams found for the selected criteria.</>
                      )}
                    </p>
                    
                    <div className="flex justify-center gap-8 mb-8">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-[#752432]">{courses.length}</div>
                        <div className="text-sm text-gray-500">Courses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-[#752432]">{instructors.length}</div>
                        <div className="text-sm text-gray-500">Professors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-[#752432]">{allExams.length}</div>
                        <div className="text-sm text-gray-500">Exams</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <div className="space-y-8">
                      {groupExamsByYear(exams).map(({ year, exams: yearOutlines }) => {
                        const sortedYearOutlines = [...yearOutlines].sort((a, b) => {
                          const gradeOrder: Record<string, number> = { DS: 0, H: 1, P: 2 };
                          const aKey = (a.grade || '').trim().toUpperCase();
                          const bKey = (b.grade || '').trim().toUpperCase();
                          return (gradeOrder[aKey] ?? 3) - (gradeOrder[bKey] ?? 3);
                        });

                        return (
                          <div key={year}>
                            <div className="flex items-center gap-4 mb-6">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">{year}</h2>
                              </div>
                              <div className="flex-1 h-px bg-gray-200"></div>
                              <Badge variant="secondary" className="text-xs" style={{ backgroundColor: '#F8F4ED', color: '#752432' }}>
                                {yearOutlines.length} exam{yearOutlines.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            {viewMode === 'grid' ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
                                {sortedYearOutlines.map(exam => (
                                  <ExamCard key={exam.id} exam={exam} activeTab={activeTab} />
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1 border border-border rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: '#f9f5f0' }}>
                                {sortedYearOutlines.map(exam => (
                                  <ExamListItem key={exam.id} exam={exam} activeTab={activeTab} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="h-full flex flex-col">
              {savedExams.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="relative mb-8">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#752432]/10 to-[#752432]/20 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F8F4ED] to-[#F5F1E8] flex items:center justify:center">
                        <div className="relative">
                          <img
                            src="/Screenshot%202025-09-30%20at%207.55.26%E2%80%AFPM.png"
                            alt="Saved exams icon"
                            className="h-auto object-contain"
                            style={{ width: '160px' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-8 w-3 h-3 bg-[#752432]/30 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-8 left-6 w-2 h-2 bg-[#752432]/20 rounded-full animate-pulse delay-300"></div>
                    <div className="absolute top-12 left-4 w-1.5 h-1.5 bg-[#752432]/40 rounded-full animate-pulse delay-700"></div>
                  </div>
                  
                  <div className="text-center max-w-md">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                      Build Your Collection
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Save your favorite exams for quick access. Your saved exams will appear here for easy reference during study sessions.
                    </p>
                    
                    <div className="bg-[#F8F4ED] border-l-4 border-[#752432] p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#752432] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bookmark className="w-3 h-3 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-800 mb-1">How to Save Exams:</p>
                          <p className="text-xs text-gray-600">
                            Browse exams in the Search tab, then click the bookmark button on any exam to save it to this collection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <div className="space-y-8">
                      {groupExamsByCourse(filteredSavedExams).map(({ course, exams: courseExams }) => {
                        const sortedCourseExams = [...courseExams].sort((a, b) => {
                          const gradeOrder: Record<string, number> = { DS: 0, H: 1, P: 2 };
                          const aKey = (a.grade || '').trim().toUpperCase();
                          const bKey = (b.grade || '').trim().toUpperCase();
                          return (gradeOrder[aKey] ?? 3) - (gradeOrder[bKey] ?? 3);
                        });

                        return (
                          <div key={course}>
                            <div className="flex items-center gap-4 mb-6">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">{course}</h2>
                              </div>
                              <div className="flex-1 h-px bg-gray-200"></div>
                              <Badge variant="secondary" className="text-xs" style={{ backgroundColor: '#F8F4ED', color: '#752432' }}>
                                {courseExams.length} exam{courseExams.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            {viewMode === 'grid' ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
                                {sortedCourseExams.map(exam => (
                                  <ExamCard key={exam.id} exam={exam} activeTab={activeTab} />
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1 border border-border rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: '#f9f5f0' }}>
                                {sortedCourseExams.map(exam => (
                                  <ExamListItem key={exam.id} exam={exam} activeTab={activeTab} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="p-6 h-full flex flex-col">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#752432] flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Upload Exam</h2>
                <p className="text-sm text-gray-600">Share your study materials with the community</p>
              </div>

              <div className="flex-1 max-w-2xl mx-auto w-full">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors duration-200 cursor-pointer ${
                    dragActive 
                      ? 'border-[#752432] bg-[#752432]/5' 
                      : isHovering
                        ? 'border-gray-300 bg-[#f1eae6]'
                        : 'border-gray-300 bg-[#F8F4ED]'
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(true);
                    setIsHovering(false);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                    setIsHovering(false);
                    handleFileDrop(e);
                  }}
                  onMouseEnter={() => {
                    if (!dragActive) {
                      setIsHovering(true);
                    }
                  }}
                  onMouseLeave={() => {
                    setIsHovering(false);
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <CloudUpload className={`${dragActive ? 'text-[#752432]' : 'text-gray-400'} w-12 h-12 mb-3`} />
                    {uploadFile ? (
                      <div className="text-center">
                        <h3 className="text-base font-medium text-gray-700 mb-1">File Selected</h3>
                        <p className="text-sm text-gray-500 mb-1">{uploadFile.name}</p>
                        <p className="text-xs text-gray-400 mb-3">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:shadow-sm active:scale-95"
                          onClick={() => setUploadFile(null)}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-medium text-gray-700 mb-1">Drop your files here</h3>
                        <p className="text-sm text-gray-500 mb-2">or click to browse</p>
                        <p className="text-xs text-gray-400">Supports PDF and DOCX files only</p>
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-3 border-[#752432] text-[#752432] hover:bg-[#752432] hover:text-white transition-all hover:shadow-sm active:scale-95 cursor-pointer" 
                            asChild
                          >
                            <span>Browse Files</span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="course" className="text-sm font-medium text-gray-700 mb-1 block">
                        Course *
                      </Label>
                      <Select value={uploadForm.course} onValueChange={(value) => 
                        setUploadForm(prev => ({ ...prev, course: value }))
                      }>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map(course => (
                            <SelectItem key={course} value={course}>{course}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="professor" className="text-sm font-medium text-gray-700 mb-1 block">
                        Professor *
                      </Label>
                      <Select 
                        value={uploadForm.professor} 
                        onValueChange={(value) => 
                          setUploadForm(prev => ({ ...prev, professor: value }))
                        }
                        disabled={!uploadForm.course}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select professor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors
                            .filter(instructor => 
                              !uploadForm.course || instructor.courses.includes(uploadForm.course)
                            )
                            .map(instructor => (
                              <SelectItem key={instructor.id} value={instructor.name}>
                                {instructor.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="year" className="text-sm font-medium text-gray-700 mb-1 block">
                        Year *
                      </Label>
                      <Select value={uploadForm.year} onValueChange={(value) => 
                        setUploadForm(prev => ({ ...prev, year: value }))
                      }>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select year..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="grade" className="text-sm font-medium text-gray-700 mb-1 block">
                        Grade Received *
                      </Label>
                      <Select value={uploadForm.grade} onValueChange={(value) => 
                        setUploadForm(prev => ({ ...prev, grade: value }))
                      }>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select grade..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DS">Dean’s Scholar Prize (DS)</SelectItem>
                          <SelectItem value="H">Honors (H)</SelectItem>
                          <SelectItem value="P">Pass (P)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-2 bg-[#F8F4ED] rounded-lg border-l-4 border-[#752432]">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={uploadForm.termsAccepted}
                      onChange={(e) => 
                        setUploadForm(prev => ({ ...prev, termsAccepted: e.target.checked }))
                      }
                      className="mt-0.5 w-3.5 h-3.5 rounded border-2 border-gray-300 bg-white cursor-pointer accent-emerald-600"
                      style={{
                        accentColor: '#059669'
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="terms" className="text-[10px] font-medium text-gray-700 cursor-pointer">
                        I have read and agree to the Terms of Service *
                      </Label>
                      <p className="text-xs text-gray-600 mt-0.5">
                        By uploading, you confirm this content is original or you have permission to share it.
                      </p>
                    </div>
                  </div>

                  {/* Error and Success Messages */}
                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{uploadError}</p>
                    </div>
                  )}
                  
                  {uploadSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 text-sm">{uploadSuccess}</p>
                    </div>
                  )}

                  <div className="flex justify-center pt-1">
                    <Button 
                      size="default"
                      disabled={!uploadFile || !uploadForm.course || !uploadForm.professor || !uploadForm.year || !uploadForm.grade || !uploadForm.termsAccepted || uploading}
                      onClick={handleUpload}
                      className="bg-[#752432] hover:bg-[#5a1a26] text-white px-6 transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Upload Exam
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab !== 'upload' && (
          <div className="border-l border-border bg-black flex-1" style={{ minWidth: '450px', maxWidth: 'none', width: 'auto' }}>
            <FilePreview />
          </div>
        )}
      </div>
    </div>
  );
}


