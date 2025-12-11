# Step-by-Step Performance Diagnostics

Follow these steps **one by one** and share the results after each step.

## Step 1: Build and Analyze Bundle

Run these commands:

```bash
npm run build
npm run analyze:bundle
```

**What to share:**
- Copy the entire output from `analyze:bundle`
- Especially the "Initial Bundle" section and any warnings

**What we're looking for:**
- Is Radix UI still in the initial bundle?
- What's the total initial bundle size?
- Any warnings about large files?

---

## Step 2: Check Network Tab (Browser)

1. **Build and preview locally:**
   ```bash
   npm run build
   npm run preview
   ```
   (Or test on your deployed dev site)

2. **Open browser DevTools:**
   - Press `F12` (or `Cmd+Option+I` on Mac)
   - Go to **Network** tab

3. **Configure:**
   - Check **Disable cache** (top checkbox)
   - Filter by **JS** (click "JS" button or type "js" in filter)

4. **Reload page:**
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - This does a hard refresh

5. **Take screenshot:**
   - Screenshot the Network tab showing all JS files
   - Make sure file sizes are visible
   - Look for `radix-ui-*.js` file

**What to share:**
- Screenshot of Network tab (JS files)
- List of files that load on initial page load
- Size of `radix-ui-*.js` if it appears

**What we're looking for:**
- Does `radix-ui-*.js` load immediately?
- What's the total size of JS files loaded?
- Any other large files (>200KB)?

---

## Step 3: Run Lighthouse Audit

1. **Open DevTools** (F12)
2. Go to **Lighthouse** tab
3. **Settings:**
   - Uncheck everything except **Performance**
   - Device: **Desktop** (or Mobile if you prefer)
4. Click **Analyze page load**
5. Wait for it to complete

**What to share:**
- Screenshot of Performance score
- Screenshot of **Metrics** section (FCP, TBT, LCP, etc.)
- Screenshot of **Diagnostics** section
- **Click on "Reduce JavaScript execution time"** and screenshot that

**What we're looking for:**
- Current Performance score
- TBT (Total Blocking Time) value
- Which files are taking the most time?
- How much unused JavaScript?

---

## Step 4: Check Coverage Tab (Chrome Only)

1. **Open DevTools** (F12)
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type "Show Coverage" and select it
4. Click **Record** button
5. **Reload the page** (Cmd+R)
6. Wait for page to fully load
7. Click **Stop** button

**What to share:**
- Screenshot of Coverage tab
- Look for files with lots of red (unused code)
- Especially check `radix-ui-*.js` if it appears

**What we're looking for:**
- How much unused JavaScript?
- Which files have the most unused code?
- Is Radix UI being used or just loaded?

---

## Step 5: Check Console for Errors

1. **Open DevTools** (F12)
2. Go to **Console** tab
3. **Reload page** (Cmd+R)
4. Look for any red errors

**What to share:**
- Screenshot of Console tab
- Any error messages (even if they seem unrelated)

**What we're looking for:**
- Any runtime errors?
- Any warnings about missing modules?
- Any errors related to Radix UI?

---

## After All Steps

Once you've completed all steps, share:

1. ✅ Bundle analysis output
2. ✅ Network tab screenshot
3. ✅ Lighthouse results (score, metrics, diagnostics)
4. ✅ Coverage tab screenshot (if available)
5. ✅ Console errors (if any)

Then I'll analyze everything and provide **targeted fixes** based on what we find!

---

## Quick Reference

**Commands:**
```bash
# Step 1
npm run build
npm run analyze:bundle

# Step 2 (if testing locally)
npm run preview
```

**DevTools Shortcuts:**
- `F12` - Open DevTools
- `Cmd+Shift+R` - Hard refresh (Mac)
- `Ctrl+Shift+R` - Hard refresh (Windows)
- `Cmd+Shift+P` - Command palette (Mac)
- `Ctrl+Shift+P` - Command palette (Windows)
