# Quick Performance Diagnostics

## Step 1: Run Bundle Analysis

```bash
npm run build
npm run analyze:bundle
```

This will show you:
- Which JavaScript files are in the initial bundle
- If Radix UI is being loaded eagerly (it shouldn't be!)
- Total bundle sizes

## Step 2: Check Browser Network Tab

1. Open your deployed site (or `npm run build && npm run preview`)
2. Open DevTools (F12) → **Network** tab
3. Check **Disable cache**
4. Reload page (Cmd+Shift+R)
5. Filter by **JS**
6. Look for:
   - **Files >200KB** - these are likely blocking
   - **radix-ui-*.js** - should NOT be in initial load
   - **Total size** of all JS files loaded initially

## Step 3: Run Lighthouse

1. Open DevTools → **Lighthouse** tab
2. Select **Performance** only
3. Click **Analyze page load**
4. Check these diagnostics:
   - **Reduce JavaScript execution time** - Click to see which files
   - **Minimize main-thread work** - Should be <2s
   - **Reduce unused JavaScript** - Check Coverage tab
   - **Avoid long main-thread tasks** - Should be <50ms each

## Step 4: Check Coverage (Chrome)

1. DevTools → **Coverage** tab (Cmd+Shift+P → "Show Coverage")
2. Click **Record**
3. Reload page
4. Check **Unused JavaScript**:
   - Red = unused (should be minimized)
   - Green = used

## Step 5: Share Results

After running these tests, share:
1. Output from `npm run analyze:bundle`
2. Screenshot of Network tab (JS files)
3. Lighthouse diagnostics (especially "Reduce JavaScript execution time")
4. Any large files you see

## Common Issues to Check

### ❌ Radix UI in Initial Bundle
**Symptom**: `radix-ui-*.js` loads on page load
**Fix**: Check if any component in HomePage imports Radix UI directly

### ❌ Large Initial Bundle
**Symptom**: Initial bundle >500KB
**Fix**: Lazy load more components, split dependencies

### ❌ Unused JavaScript
**Symptom**: Lighthouse shows "Reduce unused JavaScript"
**Fix**: Remove unused imports, tree shake better

### ❌ Long Tasks
**Symptom**: Performance tab shows red bars >50ms
**Fix**: Break up long-running code, defer non-critical work

## Expected Results

After fixes, you should see:
- ✅ Initial bundle: <500KB
- ✅ Radix UI: NOT in initial load
- ✅ TBT: <200ms
- ✅ Performance Score: 90+
- ✅ JavaScript execution: <1s
