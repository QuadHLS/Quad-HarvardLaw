'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from './ui/button';

type DocumentPreviewProps = {
  bucket: string;     // Supabase Storage bucket
  path: string;       // file path within the bucket
  title?: string;     // Document title for display
  onDownload?: () => void; // Optional download handler
  height?: string;    // CSS height (default 100%)
};

export default function DocumentPreview({
  bucket,
  path,
  title = 'Document',
  onDownload,
  height = '100%',
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const ext = path.split('.').pop()?.toLowerCase();
  const isPDF = ext === 'pdf';
  const isWord = ext === 'docx' || ext === 'doc';

  // For PDFs, we'll use signed URLs directly (get them from parent component)
  // For DOCX, we need the proxy URL for Office Viewer
  const proxyUrl = `/api/file/${path.split('/').map(encodeURIComponent).join('/')}?bucket=${encodeURIComponent(bucket)}`;

  // Office Viewer needs an absolute, publicly reachable URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const absoluteProxyUrl = origin ? `${origin}${proxyUrl}` : proxyUrl;
  const officeEmbed = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteProxyUrl)}`;

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [path, bucket]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load preview. Please try downloading the document.');
  };

  // Fallback: download link component
  const DownloadLink = () => (
    onDownload ? (
      <Button
        onClick={onDownload}
        size="sm"
        className="bg-[#752432] hover:bg-[#5a1a26] text-white h-7 px-3 text-xs"
      >
        <Download className="w-3 h-3 mr-1" />
        Download
      </Button>
    ) : (
      <a
        href={proxyUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-400 underline hover:text-blue-300"
      >
        Open / Download
      </a>
    )
  );

  if (!isPDF && !isWord) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Preview Not Supported</h3>
          <p className="text-gray-300 mb-6">This file type cannot be previewed in the browser</p>
          <DownloadLink />
        </div>
      </div>
    );
  }

  const documentType = isPDF ? 'PDF' : 'Word';
  const iconColor = isPDF ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="h-full flex flex-col" style={{ height }}>
      {/* Document Viewer Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-600 bg-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 ${iconColor} rounded flex items-center justify-center`}>
            <FileText className="w-3 h-3 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">{title}</h3>
            <p className="text-gray-400 text-xs">{documentType} Document</p>
          </div>
        </div>
        <DownloadLink />
      </div>

      {/* Document Preview */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading document...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-800">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Preview Unavailable</h3>
              <p className="text-gray-300 mb-6">{error}</p>
              <DownloadLink />
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={isPDF ? proxyUrl : officeEmbed}
            className="w-full h-full border-0"
            style={{ display: loading ? 'none' : 'block' }}
            title={`${documentType} Preview: ${title}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  );
}

