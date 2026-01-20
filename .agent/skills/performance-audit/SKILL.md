---
name: Performance Audit
description: Audit and optimize application performance
---

# Performance Audit

Optimize OpenLivestock performance.

## Metrics (Core Web Vitals)

- **LCP**: Largest Contentful Paint < 2.5s
- **FID**: First Input Delay < 100ms
- **CLS**: Cumulative Layout Shift < 0.1

## Audit Tools

### Lighthouse

```bash
npx lighthouse http://localhost:3000 --view
```

### Bundle Analysis

```bash
bun run build --analyze
```

## Optimization Checklist

### Loading Performance

- [ ] Code splitting working
- [ ] Lazy loading for routes
- [ ] Images optimized

### Runtime Performance

- [ ] No unnecessary re-renders
- [ ] Efficient database queries
- [ ] Proper memoization

### Bundle Size

- [ ] No duplicate dependencies
- [ ] Tree shaking working
- [ ] Dynamic imports for heavy libs

## Database Performance

```typescript
// Good: Explicit columns
.select(['id', 'name', 'status'])

// Bad: Select all
.selectAll()
```

## Cloudflare Workers

- Edge caching enabled
- Static assets cached
- API responses cached where appropriate
