# Feature: Database Schema Improvements and Seeder Enhancement

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Improve the LivestockAI Manager database schema by adding missing foreign key constraints, standardizing livestock type enums, and enhancing the seeder system to create more comprehensive and realistic demo data. This will ensure data integrity, prevent orphaned records, and provide better development/testing experience.

## User Story

As a developer working on LivestockAI Manager
I want a robust database schema with proper constraints and comprehensive seed data
So that I can develop features confidently knowing data integrity is enforced and have realistic test scenarios

## Problem Statement

The current database schema has several integrity issues:

1. Missing foreign key constraints allow orphaned records
2. Inconsistent livestock type enums across tables create confusion
3. Seeder creates minimal data that doesn't showcase all system capabilities
4. No validation of business rules at database level (e.g., structure capacity vs batch quantity)

## Solution Statement

Implement a phased approach to improve database integrity:

1. Add missing foreign key constraints to prevent orphaned records
2. Standardize livestock type enums across all tables
3. Enhance seeder to create comprehensive Nigerian farm scenarios
4. Add business rule validation at database level

## Feature Metadata

**Feature Type**: Enhancement/Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Database schema, seeders, type system
**Dependencies**: Kysely ORM, Neon PostgreSQL, existing migration system

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/lib/db/types.ts` (lines 1-500) - Why: Contains all database table interfaces and relationships
- `app/lib/db/migrations/2025-01-08-001-initial-schema.ts` (lines 1-800) - Why: Current schema definition with existing constraints
- `app/lib/db/seeds/production.ts` (lines 1-200) - Why: Current production seeder pattern
- `app/lib/db/seeds/development.ts` (lines 1-1000) - Why: Current development seeder with Nigerian farm data
- `app/lib/db/seeds/helpers.ts` (lines 1-100) - Why: Better Auth user creation patterns
- `app/features/batches/server.ts` (lines 1-100) - Why: Batch creation and validation patterns
- `package.json` (lines 10-20) - Why: Database script commands

### New Files to Create

- `app/lib/db/migrations/2026-01-14-002-add-foreign-key-constraints.ts` - Add missing FK constraints
- `app/lib/db/migrations/2026-01-14-003-standardize-livestock-enums.ts` - Align livestock type enums
- `app/lib/db/seeds/comprehensive-demo.ts` - Enhanced demo data with all livestock types

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Kysely Schema Documentation](https://kysely.dev/docs/schema)
  - Specific section: Foreign key constraints and migrations
  - Why: Required for implementing proper FK constraints
- [PostgreSQL CHECK Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS)
  - Specific section: Enum validation with CHECK constraints
  - Why: Shows proper enum constraint patterns
- [Better Auth Users & Accounts](https://www.better-auth.com/docs/concepts/users-accounts)
  - Specific section: User creation patterns
  - Why: Required for seeder user creation

### Patterns to Follow

**Migration Pattern:**

```typescript
// From existing migration file
export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE table_name ADD CONSTRAINT constraint_name CHECK (column IN ('value1', 'value2'))`.execute(
    db,
  )
}
```

**Foreign Key Pattern:**

```typescript
// From existing migration
.addColumn('foreignId', 'uuid', (col) =>
  col.references('other_table.id').onDelete('cascade')
)
```

**Seeder Pattern:**

```typescript
// From existing helpers.ts
const user = await createUserWithAuth(db, {
  email: 'user@example.com',
  password: 'password',
  name: 'User Name',
  role: 'user',
})
```

**Dynamic Import Pattern:**

```typescript
// Critical for Cloudflare Workers compatibility
const { db } = await import('../db')
```

---

## IMPLEMENTATION PLAN

### Phase 1: Schema Analysis and Constraint Addition

Analyze current schema gaps and add missing foreign key constraints to ensure referential integrity.

**Tasks:**

- Identify all missing foreign key relationships
- Create migration to add FK constraints
- Validate existing data compatibility

### Phase 2: Enum Standardization

Standardize livestock type enums across all tables to ensure consistency.

**Tasks:**

- Audit all livestock type enums in schema
- Create migration to align enum values
- Update type definitions to match

### Phase 3: Seeder Enhancement

Create comprehensive demo data that showcases all system capabilities with realistic Nigerian farm scenarios.

**Tasks:**

- Design 5 diverse farm scenarios
- Implement enhanced seeder with interconnected data
- Add inventory, financial, and operational records

### Phase 4: Validation and Testing

Ensure all changes work correctly and don't break existing functionality.

**Tasks:**

- Test migrations on clean database
- Validate seeder creates consistent data
- Run full test suite to ensure no regressions

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE app/lib/db/migrations/2026-01-14-002-add-foreign-key-constraints.ts

- **IMPLEMENT**: Migration to add missing foreign key constraints
- **PATTERN**: Follow existing migration pattern from `2025-01-08-001-initial-schema.ts:400-420`
- **IMPORTS**: `import { sql } from 'kysely'`, `import type { Kysely } from 'kysely'`
- **CONSTRAINTS**: Add FK constraints for:
  - `sales.batchId → batches.id` (optional, can be null)
  - `sales.customerId → customers.id` (optional, can be null)
  - `sales.invoiceId → invoices.id` (optional, can be null)
  - `expenses.batchId → batches.id` (optional, can be null)
  - `expenses.supplierId → suppliers.id` (optional, can be null)
  - `invoices.customerId → customers.id` (required)
  - `invoices.farmId → farms.id` (required)
  - `user_settings.defaultFarmId → farms.id` (optional, can be null)
- **GOTCHA**: Use `onDelete('set null')` for optional relationships, `onDelete('cascade')` for required
- **VALIDATE**: `bun run db:migrate`

### CREATE app/lib/db/migrations/2026-01-14-003-standardize-livestock-enums.ts

- **IMPLEMENT**: Migration to standardize livestock type enums across tables
- **PATTERN**: Follow CHECK constraint pattern from existing migration lines 414-417
- **ANALYSIS**: Current inconsistencies:
  - `batches.livestockType`: 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
  - `farms.type`: 'poultry' | 'fishery' | 'mixed' | 'cattle' | 'goats' | 'sheep' | 'bees' | 'multi'
  - `sales.livestockType`: includes 'eggs', 'honey', 'milk', 'wool', etc.
- **STANDARDIZE**: Align `farms.type` to use 'aquaculture' instead of 'fishery' to match farm_modules
- **UPDATE**: Add new sales livestock types to CHECK constraint
- **GOTCHA**: Must handle existing data - use ALTER TABLE to modify constraints
- **VALIDATE**: `bun run db:migrate`

### UPDATE app/lib/db/types.ts

- **IMPLEMENT**: Update TypeScript interfaces to match new constraints
- **PATTERN**: Follow existing interface patterns in types.ts
- **CHANGES**:
  - Update `FarmTable.type` to use 'aquaculture' instead of 'fishery'
  - Add new sales livestock types to `SaleTable.livestockType`
  - Ensure all foreign key fields are properly typed
- **IMPORTS**: No new imports needed
- **GOTCHA**: Keep existing field optionality (nullable fields stay nullable)
- **VALIDATE**: `bun run check`

### CREATE app/lib/db/seeds/comprehensive-demo.ts

- **IMPLEMENT**: Enhanced seeder with 5 diverse Nigerian farms showcasing all livestock types
- **PATTERN**: Follow structure from existing `development.ts` but more comprehensive
- **FARMS**: Create 5 farms:
  1. Sunrise Poultry Farm (Kaduna) - Broilers + Layers with complete lifecycle
  2. Blue Waters Aquaculture (Ibadan) - Catfish + Tilapia with water quality monitoring
  3. Savanna Livestock Ranch (Kano) - Cattle + Goats with grazing management
  4. Golden Hive Apiary (Enugu) - Bees with honey production cycles
  5. Green Valley Mixed Farm (Jos) - Multi-species with integrated operations
- **DATA**: Each farm should have:
  - Complete batch lifecycle (acquisition → growth → harvest/sale)
  - Feed records with realistic consumption patterns
  - Health records (vaccinations, treatments)
  - Financial records (sales, expenses, invoices)
  - Inventory management (feed, medications)
  - Growth monitoring (weight samples, mortality tracking)
- **IMPORTS**: `import { db } from '../index'`, `import { createUserWithAuth } from './helpers'`
- **GOTCHA**: Use realistic Nigerian data (locations, phone numbers, pricing in NGN)
- **VALIDATE**: `bun run db:seed:comprehensive` (add script to package.json)

### UPDATE package.json

- **IMPLEMENT**: Add new seeder script
- **PATTERN**: Follow existing db script pattern
- **ADD**: `"db:seed:comprehensive": "bun run app/lib/db/seeds/comprehensive-demo.ts"`
- **GOTCHA**: Maintain existing script order and naming convention
- **VALIDATE**: `bun run db:seed:comprehensive`

### CREATE app/lib/db/migrations/2026-01-14-004-add-business-rule-constraints.ts

- **IMPLEMENT**: Add business rule validation at database level
- **PATTERN**: Follow CHECK constraint pattern from existing migration
- **CONSTRAINTS**:
  - Batch quantity validation: `currentQuantity >= 0 AND currentQuantity <= initialQuantity`
  - Date validation: `acquisitionDate <= CURRENT_DATE`
  - Price validation: `costPerUnit > 0 AND (targetPricePerUnit IS NULL OR targetPricePerUnit > 0)`
  - Mortality validation: `quantity > 0`
  - Feed validation: `quantityKg > 0 AND cost >= 0`
- **GOTCHA**: Use proper PostgreSQL syntax for date and numeric comparisons
- **VALIDATE**: `bun run db:migrate`

### UPDATE app/lib/db/seeds/development.ts

- **IMPLEMENT**: Update existing development seeder to use new enum values
- **PATTERN**: Maintain existing structure but fix enum inconsistencies
- **CHANGES**:
  - Change 'fishery' to 'aquaculture' in farm types
  - Ensure all livestock types match new constraints
  - Add missing foreign key relationships
- **GOTCHA**: Preserve existing data structure and relationships
- **VALIDATE**: `bun run db:seed:dev`

### CREATE tests/database/schema-integrity.test.ts

- **IMPLEMENT**: Tests to validate schema integrity and constraints
- **PATTERN**: Follow existing test patterns in tests/ directory
- **TESTS**:
  - Foreign key constraint enforcement
  - Enum value validation
  - Business rule constraint validation
  - Seeder data integrity
- **IMPORTS**: `import { describe, it, expect, beforeEach } from 'vitest'`
- **GOTCHA**: Use test database, not production
- **VALIDATE**: `bun test tests/database/schema-integrity.test.ts`

---

## TESTING STRATEGY

### Unit Tests

Test individual constraints and validation rules:

- Foreign key constraint enforcement
- Enum value validation
- Business rule constraints
- Seeder helper functions

### Integration Tests

Test complete workflows:

- Full seeder execution without errors
- Migration rollback and re-application
- Cross-table relationship integrity
- Realistic farm operation scenarios

### Edge Cases

Test constraint edge cases:

- Orphaned record prevention
- Invalid enum value rejection
- Business rule violation handling
- Null value handling in optional relationships

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
bun run check
bun run lint
```

### Level 2: Database Schema

```bash
bun run db:reset
bun run db:migrate
```

### Level 3: Seeder Validation

```bash
bun run db:seed:prod
bun run db:reset
bun run db:seed:dev
bun run db:reset
bun run db:seed:comprehensive
```

### Level 4: Unit Tests

```bash
bun test
```

### Level 5: Integration Validation

```bash
# Test complete workflow
bun run db:reset
bun run db:migrate
bun run db:seed:comprehensive
# Verify data integrity manually or with queries
```

---

## ACCEPTANCE CRITERIA

- [ ] All missing foreign key constraints added and enforced
- [ ] Livestock type enums standardized across all tables
- [ ] Comprehensive demo seeder creates realistic Nigerian farm data
- [ ] Business rule constraints prevent invalid data entry
- [ ] All existing functionality continues to work
- [ ] Migration system handles schema changes gracefully
- [ ] Seeder creates interconnected, realistic data relationships
- [ ] TypeScript types match database schema exactly
- [ ] All validation commands pass with zero errors
- [ ] Test coverage includes constraint validation

---

## COMPLETION CHECKLIST

- [ ] All migrations created and tested
- [ ] TypeScript types updated to match schema
- [ ] Comprehensive seeder implemented with 5 diverse farms
- [ ] Business rule constraints added
- [ ] Existing seeders updated for compatibility
- [ ] Test suite covers schema integrity
- [ ] All validation commands pass
- [ ] Documentation updated with new constraints
- [ ] No regressions in existing functionality
- [ ] Foreign key relationships properly enforced

---

## NOTES

**Migration Strategy**: Use separate migrations for each concern (FK constraints, enum standardization, business rules) to allow granular rollback if needed.

**Data Integrity**: The new constraints may reveal existing data inconsistencies. Plan to clean up any orphaned records before applying constraints.

**Performance**: Adding foreign key constraints may impact write performance slightly, but the data integrity benefits outweigh this cost.

**Nigerian Context**: The comprehensive seeder should reflect realistic Nigerian farming practices, locations, and market conditions to provide authentic test scenarios.

**Backward Compatibility**: Ensure all changes are backward compatible with existing application code. Update type definitions but maintain API compatibility.
