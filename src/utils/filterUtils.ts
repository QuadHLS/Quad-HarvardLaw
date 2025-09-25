import { supabase } from '../lib/supabase';

export interface FilterOptions {
  courses: string[];
  instructors: string[];
  years: string[];
  grades: string[];
}

export async function getFilterOptions(): Promise<FilterOptions> {
  try {
    console.log('getFilterOptions: Starting to fetch filter options...');
    
    // First, let's test if we can connect to the database at all
    const { data: testData, error: testError } = await supabase
      .from('outlines')
      .select('*')
      .limit(5);
    
    console.log('getFilterOptions: Test query result:', { testData, testError });
    
    if (testError) {
      console.error('Database connection error:', testError);
      throw testError;
    }
    
    if (!testData || testData.length === 0) {
      console.error('No data found in outlines table');
      return { 
        courses: [], 
        instructors: [], 
        years: [], 
        grades: [] 
      };
    }
    
    // Get ALL courses - no limits, no filters
    const { data: coursesData, error: coursesError } = await supabase
      .from('outlines')
      .select('course');

    console.log('getFilterOptions: Courses query result:', { coursesData, coursesError });

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      throw coursesError;
    }

    // Get total count of records to verify we're getting all data
    const { count, error: countError } = await supabase
      .from('outlines')
      .select('*', { count: 'exact', head: true });
    
    console.log('getFilterOptions: Total records in outlines table:', count);
    if (countError) {
      console.error('Error getting count:', countError);
    }

    // Get ALL courses without any filtering to see what's actually in the database
    const { data: allCoursesData, error: allCoursesError } = await supabase
      .from('outlines')
      .select('course');
    
    console.log('getFilterOptions: ALL courses (no filtering):', allCoursesData);
    if (allCoursesError) {
      console.error('Error getting all courses:', allCoursesError);
    }

    // Get ALL instructors - no limits, no filters
    const { data: instructorsData, error: instructorsError } = await supabase
      .from('outlines')
      .select('instructor');

    if (instructorsError) {
      console.error('Error fetching instructors:', instructorsError);
      throw instructorsError;
    }

    // Get ALL years - no limits, no filters
    const { data: yearsData, error: yearsError } = await supabase
      .from('outlines')
      .select('year');

    if (yearsError) {
      console.error('Error fetching years:', yearsError);
      throw yearsError;
    }

    // Get ALL grades (types) - no limits, no filters
    const { data: gradesData, error: gradesError } = await supabase
      .from('outlines')
      .select('type');

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
      throw gradesError;
    }

    // Extract unique values and sort them
    const allCourses = coursesData?.map(item => item.course) || [];
    const uniqueCourses = Array.from(new Set(allCourses));
    const courses = uniqueCourses
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    
    console.log('getFilterOptions: Raw courses data:', coursesData);
    console.log('getFilterOptions: Total course records:', coursesData?.length);
    console.log('getFilterOptions: All courses (including duplicates):', allCourses);
    console.log('getFilterOptions: Unique courses (before filtering):', uniqueCourses);
    console.log('getFilterOptions: Final courses (after filtering):', courses);
    console.log('getFilterOptions: Courses count:', courses.length);

    const instructors = Array.from(new Set(instructorsData?.map(item => item.instructor) || []))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const years = Array.from(new Set(yearsData?.map(item => item.year) || []))
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a)); // Sort years descending (newest first)

    const grades = Array.from(new Set(gradesData?.map(item => item.type) || []))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return {
      courses,
      instructors,
      years,
      grades
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      courses: [],
      instructors: [],
      years: [],
      grades: []
    };
  }
}

export async function getInstructorOutlineCount(instructorName: string, courseName?: string): Promise<number> {
  try {
    let query = supabase
      .from('outlines')
      .select('id', { count: 'exact' })
      .eq('instructor', instructorName);

    if (courseName) {
      query = query.eq('course', courseName);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error getting instructor outline count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting instructor outline count:', error);
    return 0;
  }
}

// Direct search function based on user filter inputs
export async function searchOutlines(filters: {
  course?: string;
  instructor?: string;
  year?: string;
  grade?: string;
}): Promise<any[]> {
  try {
    console.log('searchOutlines: Searching with filters:', filters);
    
    let query = supabase
      .from('outlines')
      .select('*');

    // Apply filters if they exist
    if (filters.course) {
      query = query.eq('course', filters.course);
    }
    if (filters.instructor) {
      query = query.eq('instructor', filters.instructor);
    }
    if (filters.year) {
      query = query.eq('year', filters.year);
    }
    if (filters.grade) {
      query = query.eq('type', filters.grade);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching outlines:', error);
      return [];
    }

    console.log('searchOutlines: Found outlines:', data);
    return data || [];
  } catch (error) {
    console.error('Error in searchOutlines:', error);
    return [];
  }
}

