import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Plugin to remove modulepreload links for Radix UI chunk
 * Radix UI should only load when lazy-loaded components (AddTodoDialog, PomodoroTimer) are opened
 */
export function removeRadixPreload(): Plugin {
  return {
    name: 'remove-radix-preload',
    apply: 'build',
    enforce: 'post', // Run after other plugins (including HTML plugin)
    writeBundle(_, bundle) {
      // Use writeBundle to run after Vite's HTML plugin writes the file
      // Same hook as deferCSS plugin which works
      const htmlPath = join(process.cwd(), 'build', 'index.html');
      try {
        let html = readFileSync(htmlPath, 'utf-8');
        const originalHtml = html;

        // Remove modulepreload links for Radix UI chunk
        // This prevents Radix UI from being preloaded on initial page load
        html = html.replace(
          /<link[^>]*rel=["']modulepreload["'][^>]*href=["'][^"']*radix-ui[^"']*["'][^>]*>/gi,
          ''
        );
        
        // Also remove Radix UI from the main bundle's dependency map if present
        // Find the index.js file and remove radix-ui from __vite__mapDeps
        const indexFile = Object.keys(bundle).find(key => key.startsWith('assets/index-') && key.endsWith('.js'));
        if (indexFile && bundle[indexFile]) {
          const indexContent = bundle[indexFile].source.toString();
          // Remove radix-ui from the dependency map array
          const updatedContent = indexContent.replace(
            /(__vite__mapDeps=\([^)]*\[)([^\]]*radix-ui[^\]]*)([^\]]*\])([^)]*\))/g,
            (match, start, radixPart, rest, end) => {
              // Remove radix-ui entry from the array
              const cleaned = radixPart.replace(/["'][^"']*radix-ui[^"']*["'],?\s*/g, '');
              return start + cleaned + rest + end;
            }
          );
          
          if (updatedContent !== indexContent) {
            bundle[indexFile].source = Buffer.from(updatedContent);
            console.log('✅ Removed Radix UI from dependency map in index.js');
          }
        }
        
        if (html !== originalHtml) {
          writeFileSync(htmlPath, html, 'utf-8');
          console.log('✅ Removed Radix UI modulepreload from index.html');
        }
      } catch (error) {
        console.warn('⚠️ Failed to remove Radix UI preload:', error);
      }
    },
  };
}
