# Deployment Checklist

## Pre-Release Checks

### Code Quality
- [ ] No console.log statements in production code
- [ ] All commented-out code removed
- [ ] No TODO comments remaining
- [ ] No hardcoded test data
- [ ] All functions have proper error handling
- [ ] Memory leaks checked and fixed
- [ ] No sensitive information (API keys, personal data)

### Testing
- [ ] Tested on Chrome (latest version)
- [ ] Tested on Edge
- [ ] Tested filter functionality
- [ ] Tested My Events sync
- [ ] Tested past event filtering
- [ ] Tested with no events
- [ ] Tested with many events (100+)
- [ ] Tested preferences save/load
- [ ] Checked browser console for errors
- [ ] Tested on slow network connection

### Files
- [ ] All required files present
- [ ] Icons created (16px, 48px, 128px)
- [ ] manifest.json version updated
- [ ] README.md updated
- [ ] CHANGELOG updated
- [ ] No unnecessary files included

### manifest.json
- [ ] Version number correct (e.g., 1.0.0)
- [ ] Name and description accurate
- [ ] Permissions minimal and justified
- [ ] Icons paths correct
- [ ] Content script matches correct

### Documentation
- [ ] README.md complete
- [ ] Installation instructions clear
- [ ] Usage examples provided
- [ ] Troubleshooting section helpful
- [ ] Contributing guidelines present
- [ ] License file included

## Chrome Web Store Submission

### Required Materials
- [ ] Extension ZIP file created
- [ ] High-quality screenshots (5 recommended)
  - [ ] 1280x800 or 640x400 minimum
  - [ ] Show key features
  - [ ] Clear and professional
- [ ] Store icon (128x128)
- [ ] Small promo tile (440x280) - optional
- [ ] Marquee promo tile (1400x560) - optional
- [ ] Detailed description written
- [ ] Category selected
- [ ] Keywords added

### Pricing & Distribution
- [ ] Set to Free
- [ ] Distribution regions selected
- [ ] Language set (English)

### Privacy
- [ ] Privacy policy (if collecting data) - N/A
- [ ] Single purpose description
- [ ] Permissions justified
- [ ] Data usage disclosure

### Submission
- [ ] All fields completed
- [ ] Screenshots uploaded
- [ ] Description copy-pasted (no formatting issues)
- [ ] Contact email provided
- [ ] Support URL provided (GitHub)
- [ ] Preview looks correct

## Post-Submission

### After Approval
- [ ] Test install from Chrome Web Store
- [ ] Verify all features work
- [ ] Update GitHub repo with store link
- [ ] Create release tag (v1.0.0)
- [ ] Announce on relevant communities

### Monitoring
- [ ] Check reviews regularly
- [ ] Respond to user feedback
- [ ] Monitor error reports
- [ ] Track feature requests
- [ ] Plan next version

## Creating Distribution ZIP

```bash
# Navigate to extension folder
cd "c:\Users\Ding\source\repos\riftbound cal"

# Create ZIP with essential files only
# Include:
- manifest.json
- content.js
- my-events.js
- popup.html
- popup.js
- styles.css
- icons/icon16.png
- icons/icon48.png
- icons/icon128.png

# Exclude:
- Documentation files (*.md except README.md)
- Development files (.git, .vscode, etc.)
- Test files
- create-icons.html
```

## Version Numbering

Follow Semantic Versioning (semver.org):
- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Examples:
- 1.0.0 - Initial release
- 1.0.1 - Bug fix
- 1.1.0 - New feature added
- 2.0.0 - Major rewrite

## Common Issues

### Manifest Errors
- Check JSON syntax (trailing commas)
- Verify all paths are correct
- Ensure version format is correct (X.Y.Z)

### Upload Fails
- Zip file must not contain parent folder
- Files must be in ZIP root
- Max size: 100MB (should be <1MB)

### Review Rejection Reasons
- Misleading description
- Copyrighted material without permission
- Requesting unnecessary permissions
- Malware/security issues
- Broken functionality

## Final Checks

```javascript
// Quick self-test in browser console
// On https://locator.riftbound.uvsgames.com/events

// Check extension loaded
console.log('[Riftbound Filter] Extension loaded');

// Check filters working
// Click some filter checkboxes

// Check no errors
// No red errors in console

// Check My Events
// Visit /my-events page
// Check sync notification appears
```

## Ready to Submit!

Once all checkboxes are ticked:
1. Create final ZIP
2. Log in to Chrome Web Store Developer Dashboard
3. Click "New Item"
4. Upload ZIP
5. Fill in all fields
6. Upload screenshots
7. Submit for review

**Estimated review time:** 1-3 business days

Good luck! 🚀
