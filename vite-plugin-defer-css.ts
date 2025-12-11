/**
 * Vite plugin to defer non-critical CSS loading
 * Transforms CSS link tags to load asynchronously using preload + onload trick
 * This runs after Vite injects CSS links, so we need to use buildEnd hook
 */
import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export function deferCSS(): Plugin {
  return {
    name: 'defer-css',
    apply: 'build',
    buildEnd() {
      // After build, modify the HTML to defer CSS
      const htmlPath = join(process.cwd(), 'build', 'index.html');
      try {
        let html = readFileSync(htmlPath, 'utf-8');
        
        // Transform CSS link tags to load asynchronously
        // Match: <link rel="stylesheet" ... href="/assets/...css">
        html = html.replace(
          /<link([^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*\.css[^"']*)["'][^>]*)>/gi,
          (match, attrs, href) => {
            // Skip if already has media="print" or onload (already deferred)
            if (attrs.includes('media="print"') || attrs.includes('onload=')) {
              return match;
            }
            
            // Skip if it's a Google Fonts stylesheet (already handled in index.html)
            if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) {
              return match;
            }
            
            // Only defer our own CSS files (from /assets/)
            if (!href.startsWith('/assets/')) {
              return match;
            }
            
            // Transform to preload + onload pattern
            const newAttrs = attrs
              .replace(/rel=["']stylesheet["']/, 'rel="preload" as="style"')
              .replace(/\s+crossorigin/g, '');
            
            return `<link${newAttrs} onload="this.onload=null;this.rel='stylesheet'"><noscript>${match}</noscript>`;
          }
        );
        
        writeFileSync(htmlPath, html, 'utf-8');
      } catch (error) {
        console.warn('Failed to defer CSS:', error);
      }
    },
  };
}
