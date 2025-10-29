import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Search, X } from 'lucide-react';

interface ReviewFormData {
  professor_name: string;
  course_name: string;
  semester: 'Fall' | 'Winter' | 'Spring' | 'Summer';
  year: string;
  grade: 'DS' | 'H' | 'P';
  overall_rating: number;
  readings_rating: number;
  cold_calls_rating: number;
  exam_rating: number;
  overall_review: string;
  readings_review: string;
  cold_calls_review: string;
  exam_review: string;
  laptops_allowed: boolean;
  assessment_type: 'In Class' | 'Take Home' | 'Final Paper' | 'Multiple Papers' | 'None';
  has_cold_calls: 'Yes' | 'No' | 'Panel';
  anonymous: boolean;
}

interface Professor {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
}

interface ProfessorCourse {
  professor_id: string;
  course_id: string;
  created_at: string;
}

interface ReviewFormProps {
  showReviewForm: boolean;
  setShowReviewForm: (show: boolean) => void;
  formError: string | null;
  formLoading: boolean;
  formData: ReviewFormData;
  setFormData: React.Dispatch<React.SetStateAction<ReviewFormData>>;
  professors: Professor[];
  courses: Course[];
  professorCourses: ProfessorCourse[];
  handleSubmitReview: () => void;
  getButtonColor: () => string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  showReviewForm,
  setShowReviewForm,
  formError,
  formLoading,
  formData,
  setFormData,
  professors,
  courses,
  professorCourses,
  handleSubmitReview,
  getButtonColor
}) => {
  const [professorSearch, setProfessorSearch] = useState(formData.professor_name);
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);

  // Helper function to format professor name for display
  const formatProfessorDisplayName = (name: string) => {
    const [firstName, lastName] = name.includes(',') 
      ? name.split(',').map(part => part.trim())
      : [name, ''];
    return lastName && firstName ? `${lastName}, ${firstName}` : name;
  };

  // Sync professorSearch with formData.professor_name
  useEffect(() => {
    setProfessorSearch(formData.professor_name ? formatProfessorDisplayName(formData.professor_name) : '');
  }, [formData.professor_name]);

  // Reset form when modal closes
  useEffect(() => {
    if (!showReviewForm) {
      // Reset all form data to initial state
      setFormData({
        professor_name: '',
        course_name: '',
        semester: 'Fall',
        year: '',
        grade: 'H',
        overall_rating: 0,
        readings_rating: 0,
        cold_calls_rating: 0,
        exam_rating: 0,
        overall_review: '',
        readings_review: '',
        cold_calls_review: '',
        exam_review: '',
        laptops_allowed: false,
        assessment_type: 'None',
        has_cold_calls: 'No',
        anonymous: false
      });
      // Reset professor search
      setProfessorSearch('');
      // Close dropdown
      setShowProfessorDropdown(false);
    }
  }, [showReviewForm, setFormData]);
  const professorDropdownRef = useRef<HTMLDivElement>(null);
  const professorDropdownPanelRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number; width: number } | null>(null);

  // Filter professors based on search
  const filteredProfessors = useMemo(() => {
    if (!professorSearch.trim()) return professors;
    return professors.filter(prof => {
      // Parse the name to check both first and last name
      const [firstName, lastName] = prof.name.includes(',') 
        ? prof.name.split(',').map(part => part.trim())
        : [prof.name, ''];
      const searchTerm = professorSearch.toLowerCase();
      return prof.name.toLowerCase().includes(searchTerm) ||
             firstName.toLowerCase().includes(searchTerm) ||
             lastName.toLowerCase().includes(searchTerm);
    });
  }, [professors, professorSearch]);

  // Close dropdown when clicking outside (consider portal panel too)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideAnchor = professorDropdownRef.current?.contains(target);
      const clickedInsidePanel = professorDropdownPanelRef.current?.contains(target);
      if (!clickedInsideAnchor && !clickedInsidePanel) {
        setShowProfessorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset dropdown state when modal opens
  useEffect(() => {
    if (showReviewForm) {
      setShowProfessorDropdown(false);
    }
  }, [showReviewForm]);

  // Recompute dropdown position when opened or on resize/scroll
  useEffect(() => {
    const computePosition = () => {
      if (!showProfessorDropdown) return;
      const anchor = professorDropdownRef.current;
      if (!anchor) return;
      const input = anchor.querySelector('input');
      const el = (input as HTMLElement) || anchor as HTMLElement;
      const rect = el.getBoundingClientRect();
      setDropdownPosition({ left: rect.left + window.scrollX, top: rect.bottom + window.scrollY + 6, width: rect.width });
    };
    
    if (showProfessorDropdown) {
      computePosition();
    }
    
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [showProfessorDropdown]);

  const handleProfessorSelect = (professorName: string) => {
    setFormData(prev => ({ ...prev, professor_name: professorName, course_name: '' }));
    setProfessorSearch(formatProfessorDisplayName(professorName));
    setShowProfessorDropdown(false);
  };

  const handleProfessorSearchChange = (value: string) => {
    setProfessorSearch(value);
    setShowProfessorDropdown(!!value.trim());
    if (!value.trim()) {
      setFormData(prev => ({ ...prev, professor_name: '', course_name: '' }));
    }
  };


  return (
    <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
      <DialogContent
        className="w-[820px] max-w-[92vw] rounded-[24px] shadow-2xl border border-white/60 backdrop-blur-md overflow-hidden p-0"
        style={{ backgroundColor: '#faf5f1', borderRadius: 24 }}
      >
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-white/60">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">Write a Review</DialogTitle>
          <DialogDescription className="text-gray-600">
            Share your experience with a professor and course to help other students.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {formError}
            </div>
          )}

          {/* Layout: Single-column stable form */}
          <div className="space-y-5">
          {/* Basic Info - Professor and Course */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="relative" ref={professorDropdownRef}>
              <Label className="text-xs font-medium text-gray-700">Professor <span style={{ color: '#752531' }}>*</span></Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search for professor..."
                  value={professorSearch}
                  onChange={(e) => handleProfessorSearchChange(e.target.value)}
                  onFocus={() => setShowProfessorDropdown(true)}
                  className="pl-10 pr-10 h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition"
                  style={{ backgroundColor: 'white', borderRadius: 16, fontSize: '12px' }}
                  autoFocus={false}
                  tabIndex={-1}
                />
                {professorSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfessorSearch('');
                      setFormData(prev => ({ ...prev, professor_name: '', course_name: '' }));
                      setShowProfessorDropdown(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Professor Dropdown */}
              {showProfessorDropdown && dropdownPosition && createPortal(
                <>
                  {/* Backdrop to prevent background interaction */}
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 2147483646,
                      backgroundColor: 'transparent'
                    }}
                    onClick={() => setShowProfessorDropdown(false)}
                  />
                  <div
                    ref={professorDropdownPanelRef}
                    className="border border-gray-200 shadow-xl overflow-hidden"
                    data-radix-scroll-lock-ignore
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    style={{
                      position: 'fixed',
                      left: dropdownPosition.left,
                      top: dropdownPosition.top,
                      width: dropdownPosition.width,
                      backgroundColor: 'white',
                      WebkitOverflowScrolling: 'touch',
                      borderRadius: '24px',
                      height: 220,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      overscrollBehavior: 'contain',
                      touchAction: 'pan-y',
                      zIndex: 2147483647, // ensure above modal
                      pointerEvents: 'auto'
                    }}
                  >
                  {filteredProfessors.map((prof) => {
                    // Parse the name to display in "Last Name, First Name" format
                    const [firstName, lastName] = prof.name.includes(',') 
                      ? prof.name.split(',').map(part => part.trim())
                      : [prof.name, ''];
                    const displayName = lastName && firstName ? `${lastName}, ${firstName}` : prof.name;
                    
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => handleProfessorSelect(prof.name)}
                        className="w-full px-3 py-2 text-left hover:bg-white focus:bg-white focus:outline-none text-sm border-b border-gray-100 last:border-b-0 rounded-none first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        {displayName}
                      </button>
                    );
                  })}
                  </div>
                </>,
                document.body
              )}
              
              {/* No results message */}
              {showProfessorDropdown && professorSearch.trim() && filteredProfessors.length === 0 && (
                <div className="absolute z-10 w-full mt-1 border border-gray-300 rounded-2xl shadow-lg p-4 text-gray-500 text-center" style={{ backgroundColor: 'white' }}>
                  No professors found matching "{professorSearch}"
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-700">Course <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.course_name} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, course_name: value }))}
                disabled={!formData.professor_name}
              >
                <SelectTrigger className="mt-1 h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs" style={{ backgroundColor: 'white', borderRadius: 16 }}>
                  <SelectValue placeholder={formData.professor_name ? "Select course" : "Select professor first"} />
                </SelectTrigger>
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'white' }}>
                  {!formData.professor_name ? (
                    <SelectItem value="select-professor-first" disabled>
                      Please select a professor first
                    </SelectItem>
                  ) : courses.length === 0 ? (
                    <SelectItem value="no-courses" disabled>
                      No courses available
                    </SelectItem>
                  ) : (
                    (() => {
                      // Only show courses for the selected professor
                      const selectedProfessor = professors.find(p => p.name === formData.professor_name);
                      const filteredCourses = professorCourses.length === 0
                        ? courses // If no relationships exist, show all courses
                        : courses.filter(course => 
                            professorCourses.some(pc => 
                              pc.professor_id === selectedProfessor?.id && 
                              pc.course_id === course.id
                            )
                          );
                      
                      return filteredCourses.length === 0 ? (
                        <SelectItem value="no-professor-courses" disabled>
                          No courses found for this professor
                        </SelectItem>
                      ) : (
                        filteredCourses.map((course) => (
                      <SelectItem key={course.id} value={course.name} className="hover:bg-white focus:bg-white">
                        {course.name}
                      </SelectItem>
                        ))
                      );
                    })()
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year + Rating condensed row */}
          <div className="grid grid-cols-2 gap-3 mt-2 items-end">
            <div>
              <Label className="text-xs font-medium text-gray-700">Year <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.year}
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
              >
                <SelectTrigger className="mt-1 h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs" style={{ backgroundColor: 'white', borderRadius: 16 }}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'white' }}>
                  {Array.from({ length: 4 }, (_, i) => {
                    const y = (new Date().getFullYear() - i).toString();
                    return (
                      <SelectItem key={y} value={y} className="hover:bg-white focus:bg-white">{y}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Overall Rating (0.0–5.0) <span style={{ color: '#752531' }}>*</span></Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.overall_rating === 0 ? '' : formData.overall_rating}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setFormData(prev => ({ ...prev, overall_rating: isNaN(value) ? 0 : value }));
                }}
                className={`mt-1 h-9 w-20 rounded-3xl border transition text-xs no-spinner focus:outline-none focus:ring-0 ${
                  (formData.overall_rating < 0 || formData.overall_rating > 5 || isNaN(formData.overall_rating))
                    ? 'border-red-500' 
                    : 'border-gray-200'
                }`}
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: 16,
                  borderColor: (formData.overall_rating < 0 || formData.overall_rating > 5 || isNaN(formData.overall_rating)) ? '#ef4444' : '#e5e7eb',
                  outline: 'none',
                  boxShadow: 'none'
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Cold calls, Assessment, Electronics */}
          <div className="grid grid-cols-3 gap-2 mt-1.5 items-center">
            {/* 1) Cold Calls */}
            <div className="flex flex-col items-center min-w-0 mt-1">
              <Label className="text-xs font-medium text-gray-700 text-center mb-1">Cold Calls <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.has_cold_calls}
                onValueChange={(value: 'Yes' | 'No' | 'Panel') => 
                  setFormData(prev => ({ ...prev, has_cold_calls: value }))
                }
              >
                <SelectTrigger className="h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs w-full min-w-0" style={{ backgroundColor: 'white', borderRadius: 16 }}>
                  <SelectValue placeholder="Select cold calls" />
                </SelectTrigger>
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'white' }}>
                  <SelectItem value="Yes" className="hover:bg-white focus:bg-white">Yes</SelectItem>
                  <SelectItem value="No" className="hover:bg-white focus:bg-white">No</SelectItem>
                  <SelectItem value="Panel" className="hover:bg-white focus:bg-white">Panel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2) Assessment */}
            <div className="flex flex-col items-center min-w-0 mt-1">
              <Label className="text-xs font-medium text-gray-700 text-center mb-1">Assessment <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.assessment_type}
                onValueChange={(value: 'In Class' | 'Take Home' | 'Final Paper' | 'Multiple Papers' | 'None') => 
                  setFormData(prev => ({ ...prev, assessment_type: value }))
                }
              >
                <SelectTrigger className="h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs w-full min-w-0" style={{ backgroundColor: 'white', borderRadius: 16 }}>
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'white' }}>
                  <SelectItem value="In Class" className="hover:bg-white focus:bg-white">In Class</SelectItem>
                  <SelectItem value="Take Home" className="hover:bg-white focus:bg-white">Take Home</SelectItem>
                  <SelectItem value="Final Paper" className="hover:bg-white focus:bg-white">Final Paper</SelectItem>
                  <SelectItem value="Multiple Papers" className="hover:bg-white focus:bg-white">Multiple Papers</SelectItem>
                  <SelectItem value="None" className="hover:bg-white focus:bg-white">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3) Electronics Allowed */}
            <div className="flex flex-col items-center min-w-0 mt-1">
              <Label className="text-xs font-medium text-gray-700 text-center mb-1 whitespace-nowrap">Electronics Allowed</Label>
              <div className="flex justify-center w-full">
                <Switch
                  checked={formData.laptops_allowed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, laptops_allowed: checked }))}
                />
              </div>
            </div>
          </div>


          {/* Overall Review Text */}
          <div className="mt-2">
            <Label className="text-sm font-medium text-gray-700">Overall Review <span style={{ color: '#752531' }}>*</span></Label>
            <Textarea className="mt-1.5 rounded-3xl border border-gray-200 focus:outline-none focus:ring-0 focus:border-gray-200 transition text-sm whitespace-pre-wrap break-words"
              placeholder="Share your experience with the course and professor."
              value={formData.overall_review}
              onChange={(e) => setFormData(prev => ({ ...prev, overall_review: e.target.value }))}
              rows={10}
              style={{ backgroundColor: 'white', borderRadius: 16, minHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              maxLength={300}
            />
            <div className="mt-1 text-[10px] text-gray-500 text-right">
              {formData.overall_review.length}/300
            </div>
          </div>
          </div>

          {/* Removed duplicate switches/assessment block (condensed above) */}

          {/* Sticky Footer Actions */}
          <div className="px-6 pb-5">
            <div className="sticky bottom-0 -mx-6 px-6 py-3 border-t border-white/60 flex justify-center" style={{ backgroundColor: '#faf5f1' }}>
              <Button
                onClick={handleSubmitReview}
                disabled={
                  formLoading ||
                  !formData.professor_name ||
                  !formData.course_name ||
                  !formData.year ||
                  formData.overall_rating === 0 ||
                  !formData.assessment_type ||
                  !formData.has_cold_calls ||
                  !formData.overall_review.trim()
                }
                className="shadow-sm hover:shadow rounded-xl"
                style={{ 
                  backgroundColor: getButtonColor(),
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColor() + 'E6'; // Add transparency for hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColor();
                }}
              >
                {formLoading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
