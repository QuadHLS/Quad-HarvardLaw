/**
 * Utility functions for extracting page counts from uploaded files
 * Uses Tier 1 method: DOCX metadata (app.xml) or PDF page counting
 * 
 * Note: Requires jszip and pdfjs-dist packages
 */

/**
 * Extract page count from a DOCX file using app.xml metadata (Tier 1)
 * DOCX files are ZIP archives containing XML files
 */
export async function getDocxPageCount(file: File): Promise<number | null> {
  try {
    if (typeof window === 'undefined') return null;

    // Dynamically import JSZip
    let JSZip;
    try {
      JSZip = (await import('jszip')).default;
    } catch {
      return null;
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Read docProps/app.xml which contains page count
    const appXmlFile = zip.file('docProps/app.xml');
    if (!appXmlFile) {
      return null; // app.xml not found
    }

    const appXmlContent = await appXmlFile.async('text');
    
    // Parse XML to find Pages element
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(appXmlContent, 'text/xml');
    
    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      return null;
    }

    // Search all elements for one containing 'Pages' in tag name
    const allElements = xmlDoc.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const elem = allElements[i];
      const tagName = elem.tagName || elem.nodeName;
      
      // Check if tag contains 'Pages' (handles namespaced tags like 'app:Pages' or '{ns}Pages')
      if (tagName.includes('Pages')) {
        const text = elem.textContent || elem.text;
        if (text && !isNaN(parseInt(text)) && parseInt(text) > 0) {
          return parseInt(text);
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract page count from a PDF file (Tier 1)
 * Uses pdf.js library for browser-based PDF page counting
 */
export async function getPdfPageCount(file: File): Promise<number | null> {
  try {
    if (typeof window === 'undefined') return null;

    // Dynamically import pdfjs-dist
    let pdfjsLib;
    try {
      pdfjsLib = await import('pdfjs-dist');
    } catch {
      return null;
    }
    
    // Set worker source for pdf.js (use local worker or CDN fallback)
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Try to use local worker first, fallback to CDN
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } catch {
        // Fallback to CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch {
    return null;
  }
}

/**
 * Extract page count from an uploaded file (Tier 1 only)
 * Returns null if extraction fails or libraries unavailable
 */
export async function extractPageCount(file: File): Promise<number | null> {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'docx') {
      return await getDocxPageCount(file);
    } else if (fileExtension === 'pdf') {
      return await getPdfPageCount(file);
    }
    
    return null;
  } catch {
    return null;
  }
}

