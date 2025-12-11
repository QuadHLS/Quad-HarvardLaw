import React from 'react';
import { Download, File as FileIcon } from 'lucide-react';
import { cn } from '../ui/utils';

export interface MessageAttachment {
  id: string;
  message_id: string;
  attachment_type: 'image' | 'file';
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  thumbnail_url?: string;
  signedUrl?: string;
}

interface FilePreviewProps {
  attachment: MessageAttachment;
  isCurrentUser?: boolean;
  onDownload?: (attachment: MessageAttachment) => void;
}

/**
 * FilePreview - Displays file and image attachments
 * Lazy-loaded component for better performance
 */
export const FilePreview = React.memo(({ attachment, isCurrentUser, onDownload }: FilePreviewProps) => {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!attachment.signedUrl) return;

    if (onDownload) {
      onDownload(attachment);
      return;
    }

    try {
      const response = await fetch(attachment.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (attachment.attachment_type === 'image') {
    return (
      <div className="flex flex-col items-start gap-2 w-full">
        <img
          src={attachment.signedUrl || ''}
          alt={attachment.file_name}
          className="max-w-xs max-h-[70px] rounded-lg object-contain"
          loading="lazy"
        />
        <a
          href={attachment.signedUrl || '#'}
          download={attachment.file_name}
          className="w-full p-2 bg-white/10 rounded hover:bg-white/20 flex items-center justify-center border border-black"
          onClick={handleDownload}
          title={`Download ${attachment.file_name}`}
        >
          <Download className="w-4 h-4" />
          <span className="text-xs ml-1">·</span>
          <span className="text-xs ml-1">{formatFileSize(attachment.file_size)}</span>
        </a>
      </div>
    );
  }

  return (
    <a
      href={attachment.signedUrl || '#'}
      download={attachment.file_name}
      className={cn(
        "inline-flex items-start gap-3 px-3 py-2 rounded-lg w-full max-w-md",
        "transition-colors"
      )}
      style={{ backgroundColor: '#e9e8eb' }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d3d6'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e9e8eb'}
      onClick={handleDownload}
    >
      <FileIcon className="w-6 h-6 flex-shrink-0 text-black/80" />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-sm font-medium text-black truncate">
          {attachment.file_name}
        </span>
        {attachment.file_size && (
          <span className="text-xs text-black/70">
            {formatFileSize(attachment.file_size)}
          </span>
        )}
      </div>
    </a>
  );
});

FilePreview.displayName = 'FilePreview';

