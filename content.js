// Track the current URL to detect navigation between pages
let currentUrl = window.location.href;
let isShortPage = currentUrl.includes('/shorts/');
let recentlyIncrementedId = null;

// Create overlay for blocked content
function createBlockOverlay() {
  // Remove existing overlay if present
  const existingOverlay = document.getElementById('yt-shorts-limiter-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create new overlay
  const overlay = document.createElement('div');
  overlay.id = 'yt-shorts-limiter-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.color = 'white';
  overlay.style.fontSize = '24px';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.textAlign = 'center';
  overlay.style.padding = '20px';
  
  const message = document.createElement('div');
  message.innerHTML = `
    <h2>Daily YouTube Shorts Limit Reached</h2>
    <p>You've watched your maximum number of Shorts for today.</p>
    <p>Take a break and come back tomorrow!</p>
    <button id="yt-shorts-limiter-settings" style="
      background-color: #ff0000;
      color: white;
      border: none;
      padding: 10px 20px;
      margin-top: 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;">
      Open Settings
    </button>
  `;
  
  overlay.appendChild(message);
  document.body.appendChild(overlay);
  
  // Add event listener to the settings button
  document.getElementById('yt-shorts-limiter-settings').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
}

// Check if URL is a Shorts page
function isYouTubeShorts(url) {
  return url.includes('youtube.com/shorts/');
}

// Process a new Shorts video
function processShorts(shortId) {
  // Make sure we don't double-count if already processed this ID recently
  if (shortId === recentlyIncrementedId) {
    return;
  }
  
  // Get current date for daily reset check
  const today = new Date().toDateString();
  
  chrome.storage.local.get(['shortsCount', 'shortsLimit', 'enabled', 'lastReset'], function(data) {
    // Check if we need to reset counter for a new day
    if (!data.lastReset || data.lastReset !== today) {
      chrome.storage.local.set({
        shortsCount: 1, // Start with 1 since we're watching a Short now
        lastReset: today
      });
      return;
    }
    
    // If limiter is disabled, don't track or block
    if (data.enabled === false) {
      return;
    }
    
    // Initialize with defaults if not set
    const shortsLimit = data.shortsLimit || 10;
    const shortsCount = data.shortsCount || 0;
    
    // Check if limit is already reached
    if (shortsCount >= shortsLimit) {
      createBlockOverlay();
      // Try to navigate away from Shorts
      if (isYouTubeShorts(window.location.href)) {
        window.history.back();
      }
      return;
    }
    
    // Increment shorts count
    const newCount = shortsCount + 1;
    chrome.storage.local.set({ shortsCount: newCount });
    
    // Set this ID as recently processed
    recentlyIncrementedId = shortId;
    
    // Check if we've now reached the limit
    if (newCount >= shortsLimit) {
      createBlockOverlay();
    }
  });
}

// Watch for URL changes to detect navigation between Shorts
setInterval(function() {
  const newUrl = window.location.href;
  
  if (newUrl !== currentUrl) {
    currentUrl = newUrl;
    isShortPage = isYouTubeShorts(currentUrl);
    
    if (isShortPage) {
      // Extract the shorts ID from the URL
      const shortId = currentUrl.split('/shorts/')[1].split('?')[0];
      processShorts(shortId);
    } else {
      // Remove overlay if we navigate away from shorts
      const overlay = document.getElementById('yt-shorts-limiter-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  }
}, 500);

// Initial check when content script loads
if (isShortPage) {
  const shortId = currentUrl.split('/shorts/')[1].split('?')[0];
  processShorts(shortId);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'checkLimit') {
    // Remove overlay since settings might have changed
    const overlay = document.getElementById('yt-shorts-limiter-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Re-check if we should show the overlay
    if (isShortPage) {
      const shortId = currentUrl.split('/shorts/')[1].split('?')[0];
      processShorts(shortId);
    }
  }
});