// File: /buddha/js/bundle.js (Buddha Museum - Complete Fixed Version)
// Updated with reliable navigation, real-time search, and cross-platform compatibility

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Bundle.js loaded on:", window.location.href);

  // === Environment Detection & Path Utilities ===
  
  // Detect if we're on GitHub Pages or Netlify
  const isGitHub = window.location.hostname.includes('github.io');
  const basePath = isGitHub ? '/buddha' : '';
  
  console.log(`🌍 Environment detected: ${isGitHub ? 'GitHub Pages' : 'Netlify'}`);
  console.log(`📁 Base path: "${basePath}"`);
  
  // Store globally for access across functions
  window.SITE_BASE_PATH = basePath;
  window.IS_GITHUB = isGitHub;
  
  // Enhanced data loader with multiple fallback paths and better error handling
  async function fetchBuddhaData() {
    const possiblePaths = [
      `${basePath}/data/buddha-collection.json`,  // Primary path
      "/data/buddha-collection.json",             // Netlify fallback
      "./data/buddha-collection.json",            // Relative fallback
      "../data/buddha-collection.json"            // Parent directory fallback
    ];
    
    console.log('🔍 Attempting to load data from multiple paths...');
    
    for (const path of possiblePaths) {
      try {
        console.log(`  Trying: ${path}`);
        const response = await fetch(path, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Successfully loaded data from: ${path}`);
          console.log(`📊 Loaded ${data.length} items`);
          return data.filter(item => item.status !== "hide");
        } else {
          console.log(`❌ ${path} - HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${path} - Error: ${error.message}`);
      }
    }
    
    throw new Error("Could not load buddha-collection.json from any location");
  }
  
  // Generate environment-aware URLs
  function getPageUrl(path) {
    return `${basePath}${path}`;
  }
  
  function getTemplateUrl(templatePage, sku) {
    return `${basePath}/page-templates/${templatePage}?sku=${sku}`;
  }

  // === Global Data Cache ===
  let globalDataCache = null;
  let currentArtifactData = null;

  // === DOM Elements ===
  const urlParams = new URLSearchParams(window.location.search);
  const sku = urlParams.get("sku")?.toUpperCase();

  const navPrev = document.querySelector(".nav-prev");
  const navNext = document.querySelector(".nav-next");
  const gallery = document.getElementById("gallery");
  const menu = document.getElementById("dynamic-menu");
  const title = document.getElementById("gallery-title");
  const clearBtnContainer = document.getElementById("clear-filters");

  // === Utility Functions ===

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

  // === Navigation System ===
  function setupNavigation(allArtifacts, currentItem) {
    if (!navPrev || !navNext || !currentItem || !allArtifacts.length) {
      console.log('⚠️ Navigation setup skipped - missing elements or data');
      return;
    }

    const currentIndex = allArtifacts.findIndex(item => item.sku === currentItem.sku);
    if (currentIndex === -1) {
      console.log('⚠️ Current artifact not found in collection');
      return;
    }

    // Setup previous link
    if (currentIndex > 0) {
      const prevArtifact = allArtifacts[currentIndex - 1];
      navPrev.href = getTemplateUrl('dt-1.html', prevArtifact.sku);
      navPrev.style.opacity = '1';
      navPrev.style.pointerEvents = 'auto';
      navPrev.title = `Previous: ${prevArtifact.title || 'Untitled'}`;
      navPrev.textContent = '← Previous Artifact';
    } else {
      navPrev.href = '#';
      navPrev.style.opacity = '0.5';
      navPrev.style.pointerEvents = 'none';
      navPrev.title = 'No previous artifact';
      navPrev.textContent = '← Previous Artifact';
    }

    // Setup next link
    if (currentIndex < allArtifacts.length - 1) {
      const nextArtifact = allArtifacts[currentIndex + 1];
      navNext.href = getTemplateUrl('dt-1.html', nextArtifact.sku);
      navNext.style.opacity = '1';
      navNext.style.pointerEvents = 'auto';
      navNext.title = `Next: ${nextArtifact.title || 'Untitled'}`;
      navNext.textContent = 'Next Artifact →';
    } else {
      navNext.href = '#';
      navNext.style.opacity = '0.5';
      navNext.style.pointerEvents = 'none';
      navNext.title = 'No next artifact';
      navNext.textContent = 'Next Artifact →';
    }

    console.log(`🧭 Navigation setup complete: ${currentIndex + 1} of ${allArtifacts.length}`);
  }

  // === Search System ===
  function setupSearch(allArtifacts) {
    const searchBox = document.getElementById('searchBox');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');

    if (!searchBox || !searchButton) {
      console.log('⚠️ Search elements not found');
      return;
    }

    let searchTimeout;

    const performSearch = () => {
      const query = searchBox.value.trim().toLowerCase();
      
      if (query.length < 2) {
        if (searchResults) {
          searchResults.style.display = 'none';
        }
        return;
      }

      if (!allArtifacts || !allArtifacts.length) {
        console.warn('⚠️ No artifacts data for search');
        return;
      }

      const results = allArtifacts.filter(item => {
        return (item.title && item.title.toLowerCase().includes(query)) ||
               (item.subtitle && item.subtitle.toLowerCase().includes(query)) ||
               (item.medium && item.medium.toLowerCase().includes(query)) ||
               (item.region && item.region.toLowerCase().includes(query)) ||
               (item.period && item.period.toLowerCase().includes(query)) ||
               (item.essay && item.essay.toLowerCase().includes(query));
      });

      displaySearchResults(results, query);
    };

    // Real-time search as user types
    searchBox.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(performSearch, 300);
    });

    // Search on button click
    searchButton.addEventListener('click', performSearch);

    // Search on Enter key
    searchBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      if (searchResults && !searchBox.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });

    console.log('🔍 Search functionality initialized');
  }

  function displaySearchResults(results, query) {
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;
    
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-no-results">
          <p>No artifacts found for "${query}"</p>
        </div>
      `;
      searchResults.style.display = 'block';
      return;
    }

    const resultsHtml = results.slice(0, 8).map(item => `
      <div class="search-result-item" onclick="window.location.href='${getTemplateUrl('dt-1.html', item.sku)}'">
        <div class="search-result-image">
          <img src="${item.image ? (item.image.startsWith('http') ? item.image : basePath + item.image) : basePath + '/images/placeholder.jpg'}" 
               alt="${item.title || 'Artifact'}" />
        </div>
        <div class="search-result-info">
          <h4>${item.title || 'Untitled Artifact'}</h4>
          <p class="search-result-subtitle">${item.subtitle || ''}</p>
          <p class="search-result-meta">${item.medium || ''} • ${item.period || ''}</p>
        </div>
      </div>
    `).join('');

    searchResults.innerHTML = `
      <div class="search-results-header">
        <span>Found ${results.length} artifact${results.length !== 1 ? 's' : ''}</span>
        ${results.length > 8 ? `<span class="search-view-all">View all in <a href="${getPageUrl('/')}?search=${encodeURIComponent(query)}">Gallery</a></span>` : ''}
      </div>
      ${resultsHtml}
    `;
    
    searchResults.style.display = 'block';
  }

  // === Gallery System ===
  function loadGallery(items) {
    if (!gallery) return;
    gallery.innerHTML = '';

    if (!items.length) {
      gallery.innerHTML = "<p>No results found.</p>";
      if (window.updateGalleryStats) {
        window.updateGalleryStats(globalDataCache ? globalDataCache.length : 0, 0);
      }
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      const templatePage = item["template-page"] || "dt-1.html";
      const link = getTemplateUrl(templatePage, item.sku);
      const titleHTML = item.title ? `<h3>${item.title}</h3>` : '';
      const subtitleHTML = item.subtitle ? `<p class="subtitle">${item.subtitle}</p>` : '';
      
      div.innerHTML = `
        <a href="${link}">
          <img src="${item.image}" alt="${item.title || ''}" class="lightbox-trigger" />
          ${titleHTML}
          ${subtitleHTML}
        </a>
      `;
      gallery.appendChild(div);
    });

    if (window.updateGalleryStats && globalDataCache) {
      window.updateGalleryStats(globalDataCache.length, items.length);
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
  window.labelMap = labelMap;

  // Allow menu filters to trigger gallery filtering
  window.filterGallery = function (category) {
    if (!category) {
      if (title) title.textContent = "All Buddhist Art";
      if (clearBtnContainer) clearBtnContainer.style.display = "none";
      loadGallery(globalDataCache || []);
      return;
    }

    const displayLabel = labelMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (title) title.textContent = displayLabel;
    if (clearBtnContainer) clearBtnContainer.style.display = "block";

    const filtered = (globalDataCache || []).filter(item => {
      const categories = extractCategories(item);
      return Object.values(categories).some(catArray => 
        catArray.includes(category.toLowerCase())
      );
    });
    
    loadGallery(filtered);
  };

  // === Detail Pages (dt-1.html / dt-2.html) Rendering ===
  if (window.location.pathname.includes("dt-1.html") || window.location.pathname.includes("dt-2.html")) {
    console.log('📄 Detail page detected, loading artifact data...');
    
    fetchBuddhaData()
      .then(data => {
        globalDataCache = data;
        const item = data.find(i => i.sku === sku);
        
        if (!item) {
          console.log(`❌ Artifact not found: ${sku}`);
          return;
        }

        currentArtifactData = item;
        console.log('🖼️ Loading artifact:', item.sku, '-', item.title);

        // Update text content safely
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
              const value = values[0];
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
        updateText(".subtitle", item.subtitle);
        updateText(".sku", item.sku);
        updateText(".estimate", item.estimate);
        updateText(".price-realized", item.price_realized);
        updateText(".dimensions", item.dimensions);
        updateText(".medium", item.medium);
        updateText(".provenance", item.provenance);
        updateText(".essay", item.essay);

        // Apply read more functionality if available
        const essayElement = document.querySelector('.essay');
        if (essayElement && typeof applyReadMore === 'function') {
          applyReadMore(essayElement);
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

        // Set main image
        const image = document.querySelector(".statue-image");
        if (image && item.image) {
          image.src = item.image;
          image.alt = item.title || '';
        }

        // Handle lot link
        const lotLink = document.querySelector(".lot-link");
        if (lotLink && item.lot_link) {
          lotLink.href = item.lot_link;
          lotLink.textContent = "View Original Lot";
          lotLink.style.display = "";
        } else if (lotLink) {
          lotLink.style.display = "none";
        }

        // Setup navigation
        setupNavigation(data, item);

        // Setup search functionality
        setupSearch(data);

        console.log('✅ Detail page setup complete');
      })
      .catch(error => {
        console.error('💥 Error loading detail page data:', error);
      });
  }

  // === Index Gallery Page ===
  if (window.location.pathname === "/" || window.location.pathname === "/index.html" || window.location.pathname.endsWith("/buddha/") || window.location.pathname.endsWith("/buddha/index.html")) {
    console.log("✅ Index page detected, starting gallery setup...");
    
    fetchBuddhaData()
      .then(data => {
        globalDataCache = data;
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

        console.log("✅ Categories collected:", categories);

        const menu = document.getElementById("dynamic-menu");
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

          console.log("✅ Menu creation completed!");
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
          if (sidebar && !sidebar.contains(e.target) && toggleButton && !toggleButton.contains(e.target)) {
            sidebar.classList.remove("open");
          }
        });

        // Setup search functionality
        setupSearch(data);

        // Check for pending auto-filter
        const pendingFilter = window.pendingAutoFilter;
        if (pendingFilter) {
          console.log("✅ Applying pending auto-filter:", pendingFilter);
          window.pendingAutoFilter = null;
          window.filterGallery(pendingFilter);
          
          setTimeout(() => {
            const gallery = document.getElementById("gallery");
            if (gallery) gallery.style.visibility = "visible";
          }, 100);
        } else {
          loadGallery(data);
        }
      })
      .catch(error => {
        console.error("❌ Error loading gallery data:", error);
      });
  }

  // === Search Results Page ===
  const resultsContainer = document.getElementById("resultsContainer");

  if (resultsContainer) {
    const q = urlParams.get("q")?.toLowerCase()?.trim();
    if (q) {
      fetchBuddhaData()
        .then(data => {
          const matches = data.filter(item => {
            const qlc = q.toLowerCase();

            const fields = [
              item.title,
              item.subtitle,
              item.sku,
              item.medium,
              item.provenance,
              item.essay,
              item.estimate,
              item.dimensions
            ];

            return fields.some(field =>
              typeof field === "string" && field.toLowerCase().includes(qlc)
            );
          });

          resultsContainer.innerHTML = matches.length
            ? matches.map(item => {
                const template = item["template-page"] || "dt-1.html";
                const templateUrl = getTemplateUrl(template, item.sku);
                return `
                  <div class="search-result">
                    <a href="${templateUrl}">
                      <img src="${item.image}" alt="${item.title} – ${item.sku}" class="lightbox-trigger" />
                      <div>
                        <h3>${item.title}</h3>
                        <p>${item.subtitle || ''}</p>
                        <p>${item.essay?.substring(0, 150) || ''}...</p>
                      </div>
                    </a>
                  </div>
                `;
              }).join("")
            : "<p>No results found for your query.</p>";
        })
        .catch(error => {
          console.error("Failed to load search data:", error);
          resultsContainer.innerHTML = "<p>Error loading search results. Please try again.</p>";
        });
    } else {
      resultsContainer.innerHTML = "<p>Please enter a search query.</p>";
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
      }
    });

    lightboxClose.addEventListener("click", () => {
      lightbox.classList.remove("active");
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("active");
      }
    });
  }

  // === Fallback initialization for Netlify timing issues ===
  setTimeout(() => {
    if (!globalDataCache) {
      console.log('⏰ Fallback initialization triggered');
      // Re-trigger initialization if data hasn't loaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
    }
  }, 2000);

  console.log('🎉 Bundle.js initialization complete!');
});
