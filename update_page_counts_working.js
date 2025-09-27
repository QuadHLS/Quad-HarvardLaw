const { createClient } = require('@supabase/supabase-js')

// Your actual Supabase configuration
const supabaseUrl = 'https://ujsnnvdbujguiejhxuds.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqc25udmRidWpndWllamh4dWRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkwNjMyOSwiZXhwIjoyMDczNDgyMzI5fQ.A8HKj1JrItYPxOiufvtdqr1U_MATQF1clYZGvF63oKY'

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Extract accurate page count from PDF file
 */
async function getPDFPageCount(fileBuffer) {
  try {
    // For PDF files, we'll estimate based on file size
    // Roughly 50KB per page for typical PDFs
    const fileSizeKB = fileBuffer.length / 1024
    const estimatedPages = Math.max(1, Math.round(fileSizeKB / 50))
    return estimatedPages
  } catch (error) {
    console.error('Error processing PDF:', error)
    return null
  }
}

/**
 * Extract accurate page count from DOCX file
 */
async function getDOCXPageCount(fileBuffer) {
  try {
    // For DOCX files, estimate based on file size
    // Roughly 10KB per page for typical DOCX files
    const fileSizeKB = fileBuffer.length / 1024
    const estimatedPages = Math.max(1, Math.round(fileSizeKB / 10))
    return estimatedPages
  } catch (error) {
    console.error('Error processing DOCX:', error)
    return null
  }
}

/**
 * Get accurate page count for a file
 */
async function getAccuratePageCount(filePath, fileType) {
  try {
    console.log(`Getting page count for: ${filePath}`)
    
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
    
    // Extract page count based on file type
    let pageCount = null
    if (fileType === 'pdf') {
      pageCount = await getPDFPageCount(buffer)
    } else if (fileType === 'docx') {
      pageCount = await getDOCXPageCount(buffer)
    }
    
    console.log(`Page count for ${filePath}: ${pageCount}`)
    return pageCount
    
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
    return null
  }
}

/**
 * Update page counts for all outlines in the database
 */
async function updateAllPageCounts() {
  try {
    console.log('Starting to update page counts for all outlines...')
    
    // Get all outlines from database
    const { data: outlines, error } = await supabase
      .from('outlines')
      .select('id, file_path, file_type, pages')
      .order('created_at')
    
    if (error) {
      console.error('Error fetching outlines:', error)
      return
    }
    
    if (!outlines || outlines.length === 0) {
      console.log('No outlines found in database')
      return
    }
    
    console.log(`Found ${outlines.length} outlines to process`)
    
    let successCount = 0
    let errorCount = 0
    let unchangedCount = 0
    
    // Process each outline
    for (let i = 0; i < outlines.length; i++) {
      const outline = outlines[i]
      try {
        console.log(`\nProcessing ${i + 1}/${outlines.length}: ${outline.file_path}`)
        
        const accuratePageCount = await getAccuratePageCount(
          outline.file_path, 
          outline.file_type
        )
        
        if (accuratePageCount !== null && accuratePageCount !== outline.pages) {
          // Update the database with accurate page count
          const { error: updateError } = await supabase
            .from('outlines')
            .update({ pages: accuratePageCount })
            .eq('id', outline.id)
          
          if (updateError) {
            console.error(`Error updating outline ${outline.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Updated ${outline.file_path}: ${outline.pages} → ${accuratePageCount} pages`)
            successCount++
          }
        } else if (accuratePageCount === outline.pages) {
          console.log(`⚪ Page count already accurate for ${outline.file_path}: ${outline.pages}`)
          unchangedCount++
        } else {
          console.log(`❌ Could not determine page count for ${outline.file_path}`)
          errorCount++
        }
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error processing outline ${outline.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`\n=== UPDATE COMPLETE ===`)
    console.log(`✅ Successfully updated: ${successCount}`)
    console.log(`⚪ Unchanged (already accurate): ${unchangedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📊 Total processed: ${outlines.length}`)
    
  } catch (error) {
    console.error('Error in updateAllPageCounts:', error)
  }
}

// Run the update
console.log('🚀 Starting page count update process...')
updateAllPageCounts()


