# Sync API Documentation

**Purpose**: Audit and regenerate API reference documentation when server functions change

**Category**: Documentation Maintenance

**When to use**:

- After adding/modifying server functions
- After updating JSDoc comments
- Before committing API changes
- When API docs feel stale

---

## What This Prompt Does

1. **Audits JSDoc Coverage**
    - Scans all server.ts files for JSDoc comments
    - Identifies functions missing documentation
    - Checks for @param, @returns, @example tags
    - Reports coverage statistics

2. **Checks for Changes**
    - Compares current JSDoc with last generation
    - Identifies new/modified functions
    - Detects removed functions

3. **Regenerates Documentation**
    - Runs `bun run docs:generate`
    - Updates docs/api/ directory
    - Preserves custom README

4. **Validates Output**
    - Checks for TypeDoc errors
    - Verifies all modules documented
    - Reports generation statistics

---

## Usage

```bash
# Full audit and regeneration
@sync-docs

# Check coverage only (no regeneration)
@sync-docs --check-only

# Force regeneration (skip checks)
@sync-docs --force
```

---

## Implementation

You are an API documentation specialist. Your task is to ensure the API reference documentation stays in sync with the codebase.

### Step 1: Audit JSDoc Coverage

Scan all server function files:

```bash
find app/features -name "server.ts" -exec sh -c '
  file="$1"
  module=$(echo "$file" | sed "s|app/features/||" | sed "s|/server.ts||")
  count=$(grep -c "@param\|@returns\|@example" "$file" 2>/dev/null || echo "0")

  if [ "$count" -ge 20 ]; then
    echo "✅ $module: $count lines (EXCELLENT)"
  elif [ "$count" -ge 10 ]; then
    echo "⚠️  $module: $count lines (GOOD)"
  elif [ "$count" -ge 5 ]; then
    echo "⚠️  $module: $count lines (NEEDS WORK)"
  else
    echo "❌ $module: $count lines (MINIMAL)"
  fi
' _ {} \;
```

### Step 2: Check for Undocumented Functions

For each server.ts file, identify exported functions without JSDoc:

```typescript
// Look for patterns like:
export async function functionName(
export const functionName = createServerFn

// Check if preceded by /** ... */ block
```

Report any functions missing documentation.

### Step 3: Ask for Confirmation

Show summary:

```
API Documentation Audit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Modules with excellent docs: 9/24 (37%)
Modules needing work: 15/24 (63%)
Undocumented functions: 12

Regenerate API documentation? (y/n)
```

### Step 4: Regenerate Documentation

If confirmed:

```bash
echo "Regenerating API documentation..."
bun run docs:generate

# Check for errors
if [ $? -eq 0 ]; then
  echo "✅ Documentation generated successfully"
  echo "📄 View at: docs/api/modules.md"
else
  echo "❌ Documentation generation failed"
  exit 1
fi
```

### Step 5: Report Statistics

```bash
# Count generated files
file_count=$(find docs/api -type f | wc -l)
echo "Generated files: $file_count"

# Check for modules
test -f docs/api/modules.md && echo "✅ Entry point exists"
test -d docs/api/features && echo "✅ Features documented"
test -d docs/api/hooks && echo "✅ Hooks documented"
test -d docs/api/lib && echo "✅ Utilities documented"
```

---

## Options

**--check-only**: Audit coverage without regenerating
**--force**: Skip audit, regenerate immediately
**--module <name>**: Check specific module only

---

## Agent Delegation

For documentation tasks:

- `@backend-engineer` - Review and improve JSDoc for server functions
- `@frontend-engineer` - Review and improve JSDoc for React components
- `@qa-engineer` - Validate documentation accuracy and completeness

### When to Delegate

- **Missing JSDoc** - Delegate to relevant engineer to add documentation
- **Inaccurate docs** - Delegate to code owner for corrections
- **Complex APIs** - Delegate for detailed examples and explanations

## Related Prompts

- **@sync-guides** - Update general documentation
- **@code-review** - Review code quality including JSDoc
- **@update-devlog** - Document changes in DEVLOG

---

## Notes

- TypeDoc configuration: `typedoc.json`
- Output directory: `docs/api/`
- Requires: TypeDoc installed (`bun install`)
- Generation time: ~5-10 seconds
