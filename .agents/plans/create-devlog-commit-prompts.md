# Plan: Create DEVLOG and Commit Prompts

## Objective
Create two reusable prompts to automate common development workflow tasks:
1. `@update-devlog` - Update DEVLOG.md with recent work
2. `@commit-plan` - Create structured commit plan for changes

---

## Prompt 1: @update-devlog

### Purpose
Automatically update DEVLOG.md with recent development work, maintaining consistent format and structure.

### Features
- Detect current day number from git history
- Analyze recent changes (git diff, modified files)
- Generate structured DEVLOG entry
- Include metrics (files changed, time estimate, commits)
- Maintain existing DEVLOG format

### Workflow
1. Get first commit date to calculate day number
2. Analyze git status and recent changes
3. Review modified files and their purpose
4. Generate DEVLOG entry with sections:
   - Context
   - What was built
   - Technical decisions
   - Challenges and solutions
   - Metrics
   - Key insights
5. Append to DEVLOG.md

### Input Parameters
- Optional: Custom description of work done
- Optional: Time spent estimate
- Optional: Key insights to include

### Output
- Updated DEVLOG.md with new day entry
- Summary of what was added

---

## Prompt 2: @commit-plan

### Purpose
Create structured commit plan for staged/unstaged changes, following conventional commit format.

### Features
- Analyze git status and changes
- Group related changes logically
- Generate commit messages following convention
- Create execution script
- Include validation steps

### Workflow
1. Run git status to see changes
2. Analyze modified files by category:
   - Features (feat)
   - Bug fixes (fix)
   - Refactoring (refactor)
   - Documentation (docs)
   - Tests (test)
   - Chores (chore)
3. Group related changes into logical commits
4. Generate commit messages with:
   - Type and scope
   - Short description
   - Detailed body
5. Create execution plan with validation

### Commit Message Format
```
<type>(<scope>): <short description>

<detailed body>
- Bullet point 1
- Bullet point 2

<optional footer>
```

### Input Parameters
- Optional: Custom commit grouping
- Optional: Additional context for messages

### Output
- Commit plan markdown file
- Executable bash script (optional)
- Validation checklist

---

## Implementation Steps

### Step 1: Create @update-devlog prompt ✅
**File**: `.kiro/prompts/update-devlog.md`

**Completed**: Option 1 (Review first) implemented
- Finds last DEVLOG date automatically
- Calculates day number from git history
- Analyzes commits since last entry
- Generates structured DEVLOG entry
- Shows diff for review before committing

**Time**: 15 minutes

---

### Step 2: Create @commit-plan prompt ✅
**File**: `.kiro/prompts/commit-plan.md`

**Completed**: Autonomous analysis implemented
- Analyzes git status automatically
- Categorizes changes by feature/type
- Groups related changes logically
- Generates conventional commit messages
- Creates executable plan with validation

**Time**: 15 minutes

---

### Step 3: Test both prompts
**Actions**:
- Make some test changes
- Run @commit-plan to create plan
- Execute commits
- Run @update-devlog to document work
- Verify DEVLOG format

**Time**: 10 minutes

---

### Step 4: Update .kiro/README.md
**Actions**:
- Add both prompts to prompt list
- Add usage examples
- Update workflow documentation

**Time**: 5 minutes

---

## Total Time Estimate
45 minutes

---

## Success Criteria

✅ @update-devlog prompt:
- Correctly calculates day number
- Generates properly formatted DEVLOG entry
- Includes all required sections
- Maintains existing format

✅ @commit-plan prompt:
- Analyzes changes correctly
- Groups commits logically
- Generates conventional commit messages
- Creates executable plan

✅ Both prompts:
- Clear documentation
- Easy to use
- Reusable across projects
- Include examples

---

## Example Usage

### @update-devlog
```bash
kiro-cli
@update-devlog

# With custom input
@update-devlog "Implemented user authentication and settings system. Spent ~3 hours."
```

### @commit-plan
```bash
kiro-cli
@commit-plan

# With custom grouping
@commit-plan "Group all database changes into one commit"
```

---

## Related Prompts
- `@code-review` - Review code before committing
- `@plan-feature` - Plan features before implementation
- `@execute` - Execute implementation plans

---

## Notes
- Both prompts should be agent-agnostic (work with any agent)
- Should handle edge cases (no changes, first commit, etc.)
- Should be idempotent (safe to run multiple times)
- Should validate before making changes
