// File: /buddha/admin/editor.js (Complete with GitHub Integration)

document.addEventListener("DOMContentLoaded", () => {
  const skuSelector = document.getElementById("skuSelector");
  const preview = document.getElementById("jsonPreview");
  const saveButton = document.getElementById("saveButton");
  const downloadButton = document.getElementById("downloadButton");
  const githubSaveButton = document.getElementById("githubSaveButton");
  const statusMessage = document.getElementById("statusMessage");
  let jsonData = [];
  let currentSKU = null;

  // === Utility Functions ===
  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 5000);
    }
  }

  function hideStatus() {
    statusMessage.style.display = 'none';
  }

  // === Load JSON ===
  fetch("/data/buddha-collection.json")
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to load buddha-collection.json: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      jsonData = data;
      populateSKUList();
      if (jsonData.length > 0) {
        skuSelector.dispatchEvent(new Event("change"));
      }
      showStatus('Buddha collection loaded successfully', 'success');
    })
    .catch(error => {
      console.error("Error loading buddha-collection.json:", error);
      showStatus('Failed to load collection from server, trying local backup...', 'error');
      
      // Try to restore from localStorage as backup
      const localData = localStorage.getItem("buddha_collection_backup");
      if (localData) {
        try {
          jsonData = JSON.parse(localData);
          populateSKUList();
          if (jsonData.length > 0) {
            skuSelector.dispatchEvent(new Event("change"));
          }
          showStatus('Restored from local backup', 'info');
        } catch (e) {
          console.warn("Failed to parse local backup.");
          showStatus('Failed to load any data', 'error');
        }
      } else {
        showStatus('No data available - check your connection', 'error');
      }
    });

  function populateSKUList() {
    skuSelector.innerHTML = "";
    jsonData.forEach(entry => {
      const opt = document.createElement("option");
      opt.value = entry.sku;
      opt.textContent = `${entry.sku} – ${entry.title}`;
      skuSelector.appendChild(opt);
    });
  }

  skuSelector.addEventListener("change", () => {
    const sku = skuSelector.value;
    const item = jsonData.find(i => i.sku === sku);
    if (!item) return;
    currentSKU = sku;

    for (const input of document.querySelectorAll("[data-json-path]")) {
      const path = input.dataset.jsonPath;
      const value = getNestedValue(item, path);
      
      // Handle subtitle specially - it can be string or array
      if (path === "subtitle") {
        if (Array.isArray(value)) {
          input.value = value.join(" | ");
        } else {
          input.value = value || "";
        }
      } else {
        // All other fields should be strings, not arrays
        input.value = value || "";
      }
    }

    updatePreview(item);
    hideStatus();
  });

  // === Local Save Button (existing functionality) ===
  saveButton.addEventListener("click", () => {
    const index = jsonData.findIndex(i => i.sku === currentSKU);
    if (index === -1) {
      showStatus('No item selected to save', 'error');
      return;
    }

    const updatedItem = updateCurrentItem(index);
    if (updatedItem) {
      localStorage.setItem("buddha_collection_backup", JSON.stringify(jsonData));
      
      // Show save confirmation
      saveButton.textContent = "✅ Saved!";
      showStatus(`SKU ${currentSKU} saved locally`, 'success');
      setTimeout(() => {
        saveButton.textContent = "💾 Save Locally";
      }, 2000);
    }
  });

  // === GitHub Save Button (NEW) ===
  githubSaveButton.addEventListener("click", async () => {
    if (!currentSKU) {
      showStatus('No item selected to save', 'error');
      return;
    }

    const index = jsonData.findIndex(i => i.sku === currentSKU);
    if (index === -1) {
      showStatus('Item not found', 'error');
      return;
    }

    try {
      githubSaveButton.disabled = true;
      githubSaveButton.textContent = "🔄 Saving to GitHub...";
      showStatus('Updating GitHub repository...', 'info');

      // First update the current item in the data
      const updatedItem = updateCurrentItem(index);
      if (!updatedItem) {
        throw new Error('Failed to update item data');
      }

      // Send to GitHub via Netlify function
      const response = await fetch('/.netlify/functions/update-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: jsonData,
          message: `Update Buddha collection - SKU ${currentSKU} - ${new Date().toLocaleString()}`,
          sku: currentSKU
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save to GitHub';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      githubSaveButton.textContent = "✅ Saved to GitHub!";
      showStatus(`Successfully saved SKU ${currentSKU} to GitHub repository`, 'success');
      
      // Also save locally as backup
      localStorage.setItem("buddha_collection_backup", JSON.stringify(jsonData));
      
      console.log('Successfully saved to GitHub:', result);

    } catch (error) {
      console.error('Error saving to GitHub:', error);
      githubSaveButton.textContent = "❌ Error saving";
      showStatus(`Failed to save to GitHub: ${error.message}`, 'error');
    } finally {
      setTimeout(() => {
        githubSaveButton.disabled = false;
        githubSaveButton.textContent = "🌐 Save to GitHub";
      }, 3000);
    }
  });

  // === Download Button ===
  downloadButton.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `buddha-collection-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showStatus('Collection exported successfully', 'success');
  });

  // === Helper Functions ===
  function updateCurrentItem(index) {
    try {
      const updatedItem = { ...jsonData[index] };

      for (const input of document.querySelectorAll("[data-json-path]")) {
        const path = input.dataset.jsonPath;
        let value = input.value;
        
        // Handle subtitle specially - keep it as string unless it contains " | "
        if (path === "subtitle") {
          if (value.includes(" | ")) {
            value = value.split(" | ").map(t => t.trim()).filter(t => t.length > 0);
          }
        }
        // All other fields remain as strings - no comma splitting
        
        setNestedValue(updatedItem, path, value);
      }

      jsonData[index] = updatedItem;
      updatePreview(updatedItem);
      return updatedItem;
    } catch (error) {
      console.error('Error updating item:', error);
      showStatus('Error updating item data', 'error');
      return null;
    }
  }

  function updatePreview(obj) {
    preview.textContent = JSON.stringify(obj, null, 2);
  }

  function getNestedValue(obj, path) {
    return path.split(".").reduce((o, k) => o?.[k], obj);
  }

  function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    
    // For simple paths (no dots), set directly on the object
    if (keys.length === 1) {
      obj[keys[0]] = value;
      return;
    }
    
    // For nested paths, create the structure
    let o = obj;
    keys.slice(0, -1).forEach(k => {
      if (!(k in o)) o[k] = {};
      o = o[k];
    });
    o[keys[keys.length - 1]] = value;
  }

  // === Restore from localStorage on page load ===
  const localData = localStorage.getItem("buddha_collection_backup");
  if (localData && jsonData.length === 0) {
    try {
      const backupData = JSON.parse(localData);
      // Only use backup if we haven't loaded data from server yet
      if (jsonData.length === 0) {
        jsonData = backupData;
        populateSKUList();
        if (jsonData.length > 0) {
          skuSelector.dispatchEvent(new Event("change"));
        }
        showStatus('Loaded from local backup', 'info');
      }
    } catch (e) {
      console.warn("Failed to parse local backup.");
    }
  }
});
