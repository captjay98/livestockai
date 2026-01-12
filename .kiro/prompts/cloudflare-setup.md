---
description: 'Advanced Cloudflare Workers configuration beyond quickstart deployment'
---

# Advanced Cloudflare Workers Configuration

🚀 **For users who completed @quickstart and want advanced Cloudflare features.**

_If you haven't deployed yet, use @quickstart for basic deployment._

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Deployment**: Cloudflare Workers (edge computing)
**Database**: Neon PostgreSQL (serverless)

## MCP Integration

**Use Cloudflare MCP to verify and manage:**

```
workers_list                    # List all workers
workers_get_worker scriptName="openlivestock"  # Get worker details
workers_builds_list_builds      # Check deployment history
kv_namespaces_list              # List KV namespaces
r2_buckets_list                 # List R2 buckets
```

## Advanced Features

### Custom Domains

Set up custom domain for production:

1. **Add domain to Cloudflare:**
   - Add your domain to Cloudflare DNS
   - Update nameservers at your registrar

2. **Configure Workers route:**

   ```bash
   wrangler route add "yourdomain.com/*" openlivestock
   ```

3. **Verify with MCP:**
   ```
   workers_get_worker scriptName="openlivestock"
   ```

### Multiple Environments

Set up staging and production environments in `wrangler.jsonc`:

```jsonc
{
  "name": "openlivestock",
  "env": {
    "staging": {
      "name": "openlivestock-staging",
    },
    "production": {
      "name": "openlivestock-production",
    },
  },
}
```

**Deploy to environments:**

```bash
wrangler deploy --env staging
wrangler deploy --env production
```

### Advanced Bindings

**KV Storage** (for caching):

```bash
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview
```

**R2 Storage** (for file uploads):

```bash
wrangler r2 bucket create openlivestock-uploads
```

**Verify with MCP:**

```
kv_namespaces_list
r2_buckets_list
```

### Performance Optimization

**Caching Strategy:**

- Configure cache headers for static assets
- Use KV for session storage
- Implement edge caching for API responses

**Bundle Optimization:**

```bash
# Check bundle size
ls -la dist/server/

# Analyze dependencies
bun run build --analyze
```

**Cold Start Optimization:**

- Use dynamic imports for large modules
- Minimize initialization code
- Preload critical data

## Secrets Management

**Set secrets via CLI:**

```bash
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL
```

**List secrets:**

```bash
wrangler secret list
```

## Verification Checklist

| Feature           | Command/MCP            | Expected Result  |
| ----------------- | ---------------------- | ---------------- |
| Worker deployed   | `workers_list`         | Worker listed    |
| Routes configured | `workers_get_worker`   | Routes shown     |
| KV created        | `kv_namespaces_list`   | Namespace listed |
| R2 created        | `r2_buckets_list`      | Bucket listed    |
| Secrets set       | `wrangler secret list` | 3 secrets        |

## Troubleshooting

### Build fails

- Ensure all dependencies installed: `bun install`
- Check for TypeScript errors: `bun run check`

### Deployment fails

- Verify wrangler.jsonc syntax
- Check compatibility flags: `nodejs_compat`
- Ensure bundle size under 1MB

### Database connection fails

- Verify DATABASE_URL secret is set correctly
- Check Neon project is active
- Ensure `?sslmode=require` in connection string

## Agent Delegation

- `@devops-engineer` - Complex infrastructure and deployment
- `@backend-engineer` - Server function optimization

## Related Prompts

- `@quickstart` - Initial deployment setup
- `@cloudflare-deploy` - Deployment process
- `@cloudflare-debug` - Troubleshooting issues
- `@neon-setup` - Database configuration
