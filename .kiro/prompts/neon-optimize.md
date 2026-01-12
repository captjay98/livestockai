---
description: 'Optimize Neon PostgreSQL queries and performance'
---

# Neon Database Optimization

Analyze and optimize database queries for OpenLivestock Manager.

## Context

**Project**: OpenLivestock Manager - Livestock management for poultry and aquaculture farms
**Database**: PostgreSQL via Neon (serverless)
**ORM**: Kysely (type-safe SQL)

## Quick Analysis with MCP

### Check Current Schema

```
neon_get_database_tables
neon_describe_table_schema batches
neon_describe_table_schema sales
```

### Analyze Query Performance

```
neon_run_sql "EXPLAIN ANALYZE SELECT * FROM batches WHERE \"farmId\" = 'uuid-here'"
```

### Check Table Sizes

```
neon_run_sql "SELECT relname as table_name, pg_size_pretty(pg_total_relation_size(relid)) as total_size FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC"
```

## Index Analysis with MCP

### Check Existing Indexes

```
neon_run_sql "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'"
```

### Check Missing Indexes (Slow Queries)

```
neon_run_sql "SELECT schemaname, relname, seq_scan, idx_scan FROM pg_stat_user_tables WHERE seq_scan > idx_scan ORDER BY seq_scan DESC LIMIT 10"
```

### Recommended Indexes for OpenLivestock

```sql
-- Batch queries by farm
CREATE INDEX idx_batches_farm_id ON batches(farmId);

-- Feed records by batch and date
CREATE INDEX idx_feed_records_batch_date ON feed_records(batchId, recordDate);

-- Mortality by batch
CREATE INDEX idx_mortality_batch_id ON mortality_records(batchId);

-- Weight samples by batch
CREATE INDEX idx_weight_samples_batch_id ON weight_samples(batchId);

-- Sales by farm and date
CREATE INDEX idx_sales_farm_date ON sales(farmId, saleDate);
```

## Query Optimization Patterns

### Use Selective Columns

```typescript
// ❌ Avoid SELECT *
const batches = await db.selectFrom('batches').selectAll().execute()

// ✅ Select only needed columns
const batches = await db
  .selectFrom('batches')
  .select(['id', 'batchName', 'status'])
  .execute()
```

### Efficient Joins

```typescript
// ✅ Use specific join conditions
const data = await db
  .selectFrom('batches')
  .innerJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.batchName', 'farms.name'])
  .where('farms.id', '=', farmId)
  .execute()
```

### Pagination

```typescript
// ✅ Always paginate large result sets
const batches = await db
  .selectFrom('batches')
  .select(['id', 'batchName'])
  .limit(20)
  .offset(page * 20)
  .execute()
```

### Aggregations

```typescript
// ✅ Use database aggregations
const stats = await db
  .selectFrom('mortality_records')
  .select([
    'batchId',
    db.fn.sum('quantity').as('totalMortality'),
    db.fn.count('id').as('recordCount'),
  ])
  .groupBy('batchId')
  .execute()
```

## Connection Optimization

### Connection Pooling

Neon handles pooling automatically, but ensure:

- Use serverless driver for edge deployments
- Don't create new connections per request

### Query Batching

```typescript
// ✅ Batch related queries
const [batches, farms] = await Promise.all([
  db.selectFrom('batches').selectAll().execute(),
  db.selectFrom('farms').selectAll().execute(),
])
```

## Performance Monitoring

### Query Execution Time

```sql
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Table Statistics

```sql
SELECT
  relname,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows
FROM pg_stat_user_tables;
```

## Neon-Specific Optimizations

### Autoscaling

- Neon scales compute automatically
- Optimize for cold starts with smaller queries

### Branching for Testing

```bash
# Create branch for testing
neonctl branches create --name test-branch

# Test migrations on branch first
DATABASE_URL=branch-url bun run db:migrate
```

## Checklist

- [ ] Indexes on foreign keys
- [ ] Indexes on frequently filtered columns
- [ ] No SELECT \* in production queries
- [ ] Pagination on list queries
- [ ] Aggregations done in database
- [ ] Connection pooling configured

## Performance Benchmarks

| Query Type       | Target    | Warning   | Critical  |
| ---------------- | --------- | --------- | --------- |
| Simple SELECT    | <50ms     | 50-200ms  | >200ms    |
| JOIN query       | <100ms    | 100-500ms | >500ms    |
| Aggregation      | <200ms    | 200-1s    | >1s       |
| Full table scan  | Avoid     | -         | -         |

## Agent Delegation

- `@backend-engineer` - Query optimization and Kysely patterns
- `@data-analyst` - Complex query analysis and reporting

## Related Prompts

- `@neon-migrate` - Schema changes and migrations
- `@neon-setup` - Initial database configuration
- `@batch-analysis` - Queries that may need optimization
