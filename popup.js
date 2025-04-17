document.addEventListener('DOMContentLoaded', function() {
    const limitInput = document.getElementById('limit-input');
    const enableLimiter = document.getElementById('enable-limiter');
    const resetBtn = document.getElementById('reset-btn');
    const saveBtn = document.getElementById('save-btn');
    const shortsCount = document.getElementById('shorts-count');
    const shortsLimit = document.getElementById('shorts-limit');
    const limitReached = document.getElementById('limit-reached');
  
    // Load current settings and stats
    chrome.storage.local.get(['shortsLimit', 'shortsCount', 'enabled', 'lastReset'], function(data) {
      const today = new Date().toDateString();
      
      // Initialize with defaults if not set
      if (!data.shortsLimit) {
        data.shortsLimit = 10;
      }
      
      if (!data.shortsCount || !data.lastReset || data.lastReset !== today) {
        data.shortsCount = 0;
        data.lastReset = today;
        chrome.storage.local.set({ shortsCount: 0, lastReset: today });
      }
      
      if (data.enabled === undefined) {
        data.enabled = true;
      }
      
      // Update UI
      limitInput.value = data.shortsLimit;
      shortsLimit.textContent = data.shortsLimit;
      shortsCount.textContent = data.shortsCount;
      enableLimiter.checked = data.enabled;
      
      // Show limit reached message if applicable
      if (data.shortsCount >= data.shortsLimit && data.enabled) {
        limitReached.style.display = 'block';
      } else {
        limitReached.style.display = 'none';
      }
    });
  
    // Save settings
    saveBtn.addEventListener('click', function() {
      const newLimit = parseInt(limitInput.value);
      if (newLimit < 1) {
        alert('Limit must be at least 1');
        return;
      }
      
      chrome.storage.local.set({
        shortsLimit: newLimit,
        enabled: enableLimiter.checked
      }, function() {
        // Update displayed limit
        shortsLimit.textContent = newLimit;
        
        // Show confirmation
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveBtn.textContent = originalText;
        }, 1500);
        
        // Check if limit is now reached based on new settings
        chrome.storage.local.get(['shortsCount'], function(data) {
          if (data.shortsCount >= newLimit && enableLimiter.checked) {
            limitReached.style.display = 'block';
          } else {
            limitReached.style.display = 'none';
          }
        });
      });
    });
  
    // Reset counter
    resetBtn.addEventListener('click', function() {
      const today = new Date().toDateString();
      chrome.storage.local.set({
        shortsCount: 0,
        lastReset: today
      }, function() {
        shortsCount.textContent = '0';
        limitReached.style.display = 'none';
        
        // Show confirmation
        const originalText = resetBtn.textContent;
        resetBtn.textContent = 'Reset!';
        setTimeout(() => {
          resetBtn.textContent = originalText;
        }, 1500);
      });
    });
  });