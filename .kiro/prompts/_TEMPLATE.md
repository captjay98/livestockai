# OpenLivestock Manager - Prompt Template

This template defines the standard structure for all prompts in the OpenLivestock Manager project.

## Template Structure

```markdown
---
description: 'Brief description of what this prompt does'
argument-hint: '[optional-argument-description]' # Only if prompt accepts arguments
---

# Prompt Title

Brief one-line description of the prompt's purpose.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management (poultry, fish, cattle, goats, sheep, bees)
**Tech Stack**: TanStack Start, Kysely ORM, Neon PostgreSQL, Cloudflare Workers
**Target Users**: Nigerian farmers with varying technical skills

## Objective

Clear statement of what this prompt accomplishes.

## Prerequisites

- [ ] Required setup or conditions
- [ ] Dependencies or prior steps

## MCP Integration (if applicable)

**Available MCP Servers:**

- `neon`: Database queries, schema inspection
- `cloudflare-bindings`: Workers, KV, R2 management
- `cloudflare-builds`: Deployment status
- `cloudflare-observability`: Logs and debugging

**Example MCP Usage:**
```

neon_get_database_tables
neon_run_sql "SELECT \* FROM batches LIMIT 5"
cloudflare-builds\_\_workers_builds_list_builds

````

## Process

### Step 1: [Action Name]

**What to do:**
- Specific action items
- Clear instructions

**Commands/Queries:**
```bash
# Example command
bun run [command]
````

**Expected Output:**

- What success looks like
- What to check for

### Step 2: [Action Name]

[Continue pattern...]

## OpenLivestock-Specific Patterns

### Database Patterns (Kysely)

```typescript
// Always use dynamic imports for Cloudflare Workers
const { db } = await import('../db')

// Type-safe queries
const batches = await db
  .selectFrom('batches')
  .where('farmId', '=', farmId)
  .select(['id', 'batchName', 'status'])
  .execute()
```

### Server Function Pattern (TanStack Start)

```typescript
export const getData = createServerFn({ method: 'GET' })
  .validator(z.object({ farmId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { db } = await import('../db')
    return db.selectFrom('table').execute()
  })
```

### Key Tables Reference

- `batches`: Livestock batches (poultry/fish)
- `mortality_records`: Death tracking
- `feed_records`: Feed consumption
- `weight_samples`: Growth tracking
- `sales`, `expenses`: Financial records
- `farms`, `users`: Core entities

## Validation Commands

```bash
# Verify changes work
bun run lint
bun run check
bun test

# Database validation
bun run db:migrate --dry-run

# Build validation
bun run build
```

## Success Criteria

- [ ] Specific measurable outcome 1
- [ ] Specific measurable outcome 2
- [ ] All validation commands pass

## Error Handling

### Common Issues

**Issue**: [Description]
**Solution**: [How to fix]

**Issue**: [Description]
**Solution**: [How to fix]

## Related Prompts

- `@related-prompt-1` - When to use instead
- `@related-prompt-2` - For follow-up tasks

## Output Format

[Define expected output structure if applicable]

---

## Instructions for Assistant

### Workflow

1. Step-by-step execution guidance
2. Decision points and branching logic
3. When to ask user for input

### Key Principles

- Be specific to OpenLivestock Manager
- Use actual project patterns and examples
- Leverage MCP servers for data access
- Provide actionable, executable steps
- Include validation at each step

```

## Quality Checklist

Every prompt should have:

- [ ] **Metadata**: description, argument-hint (if needed)
- [ ] **Context**: Project, tech stack, target users
- [ ] **Objective**: Clear goal statement
- [ ] **Prerequisites**: Required setup
- [ ] **MCP Integration**: Relevant MCP usage examples
- [ ] **Process**: Step-by-step instructions with commands
- [ ] **OpenLivestock Patterns**: Project-specific code examples
- [ ] **Validation Commands**: How to verify success
- [ ] **Success Criteria**: Measurable outcomes
- [ ] **Error Handling**: Common issues and solutions
- [ ] **Related Prompts**: Cross-references
- [ ] **Instructions for Assistant**: Execution guidance

## Scoring Criteria (5/5 Quality)

| Criteria | 5/5 Standard |
|----------|--------------|
| **OpenLivestock Specificity** | Uses actual project patterns, tables, and examples |
| **Tech Stack Integration** | Correct TanStack Start, Kysely, Neon, Cloudflare patterns |
| **Clear Instructions** | Step-by-step with commands and expected outputs |
| **Actionable Outputs** | Produces executable results, not just analysis |
| **MCP Integration** | Leverages available MCP servers appropriately |
| **Validation** | Includes verification commands and success criteria |
| **Error Handling** | Addresses common issues with solutions |
| **Format Consistency** | Follows this template structure |
```
