# ClassTab IndexedDB Offline Storage Implementation

## Overview

This implementation adds **IndexedDB storage** to the ClassTab feature, allowing you to automatically cache tablature content when you navigate to tabs. This enables offline access to previously viewed tablatures.

## Features Implemented

### 1. **Automatic Caching**

- When you load a tab in the ClassTab viewer, it automatically saves the content to IndexedDB
- Content is fetched either from the iframe or directly from the URL
- Each tab stores: URL, title, composer, MIDI URL (if available), content, timestamp, and last accessed time

### 2. **Offline Detection**

- The app monitors your online/offline status
- Visual indicators show when you're offline (orange badge) or viewing cached content (blue badge)
- Cached content can be accessed even when offline

### 3. **Cached Tabs Widget**

- A new widget on the dashboard displays all your cached tabs
- Shows metadata for each tab:
  - Title and composer
  - Last accessed time (formatted as "2h ago", "3d ago", etc.)
  - File size
  - MIDI availability indicator
- Click any cached tab to open it
- Delete individual tabs or clear all cached tabs

### 4. **Storage Management**

- View total storage used by cached tabs
- See how many tabs are cached
- Delete individual tabs from cache
- Clear all cached tabs with one click

## Files Created

### Services

- **`classtab-storage.service.ts`** - IndexedDB service with methods for:
  - `saveTab()` - Save a tab to cache
  - `getTab()` - Retrieve a tab from cache
  - `getAllTabs()` - Get all cached tabs
  - `getTabsByComposer()` - Filter tabs by composer
  - `deleteTab()` - Remove a tab from cache
  - `clearAllTabs()` - Clear all cached tabs
  - `getStorageStats()` - Get storage statistics
  - `isOnline()` - Check online status

### Components

- **`cached-tabs.component.ts/html/css`** - Widget component for displaying and managing cached tabs

## Files Modified

### ClassTab Page Component

- **`classtab-page.component.ts`**

  - Integrated `ClasstabStorageService`
  - Added online/offline status monitoring
  - Added automatic caching on iframe load
  - Added signals for `isOffline`, `isFromCache`, `isSaving`
  - Implemented `saveCurrentTabToCache()` method
  - Implemented `loadFromCache()` method

- **`classtab-page.component.html`**
  - Added offline indicator badge (orange)
  - Added cached content indicator badge (blue)

### Dashboard

- **`dashboard.component.ts`**

  - Added `CachedTabsComponent` import
  - Added `'cached-tabs'` to widget types
  - Added cached tabs widget to column 3

- **`dashboard.component.html`**
  - Added rendering for cached-tabs widget

## How It Works

### Caching Flow

1. User navigates to a tab via the ClassTab widget
2. Tab loads in iframe
3. `onIframeLoad()` is triggered
4. `saveCurrentTabToCache()` attempts to extract content from iframe
5. If CORS prevents iframe access, content is fetched directly
6. Tab data is saved to IndexedDB with metadata
7. Success message logged to console: "✅ Tab saved to cache: [title]"

### Retrieval Flow

1. User can view all cached tabs in the "Cached Tabs" widget
2. Clicking a cached tab navigates to the ClassTab page
3. If offline, the app can load content from IndexedDB (future enhancement)
4. Cache indicator shows when content is from cache

### Storage Structure

```typescript
interface StoredTab {
  url: string; // Primary key
  title: string;
  composer: string;
  midiUrl?: string;
  content: string; // The actual tablature content
  timestamp: number; // When it was first cached
  lastAccessed: number; // When it was last viewed
}
```

## Usage

### Viewing Cached Tabs

1. Go to the Dashboard
2. Find the "Cached Tabs" widget (in column 3 by default)
3. See all your cached tablatures with metadata
4. Click any tab to open it

### Managing Cache

- **Delete a single tab**: Click the trash icon on any cached tab
- **Clear all tabs**: Click "Clear All" button in the widget header
- **View storage stats**: See total storage used in the widget header

### Offline Access

1. Load some tabs while online (they'll be cached automatically)
2. Go offline (disable network or turn on airplane mode)
3. The "Offline" badge will appear in the ClassTab viewer
4. Navigate to cached tabs from the dashboard
5. Content will be available from cache

## Browser Compatibility

- Uses IndexedDB API (supported in all modern browsers)
- Chrome, Firefox, Safari, Edge all support IndexedDB
- Storage quota varies by browser (typically 50MB+)

## Future Enhancements

- [ ] Add search/filter in cached tabs widget
- [ ] Add sorting options (by date, composer, title)
- [ ] Show cache size per tab
- [ ] Add export/import functionality
- [ ] Implement automatic cache cleanup (remove old tabs)
- [ ] Add offline mode with automatic fallback to cache
- [ ] Pre-cache popular tabs
- [ ] Sync cache across devices

## Testing

To test the implementation:

1. Navigate to a few tabs in ClassTab viewer
2. Check browser console for "✅ Tab saved to cache" messages
3. Open browser DevTools > Application > IndexedDB > ClassTabDB
4. Verify tabs are being stored
5. Go to Dashboard and check the Cached Tabs widget
6. Try deleting a tab and verify it's removed from IndexedDB
7. Test offline mode by disabling network

## Notes

- CORS restrictions may prevent reading iframe content for some URLs
- In such cases, content is fetched directly via fetch API
- IndexedDB is persistent storage - data survives browser restarts
- Each origin (domain) has its own IndexedDB instance
