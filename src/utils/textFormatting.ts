/**
 * Utility functions for formatting text content
 */

/**
 * Converts line breaks in text to an array of lines with br indices
 * @param text - The text content that may contain line breaks
 * @returns Array of line objects with content and whether they need a break
 */
export function formatTextWithLineBreaks(text: string): Array<{ content: string; index: number }> {
  if (!text) return [];
  
  // Split text by line breaks
  const lines = text.split('\n');
  
  return lines.map((line, index) => ({ content: line, index }));
}

/**
 * Alternative approach using dangerouslySetInnerHTML for more complex formatting
 * Use this if you need to preserve other formatting like multiple spaces
 * @param text - The text content that may contain line breaks
 * @returns Object with dangerouslySetInnerHTML property
 */
export function formatTextWithLineBreaksHTML(text: string): { dangerouslySetInnerHTML: { __html: string } } {
  if (!text) return { dangerouslySetInnerHTML: { __html: '' } };
  
  // Replace line breaks with <br> tags and escape HTML
  const formattedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
  
  return { dangerouslySetInnerHTML: { __html: formattedText } };
}
