---
name: Cloudflare Deploy
description: Deploy OpenLivestock to Cloudflare Workers
---

# Cloudflare Deploy

Deploy OpenLivestock Manager to Cloudflare Workers.

## Prerequisites

- Cloudflare account configured
- Wrangler installed (`bunx wrangler`)
- Environment variables set in Cloudflare dashboard

## Deployment Steps

### 1. Pre-flight Checks

```bash
bun run lint
bun run check
bun test
```

### 2. Build

```bash
bun run build
```

### 3. Deploy

```bash
bunx wrangler deploy
```

### 4. Verify

- Check deployment status in Cloudflare dashboard
- Test production URL

## Environment Variables

Required in Cloudflare:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key

## Common Issues

**Issue**: Build fails with import errors
**Solution**: Ensure all database imports are dynamic (`await import()`)

**Issue**: Workers deployment fails
**Solution**: Check wrangler.jsonc configuration

## Rollback

```bash
bunx wrangler rollback
```
