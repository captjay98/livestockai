---
description: 'Comprehensive performance analysis for PWA, mobile, and rural connectivity'
---

# Performance Audit for OpenLivestock Manager

⚡ Optimize OpenLivestock Manager for rural farmers using 3G connections and low-end Android devices.

## Step 0: Determine Audit Scope

**Ask user interactively:**

> What performance audit would you like to perform?
>
> 1. **Full audit** - All performance categories
> 2. **Network performance** - Bundle size, loading speed
> 3. **Runtime performance** - React rendering, interactions
> 4. **Offline performance** - Cache, sync, storage
> 5. **Database performance** - Query optimization
> 6. **Specific feature** - Audit one feature area

**Then ask about target:**

- Rural 3G connection (primary target)
- 4G/LTE connection
- Low-end Android device
- Desktop/high-speed

Wait for response before proceeding.

## Step 1: Run Performance Tests

**Automated testing:**

```bash
# Lighthouse audit
npx lighthouse http://localhost:3001 --view

# Bundle analysis
bun run build
npx webpack-bundle-analyzer dist/assets/*.js
```

**Error handling:**

- If dev server not running: "Start dev server: `bun dev`"
- If build fails: "Fix build errors first. Run `bun run check`"
- If tools missing: "Install tools or proceed with manual audit? (y/n)"

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

## Validation & Next Steps

**Validate performance improvements:**

1. **Re-run tests:**
   - Lighthouse audit after changes
   - Bundle size comparison
   - Core Web Vitals measurement
   - Real device testing

2. **Verify targets met:**
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1
   - Bundle < 500KB

3. **Test on real conditions:**
   - 3G network simulation
   - Low-end Android device
   - Rural connectivity patterns

**Ask user:**

> Performance audit complete. What would you like to do?
>
> - (f) Fix critical issues first (blocking performance)
> - (p) Create prioritized optimization plan
> - (t) Test on real device/network
> - (m) Monitor performance over time

**If critical issues found:**

> Found X critical performance issues:
>
> 1. [Issue with impact]
> 2. [Issue with impact]
>
> Estimated improvement: [X]s faster load time
> Proceed with fixes? (y/n)

**Success criteria:**

- All Core Web Vitals meet targets
- Bundle size under 500KB
- App usable on 3G connection
- Offline mode works smoothly
- No performance regressions

## Agent Delegation

For performance optimization:

- `@frontend-engineer` - React optimization, bundle splitting, and code optimization
- `@backend-engineer` - Database query optimization and server function performance
- `@devops-engineer` - CDN configuration, caching, and edge optimization
- `@qa-engineer` - Performance testing and monitoring setup

### When to Delegate

- **Bundle optimization** - @frontend-engineer for code splitting and lazy loading
- **Database performance** - @backend-engineer for query optimization
- **Infrastructure** - @devops-engineer for CDN and caching configuration
- **Testing** - @qa-engineer for performance testing and benchmarks

## Related Prompts

- `@pwa-optimize` - PWA-specific optimizations
- `@accessibility-audit` - Ensure performance doesn't break accessibility
- `@cloudflare-setup` - Edge caching configuration
- `@test-coverage` - Performance testing coverage
