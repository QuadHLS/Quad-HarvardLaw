import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Download,
  FileText,
  Star,
  MoreHorizontal,
  Flag,
  X,
  Tag,
  Trash2,
  Bookmark,
  EyeIcon,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Textarea } from "./ui/textarea";
import type { Outline } from "../types";

interface SearchSidebarProps {
  outlines: Outline[];
  allOutlines: Outline[];
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  selectedInstructor: string;
  setSelectedInstructor: (instructor: string) => void;
  selectedGrade: string | undefined;
  setSelectedGrade: (grade: string | undefined) => void;
  selectedYear: string | undefined;
  setSelectedYear: (year: string | undefined) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  showOutlines: boolean;
  setShowOutlines: (show: boolean) => void;
  showAttacks: boolean;
  setShowAttacks: (show: boolean) => void;
  activeTab: "search" | "saved" | "upload";
  setActiveTab: (tab: "search" | "saved" | "upload") => void;
  savedOutlines: Outline[];
  onRemoveSavedOutline: (outlineId: string) => void;
  onToggleSaveOutline: (outline: Outline) => void;
  loading?: boolean;
  previewFile: {
    url: string;
    name: string;
    type: string;
  } | null;
  setPreviewFile: (file: {
    url: string;
    name: string;
    type: string;
  } | null) => void;
  setPreviewLoading: (loading: boolean) => void;
  uploadFormHasPreview: boolean;
  setUploadFormHasPreview: (hasPreview: boolean) => void;
  bucketName?: string; // Add bucket name parameter
  tableName?: string; // Add table name parameter
  documentType?: 'outline' | 'exam'; // Add document type parameter
}

// Helper function to format outline display name
const formatOutlineDisplayName = (course: string, instructor: string, year: string, grade: string): string => {
  // Get first letter of course name
  const courseInitial = course.charAt(0).toUpperCase();
  
  // Get instructor initials (first letter of each word)
  const instructorInitials = instructor
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('');
  
  // Get last 2 digits of year
  const lastTwoDigits = year.slice(-2);
  
  // Generate random 3-digit number
  const randomNumber = Math.floor(Math.random() * 900) + 100; // 100-999
  
  // Format as continuous text: CourseInitial + InstructorInitials + Last2Digits + Grade + Random3Digits
  return `${courseInitial}${instructorInitials}${lastTwoDigits}${grade}${randomNumber}`;
};

export function SearchSidebar({
  outlines,
  allOutlines,
  selectedCourse,
  setSelectedCourse,
  selectedInstructor,
  setSelectedInstructor,
  selectedGrade,
  setSelectedGrade,
  selectedYear,
  setSelectedYear,
  sortBy,
  setSortBy,
  showOutlines,
  setShowOutlines,
  showAttacks,
  setShowAttacks,
  activeTab,
  setActiveTab,
  savedOutlines,
  onRemoveSavedOutline,
  onToggleSaveOutline,
  loading = false,
  previewFile,
  setPreviewFile,
  setPreviewLoading,
  uploadFormHasPreview,
  setUploadFormHasPreview,
  bucketName = 'Outlines', // Default to 'Outlines' for backward compatibility
  tableName = 'outlines', // Default to 'outlines' for backward compatibility
  documentType = 'outline', // Default to 'outline' for backward compatibility
}: SearchSidebarProps) {
  const [reviewingOutline, setReviewingOutline] =
    useState<Outline | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reportingOutline, setReportingOutline] =
    useState<Outline | null>(null);
  const [reportText, setReportText] = useState("");
  const [savedCourseFilter, setSavedCourseFilter] =
    useState<string>("");
  const [showNothingSavedMessage, setShowNothingSavedMessage] = useState(false);
  
  // Upload form state
  const [uploadCourse, setUploadCourse] = useState<string>("");
  const [uploadInstructor, setUploadInstructor] = useState<string>("");
  const [uploadGrade, setUploadGrade] = useState<string>("");
  const [uploadYear] = useState<string>(new Date().getFullYear().toString()); // Auto-set to current year
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadConfirmed, setUploadConfirmed] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string>("");
  
  // Course search state
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);
  
  // Click outside handler for course dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Page count functionality disabled - using data directly from Supabase

  // Determine document type based on bucketName or explicit prop
  const isExam = documentType === 'exam' || bucketName === 'Exams';
  const documentTypeText = isExam ? 'exam' : 'outline';
  const documentTypeTextCapitalized = isExam ? 'Exam' : 'Outline';
  const documentTypeTextPlural = isExam ? 'exams' : 'outlines';
  const documentTypeTextPluralCapitalized = isExam ? 'Exams' : 'Outlines';

  // Derive data from allOutlines for progressive filtering
  const availableCourses = allOutlines
    .map(outline => outline.course)
    .filter((course, index, self) => course && self.indexOf(course) === index)
    .sort();

  // Filter courses based on search term
  const filteredCourses = availableCourses.filter(course =>
    course.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  // Debug logging for exams course search issues
  if (isExam) {
    console.log('Exams SearchSidebar Debug:', {
      allExamsLength: allOutlines.length, // allOutlines is actually exams data in this context
      availableCoursesLength: availableCourses.length,
      loading: loading,
      availableCourses: availableCourses.slice(0, 5), // First 5 courses
      filteredCoursesLength: filteredCourses.length
    });
  }

  // Update course search term when course is selected
  useEffect(() => {
    if (selectedCourse && !courseSearchTerm) {
      setCourseSearchTerm(selectedCourse);
    }
  }, [selectedCourse, courseSearchTerm]);


  const availableInstructors = allOutlines
    .filter(outline => !selectedCourse || outline.course === selectedCourse)
    .map(outline => outline.instructor)
    .filter((instructor, index, self) => instructor && self.indexOf(instructor) === index)
    .sort();

  const availableYears = allOutlines
    .filter(outline => 
      (!selectedCourse || outline.course === selectedCourse) &&
      (!selectedInstructor || outline.instructor === selectedInstructor)
    )
    .map(outline => outline.year)
    .filter((year, index, self) => year && self.indexOf(year) === index)
    .sort((a, b) => b.localeCompare(a)); // Most recent first

  const availableGrades = allOutlines
    .filter(outline => 
      (!selectedCourse || outline.course === selectedCourse) &&
      (!selectedInstructor || outline.instructor === selectedInstructor) &&
      (!selectedYear || outline.year === selectedYear)
    )
    .map(outline => outline.grade)
    .filter((grade, index, self) => grade && self.indexOf(grade) === index)
    .sort();

  // Upload form progressive filtering
  const uploadAvailableInstructors = allOutlines
    .filter(outline => !uploadCourse || outline.course === uploadCourse)
    .map(outline => outline.instructor)
    .filter((instructor, index, self) => instructor && self.indexOf(instructor) === index)
    .sort();

  // For upload, always show all available grades since user is uploading their own work
  const uploadAvailableGrades = ["DS", "H", "P"];




  const handleDownload = async (filePath: string, fileType: string) => {
    try {
      console.log('Starting download for:', filePath);
      
      // Get the file URL from Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        alert('Error downloading file. Please try again.');
        return;
      }

      if (data?.signedUrl) {
        // Create a temporary download link and trigger it
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = filePath.split('/').pop() || `outline.${fileType}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download initiated successfully');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const handlePreview = async (filePath: string, fileName: string, fileType: string) => {
    // Check if the same file is already being previewed
    if (previewFile && previewFile.name === fileName && previewFile.type === fileType) {
      console.log('File is already being previewed, skipping...');
      return;
    }

    try {
      console.log('Starting preview for:', filePath);
      setPreviewLoading(true);
      
      // Get the file URL from Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) {
        console.error('Error creating signed URL for preview:', error);
        alert('Error loading file for preview. Please try again.');
        setPreviewLoading(false);
        return;
      }

      if (data?.signedUrl) {
        setPreviewFile({
          url: data.signedUrl,
          name: fileName,
          type: fileType
        });
        setPreviewLoading(false);
        console.log('Preview initiated successfully');
      }
    } catch (error) {
      console.error('Error loading file for preview:', error);
      alert('Error loading file for preview. Please try again.');
      setPreviewLoading(false);
    }
  };

  const handleReview = (outline: Outline) => {
    setReviewingOutline(outline);
    setSelectedRating(0);
    setHoverRating(0);
  };

  const handleSubmitReview = () => {
    if (reviewingOutline && selectedRating > 0) {
      // In a real app, this would submit the rating to the backend
      console.log(
        `Submitted ${selectedRating} star rating for outline: ${reviewingOutline.title}`,
      );
      setReviewingOutline(null);
      setSelectedRating(0);
      setHoverRating(0);
    }
  };

  const handleCancelReview = () => {
    setReviewingOutline(null);
    setSelectedRating(0);
    setHoverRating(0);
  };


  const handleReport = (outline: Outline) => {
    setReportingOutline(outline);
    setReportText("");
  };

  const handleSubmitReport = () => {
    if (reportingOutline && reportText.trim()) {
      // In a real app, this would submit the report to the backend
      console.log(
        `Submitted report for outline: ${reportingOutline.title}, Reason: ${reportText}`,
      );
      setReportingOutline(null);
      setReportText("");
    }
  };

  const handleCancelReport = () => {
    setReportingOutline(null);
    setReportText("");
  };

  // File upload handlers
  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.docx'];
    
    const isValidType = allowedTypes.includes(file.type);
    const isValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    return isValidType || isValidExtension;
  };

  const handleFileSelect = (file: File) => {
    setUploadError("");
    
    if (!validateFile(file)) {
      setUploadError("Please select a PDF or DOCX file only.");
      setUploadFormHasPreview(false);
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError("File size must be less than 10MB.");
      setUploadFormHasPreview(false);
      return;
    }
    
    setUploadFile(file);
    
    // Create preview URL for the file
    const previewUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(previewUrl);
    setUploadFormHasPreview(true);
    
    // Set the preview file for main content area
    setPreviewFile({
      url: previewUrl,
      name: file.name,
      type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx'
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Function to ensure folder structure exists in Supabase Storage
  const ensureFolderStructure = async (course: string, instructor: string, year: string, grade: string) => {
    try {
      // Check if the course folder exists
      const coursePath = `out/${course}/`;
      const { data: courseList } = await supabase.storage
        .from(bucketName)
        .list('out', { search: course });
      
      if (!courseList || courseList.length === 0) {
        // Create course folder by uploading an empty file (placeholder)
        await supabase.storage
          .from(bucketName)
          .upload(`${coursePath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }

      // Check if the instructor folder exists
      const instructorPath = `out/${course}/${instructor}/`;
      const { data: instructorList } = await supabase.storage
        .from(bucketName)
        .list(`out/${course}`, { search: instructor });
      
      if (!instructorList || instructorList.length === 0) {
        // Create instructor folder
        await supabase.storage
          .from(bucketName)
          .upload(`${instructorPath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }

      // Check if the year folder exists
      const yearPath = `out/${course}/${instructor}/${year}/`;
      const { data: yearList } = await supabase.storage
        .from(bucketName)
        .list(`out/${course}/${instructor}`, { search: year });
      
      if (!yearList || yearList.length === 0) {
        // Create year folder
        await supabase.storage
          .from(bucketName)
          .upload(`${yearPath}.gitkeep`, new Blob([''], { type: 'text/plain' }));
      }

      // Check if the grade folder exists
      const gradePath = `out/${course}/${instructor}/${year}/${grade}/`;
      const { data: gradeList } = await supabase.storage
        .from(bucketName)
        .list(`out/${course}/${instructor}/${year}`, { search: grade });
      
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

  const handleUpload = async () => {
    if (!uploadFile || !uploadCourse || !uploadInstructor || !uploadGrade) {
      setUploadError("Please fill in all required fields and select a file.");
      return;
    }

    if (!uploadConfirmed) {
      setUploadError("Please confirm that you agree to the terms before uploading.");
      return;
    }

    try {
      setUploadError("");
      
      // Create a unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileExtension = uploadFile.name.split('.').pop();
      const baseFileName = uploadFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const uniqueFileName = `${baseFileName}_${timestamp}.${fileExtension}`;
      
      // Create the file path using the existing folder structure: out/Course/Instructor/Year/Grade/
      const filePath = `out/${uploadCourse}/${uploadInstructor}/${uploadYear}/${uploadGrade}/${uniqueFileName}`;
      
      // Ensure the folder structure exists by creating missing folders
      await ensureFolderStructure(uploadCourse, uploadInstructor, uploadYear, uploadGrade);
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, uploadFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError(`Upload failed: ${uploadError.message}`);
        return;
      }

      // Generate the formatted display name
      const formattedName = formatOutlineDisplayName(uploadCourse, uploadInstructor, uploadYear, uploadGrade);
      
      // Get file size and page count
      const fileSize = uploadFile.size;
      
      // Set page count to 1 to satisfy database constraint (pages > 0)
      // This will be updated later by the background page counting process
      const pageCount = 1;

      // Create new row in table
      const { data: insertData, error: insertError } = await supabase
        .from(tableName)
        .insert({
          title: formattedName,
          file_name: uploadFile.name, // Keep original filename for display
          course: uploadCourse,
          instructor: uploadInstructor,
          year: uploadYear,
          grade: uploadGrade,
          file_path: filePath, // This uses the unique filename for storage
          file_size: fileSize,
          file_type: fileExtension,
          pages: pageCount,
          rating: 0,
          rating_count: 0,
          download_count: 0,
          description: null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        setUploadError(`Database error: ${insertError.message}`);
        
        // Try to clean up the uploaded file if database insert failed
        await supabase.storage.from(bucketName).remove([filePath]);
        return;
      }

      // Success! Clear the form
      setUploadFile(null);
      setUploadPreviewUrl(null);
      setUploadFormHasPreview(false);
      setPreviewFile(null);
      setUploadCourse("");
      setUploadInstructor("");
      setUploadGrade("");
      setUploadConfirmed(false);
      setUploadError("");
      
      // Show success message in UI
      setUploadSuccess(`${documentTypeTextCapitalized} uploaded successfully! 🎉`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadSuccess("");
      }, 5000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError("An unexpected error occurred during upload.");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const renderInteractiveStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starIndex = i + 1;
      const isFilled =
        starIndex <= (hoverRating || selectedRating);

      return (
        <button
          key={i}
          className={`w-8 h-8 transition-colors ${
            isFilled
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 hover:text-yellow-400"
          }`}
          onMouseEnter={() => setHoverRating(starIndex)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setSelectedRating(starIndex)}
        >
          <Star className="w-full h-full" />
        </button>
      );
    });
  };


  if (loading) {
    return (
      <div className="w-80 bg-[#8B4A6B] text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-white/70">Loading {documentTypeTextPlural}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#8B4A6B] text-white flex flex-col">
      {/* Tab Navigation */}
      <div className="flex px-2 pt-2 pb-0 gap-1" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <button
          onClick={() => setActiveTab("search")}
          className={`px-3 py-1.5 text-center transition-colors rounded-t-lg text-sm ${
            activeTab === "search"
              ? "bg-[#752432] text-white font-medium shadow-sm"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-3 py-1.5 text-center transition-colors rounded-t-lg text-sm ${
            activeTab === "saved"
              ? "bg-[#752432] text-white font-medium shadow-sm"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          Saved
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-3 py-1.5 text-center transition-colors rounded-t-lg text-sm ${
            activeTab === "upload"
              ? "bg-[#752432] text-white font-medium shadow-sm"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          Upload
        </button>
      </div>

      {activeTab === "search" ? (
        <>
          {/* Search Tab Content */}
            {/* Course Filter */}
            <div className="p-3 space-y-3 bg-[rgba(117,36,50,1)]">
              <div className="relative" ref={courseDropdownRef}>
                {/* Course Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearchTerm}
                    onChange={(e) => {
                      setCourseSearchTerm(e.target.value);
                      setShowCourseDropdown(true);
                    }}
                    onFocus={() => setShowCourseDropdown(true)}
                    className="pl-10 pr-10 bg-black/20 border-white/30 text-white placeholder:text-white/70 h-10"
                    disabled={loading || availableCourses.length === 0}
                  />
                  <button
                    onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                    disabled={loading || availableCourses.length === 0}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCourseDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Course Dropdown */}
                {showCourseDropdown && filteredCourses.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                    {filteredCourses.map((course) => (
                      <button
                        key={course}
                        onClick={() => {
                          setSelectedCourse(course);
                          setCourseSearchTerm(course);
                          setShowCourseDropdown(false);
                          setSelectedInstructor("");
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-900 text-sm"
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                )}

                {/* Clear button */}
                {selectedCourse && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedCourse("");
                      setCourseSearchTerm("");
                      setSelectedInstructor("");
                      setShowCourseDropdown(false);
                    }}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Instructor Filter */}
              <div className="relative">
                <Select
                  key={`instructor-${selectedInstructor || "empty"}`}
                  value={selectedInstructor || undefined}
                  onValueChange={(value) => {
                    setSelectedInstructor(value);
                  }}
                  disabled={availableInstructors.length === 0 || !selectedCourse}
                >
                  <SelectTrigger className="bg-black/20 border-white/30 text-white placeholder:text-white/70 data-[placeholder]:text-white/70 [&>svg]:text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder={
                      !selectedCourse 
                        ? "Select course first" 
                        : "Select Instructor"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstructors.length > 0 ? availableInstructors.map((instructor) => (
                      <SelectItem key={instructor} value={instructor}>
                        {instructor}
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
                {selectedInstructor && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedInstructor("");
                    }}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>


              {/* Year Filter */}
              <div className="relative">
                <Select
                  key={`year-${selectedYear || "empty"}`}
                  value={selectedYear || undefined}
                  onValueChange={(value) =>
                    setSelectedYear(value)
                  }
                  disabled={availableYears.length === 0 || !selectedInstructor}
                >
                  <SelectTrigger className="bg-black/20 border-white/30 text-white placeholder:text-white/70 data-[placeholder]:text-white/70 [&>svg]:text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder={
                      !selectedInstructor 
                        ? "Select instructor first" 
                        : "Select Year"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.length > 0 ? availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
                {selectedYear && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedYear(undefined);
                    }}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grade Filter */}
              <div className="relative">
                <Select
                  key={`grade-${selectedGrade || "empty"}`}
                  value={selectedGrade || undefined}
                  onValueChange={(value) =>
                    setSelectedGrade(value)
                  }
                  disabled={availableGrades.length === 0 || !selectedYear}
                >
                  <SelectTrigger className="bg-black/20 border-white/30 text-white placeholder:text-white/70 data-[placeholder]:text-white/70 [&>svg]:text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder={
                      !selectedYear 
                        ? "Select year first" 
                        : "Select Grade"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGrades.length > 0 ? availableGrades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
                {selectedGrade && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedGrade(undefined);
                    }}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          {/* Sort By */}
          <div className="px-3 pb-3 bg-[rgba(117,36,50,1)] space-y-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white border-0 text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Highest Rated">
                  Highest Rated
                </SelectItem>
                <SelectItem value="Newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Tags */}
            <div className="flex gap-1.5 justify-center">
              <button
                onClick={() => {
                  setShowOutlines(!showOutlines);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  showOutlines
                    ? "bg-white text-[#8B4A6B] border border-white shadow-sm"
                    : "bg-transparent text-white border border-white/50 hover:border-white/70"
                }`}
              >
                <Tag className="w-3 h-3" />
                {documentTypeTextCapitalized} ({'>'}25 pages)
              </button>
              <button
                onClick={() => {
                  setShowAttacks(!showAttacks);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  showAttacks
                    ? "bg-white text-[#8B4A6B] border border-white shadow-sm"
                    : "bg-transparent text-white border border-white/50 hover:border-white/70"
                }`}
              >
                <Tag className="w-3 h-3" />
                Attack (≤25 pages)
              </button>
            </div>
          </div>

          {/* {documentTypeTextPluralCapitalized} List */}
          <div className="flex-1 text-black overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {(() => {
              // First filter by course and instructor
              const courseInstructorFiltered = outlines.filter((outline) => {
                // Require BOTH course AND instructor to be selected
                if (selectedCourse === "" || selectedInstructor === "") {
                  return false;
                }
                // If both are selected, filter by both
                return outline.course === selectedCourse && outline.instructor === selectedInstructor;
              });


              // Then filter by page count based on button selection
              const filteredOutlines = courseInstructorFiltered.filter((outline) => {
                // If both buttons are selected, show all
                if (showOutlines && showAttacks) {
                  return true;
                }
                // If only outline button is selected, show only outlines
                if (showOutlines && !showAttacks) {
                  return outline.pages > 25;
                }
                // If only attack button is selected, show only attacks
                if (!showOutlines && showAttacks) {
                  return outline.pages <= 25;
                }
                // If neither is selected, show nothing
                return false;
              });

              return filteredOutlines.length === 0;
            })() ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {selectedCourse === "" || selectedInstructor === ""
                    ? selectedCourse === "" && selectedInstructor === ""
                      ? "No Filters Selected"
                      : "Incomplete Selection"
                    : `No ${documentTypeTextPluralCapitalized} Found`}
                </h3>
                <p className="text-gray-500 text-sm">
                  {selectedCourse === "" || selectedInstructor === ""
                    ? selectedCourse === "" && selectedInstructor === ""
                      ? `Please select both a course and instructor above to view available ${documentTypeTextPlural}.`
                      : selectedCourse === ""
                        ? `Please select a course to complete your search criteria.`
                        : `Please select an instructor to complete your search criteria.`
                    : `No ${documentTypeTextPlural} match your current search criteria.`}
                </p>
              </div>
            ) : (
              (() => {
                // First filter by course and instructor
                const courseInstructorFiltered = outlines.filter((outline) => {
                  // Require BOTH course AND instructor to be selected
                  if (selectedCourse === "" || selectedInstructor === "") {
                    return false;
                  }
                  // If both are selected, filter by both
                  return outline.course === selectedCourse && outline.instructor === selectedInstructor;
                });

                // Then filter by page count based on button selection
                return courseInstructorFiltered.filter((outline) => {
                  // If both buttons are selected, show all
                  if (showOutlines && showAttacks) {
                    return true;
                  }
                  // If only outline button is selected, show only outlines
                  if (showOutlines && !showAttacks) {
                    return outline.pages > 25;
                  }
                  // If only attack button is selected, show only attacks
                  if (!showOutlines && showAttacks) {
                    return outline.pages <= 25;
                  }
                  // If neither is selected, show nothing
                  return false;
                });
              })()
                .map((outline) => {
                const isSaved = savedOutlines.some(
                  (saved) => saved.id === outline.id,
                );
                return (
                  <div
                    key={outline.id}
                    className={`p-3 border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                      previewFile && previewFile.name === outline.file_name && previewFile.type === outline.file_type
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                    onClick={() => handlePreview(outline.file_path, outline.file_name, outline.file_type)}
                  >
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatOutlineDisplayName(outline.course, outline.instructor, outline.year, outline.grade)}
                          </span>
                          <span className="text-gray-600">
                            {outline.year}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {outline.grade}
                          </span>
                        </div>
                        {/* Bookmark Tag */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSaveOutline(outline);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            isSaved
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <Bookmark
                            className={`w-3 h-3 ${isSaved ? "fill-current" : ""}`}
                          />
                          {isSaved ? "Saved" : "Save"}
                        </button>
                      </div>

                      {/* Page Count Based Tags */}
                      <div className="flex flex-wrap gap-2 mb-1">
                        {outline.pages <= 25 ? (
                          <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
                            Attack ({outline.pages} pages)
                          </span>
                        ) : (
                          <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
                            {documentTypeTextCapitalized} ({outline.pages} pages)
                          </span>
                        )}
                      </div>

                      {/* Reviews and Action Buttons - aligned horizontally */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {renderStars(outline.rating)}
                          <span className="text-xs text-gray-600 ml-1">
                            ({outline.rating_count})
                          </span>
                        </div>
                        <div className="flex gap-1 items-center relative">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(
                                  outline.file_path,
                                  outline.file_name,
                                  outline.file_type,
                                );
                              }}
                              className="p-1 h-8 w-8"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 text-left mt-[-2px] mr-[0px] mb-[5px] ml-[0px] p-[0px]">
                              Preview
                            </div>
                          </div>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(
                                  outline.file_path,
                                  outline.file_type,
                                );
                              }}
                              className="p-1 h-8 w-8"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 text-left mt-[-2px] mr-[0px] mb-[5px] ml-[0px] p-[0px]">
                              ({outline.file_type})
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 w-8"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleReview(outline)
                                }
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Review
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleReport(outline)
                                }
                              >
                                <Flag className="w-4 h-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : activeTab === "saved" ? (
        <>
          {/* Saved Tab Content */}
          {/* Course Filter for Saved Tab */}
          <div className="p-3 bg-[rgba(117,36,50,1)] border-b border-white">
            <div className="relative">
              <Select
                key={`saved-course-${savedCourseFilter || "empty"}`}
                value={savedCourseFilter || undefined}
                onValueChange={(value) => setSavedCourseFilter(value || "")}
                disabled={savedOutlines.length === 0}
                onOpenChange={(open) => {
                  if (open && savedOutlines.length === 0) {
                    setShowNothingSavedMessage(true);
                    setTimeout(() => setShowNothingSavedMessage(false), 2000);
                  }
                }}
              >
                <SelectTrigger 
                  className="bg-black/20 border-white/30 text-white placeholder:text-white/70 data-[placeholder]:text-white/70 [&>svg]:text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    if (savedOutlines.length === 0) {
                      e.preventDefault();
                      setShowNothingSavedMessage(true);
                      setTimeout(() => setShowNothingSavedMessage(false), 2000);
                    }
                  }}
                >
                  <SelectValue placeholder="Filter by Course" />
                </SelectTrigger>
                <SelectContent>
                  {/* Get unique courses from saved outlines and sort alphabetically */}
                  {Array.from(
                    new Set(
                      savedOutlines.map(
                        (outline) => outline.course,
                      ),
                    ),
                  )
                    .sort((a, b) => a.localeCompare(b))
                    .map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {savedCourseFilter && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSavedCourseFilter("");
                  }}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 text-black overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {savedOutlines.filter(
              (outline) =>
                savedCourseFilter === "" ||
                outline.course === savedCourseFilter,
            ).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                {/* Nothing Saved Message */}
                {showNothingSavedMessage && (
                  <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg mb-6">
                    <p className="text-sm">Nothing saved yet!</p>
                  </div>
                )}
                
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {savedOutlines.length === 0
                    ? `No Saved ${documentTypeTextPluralCapitalized}`
                    : `No ${documentTypeTextPluralCapitalized} Found`}
                </h3>
                <p className="text-gray-500 text-sm">
                  {savedOutlines.length === 0
                    ? `Save ${documentTypeTextPlural} from the document viewer to see them here.`
                    : `No saved ${documentTypeTextPlural} match the selected course filter.`}
                </p>
              </div>
            ) : (
              (() => {
                // Group filtered outlines by course
                const filteredOutlines = savedOutlines.filter(
                  (outline) =>
                    savedCourseFilter === "" ||
                    outline.course === savedCourseFilter,
                );

                const groupedByCourse = filteredOutlines.reduce(
                  (groups, outline) => {
                    const course = outline.course;
                    if (!groups[course]) {
                      groups[course] = [];
                    }
                    groups[course].push(outline);
                    return groups;
                  },
                  {} as Record<string, Outline[]>,
                );

                // Sort courses alphabetically
                const sortedCourses = Object.keys(
                  groupedByCourse,
                ).sort((a, b) => a.localeCompare(b));

                return sortedCourses.map((course) => (
                  <div key={course}>
                    {/* Course Divider */}
                    <div className="bg-[rgba(117,36,50,1)] text-white px-3 py-1.5 font-medium text-sm rounded-[1px]">
                      {course}
                    </div>

                    {/* Outlines for this course */}
                    {groupedByCourse[course].map((outline) => (
                      <div
                        key={outline.id}
                        className={`p-3 border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                          previewFile && previewFile.name === outline.file_name && previewFile.type === outline.file_type
                            ? "bg-blue-50 border-blue-200"
                            : ""
                        }`}
                        onClick={() => handlePreview(outline.file_path, outline.file_name, outline.file_type)}
                      >
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatOutlineDisplayName(outline.course, outline.instructor, outline.year, outline.grade)}
                              </span>
                              <span className="text-gray-600">
                                {outline.year}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                {outline.grade}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSavedOutline(
                                  outline.id,
                                );
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Tags - positioned higher */}
                          <div className="flex flex-wrap gap-2 mb-1">
                            {outline.pages <= 25 ? (
                              <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
                                Attack ({outline.pages} pages)
                              </span>
                            ) : (
                              <span className="bg-green-700 text-white px-2 py-1 rounded text-xs">
                                {documentTypeTextCapitalized} ({outline.pages} pages)
                              </span>
                            )}
                          </div>

                          {/* Action Icons - aligned horizontally and higher */}
                          <div className="flex gap-1 items-center justify-end relative">
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreview(
                                    outline.file_path,
                                    outline.file_name,
                                    outline.file_type,
                                  );
                                }}
                                className="p-1 h-8 w-8"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 mt-0.5">
                                Preview
                              </div>
                            </div>
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(
                                    outline.file_path,
                                    outline.file_type,
                                  );
                                }}
                                className="p-1 h-8 w-8"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 mt-0.5">
                                ({outline.file_type})
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-8 w-8"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReview(outline)
                                  }
                                >
                                  <Star className="w-4 h-4 mr-2" />
                                  Review
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReport(outline)
                                  }
                                >
                                  <Flag className="w-4 h-4 mr-2" />
                                  Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()
            )}
          </div>
        </>
      ) : activeTab === "upload" ? (
        <>
          {/* Upload Tab Content */}
          <div className="flex-1 text-black flex" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {/* Upload Form */}
            <div className="flex-1 p-3">
              <div className="space-y-1">
                {/* File Upload Area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      {uploadFile ? (
                        <>
                          <h4 className="text-lg font-medium text-green-800 mb-1">
                            {uploadFile.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <Button 
                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-5 py-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (uploadPreviewUrl) {
                                URL.revokeObjectURL(uploadPreviewUrl);
                              }
                              setUploadFile(null);
                              setUploadPreviewUrl(null);
                              setUploadError("");
                              setUploadFormHasPreview(false);
                              setPreviewFile(null);
                            }}
                          >
                            Remove File
                          </Button>
                        </>
                      ) : (
                        <>
                          <h4 className="text-lg font-medium text-gray-800 mb-1">
                            Drop your files here
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            or click to browse your computer
                          </p>
                          <Button className="bg-[#752432] hover:bg-[#652030] text-white text-sm px-5 py-2">
                            Choose Files
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Maximum file size: 10MB • PDF and DOCX only
                    </p>
                    {uploadError && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {uploadError}
                      </p>
                    )}
                    {uploadSuccess && (
                      <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        {uploadSuccess}
                      </p>
                    )}
                  </div>
                </div>

                {/* Course Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Course *
                  </label>
                  <Select value={uploadCourse} onValueChange={(value) => {
                    setUploadCourse(value);
                    setUploadInstructor(""); // Reset instructor when course changes
                    setUploadGrade(""); // Reset grade when course changes
                  }}>
                    <SelectTrigger className="bg-white border-gray-300 h-8 mt-1">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Instructor Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Instructor *
                  </label>
                  <Select value={uploadInstructor} onValueChange={(value) => {
                    setUploadInstructor(value);
                    setUploadGrade(""); // Reset grade when instructor changes
                  }} disabled={!uploadCourse}>
                    <SelectTrigger className="bg-white border-gray-300 h-8 mt-1">
                      <SelectValue placeholder={uploadCourse ? "Select instructor" : "Select course first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadAvailableInstructors.map((instructor) => (
                        <SelectItem key={instructor} value={instructor}>
                          {instructor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">
                      Year *
                    </label>
                    <div className="bg-gray-100 border border-gray-300 rounded-md h-8 mt-1 flex items-center px-3 text-sm text-gray-600">
                      {uploadYear}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-selected</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700">
                      Grade Received *
                    </label>
                    <Select value={uploadGrade} onValueChange={setUploadGrade} disabled={!uploadInstructor}>
                      <SelectTrigger className="bg-white border-gray-300 h-8 mt-1">
                        <SelectValue placeholder={uploadInstructor ? "Select grade" : "Select instructor first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadAvailableGrades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade === "DS" ? "DS (Dean's Scholar)" : 
                             grade === "H" ? "H (High)" : 
                             grade === "P" ? "P (Pass)" : grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>


                {/* Terms Agreement */}
                <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={uploadConfirmed}
                    onChange={(e) => setUploadConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-[#752432] focus:ring-[#752432] border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-700">
                    I confirm that this is my original work and I have the right to share it. I agree to the{' '}
                    <a href="#" className="text-[#752432] hover:underline">Terms of Service</a> and{' '}
                    <a href="#" className="text-[#752432] hover:underline">Community Guidelines</a>.
                  </label>
                </div>

                {/* Upload Button */}
                <div className="pt-2 border-t">
                  <Button 
                    className="w-full bg-[#752432] hover:bg-[#652030] text-white py-2 text-sm"
                    disabled={!uploadFile || !uploadCourse || !uploadInstructor || !uploadGrade || !uploadConfirmed}
                    onClick={handleUpload}
                  >
                    Upload {documentTypeTextCapitalized}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {!uploadFile || !uploadCourse || !uploadInstructor || !uploadGrade 
                      ? "Please fill in all required fields and select a file to upload"
                      : !uploadConfirmed
                      ? "Please confirm the terms agreement to upload"
                      : "Ready to upload!"
                    }
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      ) : null}

      {/* Review Modal */}
      {reviewingOutline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-md w-full mx-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black">
                Rate this outline
              </h3>
              <button
                onClick={handleCancelReview}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                How would you rate "{reviewingOutline.title}"?
              </p>
              <p className="text-xs text-gray-500">
                {reviewingOutline.course} -{" "}
                {reviewingOutline.instructor}
              </p>
            </div>

            <div className="flex justify-center gap-1 mb-6">
              {renderInteractiveStars()}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancelReview}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={selectedRating === 0}
                className="flex-1 bg-[#8B4A6B] hover:bg-[#7A4160]"
              >
                Submit Rating
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingOutline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black">
                Report this outline
              </h3>
              <button
                onClick={handleCancelReport}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Please explain your reason for reporting "
                {reportingOutline.title}":
              </p>
              <p className="text-xs text-gray-500">
                {reportingOutline.course} -{" "}
                {reportingOutline.instructor}
              </p>
            </div>

            <div className="mb-4">
              <Textarea
                placeholder="Describe the issue or reason for reporting..."
                value={reportText}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length <= 300) {
                    setReportText(text);
                  }
                }}
                className="min-h-24 resize-none text-black"
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  Please provide specific details about the
                  issue
                </span>
                <span
                  className={`text-xs ${reportText.length >= 280 ? "text-red-500" : "text-gray-500"}`}
                >
                  {reportText.length}/300
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancelReport}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={!reportText.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}