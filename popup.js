// Popup script for RiftHub

// Fun loading messages for each sync stage
const SYNC_MESSAGES = {
  lookingForPage: [
    "Searching the Rift for your events...",
    "Peering into the Rift...",
    "Consulting the Chronoshift...",
    "Summoners, stand by..."
  ],
  gettingIds: [
    "Tracking event IDs across timelines...",
    "Stabilizing Riftbound timelines...",
    "Tuning into Summoner frequencies...",
    "Assembling your event roster..."
  ],
  fetchingApi: [
    "Fetching events from the Riftbound API...",
    "Syncing with Riftbound servers...",
    "Reconciling timelines...",
    "Resolving multiverse inconsistencies..."
  ],
  matching: [
    "Binding registered events to your profile...",
    "Aligning registered events...",
    "Drafting your upcoming events...",
    "Locking in..."
  ],
  almostDone: [
    "Rift stabilization nearly complete...",
    "Final checks before the match begins...",
    "Events locked in...",
    "Ready to queue..."
  ],
  complete: [
    "Your journey begins...",
    "Loading complete. GLHF!",
    "Rift stabilized!",
    "No minions were harmed in this process."
  ],
  geocoding: [
    "Pinpointing coordinates...",
    "Mapping the battlefield...",
    "Calculating spatial distortions...",
    "Triangulating location...",
    "Consulting ancient maps..."
  ],
  searching: [
    "Scouting nearby tournaments...",
    "Scanning for Riftbound activity...",
    "Summoning local events...",
    "Detecting tournament energy...",
    "Searching across dimensions..."
  ]
};

// Get a random message from a category
function getRandomMessage(category) {
  const messages = SYNC_MESSAGES[category];
  if (!messages || messages.length === 0) return '';
  return messages[Math.floor(Math.random() * messages.length)];
}

// Show/hide sync loading indicator
function showSyncLoading(show, text = 'Syncing events...', progress = '') {
  const loadingEl = document.getElementById('sync-loading');
  const containerEl = document.getElementById('my-events-container');
  const textEl = document.getElementById('sync-loading-text');
  const progressEl = document.getElementById('sync-loading-progress');
  const syncBtn = document.getElementById('sync-events-btn');

  if (show) {
    loadingEl.style.display = 'block';
    containerEl.style.display = 'none';
    textEl.textContent = text;
    progressEl.textContent = progress;
    syncBtn.disabled = true;
    syncBtn.textContent = '⏳ Syncing...';
  } else {
    loadingEl.style.display = 'none';
    containerEl.style.display = 'block';
    syncBtn.disabled = false;
    syncBtn.textContent = '🔄 Sync My Events';
  }
}

// Update sync loading progress
function updateSyncProgress(text, progress = '') {
  const textEl = document.getElementById('sync-loading-text');
  const progressEl = document.getElementById('sync-loading-progress');
  if (textEl) textEl.textContent = text;
  if (progressEl) progressEl.textContent = progress;
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Clear cache
function clearCache() {
  chrome.storage.local.clear(() => {
    showStatus('Cache cleared', 'success');
    loadMyEvents();
    initCalendar();
  });
}

// Force clear ALL data (both local and sync storage)
function forceClearAll() {
  if (confirm('This will clear ALL extension data. Continue?')) {
    Promise.all([
      new Promise(resolve => chrome.storage.local.clear(resolve)),
      new Promise(resolve => chrome.storage.sync.clear(resolve))
    ]).then(() => {
      showStatus('All data cleared!', 'success');
      // Reset UI
      loadMyEvents();
      initCalendar();

      // Clear calendar state
      calendarState.events = [];
      calendarState.registeredEvents = [];
      calendarState.searchedEvents = [];
      renderCalendar();

      // Clear search results display
      document.getElementById('search-results').innerHTML = '';
      document.getElementById('selected-day-events').style.display = 'none';
    });
  }
}

// Visit site
function visitSite() {
  chrome.tabs.create({ url: 'https://locator.riftbound.uvsgames.com/events' });
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

// Load and display My Events - uses same data as calendar for consistency
function loadMyEvents() {
  // Use the calendar's merged events, filter to only registered ones
  // This ensures we get API-upgraded data when available from search results
  const events = calendarState.events.filter(e => e.isRegistered);

  chrome.storage.local.get(['myEventsLastSync'], (result) => {
    const container = document.getElementById('my-events-container');

    if (events.length > 0) {
      // Sort events by date (earliest first)
      events.sort((a, b) => {
        try {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateA - dateB;
        } catch (error) {
          return 0;
        }
      });

      // Create HTML for events
      let html = '';
      events.forEach((event, index) => {
        const priceClass = event.price === 'Free' ? 'free' : 'paid';

        // Build capacity/registration info if available from API
        let capacityInfo = '';
        if (event.capacity && event.capacity > 0) {
          const registered = event.registered || 0;
          const spotsLeft = event.capacity - registered;
          const capacityPercent = Math.round((registered / event.capacity) * 100);
          const capacityColor = spotsLeft <= 2 ? '#ef4444' : spotsLeft <= 5 ? '#f59e0b' : '#10b981';
          capacityInfo = `<div class="event-detail-row"><span class="event-detail-icon">👥</span> ${registered}/${event.capacity} <span style="color: ${capacityColor}; font-size: 10px;">(${spotsLeft} spots left)</span></div>`;
        } else if (event.players) {
          capacityInfo = `<div class="event-detail-row"><span class="event-detail-icon">👥</span> ${event.players}</div>`;
        }

        // API source indicator
        const sourceIndicator = event.source === 'api' ? '<span style="font-size: 9px; color: #64748b; margin-left: 4px;">✨</span>' : '';

        html += `
          <div class="event-card ${priceClass}">
            <div class="event-card-header">
              <div>
                ${event.id ? `<a href="#" class="event-title-link" data-event-id="${event.id}">${event.title}${sourceIndicator}</a>` : `<div class="event-title">${event.title}${sourceIndicator}</div>`}
                <span class="event-type" style="background: ${event.typeColor}20; color: ${event.typeColor};">${event.type}</span>
              </div>
              <button class="event-sync-btn" data-event-index="${index}" title="Add to Google Calendar">
                📆
              </button>
            </div>
            <div class="event-details">
              ${event.date ? `<div class="event-detail-row"><span class="event-detail-icon">📅</span> ${event.date}</div>` : ''}
              ${event.time ? `<div class="event-detail-row"><span class="event-detail-icon">⏰</span> ${event.time}</div>` : ''}
              ${event.location ? `<div class="event-detail-row"><span class="event-detail-icon">📍</span> <a href="#" class="event-address-link" data-address="${event.location.replace(/"/g, '&quot;')}">${event.location}</a></div>` : ''}
              ${event.store ? `<div class="event-detail-row"><span class="event-detail-icon">🏪</span> ${event.store}</div>` : ''}
              ${event.format && event.format.toLowerCase() !== 'other' ? `<div class="event-detail-row"><span class="event-detail-icon">🎯</span> ${event.format}</div>` : ''}
              ${capacityInfo}
              <div class="event-detail-row"><span class="event-detail-icon">💰</span> ${event.price || 'Price TBD'}</div>
            </div>
          </div>
        `;
      });

      // Add sync info
      if (result.myEventsLastSync) {
        const syncDate = new Date(result.myEventsLastSync);
        const timeAgo = getTimeAgo(syncDate);
        html += `<div class="sync-info">Last synced: ${timeAgo}</div>`;
      }

      container.innerHTML = html;

      // Add click handlers for individual event calendar buttons
      container.querySelectorAll('.event-sync-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = parseInt(btn.dataset.eventIndex);
          const event = events[index];
          addEventToGoogleCalendar(event);
        });
      });

      // Add click handlers for event title links
      container.querySelectorAll('.event-title-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const eventId = link.dataset.eventId;
          if (eventId) {
            chrome.tabs.create({ url: `https://locator.riftbound.uvsgames.com/events/${eventId}` });
          }
        });
      });

      // Add click handlers for address links (open in Google Maps)
      container.querySelectorAll('.event-address-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const address = link.dataset.address;
          if (address) {
            chrome.tabs.create({ url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` });
          }
        });
      });
    } else {
      container.innerHTML = `
        <div class="no-events">
          <p style="margin: 0;">No registered events found</p>
          <p style="margin: 8px 0 0 0; font-size: 10px;">Visit <a href="#" id="visit-my-events-link" style="color: #3b82f6;">My Events</a> to sync</p>
        </div>
      `;

      // Re-attach event listener
      document.getElementById('visit-my-events-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        visitMyEvents();
      });
    }
  });
}

// Helper to format time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Visit My Events page
function visitMyEvents() {
  chrome.tabs.create({ url: 'https://locator.riftbound.uvsgames.com/my-events' });
}

// Fetch all events from API with pagination
async function fetchAllApiEvents() {
  const allEvents = [];
  let page = 1;
  const pageSize = 500;

  console.log('[RiftHub Popup] Fetching all upcoming events...');
  updateSyncProgress(getRandomMessage('fetchingApi'), 'Page 1');

  try {
    while (true) {
      console.log(`[RiftHub Popup] Fetching page ${page}...`);
      updateSyncProgress(getRandomMessage('fetchingApi'), `Page ${page} (${allEvents.length} events so far)`);

      const events = await window.RiftboundAPI.fetchEvents({
        fetchAll: true,
        pageSize: pageSize,
        page: page
      });

      console.log(`[RiftHub Popup] Page ${page}: fetched ${events.length} events`);

      if (!events || events.length === 0) {
        console.log('[RiftHub Popup] No events returned from API');
        break;
      }

      allEvents.push(...events);

      // If we got fewer than pageSize, we've reached the end
      if (events.length < pageSize) {
        break;
      }

      page++;

      // Safety limit
      if (page > 10) {
        console.log('[RiftHub Popup] Reached page limit');
        break;
      }
    }
  } catch (error) {
    console.error('[RiftHub Popup] Error fetching API events:', error);
  }

  console.log('[RiftHub Popup] Total events fetched:', allEvents.length);
  updateSyncProgress(getRandomMessage('matching'), `${allEvents.length} events fetched`);
  return allEvents;
}

// Enrich event IDs with full API data by fetching each event directly
async function enrichEventIdsWithApi(eventIds) {
  if (!eventIds || eventIds.length === 0) {
    console.log('[RiftHub Popup] No event IDs to enrich');
    return [];
  }

  console.log('[RiftHub Popup] Enriching event IDs:', eventIds);
  updateSyncProgress(getRandomMessage('fetchingApi'), `Fetching ${eventIds.length} events`);

  const enrichedEvents = [];
  let fetchedCount = 0;
  let notFoundCount = 0;

  // Fetch each event directly by ID (much faster than fetching all 4500+ events)
  for (const eventId of eventIds) {
    updateSyncProgress(getRandomMessage('fetchingApi'), `Fetching event ${fetchedCount + 1}/${eventIds.length}`);

    const apiEvent = await window.RiftboundAPI.fetchEventById(eventId);

    if (apiEvent) {
      const transformed = window.RiftboundAPI.transformApiEvent(apiEvent);
      transformed.isRegistered = true;
      enrichedEvents.push(transformed);
      fetchedCount++;
      console.log('[RiftHub Popup] Fetched event:', transformed.title, '(ID:', eventId, ')');
    } else {
      notFoundCount++;
      console.log('[RiftHub Popup] Event ID not found (likely past event):', eventId);
    }
  }

  console.log(`[RiftHub Popup] Fetch complete: ${fetchedCount} found, ${notFoundCount} not found`);
  updateSyncProgress(getRandomMessage('almostDone'), `Found ${fetchedCount} upcoming events`);
  return enrichedEvents;
}

// Sync events from My Events page
async function syncMyEvents() {
  showSyncLoading(true, getRandomMessage('lookingForPage'), '');

  // First, try to find an existing My Events tab
  chrome.tabs.query({ url: 'https://locator.riftbound.uvsgames.com/my-events*' }, async (tabs) => {
    if (tabs && tabs.length > 0) {
      // Found an existing My Events tab - always refresh to get latest data
      const myEventsTab = tabs[0];
      updateSyncProgress(getRandomMessage('lookingForPage'), 'Refreshing to get latest events...');

      // Force reload the tab to ensure we get fresh data
      chrome.tabs.reload(myEventsTab.id, {}, () => {
        // Wait for page to fully load and content script to extract IDs
        setTimeout(async () => {
          // Try to get fresh IDs from the content script
          chrome.tabs.sendMessage(myEventsTab.id, { action: 'getEventIds' }, async (response) => {
            if (chrome.runtime.lastError || !response || !response.success) {
              // Fall back to storage if content script failed
              await processEventIdsFromStorage();
            } else {
              await processEventIds(response.eventIds);
            }
          });
        }, 4000);
      });
    } else {
      // No My Events tab found, open one
      updateSyncProgress(getRandomMessage('lookingForPage'), 'Opening page...');
      chrome.tabs.create({ url: 'https://locator.riftbound.uvsgames.com/my-events', active: false }, () => {
        // Wait for page to load and content script to save IDs
        setTimeout(async () => {
          await processEventIdsFromStorage();
        }, 5000);
      });
    }
  });
}

// Process event IDs from storage
async function processEventIdsFromStorage() {
  console.log('[RiftHub Popup] Getting event IDs from storage...');
  updateSyncProgress(getRandomMessage('gettingIds'), '');
  chrome.storage.local.get(['myEventIds'], async (result) => {
    console.log('[RiftHub Popup] Storage result:', result);
    if (result.myEventIds && result.myEventIds.length > 0) {
      console.log('[RiftHub Popup] Found event IDs in storage:', result.myEventIds);
      await processEventIds(result.myEventIds);
    } else {
      console.log('[RiftHub Popup] No event IDs found in storage');
      showSyncLoading(false);
      showStatus('No registered events found', 'success');
      initCalendar();
    }
  });
}

// Process event IDs - enrich with API data and save
async function processEventIds(eventIds) {
  console.log('[RiftHub Popup] Processing event IDs:', eventIds);
  updateSyncProgress(getRandomMessage('fetchingApi'), `Found ${eventIds.length} events`);

  try {
    console.log('[RiftHub Popup] Calling enrichEventIdsWithApi...');
    const enrichedEvents = await enrichEventIdsWithApi(eventIds);
    console.log('[RiftHub Popup] Enriched events:', enrichedEvents);

    const pastCount = eventIds.length - enrichedEvents.length;
    console.log('[RiftHub Popup] Past count (not found in API):', pastCount);

    // Filter out past events
    const upcomingEvents = enrichedEvents.filter(e => !isEventPast(e));
    console.log('[RiftHub Popup] Upcoming events after filter:', upcomingEvents.length);

    // Save to storage
    chrome.storage.local.set({
      myEvents: upcomingEvents,
      myEventsLastSync: new Date().toISOString()
    }, () => {
      showSyncLoading(false);
      const pastInfo = pastCount > 0 ? ` (${pastCount} past)` : '';
      showStatus(`Synced ${upcomingEvents.length} upcoming events!${pastInfo}`, 'success');
      console.log('[RiftHub Popup] Saved to storage and calling initCalendar');
      initCalendar();
    });
  } catch (error) {
    console.error('[RiftHub Popup] Error enriching events:', error);
    showSyncLoading(false);
    showStatus('Error fetching event details', 'error');
  }
}

// Refresh event details - re-enrich existing events with API data
async function refreshEventDetails() {
  showStatus('Fetching full event details...', 'success');

  chrome.storage.local.get(['myEvents'], async (result) => {
    if (!result.myEvents || result.myEvents.length === 0) {
      showStatus('No events to refresh. Sync first!', 'error');
      return;
    }

    // Check if API is available
    if (typeof window.RiftboundAPI === 'undefined') {
      showStatus('API not available', 'error');
      return;
    }

    try {
      // Enrich all events with API data
      const enrichedEvents = await window.RiftboundAPI.enrichEventsWithApi(result.myEvents);

      // Count how many were enriched
      const apiEnrichedCount = enrichedEvents.filter(e => e.source === 'api').length;

      // Save enriched events back to storage
      chrome.storage.local.set({
        myEvents: enrichedEvents,
        myEventsLastSync: new Date().toISOString()
      }, () => {
        showStatus(`Updated ${apiEnrichedCount}/${enrichedEvents.length} events with full details!`, 'success');
        loadMyEvents();
        initCalendar();
      });
    } catch (error) {
      showStatus('Failed to refresh details', 'error');
    }
  });
}

// ============================================
// Mini Calendar Implementation
// ============================================

// Calendar state
let calendarState = {
  currentDate: new Date(),
  selectedDate: null,
  events: [],           // Combined events (registered + searched)
  registeredEvents: [], // Events user is registered for
  searchedEvents: []    // Events from search results
};

// Month names
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get event type class for dot color
function getEventDotClass(type) {
  if (!type) return '';
  const typeLower = type.toLowerCase();
  if (typeLower.includes('nexus')) return 'nexus-night';
  if (typeLower.includes('skirmish')) return 'summoner-skirmish';
  if (typeLower.includes('pre-release') || typeLower.includes('prerelease') || typeLower.includes('pre release')) return 'pre-release';
  if (typeLower.includes('open') || typeLower.includes('riftbound')) return 'riftbound-open';
  return '';
}

// Parse event date to Date object
function parseEventDate(event) {
  if (!event.date) return null;
  try {
    const dateStr = event.time ? `${event.date} ${event.time}` : `${event.date} 12:00 PM`;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    return null;
  }
}

// Get events for a specific day
function getEventsForDay(year, month, day) {
  return calendarState.events.filter(event => {
    const eventDate = parseEventDate(event);
    if (!eventDate) return false;
    return eventDate.getFullYear() === year &&
           eventDate.getMonth() === month &&
           eventDate.getDate() === day;
  });
}

// Render the calendar
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthYearDisplay = document.getElementById('cal-month-year');

  const year = calendarState.currentDate.getFullYear();
  const month = calendarState.currentDate.getMonth();

  // Update month/year display
  monthYearDisplay.textContent = `${MONTH_NAMES[month]} ${year}`;

  // Clear existing day cells (keep headers)
  const headers = grid.querySelectorAll('.calendar-day-header');
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Today's date for highlighting
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Render previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dayEl = createDayElement(day, year, month - 1, true);
    grid.appendChild(dayEl);
  }

  // Render current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && today.getDate() === day;
    const dayEvents = getEventsForDay(year, month, day);
    const isSelected = calendarState.selectedDate &&
                       calendarState.selectedDate.getFullYear() === year &&
                       calendarState.selectedDate.getMonth() === month &&
                       calendarState.selectedDate.getDate() === day;

    const dayEl = createDayElement(day, year, month, false, isToday, dayEvents, isSelected);
    grid.appendChild(dayEl);
  }

  // Render next month's leading days to fill the grid
  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  for (let day = 1; day <= remainingCells; day++) {
    const dayEl = createDayElement(day, year, month + 1, true);
    grid.appendChild(dayEl);
  }
}

// Create a day element
function createDayElement(day, year, month, isOtherMonth, isToday = false, events = [], isSelected = false) {
  const dayEl = document.createElement('div');
  dayEl.className = 'calendar-day';
  dayEl.textContent = day;

  if (isOtherMonth) {
    dayEl.classList.add('other-month');
  } else {
    if (isToday) dayEl.classList.add('today');
    if (events.length > 0) dayEl.classList.add('has-event');
    if (isSelected) dayEl.classList.add('selected');

    // Add event dots if there are events
    if (events.length > 0) {
      const dotContainer = document.createElement('div');
      dotContainer.style.cssText = 'position: absolute; bottom: 2px; display: flex; gap: 1px; justify-content: center;';

      // Check if we have both registered and searched events
      const hasRegistered = events.some(e => e.isRegistered);
      const hasSearched = events.some(e => !e.isRegistered);

      if (hasRegistered) {
        const regDot = document.createElement('div');
        regDot.className = 'event-dot';
        regDot.style.cssText = 'position: static; background: #10b981;'; // Green for registered
        dotContainer.appendChild(regDot);
      }

      if (hasSearched) {
        const searchDot = document.createElement('div');
        searchDot.className = 'event-dot';
        searchDot.style.cssText = 'position: static; background: #3b82f6;'; // Blue for searched
        dotContainer.appendChild(searchDot);
      }

      dayEl.appendChild(dotContainer);
    }

    // Click handler
    dayEl.addEventListener('click', () => {
      calendarState.selectedDate = new Date(year, month, day);
      renderCalendar();
      showSelectedDayEvents(year, month, day);
    });
  }

  return dayEl;
}

// Show events for selected day
function showSelectedDayEvents(year, month, day) {
  const container = document.getElementById('selected-day-events');
  const title = document.getElementById('selected-day-title');
  const content = document.getElementById('selected-day-content');

  const events = getEventsForDay(year, month, day);
  const dateStr = `${MONTH_NAMES[month].substring(0, 3)} ${day}`;

  if (events.length === 0) {
    title.textContent = `Events on ${dateStr}`;
    content.innerHTML = '<div class="no-events-day">No events on this day</div>';
  } else {
    const registeredCount = events.filter(e => e.isRegistered).length;
    const searchedCount = events.filter(e => !e.isRegistered).length;

    let titleText = `${events.length} event${events.length > 1 ? 's' : ''} on ${dateStr}`;
    if (registeredCount > 0 && searchedCount > 0) {
      titleText += ` (${registeredCount} registered)`;
    }
    title.textContent = titleText;

    let html = '';
    events.forEach((event, index) => {
      const priceClass = event.price === 'Free' ? 'free' : 'paid';
      const isRegistered = event.isRegistered;

      // Build capacity info for calendar view
      let capacityLine = '';
      if (event.capacity && event.capacity > 0) {
        const registered = event.registered || 0;
        const spotsLeft = event.capacity - registered;
        const capacityColor = spotsLeft <= 2 ? '#ef4444' : spotsLeft <= 5 ? '#f59e0b' : '#10b981';
        capacityLine = `<div style="margin-top: 2px;"><span style="color: ${capacityColor};">👥 ${registered}/${event.capacity}</span></div>`;
      }

      // Status badge
      const statusBadge = isRegistered
        ? '<span style="background: #10b981; color: white; font-size: 8px; padding: 1px 4px; border-radius: 3px; margin-left: 4px;">✓ Registered</span>'
        : '<span style="background: #3b82f6; color: white; font-size: 8px; padding: 1px 4px; border-radius: 3px; margin-left: 4px;">📍 Nearby</span>';

      // Register button for non-registered events
      const registerButton = !isRegistered && event.id
        ? `<button class="register-btn" data-event-id="${event.id}" style="margin-top: 6px; padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; width: 100%;">📝 Register for Event</button>`
        : '';

      html += `
        <div class="event-card ${priceClass}" style="margin-bottom: 6px; padding: 8px; ${!isRegistered ? 'border-left-color: #3b82f6;' : ''}">
          <div class="event-title" style="font-size: 11px;">${event.title}${statusBadge}</div>
          <div class="event-details" style="font-size: 10px;">
            ${event.time ? `<div style="margin-bottom: 2px;">⏰ ${event.time}</div>` : ''}
            ${event.store ? `<div>🏪 ${event.store}</div>` : ''}
            ${event.location ? `<div>📍 ${event.location}</div>` : ''}
            ${event.format && event.format.toLowerCase() !== 'other' ? `<div>🎯 ${event.format}</div>` : ''}
            ${capacityLine}
            <div>💰 ${event.price || 'Price TBD'}</div>
          </div>
          ${registerButton}
        </div>
      `;
    });
    content.innerHTML = html;

    // Add click handlers for register buttons
    content.querySelectorAll('.register-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.target.dataset.eventId;
        if (eventId) {
          const eventUrl = `https://locator.riftbound.uvsgames.com/events/${eventId}`;
          chrome.tabs.create({ url: eventUrl });
        }
      });
    });
  }

  container.style.display = 'block';
}

// Navigate to previous month
function prevMonth() {
  calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() - 1);
  renderCalendar();
}

// Navigate to next month
function nextMonth() {
  calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + 1);
  renderCalendar();
}

// Load events and initialize calendar
function initCalendar() {
  chrome.storage.local.get(['myEvents', 'searchedEvents'], (result) => {
    // Load registered events (now always from API via my-events.js)
    if (result.myEvents && result.myEvents.length > 0) {
      calendarState.registeredEvents = result.myEvents.filter(event => !isEventPast(event));
    } else {
      calendarState.registeredEvents = [];
    }

    // Load searched events
    if (result.searchedEvents && result.searchedEvents.length > 0) {
      calendarState.searchedEvents = result.searchedEvents.filter(event => !isEventPast(event));
    } else {
      calendarState.searchedEvents = [];
    }

    // Merge events for calendar display
    mergeCalendarEvents();
    renderCalendar();

    // Now load My Events display using the calendar's data
    loadMyEvents();
  });
}

// Merge registered and searched events, upgrading registered events with API data
function mergeCalendarEvents() {
  const eventMap = new Map();

  // First, index searched events by title+date for quick lookup
  const searchedByKey = new Map();
  calendarState.searchedEvents.forEach(event => {
    const key = `${event.title}-${event.date}`;
    searchedByKey.set(key, event);
  });

  // Add registered events, but upgrade with API data if available
  // Also update calendarState.registeredEvents with upgraded data for My Events display
  const upgradedRegisteredEvents = [];

  calendarState.registeredEvents.forEach(event => {
    const key = `${event.title}-${event.date}`;
    const searchedMatch = searchedByKey.get(key);

    if (searchedMatch && searchedMatch.source === 'api') {
      // Use the API data but mark as registered
      const upgradedEvent = { ...searchedMatch, isRegistered: true };
      eventMap.set(key, upgradedEvent);
      upgradedRegisteredEvents.push(upgradedEvent);

      // Also update storage with API data
      upgradeRegisteredEventWithApiData(event, searchedMatch);
    } else {
      event.isRegistered = true;
      eventMap.set(key, event);
      upgradedRegisteredEvents.push(event);
    }
  });

  // Update registeredEvents with upgraded data so loadMyEvents uses it
  calendarState.registeredEvents = upgradedRegisteredEvents;

  // Add remaining searched events that aren't registered
  calendarState.searchedEvents.forEach(event => {
    const key = `${event.title}-${event.date}`;
    if (!eventMap.has(key)) {
      event.isRegistered = false;
      eventMap.set(key, event);
    }
  });

  calendarState.events = Array.from(eventMap.values());
}

// Upgrade a registered event in storage with API data
function upgradeRegisteredEventWithApiData(registeredEvent, apiEvent) {
  chrome.storage.local.get(['myEvents'], (result) => {
    if (!result.myEvents) return;

    const updatedEvents = result.myEvents.map(event => {
      // Find matching event by title and date
      if (event.title === registeredEvent.title && event.date === registeredEvent.date) {
        // Merge API data into the event, keeping registered status
        return {
          ...apiEvent,
          status: 'registered',
          isRegistered: true
        };
      }
      return event;
    });

    // Save updated events
    chrome.storage.local.set({ myEvents: updatedEvents }, () => {
      // Reload My Events display to show updated data
      loadMyEvents();
    });
  });
}

// Add searched events to calendar
function addSearchedEventsToCalendar(events) {
  calendarState.searchedEvents = events;

  // Save to storage for persistence
  chrome.storage.local.set({ searchedEvents: events });

  // Merge and re-render
  mergeCalendarEvents();
  renderCalendar();

  // Navigate to the month of the first event if available
  if (events.length > 0) {
    const firstEvent = events[0];
    const eventDate = parseEventDate(firstEvent);
    if (eventDate) {
      calendarState.currentDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
      renderCalendar();
    }
  }
}

// Calendar event listeners
document.getElementById('cal-prev').addEventListener('click', prevMonth);
document.getElementById('cal-next').addEventListener('click', nextMonth);

// ============================================
// Event Search Implementation
// ============================================

// Search state
let searchState = {
  selectedType: 'all',
  isLoading: false,
  lastSearchLocation: ''
};

// Get event type class from title
function getSearchResultClass(title) {
  if (!title) return '';
  const titleLower = title.toLowerCase();
  if (titleLower.includes('nexus')) return 'nexus-night';
  if (titleLower.includes('skirmish')) return 'summoner-skirmish';
  if (titleLower.includes('pre-release') || titleLower.includes('prerelease') || titleLower.includes('pre release')) return 'pre-release';
  if (titleLower.includes('open') || titleLower.includes('riftbound')) return 'riftbound-open';
  return '';
}

// Search for events using the API and display in calendar
async function searchEvents() {
  const location = document.getElementById('search-location').value;
  const distance = document.getElementById('search-distance').value;
  const resultsContainer = document.getElementById('search-results');

  if (!location.trim()) {
    showStatus('Please enter a location', 'error');
    return;
  }

  // Save the search location for next time
  saveSearchLocation(location);
  searchState.lastSearchLocation = location;

  // Show loading state
  searchState.isLoading = true;
  resultsContainer.innerHTML = `
    <div class="search-loading" style="margin-top: 12px;">
      <span class="spinner"></span> ${getRandomMessage('geocoding')}
    </div>
  `;

  try {
    // Check if API is available
    if (typeof window.RiftboundAPI === 'undefined') {
      throw new Error('API not available');
    }

    // Step 1: Get lat/lng coordinates
    // Use pre-selected location from autocomplete if available, otherwise geocode
    let geoResult;

    if (autocompleteState.selectedLocation &&
        autocompleteState.selectedLocation.displayName === location) {
      geoResult = autocompleteState.selectedLocation;
    } else {
      geoResult = await window.RiftboundAPI.geocodeLocation(location);
    }

    if (!geoResult) {
      resultsContainer.innerHTML = `
        <div class="search-empty" style="margin-top: 12px;">
          <p style="color: #f59e0b;">⚠️ Location not found</p>
          <p style="margin-top: 8px; font-size: 10px; color: #64748b;">
            Could not find "${location}".<br>
            Try a different format:<br>
            • City name (e.g., "Atlanta")<br>
            • City, State (e.g., "Johns Creek, GA")<br>
            • ZIP code (e.g., "30022")
          </p>
        </div>
      `;
      return;
    }

    // Update loading message
    resultsContainer.innerHTML = `
      <div class="search-loading" style="margin-top: 12px;">
        <span class="spinner"></span> ${getRandomMessage('searching')}
      </div>
    `;

    // Step 2: Fetch events from API using lat/lng and distance
    const radiusMiles = parseInt(distance) || 50;
    const apiEvents = await window.RiftboundAPI.fetchEvents({
      lat: geoResult.lat,
      lng: geoResult.lng,
      radiusMiles: radiusMiles,
      pageSize: 200
    });

    if (!apiEvents || apiEvents.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-empty" style="margin-top: 12px;">
          <p style="color: #f59e0b;">⚠️ No events found</p>
          <p style="margin-top: 8px; font-size: 10px; color: #64748b;">
            No events within ${radiusMiles} miles of<br>
            "${geoResult.displayName.split(',').slice(0, 2).join(',')}"<br><br>
            Try increasing the distance or searching a different area.
          </p>
        </div>
      `;
      return;
    }

    // Transform API events to our format
    let transformedEvents = apiEvents.map(e => window.RiftboundAPI.transformApiEvent(e));

    // Filter out past events (only show today and future)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    transformedEvents = transformedEvents.filter(event => {
      if (event.startDatetime) {
        const eventDate = new Date(event.startDatetime);
        return eventDate >= now;
      }
      // Fallback to parsing the formatted date
      return !isEventPast(event);
    });

    // Filter by event type if selected
    if (searchState.selectedType !== 'all') {
      transformedEvents = transformedEvents.filter(event => {
        const typeLower = (event.type || '').toLowerCase();
        const titleLower = (event.title || '').toLowerCase();

        switch (searchState.selectedType) {
          case 'nexus':
            return typeLower.includes('nexus') || titleLower.includes('nexus');
          case 'skirmish':
            return typeLower.includes('skirmish') || titleLower.includes('skirmish');
          case 'prerelease':
            return typeLower.includes('pre-release') || typeLower.includes('prerelease') || typeLower.includes('pre release') ||
                   titleLower.includes('pre-release') || titleLower.includes('prerelease') || titleLower.includes('pre release');
          case 'open':
            // Exclude pre-release events from "open" category
            const isPreRelease = typeLower.includes('pre-release') || typeLower.includes('prerelease') || typeLower.includes('pre release') ||
                                titleLower.includes('pre-release') || titleLower.includes('prerelease') || titleLower.includes('pre release');
            return !isPreRelease && (typeLower.includes('open') || titleLower.includes('open'));
          case 'free':
            return event.price === 'Free' || event.priceInCents === 0;
          default:
            return true;
        }
      });
    }

    // Add events to calendar
    addSearchedEventsToCalendar(transformedEvents);

    // Show success message
    const typeLabel = searchState.selectedType === 'all' ? '' :
                      searchState.selectedType === 'nexus' ? 'Nexus Night ' :
                      searchState.selectedType === 'skirmish' ? 'Summoner Skirmish ' :
                      searchState.selectedType === 'prerelease' ? 'Pre-Release ' :
                      searchState.selectedType === 'open' ? 'Open Play ' :
                      searchState.selectedType === 'free' ? 'Free ' : '';

    // Get a short location name for display
    const shortLocation = geoResult.displayName.split(',').slice(0, 2).join(',');

    resultsContainer.innerHTML = `
      <div class="search-empty" style="margin-top: 12px;">
        <p style="color: #10b981;">
          ✅ Found ${transformedEvents.length} ${typeLabel}events
        </p>
        <p style="margin-top: 8px; font-size: 10px;">
          📍 Within ${radiusMiles} miles of ${shortLocation}<br>
          📅 Added to calendar below
        </p>
        <p style="margin-top: 8px; font-size: 9px; color: #64748b;">
          Click on a date to see events.<br>
          Click an event to register!
        </p>
        <button class="quick-btn" id="clear-search-btn" style="margin-top: 8px; font-size: 10px;">
          🗑️ Clear Search Results
        </button>
      </div>
    `;

    // Add clear button handler
    document.getElementById('clear-search-btn')?.addEventListener('click', clearSearchResults);

  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="search-empty" style="margin-top: 12px;">
        <p style="color: #ef4444;">❌ Search failed</p>
        <p style="margin-top: 8px; font-size: 10px; color: #64748b;">
          ${error.message || 'Unable to fetch events. Try again later.'}
        </p>
      </div>
    `;
  } finally {
    searchState.isLoading = false;
  }
}

// Clear search results from calendar
function clearSearchResults() {
  calendarState.searchedEvents = [];
  chrome.storage.local.remove(['searchedEvents']);
  mergeCalendarEvents();
  renderCalendar();

  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';
  showStatus('Search results cleared', 'success');
}

// Filter chip click handler
function handleFilterChipClick(e) {
  const chip = e.target;
  if (!chip.classList.contains('filter-chip')) return;

  // Remove active from all chips
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

  // Add active to clicked chip
  chip.classList.add('active');

  // Update state
  searchState.selectedType = chip.dataset.type;
}

// Quick search by event type (opens filtered page)
function quickSearchByType(type) {
  const baseUrl = 'https://locator.riftbound.uvsgames.com/events';
  let url = baseUrl;

  // The Riftbound site filters by event type in the URL or via the page filters
  // For now, we'll open the events page - users can use the on-page filter panel
  chrome.tabs.create({ url });

  showStatus(`Opened events page - use filters to find ${type} events`, 'success');
}

// Open event sign-up page
function openEventSignup(eventUrl) {
  if (eventUrl) {
    chrome.tabs.create({ url: eventUrl });
  }
}

// Initialize search listeners
function initSearch() {
  // Search button
  document.getElementById('search-btn').addEventListener('click', searchEvents);

  // Enter key in search input
  document.getElementById('search-location').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchEvents();
    }
  });

  // Filter chips
  document.querySelector('.search-filters').addEventListener('click', handleFilterChipClick);

  // Load saved search location
  chrome.storage.local.get(['lastSearchLocation'], (result) => {
    if (result.lastSearchLocation) {
      document.getElementById('search-location').value = result.lastSearchLocation;
    }
  });
}

// Save search location when searching
function saveSearchLocation(location) {
  if (location && location.trim()) {
    chrome.storage.local.set({ lastSearchLocation: location.trim() });
  }
}

// ============================================
// Location Autocomplete Implementation
// ============================================

let autocompleteState = {
  suggestions: [],
  selectedIndex: -1,
  debounceTimer: null,
  hideTimer: null, // Timer for auto-hiding "no results" message
  selectedLocation: null // Store the selected lat/lng
};

// Show location suggestions dropdown
function showSuggestions(suggestions) {
  const container = document.getElementById('location-suggestions');
  autocompleteState.suggestions = suggestions;
  autocompleteState.selectedIndex = -1;

  // Clear any pending hide timer from previous "no results" message
  if (autocompleteState.hideTimer) {
    clearTimeout(autocompleteState.hideTimer);
    autocompleteState.hideTimer = null;
  }

  if (suggestions.length === 0) {
    // Show "no results" message
    container.innerHTML = '<div class="suggestion-loading">No locations found. Try a different search.</div>';
    container.classList.add('show');
    autocompleteState.hideTimer = setTimeout(() => hideSuggestions(), 2000);
    return;
  }

  let html = '';
  suggestions.forEach((suggestion, index) => {
    html += `
      <div class="suggestion-item" data-index="${index}">
        <span class="suggestion-name">${suggestion.displayName}</span>
        <span class="suggestion-type">${suggestion.type}</span>
      </div>
    `;
  });

  container.innerHTML = html;
  container.classList.add('show');

  // Add click handlers to suggestions
  container.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      selectSuggestion(index);
    });
  });
}

// Hide suggestions dropdown
function hideSuggestions() {
  const container = document.getElementById('location-suggestions');
  container.classList.remove('show');
  autocompleteState.selectedIndex = -1;

  // Clear any pending hide timer
  if (autocompleteState.hideTimer) {
    clearTimeout(autocompleteState.hideTimer);
    autocompleteState.hideTimer = null;
  }
}

// Select a suggestion
function selectSuggestion(index) {
  const suggestion = autocompleteState.suggestions[index];
  if (!suggestion) return;

  const input = document.getElementById('search-location');
  input.value = suggestion.displayName;

  // Store the selected location's coordinates
  autocompleteState.selectedLocation = {
    lat: suggestion.lat,
    lng: suggestion.lng,
    displayName: suggestion.displayName
  };

  hideSuggestions();
}

// Handle keyboard navigation in suggestions
function handleSuggestionKeydown(e) {
  const container = document.getElementById('location-suggestions');
  if (!container.classList.contains('show')) return;

  const items = container.querySelectorAll('.suggestion-item');
  if (items.length === 0) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      autocompleteState.selectedIndex = Math.min(
        autocompleteState.selectedIndex + 1,
        items.length - 1
      );
      updateSelectedSuggestion(items);
      break;

    case 'ArrowUp':
      e.preventDefault();
      autocompleteState.selectedIndex = Math.max(
        autocompleteState.selectedIndex - 1,
        0
      );
      updateSelectedSuggestion(items);
      break;

    case 'Enter':
      if (autocompleteState.selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(autocompleteState.selectedIndex);
      }
      break;

    case 'Escape':
      hideSuggestions();
      break;
  }
}

// Update the visual selection in dropdown
function updateSelectedSuggestion(items) {
  items.forEach((item, index) => {
    if (index === autocompleteState.selectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

// Fetch suggestions with debounce
function fetchSuggestionsDebounced(query) {
  // Clear any pending request
  if (autocompleteState.debounceTimer) {
    clearTimeout(autocompleteState.debounceTimer);
  }

  // Clear any pending hide timer from "no results" message
  if (autocompleteState.hideTimer) {
    clearTimeout(autocompleteState.hideTimer);
    autocompleteState.hideTimer = null;
  }

  // Clear selected location when user types
  autocompleteState.selectedLocation = null;

  // Wait 300ms before fetching
  autocompleteState.debounceTimer = setTimeout(async () => {
    if (!query || query.trim().length < 2) {
      hideSuggestions();
      return;
    }

    // Show loading state
    const container = document.getElementById('location-suggestions');
    container.innerHTML = '<div class="suggestion-loading">Searching...</div>';
    container.classList.add('show');

    try {
      if (typeof window.RiftboundAPI !== 'undefined' && window.RiftboundAPI.getLocationSuggestions) {
        const suggestions = await window.RiftboundAPI.getLocationSuggestions(query);
        showSuggestions(suggestions);
      } else {
        hideSuggestions();
      }
    } catch (error) {
      hideSuggestions();
    }
  }, 300);
}

// Initialize autocomplete
function initAutocomplete() {
  const input = document.getElementById('search-location');
  const container = document.getElementById('location-suggestions');

  // Input handler - fetch suggestions as user types
  input.addEventListener('input', (e) => {
    fetchSuggestionsDebounced(e.target.value);
  });

  // Keyboard navigation
  input.addEventListener('keydown', handleSuggestionKeydown);

  // Hide suggestions when clicking outside
  document.addEventListener('mousedown', (e) => {
    // Check if click is outside the input wrapper
    if (!e.target.closest('.location-input-wrapper')) {
      hideSuggestions();
    }
  });

  // Prevent blur from hiding suggestions when clicking on them
  container.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevents input blur
  });

  // Show suggestions again when focusing on input with value
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && autocompleteState.suggestions.length > 0) {
      container.classList.add('show');
    }
  });
}

// ============================================
// Google Calendar - Add to Calendar Links
// ============================================

// Parse event date and time into a Date object
function parseEventDateTime(event) {
  try {
    // Parse date like "Jan 4, 2026" or "Feb 6, 2026"
    const dateStr = event.date;

    // Extract time, removing timezone info like "(EST)"
    let timeStr = event.time || '12:00 PM';
    timeStr = timeStr.replace(/\s*\([A-Z]{2,4}\)\s*/gi, '').trim();

    // Combine date and time
    const dateTimeStr = `${dateStr} ${timeStr}`;
    const dateObj = new Date(dateTimeStr);

    if (isNaN(dateObj.getTime())) {
      return null;
    }

    return dateObj;
  } catch (error) {
    return null;
  }
}

// Format date for Google Calendar URL (YYYYMMDDTHHmmss)
function formatDateForGoogleCalendar(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

// Generate Google Calendar "Add Event" URL
function generateGoogleCalendarUrl(event) {
  const startDate = parseEventDateTime(event);
  if (!startDate) {
    return null;
  }

  // End date is 2 hours after start
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  // Build description
  const descriptionParts = [];
  if (event.type) descriptionParts.push(`Type: ${event.type}`);
  if (event.format) descriptionParts.push(`Format: ${event.format}`);
  if (event.price) descriptionParts.push(`Price: ${event.price}`);
  if (event.store) descriptionParts.push(`Store: ${event.store}`);
  if (event.players) descriptionParts.push(`Players: ${event.players}`);
  descriptionParts.push('', 'Added via RiftHub');

  // Build URL parameters
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateForGoogleCalendar(startDate)}/${formatDateForGoogleCalendar(endDate)}`,
    details: descriptionParts.join('\n'),
    location: event.store || event.location || ''
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Open Google Calendar to add a single event
function addEventToGoogleCalendar(event) {
  const url = generateGoogleCalendarUrl(event);
  if (url) {
    chrome.tabs.create({ url });
    showStatus(`Opening Google Calendar for "${event.title}"`, 'success');
  } else {
    showStatus('Could not parse event date/time', 'error');
  }
}

// Open Google Calendar to add all events (opens multiple tabs)
function addAllEventsToGoogleCalendar() {
  chrome.storage.local.get(['myEvents'], (result) => {
    const events = result.myEvents || [];

    if (events.length === 0) {
      showStatus('No events to add to calendar', 'error');
      return;
    }

    // Confirm if adding multiple events
    if (events.length > 1) {
      if (!confirm(`This will open ${events.length} Google Calendar tabs. Continue?`)) {
        return;
      }
    }

    let added = 0;
    let failed = 0;

    events.forEach(event => {
      const url = generateGoogleCalendarUrl(event);
      if (url) {
        chrome.tabs.create({ url, active: false });
        added++;
      } else {
        failed++;
      }
    });

    if (failed > 0) {
      showStatus(`Opened ${added} calendar tabs, ${failed} failed`, 'error');
    } else {
      showStatus(`Opened ${added} Google Calendar tab${added > 1 ? 's' : ''}`, 'success');
    }
  });
}

// ============================================
// Event Listeners
// ============================================

document.getElementById('clear-cache').addEventListener('click', clearCache);
document.getElementById('force-clear').addEventListener('click', forceClearAll);
document.getElementById('visit-site').addEventListener('click', visitSite);
document.getElementById('visit-my-events-btn').addEventListener('click', visitMyEvents);
document.getElementById('sync-google-calendar').addEventListener('click', addAllEventsToGoogleCalendar);
document.getElementById('visit-my-events')?.addEventListener('click', (e) => {
  e.preventDefault();
  visitMyEvents();
});
document.getElementById('sync-events-btn').addEventListener('click', syncMyEvents);

// Initialize
initCalendar(); // This will call loadMyEvents() after loading data
initSearch();
initAutocomplete();
