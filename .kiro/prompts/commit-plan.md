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
```

## Execution Steps

1. **Run git status analysis**
   ```bash
   git status --short
   git diff --stat
   ```

2. **Categorize changes** by feature/type

3. **Generate commit messages** for each group

4. **Create commit plan** markdown file in `.agents/`

5. **Show plan** to user for review

6. **Ask**: "Execute this plan? (y/n)"

7. **If yes**: Execute commits one by one

8. **Show summary**: 
   ```
   ✅ X commits created
   📊 Y files changed
   🔍 Run: git log --oneline -X
   ```

## Validation

Before executing:
```bash
npx tsc --noEmit  # Check TypeScript
bun run lint      # Check ESLint
```

After executing:
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
- **Only staged changes**: Use those
- **Mix of staged/unstaged**: Ask which to include
- **Validation fails**: Show errors, don't commit

## Related Prompts

- `@update-devlog` - Document commits after creation
- `@code-review` - Review code before committing
- `@execute` - Execute implementation plans
