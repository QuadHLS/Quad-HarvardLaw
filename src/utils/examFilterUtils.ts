import { supabase } from '../lib/supabase';

export interface ExamFilterOptions {
  courses: string[];
  instructors: string[];
  years: string[];
  semesters: string[];
  examTypes: string[];
}

/**
 * Get filter options specifically for exams
 */
export async function getExamFilterOptions(): Promise<ExamFilterOptions> {
  try {
    console.log('getExamFilterOptions: Starting to fetch exam filter options...');
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('exams')
      .select('*')
      .limit(5);
    
    console.log('getExamFilterOptions: Test query result:', { testData, testError });
    
    if (testError) {
      console.error('Database connection error:', testError);
      throw testError;
    }
    
    if (!testData || testData.length === 0) {
      console.error('No data found in exams table');
      return { 
        courses: [], 
        instructors: [], 
        years: [], 
        semesters: [],
        examTypes: []
      };
    }
    
    // Fetch all exam data
    const { data: examsData, error: examsError } = await supabase
      .from('exams')
      .select('course, instructor, year, semester, exam_type');

    if (examsError) {
      console.error('Error fetching exam data:', examsError);
      throw examsError;
    }

    // Extract unique values
    const courses = Array.from(new Set(examsData?.map((item: any) => item.course) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    const instructors = Array.from(new Set(examsData?.map((item: any) => item.instructor) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    const years = Array.from(new Set(examsData?.map((item: any) => item.year) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => b.localeCompare(a)); // Newest first

    const semesters = Array.from(new Set(examsData?.map((item: any) => item.semester) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    const examTypes = Array.from(new Set(examsData?.map((item: any) => item.exam_type) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    console.log('getExamFilterOptions: Filter options extracted:', {
      courses: courses.length,
      instructors: instructors.length,
      years: years.length,
      semesters: semesters.length,
      examTypes: examTypes.length
    });

    return {
      courses,
      instructors,
      years,
      semesters,
      examTypes
    };

  } catch (error) {
    console.error('Error in getExamFilterOptions:', error);
    return { 
      courses: [], 
      instructors: [], 
      years: [], 
      semesters: [],
      examTypes: []
    };
  }
}

/**
 * Get combined filter options from both outlines and exams
 * This is useful for components that need to show all available options
 */
export async function getCombinedFilterOptions(): Promise<{
  courses: string[];
  instructors: string[];
  years: string[];
  semesters: string[];
  examTypes: string[];
  grades: string[];
}> {
  try {
    console.log('getCombinedFilterOptions: Fetching combined filter options...');
    
    // Fetch from both tables in parallel
    const [outlinesData, examsData] = await Promise.all([
      supabase.from('outlines').select('course, instructor, year, type'),
      supabase.from('exams').select('course, instructor, year, semester, exam_type')
    ]);

    if (outlinesData.error) {
      console.error('Error fetching outlines data:', outlinesData.error);
    }

    if (examsData.error) {
      console.error('Error fetching exams data:', examsData.error);
    }

    // Combine and deduplicate courses
    const allCourses = [
      ...(outlinesData.data?.map((item: any) => item.course) || []),
      ...(examsData.data?.map((item: any) => item.course) || [])
    ];
    const courses = Array.from(new Set(allCourses))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    // Combine and deduplicate instructors
    const allInstructors = [
      ...(outlinesData.data?.map((item: any) => item.instructor) || []),
      ...(examsData.data?.map((item: any) => item.instructor) || [])
    ];
    const instructors = Array.from(new Set(allInstructors))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    // Combine and deduplicate years
    const allYears = [
      ...(outlinesData.data?.map((item: any) => item.year) || []),
      ...(examsData.data?.map((item: any) => item.year) || [])
    ];
    const years = Array.from(new Set(allYears))
      .filter(Boolean)
      .sort((a: any, b: any) => b.localeCompare(a));

    // Get semesters from exams only
    const semesters = Array.from(new Set(examsData.data?.map((item: any) => item.semester) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    // Get exam types from exams only
    const examTypes = Array.from(new Set(examsData.data?.map((item: any) => item.exam_type) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    // Get grades from outlines only
    const grades = Array.from(new Set(outlinesData.data?.map((item: any) => item.type) || []))
      .filter(Boolean)
      .sort((a: any, b: any) => a.localeCompare(b));

    console.log('getCombinedFilterOptions: Combined filter options:', {
      courses: courses.length,
      instructors: instructors.length,
      years: years.length,
      semesters: semesters.length,
      examTypes: examTypes.length,
      grades: grades.length
    });

    return {
      courses,
      instructors,
      years,
      semesters,
      examTypes,
      grades
    };

  } catch (error) {
    console.error('Error in getCombinedFilterOptions:', error);
    return { 
      courses: [], 
      instructors: [], 
      years: [], 
      semesters: [],
      examTypes: [],
      grades: []
    };
  }
}
