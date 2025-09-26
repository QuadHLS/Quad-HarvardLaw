import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Download, Search, X } from 'lucide-react';

interface DOCXViewerProps {
  fileUrl: string;
  fileName: string;
  onDownload: () => void;
  onClose: () => void;
}

export function DOCXViewer({ fileUrl, fileName, onDownload, onClose }: DOCXViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightedContent, setHighlightedContent] = useState<string>('');

  useEffect(() => {
    const loadDOCX = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the file
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Dynamically import mammoth
        const mammoth = await import('mammoth');
        
        // Convert DOCX to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
        setHighlightedContent(result.value);
        
        // Log any conversion messages
        if (result.messages.length > 0) {
          console.log('DOCX conversion messages:', result.messages);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading DOCX:', err);
        setError('Failed to load DOCX file. Please try again.');
        setLoading(false);
      }
    };

    loadDOCX();
  }, [fileUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const searchInDOCX = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      setHighlightedContent(content);
      return;
    }

    const regex = new RegExp(`(${term})`, 'gi');
    const results: any[] = [];
    let match;
    let index = 0;

    while ((match = regex.exec(content)) !== null) {
      results.push({
        text: match[0],
        index: match.index,
        position: index++
      });
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);

    // Highlight search terms
    const highlighted = content.replace(regex, '<mark style="background-color: yellow; padding: 2px 0;">$1</mark>');
    setHighlightedContent(highlighted);
  };

  const goToNextResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      scrollToResult(searchResults[nextIndex]);
    }
  };

  const goToPreviousResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      scrollToResult(searchResults[prevIndex]);
    }
  };

  const scrollToResult = (result: any) => {
    // Find the highlighted element and scroll to it
    const marks = document.querySelectorAll('mark');
    if (marks[result.position]) {
      marks[result.position].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setHighlightedContent(content);
  };

  // Auto-search with debouncing
  useEffect(() => {
    // Always start with clean content when search term changes
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setHighlightedContent(content);

    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchInDOCX(searchTerm);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading DOCX...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Search Bar */}
      <div className="p-2 bg-white border-b">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Search in DOCX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-7 h-8 text-sm"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <span>
              {currentSearchIndex + 1} of {searchResults.length} results
            </span>
            <div className="flex gap-0.5">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousResult}
                disabled={searchResults.length === 0}
                className="h-5 px-1.5 text-xs"
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextResult}
                disabled={searchResults.length === 0}
                className="h-5 px-1.5 text-xs"
              >
                ↓
              </Button>
            </div>
          </div>
        )}
        {searchResults.length === 0 && searchTerm && (
          <div className="mt-1 text-xs text-gray-500">
            No results found
          </div>
        )}
      </div>

      {/* Header Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <h3 className="font-semibold text-sm">{fileName}</h3>
        
        <div className="flex items-center gap-1">
          <Button onClick={onDownload} variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          
          <Button onClick={onClose} variant="outline" size="sm" className="h-7 px-2 text-xs">
            Close
          </Button>
        </div>
      </div>

      {/* DOCX Content */}
      <div className="flex-1 overflow-auto bg-white p-6">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6',
            color: '#333'
          }}
        />
      </div>
    </div>
  );
}
