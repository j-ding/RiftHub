# RiftHub

🎴 **Your Riftbound Event Companion!** Tired of manually tracking your registered Riftbound tournaments and searching for nearby events? This extension puts all your event information in one beautiful popup with a mini calendar view.

## What's New in v1.0.1

- **International location search** - Search for events worldwide, not just US!
- **Clickable addresses** - Tap any event address to open in Google Maps
- **Faster sync** - Events load individually instead of fetching thousands
- **All US zip codes now supported**

## Key Features

- **Event Search** - Find tournaments near any US or international location
- **Mini Calendar** - Visual overview of all upcoming events with color-coded dots
- **My Events Sync** - Automatically imports your registered events from the Riftbound locator
- **Full Event Details** - Store name, clickable address (opens Google Maps), capacity, price, and registration count
- **Event Type Badges** - Color-coded for Summoner Skirmish, Nexus Night, Riftbound Open, and more
- **Registration Status** - See how many spots are filled (e.g., "28/32 registered")
- **Smart Filtering** - Past events automatically hidden
- **Dark Theme** - Sleek design that matches the Riftbound aesthetic

## What It Displays

- All your registered upcoming events sorted by date
- Nearby tournaments within customizable radius (25-250 miles)
- Event capacity and current registration count
- Entry fee (Free or price displayed)
- Store name and full address
- Event format and type
- Click any calendar date to see that day's events

## Search Features

- US & International location support
- Location autocomplete suggestions
- Adjustable search radius
- Results sorted by distance
- Direct links to register on official site

## Privacy & Security

- All data stored locally in your browser
- Only communicates with official Riftbound APIs and OpenStreetMap for geocoding
- No tracking or ads
- No account required

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full details.

## Perfect For

- Tracking multiple tournament registrations
- Finding new events near you
- Planning your tournament schedule
- Quick access to event details without navigating the locator site
- Seeing your upcoming events at a glance

## How It Works

1. Install the extension
2. Click "Sync My Events" while logged into the Riftbound locator
3. Use the search to find nearby tournaments
4. View everything in the mini calendar
5. Click any date to see event details!

## Calendar View

- Current month displayed with navigation arrows
- Dots indicate days with events
- Different colors for registered vs nearby events
- Click any day to see full event details
- Registered events highlighted

## Quick Actions

- **Visit Events** - Jump to the Riftbound locator
- **My Events** - Open your registrations page
- **Sync with Google Calendar** - Add events to your calendar
- **Clear Cache** - Reset stored event data
- **Force Clear All** - Complete data reset

## Installation

### From Chrome Web Store
*(Coming soon)*

### From Firefox Add-ons
*(Coming soon)*

### From Source (Chrome)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder

### From Source (Firefox)

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file in the extension folder
5. The extension will be loaded (note: temporary add-ons are removed when Firefox closes)

**For permanent Firefox installation:**
1. Zip the extension files (manifest.json, popup.html, popup.js, etc.)
2. Rename the `.zip` to `.xpi`
3. Open `about:addons` in Firefox
4. Click the gear icon and select "Install Add-on From File..."
5. Select the `.xpi` file

**Note:** Firefox requires extensions to be signed for permanent installation in release versions. For development, use Firefox Developer Edition or Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.

## Files

```
RiftHub/
├── manifest.json      # Extension configuration
├── popup.html         # Main popup interface
├── popup.js           # Popup logic
├── my-events.js       # My Events page sync
├── riftbound-api.js   # API communication
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md          # This file
└── PRIVACY_POLICY.md  # Privacy policy
```

## Troubleshooting

### Events not syncing?
- Make sure you're logged into the Riftbound locator
- Visit the My Events page directly
- Click "Sync My Events" button in popup

### Search not working?
- Try a different location format (city name, zip code)
- Check your internet connection

## Disclaimer

This is an **unofficial, community-created extension** and is not affiliated with, endorsed by, or connected to Upper Deck, UVS Games, or the Riftbound brand. The extension extracts event information from the official Riftbound API.

## License

MIT License - Free to use, modify, and distribute.

---

Made with ❤️ for the Riftbound community
