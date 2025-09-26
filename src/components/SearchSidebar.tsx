import { useState } from "react";
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
  Dices,
  EyeIcon,
} from "lucide-react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
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
  const [uploadTitle, setUploadTitle] = useState("");
  const [showNothingSavedMessage, setShowNothingSavedMessage] = useState(false);
  // Page count functionality disabled - using data directly from Supabase

  // Derive data from allOutlines for progressive filtering
  const availableCourses = allOutlines
    .map(outline => outline.course)
    .filter((course, index, self) => course && self.indexOf(course) === index)
    .sort();

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


  // Arrays for random title generation
  const adjectives = [
    "Obese", "Round", "Peaceful", "Nice", "Rapid", "Swift", "Bold", "Bright",
    "Sharp", "Clever", "Wild", "Calm", "Dark", "Light", "Deep", "High",
    "Cold", "Warm", "Soft", "Hard", "Quick", "Slow", "Big", "Small",
    "Loud", "Quiet", "Strong", "Weak", "Full", "Empty", "Rich", "Poor",
    "New", "Old", "Fresh", "Stale", "Clear", "Cloudy", "Smooth", "Rough",
    "Sweet", "Sour", "Hot", "Cool", "Dry", "Wet", "Clean", "Dirty",
    "Happy", "Sad", "Lucky", "Wise", "Safe", "Free", "True", "False"
  ];

  const nouns = [
    "Nosy", "Garden", "Eagle", "Master", "Expert", "Guide", "Pro", "Study",
    "Legal", "Scholar", "Champion", "Hunter", "Tiger", "Lion", "Bear", "Wolf",
    "Fox", "Hawk", "Snake", "Dragon", "Phoenix", "Knight", "Warrior", "King",
    "Queen", "Prince", "Princess", "Chief", "Boss", "Leader", "Hero", "Star",
    "Moon", "Sun", "River", "Mountain", "Ocean", "Forest", "Desert", "Valley",
    "Bridge", "Tower", "Castle", "Palace", "Temple", "House", "Home", "Door",
    "Window", "Key", "Lock", "Book", "Pen", "Paper", "Crown", "Sword"
  ];

  const generateRandomTitle = () => {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const newTitle = randomAdjective + randomNoun;
    setUploadTitle(newTitle);
  };

  const handleDownload = async (filePath: string, fileType: string) => {
    try {
      console.log('Starting download for:', filePath);
      
      // Get the file URL from Supabase Storage
      const { data, error } = await supabase.storage
        .from('Outlines')
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
        .from('Outlines')
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
            <p className="text-white/70">Loading outlines...</p>
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
              <div className="relative">
                <Select
                  key={`course-${selectedCourse || "empty"}`}
                  value={selectedCourse || undefined}
                  onValueChange={(value) => {
                    setSelectedCourse(value);
                    // Clear instructor when changing course
                    setSelectedInstructor("");
                  }}
                  disabled={availableCourses.length === 0}
                >
                  <SelectTrigger className="bg-black/20 border-white/30 text-white placeholder:text-white/70 data-[placeholder]:text-white/70 [&>svg]:text-white h-10 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.length > 0 ? availableCourses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
                {selectedCourse && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedCourse("");
                      setSelectedInstructor("");
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
                Outline ({'>'}25 pages)
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

          {/* Outlines List */}
          <div className="flex-1 text-black overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {(() => {
              // First filter by course and instructor
              const courseInstructorFiltered = outlines.filter((outline) => {
                if (selectedCourse === "" || selectedInstructor === "") {
                  return false; // Don't show any if course/instructor not selected
                }
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
                    : "No Outlines Found"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {selectedCourse === "" || selectedInstructor === ""
                    ? selectedCourse === "" && selectedInstructor === ""
                      ? "Please select both a course and instructor above to view available outlines."
                      : selectedCourse === ""
                        ? "Please select a course to complete your search criteria."
                        : "Please select an instructor to complete your search criteria."
                    : "No outlines match your current search criteria."}
                </p>
              </div>
            ) : (
              (() => {
                // First filter by course and instructor
                const courseInstructorFiltered = outlines.filter((outline) => {
                  if (selectedCourse === "" || selectedInstructor === "") {
                    return false; // Don't show any if course/instructor not selected
                  }
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
                            Outline ({outline.pages} pages)
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
                    ? "No Saved Outlines"
                    : "No Outlines Found"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {savedOutlines.length === 0
                    ? "Save outlines from the document viewer to see them here."
                    : "No saved outlines match the selected course filter."}
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
                                Outline ({outline.pages} pages)
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
          <div className="flex-1 text-black flex flex-col" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {/* Upload Instructions */}
            <div className="p-6 text-center border-b bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Upload Your Outline
              </h3>
              <p className="text-sm text-gray-600">
                Share your study materials with the community. Accepted formats: PDF, DOC, DOCX
              </p>
            </div>

            {/* Upload Form */}
            <div className="flex-1 p-6">
              <div className="space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">
                        Drop your files here
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        or click to browse your computer
                      </p>
                      <Button className="bg-[#752432] hover:bg-[#652030] text-white">
                        Choose Files
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Maximum file size: 50MB
                    </p>
                  </div>
                </div>

                {/* Course Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Course *
                  </label>
                  <Select>
                    <SelectTrigger className="bg-white border-gray-300 h-10">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Instructor *
                  </label>
                  <Select>
                    <SelectTrigger className="bg-white border-gray-300 h-10">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInstructors.map((instructor) => (
                        <SelectItem key={instructor} value={instructor}>
                          {instructor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Year *
                    </label>
                    <Select>
                      <SelectTrigger className="bg-white border-gray-300 h-10">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Grade Received *
                    </label>
                    <Select>
                      <SelectTrigger className="bg-white border-gray-300 h-10">
                        <SelectValue placeholder="Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DS">DS (Dean's Scholar)</SelectItem>
                        <SelectItem value="H">H (High)</SelectItem>
                        <SelectItem value="P">P (Pass)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Title Input with Dice */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Outline Title *
                  </label>
                  <div className="relative">
                    <Input 
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Random Title"
                      className="bg-white border-gray-300 pr-12"
                    />
                    <button
                      type="button"
                      onClick={generateRandomTitle}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#752432] transition-colors p-1"
                      title="Generate random title"
                    >
                      <Dices className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    className="mt-0.5 h-4 w-4 text-[#752432] focus:ring-[#752432] border-gray-300 rounded" 
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I confirm that this is my original work and I have the right to share it. I agree to the{' '}
                    <a href="#" className="text-[#752432] hover:underline">Terms of Service</a> and{' '}
                    <a href="#" className="text-[#752432] hover:underline">Community Guidelines</a>.
                  </label>
                </div>

                {/* Upload Button */}
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full bg-[#752432] hover:bg-[#652030] text-white py-3"
                    disabled
                  >
                    Upload Outline
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Please fill in all required fields and select a file to upload
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