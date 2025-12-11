# Performance Issues Found

## 🔴 Critical Issue: Radix UI in Initial Bundle

### Problem
- **Radix UI bundle (248 KB) is being preloaded** on initial page load
- This is causing high TBT (Total Blocking Time) and slow initial load
- Performance score stuck at 63

### Root Cause
1. `Button` component uses `@radix-ui/react-slot` (small, but pulls in Radix UI)
2. `HomePage` imports `Button` directly (not lazy-loaded)
3. Vite's `manualChunks` groups ALL `@radix-ui` packages together
4. Vite adds `modulepreload` link for Radix UI chunk in `index.html`

### Evidence
```html
<!-- build/index.html line 60 -->
<link rel="modulepreload" crossorigin href="/assets/radix-ui-CckWqaY8.js">
```

Bundle analysis shows:
- Initial bundle: **770 KB** (should be <500 KB)
- Radix UI: **248 KB** (should be 0 KB on initial load)

## 📊 Current Bundle Breakdown

### Initial Bundle (Loaded on Page Load):
- `index-B8cB3BWq.js`: 280.83 KB (main app)
- `radix-ui-CckWqaY8.js`: 248.16 KB ⚠️ **SHOULD NOT BE HERE**
- `vendor-B6eYXwYU.js`: 140.10 KB (react-router, framer-motion)
- `supabase-BYwhHzAj.js`: 120.55 KB (Supabase client)

**Total: 770 KB** (too large!)

## 🎯 Solutions

### Option 1: Extract `react-slot` from Radix UI Chunk (Recommended)
`react-slot` is tiny (~2KB) and only used by Button. Extract it so it doesn't pull in the entire Radix UI bundle.

### Option 2: Lazy Load Button Component
Create a lazy-loaded version of Button, but this is complex and Button is used everywhere.

### Option 3: Replace `react-slot` with Native React
Replace `@radix-ui/react-slot` with a simple React implementation (Button is the only user).

### Option 4: Accept Small Cost
Keep `react-slot` but ensure it's the ONLY Radix UI dependency in initial bundle (currently it's pulling everything).

## 🔍 Next Steps

1. **Run diagnostics:**
   ```bash
   npm run build
   npm run analyze:bundle
   ```

2. **Check Network tab:**
   - Open DevTools → Network
   - Reload page
   - Check if `radix-ui-*.js` loads on initial page load

3. **Run Lighthouse:**
   - Check "Reduce JavaScript execution time"
   - See which files are blocking

4. **Share results:**
   - Bundle analysis output
   - Network tab screenshot
   - Lighthouse diagnostics

## 💡 Quick Fix to Test

The fastest test is to check if removing `react-slot` from Radix UI chunk helps. We can:
1. Modify `vite.config.ts` to exclude `react-slot` from `radix-ui` chunk
2. Keep `react-slot` in main bundle (it's tiny)
3. This should prevent the entire Radix UI bundle from preloading
