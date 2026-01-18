# Sync General Documentation

**Purpose**: Audit and update all user-facing and developer documentation to reflect current codebase patterns

**Category**: Documentation Maintenance

**When to use**:

- After completing major features
- Before releases
- When onboarding new developers
- Monthly maintenance
- After adopting new patterns (JSDoc, i18n, etc.)

---

## What This Prompt Does

1. **Audits Documentation Accuracy**
   - Checks for outdated patterns and paths
   - Identifies missing features in docs
   - Verifies code examples still work
   - Detects stale statistics

2. **Identifies Documentation Debt**
   - New features not documented
   - Deprecated patterns still referenced
   - Inconsistent examples
   - Missing best practices

3. **Updates Documentation**
   - README.md
   - AGENTS.md
   - docs/ guides (ARCHITECTURE, DEPLOYMENT, TESTING, DATABASE)
   - Steering files (coding-standards, structure, tech)
   - DEVLOG.md (if needed)

4. **Validates Changes**
   - Checks all links work
   - Verifies code examples compile
   - Ensures consistency across docs

---

## Usage

```bash
# Full audit and update
@sync-guides

# Check only (no updates)
@sync-guides --check-only

# Update specific doc
@sync-guides --file README.md

# Update steering files only
@sync-guides --steering-only
```

---

## Implementation

You are a documentation specialist. Your task is to ensure all documentation accurately reflects the current codebase.

### Step 1: Audit Current State

Check for common issues:

**Outdated Paths**:

```bash
# Check for old app/lib/ references (should be app/features/)
grep -r "app/lib/batches" docs/ .kiro/steering/ AGENTS.md README.md

# Check for old route patterns
grep -r "_auth.batches.tsx" docs/ .kiro/steering/ AGENTS.md
```

**Missing Features**:

```bash
# Count actual features
feature_count=$(find app/features -type d -maxdepth 1 | wc -l)

# Check if docs mention correct count
grep -c "features" README.md
```

**Stale Statistics**:

```bash
# Check route count
route_count=$(find app/routes/_auth -name "*.tsx" | wc -l)

# Check if AGENTS.md has correct count
grep "Routes:" AGENTS.md
```

### Step 2: Identify Documentation Debt

Create a checklist of issues found:

```markdown
Documentation Debt Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

README.md:
❌ References old app/lib/ structure (line 45)
❌ Missing i18n section
⚠️ Feature count outdated (says 24, actually 29)

AGENTS.md:
❌ Server function examples use static imports
❌ Missing JSDoc pattern examples
❌ No i18n integration guidance

docs/ARCHITECTURE.md:
⚠️ Missing i18n architecture section
✅ Diagrams up to date

.kiro/steering/coding-standards.md:
❌ No JSDoc standards documented
❌ No i18n patterns documented
⚠️ Currency formatting examples outdated

.kiro/steering/structure.md:
❌ Shows old flat route structure
❌ Missing examples/ directory
⚠️ File counts outdated

.kiro/steering/tech.md:
⚠️ Missing TypeDoc in tech stack
⚠️ Missing i18n infrastructure
```

### Step 3: Ask for Confirmation

Show summary and ask:

```
Found 15 documentation issues:
  • 8 outdated patterns
  • 4 missing features
  • 3 stale statistics

Update all documentation? (y/n)

Or select specific files:
  1. README.md (3 issues)
  2. AGENTS.md (3 issues)
  3. Steering files (6 issues)
  4. docs/ guides (3 issues)
```

### Step 4: Update Documentation

For each confirmed update:

**README.md**:

- Update feature count
- Add i18n status section
- Fix path references
- Update tech stack

**AGENTS.md**:

- Add JSDoc pattern examples
- Add i18n integration examples
- Update server function patterns
- Fix all path references

**Steering Files**:

- coding-standards.md: Add JSDoc and i18n patterns
- structure.md: Update directory layout, add examples/
- tech.md: Add TypeDoc, i18n infrastructure

**docs/ Guides**:

- ARCHITECTURE.md: Add i18n architecture section
- DEPLOYMENT.md: Update deployment steps if needed
- TESTING.md: Add JSDoc testing patterns
- DATABASE.md: Verify schema documentation

### Step 5: Validate Changes

After updates:

```bash
# Check for broken links
grep -r "http" docs/ README.md AGENTS.md | grep -v "^Binary"

# Verify code examples compile
# Extract code blocks and test them

# Check consistency
# Ensure same patterns used across all docs
```

### Step 6: Report Summary

```
Documentation Update Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files Updated:
  ✅ README.md (3 fixes)
  ✅ AGENTS.md (3 fixes)
  ✅ .kiro/steering/coding-standards.md (2 fixes)
  ✅ .kiro/steering/structure.md (3 fixes)
  ✅ .kiro/steering/tech.md (2 fixes)
  ✅ docs/ARCHITECTURE.md (1 fix)

Total Changes: 14 issues resolved

Next Steps:
  • Review changes with git diff
  • Commit with: git commit -m "docs: sync documentation with current patterns"
  • Consider running @sync-docs for API reference
```

---

## Common Patterns to Document

### JSDoc Standards

````typescript
/**
 * Brief description of what the function does
 *
 * @param userId - Description of parameter
 * @param data - Description of parameter
 * @returns Promise resolving to description
 * @throws {Error} When error condition occurs
 *
 * @example
 * ```typescript
 * const result = await myFunction('user-123', { ... })
 * ```
 */
export async function myFunction(userId: string, data: MyData) {
  // Implementation
}
````

### i18n Integration

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <Button>{t('common.save')}</Button>
    </div>
  )
}
```

### Server Function Pattern

```typescript
// ✅ Correct - Dynamic import for Cloudflare Workers
export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  const { db } = await import('~/lib/db')
  return db.selectFrom('table').execute()
})
```

---

## Options

**--check-only**: Audit without making changes
**--file <path>**: Update specific file only
**--steering-only**: Update steering files only
**--guides-only**: Update docs/ guides only

---

## Related Prompts

- **@sync-docs** - Update API reference documentation
- **@code-review** - Review code quality
- **@update-devlog** - Update DEVLOG.md with recent progress

---

## Notes

- Always review changes before committing
- Use conventional commit messages
- Consider creating a PR for major doc updates
- Run before releases to ensure docs are current
