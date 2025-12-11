import React from 'react';

interface YouTubeEmbedRendererProps {
  url: string;
  isCurrentUser?: boolean;
}

/**
 * YouTubeEmbedRenderer - Renders YouTube video embeds
 * Lazy-loaded component for better performance
 */
export const YouTubeEmbedRenderer = React.memo(({ url, isCurrentUser }: YouTubeEmbedRendererProps) => {
  // Helper function to convert video URLs to embed format
  const getVideoEmbedUrl = (url: string | null | undefined): { embedUrl: string; platform: 'youtube' | 'tiktok' | 'instagram' } | null => {
    if (!url || !url.trim()) return null;
    
    const trimmedUrl = url.trim();
    
    // YouTube (regular videos and shorts)
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    let watchMatch = trimmedUrl.match(/youtube\.com\/watch\?v=([^&\s]+)/);
    if (watchMatch) {
      const videoId = watchMatch[1].split('&')[0].split('#')[0];
      return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
    }
    
    // Format: https://youtu.be/VIDEO_ID
    let shortMatch = trimmedUrl.match(/youtu\.be\/([^?\s]+)/);
    if (shortMatch) {
      const videoId = shortMatch[1].split('&')[0].split('#')[0];
      return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
    }
    
    // Format: https://www.youtube.com/shorts/VIDEO_ID
    let shortsMatch = trimmedUrl.match(/youtube\.com\/shorts\/([^?\s]+)/);
    if (shortsMatch) {
      const videoId = shortsMatch[1].split('&')[0].split('#')[0];
      return { embedUrl: `https://www.youtube.com/embed/${videoId}`, platform: 'youtube' };
    }
    
    // Format: https://www.youtube.com/embed/VIDEO_ID
    let embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([^?\s]+)/);
    if (embedMatch) {
      return { embedUrl: trimmedUrl, platform: 'youtube' };
    }
    
    // If it's just a video ID (no URL structure) - assume YouTube
    if (!trimmedUrl.includes('http') && !trimmedUrl.includes('/') && !trimmedUrl.includes('?')) {
      return { embedUrl: `https://www.youtube.com/embed/${trimmedUrl}`, platform: 'youtube' };
    }
    
    return null;
  };

  // Normalize URL
  let normalizedUrl = url.trim();
  if (normalizedUrl.startsWith('www.')) {
    normalizedUrl = 'https://' + normalizedUrl;
  } else if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const embedData = getVideoEmbedUrl(normalizedUrl);
  
  if (!embedData || embedData.platform !== 'youtube') {
    return null;
  }

  return (
    <div
      className="relative w-full"
      style={{ maxWidth: '800px' }}
    >
      <div className="relative overflow-hidden rounded-lg">
        <iframe
          src={embedData.embedUrl}
          title="YouTube video player"
          frameBorder="0"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full rounded-lg"
          style={{ 
            border: 'none', 
            overflow: 'hidden',
            aspectRatio: '16/9',
            minHeight: '250px'
          }}
        />
      </div>
    </div>
  );
});

YouTubeEmbedRenderer.displayName = 'YouTubeEmbedRenderer';

