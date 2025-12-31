# RiftHub
## Riftbound Event Filter

A Chrome browser extension that enhances the Riftbound event browsing experience with visual filters, event categorization, and personal event tracking.

## Features

### 🎨 Visual Event Categorization
- **Color-coded borders** and badges for different event types
- **Event Types Supported:**
  - 🌙 Nexus Night (Blue)
  - ⚔️ Summoner Skirmish (Green)
  - 🎮 Riftbound Open (Orange)
  - 🏆 Regional (Purple)
  - 🥇 National (Pink)
  - 🌍 World Championship (Yellow)

### 🔍 Smart Filtering
- Filter events by type with easy checkbox controls
- Filter by price (Free/Paid events)
- Collapsible filter panel for clean browsing
- Filters persist across sessions

### 📅 My Events Tracker
- **Auto-sync** your registered events from the My Events page
- View all upcoming events in one place
- **Automatic past event filtering** - old events are automatically removed
- **Chronological sorting** - events ordered by date (earliest first)
- **Detailed event information:**
  - 📅 Date and time with timezone
  - 🏪 Store/venue name
  - 📍 Location
  - 🎯 Format (Constructed/Sealed)
  - 👥 Player count
  - 💰 Price

### 💾 Persistent Preferences
- Settings saved across browser sessions
- Default filter preferences
- Auto-hide past events option

## Installation

### From Source

1. **Download the extension files**
   ```
   Clone or download this repository
   ```

2. **Create icon files** (Required before loading)
   - Open `create-icons.html` in your browser
   - Download the 3 generated icons (16px, 48px, 128px)
   - Place them in the `icons/` folder

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder

4. **Start using!**
   - Visit [Riftbound Events](https://locator.riftbound.uvsgames.com/events)
   - Filter panel appears automatically
   - Click the extension icon to configure settings

## Usage

### Filtering Events

1. Navigate to the [Riftbound Events](https://locator.riftbound.uvsgames.com/events) page
2. The filter panel appears on the right side
3. Check/uncheck event types to filter
4. Use price filters to show only free or paid events
5. Click the ❌ to close the panel (reopen from extension popup)

### Tracking Your Events

1. Visit [My Events](https://locator.riftbound.uvsgames.com/my-events) to auto-sync
2. Open the extension popup to view your registered events
3. Past events are automatically filtered out
4. Click "🔄 Sync My Events" to manually refresh

### Keyboard Shortcuts

- `Ctrl/Cmd + S` in the popup to save preferences quickly

## Settings

Access settings by clicking the extension icon in your toolbar:

- **Default Filters** - Set filter preferences that persist
- **Auto-hide past events** - Automatically remove old events
- **Quick Actions** - Fast access to common tasks

## Privacy & Permissions

This extension:
- ✅ Only accesses `locator.riftbound.uvsgames.com`
- ✅ Stores preferences locally and synced to your Chrome profile
- ✅ No data sent to external servers
- ✅ No tracking or analytics
- ✅ Open source and transparent

### Permissions Explained

- **Storage** - Save your filter preferences and synced events
- **Host Permission** (`locator.riftbound.uvsgames.com/*`) - Required to enhance event pages and sync your registered events

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ❓ Firefox (requires Manifest V2 adaptation)

## Technical Details

### Files Structure

```
riftbound-event-filter/
├── manifest.json          # Extension configuration
├── content.js            # Events page enhancement (400 lines)
├── my-events.js          # My Events page scraper (250 lines)
├── popup.html            # Settings interface
├── popup.js              # Settings logic (290 lines)
├── styles.css            # Visual styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

### Performance

- **Minimal footprint** - <100KB total
- **Efficient DOM observers** - Only processes new content
- **No polling** - Event-driven architecture
- **Optimized regex** - Fast pattern matching
- **Cached storage** - Reduces API calls

### Memory Management

- No memory leaks - proper cleanup of observers and listeners
- Efficient event delegation
- Automatic garbage collection of old events

## Troubleshooting

### Events not showing color borders?
- Refresh the page
- Make sure you're on `locator.riftbound.uvsgames.com/events`
- Check that the extension is enabled

### My Events not syncing?
- Visit the My Events page directly
- Click "Sync My Events" button in popup
- Check browser console (F12) for any errors

### Past events still appearing?
- Click "Sync My Events" to trigger a fresh sync
- Old events are filtered on each sync
- Check your system date/time is correct

### Filter panel disappeared?
- Open extension popup
- Click "🎯 Show Filters" button

## Contributing

Contributions welcome! This is an unofficial community project.

### Development Setup

1. Clone the repository
2. Make your changes
3. Test in Chrome with "Load unpacked"
4. Submit a pull request

### Code Style

- Use ES6+ JavaScript
- Clear, descriptive variable names
- Comment complex logic
- Follow existing patterns

## Changelog

### Version 1.0.0 (Initial Release)
- Event type detection and color-coding
- Filter panel with checkboxes
- My Events tracking and syncing
- Past event filtering
- Persistent preferences
- Chrome sync support

## Known Limitations

- Only works on Riftbound event locator pages
- Relies on page structure (may break if site updates)
- Requires manual sync for My Events updates

## Disclaimer

This is an **unofficial, community-created extension** and is not affiliated with, endorsed by, or connected to Riot Games, UVS Games, or the Riftbound brand.

## License

MIT License - Free to use, modify, and distribute.

---

Made with ❤️ for the Riftbound community

**Enjoying the extension?** Star the repo and share with your local game store!
