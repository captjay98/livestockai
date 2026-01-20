---
name: PWA Optimize
description: Optimize Progressive Web App features
---

# PWA Optimize

Optimize PWA capabilities for OpenLivestock Manager.

## PWA Features

- Offline functionality
- App installation
- Push notifications (planned)
- Background sync

## Key Files

- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `app/lib/offline/` - Offline data management

## Optimization Checklist

### Performance

- [ ] Assets cached for offline
- [ ] IndexedDB for data persistence
- [ ] Lazy loading for large views

### Installation

- [ ] manifest.json configured
- [ ] Icons in all sizes
- [ ] Start URL correct

### Offline

- [ ] Read operations work offline
- [ ] Write operations queue for sync
- [ ] Clear offline/online indicators

## Testing

```bash
# Build and serve production
bun run build
bun run preview
```

Test in Chrome DevTools:

1. Application > Service Workers
2. Network > Offline checkbox
3. Lighthouse > PWA audit
