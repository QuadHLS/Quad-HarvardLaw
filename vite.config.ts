
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { deferCSS } from './vite-plugin-defer-css';
import { removeRadixPreload } from './vite-plugin-remove-radix-preload';

export default defineConfig({
  plugins: [
    react(),
    deferCSS(), // Defer non-critical CSS to prevent render blocking
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer', // Defer service worker registration to not block critical path
      includeAssets: ['QUAD.svg', 'QUAD.png', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'Quad - Harvard Law Platform',
        short_name: 'Quad',
        description: 'Harvard Law\'s all-in-one platform for course outlines, exam banks, social feeds, and study planning',
        theme_color: '#752432',
        background_color: '#f9f5f0',
        display: 'standalone',
        icons: [
          {
            src: '/QUAD.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: '/QUAD.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (to handle large images)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Disable in dev to avoid issues
      }
    }),
    // Bundle analyzer - only run when ANALYZE env var is set
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    force: true,
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    minify: 'terser',
    sourcemap: 'hidden', // Generate source maps but don't expose them in production (security)
    cssCodeSplit: true, // Split CSS into separate files for better caching
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log, console.warn, etc. in production
        drop_debugger: true, // Remove debugger statements
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split PDF.js into separate chunk (only loaded when needed)
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
          
          // Exclude react-slot from Radix UI chunk (it's tiny and used by Button in initial bundle)
          // This prevents entire Radix UI bundle from being preloaded on initial load
          if (id.includes('@radix-ui/react-slot')) {
            return null; // Keep in main bundle (it's only ~2KB)
          }
          
          // Group all other Radix UI components together (they share dependencies)
          // Splitting them individually breaks shared module resolution
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          
          // Split Supabase client
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Split React Query
          if (id.includes('@tanstack/react-query')) {
            return 'react-query';
          }
          
          // Split other large dependencies
          if (id.includes('react-router-dom') || id.includes('framer-motion')) {
            return 'vendor';
          }
          
          // Default: no manual chunk (goes to main bundle)
          return null;
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});