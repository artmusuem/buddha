// File: /js/bundle.js (Buddha Museum - Cross-Platform Version)
// Fixed path handling for GitHub Pages and Netlify compatibility

document.addEventListener("DOMContentLoaded", () => {
  console.log("bundle.js loaded on:", window.location.href);

  // === Environment Detection & Path Utilities ===
  
  // Robust environment detection
  const isGitHub = window.location.hostname.includes('github.io');
  const isNetlify = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com');
  const basePath = isGitHub ? '/buddha' : '';
  
  console.log(`Environment detected: ${isGitHub ? 'GitHub Pages' : isNetlify ? 'Netlify' : 'Local/Other'}`);
  console.log(`Base path: "${basePath}"`);
  
  // Store globally for other scripts
  window.SITE_CONFIG = {
    basePath: basePath,
    isGitHub: isGitHub,
    isNetlify: isNetlify,
    dataPath: `${basePath}/data`,
    assetsPath: `${basePath}/assets`,
    cssPath: `${basePath}/css`,
    jsPath: `${basePath}/js`
  };
  
  // Smart data loader with comprehensive fallback paths
  async function fetchBuddhaData() {
    const paths = [
      `${basePath}/data/buddha-collection.json`,      // Primary GitHub/Netlify path
      `${basePath}/data/collection.json`,             // Alternative collection name
      `${basePath}/data/artifacts.json`,              // Alternative artifacts name
      '/data/buddha-collection.json',                 // Root fallback
      '/data/collection.json',                        // Root alternative
      '/data/artifacts.json',                         // Root artifacts
      './data/buddha-collection.json',                // Relative fallback
      './data/collection.json',                       // Relative alternative
      `${basePath}/assets/data/buddha-collection.json`, // Assets folder fallback
      `${basePath}/js/data/buddha-collection.json`    // JS folder fallback
    ];
    
    let lastError = null;
    
    for (const path of paths) {
      try {
        console.log(`Attempting to fetch from: ${path}`);
        const response = await fetch(path);
        
        if (response.ok) {
          const data = await response.json();
          
          // Validate data structure
          if (data && (Array.isArray(data) || data.artifacts || data.items)) {
            const items = Array.isArray(data) ? data : (data.artifacts || data.items);
            const filteredItems = items.filter(item => item.status !== "hide");
            console.log(`✅ Successfully loaded ${filteredItems.length} items from: ${path}`);
            return filteredItems;
          } else {
            console.warn(`❌ Invalid data structure from ${path}`);
          }
        } else {
          console.warn(`❌ HTTP ${response.status} from ${path}`);
        }
      } catch (error) {
        console.warn(`❌ Network error from ${path}:`, error.message);
        lastError = error;
      }
    }
    
    throw new Error(`Could not load collection data from any location. Last error: ${lastError?.message || 'Unknown error'}`);
  }
  
  // Generate environment-aware URLs
  function getPageUrl(path) {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${cleanPath}`;
  }
  
  function getTemplateUrl(templatePage, sku) {
    return `${basePath}/page-templates/${templatePage}?sku=${sku}`;
  }
  
  function getImageUrl(imagePath) {
    if (!imagePath) return `${basePath}/images/placeholder.jpg`;
    if (imagePath.startsWith('http')) return imagePath; // External URL
    if (imagePath.startsWith('/')) return `${basePath}${imagePath}`;
    return `${basePath}/images/${imagePath}`;
  }

  // === Grab common DOM elements across all pages ===
  const urlParams = new URLSearchParams(window.location.search);
  const sku = urlParams.get("sku")?.toUpperCase();

  const navPrev = document.querySelector(".nav-prev");
  const navNext = document.querySelector(".nav-next");
  const gallery = document.getElementById("gallery");
  const menu = document.getElementById("dynamic-menu");
  const title = document.getElementById("gallery-title");
  const clearBtnContainer = document.getElementById("clear-filters");

  // === Utility Functions ===

  // Fetch data and filter out hidden items
  function fetchFilteredData() {
    return fetchBuddhaData();
  }

  // Check if a field value is valid (not "hide" or undefined/null)
  function shouldShowField(value) {
    return value && value !== "hide" && value.trim() !== "";
  }

  // Extract categorical data from Christie's format
  function extractCategories(item) {
    const categories = {
      medium: [],
      region: [],
      period: [],
      style: [],
      type: []
    };

    // Extract medium from the medium field
    if (item.medium) {
      categories.medium.push(item.medium.toLowerCase());
    }

    // Extract region from subtitle (look for geographical indicators)
    if (item.subtitle) {
      const subtitle = item.subtitle.toLowerCase();
      if (subtitle.includes('gandhara')) categories.region.push('gandharan');
      if (subtitle.includes('tibet')) categories.region.push('tibetan');
      if (subtitle.includes('china') || subtitle.includes('chinese')) categories.region.push('chinese');
      if (subtitle.includes('india') || subtitle.includes('indian')) categories.region.push('indian');
      if (subtitle.includes('burma') || subtitle.includes('burmese')) categories.region.push('burmese');
      if (subtitle.includes('thailand') || subtitle.includes('thai')) categories.region.push('thai');
      if (subtitle.includes('cambodia') || subtitle.includes('khmer')) categories.region.push('khmer');
      if (subtitle.includes('nepal') || subtitle.includes('nepalese')) categories.region.push('nepalese');
    }

    // Extract time period from subtitle using word boundaries
    if (item.subtitle) {
      const subtitle = item.subtitle.toLowerCase();
      if (subtitle.includes('century')) {
        // Use word boundaries to match exact centuries
        if (/\b(4th|5th|6th)\b/.test(subtitle)) {
          categories.period.push('ancient');
        } else if (/\b(7th|8th|9th)\b/.test(subtitle)) {
          categories.period.push('early_medieval');
        } else if (/\b(10th|11th|12th)\b/.test(subtitle)) {
          categories.period.push('medieval');
        } else if (/\b(13th|14th|15th)\b/.test(subtitle)) {
          categories.period.push('late_medieval');
        } else if (/\b(16th|17th|18th)\b/.test(subtitle)) {
          categories.period.push('early_modern');
        } else if (/\b(19th|20th)\b/.test(subtitle)) {
          categories.period.push('modern');
        }
      }
    }

    // Extract object type from title
    if (item.title) {
      const title = item.title.toLowerCase();
      if (title.includes('head')) categories.type.push('head');
      if (title.includes('buddha')) categories.type.push('buddha');
      if (title.includes('bodhisattva')) categories.type.push('bodhisattva');
      if (title.includes('statue') || title.includes('figure')) categories.type.push('statue');
      if (title.includes('relief')) categories.type.push('relief');
      if (title.includes('stupa')) categories.type.push('stupa');
      if (title.includes('manuscript')) categories.type.push('manuscript');
      if (title.includes('painting')) categories.type.push('painting');
    }

    return categories;
  }

  // Render gallery tiles dynamically from provided items
  function loadGallery(items) {
    if (!gallery) return;
    gallery.innerHTML = '';

    if (!items.length) {
      gallery.innerHTML = "<p>No results found.</p>";
      // Update stats for no results
      if (window.updateGalleryStats) {
        window.updateGalleryStats(window.fullData ? window.fullData.length : 0, 0);
      }
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      const templatePage = item["template-page"] || "dt-1.html";
      const link = getTemplateUrl(templatePage, item.sku);
      const imageUrl = getImageUrl(item.image);
      const titleHTML = item.title ? `<h3>${item.title}</h3>` : '';
      const subtitleHTML = item.subtitle ? `<p class="subtitle">${item.subtitle}</p>` : '';
      
      div.innerHTML = `
        <a href="${link}">
          <img src="${imageUrl}" alt="${item.title || ''}" class="lightbox-trigger" loading="lazy" />
          ${titleHTML}
          ${subtitleHTML}
        </a>
      `;
      gallery.appendChild(div);
    });

    // Update gallery stats
    if (window.updateGalleryStats && window.fullData) {
      window.updateGalleryStats(window.fullData.length, items.length);
    }
  }

  // === Create labelMap for Christie's Categories ===
  const labelMap = {
    // Mediums
    "stucco": "Stucco",
    "bronze": "Bronze", 
    "stone": "Stone",
    "wood": "Wood",
    "gilt": "Gilt Bronze",
    "marble": "Marble",
    "schist": "Schist",
    "terracotta": "Terracotta",
    "painting": "Painting",
    "manuscript": "Manuscript",
    
    // Regions
    "gandharan": "Gandharan",
    "tibetan": "Tibetan",
    "chinese": "Chinese",
    "indian": "Indian",
    "burmese": "Burmese",
    "thai": "Thai",
    "khmer": "Khmer (Cambodian)",
    "nepalese": "Nepalese",
    
    // Periods
    "ancient": "Ancient Period (4th-6th Century)",
    "early_medieval": "Early Medieval (7th-9th Century)",
    "medieval": "Medieval Period (10th-12th Century)", 
    "late_medieval": "Late Medieval (13th-15th Century)",
    "early_modern": "Early Modern (16th-18th Century)",
    "modern": "Modern Period (19th-20th Century)",
    
    // Types
    "head": "Buddha Heads",
    "buddha": "Buddha Figures",
    "bodhisattva": "Bodhisattva Figures",
    "statue": "Statues & Figures",
    "relief": "Relief Sculptures",
    "stupa": "Stupas",
    "manuscript": "Manuscripts",
    "painting": "Paintings"
  };
  
  // Store globally for other scripts
  window.labelMap = labelMap;

  // Allow menu filters to trigger gallery filtering
  window.filterGallery = function (category) {
    if (!title || !clearBtnContainer) {
      console.warn('Gallery filter elements not found');
      return;
    }

    if (!category) {
      title.textContent = "All Buddhist Art";
      clearBtnContainer.style.display = "none";
      loadGallery(window.fullData || []);
      return;
    }

    const displayLabel = labelMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    title.textContent = displayLabel;
    clearBtnContainer.style.display = "block";

    if (!window.fullData) {
      console.warn('No data available for filtering');
      return;
    }

    const filtered = window.fullData.filter(item => {
      const categories = extractCategories(item);
      
      // Check if the category matches any extracted categories
      return Object.values(categories).some(catArray => 
        catArray.includes(category.toLowerCase())
      );
    });
    
    console.log(`Filtered ${window.fullData.length} items to ${filtered.length} for category: ${category}`);
    loadGallery(filtered);
  };

  // === Detail Pages (dt-1.html / dt-2.html) Rendering ===
  if (window.location.pathname.includes("dt-1.html") || window.location.pathname.includes("dt-2.html")) {
    console.log('Detail page detected, loading artifact data...');
    
    fetchFilteredData()
      .then(data => {
        const item = data.find(i => i.sku === sku);
        if (!item) {
          console.error('Artifact not found:', sku);
          return;
        }

        console.log('Artifact loaded:', item);

        // Update text function to handle multiple elements
        const updateText = (selector, value) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (shouldShowField(value)) {
              el.textContent = value;
              el.style.display = "";
            } else {
              el.style.display = "none";
            }
          });
        };

        // Create filter links for extracted categories
        const updateFilterLink = (selector, categoryType) => {
          const el = document.querySelector(selector);
          if (el) {
            const categories = extractCategories(item);
            const values = categories[categoryType];
            
            if (values && values.length > 0) {
              const value = values[0]; // Use first matching category
              const displayLabel = labelMap[value] || value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const homeUrl = getPageUrl('/');
              el.innerHTML = `<a href="${homeUrl}" onclick="sessionStorage.setItem('autoFilter', '${value}'); return true;" class="filter-link">${displayLabel}</a>`;
              el.style.display = "";
            } else {
              el.style.display = "none";
            }
          }
        };

        // Populate Christie's auction data fields
        updateText(".statue-title", item.title);
        updateText(".title", item.title);  // For dt-2.html
        updateText(".subtitle", item.subtitle);
        updateText(".sku", item.sku);
        updateText(".estimate", item.estimate);
        updateText(".price-realized", item.price_realized);
        updateText(".dimensions", item.dimensions);
        updateText(".medium", item.medium);
        updateText(".provenance", item.provenance);
        updateText(".provenance-text", item.provenance);  // For dt-2.html
        updateText(".essay", item.essay);
        updateText(".essay-text", item.essay);  // For dt-2.html

        // Apply read more functionality if available
        if (typeof applyReadMore === 'function') {
          const essayElement = document.querySelector('.essay');
          if (essayElement) {
            setTimeout(() => applyReadMore(essayElement), 100);
          }
        }

        // Create filter links based on extracted categories
        updateFilterLink(".medium-filter", "medium");
        updateFilterLink(".region-filter", "region");
        updateFilterLink(".period-filter", "period");
        updateFilterLink(".type-filter", "type");

        // Add filter button function for dt-1 page
        window.goToFilteredGallery = function(filter) {
          if (filter) {
            sessionStorage.setItem('autoFilter', filter);
          } else {
            sessionStorage.removeItem('autoFilter');
          }
          window.location.href = getPageUrl('/');
        };

        // Set main image with proper URL handling
        const images = document.querySelectorAll(".statue-image, .authenticity-image, #main-image");
        images.forEach(image => {
          if (item.image) {
            image.src = getImageUrl(item.image);
            image.alt = item.title || 'Buddhist Artifact';
          }
        });

        // Handle lot link
        const lotLinks = document.querySelectorAll(".lot-link");
        lotLinks.forEach(lotLink => {
          if (item.lot_link && shouldShowField(item.lot_link)) {
            lotLink.href = item.lot_link;
            lotLink.textContent = "View Original Lot";
            lotLink.style.display = "";
          } else {
            lotLink.style.display = "none";
          }
        });

        // Update certificate link for dt-1 page
        const certLink = document.getElementById('cert-link');
        if (certLink) {
          certLink.href = getTemplateUrl('dt-2.html', item.sku);
        }

        // === Enhanced Navigation System ===
        const currentSku = sku;
        const navPrev = document.querySelector(".nav-prev");
        const navNext = document.querySelector(".nav-next");

        if (currentSku && navPrev && navNext) {
          // Helper functions
          function getNumber(sku) {
            const match = sku.match(/(\d+)/);
            return match ? parseInt(match[0], 10) : 0;
          }
          
          function getPrefix(sku) {
            const match = sku.match(/^(.*?)(\d+)/);
            return match ? match[1] : '';
          }
          
          function makeSku(prefix, number) {
            const originalMatch = currentSku.match(/(\d+)/);
            if (originalMatch) {
              const originalLength = originalMatch[0].length;
              const paddedNumber = number.toString().padStart(originalLength, '0');
              return prefix + paddedNumber;
            }
            return prefix + number;
          }
          
          const currentNumber = getNumber(currentSku);
          const prefix = getPrefix(currentSku);
          
          console.log("Navigation setup:", {
            currentSku,
            currentNumber,
            prefix
          });
          
          // Get all numbers from SKUs with same prefix
          const numbers = data
            .filter(item => item.sku && getPrefix(item.sku) === prefix)
            .map(item => getNumber(item.sku))
            .filter(num => num > 0)
            .sort((a, b) => a - b);
          
          if (numbers.length > 0) {
            console.log("Available numbers:", numbers);
            
            // Find current position
            const currentIndex = numbers.indexOf(currentNumber);
            let prevNumber, nextNumber;
            
            if (currentIndex === -1) {
              prevNumber = numbers[numbers.length - 1];
              nextNumber = numbers[0];
            } else {
              const prevIndex = currentIndex === 0 ? numbers.length - 1 : currentIndex - 1;
              const nextIndex = currentIndex === numbers.length - 1 ? 0 : currentIndex + 1;
              
              prevNumber = numbers[prevIndex];
              nextNumber = numbers[nextIndex];
            }
            
            const prevSku = makeSku(prefix, prevNumber);
            const nextSku = makeSku(prefix, nextNumber);
            
            navPrev.href = getTemplateUrl('dt-1.html', prevSku);
            navNext.href = getTemplateUrl('dt-1.html', nextSku);
            
            console.log("Navigation links set:", {
              prev: prevSku,
              next: nextSku
            });
          } else {
            console.warn("No valid numbers found for navigation");
          }
        }
      })
      .catch(error => {
        console.error("Failed to load detail page data:", error);
        
        // Show error message on page
        const main = document.querySelector('main');
        if (main) {
          main.innerHTML = `
            <div class="error-content" style="text-align: center; padding: 2rem;">
              <h2>⚠️ Error Loading Artifact</h2>
              <p>${error.message}</p>
              <a href="${getPageUrl('/')}" style="background: #8B4513; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 1rem;">Return to Gallery</a>
            </div>
          `;
        }
      });
  }

  // === Index Gallery Page ===
  if (window.location.pathname === '/' || window.location.pathname.includes('index.html') || window.location.pathname === basePath + '/') {
    console.log("✅ Index page detected, starting gallery initialization...");
    
    fetchFilteredData()
      .then(data => {
        console.log("✅ Gallery data loaded:", data.length, "items");
        
        const categories = { 
          medium: new Set(), 
          region: new Set(), 
          period: new Set(), 
          type: new Set()
        };

        // Extract categories from all items
        data.forEach(item => {
          const itemCategories = extractCategories(item);
          
          itemCategories.medium.forEach(cat => categories.medium.add(cat));
          itemCategories.region.forEach(cat => categories.region.add(cat));
          itemCategories.period.forEach(cat => categories.period.add(cat));
          itemCategories.type.forEach(cat => categories.type.add(cat));
        });

        console.log("✅ Categories extracted:", Object.fromEntries(
          Object.entries(categories).map(([key, set]) => [key, [...set]])
        ));

        // Create dynamic menu if element exists
        if (menu) {
          menu.innerHTML = '';

          // Create menu sections
          for (const [type, values] of Object.entries(categories)) {
            if (values.size === 0) continue;

            const group = document.createElement("li");
            
            const menuLabels = {
              'medium': 'Medium',
              'region': 'Region/Origin', 
              'period': 'Time Period',
              'type': 'Object Type'
            };
            
            const label = menuLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
            
            group.innerHTML = `
              <details>
                <summary>${label}</summary>
                <ul>
                  ${[...values].sort().map(v => {
                    const displayLabel = labelMap[v] || v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `<li><a href="#" onclick="filterGallery('${v}'); return false;">${displayLabel}</a></li>`;
                  }).join('')}
                </ul>
              </details>
            `;
            menu.appendChild(group);
          }

          console.log("✅ Dynamic menu created successfully!");
        } else {
          console.warn("⚠️ Menu element not found, skipping menu creation");
        }
        
        // Add sidebar toggle functionality
        const sidebar = document.getElementById("sidebar");
        const toggleButton = document.getElementById("menu-toggle");
        const closeBtn = document.getElementById("close-sidebar");

        if (toggleButton && sidebar) {
          toggleButton.addEventListener("click", () => {
            sidebar.classList.toggle("open");
          });
        }

        if (closeBtn && sidebar) {
          closeBtn.addEventListener("click", () => {
            sidebar.classList.remove("open");
          });
        }

        // Close sidebar when clicking outside
        document.addEventListener("click", (e) => {
          if (sidebar && !sidebar.contains(e.target) && toggleButton?.contains(e.target) === false) {
            sidebar.classList.remove("open");
          }
        });

        // Store data globally for filtering
        window.fullData = data;
        
        // Check for auto-filter from session storage
        const pendingFilter = sessionStorage.getItem('autoFilter');
        if (pendingFilter) {
          console.log("✅ Applying auto-filter:", pendingFilter);
          sessionStorage.removeItem('autoFilter');
          setTimeout(() => window.filterGallery(pendingFilter), 100);
        } else {
          // Load full gallery
          loadGallery(data);
        }

        console.log("✅ Gallery initialization complete!");
      })
      .catch(error => {
        console.error("❌ Error loading gallery data:", error);
        
        if (gallery) {
          gallery.innerHTML = `
            <div class="error-content" style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
              <h2>⚠️ Error Loading Gallery</h2>
              <p>${error.message}</p>
              <button onclick="location.reload()" style="background: #8B4513; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">Retry</button>
            </div>
          `;
        }
      });
  }

  // === Search Functionality ===
  const searchInput = document.getElementById("searchBox");
  const searchButton = document.getElementById("searchButton");
  const resultsContainer = document.getElementById("resultsContainer");

  const performSearch = (query) => {
    query = query?.trim();
    if (!query) {
      console.warn('Empty search query');
      return;
    }
    
    const searchUrl = getPageUrl('/search-results.html');
    console.log('Performing search:', query, 'URL:', searchUrl);
    window.location.href = `${searchUrl}?q=${encodeURIComponent(query)}`;
  };

  if (searchInput && searchButton) {
    searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch(searchInput.value);
      }
    });
    
    searchButton.addEventListener("click", (e) => {
      e.preventDefault();
      performSearch(searchInput.value);
    });
    
    console.log("✅ Search functionality initialized");
  }

  // === Search Results Page ===
  if (resultsContainer) {
    console.log("Search results page detected");
    
    const q = urlParams.get("q")?.toLowerCase()?.trim();
    if (q) {
      console.log("Processing search query:", q);
      
      fetchFilteredData()
        .then(data => {
          const matches = data.filter(item => {
            const searchFields = [
              item.title,
              item.subtitle,
              item.sku,
              item.medium,
              item.provenance,
              item.essay,
              item.estimate,
              item.dimensions
            ];

            return searchFields.some(field =>
              typeof field === "string" && field.toLowerCase().includes(q)
            );
          });

          console.log(`Found ${matches.length} matches for "${q}"`);

          resultsContainer.innerHTML = matches.length
            ? matches.map(item => {
                const template = item["template-page"] || "dt-1.html";
                const templateUrl = getTemplateUrl(template, item.sku);
                const imageUrl = getImageUrl(item.image);
                return `
                  <div class="search-result">
                    <a href="${templateUrl}">
                      <img src="${imageUrl}" alt="${item.title} – ${item.sku}" class="lightbox-trigger" loading="lazy" />
                      <div>
                        <h3>${item.title}</h3>
                        <p>${item.subtitle || ''}</p>
                        <p>${item.essay?.substring(0, 150) || ''}...</p>
                      </div>
                    </a>
                  </div>
                `;
              }).join("")
            : `<p>No results found for "<strong>${q}</strong>". Try different keywords or browse our <a href="${getPageUrl('/')}">full collection</a>.</p>`;
        })
        .catch(error => {
          console.error("Failed to load search data:", error);
          resultsContainer.innerHTML = `
            <div class="error-content">
              <h2>⚠️ Search Error</h2>
              <p>${error.message}</p>
              <a href="${getPageUrl('/')}" style="background: #8B4513; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 1rem;">Return to Gallery</a>
            </div>
          `;
        });
    } else {
      resultsContainer.innerHTML = `<p>Please enter a search query. <a href="${getPageUrl('/')}">Browse our full collection</a>.</p>`;
    }
  }

  // === Lightbox Setup ===
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.querySelector(".lightbox-image");
  const lightboxClose = document.querySelector(".lightbox-close");

  if (lightbox && lightboxImage && lightboxClose) {
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("lightbox-trigger")) {
        e.preventDefault();
        lightboxImage.src = e.target.src;
        lightbox.classList.add("active");
        console.log("Lightbox opened");
      }
    });

    lightboxClose.addEventListener("click", () => {
      lightbox.classList.remove("active");
      console.log("Lightbox closed");
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("active");
        console.log("Lightbox closed by backdrop click");
      }
    });
    
    console.log("✅ Lightbox functionality initialized");
  }

  // === Global Error Handling ===
  window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.error);
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
  });

  console.log("✅ bundle.js initialization complete");
});
