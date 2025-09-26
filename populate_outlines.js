import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { config } from './config.js'

// Supabase configuration
const supabase = createClient(config.supabaseUrl, config.supabaseKey)

// Bucket configuration
const BUCKET_NAME = config.bucketName
const BUCKET_FOLDER = config.bucketFolder

// Function to get file size from Supabase storage
async function getFileSize(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath)
    
    if (error) {
      console.error(`Error getting file size for ${filePath}:`, error)
      return 0
    }
    
    return data.size
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error)
    return 0
  }
}

// Function to list all files in a folder
async function listFilesInFolder(folderPath = '') {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath, {
        limit: 1000,
        offset: 0
      })
    
    if (error) {
      console.error(`Error listing files in ${folderPath}:`, error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error(`Error listing files in ${folderPath}:`, error)
    return []
  }
}

// Function to recursively scan bucket structure
async function scanBucketStructure() {
  const outlines = []
  
  console.log('🔍 Scanning bucket structure...')
  
  // Start from the 'out' folder
  const outFolder = await listFilesInFolder(BUCKET_FOLDER)
  
  for (const classFolder of outFolder) {
    if (classFolder.name === '.emptyFolderPlaceholder') continue
    
    console.log(`📁 Processing class: ${classFolder.name}`)
    
    // List instructors in this class
    const instructors = await listFilesInFolder(`${BUCKET_FOLDER}/${classFolder.name}`)
    
    for (const instructorFolder of instructors) {
      if (instructorFolder.name === '.emptyFolderPlaceholder') continue
      
      console.log(`  👨‍🏫 Processing instructor: ${instructorFolder.name}`)
      
      // List years for this instructor
      const years = await listFilesInFolder(`${BUCKET_FOLDER}/${classFolder.name}/${instructorFolder.name}`)
      
      for (const yearFolder of years) {
        if (yearFolder.name === '.emptyFolderPlaceholder') continue
        
        console.log(`    📅 Processing year: ${yearFolder.name}`)
        
        // List grades for this year
        const grades = await listFilesInFolder(`${BUCKET_FOLDER}/${classFolder.name}/${instructorFolder.name}/${yearFolder.name}`)
        
        for (const gradeFolder of grades) {
          if (gradeFolder.name === '.emptyFolderPlaceholder') continue
          
          console.log(`      🎯 Processing grade: ${gradeFolder.name}`)
          
          // List files in this grade folder
          const files = await listFilesInFolder(`${BUCKET_FOLDER}/${classFolder.name}/${instructorFolder.name}/${yearFolder.name}/${gradeFolder.name}`)
          
          for (const file of files) {
            if (file.name === '.emptyFolderPlaceholder') continue
            
            // Check if it's a PDF or DOCX file
            const fileExtension = path.extname(file.name).toLowerCase()
            if (fileExtension !== '.pdf' && fileExtension !== '.docx') continue
            
            const filePath = `${BUCKET_FOLDER}/${classFolder.name}/${instructorFolder.name}/${yearFolder.name}/${gradeFolder.name}/${file.name}`
            
            console.log(`        📄 Processing file: ${file.name}`)
            
            // Get file size
            const fileSize = await getFileSize(filePath)
            
            // Helper function to format outline display name
            const formatOutlineDisplayName = (course, instructor, year, grade) => {
              // Get first letter of course name
              const courseInitial = course.charAt(0).toUpperCase();
              
              // Get instructor initials (first letter of each word)
              const instructorInitials = instructor
                .split(' ')
                .map(name => name.charAt(0).toUpperCase())
                .join('');
              
              // Get last 2 digits of year
              const lastTwoDigits = year.slice(-2);
              
              // Generate random 3-digit number
              const randomNumber = Math.floor(Math.random() * 900) + 100; // 100-999
              
              // Format as continuous text: CourseInitial + InstructorInitials + Last2Digits + Grade + Random3Digits
              return `${courseInitial}${instructorInitials}${lastTwoDigits}${grade}${randomNumber}`;
            };
            
            // Create outline record
            const outline = {
              title: formatOutlineDisplayName(classFolder.name, instructorFolder.name, yearFolder.name, gradeFolder.name),
              file_name: file.name,
              file_path: filePath,
              file_type: fileExtension.substring(1), // Remove the dot
              file_size: fileSize,
              course: classFolder.name,
              instructor: instructorFolder.name,
              year: yearFolder.name,
              grade: gradeFolder.name,
              pages: 1, // Set to 1 to satisfy constraint (you can update this later)
              description: null,
              rating: 0,
              rating_count: 0,
              download_count: 0
            }
            
            outlines.push(outline)
          }
        }
      }
    }
  }
  
  return outlines
}

// Function to insert outlines into database
async function insertOutlines(outlines) {
  console.log(`\n💾 Inserting ${outlines.length} outlines into database...`)
  
  // Insert in batches of 100
  const batchSize = 100
  for (let i = 0; i < outlines.length; i += batchSize) {
    const batch = outlines.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('outlines')
      .insert(batch)
    
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error)
    } else {
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} outlines)`)
    }
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting outline population process...')
    
    // Scan bucket structure
    const outlines = await scanBucketStructure()
    
    if (outlines.length === 0) {
      console.log('❌ No outlines found in bucket')
      return
    }
    
    console.log(`\n📊 Found ${outlines.length} outlines`)
    
    // Insert into database
    await insertOutlines(outlines)
    
    console.log('\n🎉 Outline population completed!')
    
  } catch (error) {
    console.error('❌ Error during population:', error)
  }
}

// Run the script
main()
