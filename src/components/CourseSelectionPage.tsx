import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ClassSelector } from './onboarding/ClassSelector';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';

type ClassYear = '1L' | '2L' | '3L';

interface SelectedClass {
  lawClass: LawClass | null;
  professor: Professor | null;
  scheduleOption: CourseSchedule | null;
}

interface CourseSchedule {
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

interface CourseSelectionPageProps {
  onBack: () => void;
  onComplete: () => void;
}

export function CourseSelectionPage({ onBack, onComplete }: CourseSelectionPageProps) {
  const { user } = useAuth();
  const [section, setSection] = useState<string>('');
  const [classYear, setClassYear] = useState<ClassYear | ''>('');
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

  // Fetch user's current profile data to pre-populate class year and section
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('class_year, section, classes')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        if (profile) {
          setClassYear(profile.class_year || '');
          setSection(profile.section || '');
          
          // Pre-populate selected classes if they exist
          if (profile.classes && Array.isArray(profile.classes)) {
            const newSelectedClasses = Array(10)
              .fill(null)
              .map(() => ({
                lawClass: null,
                professor: null,
                scheduleOption: null,
              }));

            profile.classes.forEach((classData: any, index: number) => {
              if (index < 10 && classData.class && classData.professor) {
                // Create LawClass object
                const lawClass: LawClass = {
                  id: `${classData.class}-${index}`,
                  name: classData.class,
                  professors: [{
                    id: classData.professor,
                    name: classData.professor
                  }]
                };

                // Create Professor object
                const professor: Professor = {
                  id: classData.professor,
                  name: classData.professor
                };

                newSelectedClasses[index] = {
                  lawClass,
                  professor,
                  scheduleOption: classData.schedule || null
                };
              }
            });

            setSelectedClasses(newSelectedClasses);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch courses from API for all students (1L, 2L, 3L)
  useEffect(() => {
    const fetchCourses = async () => {
      if (classYear === '1L' || classYear === '2L' || classYear === '3L') {
        setCoursesLoading(true);
        try {
          console.log(
            'Fetching all courses from API for',
            classYear,
            'students...'
          );

          // Query Supabase directly for ALL course data including schedule details
          console.log('Making Supabase query...');
          const { data: courses, error } = await supabase
            .from('Courses')
            .select(
              'course_number, course_name, instructor, credits, days, times, location, semester'
            )
            .order('course_name');

          console.log('Supabase query completed:', { courses, error });

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          console.log('Raw courses from API:', {
            count: courses?.length || 0,
            courses: courses,
            firstFew: courses?.slice(0, 3),
          });

          // Store the full course data for later use
          setAllCourseData(courses || []);

          // Transform the data to match the expected format for the frontend
          // Group courses by name and collect unique instructors as "professors"
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

            // Add instructor(s) as professor(s) - treat semicolon-separated professors as one team
            const courseData = courseMap.get(courseName);
            if (course.instructor) {
              const instructor = course.instructor.trim();
              
              if (instructor && !courseData.professors.find((p: any) => p.name === instructor)) {
                courseData.professors.push({
                  id: `${course.course_number}-${instructor}`,
                  name: instructor, // Keep semicolons to match database format
                });
              }
            }
          });

          const transformedCourses = Array.from(courseMap.values());
          console.log(
            'Transformed courses for dropdown:',
            transformedCourses.length,
            transformedCourses.map((c) => c.name)
          );
          setApiCourses(transformedCourses);
        } catch (error) {
          console.error('Error fetching courses:', error);
          setApiCourses([]);
          setAllCourseData([]);
        } finally {
          setCoursesLoading(false);
        }
      } else {
        // Clear courses when not 2L/3L
        setApiCourses([]);
        setAllCourseData([]);
      }
    };

    fetchCourses();
  }, [classYear]);

  // Auto-populate 1L required courses when section is selected
  useEffect(() => {
    let isMounted = true;
    
    const autoPopulate1L = () => {
      if (classYear === '1L' && section && allCourseData.length > 0 && isMounted) {
        console.log('Auto-populating 1L Section', section, 'courses...');
        
        // Define the 7 required courses with dynamic section number
        const sectionNumber = section;
        const requiredCourses = [
          `Civil Procedure ${sectionNumber}`,
          `Contracts ${sectionNumber}`, 
          `Criminal Law ${sectionNumber}`,
          `Torts ${sectionNumber}`,
          `Constitutional Law ${sectionNumber}`,
          `Property ${sectionNumber}`,
          `Legislation and Regulation ${sectionNumber}`
        ];

        // Create new selected classes array
        const newSelectedClasses = Array(8)
          .fill(null)
          .map(() => ({
            lawClass: null,
            professor: null,
            scheduleOption: null,
          }));

        // Auto-populate the first 7 slots with required courses
        for (let i = 0; i < 7; i++) {
          const courseName = requiredCourses[i];
          
          console.log(`Processing slot ${i}: ${courseName}`);
          
          // Find matching course in the Courses table
          const matchingCourses = allCourseData.filter(
            (course) => course.course_name === courseName
          );

          console.log(`Found ${matchingCourses.length} matches for ${courseName}:`, matchingCourses);

          if (matchingCourses.length > 0) {
            const course = matchingCourses[0];
            
            // Create LawClass object
            const lawClass: LawClass = {
              id: course.course_number?.toString() || courseName,
              name: course.course_name,
              professors: [{
                id: course.instructor,
                name: course.instructor
              }]
            };

            // Auto-select the professor
            const professor: Professor = {
              id: course.instructor,
              name: course.instructor
            };

            // Create schedule directly from course data (synchronous)
            const scheduleOption = course.days && course.times ? {
              course_number: course.course_number,
              course_name: course.course_name,
              semester: course.semester,
              instructor: course.instructor,
              credits: course.credits,
              days: course.days.split(';').map((d: string) => d.trim()).join(' • '),
              times: course.times.split(';').map((t: string) => t.trim())[0] || 'TBD',
              location: course.location || 'Location TBD'
            } : null;

            newSelectedClasses[i] = {
              lawClass,
              professor,
              scheduleOption
            };

            console.log(`✅ Auto-populated slot ${i} (${courseName}):`, {
              course: courseName,
              professor: course.instructor,
              schedule: scheduleOption ? `${scheduleOption.days} • ${scheduleOption.times}` : 'No schedule',
              fullData: newSelectedClasses[i]
            });
          } else {
            console.log(`❌ No matches found for ${courseName}`);
          }
        }

        // Only update state if component is still mounted and section hasn't changed
        if (isMounted && section === sectionNumber) {
          console.log('Setting state for section', section, 'with classes:', newSelectedClasses.map((c, i) => ({
            slot: i,
            course: c.lawClass?.name,
            professor: c.professor?.name,
            hasSchedule: !!c.scheduleOption
          })));
          
          // Set all state at once to prevent any glitching
          setSelectedClasses([...newSelectedClasses]);
          setScheduleOptionsBySlot({});
          setScheduleLoadingBySlot({});
          
          console.log('1L Section', section, 'auto-population complete');
        } else {
          console.log('Skipping state update - isMounted:', isMounted, 'section match:', section === sectionNumber);
        }
      }
    };

    autoPopulate1L();
    
    // Cleanup function to prevent state updates after component unmounts or section changes
    return () => {
      isMounted = false;
    };
  }, [classYear, section, allCourseData]);

  // Initialize course selection state based on class year (only run once when class year is loaded)
  useEffect(() => {
    if (classYear) {
      console.log('Initializing course selection for class year:', classYear);

      // Set up the correct number of slots based on class year
      if (classYear === '1L') {
        // 1L: 7 required + 1 optional = 8 total
        const newSelectedClasses = Array(8)
          .fill(null)
          .map(() => ({
            lawClass: null,
            professor: null,
            scheduleOption: null,
          }));
        setSelectedClasses(newSelectedClasses);
      } else if (classYear === '2L' || classYear === '3L') {
        // 2L/3L: 3 required + up to 7 more = 10 total maximum
        const newSelectedClasses = Array(10)
          .fill(null)
          .map(() => ({
            lawClass: null,
            professor: null,
            scheduleOption: null,
          }));
        setSelectedClasses(newSelectedClasses);
      }

      console.log('Initialized course selection state for class year:', classYear);
    }
  }, [classYear]);

  const getAvailableClassesForSlot = (excludeIds: string[]): LawClass[] => {
    // Return empty array if no class year is selected
    if (!classYear) {
      return [];
    }

    // All class years (1L, 2L, 3L): Use API data from Supabase
    console.log('Getting available classes for', classYear, ':', {
      classYear,
      apiCoursesCount: apiCourses.length,
      apiCourseNames: apiCourses.map((c) => c.name),
      coursesLoading,
    });
    return apiCourses; // Return the fetched courses directly
  };

  // Get course schedule details from the already fetched data (no API call needed)
  const fetchCourseDetails = async (
    courseName: string,
    instructor: string,
    slotIndex: number
  ) => {
    console.log('Getting schedule details for:', {
      courseName,
      instructor,
      classYear,
      slotIndex,
    });

    // Set loading state for this specific slot
    setScheduleLoadingBySlot((prev) => ({ ...prev, [slotIndex]: true }));

    try {
      // All class years (1L, 2L, 3L): Filter from the already fetched course data
      console.log('Schedule matching for', classYear, ':', {
        courseName,
        instructor, // Display name (keeps semicolons)
        allCourseDataCount: allCourseData.length,
        sampleInstructors: allCourseData.slice(0, 3).map(c => ({ name: c.course_name, instructor: c.instructor }))
      });
      
      const matchingCourses = allCourseData.filter(
        (course) =>
          course.course_name === courseName &&
          course.instructor === instructor
      );
      
      console.log('Matching courses found:', matchingCourses.length, matchingCourses);

      console.log(
        'Found matching schedules from stored data:',
        matchingCourses
      );

      // Create combined schedule options - combine multiple days/times into single display
      const scheduleOptions: CourseSchedule[] = [];

      matchingCourses.forEach((course: any) => {
        if (course.days && course.times) {
          const days = course.days
            .split(';')
            .map((d: string) => d.trim())
            .filter(Boolean);
          const times = course.times
            .split(';')
            .map((t: string) => t.trim())
            .filter(Boolean);

          // Combine all days and use the first time (assuming same time for all days)
          const combinedDays = days.join(' • ');
          const time = times[0] || 'TBD';

          scheduleOptions.push({
            course_number: course.course_number,
            course_name: course.course_name,
            semester: course.semester,
            instructor: course.instructor,
            credits: course.credits,
            days: combinedDays, // "Mon • Wed" instead of separate entries
            times: time,
            location: course.location,
          });
        } else {
          // If no days/times, create a single schedule option
          scheduleOptions.push({
            course_number: course.course_number,
            course_name: course.course_name,
            semester: course.semester,
            instructor: course.instructor,
            credits: course.credits,
            days: course.days || 'TBD',
            times: course.times || 'TBD',
            location: course.location,
          });
        }
      });

      console.log(
        'Processed schedule options for slot',
        slotIndex,
        ':',
        scheduleOptions
      );

      // Store schedule options for this specific slot
      setScheduleOptionsBySlot((prev) => ({
        ...prev,
        [slotIndex]: scheduleOptions,
      }));

      // Simulate brief delay for UX
      await new Promise((resolve) => setTimeout(resolve, 200));

      return scheduleOptions;
    } catch (error) {
      console.error('Error getting course details:', error);
      setScheduleOptionsBySlot((prev) => ({ ...prev, [slotIndex]: [] }));
      return [];
    } finally {
      setScheduleLoadingBySlot((prev) => ({ ...prev, [slotIndex]: false }));
    }
  };

  const handleClassChange = async (index: number, lawClass: LawClass | null) => {
    console.log('Class change:', {
      index,
      lawClass: lawClass?.name,
      lawClassId: lawClass?.id,
      hasProfessors: lawClass?.professors?.length,
      professorNames: lawClass?.professors?.map((p) => p.name),
      classYear,
      fullLawClass: lawClass,
    });
    
    // Skip handling for 1L required courses (slots 0-6) as they are auto-populated
    if (classYear === '1L' && index < 7) {
      console.log('Skipping handleClassChange for 1L required course slot', index);
      return;
    }
    
    const newSelectedClasses = [...selectedClasses];

    // Auto-select first professor for all class years (1L, 2L, 3L)
    let selectedProfessor = null;
    if (lawClass && lawClass.professors && lawClass.professors.length > 0) {
      selectedProfessor = lawClass.professors[0];
      console.log('Auto-selecting first professor for', classYear, ':', selectedProfessor.name);
    }
    
    newSelectedClasses[index] = {
      lawClass,
      professor: selectedProfessor,
      scheduleOption: null,
    };
    setSelectedClasses(newSelectedClasses);

    // Clear schedule options when class changes
    setScheduleOptionsBySlot((prev) => ({ ...prev, [index]: [] }));
    
    // Auto-fetch schedule for all class years after auto-selecting professor
    if (lawClass && selectedProfessor) {
      console.log('Auto-fetching schedule for', classYear, 'class:', lawClass.name, 'with professor:', selectedProfessor.name);
      await fetchCourseDetails(lawClass.name, selectedProfessor.name, index);
    }
    
    console.log(
      'Updated selectedClasses:',
      newSelectedClasses.map((sc, i) => ({
        index: i,
        hasClass: !!sc.lawClass,
        className: sc.lawClass?.name,
        hasProfessors: sc.lawClass?.professors?.length,
        professorNames: sc.lawClass?.professors?.map((p) => p.name),
        hasProfessor: !!sc.professor,
        professorName: sc.professor?.name,
      }))
    );
  };

  const handleProfessorChange = async (
    index: number,
    professor: Professor | null
  ) => {
    console.log('Professor change:', {
      index,
      professor: professor?.name,
      classYear,
    });
    
    // Skip handling for 1L required courses (slots 0-6) as they are auto-populated
    if (classYear === '1L' && index < 7) {
      console.log('Skipping handleProfessorChange for 1L required course slot', index);
      return;
    }
    
    const newSelectedClasses = [...selectedClasses];
    newSelectedClasses[index] = {
      ...newSelectedClasses[index],
      professor,
      scheduleOption: null,
    };
    setSelectedClasses(newSelectedClasses);

    // For all students, fetch course schedule options after professor selection
    if (professor && newSelectedClasses[index].lawClass) {
      await fetchCourseDetails(
        newSelectedClasses[index].lawClass!.name,
        professor.name,
        index
      );
    } else {
      // Clear schedule options when professor is deselected
      setScheduleOptionsBySlot((prev) => ({ ...prev, [index]: [] }));
    }

    console.log(
      'Updated selectedClasses after professor change:',
      newSelectedClasses.map((sc, i) => ({
        index: i,
        hasClass: !!sc.lawClass,
        className: sc.lawClass?.name,
        hasProfessor: !!sc.professor,
        professorName: sc.professor?.name,
      }))
    );
  };

  const isFormValid = () => {
    console.log('=== FORM VALIDATION START ===');
    console.log('Form data:', {
      section,
      classYear,
      selectedClassesLength: selectedClasses.length,
    });

    // Require section and class year
    if (!section) {
      console.log('Form invalid: missing section', { section });
      return false;
    }

    if (!classYear) {
      console.log('Form invalid: missing class year', { classYear });
      return false;
    }

    // Different requirements for 1L vs 2L/3L
    if (classYear === '1L') {
      // 1L: 7 required + 1 optional = 8 total
      const requiredClasses = selectedClasses
        .slice(0, 7)
        .filter((selected) => selected.lawClass && selected.professor);
      const optionalClass = selectedClasses[7];
      const totalClasses = requiredClasses.length + (optionalClass?.lawClass ? 1 : 0);

      console.log('1L Validation:', {
        requiredClasses: requiredClasses.length,
        optionalClass: !!optionalClass?.lawClass,
        totalClasses,
        selectedClasses: selectedClasses.map((sc, i) => ({
          index: i,
          hasClass: !!sc.lawClass,
          hasProfessor: !!sc.professor,
        })),
      });

      const isValid = requiredClasses.length === 7; // Optional class is truly optional
      console.log('1L Validation result:', {
        requiredClasses: requiredClasses.length,
        optionalClass: !!optionalClass?.lawClass,
        totalClasses,
        isValid,
      });
      return isValid;
    } else {
      // 2L/3L: minimum 3, maximum 10
      const requiredClasses = selectedClasses
        .slice(0, 3)
        .filter((selected) => selected.lawClass && selected.professor);
      const optionalClasses = selectedClasses
        .slice(3)
        .filter((selected) => selected.lawClass);
      const totalClasses = requiredClasses.length + optionalClasses.length;

      console.log(classYear, 'Validation:', {
        requiredClasses: requiredClasses.length,
        optionalClasses: optionalClasses.length,
        totalClasses,
        selectedClasses: selectedClasses.map((sc, i) => ({
          index: i,
          hasClass: !!sc.lawClass,
          hasProfessor: !!sc.professor,
        })),
      });

      const isValid =
        requiredClasses.length === 3 && totalClasses >= 3 && totalClasses <= 10;
      console.log(classYear, 'Validation result:', {
        requiredClasses: requiredClasses.length,
        totalClasses,
        isValid,
      });
      return isValid;
    }

    console.log('Form invalid: unknown class year', { classYear });
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (!user?.email) {
        throw new Error(
          'User email not found. Please log out and log in again.'
        );
      }

      // Update profile data with new course selections
      const profileData = {
        id: user.id,
        email: user.email || '', // Include email from authenticated user
        section,
        class_year: classYear,
        classes: selectedClasses
          .filter((selected) => selected.lawClass && selected.professor)
          .map((selected) => ({
            class: selected.lawClass!.name,
            professor: selected.professor!.name,
            schedule: selected.scheduleOption,
          })),
        classes_filled: true, // Mark that classes have been filled
        updated_at: new Date().toISOString(),
      };

      console.log(
        'Attempting to update profile data:',
        JSON.stringify(profileData, null, 2)
      );

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        console.error('Detailed Supabase error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          fullError: profileError,
        });
        throw new Error(
          profileError.message ||
            profileError.details ||
            JSON.stringify(profileError)
        );
      }

      console.log('Course selection updated successfully');

      // Complete course selection
      onComplete();
    } catch (error) {
      console.error('Error updating course selection:', error);
      alert(
        `Error updating your courses: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh', overflow: 'visible' }}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">
            Update Course Selection
          </h1>
          <p className="text-gray-600">
            Modify your academic course selections
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-center text-gray-900">
              Course Selection
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Class Year and Section Selection */}
              <div className="flex justify-center gap-6">
                <div className="space-y-2 w-64">
                  <Label htmlFor="classYear">
                    Class Year<span style={{ color: '#752432' }}>*</span>
                  </Label>
                  <div className="min-h-[40px] py-2 px-3 bg-input-background border border-gray-200 rounded-md text-sm text-gray-700 flex items-center">
                    {classYear ? `${classYear} (${classYear === '1L' ? 'First Year' : classYear === '2L' ? 'Second Year' : 'Third Year'})` : 'Loading...'}
                  </div>
                </div>

                <div className="space-y-2 w-64">
                  <Label htmlFor="section">
                    Section<span style={{ color: '#752432' }}>*</span>
                  </Label>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger className="bg-input-background">
                      <SelectValue placeholder="Select your section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Section 1</SelectItem>
                      <SelectItem value="2">Section 2</SelectItem>
                      <SelectItem value="3">Section 3</SelectItem>
                      <SelectItem value="4">Section 4</SelectItem>
                      <SelectItem value="5">Section 5</SelectItem>
                      <SelectItem value="6">Section 6</SelectItem>
                      <SelectItem value="7">Section 7</SelectItem>
                      {(classYear === '2L' || classYear === '3L') && (
                        <SelectItem value="8">Section 8</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Class Selection */}
              {classYear && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-xl text-gray-900 mb-2">
                      Course Selection
                    </h3>

                    {/* Requirements Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-900">
                          Requirements:
                        </span>
                      </div>
                      <div className="text-sm text-blue-800">
                        {classYear === '1L' ? (
                          <span>7 required courses + 1 elective</span>
                        ) : (
                          <span>Minimum 3, Maximum 10</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedClasses
                        .slice(0, classYear === '1L' ? 8 : 10)
                        .map((selectedClass, index) => {
                        // Get IDs of classes selected in other slots
                        const otherSelectedClassIds = selectedClasses
                          .map((sc, i) =>
                            i !== index && sc.lawClass ? sc.lawClass.id : null
                          )
                          .filter(Boolean) as string[];

                        // Get available classes for this slot
                        const availableClasses = getAvailableClassesForSlot(
                          otherSelectedClassIds
                        );

                        // Determine if this slot is required
                        const isRequired =
                          classYear === '1L' ? index < 7 : index < 3; // Elective (index 7) is optional for 1L

                        return coursesLoading &&
                          (classYear === '2L' || classYear === '3L') ? (
                          <div
                            key={`${classYear}-${index}`}
                            className="flex items-center justify-center p-4"
                          >
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            <span className="ml-2 text-gray-500">
                              Loading courses...
                            </span>
                          </div>
                        ) : (
                          <ClassSelector
                            key={`${classYear}-${index}`}
                            index={index}
                            selectedClass={selectedClass.lawClass}
                            selectedProfessor={selectedClass.professor}
                            selectedSchedule={selectedClass.scheduleOption}
                            availableClasses={availableClasses}
                            scheduleOptions={scheduleOptionsBySlot[index] || []}
                            scheduleLoading={
                              scheduleLoadingBySlot[index] || false
                            }
                            onClassChange={(lawClass) =>
                              handleClassChange(index, lawClass)
                            }
                            onProfessorChange={(professor) =>
                              handleProfessorChange(index, professor)
                            }
                            isReadOnly={classYear === '1L' && index < 7}
                            isRequired={isRequired}
                            classYear={classYear}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress and Submit */}
              <div className="pt-6 border-t">
                {/* Progress Counter - only show when class year is selected */}
                {classYear && (
                  <div className="mb-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-full">
                      <span className="text-sm text-gray-600">
                        {classYear === '1L' ? (
                          <>
                            Required:{' '}
                            {
                              selectedClasses
                                .slice(0, 7)
                                .filter(
                                  (selected) =>
                                    selected.lawClass && selected.professor
                                ).length
                            }
                            /7, Optional:{' '}
                            {selectedClasses[7]?.lawClass ? '1' : '0'}/1
                          </>
                        ) : (
                          <>
                            Classes Selected:{' '}
                            {
                              selectedClasses
                                .filter((selected) => selected.lawClass).length
                            }
                            /10
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!isFormValid() || loading}
                    className="text-white px-8 py-2 disabled:opacity-50 rounded-lg"
                    style={{ backgroundColor: '#752432' }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.backgroundColor =
                        '#5a1a25')
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.backgroundColor =
                        '#752432')
                    }
                  >
                    {loading ? 'Updating...' : 'Update Courses'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
