import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Download } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onDownload: () => void;
  onClose: () => void;
}

export function PDFViewer({ fileUrl, fileName, onDownload, onClose }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<any>(null);
  const currentRenderTaskRef = useRef<any>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import PDF.js
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source to use local worker file
        const workerUrl = '/pdf.worker.min.js';
        console.log('Setting PDF.js worker URL:', workerUrl);
        
        // Force set the worker source and clear any existing worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        pdfjsLib.GlobalWorkerOptions.workerPort = null;

        // Load the PDF
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        
        // Render first page immediately
        await renderPage(1);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (err.message && (err.message.includes('worker') || err.message.includes('Setting up fake worker'))) {
          setError('PDF worker failed to load. Please refresh the page and try again.');
        } else if (err.message && err.message.includes('Failed to fetch')) {
          setError('Network error loading PDF. Please check your connection and try again.');
        } else {
          setError('Failed to load PDF. Please check if the file is accessible and try again.');
        }
        setLoading(false);
      }
    };

    loadPDF();
  }, [fileUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
      }
    };
  }, []);

  // Handle canvas resize with debouncing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout: NodeJS.Timeout;
    
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize events to prevent multiple rapid renders
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (totalPages > 0 && currentPage > 0) {
          renderPage(currentPage);
        }
      }, 100);
    });

    resizeObserver.observe(canvas);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [totalPages, currentPage]);

  const renderPage = async (pageNum: number) => {
    if (!pdfRef.current || !canvasRef.current) return;

    try {
      // Cancel any existing render task first
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
        currentRenderTaskRef.current = null;
      }

      const page = await pdfRef.current.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      const viewport = page.getViewport({ scale });
      
      // Set canvas size
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // Start new render task
      const renderTask = page.render(renderContext);
      currentRenderTaskRef.current = renderTask;
      
      try {
        await renderTask.promise;
      } catch (renderErr) {
        // Check if it's a cancellation error
        if (renderErr.name === 'RenderingCancelledException') {
          console.log('Render was cancelled, this is expected');
          return;
        }
        throw renderErr;
      }
      
    } catch (err) {
      console.error('Error rendering page:', err);
      if (err.name !== 'RenderingCancelledException') {
        setError('Failed to render page. Please try again.');
      }
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      renderPage(pageNum);
    }
  };

  const changeScale = (newScale: number) => {
    setScale(newScale);
    renderPage(currentPage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPage(currentPage - 1);
    } else if (e.key === 'ArrowRight') {
      goToPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 rounded-lg" style={{ backgroundColor: '#f9f5f0' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 rounded-lg" style={{ backgroundColor: '#f9f5f0' }}>
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
    <div className="h-full flex flex-col" style={{ backgroundColor: '#f9f5f0' }} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{fileName}</h3>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1 ml-4">
            <Button
              onClick={() => changeScale(scale - 0.2)}
              disabled={scale <= 0.5}
              variant="outline"
              size="sm"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
            
            <Button
              onClick={() => changeScale(scale + 0.2)}
              disabled={scale >= 3.0}
              variant="outline"
              size="sm"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: '#f9f5f0' }}>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
