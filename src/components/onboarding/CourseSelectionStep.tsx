import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { ClassSelector } from './ClassSelector';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type ClassYear = '1L' | '2L' | '3L' | 'LLM';

interface SelectedClass {
  lawClass: LawClass | null;
  professor: Professor | null;
  scheduleOption: CourseSchedule | null;
}

interface CourseSchedule {
  id?: string;
  course_number: number;
  course_name: string;
  semester: string;
  instructor: string;
  credits: number;
  days: string;
  times: string;
  location: string;
}

interface LawClass {
  id: string;
  name: string;
  professors: Professor[];
}

interface Professor {
  id: string;
  name: string;
}

interface CourseSelectionStepProps {
  onNext: (selectedClasses: SelectedClass[]) => void;
  onBack: () => void;
  basicInfo: {
    fullName: string;
    phone: string;
    classYear: ClassYear;
    section: string;
  };
}

export function CourseSelectionStep({ onNext, onBack, basicInfo }: CourseSelectionStepProps) {
  const { user } = useAuth();
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>(
    Array(10)
      .fill(null)
      .map(() => ({
        lawClass: null,
        professor: null,
        scheduleOption: null,
      }))
  );
  const [loading, setLoading] = useState(false);
  const [apiCourses, setApiCourses] = useState<LawClass[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [scheduleOptionsBySlot, setScheduleOptionsBySlot] = useState<{
    [key: number]: CourseSchedule[];
  }>({});
  const [scheduleLoadingBySlot, setScheduleLoadingBySlot] = useState<{
    [key: number]: boolean;
  }>({});
  const [allCourseData, setAllCourseData] = useState<any[]>([]);

  // Fetch courses from API for all students (1L, 2L, 3L, LLM)
  useEffect(() => {
    const fetchCourses = async () => {
      if (basicInfo.classYear === '1L' || basicInfo.classYear === '2L' || basicInfo.classYear === '3L' || basicInfo.classYear === 'LLM') {
        setCoursesLoading(true);
        setApiCourses([]);
        setAllCourseData([]);
        try {
          const { data: courses, error } = await supabase
            .from('Courses')
            .select('id, course_number, course_name, instructor, credits, days, times, location, semester')
            .order('course_name');

          if (error) {
            console.error('Supabase error:', error?.message || "Unknown error");
            throw error;
          }

          setAllCourseData(courses || []);

          // Transform the data to match the expected format for the frontend
          const courseMap = new Map();

          courses?.forEach((course: any) => {
            const courseName = course.course_name;

            if (!courseMap.has(courseName)) {
              courseMap.set(courseName, {
                id: course.course_number.toString(),
                name: courseName,
                professors: [],
              });
            }

            const courseData = courseMap.get(courseName);
            if (course.instructor) {
              const instructor = course.instructor.trim();
              
              if (instructor && !courseData.professors.find((p: any) => p.name === instructor)) {
                courseData.professors.push({
                  id: `${course.course_number}-${instructor}`,
                  name: instructor,
                });
              }
            }
          });

          const transformedCourses = Array.from(courseMap.values());
          setApiCourses(transformedCourses);
        } catch (error) {
          console.error('Error fetching courses:', error?.message || "Unknown error");
          setApiCourses([]);
          setAllCourseData([]);
        } finally {
          setCoursesLoading(false);
        }
      }
    };

    fetchCourses();
  }, [basicInfo.classYear]);

  // Auto-populate 1L required courses when section is selected
  useEffect(() => {
    let isMounted = true;
    
    const autoPopulate1L = () => {
      if (basicInfo.classYear === '1L' && basicInfo.section && allCourseData.length > 0 && isMounted) {
        const sectionNumber = basicInfo.section;
        const requiredCourses = [
          `Civil Procedure ${sectionNumber}`,
          `Contracts ${sectionNumber}`, 
          `Criminal Law ${sectionNumber}`,
          `Torts ${sectionNumber}`,
          `Constitutional Law ${sectionNumber}`,
          `Property ${sectionNumber}`,
          `Legislation and Regulation ${sectionNumber}`
        ];

        const newSelectedClasses = Array(8)
          .fill(null)
          .map(() => ({
            lawClass: null,
            professor: null,
            scheduleOption: null,
          }));

        for (let i = 0; i < 7; i++) {
          const courseName = requiredCourses[i];
          
          const matchingCourses = allCourseData.filter(
            (course) => course.course_name === courseName
          );

          if (matchingCourses.length > 0) {
            const course = matchingCourses[0];
            
            const lawClass: LawClass = {
              id: course.course_number?.toString() || courseName,
              name: course.course_name,
              professors: [{
                id: course.instructor,
                name: course.instructor
              }]
            };

            const professor: Professor = {
              id: course.instructor,
              name: course.instructor
            };

            const scheduleOption = course.days && course.times ? {
              course_number: course.course_number,
              course_name: course.course_name,
              semester: course.semester,
              instructor: course.instructor,
              credits: course.credits,
              days: course.days.split(';').map((d: string) => d.trim()).join(' • '),
              times: course.times.split('|').map((t: string) => t.trim())[0] || 'TBD',
              location: course.location || 'Location TBD'
            } : null;

            newSelectedClasses[i] = {
              lawClass,
              professor,
              scheduleOption
            };
          }
        }

        if (isMounted && basicInfo.section === sectionNumber) {
          setSelectedClasses([...newSelectedClasses]);
          setScheduleOptionsBySlot({});
          setScheduleLoadingBySlot({});
        }
      }
    };

    autoPopulate1L();
    
    return () => {
      isMounted = false;
    };
  }, [basicInfo.classYear, basicInfo.section, allCourseData]);

  // Handle class year changes
  useEffect(() => {
    if (basicInfo.classYear === '1L') {
      const newSelectedClasses = Array(8)
        .fill(null)
        .map(() => ({
          lawClass: null,
          professor: null,
          scheduleOption: null,
        }));
      setSelectedClasses(newSelectedClasses);
    } else if (basicInfo.classYear === '2L' || basicInfo.classYear === '3L' || basicInfo.classYear === 'LLM') {
      const newSelectedClasses = Array(10)
        .fill(null)
        .map(() => ({
          lawClass: null,
          professor: null,
          scheduleOption: null,
        }));
      setSelectedClasses(newSelectedClasses);
    }

    setScheduleOptionsBySlot({});
    setScheduleLoadingBySlot({});
  }, [basicInfo.classYear]);

  const getAvailableClassesForSlot = (excludeIds: string[]): LawClass[] => {
    if (!basicInfo.classYear) {
      return [];
    }
    return apiCourses;
  };

  const handleClassChange = async (index: number, lawClass: LawClass | null) => {
    if (basicInfo.classYear === '1L' && index < 7) {
      return;
    }
    
    const newSelectedClasses = [...selectedClasses];

    let selectedProfessor = null;
    if (lawClass && lawClass.professors && lawClass.professors.length > 0) {
      selectedProfessor = lawClass.professors[0];
    }
    
    newSelectedClasses[index] = {
      lawClass,
      professor: selectedProfessor,
      scheduleOption: null,
    };
    setSelectedClasses(newSelectedClasses);

    setScheduleOptionsBySlot((prev) => ({ ...prev, [index]: [] }));
    
        if (lawClass && selectedProfessor && ((basicInfo.classYear === '2L' || basicInfo.classYear === '3L' || basicInfo.classYear === 'LLM') || (basicInfo.classYear === '1L' && index === 7))) {
      const matchingCourses = allCourseData.filter(
        (course) => course.course_name === lawClass.name && course.instructor === selectedProfessor.name
      );
      
      if (matchingCourses.length > 0) {
        const course = matchingCourses[0];
        
            const scheduleOption = course.days && course.times ? {
          id: course.id,
          course_number: course.course_number,
          course_name: course.course_name,
          semester: course.semester,
          instructor: course.instructor,
          credits: course.credits,
          days: course.days.split(';').map((d: string) => d.trim()).join(' • '),
          times: course.times.split('|').map((t: string) => t.trim())[0] || 'TBD',
          location: course.location || 'Location TBD'
        } : null;
        
        newSelectedClasses[index] = {
          ...newSelectedClasses[index],
          scheduleOption
        };
        setSelectedClasses(newSelectedClasses);
      }
    }
  };

  const handleProfessorChange = async (index: number, professor: Professor | null) => {
    if (basicInfo.classYear === '1L' && index < 7) {
      return;
    }
    
    const newSelectedClasses = [...selectedClasses];
    newSelectedClasses[index] = {
      ...newSelectedClasses[index],
      professor,
      scheduleOption: null,
    };
    setSelectedClasses(newSelectedClasses);

    if (professor && newSelectedClasses[index].lawClass && ((basicInfo.classYear === '2L' || basicInfo.classYear === '3L' || basicInfo.classYear === 'LLM') || (basicInfo.classYear === '1L' && index === 7))) {
      const matchingCourses = allCourseData.filter(
        (course) => course.course_name === newSelectedClasses[index].lawClass!.name && course.instructor === professor.name
      );
      
      if (matchingCourses.length > 0) {
        const course = matchingCourses[0];
        
        const scheduleOption = course.days && course.times ? {
        id: course.id,
          course_number: course.course_number,
          course_name: course.course_name,
          semester: course.semester,
          instructor: course.instructor,
          credits: course.credits,
          days: course.days.split(';').map((d: string) => d.trim()).join(' • '),
          times: course.times.split('|').map((t: string) => t.trim())[0] || 'TBD',
          location: course.location || 'Location TBD'
        } : null;
        
        newSelectedClasses[index] = {
          ...newSelectedClasses[index],
          scheduleOption
        };
        setSelectedClasses(newSelectedClasses);
      }
    } else {
      setScheduleOptionsBySlot((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const isFormValid = () => {
    if (!basicInfo.classYear) return false;

    if (basicInfo.classYear === '1L') {
      const requiredClasses = selectedClasses
        .slice(0, 7)
        .filter((selected) => selected.lawClass && selected.professor);
      return requiredClasses.length === 7;
    } else {
      const requiredClasses = selectedClasses
        .slice(0, 3)
        .filter((selected) => selected.lawClass && selected.professor);
      const optionalClasses = selectedClasses
        .slice(3)
        .filter((selected) => selected.lawClass);
      const totalClasses = requiredClasses.length + optionalClasses.length;
      return requiredClasses.length === 3 && totalClasses >= 3 && totalClasses <= 10;
    }
  };

  const handleNext = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: basicInfo.fullName.trim(),
        phone: basicInfo.phone.trim() || null,
        section: basicInfo.section,
        class_year: basicInfo.classYear,
        classes: selectedClasses
          .filter((selected) => selected.lawClass && selected.professor)
          .map((selected) => {
            const classData: any = {
              class: selected.lawClass!.name,
              professor: selected.professor!.name,
              schedule: selected.scheduleOption,
            };
            // Only include course_id if it's a valid UUID
            if (selected.scheduleOption?.id) {
              classData.course_id = selected.scheduleOption.id;
            }
            return classData;
          }),
        classes_filled: true,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        throw new Error(profileError.message || 'Failed to save profile');
      }

      onNext(selectedClasses);
    } catch (error) {
      console.error('Error saving course selection:', error?.message || "Unknown error");
      alert(`Error saving your courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f9f5f0', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-1">
            <div className="flex justify-center">
              <img 
                src="/QUAD.svg" 
                alt="Quad Logo" 
                className="w-auto object-contain"
                style={{ height: '100px', marginTop: '10px' }}
              />
            </div>
          </div>
          <div style={{ height: '15px' }}></div>
          <h1 className="text-2xl text-gray-900 mb-1">
            Course Selection
          </h1>
          <p className="text-gray-600">Choose your courses and preview your schedule</p>
        </div>

        {/* Main Content - Absolute Positioned Layout */}
        <div className="relative w-full px-4">
          {/* Left Side - Course Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6 w-1/2">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Select Your Courses</h2>
            
            {/* Course Selection List */}
            <div className="space-y-4">
              {/* Sample Course Cards */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[#752432] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Torts</h3>
                    <p className="text-sm text-gray-600">Prof. Johnson • 4 credits</p>
                    <p className="text-xs text-gray-500">Mon, Wed, Fri 9:00-10:00 AM</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      Required
                    </span>
                    <button className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#752432] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-[#752432] opacity-0 hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[#752432] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Property</h3>
                    <p className="text-sm text-gray-600">Prof. Mock • 3 credits</p>
                    <p className="text-xs text-gray-500">Tue, Thu 6:00-8:00 PM</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      Elective
                    </span>
                    <button className="w-6 h-6 rounded-full border-2 border-[#752432] bg-[#752432] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[#752432] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Contracts</h3>
                    <p className="text-sm text-gray-600">Prof. Smith • 4 credits</p>
                    <p className="text-xs text-gray-500">Mon, Wed 2:00-3:30 PM</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      Required
                    </span>
                    <button className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#752432] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-[#752432] opacity-0 hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[#752432] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Criminal Law</h3>
                    <p className="text-sm text-gray-600">Prof. Davis • 3 credits</p>
                    <p className="text-xs text-gray-500">Tue, Thu 10:00-11:30 AM</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      Required
                    </span>
                    <button className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#752432] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-[#752432] opacity-0 hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Selected Courses:</span>
                <span className="font-medium text-[#752432]">1 of 4 required</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#752432] h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>

          {/* Right Side - Schedule Preview - Absolutely Positioned */}
          <div className="absolute top-0 right-0 bg-white rounded-lg shadow-sm p-6 w-1/2">
            <div className="flex items-center justify-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Fall 2025 Schedule</h2>
            </div>
            
            {/* New Schedule Layout */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex bg-[#752432] text-white">
                <div className="w-16 p-3 text-center font-medium border-r border-white/20">Time</div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <div key={day} className="flex-1 p-3 text-center font-medium border-r border-white/20 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Schedule Grid */}
              <div className="relative">
                {/* Time labels */}
                <div className="absolute left-0 top-0 w-16 bg-gray-100">
                  {Array.from({ length: 16 }, (_, i) => {
                    const hour = 6 + i;
                    const time = hour <= 12 ? `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}` : `${hour - 12}:00 PM`;
                    return (
                      <div key={hour} className="h-16 flex items-center justify-center text-xs text-gray-600 border-b border-gray-200">
                        {time}
                      </div>
                    );
                  })}
                </div>
                
                {/* Day columns */}
                <div className="ml-16 flex">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIndex) => (
                    <div key={day} className="flex-1 border-r border-gray-200 last:border-r-0">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div key={i} className="h-16 border-b border-gray-200 last:border-b-0"></div>
                      ))}
                    </div>
                  ))}
                </div>
                
                {/* Sample course blocks */}
                <div className="absolute left-16 top-0 right-0 h-full">
                  {/* Torts course - Mon, Wed, Fri 9:00-10:00 AM */}
                  <div 
                    className="absolute bg-[#752432] text-white rounded text-xs p-2 left-0 right-0 z-10"
                    style={{ 
                      top: '192px', // 3 hours * 64px = 192px (9:00 AM)
                      height: '58px', // 1 hour * 64px - 6px gap = 58px
                      width: 'calc(20% - 2px)',
                      marginLeft: '2px'
                    }}
                  >
                    <div className="font-medium">Torts</div>
                    <div className="text-xs opacity-90">Johnson</div>
                  </div>
                  
                  {/* Property course - Tue, Thu 6:00-8:00 PM */}
                  <div 
                    className="absolute bg-[#752432] text-white rounded text-xs p-2 left-0 right-0 z-10"
                    style={{ 
                      top: '768px', // 12 hours * 64px = 768px (6:00 PM)
                      height: '122px', // 2 hours * 64px - 6px gap = 122px
                      width: 'calc(20% - 2px)',
                      marginLeft: 'calc(20% + 2px)'
                    }}
                  >
                    <div className="font-medium">Property</div>
                    <div className="text-xs opacity-90">Mock</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons - Moved to Bottom */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={onBack}
              className="text-white px-6 py-2 rounded-lg"
              style={{ backgroundColor: '#752432' }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = '#5a1a25')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = '#752432')
              }
            >
              Back to Step 1
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isFormValid() || loading}
              className="text-white px-8 py-2 disabled:opacity-50 rounded-lg"
              style={{ backgroundColor: '#752432' }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = '#5a1a25')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = '#752432')
              }
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            <span className="text-sm text-gray-600">Step 2 of 2 - Course Selection</span>
          </div>
        </div>
      </div>
    </div>
  );
}