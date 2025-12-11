# Performance Diagnostics Guide

This guide helps you identify performance bottlenecks in your application.

## 1. Bundle Analysis

### Run Bundle Analysis Script
```bash
npm run build
node scripts/analyze-bundle.js
```

This will show:
- All JavaScript files and their sizes
- Which files are in the initial bundle
- If Radix UI is being loaded eagerly
- Total bundle sizes

### Manual Bundle Inspection
```bash
# After building, check bundle sizes
ls -lh build/assets/*.js | sort -k5 -hr

# Check what's in index.html
grep -o 'src="[^"]*\.js"' build/index.html
```

## 2. Browser DevTools Analysis

### Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **Disable cache**
4. Reload page (Cmd+Shift+R / Ctrl+Shift+R)
5. Filter by **JS**
6. Look for:
   - **Large files** (>200KB)
   - **Files loaded on initial page load** (not lazy-loaded)
   - **Radix UI bundle** - should NOT be in initial load

### Performance Tab
1. Open DevTools
2. Go to **Performance** tab
3. Click **Record** (or Cmd+E / Ctrl+E)
4. Reload page
5. Wait for page to fully load
6. Stop recording
7. Look for:
   - **Long tasks** (red bars >50ms)
   - **Script Evaluation** time
   - **Main thread blocking**

### Coverage Tab (Chrome)
1. Open DevTools
2. Go to **Coverage** tab (Cmd+Shift+P → "Show Coverage")
3. Click **Record**
4. Reload page
5. Check **Unused JavaScript**:
   - Red = unused code
   - Green = used code
   - Look for large red sections

## 3. Lighthouse Audit

### Run Lighthouse
```bash
# In Chrome DevTools
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance"
4. Click "Analyze page load"
```

### Key Metrics to Check:
- **Performance Score**: Target 90+
- **TBT (Total Blocking Time)**: Target <200ms
- **FCP (First Contentful Paint)**: Target <1.8s
- **LCP (Largest Contentful Paint)**: Target <2.5s
- **JavaScript execution time**: Should be <1s

### Diagnostics to Review:
- **Reduce JavaScript execution time**: Check which files are taking longest
- **Minimize main-thread work**: Look for long tasks
- **Reduce unused JavaScript**: Check Coverage tab
- **Avoid long main-thread tasks**: Should be <50ms each

## 4. Check for Eager Imports

### Find Components Importing Radix UI
```bash
# Find all files importing Radix UI
grep -r "@radix-ui\|from.*ui/(dialog|popover|select|tabs)" src/components --include="*.tsx" --include="*.ts"

# Check HomePage specifically
grep -n "import.*from.*ui/" src/components/HomePage.tsx
```

### Check Initial Bundle Components
Files that are imported directly (not lazy-loaded) in:
- `src/App.tsx` - Check what's NOT using `React.lazy`
- `src/components/HomePage.tsx` - Check all imports

## 5. Common Issues to Check

### Issue 1: Radix UI in Initial Bundle
**Symptom**: Radix UI bundle loads on page load
**Check**: 
```bash
grep -r "import.*from.*ui/(dialog|popover|select)" src/components/HomePage.tsx
```
**Fix**: Lazy load components that use Radix UI

### Issue 2: Large Dependencies
**Symptom**: Large bundle sizes
**Check**:
```bash
npm run build
node scripts/analyze-bundle.js
```
**Fix**: 
- Split large dependencies
- Use dynamic imports
- Tree shake unused code

### Issue 3: Unused JavaScript
**Symptom**: Lighthouse shows "Reduce unused JavaScript"
**Check**: Coverage tab in DevTools
**Fix**: Remove unused imports, lazy load components

### Issue 4: Long Tasks
**Symptom**: High TBT, long tasks in Performance tab
**Check**: Performance tab → Look for red bars >50ms
**Fix**: 
- Break up long-running code
- Use `setTimeout` to yield to main thread
- Defer non-critical code

## 6. Quick Performance Test

Run this in browser console after page loads:
```javascript
// Check bundle sizes
performance.getEntriesByType('resource')
  .filter(r => r.initiatorType === 'script')
  .sort((a, b) => b.transferSize - a.transferSize)
  .forEach(r => {
    console.log(`${r.name.split('/').pop()}: ${(r.transferSize / 1024).toFixed(2)} KB`);
  });

// Check total JS execution time
const perfData = performance.getEntriesByType('navigation')[0];
console.log(`Total load time: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
```

## 7. Expected Results

After optimizations, you should see:
- **Initial bundle**: <500KB (gzipped)
- **Radix UI**: NOT in initial bundle
- **TBT**: <200ms
- **Performance Score**: 90+
- **JavaScript execution**: <1s

## Next Steps

1. Run `node scripts/analyze-bundle.js` to see current state
2. Check Network tab for what's loading
3. Run Lighthouse and review diagnostics
4. Share results for targeted fixes
