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
      const htmlPath = join(process.cwd(), 'build', 'index.html');
      try {
        let html = readFileSync(htmlPath, 'utf-8');
        let modified = false;

        // Remove modulepreload links for Radix UI chunk
        // This prevents Radix UI from being preloaded on initial page load
        html = html.replace(
          /<link[^>]*rel=["']modulepreload["'][^>]*href=["'][^"']*radix-ui[^"']*["'][^>]*>/gi,
          (match) => {
            modified = true;
            return ''; // Remove the link
          }
        );

        if (modified) {
          writeFileSync(htmlPath, html, 'utf-8');
          console.log('✅ Removed Radix UI modulepreload from index.html');
        }
      } catch (error) {
        console.warn('⚠️ Failed to remove Radix UI preload:', error);
      }
    },
  };
}
