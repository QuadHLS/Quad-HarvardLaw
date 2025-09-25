import { supabase } from '../lib/supabase';
import type { Outline } from '../types';

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
 * Scans the Outline storage bucket and returns all outline files with metadata
 */
export async function scanOutlineFiles(): Promise<OutlineFile[]> {
  try {
    console.log('Starting to scan outline files...');
    const outlineFiles: OutlineFile[] = [];
    
    // Recursively scan all folders to find outline files
    await scanFolder('', outlineFiles);
    
    console.log(`Scanning complete. Found ${outlineFiles.length} outline files.`);
    return outlineFiles;
  } catch (error) {
    console.error('Error scanning outline files:', error);
    return [];
  }
}

/**
 * Recursively scans a folder for outline files
 */
async function scanFolder(folderPath: string, outlineFiles: OutlineFile[]): Promise<void> {
  try {
    console.log(`Scanning folder: "${folderPath}"`);
    const { data: items, error } = await supabase.storage
      .from('Outline')
      .list(folderPath, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`Error listing folder ${folderPath}:`, error);
      return;
    }

    if (!items) {
      console.log(`No items found in folder: "${folderPath}"`);
      return;
    }

    console.log(`Found ${items.length} items in folder: "${folderPath}"`);

    for (const item of items) {
      const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
      
      // Check if it's a file by extension
      if (item.name.endsWith('.pdf') || item.name.endsWith('.docx')) {
        // This is definitely a file, parse it
        const metadata = parseFilePath(fullPath);
        
        if (metadata) {
          const outlineFile: OutlineFile = {
            id: generateId(),
            title: metadata.title,
            course: metadata.course,
            instructor: metadata.instructor,
            year: metadata.year,
            type: metadata.type,
            pages: await estimatePageCount(fullPath),
            rating: 0.0,
            file_path: fullPath,
            file_type: fullPath.endsWith('.pdf') ? 'pdf' : 'docx',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          outlineFiles.push(outlineFile);
          console.log(`Found outline file: ${fullPath}`);
        }
      } else {
        // This is likely a folder, scan it recursively
        console.log(`Scanning folder: ${fullPath}`);
        await scanFolder(fullPath, outlineFiles);
      }
    }
  } catch (error) {
    console.error(`Error scanning folder ${folderPath}:`, error);
  }
}

/**
 * Parses a file path to extract course, instructor, year, and grade information
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
    // Split the path by '/'
    const pathParts = filePath.split('/');
    
    if (pathParts.length < 5) {
      console.warn('Invalid file path format:', filePath);
      return null;
    }

    const course = pathParts[0];
    const instructor = pathParts[1];
    const year = pathParts[2];
    const type = pathParts[3];
    const filename = pathParts[4];

    // Extract title from filename (remove extension)
    const title = filename.replace(/\.(pdf|docx)$/i, '');

    // Validate the grade type
    if (!['DS', 'H', 'P'].includes(type)) {
      console.warn('Invalid grade type:', type, 'in path:', filePath);
      return null;
    }

    return {
      course,
      instructor,
      year,
      type,
      title
    };
  } catch (error) {
    console.error('Error parsing file path:', filePath, error);
    return null;
  }
}

/**
 * Estimates page count based on file size (rough approximation)
 */
async function estimatePageCount(filePath: string): Promise<number> {
  try {
    // Get file metadata by listing the parent folder and finding the file
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');

    const { data: fileData, error } = await supabase.storage
      .from('Outline')
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
 * Generates a unique ID for outline files (proper UUID format)
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Populates the outlines table with files from storage
 */
export async function populateOutlinesTable(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('Scanning outline files from storage...');
    const outlineFiles = await scanOutlineFiles();
    
    if (outlineFiles.length === 0) {
      return { success: false, count: 0, error: 'No outline files found' };
    }

    console.log(`Found ${outlineFiles.length} outline files`);

    // Insert files into database
    const { data, error } = await supabase
      .from('outlines')
      .insert(outlineFiles);

    if (error) {
      console.error('Error inserting outline files:', error);
      return { success: false, count: 0, error: error.message };
    }

    console.log(`Successfully inserted ${outlineFiles.length} outline files`);
    return { success: true, count: outlineFiles.length };
  } catch (error) {
    console.error('Error populating outlines table:', error);
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Gets a signed URL for downloading an outline file
 */
export async function getOutlineDownloadUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('Outline')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    return null;
  }
}

/**
 * Fetches all outlines from the database
 */
export async function fetchOutlines(): Promise<Outline[]> {
  try {
    const { data, error } = await supabase
      .from('outlines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outlines:', error);
      return [];
    }

    // Transform OutlineFile[] to Outline[]
    return (data || []).map((item: OutlineFile): Outline => ({
      id: item.id,
      title: item.title,
      year: item.year,
      type: item.type,
      rating: item.rating,
      ratingCount: 0, // Default value
      course: item.course,
      instructor: item.instructor,
      fileType: item.file_type === 'pdf' ? 'PDF' : 'DOC',
      fileUrl: '', // Will be generated when needed
      pages: item.pages
    }));
  } catch (error) {
    console.error('Error fetching outlines:', error);
    return [];
  }
}
