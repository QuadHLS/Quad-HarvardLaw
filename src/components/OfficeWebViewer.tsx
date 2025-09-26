import React from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';

interface OfficeWebViewerProps {
  fileUrl: string;
  fileName: string;
  onDownload: () => void;
  onClose: () => void;
}

export function OfficeWebViewer({ fileUrl, fileName, onDownload, onClose }: OfficeWebViewerProps) {
  // Encode the file URL for the Office Web Viewer
  const encodedFileUrl = encodeURIComponent(fileUrl);
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedFileUrl}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <h3 className="font-semibold text-sm">{fileName}</h3>
        
        <div className="flex items-center gap-1">
          <Button onClick={onDownload} variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          
          <Button onClick={onClose} variant="outline" size="sm" className="h-7 px-2 text-xs">
            <X className="w-3 h-3 mr-1" />
            Close
          </Button>
        </div>
      </div>

      {/* Office Web Viewer iframe */}
      <div className="flex-1 bg-white">
        <iframe
          src={viewerUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          title={`Office Web Viewer - ${fileName}`}
          className="w-full h-full"
          onError={() => {
            console.error('Office Web Viewer failed to load');
          }}
        />
      </div>

      {/* Fallback message */}
      <div className="p-2 bg-yellow-50 border-t text-xs text-yellow-800">
        <strong>Note:</strong> This viewer requires your document to be publicly accessible. 
        If you see an error, the file may be private or the Office Web Viewer service may be unavailable.
      </div>
    </div>
  );
}
