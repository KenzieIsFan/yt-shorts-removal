// Auto-reset counters at midnight
function checkDailyReset() {
    const today = new Date().toDateString();
    
    chrome.storage.local.get('lastReset', function(data) {
      if (!data.lastReset || data.lastReset !== today) {
        chrome.storage.local.set({
          shortsCount: 0,
          lastReset: today
        });
      }
    });
  }
  
  // Check for reset when extension starts
  checkDailyReset();
  
  // Check periodically (every hour) for date changes
  setInterval(checkDailyReset, 3600000);
  
  // Listen for messages from popup or content scripts
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'openPopup') {
      chrome.action.openPopup();
    }
  });
  
  // Listen for storage changes to update content scripts
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && (changes.shortsLimit || changes.enabled || changes.shortsCount)) {
      // Notify all tabs with YouTube open
      chrome.tabs.query({url: '*://*.youtube.com/*'}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, {action: 'checkLimit'});
        });
      });
    }
  });