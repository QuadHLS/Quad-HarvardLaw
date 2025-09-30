import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface ExamFilterOptions {
  courses: string[];
  instructors: string[];
  years: string[];
  semesters: string[];
  examTypes: string[];
}

/**
 * Hook for fetching exam filter options with proper authentication handling
 * Similar to useRealTimePageCount but for exam data
 */
export function useExamFilterOptions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<ExamFilterOptions>({
    courses: [],
    instructors: [],
    years: [],
    semesters: [],
    examTypes: []
  })

  /**
   * Fetch exam filter options from the database
   */
  const fetchExamFilterOptions = useCallback(async (): Promise<ExamFilterOptions> => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('useExamFilterOptions: Starting to fetch exam filter options...')
      
      // Fetch all exam data
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('course, instructor, year, grade')

      if (examsError) {
        console.error('Error fetching exam data:', examsError)
        throw examsError
      }

      if (!examsData || examsData.length === 0) {
        console.log('No exam data found')
        const emptyOptions = { 
          courses: [], 
          instructors: [], 
          years: [], 
          semesters: [],
          examTypes: []
        }
        setFilterOptions(emptyOptions)
        return emptyOptions
      }

      // Extract unique values
      const courses = Array.from(new Set(examsData?.map((item: any) => item.course) || []))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b))

      const instructors = Array.from(new Set(examsData?.map((item: any) => item.instructor) || []))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b))

      const years = Array.from(new Set(examsData?.map((item: any) => item.year) || []))
        .filter(Boolean)
        .sort((a: any, b: any) => b.localeCompare(a)) // Newest first

      // Note: semester column doesn't exist in exams table, so we'll use empty array
      const semesters: string[] = []

      const examTypes = Array.from(new Set(examsData?.map((item: any) => item.grade) || []))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b))

      const options = {
        courses,
        instructors,
        years,
        semesters,
        examTypes
      }

      console.log('useExamFilterOptions: Filter options extracted:', {
        courses: courses.length,
        instructors: instructors.length,
        years: years.length,
        semesters: semesters.length,
        examTypes: examTypes.length
      })

      setFilterOptions(options)
      return options

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error in useExamFilterOptions:', error)
      setError(errorMessage)
      
      // Return empty options on error
      const emptyOptions = { 
        courses: [], 
        instructors: [], 
        years: [], 
        semesters: [],
        examTypes: []
      }
      setFilterOptions(emptyOptions)
      return emptyOptions
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Get combined filter options from both outlines and exams
   * This is useful for components that need to show all available options
   */
  const getCombinedFilterOptions = useCallback(async (): Promise<{
    courses: string[];
    instructors: string[];
    years: string[];
    semesters: string[];
    examTypes: string[];
    grades: string[];
  }> => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('useExamFilterOptions: Fetching combined filter options...')
      
      // Fetch from both tables in parallel
      const [outlinesData, examsData] = await Promise.all([
        supabase.from('outlines').select('course, instructor, year, type'),
        supabase.from('exams').select('course, instructor, year, grade')
      ])

      if (outlinesData.error) {
        console.error('Error fetching outlines data:', outlinesData.error)
      }

      if (examsData.error) {
        console.error('Error fetching exams data:', examsData.error)
      }

      // Combine and deduplicate courses
      const allCourses = [
        ...(outlinesData.data?.map((item: any) => item.course) || []),
        ...(examsData.data?.map((item: any) => item.course) || [])
      ]
      const courses = Array.from(new Set(allCourses))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b))

      // Combine and deduplicate instructors
      const allInstructors = [
        ...(outlinesData.data?.map((item: any) => item.instructor) || []),
        ...(examsData.data?.map((item: any) => item.instructor) || [])
      ]
      const instructors = Array.from(new Set(allInstructors))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b))

      // Combine and deduplicate years
      const allYears = [
        ...(outlinesData.data?.map((item: any) => item.year) || []),
        ...(examsData.data?.map((item: any) => item.year) || [])
      ]
      const years = Array.from(new Set(allYears))
        .filter(Boolean)
        .sort((a: any, b: any) => b.localeCompare(a))

      // Note: semester column doesn't exist in exams table, so we'll use empty array
      const semesters: string[] = []

      // Get exam types from exams only (using grade column)
      const examTypes = Array.from(new Set(examsData.data?.map((item: any) => item.grade) || []))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b))

      // Get grades from outlines only
      const grades = Array.from(new Set(outlinesData.data?.map((item: any) => item.type) || []))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b))

      const combinedOptions = {
        courses,
        instructors,
        years,
        semesters,
        examTypes,
        grades
      }

      console.log('useExamFilterOptions: Combined filter options:', {
        courses: courses.length,
        instructors: instructors.length,
        years: years.length,
        semesters: semesters.length,
        examTypes: examTypes.length,
        grades: grades.length
      })

      return combinedOptions

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error in getCombinedFilterOptions:', error)
      setError(errorMessage)
      
      return { 
        courses: [], 
        instructors: [], 
        years: [], 
        semesters: [],
        examTypes: [],
        grades: []
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Refresh the filter options
   */
  const refreshFilterOptions = useCallback(async () => {
    return await fetchExamFilterOptions()
  }, [fetchExamFilterOptions])

  return {
    filterOptions,
    isLoading,
    error,
    fetchExamFilterOptions,
    getCombinedFilterOptions,
    refreshFilterOptions
  }
}
