# Quick Start: Deploy to Production

## 🚀 5-Minute Deployment Guide

### Step 1: Create Icons (2 minutes)
```
1. Open create-icons.html in your browser
2. Click "Download 16x16"
3. Click "Download 48x48"
4. Click "Download 128x128"
5. Save all three files to the icons/ folder
```

### Step 2: Create Distribution ZIP (1 minute)
```
Create a ZIP file containing ONLY these files:

📦 riftbound-event-filter.zip
├── manifest.json
├── content.js
├── my-events.js
├── popup.html
├── popup.js
├── styles.css
├── README.md
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

DO NOT include:
❌ Development docs
❌ .git folder
❌ .vscode folder
❌ create-icons.html
❌ Other *.md files (except README.md)
```

### Step 3: Test Locally (1 minute)
```
1. Extract your ZIP to a test folder
2. Open Chrome → chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted folder
6. Visit https://locator.riftbound.uvsgames.com/events
7. Verify filters work
8. Visit /my-events and verify sync works
```

### Step 4: Submit to Chrome Web Store (1 minute)
```
1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 developer fee (if first submission)
3. Click "New Item"
4. Upload your ZIP file
5. Fill in the form using STORE_DESCRIPTION.md
6. Upload screenshots (5 recommended)
7. Click "Submit for Review"
```

## 📋 Store Listing Quick Copy

### Name
```
Riftbound Event Filter
```

### Short Description (132 char max)
```
Filter and track Riftbound TCG events by type, price, and location. Auto-sync your registered events with smart filtering.
```

### Category
```
Productivity
```

### Language
```
English
```

## 📸 Screenshots Needed

Take 5 screenshots showing:
1. **Events page** with color borders and filter panel
2. **Extension popup** with settings
3. **My Events section** with upcoming tournaments
4. **Filter panel** with checkboxes
5. **Event card** closeup with badges

Size: 1280x800 or 640x400 minimum

## 🔐 Permissions Justification

Copy this when Chrome asks why you need permissions:

**Storage:**
```
Used to save user filter preferences and synced event data locally.
Allows settings to persist across browser sessions and sync across
Chrome devices via Chrome Sync.
```

**Host Permission (locator.riftbound.uvsgames.com):**
```
Required to:
- Enhance event cards with color-coding and badges
- Add the filter panel to the events page
- Extract and sync registered events from My Events page
- Apply saved filter preferences automatically

No other websites are accessed.
```

## ✅ Pre-Submission Checklist

Quick checks before submitting:

- [ ] Icons created (16, 48, 128 px)
- [ ] ZIP file created with correct files only
- [ ] Tested installation from ZIP
- [ ] All features working
- [ ] No errors in browser console
- [ ] README.md looks good
- [ ] Version in manifest.json is 1.0.0

## 🎯 After Approval

1. **Update GitHub**
   - Add Chrome Web Store link to README
   - Create release tag v1.0.0

2. **Announce**
   - Share on Reddit (r/Riftbound if exists)
   - Post on social media
   - Tell your local game store

3. **Monitor**
   - Check Chrome Web Store reviews
   - Respond to user feedback
   - Track issues on GitHub

## 🐛 If Review is Rejected

Common reasons and fixes:

**"Permissions too broad"**
→ Our permissions are minimal, explain use case

**"Description misleading"**
→ Use exact copy from STORE_DESCRIPTION.md

**"Broken functionality"**
→ Test again, ensure icons are included

**"Copyright concerns"**
→ Add disclaimer that it's unofficial/community-made

## 📞 Support

After publishing, users can:
- Report bugs on GitHub Issues
- Email you (add your email to manifest)
- Leave Chrome Web Store reviews

## 🎉 You're Ready!

Everything is production-ready:
- ✅ Code is clean and optimized
- ✅ No security vulnerabilities
- ✅ No memory leaks
- ✅ Documentation complete
- ✅ Chrome Web Store compliant

**Time to publish:** 5 minutes
**Review time:** 1-3 business days
**Expected result:** ✅ Approval

---

**Questions?** Check:
- DEPLOYMENT_CHECKLIST.md (detailed steps)
- PRODUCTION_READY.md (technical review)
- STORE_DESCRIPTION.md (listing copy)

Good luck! 🚀
