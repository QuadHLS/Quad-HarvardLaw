import React, { useState } from 'react';
import { formatTextWithLineBreaks } from '../../utils/textFormatting';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  buttonColor?: string;
}

export const ExpandableText = React.memo(function ExpandableText({ text, maxLines = 10, className = '', buttonColor }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = formatTextWithLineBreaks(text);
  const hasMore = lines.length > maxLines;

  if (!hasMore) {
    // No truncation needed, just render normally
    return (
      <p className={className}>
        {lines.map((line, idx) => (
          <span key={line.index}>
            {line.content}
            {idx < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  }

  const displayLines = isExpanded ? lines : lines.slice(0, maxLines);

  return (
    <>
      <p className={className}>
        {displayLines.map((line, idx) => (
          <span key={line.index}>
            {line.content}
            {idx < displayLines.length - 1 && <br />}
          </span>
        ))}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="mt-1 mb-2 px-3 py-2 text-sm font-medium transition-colors rounded-md inline-block"
        style={{ 
          color: buttonColor || '#374151',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonColor ? `${buttonColor}20` : '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {isExpanded ? 'See less' : 'See more'}
      </button>
    </>
  );
});

