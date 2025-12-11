/**
 * Quick Performance Test Script
 * 
 * Copy and paste this entire script into your browser console to get instant performance metrics
 * Or bookmark it as a bookmarklet
 */

(function() {
  console.log('%c🚀 Performance Report', 'font-size: 20px; font-weight: bold; color: #752432;');
  console.log('='.repeat(50));
  
  // Navigation Timing
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav) {
    const metrics = {
      'DNS Lookup': `${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)}ms`,
      'TCP Connection': `${(nav.connectEnd - nav.connectStart).toFixed(0)}ms`,
      'TLS Handshake': nav.secureConnectionStart > 0 
        ? `${(nav.connectEnd - nav.secureConnectionStart).toFixed(0)}ms` 
        : 'N/A',
      'Time to First Byte (TTFB)': `${(nav.responseStart - nav.requestStart).toFixed(0)}ms`,
      'DOM Processing': `${(nav.domInteractive - nav.domLoading).toFixed(0)}ms`,
      'DOM Complete': `${(nav.domComplete - nav.domLoading).toFixed(0)}ms`,
      'Page Load': `${(nav.loadEventEnd - nav.fetchStart).toFixed(0)}ms`,
    };
    
    // Color code based on performance
    const colorize = (value, good, acceptable) => {
      const num = parseInt(value);
      if (num <= good) return `%c${value} ✅`;
      if (num <= acceptable) return `%c${value} ⚠️`;
      return `%c${value} ❌`;
    };
    
    console.log('%c📊 Navigation Timing:', 'font-weight: bold; color: #752432;');
    console.table(metrics);
    
    // Performance assessment
    const ttfb = nav.responseStart - nav.requestStart;
    const pageLoad = nav.loadEventEnd - nav.fetchStart;
    
    console.log('%c📈 Performance Assessment:', 'font-weight: bold; color: #752432;');
    console.log(
      colorize(`${ttfb.toFixed(0)}ms`, 200, 500),
      ttfb <= 200 ? 'color: green;' : ttfb <= 500 ? 'color: orange;' : 'color: red;',
      '- TTFB (Good: <200ms)'
    );
    console.log(
      colorize(`${pageLoad.toFixed(0)}ms`, 3000, 5000),
      pageLoad <= 3000 ? 'color: green;' : pageLoad <= 5000 ? 'color: orange;' : 'color: red;',
      '- Page Load (Good: <3000ms)'
    );
  }
  
  // Paint Timing
  const paint = performance.getEntriesByType('paint');
  if (paint.length > 0) {
    console.log('\n%c🎨 Paint Timing:', 'font-weight: bold; color: #752432;');
    paint.forEach(entry => {
      const status = entry.name === 'first-contentful-paint' 
        ? (entry.startTime < 1800 ? '✅' : entry.startTime < 3000 ? '⚠️' : '❌')
        : '';
      console.log(
        `${entry.name}: ${entry.startTime.toFixed(0)}ms ${status}`
      );
    });
  }
  
  // Resource Timing
  const resources = performance.getEntriesByType('resource');
  if (resources.length > 0) {
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const slowResources = resources
      .filter(r => r.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(r => ({
        'Resource': r.name.split('/').pop().substring(0, 40),
        'Type': r.initiatorType,
        'Duration': `${r.duration.toFixed(0)}ms`,
        'Size': r.transferSize ? `${(r.transferSize / 1024).toFixed(2)}KB` : 'N/A'
      }));
    
    console.log('\n%c📦 Resource Summary:', 'font-weight: bold; color: #752432;');
    console.log(`Total Resources: ${resources.length}`);
    console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    
    if (slowResources.length > 0) {
      console.log('\n%c🐌 Slowest Resources (>100ms):', 'font-weight: bold; color: #752432;');
      console.table(slowResources);
    }
  }
  
  // Memory Usage (Chrome only)
  if (performance.memory) {
    const memory = {
      'Used JS Heap': `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
      'Total JS Heap': `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)}MB`,
      'Heap Limit': `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`
    };
    console.log('\n%c💾 Memory Usage:', 'font-weight: bold; color: #752432;');
    console.table(memory);
  }
  
  // Core Web Vitals (if available)
  console.log('\n%c🎯 Core Web Vitals:', 'font-weight: bold; color: #752432;');
  console.log('Run Lighthouse (DevTools → Lighthouse tab) for LCP, FID, and CLS metrics');
  
  // Recommendations
  console.log('\n%c💡 Quick Tips:', 'font-weight: bold; color: #752432;');
  console.log('• TTFB < 200ms = Excellent');
  console.log('• Page Load < 3s = Good');
  console.log('• Use Lighthouse for detailed analysis');
  console.log('• Check Network tab for slow resources');
  console.log('• Use Performance tab to find bottlenecks');
  
  console.log('\n' + '='.repeat(50));
})();
