# Privacy Policy for RiftHub

**Last Updated:** January 2, 2025

## Overview

RiftHub is a Chrome extension that helps users track their registered Riftbound TCG events, search for nearby tournaments, and manage their event calendar. This privacy policy explains what data the extension collects and how it is used.

## Data Collection

### Location Data
- **What we collect:** Zip codes or city names that you enter when searching for events
- **How it's used:** Your location query is sent to the US Census Bureau's geocoding service to convert it into coordinates for finding nearby events
- **Storage:** Your last searched location is stored locally in your browser using Chrome's storage API

### Website Content
- **What we collect:** Event IDs from the Riftbound "My Events" page when you are logged in
- **How it's used:** Event IDs are used to fetch full event details from the Riftbound API to display in the extension
- **Storage:** Event data is stored locally in your browser using Chrome's storage API

## Data Storage

All data is stored locally on your device using Chrome's built-in storage API. This includes:
- Your registered events
- Search results
- Filter preferences
- Last searched location

**No data is stored on external servers controlled by this extension.**

## Third-Party Services

The extension communicates with the following services:
1. **Riftbound API** (api.cloudflare.riftbound.uvsgames.com) - To fetch event details
2. **US Census Geocoding Service** (geocoding.geo.census.gov) - To convert US location queries to coordinates
3. **OpenStreetMap Nominatim** (nominatim.openstreetmap.org) - To convert international location queries to coordinates (fallback for non-US locations)

These are the only external services the extension communicates with.

## Data Sharing

**We do not sell, trade, or transfer your data to any third parties.**

Your data is:
- Not sold to third parties
- Not used for advertising
- Not used for any purpose other than the core functionality of tracking Riftbound events

## Data Retention

All data is stored locally in your browser. You can clear all stored data at any time by:
1. Using the "Force Clear All" button in the extension
2. Uninstalling the extension
3. Clearing your browser data

## Your Rights

You have full control over your data:
- View what's stored by opening Chrome DevTools and checking `chrome.storage.local`
- Delete all data using the "Force Clear All" button
- Uninstall the extension to remove all associated data

## Changes to This Policy

Any changes to this privacy policy will be reflected in this document with an updated "Last Updated" date.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository:
https://github.com/j-ding/RiftHub

## Open Source

RiftHub is open source. You can review the complete source code at:
https://github.com/j-ding/RiftHub
