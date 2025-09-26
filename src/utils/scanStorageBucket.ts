import { supabase } from '../lib/supabase';

export interface OutlineFile {
  id: string;
  title: string;
  course: string;
  instructor: string;
  year: string;
  type: string; // DS, H, P
  pages: number;
  rating: number;
  file_path: string;
  file_type: 'pdf' | 'docx';
  created_at: string;
  updated_at: string;
}

/**
 * Generates a proper UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Recursively scans the Outline storage bucket to find all files
 */
async function scanBucketRecursively(folderPath: string = ''): Promise<string[]> {
  const allFiles: string[] = [];
  
  try {
    console.log(`Scanning folder: "${folderPath}"`);
    
    const { data: items, error } = await supabase.storage
      .from('Outlines')
      .list(folderPath, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`Error listing folder ${folderPath}:`, error);
      return allFiles;
    }

    if (!items || items.length === 0) {
      console.log(`No items found in folder: "${folderPath}"`);
      return allFiles;
    }

    console.log(`Found ${items.length} items in folder: "${folderPath}"`);

    for (const item of items) {
      const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
      
      // Check if it's a file by extension
      if (item.name.endsWith('.pdf') || item.name.endsWith('.docx')) {
        console.log(`Found file: ${fullPath}`);
        allFiles.push(fullPath);
      } else {
        // This is likely a folder, scan it recursively
        const subFiles = await scanBucketRecursively(fullPath);
        allFiles.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error scanning folder ${folderPath}:`, error);
  }
  
  return allFiles;
}

/**
 * Parses a file path to extract metadata
 * Expected format: Course/Instructor/Year/Grade/Filename.ext
 */
function parseFilePath(filePath: string): {
  course: string;
  instructor: string;
  year: string;
  type: string;
  title: string;
} | null {
  try {
    const pathParts = filePath.split('/');
    
    if (pathParts.length < 5) {
      console.warn(`Invalid file path format: ${filePath} (expected: Course/Instructor/Year/Grade/Filename.ext)`);
      return null;
    }

    const course = pathParts[0];
    const instructor = pathParts[1];
    const year = pathParts[2];
    const type = pathParts[3];
    const filename = pathParts[4];

    // Validate the grade type
    if (!['DS', 'H', 'P'].includes(type)) {
      console.warn(`Invalid grade type: ${type} in path: ${filePath}`);
      return null;
    }

    // Helper function to format outline display name
    const formatOutlineDisplayName = (course: string, instructor: string, year: string, grade: string): string => {
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

    // Generate formatted title
    const title = formatOutlineDisplayName(course, instructor, year, type);

    return {
      course,
      instructor,
      year,
      type,
      title
    };
  } catch (error) {
    console.error(`Error parsing file path: ${filePath}`, error);
    return null;
  }
}

/**
 * Estimates page count based on file size
 */
async function estimatePageCount(filePath: string): Promise<number> {
  try {
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');

    const { data: fileData, error } = await supabase.storage
      .from('Outlines')
      .list(folderPath || '', {
        search: fileName
      });

    if (error || !fileData || fileData.length === 0) {
      return 25; // Default estimate
    }

    const file = fileData.find(f => f.name === fileName);
    if (!file) {
      return 25; // Default estimate
    }

    const sizeInMB = (file.metadata?.size || 0) / (1024 * 1024);

    // Rough estimation: 1 page ≈ 50KB for PDFs, 30KB for Word docs
    const avgPageSize = filePath.endsWith('.pdf') ? 0.05 : 0.03;
    const estimatedPages = Math.max(1, Math.round(sizeInMB / avgPageSize));

    return Math.min(estimatedPages, 200); // Cap at 200 pages
  } catch (error) {
    console.error('Error estimating page count:', error);
    return 25; // Default fallback
  }
}

/**
 * Scans the storage bucket and populates the database
 */
export async function scanAndPopulateOutlines(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('Starting to scan Outline storage bucket...');
    
    // Scan all files in the bucket
    const allFiles = await scanBucketRecursively();
    console.log(`Found ${allFiles.length} total files in storage bucket`);
    
    if (allFiles.length === 0) {
      return { success: false, count: 0, error: 'No files found in storage bucket' };
    }

    // Parse each file and create outline records
    const outlineFiles: OutlineFile[] = [];
    
    for (const filePath of allFiles) {
      const metadata = parseFilePath(filePath);
      
      if (metadata) {
        const outlineFile: OutlineFile = {
          id: generateUUID(),
          title: metadata.title,
          course: metadata.course,
          instructor: metadata.instructor,
          year: metadata.year,
          type: metadata.type,
          pages: await estimatePageCount(filePath),
          rating: 0.0, // Default rating
          file_path: filePath,
          file_type: filePath.endsWith('.pdf') ? 'pdf' : 'docx',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        outlineFiles.push(outlineFile);
        console.log(`Processed: ${filePath}`);
      }
    }

    if (outlineFiles.length === 0) {
      return { success: false, count: 0, error: 'No valid outline files found (check file path format)' };
    }

    console.log(`Processed ${outlineFiles.length} valid outline files`);

    // Clear existing data first
    console.log('Clearing existing outlines from database...');
    const { error: deleteError } = await supabase
      .from('outlines')
      .delete()
      .gte('created_at', '1900-01-01'); // Delete all records using a date filter

    if (deleteError) {
      console.warn('Error clearing existing data:', deleteError);
    }

    // Insert new data
    console.log('Inserting outline files into database...');
    const { data, error } = await supabase
      .from('outlines')
      .insert(outlineFiles);

    if (error) {
      console.error('Error inserting outline files:', error);
      return { success: false, count: 0, error: error.message };
    }

    console.log(`Successfully inserted ${outlineFiles.length} outline files into database`);
    return { success: true, count: outlineFiles.length };
  } catch (error) {
    console.error('Error scanning and populating outlines:', error);
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
