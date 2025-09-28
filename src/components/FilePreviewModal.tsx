import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { PDFViewer } from './PDFViewer';
import { DOCXViewer } from './DOCXViewer';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
  onDownload: () => void;
}

export function FilePreviewModal({ 
  isOpen, 
  onClose, 
  fileUrl, 
  fileName, 
  fileType, 
  onDownload 
}: FilePreviewModalProps) {
  const isPDF = fileType.toLowerCase() === 'pdf';
  const isDOCX = fileType.toLowerCase() === 'docx';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl h-[90vh] p-0"
        aria-describedby="file-preview-description"
      >
        <div id="file-preview-description" className="sr-only">
          File preview modal for {fileName}
        </div>
        <div className="h-full">
          {isPDF && (
            <PDFViewer
              fileUrl={fileUrl}
              fileName={fileName}
              onDownload={onDownload}
              onClose={onClose}
            />
          )}
          
          {isDOCX && (
            <DOCXViewer
              fileUrl={fileUrl}
              fileName={fileName}
              onDownload={onDownload}
              onClose={onClose}
            />
          )}
          
          {!isPDF && !isDOCX && (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Preview not available for {fileType} files
                </p>
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                >
                  Download File
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
