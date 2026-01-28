# Deployment Guide

Complete guide for deploying OpenLivestock Manager to production.

---

## Prerequisites

- **Cloudflare Account** (free tier works)
- **Neon Account** (free tier works)
- **GitHub Account** (for CI/CD)
- **Node.js 22+** or **Bun 1.0+**

---

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/yourusername/openlivestock.git
cd openlivestock
bun install

# 2. Set up database
bun run db:migrate
bun run db:seed

# 3. Deploy
bun run deploy
```

---

## Step 1: Database Setup (Neon)

### Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Click **New Project**
3. Choose region closest to your users
4. Copy the connection string

### Configure Database

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Run Migrations

```bash
# Create tables
bun run db:migrate

# Seed initial data (admin user + reference data)
bun run db:seed

# Optional: Seed demo data for testing
bun run db:seed:dev
```

### Verify Database

```bash
# Check tables exist
bun run db:status

# Or use Neon SQL Editor
# Run: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Step 2: Cloudflare Workers Setup

### Install Wrangler CLI

```bash
npm install -g wrangler
# or
bun add -g wrangler
```

### Login to Cloudflare

```bash
wrangler login
```

### Configure Worker

Edit `wrangler.jsonc`:

```jsonc
{
    "name": "openlivestock-production",
    "main": "./.output/server/index.mjs",
    "compatibility_date": "2024-01-01",
    "compatibility_flags": ["nodejs_compat"],
    "vars": {
        "NODE_ENV": "production",
    },
}
```

### Set Secrets

```bash
# Database connection
wrangler secret put DATABASE_URL
# Paste your Neon connection string

# Better Auth secret (generate with: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Optional: SMS provider (Termii)
wrangler secret put TERMII_API_KEY

# Optional: Email provider (Resend)
wrangler secret put RESEND_API_KEY
```

---

## Step 3: Build & Deploy

### Build for Production

```bash
bun run build
```

This creates optimized bundle in `.output/`.

### Deploy to Cloudflare

```bash
bun run deploy
# or
wrangler deploy
```

### Verify Deployment

```bash
# Check deployment status
wrangler deployments list

# View logs
wrangler tail
```

Your app is now live at: `https://openlivestock-production.your-subdomain.workers.dev`

---

## Step 4: Custom Domain (Optional)

### Add Domain to Cloudflare

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Click **Triggers** → **Custom Domains**
4. Add your domain (e.g., `app.yourfarm.com`)

### Update DNS

Cloudflare automatically configures DNS records.

---

## Environment Variables

### Required

| Variable             | Description                | Example                   |
| -------------------- | -------------------------- | ------------------------- |
| `DATABASE_URL`       | Neon PostgreSQL connection | `postgresql://...`        |
| `BETTER_AUTH_SECRET` | Auth session secret        | `openssl rand -base64 32` |

### Optional

| Variable              | Description        | Default   |
| --------------------- | ------------------ | --------- |
| `SMS_PROVIDER`        | SMS service        | `console` |
| `EMAIL_PROVIDER`      | Email service      | `console` |
| `TERMII_API_KEY`      | Termii API key     | -         |
| `TERMII_SENDER_ID`    | Termii sender ID   | -         |
| `TWILIO_ACCOUNT_SID`  | Twilio account SID | -         |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token  | -         |
| `TWILIO_PHONE_NUMBER` | Twilio phone       | -         |
| `RESEND_API_KEY`      | Resend API key     | -         |
| `SMTP_HOST`           | SMTP server        | -         |
| `SMTP_PORT`           | SMTP port          | `587`     |
| `SMTP_USER`           | SMTP username      | -         |
| `SMTP_PASSWORD`       | SMTP password      | -         |
| `SMTP_FROM`           | From email         | -         |

---

## CI/CD with GitHub Actions

### Create Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - uses: oven-sh/setup-bun@v1
              with:
                  bun-version: latest

            - name: Install dependencies
              run: bun install

            - name: Run tests
              run: bun run test

            - name: Build
              run: bun run build

            - name: Deploy to Cloudflare
              uses: cloudflare/wrangler-action@v3
              with:
                  apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Add Secrets to GitHub

1. Go to GitHub repo → Settings → Secrets
2. Add `CLOUDFLARE_API_TOKEN`
3. Add `DATABASE_URL`
4. Add `BETTER_AUTH_SECRET`

---

## Monitoring & Debugging

### View Logs

```bash
# Real-time logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST
```

### Performance Monitoring

Cloudflare Dashboard → Workers & Pages → Analytics:

- Request count
- Error rate
- CPU time
- Response time

### Database Monitoring

Neon Dashboard → Monitoring:

- Connection count
- Query performance
- Storage usage

---

## Scaling

### Cloudflare Workers

- **Free tier**: 100,000 requests/day
- **Paid tier**: Unlimited requests ($5/month + $0.50/million requests)
- **Auto-scaling**: Handles traffic spikes automatically

### Neon Database

- **Free tier**: 0.5 GB storage, 1 compute unit
- **Paid tier**: Scale compute and storage independently
- **Connection pooling**: Built-in, no configuration needed

---

## Backup & Recovery

### Database Backups

Neon provides automatic backups:

- **Point-in-time recovery**: Restore to any point in last 7 days (free tier)
- **Manual backups**: Create branch for long-term backup

```bash
# Create backup branch
neon branches create --name backup-2026-01-15
```

### Export Data

```bash
# Export all data
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## Security Checklist

- [ ] Use strong `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Enable Cloudflare WAF (Web Application Firewall)
- [ ] Set up rate limiting in Cloudflare
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only (Cloudflare default)
- [ ] Review Neon IP allowlist (if needed)
- [ ] Enable audit logging
- [ ] Set up monitoring alerts

---

## Troubleshooting

### Build Errors

**Error**: `Cannot find module '../db'` or `DATABASE_URL not set`

**Solution**: Use the async `getDb()` pattern in server functions:

```typescript
// ✅ Correct - works on Cloudflare Workers
const { getDb } = await import('~/lib/db')
const db = await getDb()

// ❌ Wrong - old pattern
const { getDb } = await import('~/lib/db')
const db = await getDb()
```

### Database Connection Errors

**Error**: `Connection timeout`

**Solution**: Check Neon project is active (not suspended):

```bash
# Wake up database
curl $DATABASE_URL
```

### Worker Errors

**Error**: `Script startup exceeded CPU limit`

**Solution**: Reduce bundle size:

```bash
# Analyze bundle
bun run build --analyze

# Check for large dependencies
du -sh node_modules/*
```

### Migration Errors

**Error**: `relation "table" already exists`

**Solution**: Check migration status:

```bash
bun run db:status

# If needed, rollback and re-run
bun run db:rollback
bun run db:migrate
```

---

## Performance Optimization

### Cloudflare

- Enable caching for static assets
- Use Cloudflare CDN for images
- Enable Brotli compression
- Set up custom cache rules

### Database

- Add indexes for common queries (already included)
- Use connection pooling (Neon default)
- Monitor slow queries in Neon dashboard
- Consider read replicas for high traffic

### Application

- Enable PWA caching
- Optimize images (WebP format)
- Lazy load components
- Use React.memo for expensive components

---

## Cost Estimation

### Free Tier (Suitable for small farms)

- **Cloudflare Workers**: 100,000 requests/day
- **Neon Database**: 0.5 GB storage, 1 compute unit
- **Total**: $0/month

### Paid Tier (Suitable for medium farms)

- **Cloudflare Workers**: $5/month + usage
- **Neon Database**: $19/month (2 compute units, 10 GB)
- **Total**: ~$25/month

### Enterprise (Large farms, multiple locations)

- **Cloudflare Workers**: Custom pricing
- **Neon Database**: Custom pricing
- **Total**: Contact sales

---

## Next Steps

1. **Set up monitoring**: Configure alerts for errors
2. **Enable backups**: Schedule regular database backups
3. **Custom domain**: Add your farm's domain
4. **SMS/Email**: Configure production providers
5. **Onboarding**: Create first farm and invite users

---

## Support

- **Documentation**: [docs/INDEX.md](./INDEX.md)
- **GitHub Issues**: [github.com/yourusername/openlivestock/issues](https://github.com/yourusername/openlivestock/issues)
- **Community**: [Discord/Slack link]

---

**Last Updated**: January 15, 2026
