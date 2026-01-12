// Riftbound API module - fetches event data from the official API
// Based on riftfound project implementation
// API endpoint: https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2/events/

const RIFTBOUND_API_BASE = 'https://api.cloudflare.riftbound.uvsgames.com/hydraproxy/api/v2';

/**
 * Geocode a location string (city, zip code, address) to lat/lng coordinates
 * Uses local US zip code database first (instant), then falls back to external APIs
 * @param {string} query - Location query (e.g., "30022", "Atlanta, GA", "Houston", "London, UK")
 * @returns {Promise<{lat: number, lng: number, displayName: string}|null>}
 */
async function geocodeLocation(query) {
  if (!query || query.trim().length < 2) return null;

  const trimmedQuery = query.trim();

  // Check if it's a US zip code (5 digits)
  const isUSZipCode = /^\d{5}$/.test(trimmedQuery);

  // For US zip codes, use local database (instant, no API call)
  if (isUSZipCode && typeof lookupZipCode === 'function') {
    const zipResult = lookupZipCode(trimmedQuery);
    if (zipResult) {
      return zipResult;
    }
  }

  // Try US Census Geocoder (works well for full addresses and city names)
  const censusResult = await geocodeWithCensus(trimmedQuery);
  if (censusResult) {
    return censusResult;
  }

  // Fall back to OpenStreetMap Nominatim for international locations or if Census failed
  const nominatimResult = await geocodeWithNominatim(trimmedQuery);
  if (nominatimResult) {
    return nominatimResult;
  }

  return null;
}

/**
 * Geocode using US Census Bureau API
 * @param {string} query - Location query
 * @returns {Promise<{lat: number, lng: number, displayName: string}|null>}
 */
async function geocodeWithCensus(query) {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    if (result && result.result && result.result.addressMatches && result.result.addressMatches.length > 0) {
      const match = result.result.addressMatches[0];
      const coords = match.coordinates;
      return {
        lat: coords.y,
        lng: coords.x,
        displayName: match.matchedAddress,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Geocode using OpenStreetMap Nominatim API (works internationally)
 * @param {string} query - Location query
 * @returns {Promise<{lat: number, lng: number, displayName: string}|null>}
 */
async function geocodeWithNominatim(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RiftHub Chrome Extension (https://github.com/j-ding/RiftHub)'
      }
    });

    if (!response.ok) {
      return null;
    }

    const results = await response.json();

    if (results && results.length > 0) {
      const match = results[0];
      return {
        lat: parseFloat(match.lat),
        lng: parseFloat(match.lon),
        displayName: match.display_name,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}


/**
 * Get location suggestions for autocomplete
 * Uses Nominatim for live suggestions, with common locations as instant fallback
 * @param {string} query - Partial location query
 * @returns {Promise<Array<{lat: number, lng: number, displayName: string, type: string}>>}
 */
async function getLocationSuggestions(query) {
  if (!query || query.trim().length < 2) return [];

  const trimmedQuery = query.trim().toLowerCase();

  // Don't search for partial zip codes (1-4 digits)
  if (/^\d{1,4}$/.test(trimmedQuery)) {
    return [];
  }

  // Common cities for instant suggestions (no API call needed)
  const commonLocations = [
    { lat: 34.0289, lng: -84.1986, displayName: 'Alpharetta, GA', type: 'city' },
    { lat: 33.7490, lng: -84.3880, displayName: 'Atlanta, GA', type: 'city' },
    { lat: 34.0522, lng: -118.2437, displayName: 'Los Angeles, CA', type: 'city' },
    { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY', type: 'city' },
    { lat: 41.8781, lng: -87.6298, displayName: 'Chicago, IL', type: 'city' },
    { lat: 29.7604, lng: -95.3698, displayName: 'Houston, TX', type: 'city' },
    { lat: 33.4484, lng: -112.0740, displayName: 'Phoenix, AZ', type: 'city' },
    { lat: 29.4241, lng: -98.4936, displayName: 'San Antonio, TX', type: 'city' },
    { lat: 32.7767, lng: -96.7970, displayName: 'Dallas, TX', type: 'city' },
    { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA', type: 'city' },
    { lat: 47.6062, lng: -122.3321, displayName: 'Seattle, WA', type: 'city' },
    { lat: 39.7392, lng: -104.9903, displayName: 'Denver, CO', type: 'city' },
    { lat: 42.3601, lng: -71.0589, displayName: 'Boston, MA', type: 'city' },
    { lat: 25.7617, lng: -80.1918, displayName: 'Miami, FL', type: 'city' },
    { lat: 33.4152, lng: -111.8315, displayName: 'Tempe, AZ', type: 'city' },
    { lat: 34.0195, lng: -84.3612, displayName: 'Marietta, GA', type: 'city' },
    { lat: 33.9519, lng: -83.3576, displayName: 'Athens, GA', type: 'city' },
    { lat: 34.0712, lng: -84.0710, displayName: 'Suwanee, GA', type: 'city' },
    { lat: 34.0234, lng: -84.1435, displayName: 'Duluth, GA', type: 'city' },
    { lat: 34.0265, lng: -84.2305, displayName: 'Roswell, GA', type: 'city' },
    { lat: 34.0126, lng: -84.0679, displayName: 'Johns Creek, GA', type: 'city' },
    // International cities
    { lat: 51.5074, lng: -0.1278, displayName: 'London, UK', type: 'city' },
    { lat: 48.8566, lng: 2.3522, displayName: 'Paris, France', type: 'city' },
    { lat: 35.6762, lng: 139.6503, displayName: 'Tokyo, Japan', type: 'city' },
    { lat: 49.2827, lng: -123.1207, displayName: 'Vancouver, Canada', type: 'city' },
    { lat: 43.6532, lng: -79.3832, displayName: 'Toronto, Canada', type: 'city' },
    { lat: -33.8688, lng: 151.2093, displayName: 'Sydney, Australia', type: 'city' },
    { lat: 52.5200, lng: 13.4050, displayName: 'Berlin, Germany', type: 'city' },
  ];

  // For 5-digit zip codes, use local database (instant lookup)
  if (/^\d{5}$/.test(trimmedQuery)) {
    if (typeof lookupZipCode === 'function') {
      const result = lookupZipCode(trimmedQuery);
      if (result) {
        return [{ lat: result.lat, lng: result.lng, displayName: result.displayName, type: 'zip code' }];
      }
    }
    return [];
  }

  // Filter common locations by query for instant results
  const matches = commonLocations.filter(loc =>
    loc.displayName.toLowerCase().includes(trimmedQuery)
  );

  return matches.slice(0, 5);
}

/**
 * Fetch events from the Riftbound API
 * Uses the correct API parameters based on riftfound implementation
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.pageSize - Results per page (default 100)
 * @param {number} options.lat - Latitude for location-based search
 * @param {number} options.lng - Longitude for location-based search
 * @param {number} options.radiusMiles - Search radius in miles (default 50)
 * @param {boolean} options.fetchAll - If true, fetches all events globally (for enrichment)
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchEvents(options = {}) {
  const page = options.page || 1;
  const pageSize = options.pageSize || options.limit || 100;

  // Date range - fetch 180 days forward from today (6 months for better matching)
  const today = new Date().toISOString();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 180);

  // Build URL with correct parameters (based on riftfound implementation)
  const params = new URLSearchParams();
  params.set('start_date_after', today);
  params.set('start_date_before', endDate.toISOString());
  params.set('display_status', 'upcoming');

  // For fetchAll mode (enrichment), use center of US with huge radius to get all events
  // Otherwise use provided coordinates or default
  let lat, lng, radiusMiles;

  if (options.fetchAll) {
    // Center of continental US (Kansas) with 3000 mile radius covers all of North America
    lat = 39.0;
    lng = -98.0;
    radiusMiles = 3000;
  } else if (options.lat !== undefined && options.lng !== undefined) {
    lat = options.lat;
    lng = options.lng;
    radiusMiles = options.radiusMiles || 50;
  } else {
    // Default: center of US with large radius
    lat = 39.0;
    lng = -98.0;
    radiusMiles = 3000;
  }

  params.set('latitude', String(lat));
  params.set('longitude', String(lng));
  params.set('num_miles', String(radiusMiles));
  params.set('upcoming_only', 'true');
  params.set('game_slug', 'riftbound');
  params.set('page', String(page));
  params.set('page_size', String(pageSize));

  const url = `${RIFTBOUND_API_BASE}/events/?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch a single event by ID
 * @param {number} eventId - The event ID
 * @returns {Promise<Object|null>} Event object or null
 */
async function fetchEventById(eventId) {
  const url = `${RIFTBOUND_API_BASE}/events/${eventId}/?game_slug=riftbound`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Transform API event to our internal format
 * @param {Object} apiEvent - Event from API
 * @returns {Object} Transformed event object
 */
function transformApiEvent(apiEvent) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let formattedDate = '';
  let formattedTime = '';

  // Parse start_datetime - it's in ISO format (UTC)
  // Convert to local time for display
  if (apiEvent.start_datetime) {
    const startDate = new Date(apiEvent.start_datetime);

    if (!isNaN(startDate.getTime())) {
      // Format date as "Jan 4, 2026" (local time)
      formattedDate = `${months[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`;

      // Format time as "2:00 PM" (local time)
      let hours = startDate.getHours();
      const minutes = startDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
  }

  // Determine event type from name (based on riftfound's inferEventCategory)
  let type = 'Other';
  let typeColor = '#64748b';
  const eventName = (apiEvent.name || '').toLowerCase();

  if (eventName.includes('summoner skirmish')) {
    type = 'Summoner Skirmish';
    typeColor = '#10b981';
  } else if (eventName.includes('nexus night')) {
    type = 'Nexus Night';
    typeColor = '#3b82f6';
  } else if (eventName.includes('prerelease') || eventName.includes('pre-release') || eventName.includes('pre-rift') || eventName.includes('release')) {
    type = 'Pre/Release';
    typeColor = '#14b8a6'; // Teal
  } else if (eventName.includes('riftbound open') || eventName.includes('open play')) {
    type = 'Riftbound Open';
    typeColor = '#f97316';
  } else if (eventName.includes('regional')) {
    type = 'Regional';
    typeColor = '#8b5cf6';
  } else if (eventName.includes('national')) {
    type = 'National';
    typeColor = '#ec4899';
  } else if (eventName.includes('world')) {
    type = 'World Championship';
    typeColor = '#eab308';
  }

  // Price formatting (based on riftfound's formatPrice)
  const priceInCents = apiEvent.cost_in_cents || 0;
  const currency = apiEvent.currency || 'USD';
  let price;
  if (priceInCents === 0) {
    price = 'Free';
  } else {
    const dollars = priceInCents / 100;
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
    price = `${symbol}${dollars.toFixed(2)}`;
  }

  // Extract store/location info
  const store = apiEvent.store || {};

  return {
    id: apiEvent.id,
    title: apiEvent.name,
    description: apiEvent.description,
    date: formattedDate,
    time: formattedTime,
    startDatetime: apiEvent.start_datetime,
    endDatetime: apiEvent.end_datetime,
    location: apiEvent.full_address || '',
    city: store.city || '',
    state: store.state || '',
    country: store.country || '',
    latitude: apiEvent.latitude,
    longitude: apiEvent.longitude,
    store: store.name || '',
    storeWebsite: store.website || '',
    storeEmail: store.email || '',
    format: apiEvent.event_format || '',
    type: type,
    typeColor: typeColor,
    eventType: apiEvent.event_type,
    price: price,
    priceInCents: priceInCents,
    currency: currency,
    capacity: apiEvent.capacity || 0,
    registered: apiEvent.registered_user_count || 0,
    imageUrl: apiEvent.full_header_image_url,
    status: 'available',
    extractedAt: new Date().toISOString(),
    source: 'api'
  };
}

/**
 * Normalize a title for matching (remove common variations)
 * @param {string} title - Event title
 * @returns {string} Normalized title
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    // Remove store name prefixes (e.g., "Level Up Games - Johns Creek: ")
    .replace(/^[^:]+:\s*/i, '')
    // Remove common prefixes/suffixes
    .replace(/^(riftbound\s+)?/i, '')
    .replace(/\s*-\s*week\s*\d+/i, '')
    .replace(/\s*#\d+/i, '')
    // Remove time-of-day prefixes (e.g., "Sunday Afternoon ")
    .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(morning|afternoon|evening|night)?\s*/i, '')
    // Remove month names at the end (e.g., "- January")
    .replace(/\s*-?\s*(january|february|march|april|may|june|july|august|september|october|november|december)$/i, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Calculate similarity score between two strings (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 1;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length < s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }

  // Word overlap score
  const words1 = s1.split(/\s+/).filter(w => w.length > 2);
  const words2 = s2.split(/\s+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  return commonWords.length / Math.max(words1.length, words2.length);
}

/**
 * Extract the core event type from a title (e.g., "Summoner Skirmish", "Nexus Night")
 * @param {string} title - Event title
 * @returns {string|null} Core event type or null
 */
function extractEventType(title) {
  if (!title) return null;
  const titleLower = title.toLowerCase();

  if (titleLower.includes('summoner skirmish')) return 'summoner skirmish';
  if (titleLower.includes('nexus night')) return 'nexus night';
  if (titleLower.includes('riftbound open')) return 'riftbound open';
  if (titleLower.includes('open play')) return 'open play';

  return null;
}

/**
 * Extract store name from a title (e.g., "Level Up Games - Johns Creek" from "Level Up Games - Johns Creek: Summoner Skirmish")
 * @param {string} title - Event title
 * @returns {string|null} Store name or null
 */
function extractStoreName(title) {
  if (!title) return null;

  // Pattern: "Store Name: Event Name" or "Store Name - Location: Event Name"
  const colonMatch = title.match(/^([^:]+):/);
  if (colonMatch) {
    return colonMatch[1].toLowerCase().trim();
  }

  return null;
}

/**
 * Find an event in API results that matches a scraped event
 * Uses fuzzy matching for titles and date comparison
 * @param {Object} scrapedEvent - Event scraped from page
 * @param {Array} apiEvents - Events from API
 * @returns {Object|null} Matching API event or null
 */
function findMatchingApiEvent(scrapedEvent, apiEvents) {
  if (!scrapedEvent.title || !apiEvents.length) return null;

  const scrapedTitle = scrapedEvent.title.toLowerCase().trim();
  const normalizedScrapedTitle = normalizeTitle(scrapedEvent.title);
  const scrapedDate = scrapedEvent.date;
  const scrapedEventType = extractEventType(scrapedEvent.title);
  const scrapedStoreName = extractStoreName(scrapedEvent.title);

  // Parse scraped date to compare day/month/year
  let scrapedDateObj = null;
  if (scrapedDate) {
    try {
      scrapedDateObj = new Date(scrapedDate);
    } catch (e) {
      // Ignore parse errors
    }
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const apiEvent of apiEvents) {
    const apiTitle = (apiEvent.name || '').toLowerCase().trim();
    const normalizedApiTitle = normalizeTitle(apiEvent.name);
    const apiEventType = extractEventType(apiEvent.name);
    const apiStoreName = apiEvent.store?.name?.toLowerCase().trim() || '';

    // Calculate title similarity
    const exactMatch = apiTitle === scrapedTitle;
    const containsMatch = apiTitle.includes(scrapedTitle) || scrapedTitle.includes(apiTitle);
    const normalizedMatch = normalizedApiTitle === normalizedScrapedTitle;
    const similarityScore = calculateSimilarity(scrapedTitle, apiTitle);

    // Check if core event types match (e.g., both are "Summoner Skirmish")
    const eventTypeMatch = scrapedEventType && apiEventType && scrapedEventType === apiEventType;

    // Check if store names match (for store-prefixed event names)
    // Also check against the scraped event's store field if available
    const scrapedStoreField = scrapedEvent.store?.toLowerCase().trim() || '';
    const storeMatch = (scrapedStoreName && apiStoreName &&
                       (apiStoreName.includes(scrapedStoreName) || scrapedStoreName.includes(apiStoreName))) ||
                       (scrapedStoreField && apiStoreName &&
                       (apiStoreName.includes(scrapedStoreField) || scrapedStoreField.includes(apiStoreName)));

    let titleScore = 0;
    if (exactMatch) titleScore = 1.0;
    else if (normalizedMatch) titleScore = 0.95;
    else if (containsMatch) titleScore = 0.85;
    else if (eventTypeMatch && storeMatch) titleScore = 0.9; // Same event type at same store - good match
    else if (eventTypeMatch && !storeMatch && (scrapedStoreName || scrapedStoreField)) {
      // Event type matches but stores DON'T match - this is likely a DIFFERENT event
      // Skip this match entirely
      continue;
    }
    else if (eventTypeMatch) titleScore = 0.6; // Same event type, no store info to compare
    else if (similarityScore > 0.6) titleScore = similarityScore * 0.7;

    if (titleScore < 0.5) continue; // Skip if titles don't match enough

    // Check date match
    let dateScore = 0.5; // Default if we can't compare dates

    if (scrapedDateObj && !isNaN(scrapedDateObj.getTime()) && apiEvent.start_datetime) {
      const apiDate = new Date(apiEvent.start_datetime);

      // Compare year, month, day (ignore time for matching purposes)
      const sameYear = scrapedDateObj.getFullYear() === apiDate.getFullYear();
      const sameMonth = scrapedDateObj.getMonth() === apiDate.getMonth();
      const sameDay = scrapedDateObj.getDate() === apiDate.getDate();

      if (sameYear && sameMonth && sameDay) {
        dateScore = 1.0;
      } else if (sameMonth && sameDay) {
        // Same month and day but different year - might be a year parsing issue
        dateScore = 0.8;
      } else {
        // Dates don't match - significantly lower score
        dateScore = 0.1;
      }
    } else if (scrapedDate && apiEvent.start_datetime) {
      // Try formatted date comparison as fallback
      const apiDate = new Date(apiEvent.start_datetime);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const apiFormattedDate = `${months[apiDate.getMonth()]} ${apiDate.getDate()}, ${apiDate.getFullYear()}`;

      if (apiFormattedDate === scrapedDate) {
        dateScore = 1.0;
      }
    }

    // Combined score - weight date more heavily when we only have event type match
    let totalScore;
    if (eventTypeMatch && titleScore < 0.85) {
      // For event type matches, date is more important
      totalScore = (titleScore * 0.4) + (dateScore * 0.6);
    } else {
      totalScore = (titleScore * 0.6) + (dateScore * 0.4);
    }

    // Boost score if store matches
    if (storeMatch) {
      totalScore = Math.min(totalScore + 0.1, 1.0);
    }

    if (totalScore > bestScore && totalScore >= 0.55) {
      bestScore = totalScore;
      bestMatch = apiEvent;
    }
  }

  return bestMatch;
}

/**
 * Enrich scraped events with API data
 * Fetches all upcoming events from the API and matches them with scraped events
 * @param {Array} scrapedEvents - Events scraped from page
 * @returns {Promise<Array>} Enriched events with full API data
 */
async function enrichEventsWithApi(scrapedEvents) {
  if (!scrapedEvents.length) return [];

  // Fetch ALL upcoming events from API (using fetchAll mode)
  const apiEvents = await fetchEvents({ fetchAll: true, pageSize: 500 });

  if (!apiEvents.length) {
    return scrapedEvents;
  }

  const enrichedEvents = scrapedEvents.map(scrapedEvent => {
    const matchingApiEvent = findMatchingApiEvent(scrapedEvent, apiEvents);

    if (matchingApiEvent) {
      const transformed = transformApiEvent(matchingApiEvent);
      transformed.status = scrapedEvent.status || 'registered';
      return transformed;
    }

    return {
      ...scrapedEvent,
      source: 'scraped'
    };
  });

  return enrichedEvents;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.RiftboundAPI = {
    fetchEvents,
    fetchEventById,
    transformApiEvent,
    enrichEventsWithApi,
    findMatchingApiEvent,
    geocodeLocation,
    getLocationSuggestions
  };
}
