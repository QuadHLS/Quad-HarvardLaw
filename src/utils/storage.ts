/**
 * Utility functions for handling Supabase Storage URLs
 * 
 * Since buckets are now private, we store just the filename in the database
 * and convert to /api/file/ proxy URLs for display (or use signed URLs)
 */

import { supabase } from '../lib/supabase';

// Cache for signed URLs to avoid regenerating on every render
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds

/**
 * Converts a stored avatar or photo path/URL to a display URL
 * Uses signed URLs for private buckets (works in both dev and production)
 * 
 * @param storedPath - The value stored in the database (full URL or filename)
 * @param bucket - The bucket name ('Avatar' or 'Photos')
 * @returns Promise that resolves to the URL to use for displaying the image, or null
 */
export async function getStorageUrl(
  storedPath: string | null | undefined,
  bucket: 'Avatar' | 'Photos' | 'post_picture'
): Promise<string | null> {
  if (!storedPath || storedPath.trim() === '') {
    return null;
  }

  // Extract filename
  let filename: string;
  if (storedPath.startsWith('http')) {
    // If it's already a full URL (old format), extract filename
    if (storedPath.includes('/api/file/')) {
      return storedPath; // Already using proxy
    }
    const urlParts = storedPath.split('/');
    filename = urlParts[urlParts.length - 1];
  } else {
    // New format: just filename
    filename = storedPath;
  }

  // Check cache first
  const cacheKey = `${bucket}/${filename}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filename, 3600);

    if (error || !data?.signedUrl) {
      console.error(`Error creating signed URL for ${bucket}/${filename}`);
      return null;
    }

    // Cache the signed URL
    signedUrlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: Date.now() + CACHE_DURATION
    });

    return data.signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for ${bucket}/${filename}`);
    return null;
  }
}

/**
 * Synchronous version that returns a placeholder/proxy URL
 * Use this for initial render, then update with signed URL
 * @deprecated Use async getStorageUrl instead
 */
export function getStorageUrlSync(
  storedPath: string | null | undefined, 
  bucket: 'Avatar' | 'Photos'
): string | null {
  if (!storedPath || storedPath.trim() === '') {
    return null;
  }

  if (storedPath.startsWith('http')) {
    if (storedPath.includes('/api/file/')) {
      return storedPath;
    }
    const urlParts = storedPath.split('/');
    const filename = urlParts[urlParts.length - 1];
    return `/api/file/${bucket}/${filename}`;
  }

  return `/api/file/${bucket}/${storedPath}`;
}

/**
 * Extracts just the filename from a stored path/URL
 * Used when saving to database (we only want to store the filename)
 * 
 * @param pathOrUrl - Full URL or filename
 * @returns Just the filename portion
 */
export function extractFilename(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  
  // If it's a URL, extract the filename
  if (pathOrUrl.startsWith('http')) {
    const urlParts = pathOrUrl.split('/');
    return urlParts[urlParts.length - 1];
  }
  
  // Already just a filename
  return pathOrUrl;
}

