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
        
        // NOTE: We only remove the modulepreload link, NOT the import statement
        // Removing imports would break the code if Radix UI is actually needed
        // The modulepreload removal prevents eager loading, but the import will
        // still work when the code actually needs Radix UI (lazy-loaded components)
        
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
