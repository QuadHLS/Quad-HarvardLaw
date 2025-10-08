import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Search, X, Star } from 'lucide-react';

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
  assessment_type: 'Project' | 'Final Exam' | 'Both';
  has_cold_calls: boolean;
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
  handleSubmitReview
}) => {
  const [professorSearch, setProfessorSearch] = useState('');
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);
  const professorDropdownRef = useRef<HTMLDivElement>(null);
  const professorDropdownPanelRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number; width: number } | null>(null);

  // Filter professors based on search
  const filteredProfessors = useMemo(() => {
    if (!professorSearch.trim()) return professors;
    return professors.filter(prof => 
      prof.name.toLowerCase().includes(professorSearch.toLowerCase())
    );
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
    computePosition();
    if (!showProfessorDropdown) return;
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [showProfessorDropdown]);

  const handleProfessorSelect = (professorName: string) => {
    setFormData(prev => ({ ...prev, professor_name: professorName, course_name: '' }));
    setProfessorSearch(professorName);
    setShowProfessorDropdown(false);
  };

  const handleProfessorSearchChange = (value: string) => {
    setProfessorSearch(value);
    setShowProfessorDropdown(!!value.trim());
    if (!value.trim()) {
      setFormData(prev => ({ ...prev, professor_name: '', course_name: '' }));
    }
  };

  // Fancy 1–5 interactive rating with subtle animations
  const FancyRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [burstIndex, setBurstIndex] = useState<number | null>(null);

    const activeUpTo = hoverIndex !== null ? hoverIndex : Math.round(value / 2) - 1;

    const handleClick = (i: number) => {
      onChange((i + 1) * 2);
      setBurstIndex(i);
      window.setTimeout(() => setBurstIndex(null), 500);
    };

    return (
      <div className="flex items-center gap-2 select-none">
        {Array.from({ length: 5 }, (_, i) => {
          const active = i <= activeUpTo;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              onClick={() => handleClick(i)}
              aria-label={`Rate ${i + 1} out of 5`}
              className={`relative w-8 h-8 rounded-full border transition-all duration-200 flex items-center justify-center shadow-sm ${
                active ? 'border-transparent' : 'border-gray-200 hover:border-[#752432]'
              } ${active ? 'scale-100' : 'scale-95'} group`}
              style={active ? { background: 'linear-gradient(135deg, #752432 0%, #9a3a48 100%)' } : { backgroundColor: 'white' }}
            >
              <Star className={`w-4 h-4 transition-transform duration-200 ${active ? 'text-white scale-110' : 'text-gray-400 group-hover:scale-105'}`} />
              {/* subtle glow */}
              {active && (
                <span className="pointer-events-none absolute inset-0 rounded-full bg-white/10 blur-[1px]" />
              )}
              {/* click burst */}
              {burstIndex === i && (
                <>
                  <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
                  <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
                  <span className="pointer-events-none absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
                  <span className="pointer-events-none absolute top-1/2 -right-1 -translate-y-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
                </>
              )}
            </button>
          );
        })}
        <span className="text-[11px] text-gray-600 ml-1">{Math.round(value / 2)}/5</span>
      </div>
    );
  };

  return (
    <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
      <DialogContent
        className="w-[820px] max-w-[92vw] rounded-[24px] shadow-2xl border border-white/60 backdrop-blur-md overflow-hidden p-0"
        style={{ backgroundColor: 'rgba(249,245,242,0.9)', borderRadius: 24 }}
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
                  className="pl-10 pr-10 h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs"
                  style={{ backgroundColor: 'white', borderRadius: 16 }}
                  autoFocus={false}
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
                <div
                  ref={professorDropdownPanelRef}
                  className="border border-gray-200 rounded-2xl shadow-xl backdrop-blur-sm"
                  style={{
                    position: 'fixed',
                    left: dropdownPosition.left,
                    top: dropdownPosition.top,
                    width: dropdownPosition.width,
                    backgroundColor: 'rgba(249,245,242,0.95)',
                    WebkitOverflowScrolling: 'touch',
                    maxHeight: 280,
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    overscrollBehavior: 'contain',
                    touchAction: 'pan-y',
                    zIndex: 2147483647, // ensure above modal
                    pointerEvents: 'auto'
                  }}
                >
                  {(filteredProfessors.length > 0 ? filteredProfessors : professors).map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => handleProfessorSelect(prof.name)}
                      className="w-full px-3 py-1 text-left hover:bg-gray-100/70 focus:bg-gray-100/70 focus:outline-none text-[11px]"
                    >
                      {prof.name}
                    </button>
                  ))}
                </div>,
                document.body
              )}
              
              {/* No results message */}
              {showProfessorDropdown && professorSearch.trim() && filteredProfessors.length === 0 && (
                <div className="absolute z-10 w-full mt-1 border border-gray-300 rounded-2xl shadow-lg p-4 text-gray-500 text-center" style={{ backgroundColor: '#f9f5f2' }}>
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
                <SelectContent className="rounded-2xl shadow-xl overflow-hidden border border-gray-200">
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
                          <SelectItem key={course.id} value={course.name}>
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
                <SelectContent className="rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  {Array.from({ length: 4 }, (_, i) => {
                    const y = (new Date().getFullYear() - i).toString();
                    return (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Overall Rating (1-5) <span style={{ color: '#752531' }}>*</span></Label>
              <div className="mt-1">
                <FancyRating
                  value={formData.overall_rating}
                  onChange={(v) => setFormData(prev => ({ ...prev, overall_rating: v }))}
                />
              </div>
            </div>
          </div>

          {/* Cold calls, Electronics, Final Type */}
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <div className="flex items-center space-x-2 mt-3">
              <Switch
                checked={formData.has_cold_calls}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_cold_calls: checked }))}
              />
              <Label className="text-xs font-medium text-gray-700">Cold Calls</Label>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <Switch
                checked={formData.laptops_allowed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, laptops_allowed: checked }))}
              />
              <Label className="text-xs font-medium text-gray-700">Electronics Allowed</Label>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Final Type <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.assessment_type}
                onValueChange={(value: 'Project' | 'Final Exam' | 'Both') => 
                  setFormData(prev => ({ ...prev, assessment_type: value }))
                }
              >
                    <SelectTrigger className="mt-1 h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs" style={{ backgroundColor: 'white', borderRadius: 16 }}>
                  <SelectValue placeholder="Select final type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  <SelectItem value="Final Exam">Final Exam</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Overall Review Text */}
          <div className="mt-2">
            <Label className="text-sm font-medium text-gray-700">Overall Review <span style={{ color: '#752531' }}>*</span></Label>
            <Textarea className="mt-1.5 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-sm"
              placeholder="Share your experience with the course and professor."
              value={formData.overall_review}
              onChange={(e) => setFormData(prev => ({ ...prev, overall_review: e.target.value }))}
              rows={6}
              style={{ backgroundColor: 'white', borderRadius: 16 }}
            />
          </div>
          </div>

          {/* Removed duplicate switches/assessment block (condensed above) */}

          {/* Sticky Footer Actions */}
          <div className="px-6 pb-5">
            <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-gradient-to-t from-[rgba(249,245,242,0.95)] to-[rgba(249,245,242,0.5)] border-t border-white/60 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={
                  formLoading ||
                  !formData.professor_name ||
                  !formData.course_name ||
                  !formData.year ||
                  formData.overall_rating === 0 ||
                  !formData.assessment_type ||
                  !formData.overall_review.trim()
                }
                className="bg-[#752432] hover:bg-[#752432]/90 shadow-sm hover:shadow rounded-xl"
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
