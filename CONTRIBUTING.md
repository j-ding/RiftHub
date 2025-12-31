# Contributing to Riftbound Event Filter

Thank you for your interest in contributing! This is a community project and we welcome contributions of all kinds.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser version and OS

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature has already been requested
- Clearly describe the feature and its use case
- Explain why it would be valuable to users

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test thoroughly
4. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of your changes"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**

## Code Style Guidelines

### JavaScript
- Use ES6+ features (const/let, arrow functions, template literals)
- Use descriptive variable names (`eventCard` not `ec`)
- Add JSDoc comments for functions
- Keep functions small and focused
- Avoid global variables

### Code Comments
```javascript
// Good: Explains WHY
// Filter out past events to keep the list relevant

// Bad: States the obvious
// Loop through events
```

### Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Start with a verb (Add, Fix, Update, Remove, Refactor)
- Be concise but descriptive
- Reference issues when applicable (#123)

Examples:
```
Add: My Events auto-sync feature
Fix: Past events not filtering correctly
Update: Improve store name extraction regex
Refactor: Simplify event type detection logic
```

## Testing Your Changes

1. **Load the extension**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select your modified folder

2. **Test on real pages**
   - Visit https://locator.riftbound.uvsgames.com/events
   - Visit https://locator.riftbound.uvsgames.com/my-events
   - Test all filter combinations
   - Check browser console for errors (F12)

3. **Test edge cases**
   - Events with missing data
   - Past events
   - Free vs paid events
   - Different event types

## Project Structure

```
riftbound-event-filter/
├── manifest.json          # Extension config (don't change version)
├── content.js            # Events page enhancement
├── my-events.js          # My Events scraper
├── popup.html            # Settings UI
├── popup.js              # Settings logic
├── styles.css            # Styling
└── icons/                # Icons (16px, 48px, 128px)
```

## Key Functions

### content.js
- `detectEventType()` - Matches event title to type
- `enhanceEventCard()` - Adds borders and badges
- `createFilterUI()` - Creates filter panel
- `applyFilters()` - Shows/hides events

### my-events.js
- `extractMyEvents()` - Scrapes registered events
- `isEventPast()` - Date comparison
- `saveMyEvents()` - Stores to Chrome storage

### popup.js
- `loadMyEvents()` - Displays registered events
- `savePreferences()` - Stores user settings
- `syncMyEvents()` - Triggers manual sync

## Performance Guidelines

- Use event delegation, not individual listeners
- Clean up observers when done
- Avoid synchronous operations in loops
- Use requestAnimationFrame for visual changes
- Cache DOM queries when possible

## Memory Leak Prevention

```javascript
// Good: Clean up observer
const observer = new MutationObserver(callback);
observer.observe(target, config);
// Later:
observer.disconnect();

// Bad: Never cleaned up
const observer = new MutationObserver(callback);
observer.observe(target, config);
```

## Adding New Event Types

To add a new event type:

1. **Add to EVENT_TYPES in content.js**
```javascript
YOURTYPE: {
  name: 'Your Event Name',
  color: '#hexcolor',
  bgColor: 'rgba(r, g, b, 0.1)',
  keywords: ['keyword1', 'keyword2'],
  emoji: '🎯'
}
```

2. **Add to my-events.js event detection**
```javascript
else if (titleLower.includes('your event')) {
  event.type = 'Your Event Name';
  event.typeColor = '#hexcolor';
}
```

3. **Add filter checkbox in createFilterUI() in content.js**

4. **Update README.md with new event type**

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion
- Reach out to maintainers

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on what's best for the community
- Assume good intentions

Thank you for contributing! 🎮
