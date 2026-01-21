---
description: 'Optimize PWA performance and user experience'
---

# PWA Optimization

Optimize Progressive Web App performance for OpenLivestock Manager.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**PWA**: Vite PWA plugin with Workbox
**Target**: Rural farmers with limited connectivity

## Step 0: Determine Optimization Scope

**Ask user interactively:**

> What PWA optimization would you like to perform?
>
> 1. **Full optimization** - All PWA aspects
> 2. **Performance** - Core Web Vitals, loading speed
> 3. **Offline capability** - Service worker, caching
> 4. **Installation** - App manifest, install prompts
> 5. **Specific feature** - Optimize one feature area

**Then ask about priority:**

- Critical issues (blocking PWA score)
- Performance improvements
- User experience enhancements
- All optimizations

Wait for response before proceeding.

## Step 1: Run PWA Audit

## Step 1: Run PWA Audit

### Run Lighthouse Audit

```bash
# Start dev server
bun dev

# Run Lighthouse (in another terminal)
npx lighthouse http://localhost:3001 --view --only-categories=pwa,performance
```

**Error handling:**

- If dev server not running: "Start dev server first: `bun dev`"
- If Lighthouse not installed: "Install: `npm install -g lighthouse`"
- If score < 80: "Critical PWA issues found. Review details? (y/n)"

### Key Metrics

| Metric         | Target | Warning | Critical |
| -------------- | ------ | ------- | -------- |
| Performance    | >90    | 70-90   | <70      |
| PWA Score      | 100    | 80-99   | <80      |
| Best Practices | >90    | 70-90   | <70      |
| Accessibility  | >90    | 70-90   | <70      |

## Core Web Vitals

### LCP (Largest Contentful Paint)

**Target**: <2.5 seconds

**Optimize**:

- Preload critical resources
- Optimize images
- Use efficient cache policies

### FID (First Input Delay)

**Target**: <100ms

**Optimize**:

- Minimize JavaScript execution
- Break up long tasks
- Use web workers for heavy computation

### CLS (Cumulative Layout Shift)

**Target**: <0.1

**Optimize**:

- Set explicit dimensions on images
- Reserve space for dynamic content
- Avoid inserting content above existing content

## Manifest Configuration

### Verify manifest.json

```json
{
  "name": "OpenLivestock Manager",
  "short_name": "Livestock",
  "description": "Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Required Icons

- 192x192 PNG
- 512x512 PNG
- Maskable icon variant
- Apple touch icon

## Service Worker Optimization

### Caching Strategy

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    // Cache static assets
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

    // Runtime caching for API
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
    ],
  },
})
```

### Precaching

- HTML shell
- Critical CSS
- Core JavaScript
- Essential images

## Bundle Optimization

### Analyze Bundle

```bash
# Generate bundle analysis
bun run build --analyze
```

### Code Splitting

```typescript
// Lazy load routes
const BatchesPage = lazy(() => import('./routes/batches'))
const ReportsPage = lazy(() => import('./routes/reports'))
```

### Tree Shaking

- Import only what you need
- Use ES modules
- Avoid barrel exports for large libraries

## Image Optimization

### Use Modern Formats

- WebP for photos
- SVG for icons
- AVIF for best compression

### Responsive Images

```html
<img
  srcset="image-320.webp 320w, image-640.webp 640w, image-1280.webp 1280w"
  sizes="(max-width: 320px) 280px,
         (max-width: 640px) 600px,
         1200px"
  src="image-640.webp"
  alt="Description"
/>
```

## Mobile Optimization

### Touch Targets

- Minimum 44x44px touch targets
- Adequate spacing between interactive elements

### Viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### Font Loading

```css
@font-face {
  font-family: 'Inter';
  font-display: swap;
  src: url('/fonts/inter.woff2') format('woff2');
}
```

## Offline Experience

### Offline Page

- Show cached data
- Clear offline indicator
- Queue actions for sync

### Background Sync

```typescript
// Register for background sync
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register('sync-data')
})
```

## Checklist

### PWA Requirements

| Requirement           | How to Verify               | Status |
| --------------------- | --------------------------- | ------ |
| Valid manifest.json   | Lighthouse PWA audit        | ✅/❌  |
| Service worker active | DevTools → Application → SW | ✅/❌  |
| HTTPS enabled         | Check URL bar               | ✅/❌  |
| Icons (192, 512)      | Check manifest.json         | ✅/❌  |
| Installable           | Test install prompt         | ✅/❌  |

### Performance

| Metric         | Target    | How to Measure   | Status   |
| -------------- | --------- | ---------------- | -------- |
| LCP            | <2.5s     | Lighthouse       | ✅/⚠️/❌ |
| FID            | <100ms    | Lighthouse       | ✅/⚠️/❌ |
| CLS            | <0.1      | Lighthouse       | ✅/⚠️/❌ |
| Initial Bundle | <500KB    | `bun run build`  | ✅/⚠️/❌ |
| Images         | Optimized | WebP/AVIF format | ✅/❌    |

### Mobile (Rural Connectivity)

| Requirement    | Target             | Status   |
| -------------- | ------------------ | -------- |
| Responsive     | All screen sizes   | ✅/❌    |
| Touch-friendly | 44px min targets   | ✅/❌    |
| 3G performance | <5s load           | ✅/⚠️/❌ |
| Offline mode   | Full functionality | ✅/❌    |

## Validation & Next Steps

**Validate PWA optimization:**

1. **Re-run Lighthouse:**
   - PWA score should be 100
   - Performance > 90
   - All checks passing

2. **Test installation:**
   - Install prompt appears
   - App installs successfully
   - Launches from home screen

3. **Test offline:**
   - Disconnect network
   - App still works
   - Data persists

**Ask user:**

> PWA optimization complete. What would you like to do?
>
> - (t) Test on real device
> - (i) Test installation flow
> - (o) Test offline functionality
> - (r) Re-run Lighthouse audit

**If PWA score < 100:**

> PWA score: X/100. Issues found:
>
> 1. [Issue description]
> 2. [Issue description]
>
> Fix these issues? (y/n)

**Success criteria:**

- Lighthouse PWA score = 100
- Performance score > 90
- App installable
- Offline mode works
- All icons present

## Agent Delegation

For PWA optimization:

- `@frontend-engineer` - React optimization, code splitting, and PWA implementation
- `@devops-engineer` - Service worker configuration and caching strategies
- `@qa-engineer` - PWA testing and validation
- `@backend-engineer` - Offline data sync implementation

### When to Delegate

- **Performance issues** - @frontend-engineer for bundle optimization
- **Service worker** - @devops-engineer for caching strategies
- **Testing** - @qa-engineer for PWA compliance testing
- **Sync logic** - @backend-engineer for offline data handling

## Related Prompts

- `@offline-debug` - Fix offline issues
- `@accessibility-audit` - Ensure accessibility compliance
- `@test-coverage` - Add PWA tests
- `@performance-audit` - Comprehensive performance analysis
