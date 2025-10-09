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
  const [professorSearch, setProfessorSearch] = useState(formData.professor_name);
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);

  // Sync professorSearch with formData.professor_name
  useEffect(() => {
    setProfessorSearch(formData.professor_name);
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
        assessment_type: 'Final Exam',
        has_cold_calls: false,
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

  // Simple animated rating bar: 0.0–5.0 (tenths). Internally maps to 0.0–10.0 for storage
  const AnimatedRatingBar = ({ valueFive, onChangeFive }: { valueFive: number; onChangeFive: (v: number) => void }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [animatedValue, setAnimatedValue] = useState(valueFive);
    const animationRef = useRef<number>();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpColor = (c1: [number, number, number], c2: [number, number, number], t: number): string => {
      const r = Math.round(lerp(c1[0], c2[0], t));
      const g = Math.round(lerp(c1[1], c2[1], t));
      const b = Math.round(lerp(c1[2], c2[2], t));
      return `rgb(${r}, ${g}, ${b})`;
    };
    // brand-ish palette pulled from existing UI accents
    const RED: [number, number, number] = [247, 20, 23];    // #f71417
    const YELLOW: [number, number, number] = [255, 177, 0]; // #ffb100
    const BLUE: [number, number, number] = [2, 119, 197];   // #0277c5
    const GREEN: [number, number, number] = [0, 150, 44];   // #00962c

    const computeFillColor = (v: number) => {
      // More distinct color ranges: red -> yellow -> blue -> green
      if (v <= 1.7) {
        return `rgb(${RED[0]}, ${RED[1]}, ${RED[2]})`; // Pure red
      } else if (v <= 2.3) {
        const t = Math.max(0, Math.min(1, (v - 1.7) / 0.6));
        return lerpColor(RED, YELLOW, t);
      } else if (v <= 2.8) {
        return `rgb(${YELLOW[0]}, ${YELLOW[1]}, ${YELLOW[2]})`; // Pure yellow
      } else if (v <= 3.2) {
        const t = Math.max(0, Math.min(1, (v - 2.8) / 0.4));
        return lerpColor(YELLOW, BLUE, t);
      } else if (v <= 3.8) {
        return `rgb(${BLUE[0]}, ${BLUE[1]}, ${BLUE[2]})`; // Pure blue
      } else if (v <= 4.2) {
        const t = Math.max(0, Math.min(1, (v - 3.8) / 0.4));
        return lerpColor(BLUE, GREEN, t);
      } else {
        return `rgb(${GREEN[0]}, ${GREEN[1]}, ${GREEN[2]})`; // Pure green
      }
    };

    const setFromClientX = (clientX: number) => {
      // Prevent clicks during animation
      if (animationRef.current) {
        return;
      }
      
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const raw = ratio * 5; // 0..5
      
      // Auto-snap to 0 or 5 when close to edges
      let target;
      if (raw <= 0.3) {
        target = 0; // Snap to 0 if within 0.3 of the left edge
      } else if (raw >= 4.9) {
        target = 5; // Snap to 5 if 4.9 or above
      } else {
        const rounded = Math.round(raw * 10) / 10;
        // If the rounded value is 4.8 or 4.9, make it 5.0
        target = (rounded === 4.8 || rounded === 4.9) ? 5.0 : rounded;
      }
      
      // Don't animate if target is the same as current value
      if (Math.abs(target - animatedValue) < 0.1) {
        return;
      }
      
      // Start smooth animation toward target from current position
      animateToValue(target);
      
      // Update form state after animation completes
      setTimeout(() => {
        onChangeFive(target);
      }, 800); // Match animation duration
    };

    const animateToValue = (target: number) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      const startValue = animatedValue;
      const startTime = performance.now();
      const duration = 800; // 800ms for slower, smoother animation
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smoother easing function
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (target - startValue) * easeOut;
        
        setAnimatedValue(currentValue);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Sync animated value with prop changes, but only when not animating
    useEffect(() => {
      if (!animationRef.current) {
        setAnimatedValue(valueFive);
      }
    }, [valueFive]);

    // Initialize animated value on mount
    useEffect(() => {
      setAnimatedValue(valueFive);
    }, []); // Only run once on mount

    // Cleanup animation on unmount
    useEffect(() => {
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, []);


    const percent = Math.max(0, Math.min(100, (animatedValue / 5) * 100));
    const fillColor = computeFillColor(animatedValue);

    return (
      <div className="flex items-center gap-2 select-none w-full">
        <div
          ref={trackRef}
          className={`relative h-4 w-full rounded-full bg-white overflow-hidden ${
            animationRef.current ? 'cursor-wait opacity-75' : 'cursor-pointer'
          }`}
          style={{ width: 'calc(100% + 30px)' }}
          onClick={(e) => setFromClientX(e.clientX)}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={animatedValue}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${percent}%`,
              backgroundColor: fillColor,
              pointerEvents: 'none',
            }}
          />
          {/* Rating number positioned at the end of the filled bar */}
          <div
            className="absolute top-0 h-full flex items-center justify-center pointer-events-none"
            style={{
              left: `${Math.max(percent, 8)}%`, // Ensure minimum 8% from left edge for visibility
              transform: percent < 12 ? 'translateX(-50%)' : 'translateX(-100%)', // Move left more when following bar
            }}
          >
            <span 
              className="text-xs font-medium px-1 py-0.5 rounded"
              style={{
                color: percent < 12 ? '#374151' : 'white', // Dark text if bar is too short
                backgroundColor: percent < 12 ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                textShadow: percent >= 12 ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {animatedValue.toFixed(1)}
            </span>
          </div>
        </div>
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
                <div
                  ref={professorDropdownPanelRef}
                  className="border border-gray-200 shadow-xl backdrop-blur-sm overflow-hidden"
                  data-radix-scroll-lock-ignore
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    left: dropdownPosition.left,
                    top: dropdownPosition.top,
                    width: dropdownPosition.width,
                    backgroundColor: 'rgba(249,245,242,0.95)',
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
                  {professors.map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => handleProfessorSelect(prof.name)}
                      className="w-full px-3 py-2 text-left hover:bg-white focus:bg-white focus:outline-none text-sm border-b border-gray-100 last:border-b-0 rounded-none first:rounded-t-2xl last:rounded-b-2xl"
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
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'rgba(249,245,242,0.95)' }}>
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
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'rgba(249,245,242,0.95)' }}>
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
              <div className="mt-1">
                <AnimatedRatingBar
                  valueFive={Number((formData.overall_rating / 2).toFixed(1))}
                  onChangeFive={(vFive) => setFormData(prev => ({ ...prev, overall_rating: Number((vFive * 2).toFixed(1)) }))}
                />
              </div>
            </div>
          </div>

          {/* Cold calls, Electronics, Final Type */}
          <div className="grid grid-cols-3 gap-2 mt-1.5 items-center">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.has_cold_calls}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_cold_calls: checked }))}
              />
              <Label className="text-xs font-medium text-gray-700">Cold Calls</Label>
            </div>
            <div className="flex items-center space-x-2 justify-start">
              <Switch
                checked={formData.laptops_allowed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, laptops_allowed: checked }))}
              />
              <Label className="text-xs font-medium text-gray-700">Electronics Allowed</Label>
            </div>
            <div className="flex flex-col items-center min-w-0 mt-1">
              <Label className="text-xs font-medium text-gray-700 text-center mb-1">Final Type <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.assessment_type}
                onValueChange={(value: 'Project' | 'Final Exam' | 'Both') => 
                  setFormData(prev => ({ ...prev, assessment_type: value }))
                }
              >
                <SelectTrigger className="h-9 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-[#752432] focus:border-transparent transition text-xs w-full min-w-0" style={{ backgroundColor: 'white', borderRadius: 16 }}>
                  <SelectValue placeholder="Select final type" />
                </SelectTrigger>
                <SelectContent className="shadow-xl overflow-hidden border border-gray-200 [&>*:hover]:bg-white [&>*:focus]:bg-white" style={{ borderRadius: '24px', backgroundColor: 'rgba(249,245,242,0.95)' }}>
                  <SelectItem value="Final Exam" className="hover:bg-white focus:bg-white">Final Exam</SelectItem>
                  <SelectItem value="Project" className="hover:bg-white focus:bg-white">Project</SelectItem>
                  <SelectItem value="Both" className="hover:bg-white focus:bg-white">Both</SelectItem>
                </SelectContent>
              </Select>
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
              maxLength={500}
            />
            <div className="mt-1 text-[10px] text-gray-500 text-right">
              {formData.overall_review.length}/500
            </div>
          </div>
          </div>

          {/* Removed duplicate switches/assessment block (condensed above) */}

          {/* Sticky Footer Actions */}
          <div className="px-6 pb-5">
            <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-gradient-to-t from-[rgba(249,245,242,0.95)] to-[rgba(249,245,242,0.5)] border-t border-white/60 flex justify-center">
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
