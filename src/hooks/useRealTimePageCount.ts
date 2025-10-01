import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface OutlineFile {
  id: string
  title: string
  course: string
  instructor: string
  year: string
  type: string
  pages: number
  rating: number
  file_path: string
  file_type: 'pdf' | 'docx'
  created_at: string
  updated_at: string
}

/**
 * Hook for real-time page count updates when users search for outlines
 */
export function useRealTimePageCount() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [updatingFiles, setUpdatingFiles] = useState<Set<string>>(new Set())

  /**
   * Get accurate page count for a single file by parsing its content
   */
  const getAccuratePageCount = useCallback(async (filePath: string, fileType: 'pdf' | 'docx'): Promise<number | null> => {
    try {
      // Download file from Supabase storage
      const { data: fileData, error } = await supabase.storage
        .from('Outlines')
        .download(filePath)
      
      if (error) {
        console.error(`Error downloading file ${filePath}:`, error)
        return null
      }
      
      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)
      
      let pageCount = null
      
      if (fileType === 'pdf') {
        // For PDF, we'll estimate based on file size with better ratios
        // This is a simplified version - in production you'd use pdf-parse
        const fileSizeKB = buffer.length / 1024
        
        if (fileSizeKB < 100) {
          pageCount = Math.max(1, Math.round(fileSizeKB / 50))
        } else if (fileSizeKB < 500) {
          pageCount = Math.max(2, Math.round(fileSizeKB / 80))
        } else if (fileSizeKB < 2000) {
          pageCount = Math.max(5, Math.round(fileSizeKB / 120))
        } else {
          pageCount = Math.max(10, Math.round(fileSizeKB / 150))
        }
        
      } else if (fileType === 'docx') {
        // For DOCX, estimate based on file size with better ratios
        const fileSizeKB = buffer.length / 1024
        
        if (fileSizeKB < 50) {
          pageCount = Math.max(1, Math.round(fileSizeKB / 20))
        } else if (fileSizeKB < 200) {
          pageCount = Math.max(2, Math.round(fileSizeKB / 30))
        } else if (fileSizeKB < 1000) {
          pageCount = Math.max(5, Math.round(fileSizeKB / 40))
        } else {
          pageCount = Math.max(10, Math.round(fileSizeKB / 50))
        }
      }
      
      return pageCount
      
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error)
      return null
    }
  }, [])

  /**
   * Update page count for a specific outline in real-time
   */
  const updateOutlinePageCount = useCallback(async (outlineId: string, filePath: string, fileType: 'pdf' | 'docx'): Promise<number | null> => {
    try {
      // Add to updating files set
      setUpdatingFiles(prev => new Set(prev).add(outlineId))
      
      const pageCount = await getAccuratePageCount(filePath, fileType)
      
      if (pageCount !== null) {
        const { error } = await supabase
          .from('outlines')
          .update({ pages: pageCount })
          .eq('id', outlineId)
        
        if (error) {
          console.error(`Error updating outline ${outlineId}:`, error)
          return null
        }
        
        return pageCount
      }
      
      return null
    } catch (error) {
      console.error(`Error updating outline ${outlineId}:`, error)
      return null
    } finally {
      // Remove from updating files set
      setUpdatingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(outlineId)
        return newSet
      })
    }
  }, [getAccuratePageCount])

  /**
   * Update page counts for multiple outlines in real-time
   */
  const updateMultiplePageCounts = useCallback(async (outlines: OutlineFile[]): Promise<OutlineFile[]> => {
    setIsUpdating(true)
    setUpdateProgress(0)
    
    try {
      const updatedOutlines: OutlineFile[] = []
      
      for (let i = 0; i < outlines.length; i++) {
        const outline = outlines[i]
        
        // Check if we need to update the page count
        // Only update if it's still 1 (the old default) or if it's been a while since last update
        const shouldUpdate = outline.pages === 1 || 
                           (outline.updated_at && 
                            new Date(outline.updated_at) < new Date(Date.now() - 24 * 60 * 60 * 1000))
        
        if (shouldUpdate) {
          const newPageCount = await updateOutlinePageCount(
            outline.id, 
            outline.file_path, 
            outline.file_type
          )
          
          if (newPageCount !== null) {
            outline.pages = newPageCount
            outline.updated_at = new Date().toISOString()
          }
        }
        
        updatedOutlines.push(outline)
        
        // Update progress
        setUpdateProgress(Math.round(((i + 1) / outlines.length) * 100))
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      return updatedOutlines
      
    } catch (error) {
      console.error('Error updating page counts:', error)
      return outlines
    } finally {
      setIsUpdating(false)
      setUpdateProgress(0)
    }
  }, [updateOutlinePageCount])

  /**
   * Get outlines with real-time page count updates
   */
  const getOutlinesWithRealTimePageCounts = useCallback(async (searchParams: {
    course?: string
    instructor?: string
    year?: string
    type?: string
  } = {}): Promise<OutlineFile[]> => {
    try {
      // Get outlines from database
      let query = supabase
        .from('outlines')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Apply search filters
      if (searchParams.course) {
        query = query.eq('course', searchParams.course)
      }
      if (searchParams.instructor) {
        query = query.eq('instructor', searchParams.instructor)
      }
      if (searchParams.year) {
        query = query.eq('year', searchParams.year)
      }
      if (searchParams.type) {
        query = query.eq('type', searchParams.type)
      }
      
      const { data: outlines, error } = await query
      
      if (error) {
        console.error('Error fetching outlines:', error)
        return []
      }
      
      if (!outlines || outlines.length === 0) {
        return []
      }
      
      // Update page counts for outlines that need it
      return await updateMultiplePageCounts(outlines)
      
    } catch (error) {
      console.error('Error in getOutlinesWithRealTimePageCounts:', error)
      return []
    }
  }, [updateMultiplePageCounts])

  /**
   * Update a single outline's page count in real-time
   */
  const updateSingleOutline = useCallback(async (outline: OutlineFile): Promise<OutlineFile> => {
    const newPageCount = await updateOutlinePageCount(
      outline.id,
      outline.file_path,
      outline.file_type
    )
    
    if (newPageCount !== null) {
      return {
        ...outline,
        pages: newPageCount,
        updated_at: new Date().toISOString()
      }
    }
    
    return outline
  }, [updateOutlinePageCount])

  return {
    isUpdating,
    updateProgress,
    updatingFiles,
    getAccuratePageCount,
    updateOutlinePageCount,
    updateMultiplePageCounts,
    getOutlinesWithRealTimePageCounts,
    updateSingleOutline
  }
}




