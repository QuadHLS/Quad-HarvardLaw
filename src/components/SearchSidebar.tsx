import { useState } from "react";
import {
  Search,
  Download,
  FileText,
  Star,
  MoreHorizontal,
  EyeOff,
  Flag,
  X,
  Tag,
  Trash2,
  Bookmark,
  Eye,
  Share,
  Dices,
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
import type { Outline, Instructor } from "../types";

interface SearchSidebarProps {
  outlines: Outline[];
  allOutlines: Outline[];
  courses: string[];
  instructors: Instructor[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
  selectedOutline: Outline | null;
  onSelectOutline: (outline: Outline) => void;
  activeTab: "search" | "saved" | "upload";
  setActiveTab: (tab: "search" | "saved" | "upload") => void;
  savedOutlines: Outline[];
  onRemoveSavedOutline: (outlineId: string) => void;
  onToggleSaveOutline: (outline: Outline) => void;
  hiddenOutlines: string[];
  onHideOutline: (outlineId: string) => void;
  onUnhideAllOutlines: () => void;
}

export function SearchSidebar({
  outlines,
  allOutlines,
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
  sortBy,
  setSortBy,
  showOutlines,
  setShowOutlines,
  showAttacks,
  setShowAttacks,
  selectedOutline,
  onSelectOutline,
  activeTab,
  setActiveTab,
  savedOutlines,
  onRemoveSavedOutline,
  onToggleSaveOutline,
  hiddenOutlines,
  onHideOutline,
  onUnhideAllOutlines,
}: SearchSidebarProps) {
  const [showCourseDropdown, setShowCourseDropdown] =
    useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [showInstructorDropdown, setShowInstructorDropdown] =
    useState(false);
  const [instructorSearchTerm, setInstructorSearchTerm] =
    useState("");
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

  const handleDownload = (url: string, type: "PDF" | "DOC") => {
    // In a real app, this would download the file
    console.log(`Downloading ${type} from ${url}`);
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

  const handleHide = (outline: Outline) => {
    onHideOutline(outline.id);
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

  // Calculate outline count for each instructor based on selected course
  const getInstructorOutlineCount = (
    instructorName: string,
  ) => {
    return allOutlines.filter((outline) => {
      const matchesInstructor =
        outline.instructor === instructorName;
      const matchesCourse =
        selectedCourse === "" ||
        outline.course === selectedCourse;
      return matchesInstructor && matchesCourse;
    }).length;
  };

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
          {/* Search by Course */}
          <div className="p-3 space-y-3 bg-[rgba(117,36,50,1)]">
            <div className="relative">
              <Input
                placeholder="Search by Course"
                value={selectedCourse || courseSearchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setCourseSearchTerm(value);
                  if (
                    selectedCourse &&
                    value !== selectedCourse
                  ) {
                    setSelectedCourse("");
                  }
                }}
                onFocus={() => {
                  setShowCourseDropdown(true);
                  // If there's a selected course, clear the search term to show all options
                  if (selectedCourse) {
                    setCourseSearchTerm("");
                  }
                }}
                onClick={() => {
                  // When clicking on a field with a selection, show all options
                  if (selectedCourse) {
                    setCourseSearchTerm("");
                    setShowCourseDropdown(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow for dropdown clicks
                  setTimeout(
                    () => setShowCourseDropdown(false),
                    200,
                  );
                }}
                className={`bg-black/20 border-white/30 text-white placeholder:text-white/70 ${
                  selectedCourse ? "pr-16" : "pr-10"
                }`}
              />
              {selectedCourse && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedCourse("");
                    setSelectedInstructor(""); // Clear instructor when clearing course
                    setCourseSearchTerm("");
                  }}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />

              {/* Course Dropdown */}
              {showCourseDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white text-black rounded shadow-lg z-20 max-h-48 overflow-y-auto">
                  {courses
                    .filter((course) => {
                      // If an instructor is selected, only show courses that instructor teaches
                      if (selectedInstructor) {
                        const instructorObj = instructors.find(
                          (inst) =>
                            inst.name === selectedInstructor,
                        );
                        if (
                          instructorObj &&
                          !instructorObj.courses.includes(
                            course,
                          )
                        ) {
                          return false;
                        }
                      }

                      // If there's a search term, filter by it
                      if (courseSearchTerm) {
                        return course
                          .toLowerCase()
                          .includes(
                            courseSearchTerm.toLowerCase(),
                          );
                      }
                      // If there's a selected course but no search term, show all available courses
                      if (selectedCourse && !courseSearchTerm) {
                        return true;
                      }
                      // Default filtering behavior
                      return course
                        .toLowerCase()
                        .includes(
                          (
                            selectedCourse || courseSearchTerm
                          ).toLowerCase(),
                        );
                    })
                    .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
                    .map((course) => (
                      <button
                        key={course}
                        onClick={() => {
                          // Toggle selection - deselect if already selected
                          if (selectedCourse === course) {
                            setSelectedCourse("");
                            setSelectedInstructor(""); // Clear instructor when deselecting course
                          } else {
                            setSelectedCourse(course);

                            // Clear selected instructor if they don't teach the newly selected course
                            if (selectedInstructor) {
                              const instructorObj =
                                instructors.find(
                                  (inst) =>
                                    inst.name ===
                                    selectedInstructor,
                                );
                              if (
                                instructorObj &&
                                !instructorObj.courses.includes(
                                  course,
                                )
                              ) {
                                setSelectedInstructor("");
                              }
                            }
                          }
                          setCourseSearchTerm("");
                          setShowCourseDropdown(false);
                        }}
                        className={`w-full p-2 text-left hover:bg-gray-100 ${
                          course === selectedCourse
                            ? "bg-[#8B4A6B] text-white"
                            : ""
                        }`}
                      >
                        {course}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Search by Instructor */}
            <div className="relative">
              <Input
                placeholder="Search by Instructor"
                value={
                  selectedInstructor || instructorSearchTerm
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setInstructorSearchTerm(value);
                  if (
                    selectedInstructor &&
                    value !== selectedInstructor
                  ) {
                    setSelectedInstructor("");
                  }
                }}
                onFocus={() => {
                  setShowInstructorDropdown(true);
                  // If there's a selected instructor, clear the search term to show all options
                  if (selectedInstructor) {
                    setInstructorSearchTerm("");
                  }
                }}
                onClick={() => {
                  // When clicking on a field with a selection, show all options
                  if (selectedInstructor) {
                    setInstructorSearchTerm("");
                    setShowInstructorDropdown(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow for dropdown clicks
                  setTimeout(
                    () => setShowInstructorDropdown(false),
                    200,
                  );
                }}
                className={`bg-black/20 border-white/30 text-white placeholder:text-white/70 ${
                  selectedInstructor ? "pr-16" : "pr-10"
                }`}
              />
              {selectedInstructor && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedInstructor("");
                    setInstructorSearchTerm("");
                  }}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />

              {/* Instructor Dropdown */}
              {showInstructorDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white text-black rounded shadow-lg z-20 max-h-48 overflow-y-auto">
                  {instructors
                    .filter((instructor) => {
                      // If a course is selected, only show instructors who teach that course
                      if (selectedCourse) {
                        return instructor.courses.includes(
                          selectedCourse,
                        );
                      }
                      // If no course is selected, show all instructors
                      return true;
                    })
                    .map((instructor) => instructor.name)
                    .filter((instructor) => {
                      // If there's a search term, filter by it
                      if (instructorSearchTerm) {
                        return instructor
                          .toLowerCase()
                          .includes(
                            instructorSearchTerm.toLowerCase(),
                          );
                      }
                      // If there's a selected instructor but no search term, show all available instructors
                      if (
                        selectedInstructor &&
                        !instructorSearchTerm
                      ) {
                        return true;
                      }
                      // Default filtering behavior
                      return instructor
                        .toLowerCase()
                        .includes(
                          (
                            selectedInstructor ||
                            instructorSearchTerm
                          ).toLowerCase(),
                        );
                    })
                    .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
                    .map((instructor) => (
                      <button
                        key={instructor}
                        onClick={() => {
                          // Toggle selection - deselect if already selected
                          if (
                            selectedInstructor === instructor
                          ) {
                            setSelectedInstructor("");
                          } else {
                            setSelectedInstructor(instructor);

                            // Auto-select course if instructor only teaches one course
                            const instructorObj =
                              instructors.find(
                                (inst) =>
                                  inst.name === instructor,
                              );
                            if (
                              instructorObj &&
                              instructorObj.courses.length === 1
                            ) {
                              setSelectedCourse(
                                instructorObj.courses[0],
                              );
                            }
                          }
                          setInstructorSearchTerm("");
                          setShowInstructorDropdown(false);
                        }}
                        className={`w-full p-2 text-left hover:bg-gray-100 flex justify-between items-center ${
                          instructor === selectedInstructor
                            ? "bg-[#8B4A6B] text-white"
                            : ""
                        }`}
                      >
                        <span>{instructor}</span>
                        <span
                          className={`text-sm ${
                            instructor === selectedInstructor
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          (
                          {getInstructorOutlineCount(
                            instructor,
                          )}{" "}
                          Available)
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Grade and Year Filters Side by Side */}
            <div className="flex gap-1.5">
              {/* Grade Filter */}
              <div className="relative flex-1">
                <Select
                  key={`grade-${selectedGrade || "empty"}`}
                  value={selectedGrade || undefined}
                  onValueChange={(value) =>
                    setSelectedGrade(value)
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/30 text-white placeholder:text-white/70 data-[placeholder]:text-white/70 [&>svg]:text-white h-10">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DS">DS</SelectItem>
                    <SelectItem value="H">H</SelectItem>
                    <SelectItem value="P">P</SelectItem>
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

              {/* Year Filter */}
              <div className="relative flex-1">
                <Select
                  key={`year-${selectedYear || "empty"}`}
                  value={selectedYear || undefined}
                  onValueChange={(value) =>
                    setSelectedYear(value)
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/30 text-white placeholder:text-white/70 data-[placeholder]:text-white/70 [&>svg]:text-white h-10">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2019">2019</SelectItem>
                    <SelectItem value="2018">2018</SelectItem>
                    <SelectItem value="2017">2017</SelectItem>
                    <SelectItem value="2016">2016</SelectItem>
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
                onClick={() => setShowOutlines(!showOutlines)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-all ${
                  showOutlines
                    ? "bg-white text-[#8B4A6B] border border-white shadow-sm"
                    : "bg-transparent text-white border border-white/50 hover:border-white/70"
                }`}
              >
                <Tag className="w-4 h-4" />
                Outline
              </button>
              <button
                onClick={() => setShowAttacks(!showAttacks)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-all ${
                  showAttacks
                    ? "bg-white text-[#8B4A6B] border border-white shadow-sm"
                    : "bg-transparent text-white border border-white/50 hover:border-white/70"
                }`}
              >
                <Tag className="w-4 h-4" />
                Attack
              </button>
            </div>
          </div>

          {/* Outlines List */}
          <div className="flex-1 text-black overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {selectedCourse === "" ||
            selectedInstructor === "" ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {selectedCourse === "" &&
                  selectedInstructor === ""
                    ? "No Filters Selected"
                    : "Incomplete Selection"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {selectedCourse === "" &&
                  selectedInstructor === ""
                    ? "Please select both a course and instructor above to view available outlines."
                    : selectedCourse === ""
                      ? "Please select a course to complete your search criteria."
                      : "Please select an instructor to complete your search criteria."}
                </p>
              </div>
            ) : outlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No Outlines Found
                </h3>
                <p className="text-gray-500 text-sm">
                  No outlines match your current search
                  criteria.
                </p>
              </div>
            ) : (
              outlines.map((outline) => {
                const isSaved = savedOutlines.some(
                  (saved) => saved.id === outline.id,
                );
                return (
                  <div
                    key={outline.id}
                    className={`p-3 border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                      selectedOutline?.id === outline.id
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => onSelectOutline(outline)}
                  >
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {outline.title}
                          </span>
                          <span className="text-gray-600">
                            {outline.year}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {outline.type}
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
                            ({outline.ratingCount})
                          </span>
                        </div>
                        <div className="flex gap-1 items-center relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle share functionality
                              console.log(
                                "Share outline:",
                                outline.title,
                              );
                            }}
                            className="p-1 h-8 w-8"
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(
                                  outline.fileUrl,
                                  outline.fileType,
                                );
                              }}
                              className="p-1 h-8 w-8"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 text-left mt-[-2px] mr-[0px] mb-[5px] ml-[0px] p-[0px]">
                              ({outline.fileType})
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
                                  handleHide(outline)
                                }
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide
                              </DropdownMenuItem>
                              {hiddenOutlines.length > 0 && (
                                <DropdownMenuItem
                                  onClick={onUnhideAllOutlines}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Unhide
                                </DropdownMenuItem>
                              )}
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
                          selectedOutline?.id === outline.id
                            ? "bg-blue-50"
                            : ""
                        }`}
                        onClick={() => onSelectOutline(outline)}
                      >
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {outline.title}
                              </span>
                              <span className="text-gray-600">
                                {outline.year}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                {outline.type}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle share functionality
                                console.log(
                                  "Share outline:",
                                  outline.title,
                                );
                              }}
                              className="p-1 h-8 w-8"
                            >
                              <Share className="w-4 h-4" />
                            </Button>
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(
                                    outline.fileUrl,
                                    outline.fileType,
                                  );
                                }}
                                className="p-1 h-8 w-8"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 mt-0.5">
                                ({outline.fileType})
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
                                    handleHide(outline)
                                  }
                                >
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Hide
                                </DropdownMenuItem>
                                {hiddenOutlines.length > 0 && (
                                  <DropdownMenuItem
                                    onClick={
                                      onUnhideAllOutlines
                                    }
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Unhide
                                  </DropdownMenuItem>
                                )}
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
                      {courses.sort((a, b) => a.localeCompare(b)).map((course) => (
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
                      {instructors
                        .map(inst => inst.name)
                        .sort((a, b) => a.localeCompare(b))
                        .map((instructor) => (
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