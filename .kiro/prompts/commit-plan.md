---
description: Create structured commit plan from current changes
---

# Commit Plan Generator

Automatically analyze uncommitted changes and create a structured commit plan following conventional commit format.

## Context

**Project**: OpenLivestock Manager  
**Commit Convention**: Conventional Commits (type(scope): description)  
**Types**: feat, fix, refactor, docs, test, chore, perf, style

## Workflow

### Step 0: Pre-Commit Check

**Check git status first:**

```bash
git status
```

**Ask user interactively:**

1. **If no changes**: "Working tree clean. Nothing to commit."
2. **If changes exist**:
    - "Found X modified files. Run validation first? (y/n)"
    - "Commit strategy: (a)tomic commits or (g)rouped by feature?"
    - "Include all changes or (s)elective files?"

**If validation requested:**

```bash
npx tsc --noEmit  # TypeScript check
bun run lint      # ESLint check
```

**Handle validation failures interactively:**

- Show errors clearly
- Ask: "(f)ix issues, (s)kip validation, or (a)bort?"

### 1. Analyze Current Changes

```bash
git status --short
git diff --stat
git diff --name-only
```

### 2. Categorize Changes

Group files by:

- **Feature area**: app/features/X, app/routes/X
- **Change type**: new files (feat), bug fixes (fix), refactoring (refactor)
- **File type**: .md (docs), tests/ (test), package.json (chore)

**Categorization Rules**:

- `app/features/` or `app/routes/` → feat/fix/refactor (check git diff)
- `app/lib/db/migrations/` → feat(database) or refactor(database)
- `app/lib/db/seeds/` → feat(seeds) or refactor(seeds)
- `app/components/` → feat(ui) or fix(ui)
- `.md files` → docs
- `tests/` → test
- `package.json`, `.kiro/` → chore
- `.agents/` → docs

### 3. Generate Commit Messages

For each group, create message:

```
<type>(<scope>): <short description>

<detailed body with bullet points>
- Change 1
- Change 2
- Change 3

<optional metrics or notes>
```

**Examples**:

```
feat(database): add 28 new enum values for Nigerian market

- Structure types: +5 (tank, tarpaulin, raceway, feedlot, kraal)
- Mortality causes: +5 (starvation, injury, poisoning, suffocation, culling)
- Payment methods: +3 (mobile_money, check, card)

Supports all 6 livestock types and Nigerian market patterns
```

```
fix(ui): correct provider order in root layout

- Move SettingsProvider before FarmProvider
- FarmProvider depends on usePreferences() from SettingsProvider

Fixes: useSettings must be used within SettingsProvider error
```

### 4. Create Execution Plan

Generate markdown file with:

- List of commits with messages
- Files included in each commit
- Execution commands
- Validation checklist

### 5. Execute Commits

For each commit:

```bash
git add <files>
git commit -m "<message>"
```

Show progress and final summary.

## Output Format

```markdown
# Commit Plan - Day X (Date)

## Summary

- X commits planned
- Y files changed
- Z insertions, W deletions

## Commits

### Commit 1: <type>(<scope>): <description>

**Files**: (list)
**Message**:
```

<full commit message>
```

### Commit 2: ...

## Execution

```bash
# Commit 1
git add <files>
git commit -m "<message>"

# Commit 2
...
```

## Validation

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Tests passing
- [ ] Git status clean

````

## Execution Steps

1. **Run pre-commit check** (Step 0)
   - Check git status
   - Ask about validation and commit strategy
   - Run validation if requested

2. **Analyze changes**
   ```bash
   git status --short
   git diff --stat
   ```

3. **Categorize changes** by feature/type intelligently

4. **Generate commit messages** for each group

5. **Create commit plan** markdown file in `.agents/`

6. **Show plan** to user for review

7. **Ask**: "Execute this plan? (y/n/e)dit"
   - y: Execute all commits
   - n: Cancel
   - e: Let user edit plan first

8. **Execute commits** one by one with progress

9. **Show summary**:
   ```
   ✅ X commits created
   📊 Y files changed
   🔍 Run: git log --oneline -X
   ```

10. **Suggest next steps**:
    - "Run @update-devlog to document these changes?"
    - "Push to remote? git push origin <branch>"

## Validation

**Validation is now part of Step 0** (pre-commit check).

If user requests validation:

```bash
npx tsc --noEmit  # Check TypeScript
bun run lint      # Check ESLint
```

**Handle failures interactively:**
- Show clear error messages
- Ask: "(f)ix issues, (s)kip validation, or (a)bort?"

After executing commits:

```bash
git log --oneline -5  # Verify commits
git status            # Should be clean
```

## Example Usage

```bash
# Make changes to code
# Then run:
@commit-plan

# Output:
# 📊 Analyzing changes...
# Found 12 modified files
#
# 📝 Commit Plan:
# 1. feat(database): add new enum values (3 files)
# 2. fix(ui): correct provider order (1 file)
# 3. docs: update DEVLOG (1 file)
#
# Execute? (y/n)
```

## Edge Cases

- **No changes**: Show "Working tree clean, nothing to commit"
- **Only staged changes**: Use those, ask if user wants to include unstaged
- **Mix of staged/unstaged**: Ask which to include
- **Validation fails**: Show errors, offer to fix/skip/abort
- **Merge conflicts**: Detect and warn user to resolve first
- **Detached HEAD**: Warn about detached HEAD state

## Agent Delegation

Use specialized subagents for validation and review:

- `@qa-engineer` - Test coverage verification before committing
- `@backend-engineer` - Database migration validation
- `@frontend-engineer` - UI component validation
- `@security-engineer` - Security review for sensitive changes

### When to Delegate

- Large changesets (>10 files) - delegate to @code-review first
- Database migrations - delegate to @backend-engineer for validation
- New features - ensure tests exist via @qa-engineer
- Security-sensitive changes - delegate to @security-engineer

## Related Prompts

- `@code-review` - Review code quality before committing
- `@test-coverage` - Verify tests exist for changes
- `@update-devlog` - Document commits in DEVLOG after creation
- `@execute` - Execute implementation plans before committing
````
