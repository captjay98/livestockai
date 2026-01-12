---
description: 'Comprehensive performance analysis for PWA, mobile, and rural connectivity'
---

# Performance Audit for OpenLivestock Manager

⚡ Optimize OpenLivestock Manager for rural farmers using 3G connections and low-end Android devices.

## Performance Targets

### Core Web Vitals (Rural 3G)

- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1
- **TTFB (Time to First Byte)**: <800ms

### Bundle & Resource Targets

- **Initial JavaScript**: <500KB gzipped
- **Total page weight**: <2MB
- **Critical CSS**: <50KB inline
- **Images**: WebP format, <200KB each

### Offline Performance

- **Cache hit ratio**: >90% for repeat visits
- **Sync time**: <5s when reconnected
- **Storage efficiency**: <50MB IndexedDB usage

## Audit Categories

### 1. Network Performance

**Bundle Analysis**

```bash
# Analyze bundle size
bun run build
bun add -D webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/assets/*.js
```

**Critical Path Optimization**

- Identify render-blocking resources
- Inline critical CSS
- Preload key resources
- Optimize font loading

**Compression & Caching**

- Gzip/Brotli compression enabled
- Proper cache headers set
- Service worker caching strategy
- CDN optimization (Cloudflare)

### 2. Runtime Performance

**JavaScript Performance**

- Main thread blocking time
- Long task identification
- Memory usage patterns
- CPU usage optimization

**React Performance**

- Component re-render analysis
- Unnecessary effect dependencies
- Large list virtualization
- Image lazy loading

**Database Performance**

- Query execution time
- N+1 query detection
- Connection pooling efficiency
- Index usage analysis

### 3. Mobile Optimization

**Device Performance**

- Low-end Android testing (2GB RAM)
- Battery usage optimization
- Touch responsiveness
- Thermal throttling handling

**Network Conditions**

- 3G simulation testing
- Offline functionality
- Progressive loading
- Background sync

### 4. PWA Performance

**Service Worker Efficiency**

- Cache strategy optimization
- Update mechanism performance
- Background sync performance
- Push notification handling

**Storage Performance**

- IndexedDB query optimization
- Storage quota management
- Data compression
- Cleanup strategies

## Audit Process

### Automated Performance Testing

**Lighthouse CI**

```bash
# Install Lighthouse CI
bun add -D @lhci/cli

# Run performance audit
lhci autorun --collect.numberOfRuns=3
```

**WebPageTest**

- Test from multiple global locations
- 3G connection simulation
- Low-end device simulation
- Filmstrip analysis

### Real User Monitoring (RUM)

**Core Web Vitals Tracking**

```javascript
// Add to app/routes/__root.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

**Custom Metrics**

- Time to interactive for key workflows
- Offline sync performance
- Database query performance
- Form submission time

### Performance Profiling

**Chrome DevTools**

- Performance tab analysis
- Memory tab leak detection
- Network tab optimization
- Coverage tab unused code

**React DevTools Profiler**

- Component render time
- Re-render frequency
- Props change analysis
- Context usage optimization

## Rural Context Optimization

### Network Conditions

- **Intermittent connectivity**: Robust offline mode
- **Low bandwidth**: Aggressive compression, lazy loading
- **High latency**: Reduce round trips, batch requests
- **Data costs**: Minimize unnecessary transfers

### Device Constraints

- **Limited RAM**: Memory-efficient data structures
- **Slow CPU**: Reduce JavaScript execution time
- **Small screens**: Optimize for mobile-first
- **Battery life**: Minimize background processing

### User Behavior

- **Frequent interruptions**: Auto-save, resume functionality
- **Quick sessions**: Fast startup, immediate value
- **Offline usage**: Full offline capability
- **Data entry**: Optimized forms, input validation

## Common Performance Issues

### Bundle Size Issues

**Problem**: Large JavaScript bundles
**Solution**: Code splitting, tree shaking, dynamic imports

### Database Performance

**Problem**: Slow queries, N+1 problems
**Solution**: Query optimization, proper indexing, batching

### Image Optimization

**Problem**: Large, unoptimized images
**Solution**: WebP format, responsive images, lazy loading

### Memory Leaks

**Problem**: Growing memory usage over time
**Solution**: Proper cleanup, weak references, profiling

### Render Blocking

**Problem**: CSS/JS blocking initial render
**Solution**: Critical CSS inlining, async loading

## Optimization Strategies

### Code Splitting

```javascript
// Route-based splitting
const BatchesPage = lazy(() => import('./routes/batches'))

// Feature-based splitting
const ReportsModule = lazy(() => import('./lib/reports'))
```

### Image Optimization

```javascript
// Responsive images with WebP
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" loading="lazy" />
</picture>
```

### Database Optimization

```typescript
// Batch queries instead of N+1
const batchesWithCounts = await db
  .selectFrom('batches')
  .leftJoin('mortality_records', 'mortality_records.batchId', 'batches.id')
  .select([
    'batches.id',
    'batches.batchName',
    db.fn.count('mortality_records.id').as('mortalityCount'),
  ])
  .groupBy('batches.id')
  .execute()
```

### Service Worker Optimization

```javascript
// Efficient caching strategy
const CACHE_STRATEGY = {
  documents: 'networkFirst',
  assets: 'cacheFirst',
  api: 'networkFirst',
  images: 'cacheFirst',
}
```

## Performance Monitoring

### Metrics Dashboard

- Core Web Vitals trends
- Bundle size over time
- Database query performance
- User session performance

### Alerting

- Performance regression detection
- Bundle size increase alerts
- Database slow query alerts
- Error rate monitoring

### A/B Testing

- Performance optimization impact
- Feature flag performance testing
- Progressive rollout monitoring

## Tools & Resources

**Analysis Tools**

- Lighthouse CI
- WebPageTest
- Bundle Analyzer
- Chrome DevTools

**Monitoring Tools**

- Web Vitals library
- Sentry performance monitoring
- Cloudflare Analytics
- Custom RUM implementation

**Optimization Tools**

- Vite build optimization
- Image optimization services
- CDN configuration
- Service worker tools

---

## Instructions for Assistant

### Audit Workflow

1. **Baseline measurement** - Current performance metrics
2. **Bottleneck identification** - Find the biggest issues first
3. **Impact analysis** - Prioritize by user impact
4. **Implementation planning** - Estimate effort vs. benefit
5. **Verification testing** - Confirm improvements

### Testing Conditions

- **Device**: Low-end Android (2GB RAM)
- **Network**: 3G simulation (1.6Mbps, 300ms latency)
- **Location**: Rural areas with poor connectivity
- **Usage patterns**: Farmer workflows, interruptions

### Reporting Format

- Current vs. target metrics
- Specific recommendations with code examples
- Implementation priority (Critical/High/Medium/Low)
- Expected performance improvement
- Testing methodology for verification

Remember: Performance directly impacts farmer productivity and app adoption in rural areas.

## Agent Delegation

- `@frontend-engineer` - React and bundle optimization
- `@backend-engineer` - Database query optimization
- `@devops-engineer` - CDN and caching configuration

## Related Prompts

- `@pwa-optimize` - PWA-specific optimizations
- `@accessibility-audit` - Ensure performance doesn't break accessibility
- `@neon-optimize` - Database performance
- `@cloudflare-setup` - Edge caching configuration
