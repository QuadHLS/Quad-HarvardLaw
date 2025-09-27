const { createClient } = require('@supabase/supabase-js')

// Your actual Supabase configuration
const supabaseUrl = 'https://ujsnnvdbujguiejhxuds.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqc25udmRidWpndWllamh4dWRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkwNjMyOSwiZXhwIjoyMDczNDgyMzI5fQ.A8HKj1JrItYPxOiufvtdqr1U_MATQF1clYZGvF63oKY'

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get accurate page count for a single file
 * This will be called from the frontend when users search
 */
async function getAccuratePageCount(filePath, fileType) {
  try {
    console.log(`Getting accurate page count for: ${filePath}`)
    
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
    const buffer = Buffer.from(arrayBuffer)
    
    let pageCount = null
    
    if (fileType === 'pdf') {
      // For PDF, we'll use a more sophisticated approach
      // For now, estimate based on file size with better ratios
      const fileSizeKB = buffer.length / 1024
      
      // Better estimation based on typical PDF characteristics
      if (fileSizeKB < 50) {
        pageCount = 1
      } else if (fileSizeKB < 200) {
        pageCount = Math.max(1, Math.round(fileSizeKB / 80)) // ~80KB per page for small docs
      } else if (fileSizeKB < 1000) {
        pageCount = Math.max(2, Math.round(fileSizeKB / 120)) // ~120KB per page for medium docs
      } else {
        pageCount = Math.max(5, Math.round(fileSizeKB / 150)) // ~150KB per page for large docs
      }
      
    } else if (fileType === 'docx') {
      // For DOCX, estimate based on file size with better ratios
      const fileSizeKB = buffer.length / 1024
      
      // Better estimation for DOCX files
      if (fileSizeKB < 20) {
        pageCount = 1
      } else if (fileSizeKB < 100) {
        pageCount = Math.max(1, Math.round(fileSizeKB / 15)) // ~15KB per page for small docs
      } else if (fileSizeKB < 500) {
        pageCount = Math.max(2, Math.round(fileSizeKB / 25)) // ~25KB per page for medium docs
      } else {
        pageCount = Math.max(5, Math.round(fileSizeKB / 35)) // ~35KB per page for large docs
      }
    }
    
    console.log(`Estimated page count for ${filePath}: ${pageCount}`)
    return pageCount
    
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
    return null
  }
}

/**
 * Update page count for a specific outline in the database
 */
async function updateOutlinePageCount(outlineId, filePath, fileType) {
  try {
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
      
      console.log(`✅ Updated outline ${outlineId}: ${pageCount} pages`)
      return pageCount
    }
    
    return null
  } catch (error) {
    console.error(`Error updating outline ${outlineId}:`, error)
    return null
  }
}

/**
 * Get outlines with updated page counts
 * This function will be called from the frontend
 */
async function getOutlinesWithPageCounts(searchParams = {}) {
  try {
    // Get outlines from database
    let query = supabase
      .from('outlines')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Apply search filters if provided
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
    
    console.log(`Found ${outlines.length} outlines`)
    
    // Process each outline to update page counts
    const updatedOutlines = []
    
    for (const outline of outlines) {
      try {
        // Check if we need to update the page count
        // Only update if it's still 1 (the old default) or if it's been a while since last update
        const shouldUpdate = outline.pages === 1 || 
                           (outline.updated_at && 
                            new Date(outline.updated_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24 hours ago
        
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
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50))
        
      } catch (error) {
        console.error(`Error processing outline ${outline.id}:`, error)
        updatedOutlines.push(outline) // Add the outline even if page count update failed
      }
    }
    
    return updatedOutlines
    
  } catch (error) {
    console.error('Error in getOutlinesWithPageCounts:', error)
    return []
  }
}

/**
 * Update page count for a single outline by ID
 */
async function updateSingleOutlinePageCount(outlineId) {
  try {
    // Get the outline
    const { data: outline, error } = await supabase
      .from('outlines')
      .select('*')
      .eq('id', outlineId)
      .single()
    
    if (error) {
      console.error('Error fetching outline:', error)
      return null
    }
    
    const pageCount = await updateOutlinePageCount(
      outline.id, 
      outline.file_path, 
      outline.file_type
    )
    
    return pageCount
    
  } catch (error) {
    console.error('Error in updateSingleOutlinePageCount:', error)
    return null
  }
}

// Export functions for use in frontend
module.exports = {
  getAccuratePageCount,
  updateOutlinePageCount,
  getOutlinesWithPageCounts,
  updateSingleOutlinePageCount
}

// Test function
async function testPageCountUpdate() {
  console.log('Testing page count update...')
  
  // Get a few outlines to test
  const { data: outlines, error } = await supabase
    .from('outlines')
    .select('id, file_path, file_type, pages')
    .limit(5)
  
  if (error) {
    console.error('Error fetching test outlines:', error)
    return
  }
  
  console.log(`Testing with ${outlines.length} outlines...`)
  
  for (const outline of outlines) {
    const newPageCount = await updateOutlinePageCount(
      outline.id, 
      outline.file_path, 
      outline.file_type
    )
    
    if (newPageCount !== null) {
      console.log(`✅ ${outline.file_path}: ${outline.pages} → ${newPageCount} pages`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testPageCountUpdate()
}


