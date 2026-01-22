# Feature: Enhanced Tasks System

## User Story

As a **farm owner/manager**
I want to **create, assign, and track tasks linked to specific batches, structures, and livestock types**
So that **my workers know exactly what to do and I can monitor farm operations effectively**

## Problem Statement

Current tasks system is:

- Farm-level only (no batch/structure context)
- No assignment capability (can't assign to workers)
- No module awareness (same tasks for all livestock types)
- Default tasks not seeded on farm creation
- No UI to create custom tasks

## Solution Statement

Enhance tasks with:

1. Context linking: `batchId`, `structureId`, `moduleKey` columns
2. Assignment: `assignedTo` column (nullable = anyone on farm)
3. Module-aware default tasks per livestock type
4. Wire `seedDefaultTasks()` to farm creation
5. Task dialog UI for creating/assigning tasks

## Feature Metadata

- **Type**: Enhancement
- **Complexity**: Medium
- **Systems Affected**: Database, Tasks feature, Farms feature, UI
- **Dependencies**: None (uses existing user_farms for farm members)

---

## CONTEXT REFERENCES

### Files to Read Before Implementing

| File                                                     | Lines   | Why                                          |
| -------------------------------------------------------- | ------- | -------------------------------------------- |
| `app/lib/db/types.ts`                                    | 670-710 | Current TaskTable/TaskCompletionTable schema |
| `app/lib/db/migrations/2025-01-08-001-initial-schema.ts` | 798-860 | Current tasks table DDL                      |
| `app/features/tasks/service.ts`                          | all     | Business logic, DEFAULT_TASKS                |
| `app/features/tasks/repository.ts`                       | all     | Database operations                          |
| `app/features/tasks/server.ts`                           | all     | Server functions                             |
| `app/routes/_auth/tasks/index.tsx`                       | all     | Current UI                                   |
| `app/features/farms/server.ts`                           | 45-85   | createFarm function to wire seeding          |
| `app/features/farms/server.ts`                           | 647-680 | getFarmMembersFn pattern                     |
| `app/components/dialogs/batch-dialog.tsx`                | 1-80    | Dialog pattern to follow                     |

### New Files to Create

- `app/components/dialogs/task-dialog.tsx`
- `tests/features/tasks/tasks.service.test.ts`

### Files to Modify

- `app/lib/db/migrations/2025-01-08-001-initial-schema.ts` - Add 4 columns + 3 indexes to tasks table

---

## IMPLEMENTATION PLAN

### Phase 1: Database Schema

Add 4 columns to `tasks` table:

- `batchId` (uuid, nullable, FK to batches)
- `structureId` (uuid, nullable, FK to structures)
- `moduleKey` (varchar, nullable)
- `assignedTo` (uuid, nullable, FK to users)

### Phase 2: Update Types & Repository

- Update `TaskTable` interface
- Update `TaskWithCompletionRow` type
- Update repository queries to include new columns
- Add filter by assignedTo in getTasksWithCompletions

### Phase 3: Module-Aware Default Tasks

- Create `DEFAULT_TASKS_BY_MODULE` in service.ts
- Update `seedDefaultTasks()` to accept moduleKey
- Wire to farm creation in `createFarm()`

### Phase 4: Server Functions

- Add `getFarmMembersForTasksFn` (non-admin version)
- Update `createTask` to accept new fields
- Update `getTasks` to filter by assignment

### Phase 5: UI - Task Dialog

- Create TaskDialog component
- Add to /tasks page
- Include assignment dropdown (farm members)
- Include optional batch/structure selects

### Phase 6: Testing

- Property tests for service functions
- Integration tests for server functions

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE Initial Migration

**File**: `app/lib/db/migrations/2025-01-08-001-initial-schema.ts`

**IMPORTANT**: Add columns to the EXISTING `tasks` table creation (around line 800-820), do NOT create a new migration file.

Find the tasks table creation and add 4 new columns:

```typescript
// In the tasks table creation section (~line 801)
await db.schema
  .createTable('tasks')
  .addColumn('id', 'uuid', (col) =>
    col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
  )
  .addColumn('farmId', 'uuid', (col) =>
    col.notNull().references('farms.id').onDelete('cascade'),
  )
  .addColumn('title', 'varchar(255)', (col) => col.notNull())
  .addColumn('description', 'text')
  .addColumn('frequency', 'varchar(10)', (col) => col.notNull())
  .addColumn('isDefault', 'boolean', (col) => col.notNull().defaultTo(false))
  // NEW: Context linking
  .addColumn('batchId', 'uuid', (col) =>
    col.references('batches.id').onDelete('set null'),
  )
  .addColumn('structureId', 'uuid', (col) =>
    col.references('structures.id').onDelete('set null'),
  )
  .addColumn('moduleKey', 'varchar(20)')
  // NEW: Assignment
  .addColumn('assignedTo', 'uuid', (col) =>
    col.references('users.id').onDelete('set null'),
  )
  .addColumn('createdAt', 'timestamptz', (col) => col.defaultTo(sql`now()`))
  .execute()
```

Also add indexes after the existing `idx_tasks_farm_id` index:

```typescript
// After idx_tasks_farm_id (~line 823)
await db.schema
  .createIndex('idx_tasks_batch_id')
  .on('tasks')
  .column('batchId')
  .execute()
await db.schema
  .createIndex('idx_tasks_assigned_to')
  .on('tasks')
  .column('assignedTo')
  .execute()
await db.schema
  .createIndex('idx_tasks_module_key')
  .on('tasks')
  .column('moduleKey')
  .execute()
```

**VALIDATE**: `bun run db:reset && bun run db:migrate`

**NOTE**: Since we're modifying the initial migration, you'll need to reset the database. For production, a separate migration would be needed.

---

### Task 2: UPDATE Types

**File**: `app/lib/db/types.ts` (lines ~675-695)

Update `TaskTable`:

```typescript
export interface TaskTable {
  id: Generated<string>
  farmId: string
  title: string
  description: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
  isDefault: Generated<boolean>
  // NEW: Context linking
  batchId: string | null
  structureId: string | null
  moduleKey: string | null // 'poultry' | 'aquaculture' | etc.
  // NEW: Assignment
  assignedTo: string | null // userId - null means anyone
  createdAt: Generated<Date>
}
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 3: UPDATE Repository

**File**: `app/features/tasks/repository.ts`

1. Update `TaskInsert` interface to include new fields
2. Update `TaskWithCompletionRow` to include new fields
3. Update `insertTask` to handle new columns
4. Update `getTasksWithCompletions` to:
   - Select new columns
   - Add optional `assignedTo` filter parameter

**VALIDATE**: `npx tsc --noEmit`

---

### Task 4: UPDATE Service - Module-Aware Defaults

**File**: `app/features/tasks/service.ts`

1. Update `TaskWithStatus` interface
2. Create `DEFAULT_TASKS_BY_MODULE` constant
3. Update `calculateCompletionStatus` for new fields

**VALIDATE**: `npx tsc --noEmit`

---

### Task 5: UPDATE Server Functions

**File**: `app/features/tasks/server.ts`

1. Update `seedDefaultTasks(farmId, moduleKeys)` to accept modules
2. Update `createTask` input to include new fields
3. Add `getFarmMembersForTasksFn` (owner/manager can see members)
4. Update `getTasks` to filter by `assignedTo`

**VALIDATE**: `npx tsc --noEmit && bun run lint`

---

### Task 6: WIRE Farm Creation

**File**: `app/features/farms/server.ts` (line ~75)

After `createDefaultModules()`, call `seedDefaultTasks()`:

```typescript
// In createFarm function, after createDefaultModules:
const { seedDefaultTasks } = await import('~/features/tasks/server')
await seedDefaultTasks(result.id, [data.type])
```

**VALIDATE**: `npx tsc --noEmit`

---

### Task 7: CREATE Task Dialog

**File**: `app/components/dialogs/task-dialog.tsx`

- Mirror `batch-dialog.tsx` pattern
- Form fields: title, description, frequency, assignedTo (dropdown)
- Optional: batchId, structureId selects
- Use `useFarm()` for context
- Call `createTaskFn` on submit

**VALIDATE**: `npx tsc --noEmit && bun run lint`

---

### Task 8: UPDATE Tasks Page

**File**: `app/routes/_auth/tasks/index.tsx`

1. Add "Add Task" button in header
2. Import and render TaskDialog
3. Add filter by "My Tasks" vs "All Tasks"

**VALIDATE**: `bun run build`

---

### Task 9: ADD Tests

**File**: `tests/features/tasks/tasks.service.test.ts`

Property tests for:

- `getPeriodStart` returns correct period boundaries
- `validateTaskData` catches invalid inputs
- `calculateCompletionStatus` correctly determines completion

**VALIDATE**: `bun run test tests/features/tasks`

---

## VALIDATION COMMANDS

```bash
# After each task
npx tsc --noEmit

# After all tasks
bun run check && bun run lint && bun run test --run && bun run build
```

## ACCEPTANCE CRITERIA

- [ ] Migration adds 4 columns with proper FKs
- [ ] Types updated in `app/lib/db/types.ts`
- [ ] Default tasks seeded on farm creation
- [ ] Task dialog allows creating custom tasks
- [ ] Tasks can be assigned to farm members
- [ ] "My Tasks" filter works
- [ ] All tests pass
- [ ] No TypeScript/ESLint errors
