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
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Dynamically import mammoth
    const mammoth = await import('mammoth');
    
    // Convert DOCX to HTML to estimate pages
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    // Create a temporary DOM to analyze content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.value;
    
    // Estimate pages based on content length and structure
    const textContent = tempDiv.textContent || '';
    const contentLength = textContent.length;
    
    // Look for headings which might indicate page breaks
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    // Estimate pages based on content length (roughly 1500-2000 chars per page)
    let estimatedPages = Math.max(1, Math.ceil(contentLength / 1800));
    
    // If there are many headings, they might indicate page breaks
    if (headings.length > 0) {
      estimatedPages = Math.max(estimatedPages, Math.ceil(headings.length / 2));
    }
    
    return estimatedPages;
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
