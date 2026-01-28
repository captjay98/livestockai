---
description: Update DEVLOG.md with recent undocumented work
---

# DEVLOG Updater

Automatically update DEVLOG.md with recent commits that haven't been documented yet.

## Context

**Project**: OpenLivestock Manager  
**DEVLOG**: `DEVLOG.md` - Development timeline with day-by-day entries  
**Format**: Day-based entries following canonical structure

## Canonical DEVLOG Entry Format

Every entry MUST have these sections (in order):

1. **Context** - Brief description of what was being worked on and why
2. **Implementation sections** - Named by feature/task (varies per entry)
3. **Technical Metrics** - Table with files, lines, tests, etc.
4. **Key Insights** - Numbered list of learnings
5. **Time Investment** - With AI-Accelerated Workflow subsection

Optional sections (include only when relevant):

- **Challenges & Solutions** - Only for complex multi-day work with significant obstacles
- **Next Steps** - Only for incomplete features that continue in next session

### Time Investment Format (REQUIRED)

The Time Investment section MUST include Kiro/AI usage details:

```markdown
### Time Investment

**Actual**: ~X hours (vs traditional Y hours)

**AI-Accelerated Workflow**:

**[Phase Name]** (~X minutes/hours):
- Used `@prompt-name` in Kiro CLI to [action]
- Used Kiro IDE in spec mode for [action]
- [Specific tools/agents used]

**[Phase Name]** (~X minutes/hours):
- [Implementation details]

**Breakdown**:
- [Task 1]: ~X min
- [Task 2]: ~X hour

**Time Saved**: ~X hours (X% reduction)
```

## Step 0: Determine Update Scope

**Ask user interactively:**

> What DEVLOG update would you like?
>
> 1. **All recent commits** - Everything since last documented date
> 2. **Specific date range** - Custom start/end dates
> 3. **Today only** - Just today's commits
> 4. **Last N commits** - Specify number of commits
> 5. **Review mode** - Show what would be added without updating

**Then ask about detail level:**

- (f)ull - Include detailed commit bodies and file lists
- (s)ummary - Brief summaries only
- (m)etrics - Focus on statistics and metrics

**Then ask about execution:**

- (a)uto-commit - Update DEVLOG and commit automatically
- (r)eview - Show changes for review first
- (d)raft - Create draft without modifying DEVLOG

Wait for response before proceeding.

## Workflow

### 1. Find Last Documented Date

Parse DEVLOG.md to find the most recent day entry:

```bash
grep -E "^## Day [0-9]+ \(" DEVLOG.md | tail -1
```

Extract date from entry (e.g., "January 13, 2026")

### 2. Calculate Current Day Number

```bash
# Get first commit date
git log --reverse --format="%ai" | head -1

# Count days with commits from first to today
git log --format="%ai" | cut -d' ' -f1 | sort -u | wc -l
```

**Day Number** = Count of unique commit dates

### 3. Get Undocumented Commits

```bash
# Get all commits since last documented date
git log --since="YYYY-MM-DD" --format="%h %s" --no-merges

# Get detailed stats
git log --since="YYYY-MM-DD" --stat --oneline
```

### 4. Analyze Commits

**Categorize by type**:

- `feat(*)` → Features implemented
- `fix(*)` → Bug fixes
- `refactor(*)` → Code improvements
- `docs` → Documentation updates
- `test` → Test additions
- `chore` → Maintenance tasks
- `perf` → Performance improvements

**Extract scope**:

- `feat(database)` → Database work
- `feat(seeds)` → Seeder work
- `fix(ui)` → UI fixes

### 5. Generate DEVLOG Entry

**Template**:

```markdown
## Day X (Month DD) - [Auto-generated Title]

### Context

[Brief context from commit messages]

### [Main Category] Implementation

**Objective**: [Extracted from commits]

**Implementation**:

- [Bullet points from commit bodies]

**Files Modified**: X files

- [Key files from git diff]

**Commits Created** (X):

1. `hash` - commit message
2. `hash` - commit message

### Technical Metrics

| Metric                | Value |
| --------------------- | ----- |
| **Files Changed**     | X     |
| **Lines Added**       | +X    |
| **Lines Removed**     | -X    |
| **Commits**           | X     |
| **TypeScript Errors** | 0     |
| **ESLint Errors**     | 0     |

### Key Insights

[Auto-generated from commit patterns and file changes]

### Time Investment

**Estimated**: ~X hours (based on commit count and complexity)

---
```

### 6. Append to DEVLOG.md

Insert before the final "Built with ❤️ for Nigerian farmers" line.

### 7. Show Changes

```bash
git diff DEVLOG.md
```

Display summary:

```
✅ DEVLOG updated with Day X entry

📊 Summary:
- Day X (January 14, 2026)
- X commits documented
- Y files changed
- Estimated Z hours

📝 Review changes above, then commit:
git add DEVLOG.md
git commit -m "docs: update DEVLOG with Day X progress"
```

## Intelligence Features

### Auto-generate Title

Based on commit patterns:

- Mostly `feat(database)` → "Database Enhancement"
- Mix of `feat` + `fix` → "Feature Implementation & Bug Fixes"
- Mostly `refactor` → "Code Refactoring"
- Mostly `docs` → "Documentation Updates"

### Extract Context

From commit messages:

- Look for "Fixes:", "Implements:", "Adds:"
- Summarize what was accomplished
- Note any breaking changes

### Calculate Time Estimate

Heuristic:

- 1-2 commits = 30 min - 1 hour
- 3-5 commits = 1-3 hours
- 6-10 commits = 3-5 hours
- 10+ commits = 5+ hours

Adjust based on:

- File count (more files = more time)
- Line changes (more lines = more time)
- Complexity (database/tests = more time)

### Generate Insights

Pattern detection:

- New features → "X feature now complete"
- Bug fixes → "Resolved Y issues"
- Refactoring → "Improved code organization"
- Performance → "Optimized Z"

## Execution Steps

1. **Parse DEVLOG.md** to find last date

2. **Calculate day number** from git history

3. **Get commits** since last documented date

4. **Analyze commits** and categorize

5. **Generate DEVLOG entry** with all sections

6. **Append to DEVLOG.md** (before footer)

7. **Show diff** and summary

8. **Provide commit command** for user to execute

## Validation

Before updating:

- [ ] DEVLOG.md exists
- [ ] Last date found successfully
- [ ] New commits exist since last date
- [ ] Day number calculated correctly

After updating:

- [ ] DEVLOG.md is valid markdown
- [ ] Entry follows existing format
- [ ] All commits included
- [ ] Metrics are accurate

## Edge Cases

**No new commits**:

```
ℹ️  No new commits since last DEVLOG entry (Day X, January 13)
Nothing to document.
```

**First DEVLOG entry**:

```
ℹ️  No existing DEVLOG entries found.
Creating Day 1 entry with all commits...
```

**DEVLOG.md doesn't exist**:

```
⚠️  DEVLOG.md not found. Create it first or run from project root.
```

## Example Output

```
📖 Analyzing commits for DEVLOG update...

Last documented: Day 7 (January 13, 2026)
Current day: Day 8 (January 14, 2026)

Found 6 new commits:
- feat(database): add 28 new enum values
- feat(seeds): comprehensive dev seeder
- refactor(database): consolidate migrations
- docs: add audit report
- docs: update DEVLOG
- chore: remove old seed files

✅ Generated Day 8 entry

📊 Summary:
- Title: "Database Enhancement & Production Readiness"
- Commits: 6
- Files: 24 changed
- Lines: +6,000 / -2,500
- Estimated time: ~3.75 hours

📝 DEVLOG.md updated. Review changes:

git diff DEVLOG.md

Then commit:
git add DEVLOG.md
git commit -m "docs: update DEVLOG with Day 8 progress"
```

## Validation & Next Steps

**Validate DEVLOG entry:**

1. **Check accuracy:**
   - All commits included
   - Correct day number
   - Accurate metrics
   - Proper categorization

2. **Review formatting:**
   - Markdown syntax correct
   - Tables formatted properly
   - Links working

**Ask user:**

> DEVLOG entry generated. What would you like to do?
>
> - (c) Commit the changes
> - (e) Edit the entry first
> - (r) Regenerate with different settings
> - (d) Discard and cancel

**If auto-commit was selected:**

```bash
git add DEVLOG.md
git commit -m "docs: update DEVLOG with Day X progress"
echo "✅ DEVLOG updated and committed"
```

**Success criteria:**

- All recent commits documented
- Day number correct
- Metrics accurate
- Entry follows DEVLOG format

## Agent Delegation

For DEVLOG updates:

- `@backend-engineer` - Technical details for backend changes
- `@frontend-engineer` - UI/UX changes and component updates
- `@devops-engineer` - Infrastructure and deployment changes
- `@qa-engineer` - Testing and quality improvements

### When to Delegate

- **Technical details** - Delegate to feature owner for accurate descriptions
- **Complex changes** - Delegate to implementing engineer for context
- **Multiple features** - Delegate to respective engineers for their areas

## Related Prompts

- `@commit-plan` - Create commits (run this first)
- `@code-review` - Review code before committing
- `@plan-feature` - Plan features before implementation
- `@sync-docs` - Update API documentation
- `@sync-guides` - Update general documentation

---

**Ready to implement?** This will create a smart, autonomous DEVLOG updater that requires zero manual input.
