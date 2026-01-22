---
description: 'Complete Neon PostgreSQL setup and configuration with MCP integration for OpenLivestock Manager'
---

# Neon Database Setup & Configuration

🔧 **Complete database setup - from initial configuration to advanced features.**

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Database**: Neon PostgreSQL (serverless)
**ORM**: Kysely (type-safe SQL)
**Tables**: 23 tables including batches, mortality_records, sales, expenses, notifications

## Step 0: Check Current State

First, let me understand your current database setup:

> What's your current database situation?
>
> Options:
>
> - `none` - No database setup yet
> - `partial` - Started setup but incomplete
> - `complete` - Database working, want advanced features
> - `issues` - Have database but experiencing problems

Wait for their response.

### If `none`:

> I can help you set up your database. Choose your preferred method:
>
> 1. **Automated Setup** (Recommended) - Run `@quickstart` for complete automated setup
> 2. **Manual Setup** - I'll guide you through manual Neon configuration here
>
> Which would you prefer? (1/2)

**If they choose 1:** Guide them to run `@quickstart` and stop here.

**If they choose 2:** Continue to Manual Setup section below.

### If `partial`:

> Let me check what's already configured...

**Verify with MCP:**

```
# Check if Neon is authenticated
neon__get_current_user

# Check for existing projects
neon__list_projects

# Check for databases
neon__list_databases
```

**Then ask:**

> I found: [summary of what exists]
>
> What would you like to do?
>
> - `continue` - Complete the setup
> - `restart` - Start fresh (will guide you)
> - `quickstart` - Use automated setup instead

### If `complete`:

> Great! Your database is set up. What advanced features are you interested in?
>
> 1. Database branching (for feature development)
> 2. Connection pooling (for production)
> 3. Performance optimization (indexes, query analysis)
> 4. Monitoring & alerts
> 5. Backup & recovery strategies
> 6. All of the above
>
> Choose one or more: (e.g., "1,2,3" or "all")

Skip to the relevant advanced feature sections.

### If `issues`:

> Let me help troubleshoot. What issues are you experiencing?
>
> Common issues:
>
> - Connection timeouts
> - Too many connections
> - Slow queries
> - Schema mismatches
> - Migration failures
>
> Describe your issue, or choose from above.

Skip to Error Handling & Troubleshooting section.

---

## Manual Setup (For `none` or `partial` users)

### Prerequisites

- [ ] Neon account (create at https://neon.tech)
- [ ] Neon MCP authenticated (OAuth)
- [ ] `.env` file exists in project root

### Step 1: Verify Neon Authentication

```
# Test Neon MCP connection
neon__get_current_user
```

**If authentication fails:**

```bash
# Authenticate via Neon MCP (opens browser)
# The MCP will prompt for OAuth authentication
```

**If MCP unavailable:**

> ⚠️ Neon MCP not available.
>
> Options:
>
> 1. Configure MCP in `.kiro/settings/mcp.json`
> 2. Use manual setup via Neon Console (I'll guide you)
>
> Which would you prefer? (1/2)

### Step 2: Create or Select Project

**List existing projects:**

```
neon__list_projects
```

**If no projects exist:**

```
# Create new project
neon__create_project "OpenLivestock-[timestamp]"
```

**If multiple projects exist:**

> I found [N] Neon projects:
>
> 1. Project A (ID: xxx)
> 2. Project B (ID: yyy)
> 3. Create new project
>
> Which project should we use? (1/2/3)

### Step 3: Create Databases

**Create production database:**

```
neon__create_database "openlivestock_prod"
```

**Create test database:**

```
neon__create_database "openlivestock_test"
```

**Progress:**

```
🔄 Creating production database... (15s)
✅ Database: openlivestock_prod

🔄 Creating test database... (15s)
✅ Database: openlivestock_test
```

### Step 4: Create Database User

```
neon__create_user "openlivestock_user" --password [secure-generated]
```

**Grant permissions:**

```
neon__run_sql "GRANT ALL PRIVILEGES ON DATABASE openlivestock_prod TO openlivestock_user"
neon__run_sql "GRANT ALL PRIVILEGES ON DATABASE openlivestock_test TO openlivestock_user"
```

### Step 5: Get Connection Strings

```
neon__get_connection_string "openlivestock_prod"
neon__get_connection_string "openlivestock_test"
```

### Step 6: Update Environment Variables

**Update `.env` file:**

```bash
# Production Database
DATABASE_URL=postgresql://openlivestock_user:***@***.neon.tech/openlivestock_prod?sslmode=require

# Test Database
DATABASE_URL_TEST=postgresql://openlivestock_user:***@***.neon.tech/openlivestock_test?sslmode=require

# Auth (if not already set)
BETTER_AUTH_SECRET=[generate-32-char-secret]
BETTER_AUTH_URL=http://localhost:3001
```

### Step 7: Run Migrations

**On production database:**

```bash
bun run db:migrate
```

**On test database:**

```bash
bun run db:test:setup
```

**Verify:**

```
neon__get_database_tables
```

Should show 23 tables.

### Step 8: Seed Data (Optional)

> Would you like to seed your database with data?
>
> 1. **Production** - Admin user + reference data only
> 2. **Development** - Full demo data (farms, batches, transactions)
> 3. **Skip** - Empty database
>
> Choose: (1/2/3)

**Based on choice:**

```bash
# Option 1
bun run db:seed

# Option 2
bun run db:seed:dev

# Option 3
# Skip
```

### Step 9: Verify Setup

```bash
# Test connection
bun dev

# Run tests
bun run test
```

**Manual setup complete!** ✅

---

---

## Advanced Features (For users with `complete` setup)

### 1. Database Branching (Feature Development)

Neon branches allow isolated development without affecting production:

**Create feature branch:**

```
neon__create_branch "feature-reports" --parent main
neon__create_branch "feature-mobile-optimization" --parent main
```

**Use cases:**

- Test migrations before production
- Develop features with production-like data
- Create demo environments for stakeholders

**Workflow:**

1. Create branch from main
2. Update local DATABASE_URL to branch endpoint
3. Develop and test
4. Merge migrations to main
5. Delete branch

### 2. Connection Pooling (Production)

Essential for Cloudflare Workers with many concurrent connections:

**Enable via Neon Console or MCP:**

1. Go to Project Settings → Connection Pooling
2. Enable pooling
3. Copy pooled connection string

**Update connection string:**

```bash
# Without pooling (development)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname

# With pooling (production)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname
```

**Recommended settings:**

- Pool mode: Transaction
- Pool size: 10-25 connections
- Idle timeout: 300 seconds

### 3. Performance Optimization

**Analyze slow queries via MCP:**

```
neon__run_sql "
  SELECT query, calls, mean_time, total_time
  FROM pg_stat_statements
  ORDER BY total_time DESC
  LIMIT 10
"
```

**Common OpenLivestock optimizations:**

**Index for batch queries:**

```sql
CREATE INDEX idx_batches_farm_status ON batches(farmId, status);
CREATE INDEX idx_mortality_batch_date ON mortality_records(batchId, recordedAt);
CREATE INDEX idx_sales_batch_date ON sales(batchId, date);
```

**Run via MCP:**

```
neon__run_sql "CREATE INDEX idx_batches_farm_status ON batches(farmId, status)"
```

**Analyze query performance:**

```
neon__run_sql "EXPLAIN ANALYZE SELECT * FROM batches WHERE farmId = 'xxx' AND status = 'active'"
```

### 4. Backup & Recovery

**Neon automatic backups:**

- Point-in-time recovery (PITR) enabled by default
- 7-day retention on free tier
- 30-day retention on paid plans

**Manual backup via MCP:**

```
neon__run_sql "
  COPY (SELECT * FROM batches) TO STDOUT WITH CSV HEADER
"
```

**Recovery scenarios:**

1. **Accidental deletion**: Use PITR to restore to point before deletion
2. **Bad migration**: Restore from branch or PITR
3. **Data corruption**: Contact Neon support with timestamp

### 5. Schema Management

**View current schema:**

```
neon__get_database_tables
neon__describe_table_schema "batches"
neon__describe_table_schema "mortality_records"
```

**Compare with Kysely types:**

```bash
cat app/lib/db/types.ts
```

**Verify schema sync:**

```
neon__run_sql "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'batches'
  ORDER BY ordinal_position
"
```

### 6. Monitoring & Alerts

**Database metrics via MCP:**

```
# Connection count
neon__run_sql "SELECT count(*) FROM pg_stat_activity"

# Database size
neon__run_sql "SELECT pg_size_pretty(pg_database_size(current_database()))"

# Table sizes
neon__run_sql "
  SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(tablename::text) DESC
"
```

**Set up alerts in Neon Console:**

- Connection count > 80% of limit
- Storage usage > 80%
- Query latency > 500ms

---

**Batch performance analysis:**

```
neon__run_sql "
  SELECT
    b.batchName,
    b.species,
    b.initialQuantity,
    b.currentQuantity,
    ROUND((b.initialQuantity - b.currentQuantity)::numeric / b.initialQuantity * 100, 2) as mortality_pct
  FROM batches b
  WHERE b.status = 'active'
  ORDER BY mortality_pct DESC
"
```

**Revenue summary:**

```
neon__run_sql "
  SELECT
    DATE_TRUNC('month', date) as month,
    SUM(totalAmount) as revenue,
    COUNT(*) as transactions
  FROM sales
  GROUP BY DATE_TRUNC('month', date)
  ORDER BY month DESC
  LIMIT 12
"
```

**Feed cost analysis:**

```
neon__run_sql "
  SELECT
    b.batchName,
    SUM(f.cost) as total_feed_cost,
    SUM(f.quantityKg) as total_feed_kg
  FROM feed_records f
  JOIN batches b ON f.batchId = b.id
  GROUP BY b.id, b.batchName
  ORDER BY total_feed_cost DESC
"
```

## Validation Commands

```bash
# Test database connection
bun run db:migrate --dry-run

# Verify schema
bun run db:migrate

# Test queries work
bun run test tests/
```

## Success Checklist

- [ ] Multiple environments configured (dev/staging/prod)
- [ ] Connection pooling enabled for production
- [ ] Performance indexes created
- [ ] Backup strategy understood
- [ ] Monitoring alerts configured
- [ ] MCP operations tested

## Error Handling

### Common Issues

**Issue**: Connection timeout
**Solution**: Enable connection pooling, check network

**Issue**: Too many connections
**Solution**: Use pooled endpoint, reduce pool size

**Issue**: Slow queries
**Solution**: Add indexes, analyze with EXPLAIN

**Issue**: Schema mismatch
**Solution**: Run migrations, verify Kysely types

## Related Prompts

- `@quickstart` - Initial database setup
- `@neon-migrate` - Database migrations
- `@neon-optimize` - Query optimization
- `@batch-analysis` - Analyze livestock data

---

## Instructions for Assistant

### Workflow

1. **Check current state** (Step 0) - Ask about their database situation
2. **Route appropriately**:
   - `none` → Offer quickstart or manual setup
   - `partial` → Assess what exists, offer to continue
   - `complete` → Ask which advanced features they want
   - `issues` → Troubleshoot specific problems
3. **Execute chosen path** - Guide through setup or advanced features
4. **Validate each step** - Test before proceeding
5. **Document changes** - Update environment files

### Interactive Approach

**Always ask first, don't assume:**

- What's their current state?
- What do they want to accomplish?
- Which features interest them?

**Tailor the experience:**

- New users → Recommend quickstart, offer manual as alternative
- Partial setup → Complete what's missing
- Complete setup → Focus on requested advanced features only
- Issues → Targeted troubleshooting

### Error Handling

**MCP unavailable:**

- Offer manual setup via Neon Console
- Provide step-by-step console instructions
- Continue without MCP where possible

**Multiple projects:**

- List all projects
- Let user choose
- Offer to create new if needed

**Database already exists:**

- Don't try to recreate
- Verify it's configured correctly
- Offer to use existing or create new

**Authentication fails:**

- Guide through OAuth flow
- Provide fallback instructions
- Check MCP configuration

### Key Principles

- **Interactive first** - Ask what user wants
- **Flexible paths** - Support quickstart, manual, or advanced
- **Validate state** - Check what exists before proceeding
- **Use MCP with fallbacks** - Don't fail if MCP unavailable
- **Provide specific commands** - Not just concepts
- **Include OpenLivestock context** - Use domain-specific examples
- **Test each step** - Validate before moving forward
