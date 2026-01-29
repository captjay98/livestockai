# Feature: Toast Notifications & Confirmation Dialog Standardization

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Standardize user feedback across the application by:

1. Adding toast notifications for success/error feedback on all CRUD operations
2. Replacing `window.confirm()` with proper AlertDialog components for destructive actions
3. Ensuring consistent UX patterns for confirmations and notifications

## User Story

As a farm manager
I want clear feedback when I perform actions
So that I know whether my actions succeeded or failed without confusion

## Problem Statement

Current issues:

1. **No success feedback**: Users complete actions but receive no confirmation (only page refresh/navigation)
2. **Inconsistent confirmations**: Some delete actions use proper dialogs, others use `window.confirm()`
3. **Toast infrastructure unused**: Sonner Toaster is mounted but `toast()` is never called
4. **Error-only inline feedback**: Errors show inline but success is silent

## Solution Statement

1. Add `toast.success()` calls after successful CRUD operations
2. Add `toast.error()` calls for errors (in addition to inline errors)
3. Replace `window.confirm()` with AlertDialog in suppliers and invoices detail pages
4. Create a consistent pattern for all destructive action confirmations

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Low
**Primary Systems Affected**: All route files with CRUD operations
**Dependencies**: sonner (already installed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/routes/__root.tsx` (lines 10, 132) - Toaster already mounted with `richColors position="top-right"`
- `app/routes/_auth/batches/index.tsx` (lines 906-940) - Good delete dialog pattern to follow
- `app/routes/_auth/suppliers/$supplierId.tsx` (lines 73-77) - BAD: Uses `window.confirm()`
- `app/routes/_auth/invoices/$invoiceId.tsx` (lines 60-65) - BAD: Uses `window.confirm()`
- `app/components/ui/alert-dialog.tsx` - AlertDialog component available

### Files to Update

**High Priority (window.confirm → AlertDialog):**

- `app/routes/_auth/suppliers/$supplierId.tsx` - Replace confirm() with AlertDialog
- `app/routes/_auth/invoices/$invoiceId.tsx` - Replace confirm() with AlertDialog

**Medium Priority (Add toast notifications):**

- `app/routes/_auth/batches/index.tsx` - Add success toasts for create/update/delete
- `app/routes/_auth/sales/index.tsx` - Add success toasts
- `app/routes/_auth/expenses/index.tsx` - Add success toasts
- `app/routes/_auth/feed/index.tsx` - Add success toasts
- `app/routes/_auth/eggs/index.tsx` - Add success toasts
- `app/routes/_auth/customers/index.tsx` - Add success toasts
- `app/routes/_auth/customers/$customerId.tsx` - Add success toasts
- `app/routes/_auth/suppliers/index.tsx` - Add success toasts
- `app/routes/_auth/suppliers/$supplierId.tsx` - Add success toasts
- `app/routes/_auth/invoices/$invoiceId.tsx` - Add success toasts
- `app/routes/_auth/weight/index.tsx` - Add success toasts
- `app/routes/_auth/water-quality/index.tsx` - Add success toasts
- `app/routes/_auth/mortality/index.tsx` - Add success toasts
- `app/routes/_auth/vaccinations/index.tsx` - Add success toasts
- `app/routes/_auth/inventory/index.tsx` - Add success toasts
- `app/routes/_auth/farms/$farmId/index.tsx` - Add success toasts
- `app/routes/_auth/settings/index.tsx` - Add success toasts
- `app/routes/_auth/onboarding/index.tsx` - Add success toasts
- `app/components/dialogs/*.tsx` - Add success toasts to all dialogs

### Patterns to Follow

**Toast Import:**

```typescript
import { toast } from 'sonner'
```

**Success Toast Pattern:**

```typescript
// After successful operation
toast.success('Batch created successfully')
toast.success('Changes saved')
toast.success('Record deleted')
```

**Error Toast Pattern (supplement inline errors):**

```typescript
catch (err) {
  const message = err instanceof Error ? err.message : 'Operation failed'
  setError(message)  // Keep inline error
  toast.error(message)  // Add toast
}
```

**AlertDialog Pattern (from batches/index.tsx):**

```typescript
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

const handleDelete = (item: Item) => {
  setSelectedItem(item)
  setDeleteDialogOpen(true)
}

const handleDeleteConfirm = async () => {
  if (!selectedItem) return
  try {
    await deleteItemFn({ data: { id: selectedItem.id } })
    setDeleteDialogOpen(false)
    toast.success('Item deleted successfully')
    // refresh or navigate
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to delete')
  }
}

// In JSX:
<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Item</DialogTitle>
      <DialogDescription>
        Are you sure? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDeleteConfirm}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## IMPLEMENTATION PLAN

### Phase 1: Fix Critical Issues (window.confirm)

Replace `window.confirm()` with proper AlertDialog in:

- suppliers/$supplierId.tsx
- invoices/$invoiceId.tsx

### Phase 2: Add Toast Notifications to Routes

Add `toast.success()` and `toast.error()` to all CRUD operations in route files.

### Phase 3: Add Toast Notifications to Dialogs

Add `toast.success()` to all dialog components after successful operations.

### Phase 4: Validation

Run TypeScript, ESLint, and manual testing.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/routes/_auth/suppliers/$supplierId.tsx`

- **IMPLEMENT**: Replace `window.confirm()` with AlertDialog + add toast notifications
- **IMPORTS**: Add `import { toast } from 'sonner'`, Dialog components, useState
- **PATTERN**: Mirror batches/index.tsx delete dialog pattern (lines 906-940)
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep supplier`

### Task 2: UPDATE `app/routes/_auth/invoices/$invoiceId.tsx`

- **IMPLEMENT**: Replace `window.confirm()` with AlertDialog + add toast notifications
- **IMPORTS**: Add `import { toast } from 'sonner'`, Dialog components, useState
- **PATTERN**: Mirror batches/index.tsx delete dialog pattern
- **ALSO**: Add toast for status change success
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep invoice`

### Task 3: UPDATE `app/routes/_auth/batches/index.tsx`

- **IMPLEMENT**: Add toast notifications for create/update/delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **LOCATIONS**:
  - handleSubmit success → `toast.success('Batch created successfully')`
  - handleEditSubmit success → `toast.success('Batch updated')`
  - handleDeleteConfirm success → `toast.success('Batch deleted')`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep batches`

### Task 4: UPDATE `app/routes/_auth/sales/index.tsx`

- **IMPLEMENT**: Add toast notifications for create/update/delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep sales`

### Task 5: UPDATE `app/routes/_auth/expenses/index.tsx`

- **IMPLEMENT**: Add toast notifications for create/update/delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep expenses`

### Task 6: UPDATE `app/routes/_auth/feed/index.tsx`

- **IMPLEMENT**: Add toast notifications for create/update/delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep feed`

### Task 7: UPDATE `app/routes/_auth/eggs/index.tsx`

- **IMPLEMENT**: Add toast notifications for create/update/delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep eggs`

### Task 8: UPDATE `app/routes/_auth/customers/index.tsx`

- **IMPLEMENT**: Add toast notifications for create success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep customers`

### Task 9: UPDATE `app/routes/_auth/customers/$customerId.tsx`

- **IMPLEMENT**: Add toast notifications for delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep customerId`

### Task 10: UPDATE `app/routes/_auth/suppliers/index.tsx`

- **IMPLEMENT**: Add toast notifications for create success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep suppliers`

### Task 11: UPDATE `app/routes/_auth/weight/index.tsx`

- **IMPLEMENT**: Add toast notifications for create success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep weight`

### Task 12: UPDATE `app/routes/_auth/water-quality/index.tsx`

- **IMPLEMENT**: Add toast notifications for create success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep water`

### Task 13: UPDATE `app/routes/_auth/mortality/index.tsx`

- **IMPLEMENT**: Add toast notifications for create success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep mortality`

### Task 14: UPDATE `app/routes/_auth/vaccinations/index.tsx`

- **IMPLEMENT**: Add toast notifications for create success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep vaccinations`

### Task 15: UPDATE `app/routes/_auth/inventory/index.tsx`

- **IMPLEMENT**: Add toast notifications for create/delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep inventory`

### Task 16: UPDATE `app/routes/_auth/farms/$farmId/index.tsx`

- **IMPLEMENT**: Add toast notifications for structure create/delete success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep farmId`

### Task 17: UPDATE `app/routes/_auth/settings/index.tsx`

- **IMPLEMENT**: Add toast notifications for settings save success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep settings`

### Task 18: UPDATE `app/routes/_auth/onboarding/index.tsx`

- **IMPLEMENT**: Add toast notifications for farm/batch creation success
- **IMPORTS**: Add `import { toast } from 'sonner'`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep onboarding`

### Task 19: UPDATE Dialog Components

Update all dialog components in `app/components/dialogs/`:

- `batch-dialog.tsx` - Add `toast.success('Batch created')`
- `sale-dialog.tsx` - Add `toast.success('Sale recorded')`
- `expense-dialog.tsx` - Add `toast.success('Expense recorded')`
- `feed-dialog.tsx` - Add `toast.success('Feed record added')`
- `invoice-dialog.tsx` - Add `toast.success('Invoice created')`
- `customer-dialog.tsx` - Add `toast.success('Customer added')`
- `supplier-dialog.tsx` - Add `toast.success('Supplier added')`
- `vaccination-dialog.tsx` - Add `toast.success('Record added')`
- `water-quality-dialog.tsx` - Add `toast.success('Record added')`
- `weight-dialog.tsx` - Add `toast.success('Weight sample recorded')`

- **IMPORTS**: Add `import { toast } from 'sonner'` to each
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit 2>&1 | grep dialog`

### Task 20: Final Validation

- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && bun run lint`
- **VALIDATE**: `cd /Users/captjay98/projects/jayfarms && bun test`

---

## TESTING STRATEGY

### Manual Testing

1. Create a batch → Should see success toast
2. Edit a batch → Should see success toast
3. Delete a batch → Should see confirmation dialog, then success toast
4. Delete a supplier → Should see AlertDialog (not window.confirm)
5. Delete an invoice → Should see AlertDialog (not window.confirm)
6. Trigger an error → Should see both inline error and error toast

---

## VALIDATION COMMANDS

### Level 1: Syntax & Types

```bash
cd /Users/captjay98/projects/jayfarms && npx tsc --noEmit
```

### Level 2: Linting

```bash
cd /Users/captjay98/projects/jayfarms && bun run lint
```

### Level 3: Tests

```bash
cd /Users/captjay98/projects/jayfarms && bun test
```

### Level 4: Manual Validation

- Test CRUD operations show success toasts
- Test delete actions show proper confirmation dialogs
- Verify no `window.confirm()` calls remain

---

## ACCEPTANCE CRITERIA

- [ ] No `window.confirm()` calls in codebase (except specs/docs)
- [ ] All CRUD operations show success toast on completion
- [ ] All delete actions use Dialog/AlertDialog for confirmation
- [ ] TypeScript compiles with 0 errors
- [ ] ESLint passes with 0 errors
- [ ] Consistent toast messages across the app

---

## COMPLETION CHECKLIST

- [ ] Tasks 1-2: Critical fixes (window.confirm → AlertDialog)
- [ ] Tasks 3-18: Route toast notifications
- [ ] Task 19: Dialog component toast notifications
- [ ] Task 20: Final validation passes
- [ ] Manual testing confirms UX improvements

---

## NOTES

**Toast Message Guidelines:**

- Success: Short, past tense ("Batch created", "Changes saved", "Record deleted")
- Error: Include context ("Failed to create batch", "Could not save changes")

**Estimated Time:** ~1-2 hours

**Confidence Score:** 9/10 - Straightforward pattern application across files
