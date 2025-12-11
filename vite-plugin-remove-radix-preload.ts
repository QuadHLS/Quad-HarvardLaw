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
    writeBundle() {
      // Use writeBundle to run after Vite's HTML plugin writes the file
      // Same hook as deferCSS plugin which works
      const buildDir = join(process.cwd(), 'build');
      const htmlPath = join(buildDir, 'index.html');
      try {
        let html = readFileSync(htmlPath, 'utf-8');
        const originalHtml = html;

        // Remove modulepreload links for Radix UI chunk
        // This prevents Radix UI from being preloaded on initial page load
        html = html.replace(
          /<link[^>]*rel=["']modulepreload["'][^>]*href=["'][^"']*radix-ui[^"']*["'][^>]*>/gi,
          ''
        );
        
        // Also remove Radix UI from the main bundle file
        // Find the index.js file and remove radix-ui references
        const fs = require('fs');
        const assetsDir = join(buildDir, 'assets');
        const indexFiles = fs.readdirSync(assetsDir).filter((f: string) => f.startsWith('index-') && f.endsWith('.js'));
        
        if (indexFiles.length > 0) {
          const indexFilePath = join(assetsDir, indexFiles[0]);
          let indexContent = readFileSync(indexFilePath, 'utf-8');
          const originalContent = indexContent;
          
          // Remove radix-ui from __vite__mapDeps array
          indexContent = indexContent.replace(
            /(__vite__mapDeps=\([^)]*\[)([^\]]*)([^\]]*\])([^)]*\))/g,
            (match: string, start: string, arrayContent: string, rest: string, end: string) => {
              // Remove any radix-ui entries from the array
              const cleaned = arrayContent.replace(/["'][^"']*radix-ui[^"']*["'],?\s*/g, '');
              return start + cleaned + rest + end;
            }
          );
          
          // Remove the import statement for radix-ui
          indexContent = indexContent.replace(
            /import\{[^}]*\}from["']\.\/radix-ui-[^"']*["'];?/g,
            ''
          );
          
          if (indexContent !== originalContent) {
            writeFileSync(indexFilePath, indexContent, 'utf-8');
            console.log('✅ Removed Radix UI imports and dependency map from index.js');
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
