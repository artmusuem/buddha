// File: /buddha/js/bundle.js (Buddha Museum - Christie's Auction Data Version)

document.addEventListener("DOMContentLoaded", () => {
  console.log("bundle.js loaded on:", window.location.href);

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
  function fetchFilteredData(url) {
    return fetch(url)
      .then(res => res.json())
      .then(data => data.filter(item => item.status !== "hide"));
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
      const link = `/buddha/page-templates/${templatePage}?sku=${item.sku}`;
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
  window.labelMap = labelMap;

  // Allow menu filters to trigger gallery filtering
  window.filterGallery = function (category) {
    if (!category) {
      title.textContent = "All Buddhist Art";
      clearBtnContainer.style.display = "none";
      loadGallery(window.fullData);
      return;
    }

    const displayLabel = labelMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    title.textContent = displayLabel;
    clearBtnContainer.style.display = "block";

    const filtered = window.fullData.filter(item => {
      const categories = extractCategories(item);
      
      // Check if the category matches any extracted categories
      return Object.values(categories).some(catArray => 
        catArray.includes(category.toLowerCase())
      );
    });
    
    loadGallery(filtered);
  };

  // === Detail Pages (dt-1.html / dt-2.html) Rendering ===
  if (window.location.pathname.includes("dt-1.html") || window.location.pathname.includes("dt-2.html")) {
    fetchFilteredData("/buddha/data/buddha-collection.json")
      .then(data => {
        const item = data.find(i => i.sku === sku);
        if (!item) return;

        // First, update the updateText function to handle multiple elements
		const updateText = (selector, value) => {
		const elements = document.querySelectorAll(selector); // Changed from querySelector
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
              el.innerHTML = `<a href="/buddha/" onclick="sessionStorage.setItem('autoFilter', '${value}'); return true;" class="filter-link">${displayLabel}</a>`;
              el.style.display = "";
            } else {
              el.style.display = "none";
            }
          }
        };

// Then your existing calls will work for all elements:
// Populate Christie's auction data fields
updateText(".statue-title", item.title);
updateText(".subtitle", item.subtitle);
updateText(".sku", item.sku);
updateText(".estimate", item.estimate);
updateText(".price-realized", item.price_realized);
updateText(".dimensions", item.dimensions);
updateText(".medium", item.medium);  // This will now update ALL .medium elements
updateText(".provenance", item.provenance);
updateText(".essay", item.essay);

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
  window.location.href = '/buddha/';
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

// === Simple Numeric Navigation - Buddha Site ===
// Goes in numerical order regardless of prefix, wraps around

// Get current SKU from URL
const urlParams = new URLSearchParams(window.location.search);
const currentSku = urlParams.get("sku");

// Get navigation elements
const navPrev = document.querySelector(".nav-prev");
const navNext = document.querySelector(".nav-next");

if (currentSku && navPrev && navNext) {
  // Extract just the number from any SKU format
  function getNumber(sku) {
    const match = sku.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  }
  
  // Extract prefix from SKU (everything before the number)
  function getPrefix(sku) {
    const match = sku.match(/^(.*?)(\d+)/);
    return match ? match[1] : '';
  }
  
  // Create SKU with same prefix but different number
  function makeSku(prefix, number) {
    // Pad with zeros to match original length
    const originalMatch = currentSku.match(/(\d+)/);
    if (originalMatch) {
      const originalLength = originalMatch[0].length;
      const paddedNumber = number.toString().padStart(originalLength, '0');
      return prefix + paddedNumber;
    }
    return prefix + number;
  }
  
  // Get current number and prefix
  const currentNumber = getNumber(currentSku);
  const prefix = getPrefix(currentSku);
  
  console.log("Current SKU:", currentSku);
  console.log("Current number:", currentNumber);
  console.log("Prefix:", prefix);
  
  // Load data to find min/max numbers
  fetch("/buddha/data/buddha-collection.json")
    .then(res => res.json())
    .then(data => {
      // Get all numbers from SKUs with same prefix
      const numbers = data
        .filter(item => item.sku && getPrefix(item.sku) === prefix)
        .map(item => getNumber(item.sku))
        .filter(num => num > 0)
        .sort((a, b) => a - b);
      
      if (numbers.length === 0) {
        console.log("No valid numbers found");
        return;
      }
      
      const minNumber = Math.min(...numbers);
      const maxNumber = Math.max(...numbers);
      
      console.log("Available numbers:", numbers);
      console.log("Range:", minNumber, "to", maxNumber);
      
      // Find current position in the sorted array
      const currentIndex = numbers.indexOf(currentNumber);
      
      let prevNumber, nextNumber;
      
      if (currentIndex === -1) {
        // Current number not found, use first as fallback
        prevNumber = maxNumber; // wrap to end
        nextNumber = minNumber; // wrap to start
      } else {
        // Calculate prev/next with wrapping
        const prevIndex = currentIndex === 0 ? numbers.length - 1 : currentIndex - 1;
        const nextIndex = currentIndex === numbers.length - 1 ? 0 : currentIndex + 1;
        
        prevNumber = numbers[prevIndex];
        nextNumber = numbers[nextIndex];
      }
      
      // Create navigation SKUs
      const prevSku = makeSku(prefix, prevNumber);
      const nextSku = makeSku(prefix, nextNumber);
      
      console.log("Previous SKU:", prevSku);
      console.log("Next SKU:", nextSku);
      
      // Set navigation links (Buddha site paths)
      navPrev.href = `/buddha/page-templates/dt-1.html?sku=${prevSku}`;
      navNext.href = `/buddha/page-templates/dt-1.html?sku=${nextSku}`;
      
      console.log("Buddha navigation set successfully!");
    })
    .catch(error => {
      console.error("Error loading Buddha data:", error);
      
      // Fallback: simple +1/-1 navigation
      const prevNumber = currentNumber === 1 ? 999 : currentNumber - 1;
      const nextNumber = currentNumber + 1;
      
      const prevSku = makeSku(prefix, prevNumber);
      const nextSku = makeSku(prefix, nextNumber);
      
      navPrev.href = `/buddha/page-templates/dt-1.html?sku=${prevSku}`;
      navNext.href = `/buddha/page-templates/dt-1.html?sku=${nextSku}`;
      
      console.log("Using fallback Buddha navigation");
    });
}
      });
  }

  // === Index Gallery Page ===
  if (window.location.pathname.includes("/")) {
    console.log("✅ Index page detected, starting menu creation...");
    
    fetchFilteredData("/buddha/data/buddha-collection.json")
      .then(data => {
        console.log("✅ Data loaded:", data.length, "items");
        
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
        if (!menu) {
          console.error("❌ Menu element not found!");
          return;
        }

        // Clear any existing content
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
          if (sidebar && !sidebar.contains(e.target) && !toggleButton.contains(e.target)) {
            sidebar.classList.remove("open");
          }
        });

        window.fullData = data;
        
// Check for pending auto-filter
const pendingFilter = window.pendingAutoFilter;
if (pendingFilter) {
  console.log("✅ Applying pending auto-filter:", pendingFilter);
  window.pendingAutoFilter = null;
  window.filterGallery(pendingFilter);
  
  // Show gallery after filter is applied
  setTimeout(() => {
    const gallery = document.getElementById("gallery");
    if (gallery) gallery.style.visibility = "visible";
  }, 100);
} else {
  loadGallery(data);
}
      })
      .catch(error => {
        console.error("❌ Error loading data:", error);
      });
  }

  // === Search Results Page ===
  const searchInput = document.getElementById("searchBox");
  const searchButton = document.getElementById("searchButton");
  const resultsContainer = document.getElementById("resultsContainer");

  const performSearch = (query) => {
    query = query?.trim();
    if (!query) return;
    window.location.href = `/buddha/search-results.html?q=${encodeURIComponent(query)}`;
  };

  if (searchInput && searchButton) {
    searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") performSearch(searchInput.value);
    });
    searchButton.addEventListener("click", () => {
      performSearch(searchInput.value);
    });
  }

  if (resultsContainer) {
    const q = urlParams.get("q")?.toLowerCase()?.trim();
    if (q) {
      fetchFilteredData("/buddha/data/buddha-collection.json")
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
                return `
                  <div class="search-result">
                    <a href="/buddha/page-templates/${template}?sku=${item.sku}">
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



});