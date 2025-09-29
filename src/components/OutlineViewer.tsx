import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Download, Share, Bookmark, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { Outline } from '../types';

interface OutlineViewerProps {
  outline: Outline | null;
  onSaveOutline: (outline: Outline) => void;
  isSaved: boolean;
  documentType?: 'outline' | 'exam';
}

export function OutlineViewer({ outline, onSaveOutline, isSaved, documentType = 'outline' }: OutlineViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const totalPages = outline ? outline.pages : 0;

  // Dynamic text based on document type
  const documentTypeText = documentType === 'exam' ? 'exam' : 'outline';
  const documentTypeTextCapitalized = documentType === 'exam' ? 'Exam' : 'Outline';

  // Reset to page 1 and clear search when a new outline is selected
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [outline?.id]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#f9f5f0' }}>
      {!outline ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600 text-lg font-medium mb-2">Search and Select an {documentTypeTextCapitalized} to Preview</p>
            <p className="text-gray-500 text-sm">Use the search filters on the left to find and select an {documentTypeText} to view its content.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 pt-2 pb-0 bg-gray-700 text-white">
            {/* Left Section - Page Navigation */}
            <div className="flex items-center gap-3 py-1.5">
              <span className="text-sm text-white/90 min-w-12 text-center">
                {outline ? `${currentPage} / ${totalPages}` : '— / —'}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!outline || currentPage === 1}
                  className="h-8 w-8 p-0 text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  ←
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={!outline || currentPage === totalPages}
                  className="h-8 w-8 p-0 text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  →
                </Button>
              </div>
            </div>

            {/* Center Section - Search Bar */}
            <div className="relative flex-1 max-w-lg mx-6">
              <Input
                placeholder={outline ? (outline.pages <= 25 ? "Search in Attack" : "Search in Outline") : ""}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!outline}
                className="h-8 bg-gray-600 border-gray-500 text-white placeholder:text-gray-400 pr-10 focus:ring-1 focus:ring-gray-400"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Right Section - Zoom Controls and Actions */}
            <div className="flex items-center gap-2 py-1.5">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomOut}
                  disabled={!outline || zoom <= 50}
                  className="h-8 w-8 p-0 text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-white/90 min-w-12 text-center">
                  {outline ? `${zoom}%` : '—'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomIn}
                  disabled={!outline || zoom >= 200}
                  className="h-8 w-8 p-0 text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Separator */}
              <div className="w-px h-5 bg-gray-500 mx-1" />
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled={!outline} 
                  className="h-8 w-8 p-0 text-white hover:bg-gray-600 bg-gray-800 disabled:opacity-50"
                >
                  <Share className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled={!outline} 
                  onClick={() => outline && onSaveOutline(outline)}
                  className={`h-8 w-8 p-0 text-white hover:bg-gray-600 disabled:opacity-50 ${
                    isSaved ? 'bg-green-800 hover:bg-green-700' : 'bg-gray-800'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled={!outline} 
                  className="h-8 w-8 p-0 text-white hover:bg-gray-600 bg-gray-800 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Document Viewer */}
          <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: '#f9f5f0' }}>
        <div 
          className="mx-auto shadow-lg"
          style={{ 
            width: `${8.5 * (zoom / 100)}in`,
            minHeight: `${11 * (zoom / 100)}in`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            backgroundColor: 'var(--background-color, #f9f5f0)'
          }}
        >
          <div className="p-8">
            {/* Sample Property Outline Content */}
            <div className="text-center mb-6">
              <h1 className="text-red-600 text-xl font-medium">Property Outline</h1>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h2 className="text-blue-600 font-medium">I. Possession and the Initial Allocation of Property</h2>
                <div className="ml-4 mt-2">
                  <h3 className="font-medium">1) Obtaining Property</h3>
                  <ul className="ml-4 space-y-1">
                    <li>• Questions: What acts amount to occupancy/property interest?</li>
                    <li>• Rules for occupying possessor:</li>
                    <ul className="ml-4 space-y-1">
                      <li>(1) <strong>Original Possession/Martial Wounding</strong> (Pierson v. Post): claims more consideration than others, but not conclusive</li>
                      <li>• Dissent - actual bodily seizure isn't but, court reforms</li>
                      <li>• Social Utility: Rewards good hunters</li>
                    </ul>
                    <li>(2) <strong>Fox Theory</strong> (Ghen v. Rich): if impracticality because whales sink, if it is possessory if the whaling company is first one that lands on the...</li>
                  </ul>
                </div>
              </div>

              <div className="ml-8">
                <h4 className="font-medium">• Fairness rewards labor of attempting resources</h4>
                <h4 className="font-medium">• Administratively: clear subdivided for everyone</h4>
                <p className="ml-4">Identify the property interests in resources where property "seize"</p>
              </div>

              <div className="ml-4">
                <h3 className="font-medium">(3) Law of Capture:</h3>
                <p className="ml-4">First common use, rule states first person to capture resource owns it, even if resource is obtained in trespass or some another person's land. (See <strong>Rule of Capture</strong>): on items placed on tier of</p>
              </div>

              <div className="ml-8">
                <h4 className="font-medium">(4) Constructive Possession:</h4>
                <p className="ml-4">Acquisition by investment does not require actual physical possession, but rather clear marking of ownership without abandonment.</p>
                
                <p className="ml-4 mt-2">• Not property interest is infringed upon when someone begins to collect the common resource -- but the ownership interest is such an appropriate form of harvest which is an result of someone's labor.</p>
              </div>

              {/* Property Rights Table */}
              <div className="mt-6">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 p-2">Legally Significant Acts</th>
                      <th className="border border-gray-400 p-2">Justifications</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-2">Possession/Occupancy of Lability</td>
                      <td className="border border-gray-400 p-2">Administrative</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2">Custom/Social Practice</td>
                      <td className="border border-gray-400 p-2">Fairness</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2">Labor</td>
                      <td className="border border-gray-400 p-2">Social Utility/Efficiency/Fairness</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <h3 className="font-medium">2) Keeping Property</h3>
                <p className="ml-4">Everyone has an obligation to note your abandonment of property, if it's gone, then the difference in value of ownership. Labor puts the difference in value of ownership.</p>
                <ul className="ml-8 space-y-1">
                  <li>• Must not leave deposit or content of an Commonplace</li>
                  <li>• Does not need to be the legal thing, all the intent in interest in it</li>
                  <li>• Everyone has an equal opportunity to acquire land through labor.</li>
                  <li>• Consistent with Trust argument: Labor puts difference in value of everything. First purchase the and Person</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
          </div>
        </>
      )}
    </div>
  );
}