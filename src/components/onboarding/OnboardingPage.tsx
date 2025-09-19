import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ClassSelector } from './ClassSelector';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

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

// All course data now comes from Supabase - no hardcoded data needed
/*
const lawClasses: LawClass[] = [
  {
    id: '1',
    name: 'Civil Procedure (CivPro)',
    professors: [
      { id: '1', name: 'Professor Smith' },
      { id: '2', name: 'Professor Johnson' },
      { id: '73', name: 'Professor Williams' },
      { id: '74', name: 'Professor Brown' },
    ],
  },
  {
    id: '2',
    name: 'Constitutional Law (ConLaw)',
    professors: [
      { id: '3', name: 'Professor Brown' },
      { id: '4', name: 'Professor Davis' },
      { id: '75', name: 'Professor Wilson' },
      { id: '76', name: 'Professor Moore' },
    ],
  },
  {
    id: '3',
    name: 'Contracts',
    professors: [
      { id: '5', name: 'Professor Wilson' },
      { id: '6', name: 'Professor Miller' },
      { id: '77', name: 'Professor Taylor' },
      { id: '78', name: 'Professor Anderson' },
    ],
  },
  {
    id: '4',
    name: 'Criminal Law (CrimLaw)',
    professors: [
      { id: '7', name: 'Professor Taylor' },
      { id: '8', name: 'Professor Anderson' },
    ],
  },
  {
    id: '5',
    name: 'Legal Research and Writing (LRW)',
    professors: [
      { id: '9', name: 'Professor Thomas' },
      { id: '10', name: 'Professor Jackson' },
    ],
  },
  {
    id: '6',
    name: 'Property',
    professors: [
      { id: '11', name: 'Professor White' },
      { id: '12', name: 'Professor Harris' },
    ],
  },
  {
    id: '7',
    name: 'Torts',
    professors: [
      { id: '13', name: 'Professor Martin' },
      { id: '14', name: 'Professor Garcia' },
    ],
  },
  {
    id: '8',
    name: 'Legislation and Regulation (LegReg)',
    professors: [
      { id: '15', name: 'Professor Lee' },
      { id: '16', name: 'Professor Kim' },
    ],
  },
  // Elective courses for 1L students
  {
    id: '9',
    name: 'Administrative Law',
    professors: [
      { id: '17', name: 'Professor Adams' },
      { id: '18', name: 'Professor Baker' },
    ],
  },
  {
    id: '10',
    name: 'Antitrust Law',
    professors: [
      { id: '19', name: 'Professor Carter' },
      { id: '20', name: 'Professor Davis' },
    ],
  },
  {
    id: '11',
    name: 'Bankruptcy',
    professors: [
      { id: '21', name: 'Professor Evans' },
      { id: '22', name: 'Professor Foster' },
    ],
  },
  {
    id: '12',
    name: 'Business Taxation',
    professors: [
      { id: '23', name: 'Professor Green' },
      { id: '24', name: 'Professor Hall' },
    ],
  },
  {
    id: '13',
    name: 'Civil Rights Law',
    professors: [
      { id: '25', name: 'Professor Jones' },
      { id: '26', name: 'Professor King' },
    ],
  },
  {
    id: '14',
    name: 'Commercial Law',
    professors: [
      { id: '27', name: 'Professor Lewis' },
      { id: '28', name: 'Professor Moore' },
    ],
  },
  {
    id: '15',
    name: 'Competition Law',
    professors: [
      { id: '29', name: 'Professor Nelson' },
      { id: '30', name: 'Professor Parker' },
    ],
  },
  {
    id: '16',
    name: 'Corporate Law',
    professors: [
      { id: '31', name: 'Professor Quinn' },
      { id: '32', name: 'Professor Roberts' },
    ],
  },
  {
    id: '17',
    name: 'Criminal Procedure',
    professors: [
      { id: '33', name: 'Professor Scott' },
      { id: '34', name: 'Professor Turner' },
    ],
  },
  {
    id: '18',
    name: 'Domestic Relations',
    professors: [
      { id: '35', name: 'Professor Walker' },
      { id: '36', name: 'Professor Young' },
    ],
  },
  // Additional 2L/3L courses
  {
    id: '19',
    name: 'Advanced Constitutional Law',
    professors: [
      { id: '37', name: 'Professor Martinez' },
      { id: '38', name: 'Professor Thompson' },
      { id: '39', name: 'Professor Rodriguez' },
    ],
  },
  {
    id: '20',
    name: 'Securities Regulation',
    professors: [
      { id: '40', name: 'Professor Clark' },
      { id: '41', name: 'Professor Lewis' },
      { id: '42', name: 'Professor Robinson' },
    ],
  },
  {
    id: '21',
    name: 'International Law',
    professors: [
      { id: '43', name: 'Professor Wright' },
      { id: '44', name: 'Professor Lopez' },
      { id: '45', name: 'Professor Hill' },
    ],
  },
  {
    id: '22',
    name: 'Environmental Law',
    professors: [
      { id: '46', name: 'Professor Green' },
      { id: '47', name: 'Professor Adams' },
      { id: '48', name: 'Professor Baker' },
    ],
  },
  {
    id: '23',
    name: 'Intellectual Property',
    professors: [
      { id: '49', name: 'Professor Nelson' },
      { id: '50', name: 'Professor Carter' },
      { id: '51', name: 'Professor Mitchell' },
    ],
  },
  {
    id: '24',
    name: 'Employment Law',
    professors: [
      { id: '52', name: 'Professor Perez' },
      { id: '53', name: 'Professor Roberts' },
      { id: '54', name: 'Professor Turner' },
    ],
  },
  {
    id: '25',
    name: 'Health Law',
    professors: [
      { id: '55', name: 'Professor Phillips' },
      { id: '56', name: 'Professor Campbell' },
      { id: '57', name: 'Professor Parker' },
    ],
  },
  {
    id: '26',
    name: 'Immigration Law',
    professors: [
      { id: '58', name: 'Professor Evans' },
      { id: '59', name: 'Professor Edwards' },
      { id: '60', name: 'Professor Collins' },
    ],
  },
  {
    id: '27',
    name: 'Tax Law',
    professors: [
      { id: '61', name: 'Professor Stewart' },
      { id: '62', name: 'Professor Sanchez' },
      { id: '63', name: 'Professor Morris' },
    ],
  },
  {
    id: '28',
    name: 'Family Law',
    professors: [
      { id: '64', name: 'Professor Rogers' },
      { id: '65', name: 'Professor Reed' },
      { id: '66', name: 'Professor Cook' },
    ],
  },
  {
    id: '29',
    name: 'Real Estate Law',
    professors: [
      { id: '67', name: 'Professor Morgan' },
      { id: '68', name: 'Professor Bell' },
      { id: '69', name: 'Professor Murphy' },
    ],
  },
  {
    id: '30',
    name: 'Estate Planning',
    professors: [
      { id: '70', name: 'Professor Bailey' },
      { id: '71', name: 'Professor Rivera' },
      { id: '72', name: 'Professor Cooper' },
    ],
  },
  // 1L Elective Courses
  {
    id: '31',
    name: 'Legal Writing Workshop',
    professors: [
      { id: '73', name: 'Professor Thompson' },
      { id: '74', name: 'Professor Martinez' },
      { id: '75', name: 'Professor Rodriguez' },
    ],
  },
  {
    id: '32',
    name: 'Introduction to Legal Research',
    professors: [
      { id: '76', name: 'Professor Clark' },
      { id: '77', name: 'Professor Lewis' },
      { id: '78', name: 'Professor Robinson' },
    ],
  },
  {
    id: '33',
    name: 'Moot Court',
    professors: [
      { id: '79', name: 'Professor Wright' },
      { id: '80', name: 'Professor Lopez' },
      { id: '81', name: 'Professor Hill' },
    ],
  },
  {
    id: '34',
    name: 'Law and Society',
    professors: [
      { id: '82', name: 'Professor Green' },
      { id: '83', name: 'Professor Adams' },
      { id: '84', name: 'Professor Baker' },
    ],
  },
  {
    id: '35',
    name: 'Legal Ethics',
    professors: [
      { id: '85', name: 'Professor Nelson' },
      { id: '86', name: 'Professor Carter' },
      { id: '87', name: 'Professor Mitchell' },
    ],
  },
  {
    id: '36',
    name: 'Introduction to Public Interest Law',
    professors: [
      { id: '88', name: 'Professor Perez' },
      { id: '89', name: 'Professor Roberts' },
      { id: '90', name: 'Professor Turner' },
    ],
  },
  {
    id: '37',
    name: 'Legal History',
    professors: [
      { id: '91', name: 'Professor Phillips' },
      { id: '92', name: 'Professor Campbell' },
      { id: '93', name: 'Professor Parker' },
    ],
  },
  {
    id: '38',
    name: 'Introduction to International Law',
    professors: [
      { id: '94', name: 'Professor Evans' },
      { id: '95', name: 'Professor Edwards' },
      { id: '96', name: 'Professor Collins' },
    ],
  },
];
*/

// No hardcoded data needed - all comes from Supabase

interface LawClass {
  id: string;
  name: string;
  professors: Professor[];
}

interface Professor {
  id: string;
  name: string;
}

const getAvailableClasses = (
  classYear: ClassYear,
  excludeIds: string[],
  apiData: LawClass[] = []
): LawClass[] => {
  // All class years (1L, 2L, 3L): Use only API data from the Courses table
  return apiData;
};

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { user, signOut } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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

  // No auto-population - all students (1L, 2L, 3L) select courses manually

  // Handle class year changes
  useEffect(() => {
    console.log('Class year changed to:', classYear);

    // Reset all course selection state when class year changes
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
    } else {
      // No class year selected - reset to empty state
      setSelectedClasses([]);
    }

    // Clear all related state when class year changes
    setSection('');
    setScheduleOptionsBySlot({});
    setScheduleLoadingBySlot({});
    
    console.log('Reset all course selection state for class year:', classYear);
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

  // Removed handleScheduleChange since schedule is now display-only

  const isFormValid = () => {
    console.log('=== FORM VALIDATION START ===');
    console.log('Form data:', {
      name,
      phone,
      section,
      classYear,
      selectedClassesLength: selectedClasses.length,
    });

    // Require name, section, class year, and class selection
    if (!name.trim()) {
      console.log('Form invalid: missing name', { name });
      return false;
    }

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
      // Debug: Log user object to see available data
      console.log('Current user object:', user);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (!user?.email) {
        throw new Error(
          'User email not found. Please log out and log in again.'
        );
      }

      // Save all profile data to the profiles table (including phone)
      const profileData = {
        id: user.id,
        email: user.email || '', // Include email from authenticated user
        full_name: name.trim(),
        phone: phone.trim() || null, // Allow null for optional phone
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
        'Attempting to save profile data:',
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
        // Throw with more detailed error message
        throw new Error(
          profileError.message ||
            profileError.details ||
            JSON.stringify(profileError)
        );
      }

      console.log('Onboarding data saved successfully');

      // Complete onboarding
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert(
        `Error saving your profile: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Clear Session Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => signOut()}
            className="px-3 py-1 text-sm text-white rounded hover:opacity-90"
            style={{ backgroundColor: '#752432' }}
          >
            Clear Session
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 text-white rounded-full mb-4"
            style={{ backgroundColor: '#752432' }}
          >
            <span className="text-2xl font-semibold">HLS</span>
          </div>
          <h1 className="text-3xl text-gray-900 mb-2">
            Academic Profile Setup
          </h1>
          <p className="text-gray-600">
            Complete your academic information to finish setup
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-center text-gray-900">
              Academic Setup
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Class Year Selection */}
              <div className="flex justify-center">
                <div className="space-y-2 w-64">
                  <Label htmlFor="classYear">
                    Class Year<span style={{ color: '#752432' }}>*</span>
                  </Label>
                  <Select
                    value={classYear}
                    onValueChange={(value: ClassYear) => setClassYear(value)}
                  >
                    <SelectTrigger className="bg-input-background">
                      <SelectValue placeholder="Select your class year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1L">1L (First Year)</SelectItem>
                      <SelectItem value="2L">2L (Second Year)</SelectItem>
                      <SelectItem value="3L">3L (Third Year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Name and Section */}
              {classYear && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-xl text-gray-900 mb-4">
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Full Name<span style={{ color: '#752432' }}>*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="bg-input-background"
                          required
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          className="bg-input-background"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Section */}
                      <div className="space-y-2">
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
                  </div>
                </div>
              )}

              {/* Class Selection */}
              {classYear && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-xl text-gray-900 mb-2">
                      {classYear === '1L'
                        ? 'Course Selection'
                        : 'Course Selection'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {classYear === '1L' ? '' : ''}
                    </p>

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
                        // Debug logging for class slots
                        if (index >= 8) {
                          console.log(
                            `Rendering class slot ${index} for ${classYear}:`,
                            {
                              hasClass: !!selectedClass.lawClass,
                              className: selectedClass.lawClass?.name,
                              hasProfessor: !!selectedClass.professor,
                              professorName: selectedClass.professor?.name,
                            }
                          );
                        }

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

                        // Debug logging for elective class
                        if (index === 7) {
                          console.log('Elective class debug:', {
                            index,
                            selectedClass: selectedClass.lawClass,
                            hasProfessors:
                              selectedClass.lawClass?.professors?.length,
                            professorNames:
                              selectedClass.lawClass?.professors?.map(
                                (p) => p.name
                              ),
                            isRequired,
                          });
                        }

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
                            isReadOnly={false}
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
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
                    {loading ? 'Saving...' : 'Complete Setup'}
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
