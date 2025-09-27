import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const [professorSearch, setProfessorSearch] = useState('');
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);
  const professorDropdownRef = useRef<HTMLDivElement>(null);

  // Filter professors based on search
  const filteredProfessors = useMemo(() => {
    if (!professorSearch.trim()) return professors;
    return professors.filter(prof => 
      prof.name.toLowerCase().includes(professorSearch.toLowerCase())
    );
  }, [professors, professorSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (professorDropdownRef.current && !professorDropdownRef.current.contains(event.target as Node)) {
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

  const handleProfessorSelect = (professorName: string) => {
    setFormData(prev => ({ ...prev, professor_name: professorName, course_name: '' }));
    setProfessorSearch(professorName);
    setShowProfessorDropdown(false);
  };

  const handleProfessorSearchChange = (value: string) => {
    setProfessorSearch(value);
    setShowProfessorDropdown(true);
    if (!value.trim()) {
      setFormData(prev => ({ ...prev, professor_name: '', course_name: '' }));
    }
  };

  return (
    <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
      <DialogContent className="w-[800px] max-w-[90vw]" style={{ backgroundColor: '#f9f5f2' }}>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with a professor and course to help other students.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {formError}
            </div>
          )}

          {/* Basic Info - Horizontal Layout */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="relative" ref={professorDropdownRef}>
              <Label>Professor <span style={{ color: '#752531' }}>*</span></Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search for professor..."
                  value={professorSearch}
                  onChange={(e) => handleProfessorSearchChange(e.target.value)}
                  onFocus={() => setShowProfessorDropdown(true)}
                  className="pl-10 pr-10"
                  style={{ backgroundColor: 'white' }}
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
              {showProfessorDropdown && filteredProfessors.length > 0 && (
                <div className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto" style={{ backgroundColor: '#f9f5f2' }}>
                  {filteredProfessors.map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => handleProfessorSelect(prof.name)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {prof.name}
                    </button>
                  ))}
                </div>
              )}
              
              {/* No results message */}
              {showProfessorDropdown && professorSearch.trim() && filteredProfessors.length === 0 && (
                <div className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md shadow-lg p-4 text-gray-500 text-center" style={{ backgroundColor: '#f9f5f2' }}>
                  No professors found matching "{professorSearch}"
                </div>
              )}
            </div>

            <div>
              <Label>Course <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.course_name} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, course_name: value }))}
                disabled={!formData.professor_name}
              >
                <SelectTrigger className="mt-2" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder={formData.professor_name ? "Select course" : "Select professor first"} />
                </SelectTrigger>
                <SelectContent>
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

          {/* Semester, Year, Grade - Horizontal Layout */}
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <Label>Semester <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.semester} 
                onValueChange={(value: 'Fall' | 'Winter' | 'Spring' | 'Summer') => 
                  setFormData(prev => ({ ...prev, semester: value }))
                }
              >
                <SelectTrigger className="mt-2" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fall">Fall</SelectItem>
                  <SelectItem value="Winter">Winter</SelectItem>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year <span style={{ color: '#752531' }}>*</span></Label>
              <Input className="mt-2"
                type="number"
                placeholder="2025"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value || '2025' }))}
                style={{ backgroundColor: 'white' }}
              />
            </div>

            <div>
              <Label>Grade Received <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.grade} 
                onValueChange={(value: 'DS' | 'H' | 'P') => 
                  setFormData(prev => ({ ...prev, grade: value }))
                }
              >
                <SelectTrigger className="mt-2" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DS">DS (Distinction)</SelectItem>
                  <SelectItem value="H">H (Honors)</SelectItem>
                  <SelectItem value="P">P (Pass)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="mt-2">
            <Label>Overall Rating (1-10) <span style={{ color: '#752531' }}>*</span></Label>
            <div className="flex items-center gap-2 mt-2">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, overall_rating: i + 1 }))}
                  className={`w-8 h-8 rounded border ${
                    i < formData.overall_rating 
                      ? 'bg-[#752432] border-[#752432] text-white' 
                      : 'bg-white border-gray-300 hover:border-[#752432]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Other Ratings */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <Label>Readings (1-10) <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.readings_rating.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, readings_rating: parseInt(value) }))}
              >
                <SelectTrigger className="mt-2" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cold Calls (1-10) <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.cold_calls_rating.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, cold_calls_rating: parseInt(value) }))}
              >
                <SelectTrigger className="mt-2" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Exams (1-10) <span style={{ color: '#752531' }}>*</span></Label>
              <Select 
                value={formData.exam_rating.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, exam_rating: parseInt(value) }))}
              >
                <SelectTrigger className="mt-2" style={{ backgroundColor: 'white' }}>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Review Text - Horizontal Layout */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label>Overall Review <span style={{ color: '#752531' }}>*</span></Label>
              <Textarea className="mt-2"
                placeholder=""
                value={formData.overall_review}
                onChange={(e) => setFormData(prev => ({ ...prev, overall_review: e.target.value }))}
                rows={2}
                style={{ backgroundColor: 'white' }}
              />
            </div>

            <div>
              <Label>Readings Review <span style={{ color: '#752531' }}>*</span></Label>
              <Textarea className="mt-2"
                placeholder=""
                value={formData.readings_review}
                onChange={(e) => setFormData(prev => ({ ...prev, readings_review: e.target.value }))}
                rows={2}
                style={{ backgroundColor: 'white' }}
              />
            </div>

            <div>
              <Label>Cold Calls Review <span style={{ color: '#752531' }}>*</span></Label>
              <Textarea className="mt-2"
                placeholder=""
                value={formData.cold_calls_review}
                onChange={(e) => setFormData(prev => ({ ...prev, cold_calls_review: e.target.value }))}
                rows={2}
                style={{ backgroundColor: 'white' }}
              />
            </div>

            <div>
              <Label>Exam Review <span style={{ color: '#752531' }}>*</span></Label>
              <Textarea className="mt-2"
                placeholder=""
                value={formData.exam_review}
                onChange={(e) => setFormData(prev => ({ ...prev, exam_review: e.target.value }))}
                rows={2}
                style={{ backgroundColor: 'white' }}
              />
            </div>
          </div>

          {/* Switches - Horizontal Layout */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.laptops_allowed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, laptops_allowed: checked }))}
              />
              <Label>Laptops Allowed <span style={{ color: '#752531' }}>*</span></Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.has_cold_calls}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_cold_calls: checked }))}
              />
              <Label>Has Cold Calls <span style={{ color: '#752531' }}>*</span></Label>
            </div>
          </div>

          {/* Assessment Type */}
          <div className="pt-2 mt-2">
            <Label className="block mb-2">Assessment Type <span style={{ color: '#752531' }}>*</span></Label>
            <Select 
              value={formData.assessment_type} 
              onValueChange={(value: 'Project' | 'Final Exam' | 'Both') => 
                setFormData(prev => ({ ...prev, assessment_type: value }))
              }
            >
              <SelectTrigger className="w-full mt-2" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Select assessment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Project">Project</SelectItem>
                <SelectItem value="Final Exam">Final Exam</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowReviewForm(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={formLoading || !formData.overall_review.trim() || !formData.readings_review.trim() || !formData.cold_calls_review.trim() || !formData.exam_review.trim() || !formData.professor_name || !formData.course_name || !formData.semester || !formData.year || !formData.grade || formData.overall_rating === 0 || formData.readings_rating === 0 || formData.cold_calls_rating === 0 || formData.exam_rating === 0 || !formData.assessment_type}
              className="bg-[#752432] hover:bg-[#752432]/90"
            >
              {formLoading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
