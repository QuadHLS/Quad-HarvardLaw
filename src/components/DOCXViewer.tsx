import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

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
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-lg">{fileName}</h3>
        
        <div className="flex items-center gap-2">
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>

      {/* DOCX Content */}
      <div className="flex-1 overflow-auto bg-white p-6">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
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
