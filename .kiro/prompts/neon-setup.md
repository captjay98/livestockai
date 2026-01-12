---
description: 'Advanced Neon PostgreSQL configuration with MCP integration for OpenLivestock Manager'
---

# Advanced Neon Database Configuration

🔧 **For users who completed @quickstart and want advanced Neon features.**

*If you haven't set up your basic database yet, run `@quickstart` first.*

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Database**: Neon PostgreSQL (serverless)
**ORM**: Kysely (type-safe SQL)
**Tables**: 24 tables including batches, mortality_records, sales, expenses

## Prerequisites

- [ ] Basic database setup complete (via @quickstart)
- [ ] Neon MCP authenticated (OAuth)
- [ ] Development environment working

## MCP Integration

**Verify current database state:**
```
neon_list_projects
neon_get_database_tables
neon_run_sql "SELECT COUNT(*) FROM batches"
```

## Advanced Features

### 1. Multiple Databases (Environments)

Create separate databases for different environments:

**Use Neon MCP:**
```
# Create staging database
neon_create_database "openlivestock_staging"

# Create test database  
neon_create_database "openlivestock_test"
```

**Configure environment files:**
```bash
# .env.development
DATABASE_URL=postgresql://user:pass@dev-endpoint/openlivestock_dev

# .env.staging
DATABASE_URL=postgresql://user:pass@staging-endpoint/openlivestock_staging

# .env.production
DATABASE_URL=postgresql://user:pass@prod-endpoint/openlivestock_prod
```

### 2. Database Branching (Feature Development)

Neon branches allow isolated development without affecting production:

**Create feature branch:**
```
neon_create_branch "feature-reports" --parent main
neon_create_branch "feature-mobile-optimization" --parent main
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

### 3. Connection Pooling (Production)

Essential for Cloudflare Workers with many concurrent connections:

**Enable in Neon Console:**
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

### 4. Performance Optimization

**Analyze slow queries via MCP:**
```
neon_run_sql "
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
CREATE INDEX idx_sales_batch_date ON sales(batchId, saleDate);
```

**Run via MCP:**
```
neon_run_sql "CREATE INDEX idx_batches_farm_status ON batches(farmId, status)"
```

**Analyze query performance:**
```
neon_run_sql "EXPLAIN ANALYZE SELECT * FROM batches WHERE farmId = 'xxx' AND status = 'active'"
```

### 5. Backup & Recovery

**Neon automatic backups:**
- Point-in-time recovery (PITR) enabled by default
- 7-day retention on free tier
- 30-day retention on paid plans

**Manual backup via MCP:**
```
neon_run_sql "
  COPY (SELECT * FROM batches) TO STDOUT WITH CSV HEADER
"
```

**Recovery scenarios:**
1. **Accidental deletion**: Use PITR to restore to point before deletion
2. **Bad migration**: Restore from branch or PITR
3. **Data corruption**: Contact Neon support with timestamp

### 6. Schema Management

**View current schema:**
```
neon_get_database_tables
neon_describe_table_schema "batches"
neon_describe_table_schema "mortality_records"
```

**Compare with Kysely types:**
```bash
cat app/lib/db/schema.ts
```

**Verify schema sync:**
```
neon_run_sql "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'batches'
  ORDER BY ordinal_position
"
```

### 7. Monitoring & Alerts

**Database metrics via MCP:**
```
# Connection count
neon_run_sql "SELECT count(*) FROM pg_stat_activity"

# Database size
neon_run_sql "SELECT pg_size_pretty(pg_database_size(current_database()))"

# Table sizes
neon_run_sql "
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

## OpenLivestock-Specific Queries

**Batch performance analysis:**
```
neon_run_sql "
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
neon_run_sql "
  SELECT 
    DATE_TRUNC('month', saleDate) as month,
    SUM(totalAmount) as revenue,
    COUNT(*) as transactions
  FROM sales
  GROUP BY DATE_TRUNC('month', saleDate)
  ORDER BY month DESC
  LIMIT 12
"
```

**Feed cost analysis:**
```
neon_run_sql "
  SELECT 
    b.batchName,
    SUM(f.costNgn) as total_feed_cost,
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
bun test app/lib/db/
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
1. **Verify prerequisites** - Basic setup complete
2. **Assess needs** - Ask what advanced features user wants
3. **Guide configuration** - Step-by-step with MCP commands
4. **Validate setup** - Test each feature works
5. **Document changes** - Update environment files

### Key Principles
- **Use MCP extensively** for database operations
- **Provide specific commands** not just concepts
- **Include OpenLivestock context** in examples
- **Validate each step** before proceeding
- **Consider production implications** for all changes
