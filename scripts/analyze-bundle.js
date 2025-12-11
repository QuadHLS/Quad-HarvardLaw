#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the production build to identify performance issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = path.join(process.cwd(), 'build');
const assetsDir = path.join(buildDir, 'assets');

console.log('🔍 Analyzing Production Bundle...\n');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Get all JS files
const jsFiles = [];
function findJSFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findJSFiles(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.map')) {
      const size = stat.size;
      jsFiles.push({ name: file, path: filePath, size });
    }
  });
}

findJSFiles(buildDir);

// Sort by size
jsFiles.sort((a, b) => b.size - a.size);

console.log('📦 JavaScript Bundle Analysis:\n');
console.log('File Name'.padEnd(50) + 'Size'.padStart(15) + 'Size (KB)'.padStart(15));
console.log('-'.repeat(80));

let totalSize = 0;
const initialBundleFiles = [];
const lazyLoadedFiles = [];

jsFiles.forEach(file => {
  const sizeKB = (file.size / 1024).toFixed(2);
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  totalSize += file.size;
  
  const displayName = file.name.length > 45 ? '...' + file.name.slice(-42) : file.name;
  const sizeDisplay = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
  
  console.log(displayName.padEnd(50) + sizeDisplay.padStart(15) + sizeKB.padStart(15) + ' KB');
  
  // Categorize files
  if (file.name.includes('index') || file.name.includes('main') || file.name.includes('app')) {
    initialBundleFiles.push(file);
  } else if (file.name.includes('radix') || file.name.includes('supabase') || file.name.includes('vendor')) {
    // Check if it's in index.html (initial load) or lazy loaded
    const indexHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8');
    if (indexHtml.includes(file.name)) {
      initialBundleFiles.push(file);
    } else {
      lazyLoadedFiles.push(file);
    }
  } else {
    lazyLoadedFiles.push(file);
  }
});

console.log('-'.repeat(80));
console.log(`Total JS Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

// Analyze initial bundle
const initialBundleSize = initialBundleFiles.reduce((sum, f) => sum + f.size, 0);
console.log('🚀 Initial Bundle (loaded on page load):');
console.log(`   Total: ${(initialBundleSize / 1024 / 1024).toFixed(2)} MB\n`);
initialBundleFiles.forEach(file => {
  const sizeKB = (file.size / 1024).toFixed(2);
  console.log(`   - ${file.name}: ${sizeKB} KB`);
});

// Check for Radix UI in initial bundle
const radixInInitial = initialBundleFiles.find(f => f.name.includes('radix'));
if (radixInInitial) {
  console.log(`\n⚠️  WARNING: Radix UI found in initial bundle: ${radixInInitial.name} (${(radixInInitial.size / 1024).toFixed(2)} KB)`);
  console.log('   This should be lazy-loaded!');
}

// Check index.html for script tags
console.log('\n📄 Scripts in index.html:');
const indexHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf-8');
const scriptMatches = indexHtml.match(/<script[^>]*src="([^"]+)"[^>]*>/g) || [];
scriptMatches.forEach(match => {
  const srcMatch = match.match(/src="([^"]+)"/);
  if (srcMatch) {
    const src = srcMatch[1];
    const file = jsFiles.find(f => src.includes(f.name));
    if (file) {
      const sizeKB = (file.size / 1024).toFixed(2);
      console.log(`   - ${file.name}: ${sizeKB} KB`);
    }
  }
});

// Recommendations
console.log('\n💡 Recommendations:');
if (initialBundleSize > 500 * 1024) {
  console.log('   ⚠️  Initial bundle is large (>500KB). Consider:');
  console.log('      - Lazy loading more components');
  console.log('      - Code splitting large dependencies');
  console.log('      - Tree shaking unused code');
}

if (radixInInitial) {
  console.log('   ⚠️  Radix UI is in initial bundle. Check:');
  console.log('      - Components importing Radix UI directly');
  console.log('      - HomePage or other initial-load components');
}

console.log('\n✅ Analysis complete!\n');
