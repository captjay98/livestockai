---
name: Neon Setup
description: Set up Neon PostgreSQL database for OpenLivestock
---

# Neon Setup

Configure Neon PostgreSQL for OpenLivestock Manager.

## Steps

### 1. Create Neon Project

- Go to console.neon.tech
- Create new project
- Note the connection string

### 2. Configure Environment

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

### 3. Run Migrations

```bash
bun run db:migrate
```

### 4. Seed Database (Optional)

```bash
bun run db:seed
```

## Connection String Format

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

## Cloudflare Workers

Add `DATABASE_URL` to Cloudflare:

```bash
bunx wrangler secret put DATABASE_URL
```

## Troubleshooting

**Connection refused**

- Check sslmode=require is in URL
- Verify Neon project is active

**Timeout errors**

- Enable connection pooling in Neon dashboard
