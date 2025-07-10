// File: /js/config.js
// Environment-aware path handler for GitHub Pages (/buddha) vs Netlify (/)

(function() {
  // Detect environment
  const isGitHub = window.location.hostname.includes('github.io');
  const BASE_PATH = isGitHub ? '/buddha' : '';
  
  // Store globally for any scripts that need it
  window.SITE_BASE_PATH = BASE_PATH;
  
  console.log(`[CONFIG] Environment: ${isGitHub ? 'GitHub Pages' : 'Netlify/Local'}, Base Path: "${BASE_PATH || 'root'}"`);
  
  // Function to convert root paths to environment-specific paths
  function updateAllPaths() {
    if (!BASE_PATH) {
      console.log('[CONFIG] No base path needed - skipping path updates');
      return; 
    }
    
    let updatedCount = 0;
    
    // Update stylesheets (link[rel="stylesheet"])
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith(BASE_PATH)) {
        link.href = BASE_PATH + href;
        updatedCount++;
      }
    });
    
    // Update scripts with src attribute
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.startsWith('/') && !src.startsWith(BASE_PATH)) {
        // Create new script element to ensure proper loading
        const newScript = document.createElement('script');
        newScript.src = BASE_PATH + src;
        if (script.defer) newScript.defer = true;
        if (script.async) newScript.async = true;
        script.parentNode.replaceChild(newScript, script);
        updatedCount++;
      }
    });
    
    // Update images
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('/') && !src.startsWith(BASE_PATH)) {
        img.src = BASE_PATH + src;
        updatedCount++;
      }
    });
    
    // Update anchor links (but not hash links or external)
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith(BASE_PATH) && !href.startsWith('/#')) {
        link.href = BASE_PATH + href;
        updatedCount++;
      }
    });
    
    console.log(`[CONFIG] Updated ${updatedCount} paths with base: "${BASE_PATH}"`);
  }
  
  // Run path updates when DOM elements are available
  function initPathUpdates() {
    updateAllPaths();
    
    // Also run when new content is dynamically added
    const observer = new MutationObserver(() => {
      updateAllPaths();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Initialize immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPathUpdates);
  } else {
    initPathUpdates();
  }
  
})();
