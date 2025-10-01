import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Search, X } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onDownload: () => void;
  onClose: () => void;
  hideSearch?: boolean;
  hideDownload?: boolean;
}

export function PDFViewer({ fileUrl, fileName: _fileName, onDownload, onClose, hideSearch = false, hideDownload = false }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // zoom model: renderScale = baseScale (fit) * scale (user zoom factor)
  const [scale, setScale] = useState(1.0); // user zoom factor (1.0 => 100%)
  const [baseScale, setBaseScale] = useState<number | null>(null); // last fit-to-container scale
  const scaleRef = useRef<number>(1.0);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const pdfRef = useRef<any>(null);
  const currentRenderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRenderingRef = useRef<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const boundaryScrollAccumulatorRef = useRef<number>(0);
  // Suppress re-fit shortly after user zoom to avoid multiple increments per click
  const suppressRefitUntilRef = useRef<number>(0);

  // Disable wheel scrolling/page switching entirely
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel as any);
  }, []);

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
        
        // Auto-fit to width on first load
        await fitToWidth();
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (err instanceof Error && (err.message.includes('worker') || err.message.includes('Setting up fake worker'))) {
          setError('PDF worker failed to load. Please refresh the page and try again.');
        } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
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

  // Handle container/window resize with debouncing; re-fit baseline then restore user zoom
  useEffect(() => {
    const target = scrollContainerRef.current || containerRef.current;
    let resizeTimeout: NodeJS.Timeout;

    const scheduleFit = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (now < suppressRefitUntilRef.current) {
          return; // ignore resize events during suppression window
        }
        if (totalPages > 0 && currentPage > 0) {
          const prev = scaleRef.current; // remember current zoom
          fitToWidth().then(() => {
            setScale(prev);
            renderPage(currentPage);
          });
        }
      }, 120);
    };

    const ro = target ? new ResizeObserver(scheduleFit) : null;
    if (ro && target) ro.observe(target);

    const handleWindowResize = scheduleFit;
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(resizeTimeout);
      if (ro && target) ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [totalPages, currentPage]);


  const renderPage = async (pageNum: number, customScale?: number) => {
    if (!pdfRef.current || !canvasRef.current) return;

    // Prevent multiple simultaneous renders
    if (isRenderingRef.current) {
      return;
    }

    try {
      isRenderingRef.current = true;

      // Cancel any existing render task first and wait for it to complete
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
          // Wait a bit for the cancellation to take effect
          await new Promise(resolve => setTimeout(resolve, 50));
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

      // Get device pixel ratio for high-DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      const effectiveBase = baseScale ?? 1.0;
      const renderScale = customScale !== undefined ? customScale : effectiveBase * (scaleRef.current ?? scale);
      
      // Create viewport with the desired scale
      const viewport = page.getViewport({ scale: renderScale });
      
      // Set canvas size for high-DPI display (multiply by device pixel ratio)
      canvas.height = viewport.height * devicePixelRatio;
      canvas.width = viewport.width * devicePixelRatio;
      
      // Scale the canvas back down using CSS for crisp rendering
      canvas.style.height = `${viewport.height}px`;
      canvas.style.width = `${viewport.width}px`;
      
      // Scale the drawing context so everything draws at the higher resolution
      context.scale(devicePixelRatio, devicePixelRatio);
      
      // Completely reset the canvas and context
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Reset all context properties to default state
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalAlpha = 1.0;
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = '#000000';
      context.strokeStyle = '#000000';
      context.lineWidth = 1;
      context.lineCap = 'butt';
      context.lineJoin = 'miter';
      context.miterLimit = 10;
      
      // Apply device pixel ratio scaling
      context.scale(devicePixelRatio, devicePixelRatio);

      // Enable better text rendering
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      const renderContext = {
        canvasContext: context,
        viewport: viewport, // Use the same viewport for rendering
      };

      // Start new render task
      const renderTask = page.render(renderContext);
      currentRenderTaskRef.current = renderTask;
      
      try {
        await renderTask.promise;
        
        // After rendering, highlight all search results on this page
        if (searchResults.length > 0) {
          const resultsOnThisPage = searchResults.filter(result => result.page === pageNum);
          if (resultsOnThisPage.length > 0) {
            // Small delay to ensure the page is fully rendered
            setTimeout(() => {
              highlightAllResultsOnPage(resultsOnThisPage);
            }, 50);
          }
        }
      } catch (renderErr) {
        // Check if it's a cancellation error
        if ((renderErr as any).name === 'RenderingCancelledException') {
          console.log('Render was cancelled, this is expected');
          isRenderingRef.current = false;
          return;
        }
        throw renderErr;
      }
      
    } catch (err) {
      console.error('Error rendering page:', err);
      if ((err as any).name !== 'RenderingCancelledException') {
        setError('Failed to render page. Please try again.');
      }
    } finally {
      isRenderingRef.current = false;
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      // Suppress resize-driven re-fit briefly after page switches
      suppressRefitUntilRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 250;
      // Use latest zoom * base scale (avoid stale closure)
      const base = baseScale ?? 1.0;
      renderPage(pageNum, base * (scaleRef.current ?? 1.0));
      // Reset scroll position to top when changing pages
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      // Reset boundary scroll accumulator
      boundaryScrollAccumulatorRef.current = 0;
    }
  };

  const clampScale = (value: number) => Math.max(0.1, Math.min(4.0, value));

  const changeScale = (newScale: number) => {
    const clamped = clampScale(newScale);
    scaleRef.current = clamped;
    setScale(clamped);
    // Suppress re-fit triggered by ResizeObserver shortly after zoom click
    suppressRefitUntilRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 250;
    // render with clamped scale; do not trigger fit during this render
    const effectiveBase = baseScale ?? 1.0;
    renderPage(currentPage, effectiveBase * clamped);
  };

  const fitToWidth = async () => {
    if (!pdfRef.current || !canvasRef.current) return;
    
    try {
      const page = await pdfRef.current.getPage(currentPage);
      // Prefer the scroll container, then the outer container
      const container = (scrollContainerRef.current || containerRef.current || canvasRef.current.parentElement?.parentElement) as HTMLElement | null;
      let containerWidth = container?.clientWidth ?? 0;
      let containerHeight = container?.clientHeight ?? 0;
      if (!containerWidth || !containerHeight) {
        const rect = container?.getBoundingClientRect();
        containerWidth = rect?.width || window.innerWidth;
        containerHeight = rect?.height || window.innerHeight;
      }
      // Guard against zero sizes on first paint
      containerWidth = Math.max(200, containerWidth);
      containerHeight = Math.max(200, containerHeight);
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Calculate scale to fit both width and height, with some padding
      const scaleX = (containerWidth - 40) / viewport.width; // 40px padding (20px on each side)
      const scaleY = (containerHeight - 40) / viewport.height; // 40px padding (20px top/bottom)
      const newBase = Math.min(scaleX, scaleY); // Use the smaller scale to fit both dimensions
      const clampedBase = Math.max(0.3, Math.min(3.0, newBase));
      setBaseScale(clampedBase);
      // Render with preserved user zoom factor
      renderPage(currentPage, clampedBase * (scaleRef.current ?? 1.0));
    } catch (err) {
      console.error('Error fitting to width:', err);
    }
  };

  // (fitToPage removed - not used)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPage(currentPage - 1);
    } else if (e.key === 'ArrowRight') {
      goToPage(currentPage + 1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      if (scale < 4.0) {
        changeScale(scale + 0.1);
      }
    } else if (e.key === '-') {
      e.preventDefault();
      if (scale > 0.3) {
        changeScale(scale - 0.1);
      }
    } else if (e.key === '0') {
      e.preventDefault();
      fitToWidth();
    }
  };


  const searchInPDF = async (term: string) => {
    if (!pdfRef.current || !term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    setIsSearching(true);
    try {
      const results: any[] = [];
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfRef.current.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Get text items with their positions
        const textItems = textContent.items;
        const fullText = textItems.map((item: any) => item.str).join(' ');
        
        // Simple substring matching - matches exactly what you type in order
        // Escape special regex characters in the search term
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Use simple substring matching - no word boundaries, no special rules
        // Just matches the exact characters in the exact order you type
        const regex = new RegExp(escapedTerm, 'gi');
        let match;
        while ((match = regex.exec(fullText)) !== null) {
          // Find the text item that contains this match
          let charIndex = 0;
          let foundItem = null;
          let itemIndex = 0;
          let charOffset = 0;
          
          for (let i = 0; i < textItems.length; i++) {
            const item = textItems[i] as any;
            const itemLength = item.str.length;
            
            if (charIndex + itemLength > match.index) {
              foundItem = item;
              itemIndex = i;
              charOffset = match.index - charIndex;
              break;
            }
            charIndex += itemLength;
          }
          
          if (foundItem) {
            // Verify that the match is actually within this text item
            const itemText = foundItem.str;
            const actualMatch = itemText.substring(charOffset, charOffset + match[0].length);
            
            if (actualMatch.toLowerCase() === match[0].toLowerCase()) {
              results.push({
                page: pageNum,
                text: match[0],
                index: match.index,
                textItem: foundItem,
                itemIndex: itemIndex,
                charOffset: charOffset
              });
            }
          }
        }
      }
      
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      // If we have results, jump to the first result's page
      if (results.length > 0) {
        const firstResult = results[0];
        if (firstResult.page !== currentPage) {
          // Jump to the page with the first result
          setCurrentPage(firstResult.page);
        }
        // The highlighting will happen automatically when the page renders
      }
    } catch (err) {
      console.error('Error searching PDF:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const goToNextResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      const result = searchResults[nextIndex];
      setCurrentPage(result.page);
      // All results on the page will be highlighted automatically when the page renders
    }
  };

  const goToPreviousResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      const result = searchResults[prevIndex];
      setCurrentPage(result.page);
      // All results on the page will be highlighted automatically when the page renders
    }
  };

  const highlightAllResultsOnPage = async (results: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas || results.length === 0) return;

    try {
      // Get the current page to access text item coordinates
      const page = await pdfRef.current.getPage(results[0].page);
      const viewport = page.getViewport({ scale });
      
      // Create a temporary canvas for highlighting
      const highlightCanvas = document.createElement('canvas');
      highlightCanvas.width = canvas.width;
      highlightCanvas.height = canvas.height;
      const highlightContext = highlightCanvas.getContext('2d');
      
      if (!highlightContext) return;
      
      // Draw the original canvas content
      highlightContext.drawImage(canvas, 0, 0);
      
      // Highlight each result on this page
      for (const result of results) {
        if (!result.textItem) continue;
        
        const textItem = result.textItem;
        const transform = textItem.transform;
        const searchedText = result.text;
        const fullText = textItem.str;
        const charOffset = result.charOffset || 0;
        
        // Calculate the width of text before the searched term
        const context = canvas.getContext('2d');
        if (!context) continue;
        
        // Set the same font as the text item for accurate measurement
        context.font = `${textItem.height}px ${textItem.fontName || 'sans-serif'}`;
        
        // Measure text before the searched term
        const textBefore = fullText.substring(0, charOffset);
        const textWidthBefore = context.measureText(textBefore).width;
        
        // Measure the searched term width
        const searchedTextWidth = context.measureText(searchedText).width;
        
        // Calculate highlight rectangle for just the searched term
        const x = transform[4] + textWidthBefore;
        const y = viewport.height - transform[5] - textItem.height;
        const width = searchedTextWidth;
        const height = textItem.height;
        
        // Draw highlight overlay for this result
        highlightContext.fillStyle = 'rgba(255, 165, 0, 0.6)'; // Orange highlight
        highlightContext.fillRect(x, y, width, height);
        
        // Add a subtle border to make it more prominent
        highlightContext.strokeStyle = 'rgba(255, 140, 0, 0.8)'; // Darker orange border
        highlightContext.lineWidth = 1;
        highlightContext.strokeRect(x, y, width, height);
      }
      
      // Replace the original canvas content
      const originalContext = canvas.getContext('2d');
      if (originalContext) {
        originalContext.clearRect(0, 0, canvas.width, canvas.height);
        originalContext.drawImage(highlightCanvas, 0, 0);
      }
      
    } catch (err) {
      console.error('Error highlighting search results:', err);
    }
  };

  // highlightSearchResult removed (unused)

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  };

  // Auto-search with debouncing
  useEffect(() => {
    // Clear previous search results immediately when search term changes
    if (searchTerm !== '') {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      
      // Clear the canvas to remove previous highlights
      const canvas = canvasRef.current;
      if (canvas && pdfRef.current) {
        // Re-render the page without highlights
        renderPage(currentPage);
      }
    } else {
      // If search term is empty, clear everything
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }

    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchInPDF(searchTerm);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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
    <div ref={containerRef} className="h-full w-full flex flex-col overflow-hidden" style={{ backgroundColor: '#f9f5f0' }} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Search Bar */}
      {!hideSearch && (
        <div className="p-2 bg-white border-b">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Search in PDF..."
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
        {isSearching && searchTerm && (
          <div className="mt-1 text-xs text-gray-600">
            <span>Searching...</span>
          </div>
        )}
        {searchResults.length > 0 && !isSearching && (
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
        {searchResults.length === 0 && !isSearching && searchTerm && (
          <div className="mt-1 text-xs text-gray-500">
            No results found
          </div>
        )}
        </div>
      )}


      {/* Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-1">
          <Button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            variant="outline"
            size="sm"
            className="h-7 px-2"
            title="Previous Page"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          
          <span className="text-xs text-gray-500 px-2" title="Use mouse wheel to scroll through pages">
            {currentPage} / {totalPages}
          </span>
          
          <Button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            variant="outline"
            size="sm"
            className="h-7 px-2"
            title="Next Page"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
          
          <div className="w-px h-4 bg-gray-300 mx-2"></div>
          
          <Button
            onClick={() => changeScale(scale - 0.1)}
            disabled={scale <= 0.3}
            variant="outline"
            size="sm"
            className="h-7 px-2"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          
          <span className="text-xs px-1 min-w-[2.5rem] text-center">{Math.round(scale * 100)}%</span>
          
          <Button
            onClick={() => changeScale(scale + 0.1)}
            disabled={scale >= 4.0}
            variant="outline"
            size="sm"
            className="h-7 px-2"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
          
          <div className="w-px h-4 bg-gray-300 mx-2"></div>
          
          <Button
            onClick={fitToWidth}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            title="Fit to Container"
          >
            Fit
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          {!hideDownload && (
            <Button onClick={onDownload} variant="outline" size="sm" className="h-7 px-2 text-xs">
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          )}
          
          <Button onClick={onClose} variant="outline" size="sm" className="h-7 px-2 text-xs">
            <X className="w-3 h-3 mr-1" />
            Close
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-hidden p-4 w-full" 
        style={{ backgroundColor: '#f9f5f0', minHeight: 0 }}
      >
        <div className="flex justify-center w-full h-full">
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
            style={{ imageRendering: '-webkit-optimize-contrast', display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
}
