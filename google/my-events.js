// My Events scraper - extracts registered events and saves to storage

function extractMyEvents() {
  const events = [];

  // Try multiple selectors to find event cards (page structure may vary)
  const selectors = [
    '[class*="rounded-xl"][class*="border"][class*="shadow"]',  // Original selector
    '[data-testid*="event"]',                                    // Data attribute
    'article[class*="event"]',                                   // Article tags
    '.event-card',                                               // Common class
    '[class*="EventCard"]',                                      // React component class
    'a[href*="/events/"]',                                       // Links to event pages
  ];

  let eventCards = [];

  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > eventCards.length) {
      eventCards = found;
    }
  }

  eventCards.forEach(card => {
    try {
      // Extract all text first to check status
      const allText = card.textContent;

      // Skip completed or cancelled events
      if (allText.includes('Completed') || allText.includes('Cancelled') || allText.includes('Canceled')) {
        return;
      }

      const event = {
        title: '',
        date: '',
        time: '',
        location: '',
        store: '',
        price: '',
        format: '',
        players: '',
        status: 'registered',
        extractedAt: new Date().toISOString()
      };

      // Extract title
      const titleEl = card.querySelector('h3, h2, [class*="title"]');
      if (titleEl) event.title = titleEl.textContent.trim();

      // Look for datetime attribute in any element (ISO format from API)
      const datetimeEls = card.querySelectorAll('[datetime], time, [data-datetime], [data-date]');

      for (const datetimeEl of datetimeEls) {
        const isoDate = datetimeEl.getAttribute('datetime') ||
                        datetimeEl.getAttribute('data-datetime') ||
                        datetimeEl.getAttribute('data-date');
        if (isoDate) {
          const dateObj = new Date(isoDate);
          if (!isNaN(dateObj.getTime())) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            event.date = `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
            let hours = dateObj.getHours();
            const minutes = dateObj.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            event.time = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            break;
          }
        }
      }

      // Fallback: Date pattern (e.g., "Dec 1, 2025" or "Jan 4, 2026" or "Feb 8, 2026")
      if (!event.date) {
        const dateMatch = allText.match(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);
        if (dateMatch) {
          event.date = dateMatch[0];
        }
      }

      // Time patterns to try - must handle various formats seen on the page
      // Examples: "12:00 PM (EST)", "6:30 PM (EST)", "10:00 AM (EST)"
      // IMPORTANT: Use word boundary or lookbehind to avoid capturing date numbers
      if (!event.time) {
        // First, normalize the text (remove extra whitespace, handle unicode)
        const normalizedText = allText.replace(/\s+/g, ' ');

        const timePatterns = [
          // "12:00 PM (EST)" - with timezone in parentheses, word boundary before
          /(?:^|[^\d])(\d{1,2}:\d{2}\s*(?:AM|PM)\s*\([A-Z]{2,4}\))/i,
          // "12:00 PM EST" - with timezone
          /(?:^|[^\d])(\d{1,2}:\d{2}\s*(?:AM|PM)\s+[A-Z]{2,4})\b/i,
          // "12:00 PM" - basic format
          /(?:^|[^\d])(\d{1,2}:\d{2}\s*(?:AM|PM))/i,
        ];

        for (const pattern of timePatterns) {
          const timeMatch = normalizedText.match(pattern);
          if (timeMatch) {
            event.time = timeMatch[1].trim();
            break;
          }
        }
      }

      // If still no time, try looking at individual elements
      if (!event.time) {
        const allElements = card.querySelectorAll('*');
        for (const el of allElements) {
          const directText = Array.from(el.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .join(' ');

          const timeMatch = directText.match(/(?:^|[^\d])(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
          if (timeMatch) {
            event.time = timeMatch[1].trim();
            break;
          }
        }
      }

      // Price - look for dollar amounts or "Free"
      if (allText.includes('Free Event') || allText.includes('Free')) {
        event.price = 'Free';
      } else {
        const priceMatch = allText.match(/[\$€£¥₹]\s*\d+(?:\.\d{2})?/);
        if (priceMatch) event.price = priceMatch[0];
      }

      // Format - Constructed or Sealed
      if (allText.includes('Constructed')) event.format = 'Constructed';
      else if (allText.includes('Sealed')) event.format = 'Sealed';

      // Players
      const playersMatch = allText.match(/(\d+)\s*Players?/);
      if (playersMatch) event.players = playersMatch[0];

      // Store name extraction - look for store names with location patterns
      // Examples from page: "Kapow Comics LLC - US", "Level Up Games Johns Creek - US", "GuuBuu Hobby - US"
      const storePatterns = [
        // Pattern: "Store Name - US" at end of text segment
        /([A-Za-z0-9\s'&]+(?:LLC|Games|Gaming|Cafe|Comics|Hobby|Store|Brew)?(?:\s+[A-Za-z\s]+)?)\s*-\s*US\b/i,
        // Pattern: Store icon followed by text
        /📍\s*([^\n]+)/,
        /🏪\s*([^\n]+)/,
      ];

      for (const pattern of storePatterns) {
        const match = allText.match(pattern);
        if (match) {
          let storeName = match[1] ? match[1].trim() : match[0].trim();
          storeName = storeName.replace(/\s*-\s*US$/i, '').trim();
          if (storeName && storeName.length > 2) {
            event.store = storeName;
            break;
          }
        }
      }

      // Location - try to get city/state from store info
      // Pattern: "Store Name - Location - US" or location in separate element
      const locationPatterns = [
        /Johns Creek/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*([A-Z]{2})\s*-?\s*US/i,
      ];
      for (const pattern of locationPatterns) {
        const locMatch = allText.match(pattern);
        if (locMatch) {
          event.location = locMatch[0].replace(/\s*-?\s*US$/i, '').trim();
          break;
        }
      }

      // Event type detection
      const titleLower = event.title.toLowerCase();
      if (titleLower.includes('nexus night')) {
        event.type = 'Nexus Night';
        event.typeColor = '#3b82f6';
      } else if (titleLower.includes('summoner skirmish')) {
        event.type = 'Summoner Skirmish';
        event.typeColor = '#10b981';
      } else if (titleLower.includes('riftbound') || titleLower.includes('open')) {
        event.type = 'Riftbound Open';
        event.typeColor = '#f97316';
      } else if (titleLower.includes('regional')) {
        event.type = 'Regional';
        event.typeColor = '#8b5cf6';
      } else if (titleLower.includes('national')) {
        event.type = 'National';
        event.typeColor = '#ec4899';
      } else if (titleLower.includes('world')) {
        event.type = 'World Championship';
        event.typeColor = '#eab308';
      } else {
        event.type = 'Other';
        event.typeColor = '#64748b';
      }

      // Only add if we have at least a title
      if (event.title) {
        events.push(event);
      }
    } catch (error) {
      console.error('[Riftbound Filter] Error extracting event:', error);
    }
  });

  return events;
}

// Check if event is in the past
function isEventPast(event) {
  if (!event.date) {
    return false;
  }

  try {
    let eventDate;
    if (event.time) {
      const dateTimeStr = `${event.date} ${event.time}`;
      eventDate = new Date(dateTimeStr);
    } else {
      const dateStr = `${event.date} 11:59 PM`;
      eventDate = new Date(dateStr);
    }

    if (isNaN(eventDate.getTime())) {
      return false;
    }

    return eventDate < new Date();
  } catch (error) {
    return false;
  }
}

// Function to save events to storage (scraped data only - no API enrichment to prevent wrong matches)
async function saveMyEvents() {
  const scrapedEvents = extractMyEvents();

  // Filter out past events first
  const upcomingScraped = scrapedEvents.filter(event => !isEventPast(event));
  const pastCount = scrapedEvents.length - upcomingScraped.length;

  if (upcomingScraped.length === 0) {
    chrome.storage.local.set({
      myEvents: [],
      myEventsLastSync: new Date().toISOString()
    });
    showSyncNotification(0, pastCount, false);
    return;
  }

  // Show notification
  showSyncNotification(upcomingScraped.length, pastCount, false);

  // Save scraped events directly - NO API enrichment (causes wrong event matches)
  const finalEvents = upcomingScraped.map(event => ({
    ...event,
    source: 'scraped'
  }));

  // Save to storage
  chrome.storage.local.set({
    myEvents: finalEvents,
    myEventsLastSync: new Date().toISOString()
  }, () => {
    updateSyncNotification(finalEvents.length, false);
  });
}

// Store notification element reference
let currentNotification = null;

// Show a notification that events were synced
function showSyncNotification(count, pastCount = 0, isLoading = false) {
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

  const pastInfo = pastCount > 0 ? `<div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">${pastCount} past ${pastCount === 1 ? 'event' : 'events'} filtered out</div>` : '';

  if (isLoading) {
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">⏳</span>
        <div>
          <div style="font-weight: 700;">Syncing Events...</div>
          <div style="font-size: 12px; opacity: 0.9;">Found ${count} ${count === 1 ? 'event' : 'events'}, fetching details...</div>
          ${pastInfo}
        </div>
      </div>
    `;
  } else {
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">✅</span>
        <div>
          <div style="font-weight: 700;">Events Synced!</div>
          <div style="font-size: 12px; opacity: 0.9;">${count} upcoming ${count === 1 ? 'event' : 'events'}</div>
          ${pastInfo}
        </div>
      </div>
    `;
  }

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

  // Don't auto-remove if loading
  if (!isLoading) {
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        notification.remove();
        currentNotification = null;
      }, 300);
    }, 3000);
  }
}

// Update the notification after API enrichment
function updateSyncNotification(count, hasApiData = false) {
  if (currentNotification) {
    const apiInfo = hasApiData ? '<div style="font-size: 10px; opacity: 0.7; margin-top: 2px;">✨ Enhanced with API data</div>' : '';

    currentNotification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">✅</span>
        <div>
          <div style="font-weight: 700;">Events Synced!</div>
          <div style="font-size: 12px; opacity: 0.9;">${count} upcoming ${count === 1 ? 'event' : 'events'}</div>
          ${apiInfo}
        </div>
      </div>
    `;

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (currentNotification) {
        currentNotification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          if (currentNotification) {
            currentNotification.remove();
            currentNotification = null;
          }
        }, 300);
      }
    }, 3000);
  }
}

// Auto-sync when page loads
function init() {
  // Wait for dynamic content to load (React/Next.js apps load content after initial render)
  let attempts = 0;
  const maxAttempts = 5;

  function tryExtract() {
    attempts++;
    const eventCards = document.querySelectorAll('[class*="rounded-xl"][class*="border"][class*="shadow"]');

    if (eventCards.length > 0 || attempts >= maxAttempts) {
      saveMyEvents();
    } else {
      setTimeout(tryExtract, 1000);
    }
  }

  setTimeout(tryExtract, 2000);
}

// Listen for manual sync requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncMyEvents') {
    // Try all selectors and report counts
    const selectorResults = {
      'rounded-xl+border+shadow': document.querySelectorAll('[class*="rounded-xl"][class*="border"][class*="shadow"]').length,
      'data-testid*=event': document.querySelectorAll('[data-testid*="event"]').length,
      'article': document.querySelectorAll('article').length,
      '.event-card': document.querySelectorAll('.event-card').length,
      'a[href*="/events/"]': document.querySelectorAll('a[href*="/events/"]').length,
      'div[class*="Event"]': document.querySelectorAll('div[class*="Event"]').length,
    };

    const bestCount = Math.max(...Object.values(selectorResults));

    saveMyEvents();
    sendResponse({
      success: true,
      cardsFound: bestCount,
      selectorResults: selectorResults,
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
