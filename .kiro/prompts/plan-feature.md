---
description: 'Create comprehensive feature plan with deep codebase analysis and research'
---

# Plan a new task

## Mission

Transform a feature request into a **comprehensive implementation plan** through systematic codebase analysis, external research, and strategic planning.

**Project Context**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Tech Stack**: TanStack Start + React 19 + Kysely + Neon PostgreSQL + Cloudflare Workers
**Architecture**: Server functions with dynamic imports, type-safe queries, multi-currency, i18n

**Core Principle**: We do NOT write code in this phase. Our goal is to create a context-rich implementation plan that enables one-pass implementation success for ai agents.

**Key Philosophy**: Context is King. The plan must contain ALL information needed for implementation - patterns, mandatory reading, documentation, validation commands - so the execution agent succeeds on the first attempt.

## Planning Process

### Phase 1: Feature Understanding

**Get the Feature Request:**

First, check if we're continuing a conversation:

> Are we planning the feature we've been discussing, or would you like to plan something new?
>
> If we've been discussing a feature, I can use that context. Otherwise, please describe what you'd like me to plan.

Wait for their response, then extract:

- What needs to be built/fixed/changed
- Why it's needed (if mentioned)
- Any specific requirements or constraints
- Expected outcome

**Deep Feature Analysis:**

- Extract the core problem being solved
- Identify user value and business impact
- Determine feature type: New Capability/Enhancement/Refactor/Bug Fix
- Assess complexity: Low/Medium/High
- Map affected systems and components

**Create User Story Format Or Refine If Story Was Provided By The User:**

```
As a <type of user>
I want to <action/goal>
So that <benefit/value>
```

### Phase 2: Codebase Intelligence Gathering

**Use specialized agents and parallel analysis:**

**1. Project Structure Analysis**

OpenLivestock-specific structure:

- **Server functions**: `app/features/{feature}/server.ts` with dynamic imports
- **Types**: `app/lib/db/types.ts` for database, `app/features/{feature}/types.ts` for feature types
- **Routes**: `app/routes/_auth/{feature}/` (directory-based, protected)
- **Components**: `app/components/ui/` (base) and `app/components/dialogs/` (CRUD modals)
- **Database**: `app/lib/db/migrations/` for schema changes

Check:

- Does this feature need database changes? → Check `app/lib/db/types.ts`
- Does it need server functions? → Look at `app/features/*/server.ts` patterns
- Does it need UI? → Check existing dialogs and routes
- Does it affect multiple livestock types? → Check `app/features/modules/constants.ts`

**2. Pattern Recognition** (Use specialized subagents when beneficial)

OpenLivestock mandatory patterns:

- **Dynamic imports**: `const { db } = await import('~/lib/db')` in ALL server functions
- **Error handling**: Use `AppError` from `~/lib/errors` with typed error codes
- **Currency**: Use `useFormatCurrency()` hook, never hardcode symbols
- **i18n**: Use `useTranslation()` hook, never hardcode user-facing strings
- **Auth**: Use `requireAuth()` in server functions, check farm access with `checkFarmAccess()`
- **Validation**: Zod schemas for all server function inputs
- **Database**: Kysely type-safe queries, explicit column selection (no SELECT \*)

Search for similar implementations:

- Similar server functions in `app/features/*/server.ts`
- Similar dialogs in `app/components/dialogs/`
- Similar routes in `app/routes/_auth/*/`
- Similar tests in `tests/features/*/`

Check steering documents:

- `.kiro/steering/coding-standards.md` - Mandatory patterns
- `.kiro/steering/structure.md` - File organization
- `.kiro/steering/tech.md` - Architecture decisions

**3. Dependency Analysis**

OpenLivestock tech stack:

- **TanStack Start**: Server functions, SSR, file-based routing
- **TanStack Router**: Routes, loaders, search params
- **TanStack Query**: Caching, mutations, optimistic updates
- **Kysely**: Type-safe SQL queries
- **Neon**: Serverless PostgreSQL
- **Better Auth**: Authentication and sessions
- **Zod**: Schema validation
- **Tailwind CSS v4**: Styling
- **Lucide React**: Icons
- **React 19**: UI components

Check existing integrations:

- Database: `app/lib/db/index.ts`
- Auth: `app/features/auth/config.ts`
- Settings: `app/features/settings/` (currency, i18n, units)
- Modules: `app/features/modules/` (livestock type management)

**4. Testing Patterns**

OpenLivestock testing approach:

- **Framework**: Vitest + fast-check (property-based testing)
- **Location**: `tests/features/{feature}/`
- **Types**: Unit tests, property tests, integration tests
- **Coverage targets**: Financial 100%, Business logic 90%, Server functions 80%

Find similar test examples:

- Property tests: `tests/features/batches/batches.property.test.ts`
- Integration tests: `tests/features/notifications/notifications.integration.test.ts`
- Server function tests: `tests/features/settings/currency.test.ts`

Test patterns to follow:

- Property tests for calculations (FCR, profit, mortality rate)
- Integration tests for server functions with database
- Mock auth with test user IDs

**5. Integration Points**

OpenLivestock integration checklist:

- **Database**: Does it need new tables/columns? → Create migration in `app/lib/db/migrations/`
- **Types**: Update `app/lib/db/types.ts` for database changes
- **Server functions**: Create in `app/features/{feature}/server.ts` with `createServerFn()`
- **Routes**: Add to `app/routes/_auth/{feature}/` (protected) or `app/routes/` (public)
- **Navigation**: Update `app/components/navigation.tsx` if adding new page
- **Dialogs**: Create in `app/components/dialogs/` for CRUD operations
- **Farm context**: Use `useFarm()` hook for current farm selection
- **Settings**: Use `useFormatCurrency()`, `useFormatDate()`, `useTranslation()` hooks
- **Notifications**: Create notifications via `app/features/notifications/server.ts`
- **Audit logs**: Log actions via `app/features/logging/audit.ts`

Check if feature affects:

- Multiple livestock types → Check `MODULE_METADATA` in `app/features/modules/constants.ts`
- Financial calculations → Use currency utilities from `app/features/settings/currency.ts`
- User preferences → Check `UserSettingsTable` in `app/lib/db/types.ts`

**Clarify Ambiguities:**

- If requirements are unclear at this point, ask the user to clarify before you continue
- Get specific implementation preferences (libraries, approaches, patterns)
- Resolve architectural decisions before proceeding

### Phase 3: External Research & Documentation

**Use specialized subagents when beneficial for external research:**

**Documentation Gathering:**

- Research latest library versions and best practices
- Find official documentation with specific section anchors
- Locate implementation examples and tutorials
- Identify common gotchas and known issues
- Check for breaking changes and migration guides

**Technology Trends:**

- Research current best practices for the technology stack
- Find relevant blog posts, guides, or case studies
- Identify performance optimization patterns
- Document security considerations

**Compile Research References:**

```markdown
## Relevant Documentation

- [Library Official Docs](https://example.com/docs#section)
  - Specific feature implementation guide
  - Why: Needed for X functionality
- [Framework Guide](https://example.com/guide#integration)
  - Integration patterns section
  - Why: Shows how to connect components
```

### Phase 4: Deep Strategic Thinking

**Think Harder About:**

- How does this feature fit into the existing architecture?
- What are the critical dependencies and order of operations?
- What could go wrong? (Edge cases, race conditions, errors)
- How will this be tested comprehensively?
- What performance implications exist?
- Are there security considerations?
- How maintainable is this approach?

**Design Decisions:**

- Choose between alternative approaches with clear rationale
- Design for extensibility and future modifications
- Plan for backward compatibility if needed
- Consider scalability implications

### Phase 5: Plan Structure Generation

**Create comprehensive plan with the following structure:**

Whats below here is a template for you to fill for th4e implementation agent:

````markdown
# Feature: <feature-name>

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

<Detailed description of the feature, its purpose, and value to users>

## User Story

As a <type of user>
I want to <action/goal>
So that <benefit/value>

## Problem Statement

<Clearly define the specific problem or opportunity this feature addresses>

## Solution Statement

<Describe the proposed solution approach and how it solves the problem>

## Feature Metadata

**Feature Type**: [New Capability/Enhancement/Refactor/Bug Fix]
**Estimated Complexity**: [Low/Medium/High]
**Primary Systems Affected**: [List of main components/services]
**Dependencies**: [External libraries or services required]

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

<List files with line numbers and relevance>

- `path/to/file.py` (lines 15-45) - Why: Contains pattern for X that we'll mirror
- `path/to/model.py` (lines 100-120) - Why: Database model structure to follow
- `path/to/test.py` - Why: Test pattern example

### New Files to Create

- `path/to/new_service.py` - Service implementation for X functionality
- `path/to/new_model.py` - Data model for Y resource
- `tests/path/to/test_new_service.py` - Unit tests for new service

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Documentation Link 1](https://example.com/doc1#section)
  - Specific section: Authentication setup
  - Why: Required for implementing secure endpoints
- [Documentation Link 2](https://example.com/doc2#integration)
  - Specific section: Database integration
  - Why: Shows proper async database patterns

### Patterns to Follow

**OpenLivestock Mandatory Patterns:**

**Server Function Pattern:**

```typescript
// app/features/{feature}/server.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AppError } from '~/lib/errors'

export const myFunction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      /* schema */
    }),
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()

    const { db } = await import('~/lib/db') // MUST be dynamic

    try {
      // Implementation
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', { cause: error })
    }
  })
```
````

**Currency Pattern:**

```typescript
// In components
import { useFormatCurrency } from '~/features/settings'

const { format: formatCurrency, symbol } = useFormatCurrency()
// Use: formatCurrency(amount) and {symbol}
```

**i18n Pattern:**

```typescript
// In components
import { useTranslation } from 'react-i18next'

const { t } = useTranslation(['feature', 'common'])
// Use: t('key', { defaultValue: 'Fallback' })
```

**Database Query Pattern:**

```typescript
// Explicit column selection, type-safe
const results = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.species', 'farms.name as farmName'])
  .where('batches.farmId', '=', farmId)
  .execute()
```

**Error Handling Pattern:**

```typescript
// Use AppError with typed codes
throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })
throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
throw new AppError('VALIDATION_ERROR', { metadata: { field: 'quantity' } })
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

<Describe foundational work needed before main implementation>

**Tasks:**

- Set up base structures (schemas, types, interfaces)
- Configure necessary dependencies
- Create foundational utilities or helpers

### Phase 2: Core Implementation

<Describe the main implementation work>

**Tasks:**

- Implement core business logic
- Create service layer components
- Add API endpoints or interfaces
- Implement data models

### Phase 3: Integration

<Describe how feature integrates with existing functionality>

**Tasks:**

- Connect to existing routers/handlers
- Register new components
- Update configuration files
- Add middleware or interceptors if needed

### Phase 4: Testing & Validation

<Describe testing approach>

**Tasks:**

- Implement unit tests for each component
- Create integration tests for feature workflow
- Add edge case tests
- Validate against acceptance criteria

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task Format Guidelines

Use information-dense keywords for clarity:

- **CREATE**: New files or components
- **UPDATE**: Modify existing files
- **ADD**: Insert new functionality into existing code
- **REMOVE**: Delete deprecated code
- **REFACTOR**: Restructure without changing behavior
- **MIRROR**: Copy pattern from elsewhere in codebase

### {ACTION} {target_file}

- **IMPLEMENT**: {Specific implementation detail}
- **PATTERN**: {Reference to existing pattern - file:line}
- **IMPORTS**: {Required imports and dependencies}
- **GOTCHA**: {Known issues or constraints to avoid}
- **VALIDATE**: `{executable validation command}`

<Continue with all tasks in dependency order...>

---

## TESTING STRATEGY

OpenLivestock testing approach:

### Unit Tests

**Location**: `tests/features/{feature}/`
**Framework**: Vitest + fast-check
**Coverage Target**: 80%+ (90%+ for business logic, 100% for financial calculations)

Design unit tests following existing patterns:

- Property tests for calculations (see `tests/features/batches/fcr.property.test.ts`)
- Unit tests for utilities (see `tests/features/settings/currency.test.ts`)
- Mock database with test data

### Integration Tests

**Scope**: Server functions with database operations
**Pattern**: See `tests/features/notifications/notifications.integration.test.ts`

Test:

- Server function authentication
- Database CRUD operations
- Error handling (AppError codes)
- Farm access control

### Edge Cases

OpenLivestock-specific edge cases to test:

- Multi-currency calculations (different decimal separators)
- Multi-language strings (Unicode handling)
- Offline/online state transitions
- Farm access permissions
- Module-specific features (livestock type filtering)
- Batch quantity updates (mortality, sales)
- Date formatting across locales

---

## VALIDATION COMMANDS

OpenLivestock validation suite - execute in order, fail fast:

### Level 1: Syntax & Style

```bash
# Type checking (fail fast)
npx tsc --noEmit || exit 1

# Linting (fail fast)
bun run lint || exit 1
```

### Level 2: Unit Tests

```bash
# Run all tests (fail fast)
bun run test --run || exit 1
```

### Level 3: Build Verification

```bash
# Verify production build works
bun run build || exit 1
```

### Level 4: Database Validation (if schema changed)

```bash
# Run migrations
bun run db:migrate

# Verify with Neon MCP
neon__get_database_tables
neon__describe_table_schema {table_name}
```

### Complete Validation

```bash
# Run all checks
bun run check && bun run test --run && bun run build
```

# Run specific test file

bun run test path/to/test.ts

# Run with coverage

bun run test --coverage

````

### Level 3: Integration Tests

```bash
# Run integration tests (if separate)
bun run test tests/integration

# Run full test suite
bun run test --run
````

### Level 4: Manual Validation

<Feature-specific manual testing steps - API calls, UI testing, etc.>

### Level 5: Additional Validation (Optional)

<MCP servers or additional CLI tools if available>

---

## ACCEPTANCE CRITERIA

OpenLivestock feature completion checklist:

- [ ] Feature implements all specified functionality
- [ ] All validation commands pass: `bun run check && bun run test --run && bun run build`
- [ ] Test coverage meets requirements (80%+ overall, 90%+ business logic, 100% financial)
- [ ] Integration tests verify end-to-end workflows
- [ ] Code follows OpenLivestock patterns:
  - [ ] Dynamic imports in server functions
  - [ ] AppError for error handling
  - [ ] useFormatCurrency() for currency display
  - [ ] useTranslation() for user-facing strings
  - [ ] requireAuth() and checkFarmAccess() for protected operations
  - [ ] Kysely type-safe queries with explicit column selection
- [ ] No regressions in existing functionality (all 300+ tests pass)
- [ ] Database migration created (if schema changed)
- [ ] Types updated in `app/lib/db/types.ts` (if schema changed)
- [ ] Navigation updated (if new page added)
- [ ] Works across all 6 livestock types (if applicable)
- [ ] Multi-currency support (no hardcoded symbols)
- [ ] i18n support (no hardcoded strings)
- [ ] Mobile-responsive UI (if UI changes)
- [ ] Offline-compatible (if applicable)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

<Additional context, design decisions, trade-offs>

```

## Output Format

**Filename**: `.agents/plans/{kebab-case-descriptive-name}.md`

- Replace `{kebab-case-descriptive-name}` with short, descriptive feature name
- Examples: `add-user-authentication.md`, `implement-search-api.md`, `refactor-database-layer.md`

**Directory**: Create `.agents/plans/` if it doesn't exist

## Quality Criteria

### Context Completeness ✓

- [ ] All necessary patterns identified and documented
- [ ] External library usage documented with links
- [ ] Integration points clearly mapped
- [ ] Gotchas and anti-patterns captured
- [ ] Every task has executable validation command

### Implementation Ready ✓

- [ ] Another developer could execute without additional context
- [ ] Tasks ordered by dependency (can execute top-to-bottom)
- [ ] Each task is atomic and independently testable
- [ ] Pattern references include specific file:line numbers

### Pattern Consistency ✓

- [ ] Tasks follow existing codebase conventions
- [ ] New patterns justified with clear rationale
- [ ] No reinvention of existing patterns or utils
- [ ] Testing approach matches project standards

### Information Density ✓

- [ ] No generic references (all specific and actionable)
- [ ] URLs include section anchors when applicable
- [ ] Task descriptions use codebase keywords
- [ ] Validation commands are non interactive executable

## Success Metrics

**One-Pass Implementation**: Execution agent can complete feature without additional research or clarification

**Validation Complete**: Every task has at least one working validation command

**Context Rich**: The Plan passes "No Prior Knowledge Test" - someone unfamiliar with codebase can implement using only Plan content

**Confidence Score**: #/10 that execution will succeed on first attempt

## Report

After creating the Plan, provide:

- Summary of feature and approach
- Full path to created Plan file
- Complexity assessment
- Key implementation risks or considerations
- Estimated confidence score for one-pass success

## Agent Delegation

- `@backend-engineer` - Database and API pattern analysis
- `@frontend-engineer` - UI component pattern analysis
- `@livestock-specialist` - Domain-specific feature requirements

## Related Prompts

- `@execute` - Implement the generated plan
- `@code-review` - Review implementation quality
- `@prime` - Load project context before planning
```
