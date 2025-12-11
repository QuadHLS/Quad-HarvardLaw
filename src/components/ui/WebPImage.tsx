import { useState } from 'react';

interface WebPImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  webpSrc?: string; // WebP version of the image
  alt: string;
  fallback?: string; // Fallback image if both fail
}

/**
 * WebPImage - Image component with WebP format support
 * 
 * Automatically uses WebP format when available, falls back to original format.
 * Provides better compression (30-50% smaller files) and faster loading.
 * 
 * Usage:
 * <WebPImage 
 *   src="/image.png" 
 *   webpSrc="/image.webp" 
 *   alt="Description" 
 * />
 */
export function WebPImage({
  src,
  webpSrc,
  alt,
  fallback,
  className,
  ...props
}: WebPImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // If WebP is available, use it; otherwise use original
  const imageSrc = webpSrc || src;

  const handleError = () => {
    // If WebP fails, try original format
    if (webpSrc && imgSrc === webpSrc) {
      setImgSrc(src);
      return;
    }
    
    // If original fails, try fallback
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
      return;
    }
    
    setHasError(true);
  };

  // Use picture element for better WebP support
  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={src}
          alt={alt}
          className={className}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      </picture>
    );
  }

  // Fallback to regular img if no WebP
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      style={{
        ...(hasError && { display: 'none' }),
      }}
      {...props}
    />
  );
}
