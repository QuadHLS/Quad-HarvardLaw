// Utility functions to get page counts from PDF and DOCX files

export async function getPageCount(fileUrl: string, fileType: string): Promise<number> {
  try {
    if (fileType.toLowerCase() === 'pdf') {
      return await getPDFPageCount(fileUrl);
    } else if (fileType.toLowerCase() === 'docx') {
      return await getDOCXPageCount(fileUrl);
    }
    return 1; // Default fallback
  } catch (error) {
    console.error('Error getting page count:', error);
    return 1; // Default fallback
  }
}

async function getPDFPageCount(fileUrl: string): Promise<number> {
  try {
    // Dynamically import PDF.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    // Load the PDF
    const pdf = await pdfjsLib.getDocument(fileUrl).promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    return 1;
  }
}

async function getDOCXPageCount(fileUrl: string): Promise<number> {
  try {
    // For DOCX files, we'll use a simple estimation based on file size
    // This is a rough approximation since we can't easily parse DOCX without mammoth
    const response = await fetch(fileUrl, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('Failed to fetch file info');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const fileSizeKB = parseInt(contentLength) / 1024;
      // Rough estimation: 1 page per 50KB of file size (minimum 1 page)
      return Math.max(1, Math.ceil(fileSizeKB / 50));
    }
    
    return 1; // Default fallback
  } catch (error) {
    console.error('Error getting DOCX page count:', error);
    return 1;
  }
}

// Function to update page count in Supabase
export async function updatePageCountInSupabase(outlineId: string, pageCount: number) {
  try {
    const { supabase } = await import('../lib/supabase');
    
    const { error } = await supabase
      .from('outlines')
      .update({ pages: pageCount })
      .eq('id', outlineId);
    
    if (error) {
      console.error('Error updating page count:', error);
    } else {
      console.log(`Updated page count for outline ${outlineId}: ${pageCount} pages`);
    }
  } catch (error) {
    console.error('Error updating page count in Supabase:', error);
  }
}
