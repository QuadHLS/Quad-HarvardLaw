import React, { useState, useEffect } from 'react';
import { cn } from './utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // If true, don't lazy load (for above-the-fold images)
  fallback?: string; // Fallback image if src fails
}

/**
 * OptimizedImage - Image component with automatic optimization
 * 
 * Features:
 * - Automatic lazy loading (unless priority is true)
 * - Width/height attributes to prevent layout shift
 * - Error handling with fallback
 * - Proper loading states
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fallback,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  // If no width/height provided, try to extract from className or use defaults
  const finalWidth = width || (className?.includes('w-') ? undefined : 100);
  const finalHeight = height || (className?.includes('h-') ? undefined : 100);

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      loading={priority ? 'eager' : 'lazy'}
      className={cn(className, isLoading && 'opacity-0', hasError && fallback && 'opacity-50')}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        transition: 'opacity 0.2s',
        ...(isLoading && { opacity: 0 }),
        ...(hasError && !fallback && { display: 'none' }),
      }}
      {...props}
    />
  );
}

