// Riftbound Event Filter - Content Script
// Detects, categorizes, and filters events on the Riftbound locator

const EVENT_TYPES = {
  NEXUS_NIGHT: {
    name: 'Nexus Night',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    keywords: ['nexus night', 'nexus nights'],
    emoji: '🌙'
  },
  SUMMONER_SKIRMISH: {
    name: 'Summoner Skirmish',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    keywords: ['summoner skirmish'],
    emoji: '⚔️'
  },
  RIFTBOUND_OPEN: {
    name: 'Riftbound Open',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    keywords: ['riftbound', 'open play'],
    emoji: '🎮'
  },
  REGIONAL: {
    name: 'Regional',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    keywords: ['regional'],
    emoji: '🏆'
  },
  NATIONAL: {
    name: 'National',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    keywords: ['national', 'nationals'],
    emoji: '🥇'
  },
  WORLDS: {
    name: 'World Championship',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    keywords: ['world', 'worlds', 'championship'],
    emoji: '🌍'
  }
};

// State management
let filterState = {
  eventTypes: Object.keys(EVENT_TYPES).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  showFreeOnly: false,
  showPaidOnly: false
};

// Load saved preferences
chrome.storage.sync.get(['filterState'], (result) => {
  if (result.filterState) {
    filterState = { ...filterState, ...result.filterState };
    applyFilters();
  }
});

// Save preferences
function saveFilterState() {
  chrome.storage.sync.set({ filterState });
}

// Detect event type from card
function detectEventType(eventCard) {
  const titleElement = eventCard.querySelector('h3, h2, [class*="title"], [class*="heading"]');
  if (!titleElement) return null;

  const titleText = titleElement.textContent.toLowerCase().trim();

  for (const [key, config] of Object.entries(EVENT_TYPES)) {
    if (config.keywords.some(keyword => titleText.includes(keyword))) {
      return { type: key, config };
    }
  }

  return null;
}

// Detect if event is free or paid
function detectPrice(eventCard) {
  const priceText = eventCard.textContent.toLowerCase();
  const isFree = priceText.includes('free event');
  const hasPriceSymbol = /[\$€£¥₹]/.test(eventCard.textContent);

  return {
    isFree,
    isPaid: !isFree && hasPriceSymbol
  };
}

// Extract event details for tooltip
function extractEventDetails(eventCard) {
  const details = {
    title: '',
    date: '',
    time: '',
    location: '',
    store: '',
    price: '',
    format: '',
    players: ''
  };

  // Title
  const titleEl = eventCard.querySelector('h3, h2');
  if (titleEl) details.title = titleEl.textContent.trim();

  // Look for all text content and extract patterns
  const allText = eventCard.textContent;

  // Date pattern (e.g., "Dec 1, 2025")
  const dateMatch = allText.match(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/);
  if (dateMatch) details.date = dateMatch[0];

  // Time pattern (e.g., "7:30 PM")
  const timeMatch = allText.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)/);
  if (timeMatch) details.time = timeMatch[0];

  // Price
  if (allText.includes('Free Event')) {
    details.price = 'Free';
  } else {
    const priceMatch = allText.match(/[\$€£¥₹]\s*\d+(?:\.\d{2})?/);
    if (priceMatch) details.price = priceMatch[0];
  }

  // Format (Constructed/Sealed)
  if (allText.includes('Constructed')) details.format = 'Constructed';
  if (allText.includes('Sealed')) details.format = 'Sealed';

  // Players
  const playersMatch = allText.match(/(\d+)\s*Players?/);
  if (playersMatch) details.players = playersMatch[0];

  return details;
}

// Add visual enhancements to event card
function enhanceEventCard(eventCard, eventTypeData, priceData) {
  // Prevent duplicate enhancement
  if (eventCard.dataset.rbEnhanced) return;
  eventCard.dataset.rbEnhanced = 'true';

  const { type, config } = eventTypeData;
  eventCard.dataset.eventType = type;
  eventCard.dataset.isFree = priceData.isFree;
  eventCard.dataset.isPaid = priceData.isPaid;

  // Add colored border
  eventCard.style.borderLeft = `5px solid ${config.color}`;
  eventCard.style.transition = 'all 0.3s ease';

  // Create badge container
  const badgeContainer = document.createElement('div');
  badgeContainer.className = 'rb-badge-container';
  badgeContainer.style.cssText = `
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  `;

  // Event type badge
  const typeBadge = document.createElement('span');
  typeBadge.className = 'rb-type-badge';
  typeBadge.textContent = `${config.emoji} ${config.name}`;
  typeBadge.style.cssText = `
    background: ${config.color};
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    white-space: nowrap;
  `;
  badgeContainer.appendChild(typeBadge);

  // Price badge
  if (priceData.isFree) {
    const freeBadge = document.createElement('span');
    freeBadge.className = 'rb-price-badge';
    freeBadge.textContent = '💰 FREE';
    freeBadge.style.cssText = `
      background: #10b981;
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    badgeContainer.appendChild(freeBadge);
  }

  // Find the image container or card header to attach badges
  const imageContainer = eventCard.querySelector('[class*="relative"]') || eventCard.firstElementChild;
  if (imageContainer) {
    imageContainer.style.position = 'relative';
    imageContainer.appendChild(badgeContainer);
  }

  // Add background tint
  eventCard.style.background = `linear-gradient(to right, ${config.bgColor}, transparent)`;
}

// Process all event cards
function processEventCards() {
  // Find all event cards - adjust selector based on actual site structure
  const eventCards = document.querySelectorAll('[class*="rounded-xl"][class*="border"][class*="shadow"]');

  console.log(`[Riftbound Filter] Found ${eventCards.length} event cards`);

  eventCards.forEach(card => {
    const eventTypeData = detectEventType(card);
    const priceData = detectPrice(card);

    if (eventTypeData) {
      enhanceEventCard(card, eventTypeData, priceData);
    } else {
      // Mark as unknown type
      card.dataset.eventType = 'UNKNOWN';
      card.dataset.isFree = priceData.isFree;
      card.dataset.isPaid = priceData.isPaid;
    }
  });

  // Apply current filters
  applyFilters();
}

// Apply filters to visible cards
function applyFilters() {
  const eventCards = document.querySelectorAll('[data-event-type]');
  let visibleCount = 0;
  let hiddenCount = 0;

  eventCards.forEach(card => {
    const eventType = card.dataset.eventType;
    const isFree = card.dataset.isFree === 'true';
    const isPaid = card.dataset.isPaid === 'true';

    let shouldShow = true;

    // Filter by event type
    if (eventType !== 'UNKNOWN' && !filterState.eventTypes[eventType]) {
      shouldShow = false;
    }

    // Filter by price
    if (filterState.showFreeOnly && !isFree) {
      shouldShow = false;
    }
    if (filterState.showPaidOnly && !isPaid) {
      shouldShow = false;
    }

    if (shouldShow) {
      card.style.display = '';
      card.style.opacity = '1';
      visibleCount++;
    } else {
      card.style.display = 'none';
      card.style.opacity = '0';
      hiddenCount++;
    }
  });

  updateFilterStats(visibleCount, hiddenCount);
}

// Update filter statistics
function updateFilterStats(visible, hidden) {
  const statsEl = document.getElementById('rb-filter-stats');
  if (statsEl) {
    statsEl.textContent = `Showing ${visible} events (${hidden} filtered)`;
  }
}

// Create filter UI
function createFilterUI() {
  // Check if already exists
  if (document.getElementById('rb-filter-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'rb-filter-panel';
  panel.className = 'rb-filter-panel';
  panel.innerHTML = `
    <div class="rb-filter-header">
      <h3>🎮 Event Filters</h3>
      <div class="rb-header-buttons">
        <button id="rb-toggle-panel" class="rb-toggle-btn" title="Collapse panel">−</button>
        <button id="rb-close-panel" class="rb-close-btn" title="Close panel">✕</button>
      </div>
    </div>
    <div class="rb-filter-content">
      <div class="rb-filter-section">
        <h4>Event Types</h4>
        <div class="rb-filter-checkboxes" id="rb-event-type-filters"></div>
      </div>
      <div class="rb-filter-section">
        <h4>Price</h4>
        <div class="rb-filter-checkboxes">
          <label>
            <input type="checkbox" id="rb-filter-free" ${filterState.showFreeOnly ? 'checked' : ''}>
            <span>💰 Free Events Only</span>
          </label>
          <label>
            <input type="checkbox" id="rb-filter-paid" ${filterState.showPaidOnly ? 'checked' : ''}>
            <span>💵 Paid Events Only</span>
          </label>
        </div>
      </div>
      <div class="rb-filter-stats" id="rb-filter-stats">
        Showing all events
      </div>
      <button id="rb-reset-filters" class="rb-reset-btn">Reset All Filters</button>
    </div>
  `;

  // Insert at the top of the page
  const targetContainer = document.querySelector('main, body');
  if (targetContainer) {
    targetContainer.insertBefore(panel, targetContainer.firstChild);
  }

  // Add event type checkboxes
  const typeFiltersContainer = document.getElementById('rb-event-type-filters');
  Object.entries(EVENT_TYPES).forEach(([key, config]) => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" class="rb-event-type-cb" data-event-type="${key}" ${filterState.eventTypes[key] ? 'checked' : ''}>
      <span style="color: ${config.color};">${config.emoji} ${config.name}</span>
    `;
    typeFiltersContainer.appendChild(label);
  });

  // Add event listeners
  setupFilterListeners();
}

// Setup event listeners for filters
function setupFilterListeners() {
  // Event type checkboxes
  document.querySelectorAll('.rb-event-type-cb').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const eventType = e.target.dataset.eventType;
      filterState.eventTypes[eventType] = e.target.checked;
      saveFilterState();
      applyFilters();
    });
  });

  // Price filters
  document.getElementById('rb-filter-free')?.addEventListener('change', (e) => {
    filterState.showFreeOnly = e.target.checked;
    if (e.target.checked) {
      filterState.showPaidOnly = false;
      document.getElementById('rb-filter-paid').checked = false;
    }
    saveFilterState();
    applyFilters();
  });

  document.getElementById('rb-filter-paid')?.addEventListener('change', (e) => {
    filterState.showPaidOnly = e.target.checked;
    if (e.target.checked) {
      filterState.showFreeOnly = false;
      document.getElementById('rb-filter-free').checked = false;
    }
    saveFilterState();
    applyFilters();
  });

  // Reset button
  document.getElementById('rb-reset-filters')?.addEventListener('click', () => {
    filterState.eventTypes = Object.keys(EVENT_TYPES).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    filterState.showFreeOnly = false;
    filterState.showPaidOnly = false;

    document.querySelectorAll('.rb-event-type-cb').forEach(cb => cb.checked = true);
    document.getElementById('rb-filter-free').checked = false;
    document.getElementById('rb-filter-paid').checked = false;

    saveFilterState();
    applyFilters();
  });

  // Toggle panel
  document.getElementById('rb-toggle-panel')?.addEventListener('click', () => {
    const content = document.querySelector('.rb-filter-content');
    const btn = document.getElementById('rb-toggle-panel');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      btn.textContent = '−';
      btn.title = 'Collapse panel';
    } else {
      content.style.display = 'none';
      btn.textContent = '+';
      btn.title = 'Expand panel';
    }
  });

  // Close panel
  document.getElementById('rb-close-panel')?.addEventListener('click', () => {
    const panel = document.getElementById('rb-filter-panel');
    if (panel) {
      panel.style.display = 'none';
      // Save the closed state
      chrome.storage.local.set({ filterPanelClosed: true });
      console.log('[Riftbound Filter] Panel closed - use extension popup to reopen');
    }
  });
}

// Function to show the filter panel
function showFilterPanel() {
  const panel = document.getElementById('rb-filter-panel');
  if (panel) {
    panel.style.display = 'block';
    chrome.storage.local.set({ filterPanelClosed: false });
    console.log('[Riftbound Filter] Panel opened');
  } else {
    // Panel doesn't exist, create it
    createFilterUI();
  }
}

// Initialize
function init() {
  console.log('[Riftbound Filter] Extension loaded');

  // Create filter UI (check if it should be hidden)
  chrome.storage.local.get(['filterPanelClosed'], (result) => {
    createFilterUI();
    if (result.filterPanelClosed) {
      const panel = document.getElementById('rb-filter-panel');
      if (panel) panel.style.display = 'none';
    }
  });

  // Process existing cards
  processEventCards();

  // Watch for new cards (infinite scroll, etc.)
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
      }
    });
    if (shouldProcess) {
      setTimeout(processEventCards, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showFilterPanel') {
    showFilterPanel();
    sendResponse({ success: true });
  }
});

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
