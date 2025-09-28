// Script to populate exams table from Supabase storage bucket
// This script scans the "Exams" bucket and populates the exams table

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://ujsnnvdbujguiejhxuds.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqc25udmRidWpndWllamh4dWRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkwNjMyOSwiZXhwIjoyMDczNDgyMzI5fQ.A8HKj1JrItYPxOiufvtdqr1U_MATQF1clYZGvF63oKY';
const BUCKET_NAME = 'Exams';
const BUCKET_FOLDER = 'Exam'; // First folder is called "Exam" (not "Exams")

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper function to format exam display name
function formatExamDisplayName(course, instructor, year, grade) {
  const courseInitial = course.charAt(0).toUpperCase();
  const instructorInitials = instructor
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('');
  return `${courseInitial}${instructorInitials} ${year} ${grade}`;
}

// Function to recursively scan the storage bucket and collect exam data
async function scanBucketStructure(folderPath = BUCKET_FOLDER) {
  const outlineRecords = [];
  
  try {
    console.log(`Scanning folder: ${folderPath}`);
    
    const { data: items, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`Error listing items in ${folderPath}:`, error);
      return outlineRecords;
    }

    if (!items || items.length === 0) {
      console.log(`No items found in ${folderPath}`);
      return outlineRecords;
    }

    for (const item of items) {
      const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
      
      // Handle case where type is undefined but item has metadata (likely a file)
      const isFile = item.type === 'file' || (item.type === undefined && item.metadata && item.metadata.size !== undefined);
      const isFolder = item.type === 'folder' || (item.type === undefined && (!item.metadata || item.metadata.size === undefined));
      
      if (isFile) {
        const fileExtension = path.extname(item.name);
        if (fileExtension !== '.pdf' && fileExtension !== '.docx') {
          continue;
        }

        // Extract metadata from path
        const pathParts = fullPath.split('/');
        
        // Adjust indices to skip the 'Exam' folder
        if (pathParts[0] === BUCKET_FOLDER) {
          pathParts.shift(); // Remove 'Exam'
        }

        if (pathParts.length < 4) { // Expected: Class/Professor/Year/Grade/Filename
          console.warn(`Invalid file path format: ${fullPath}`);
          continue;
        }

        const course = pathParts[0]; // Class
        const instructor = pathParts[1]; // Professor
        const year = pathParts[2]; // Year
        const grade = pathParts[3]; // Grade

        if (!['DS', 'H', 'P'].includes(grade)) {
          console.warn(`Invalid grade type: ${grade} in path: ${fullPath}`);
          continue;
        }

        const outline = {
          title: formatExamDisplayName(course, instructor, year, grade),
          file_name: item.name,
          file_path: fullPath,
          file_type: fileExtension.substring(1),
          file_size: item.metadata?.size || 0,
          course: course,
          instructor: instructor,
          year: year,
          grade: grade,
          pages: 1, // Default, to be updated by real-time process
          description: null,
          rating: 0,
          rating_count: 0,
          download_count: 0
        };

        outlineRecords.push(outline);
        console.log(`Found exam: ${outline.title}`);
        
      } else if (isFolder) {
        // Recursively scan subfolders
        const subRecords = await scanBucketStructure(fullPath);
        outlineRecords.push(...subRecords);
      }
    }
  } catch (error) {
    console.error(`Error scanning ${folderPath}:`, error);
  }

  return outlineRecords;
}

// Function to insert exams into the database with optimized batching
async function insertExams(exams) {
  const batchSize = 1000; // Increased batch size for better performance
  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  console.log(`\n🚀 Starting insertion of ${exams.length} exams into database...`);
  console.log(`📦 Using batch size: ${batchSize}`);

  for (let i = 0; i < exams.length; i += batchSize) {
    const batch = exams.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(exams.length / batchSize);
    
    try {
      console.log(`⚡ Processing batch ${batchNumber}/${totalBatches} (${batch.length} exams)...`);
      
      const { data, error } = await supabase
        .from('exams')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        errorCount += batch.length;
        
        // Try individual inserts for this batch to identify problematic records
        console.log(`🔍 Attempting individual inserts for batch ${batchNumber}...`);
        for (const exam of batch) {
          try {
            const { error: individualError } = await supabase
              .from('exams')
              .insert(exam);
            if (individualError) {
              console.error(`❌ Failed to insert: ${exam.title} - ${individualError.message}`);
            } else {
              successCount++;
              errorCount--;
            }
          } catch (individualError) {
            console.error(`❌ Exception inserting: ${exam.title} - ${individualError.message}`);
          }
        }
      } else {
        console.log(`✅ Batch ${batchNumber} succeeded: ${batch.length} exams inserted`);
        successCount += batch.length;
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed with exception:`, error.message);
      errorCount += batch.length;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n🎉 Insertion complete in ${duration}s:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${exams.length}`);
  console.log(`⚡ Rate: ${(exams.length / (duration / 60)).toFixed(0)} exams/minute`);
}

// Main function with enhanced logging and validation
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 Starting exam population process...');
    console.log(`📁 Bucket: ${BUCKET_NAME}`);
    console.log(`📂 Folder: ${BUCKET_FOLDER}`);
    console.log(`🏗️  Structure: ${BUCKET_FOLDER}/Class/Professor/Year/Grade/Filename`);
    
    // Check if bucket exists
    console.log('\n🔍 Checking bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError.message);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    if (!bucketExists) {
      console.error(`❌ Bucket '${BUCKET_NAME}' does not exist.`);
      console.log('📋 Available buckets:', buckets.map(b => b.name).join(', '));
      return;
    }
    
    console.log(`✅ Bucket '${BUCKET_NAME}' found.`);
    
    // Check if exams table exists
    console.log('\n🔍 Checking exams table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('exams')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Exams table does not exist or is not accessible:', tableError.message);
      console.log('💡 Please run the create_exams_table.sql script first.');
      return;
    }
    
    console.log('✅ Exams table is accessible.');
    
    // Scan bucket structure
    console.log('\n🔍 Scanning bucket structure...');
    const exams = await scanBucketStructure();
    
    if (exams.length === 0) {
      console.log('⚠️  No exams found in bucket.');
      console.log('💡 Make sure files are in the correct structure: Exams/Class/Professor/Year/Grade/Filename');
      return;
    }
    
    console.log(`\n📊 Found ${exams.length} exams to insert.`);
    
    // Show sample of found exams
    console.log('\n📋 Sample of found exams:');
    exams.slice(0, 3).forEach((exam, index) => {
      console.log(`   ${index + 1}. ${exam.title} (${exam.file_type}, ${exam.file_size} bytes)`);
    });
    if (exams.length > 3) {
      console.log(`   ... and ${exams.length - 3} more`);
    }
    
    // Insert exams into database
    await insertExams(exams);
    
    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n🎉 Exam population process completed in ${totalDuration}s!`);
    
  } catch (error) {
    console.error('❌ Error in main process:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
main();
