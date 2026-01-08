// My Events page - extracts event IDs from registered events
// The popup will handle API calls since content scripts have CORS restrictions

// Cross-browser compatibility: Firefox supports both 'browser' and 'chrome' namespaces
// Chrome only supports 'chrome'. We use 'chrome' which works in both.
if (typeof browser !== 'undefined' && typeof chrome === 'undefined') {
  globalThis.chrome = browser;
}

function extractEventIds() {
  const eventIds = [];

  // Look for links to event pages which contain the event ID
  const eventLinks = document.querySelectorAll('a[href*="/events/"]');

  console.log('[RiftHub] Found event links:', eventLinks.length);

  eventLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Extract event ID from URL like "/events/12345"
    const match = href.match(/\/events\/(\d+)/);
    if (match && match[1]) {
      const eventId = parseInt(match[1]);
      if (!eventIds.includes(eventId)) {
        eventIds.push(eventId);
        console.log('[RiftHub] Extracted event ID:', eventId);
      }
    }
  });

  console.log('[RiftHub] Total unique event IDs:', eventIds);
  return eventIds;
}

// Save just the event IDs to storage - popup will enrich with API data
function saveEventIds() {
  const eventIds = extractEventIds();

  console.log('[RiftHub] Saving event IDs:', eventIds);

  // Save IDs to storage for popup to process
  chrome.storage.local.set({
    myEventIds: eventIds,
    myEventIdsLastSync: new Date().toISOString()
  }, () => {
    console.log('[RiftHub] Event IDs saved to storage');
    showSyncNotification(eventIds.length);
  });

  return eventIds;
}

// Store notification element reference
let currentNotification = null;

// Show a notification that event IDs were found
function showSyncNotification(count) {
  // Remove any existing notification
  if (currentNotification) {
    currentNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'riftbound-sync-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">✅</span>
      <div>
        <div style="font-weight: 700;">Events Found!</div>
        <div style="font-size: 12px; opacity: 0.9;">Found ${count} registered ${count === 1 ? 'event' : 'events'}</div>
      </div>
    </div>
  `;

  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);
  currentNotification = notification;

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      notification.remove();
      currentNotification = null;
    }, 300);
  }, 3000);
}

// Auto-sync when page loads
function init() {
  // Wait for dynamic content to load (React/Next.js apps load content after initial render)
  let attempts = 0;
  const maxAttempts = 5;

  function tryExtract() {
    attempts++;
    const eventLinks = document.querySelectorAll('a[href*="/events/"]');

    if (eventLinks.length > 0 || attempts >= maxAttempts) {
      saveEventIds();
    } else {
      setTimeout(tryExtract, 1000);
    }
  }

  setTimeout(tryExtract, 2000);
}

// Listen for requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getEventIds') {
    // Just extract and return event IDs - popup will handle API calls
    const eventIds = extractEventIds();
    saveEventIds();
    sendResponse({
      success: true,
      eventIds: eventIds,
      pageUrl: window.location.href
    });
  }
  return true;
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
