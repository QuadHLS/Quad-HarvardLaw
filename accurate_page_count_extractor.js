import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import fs from 'fs'

// Supabase configuration
const supabase = createClient(config.supabaseUrl, config.supabaseKey)

/**
 * Extract accurate page count from PDF file
 */
async function getPDFPageCount(fileBuffer) {
  try {
    const data = await pdf(fileBuffer)
    return data.numpages
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return null
  }
}

/**
 * Extract accurate page count from DOCX file
 * Note: DOCX doesn't have a direct page count, so we estimate based on content
 */
async function getDOCXPageCount(fileBuffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer })
    const text = result.value
    
    // Estimate pages based on text length (roughly 500 words per page)
    const wordCount = text.split(/\s+/).length
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 500))
    
    return estimatedPages
  } catch (error) {
    console.error('Error parsing DOCX:', error)
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
    
    // Process each outline
    for (const outline of outlines) {
      try {
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
            console.log(`Updated ${outline.file_path}: ${outline.pages} → ${accuratePageCount} pages`)
            successCount++
          }
        } else if (accuratePageCount === outline.pages) {
          console.log(`Page count already accurate for ${outline.file_path}: ${outline.pages}`)
          successCount++
        } else {
          console.log(`Could not determine page count for ${outline.file_path}`)
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
    console.log(`Successfully updated: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total processed: ${outlines.length}`)
    
  } catch (error) {
    console.error('Error in updateAllPageCounts:', error)
  }
}

/**
 * Update page count for a single outline
 */
async function updateSinglePageCount(outlineId) {
  try {
    // Get the specific outline
    const { data: outline, error } = await supabase
      .from('outlines')
      .select('id, file_path, file_type, pages')
      .eq('id', outlineId)
      .single()
    
    if (error) {
      console.error('Error fetching outline:', error)
      return
    }
    
    const accuratePageCount = await getAccuratePageCount(
      outline.file_path, 
      outline.file_type
    )
    
    if (accuratePageCount !== null) {
      const { error: updateError } = await supabase
        .from('outlines')
        .update({ pages: accuratePageCount })
        .eq('id', outlineId)
      
      if (updateError) {
        console.error('Error updating outline:', updateError)
      } else {
        console.log(`Updated ${outline.file_path}: ${outline.pages} → ${accuratePageCount} pages`)
      }
    }
    
  } catch (error) {
    console.error('Error in updateSinglePageCount:', error)
  }
}

// Export functions for use
export {
  getAccuratePageCount,
  updateAllPageCounts,
  updateSinglePageCount
}

// Run the update if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllPageCounts()
}


