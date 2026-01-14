# Feature: Consolidate All Creation Flows to Dialogs

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Standardize all record creation to use dialog modals instead of dedicated `/new` routes. This keeps users in context, reduces navigation, and provides a consistent UX across the application.

## User Story

As a farm manager
I want to create new records without leaving my current page
So that I can quickly add data while maintaining context of what I'm working on

## Problem Statement

Currently the app has two patterns for creating records:

1. **Dialog modals** - Used on some index pages (batches, farms, sales, eggs, expenses, feed)
2. **Dedicated /new routes** - Navigate to separate page with form

This inconsistency:

- Confuses users with different workflows per feature
- Creates maintenance burden (duplicate form logic)
- Breaks user context when navigating away

## Solution Statement

1. Create missing dialog components for features that only have /new routes
2. Enhance existing dialogs with any missing fields from /new routes
3. Update index pages to use dialogs for creation
4. Remove all /new route files
5. Update any links pointing to /new routes

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Routes, Dialog Components
**Dependencies**: None

---

## CONTEXT REFERENCES

### Current State Analysis

**Features with BOTH dialog AND /new route (need to remove /new):**
| Feature | Dialog | /new Route | Dialog Missing Fields |
|---------|--------|------------|----------------------|
| batches | ✅ batch-dialog.tsx | ✅ batches/new.tsx | None (dialog is more complete) |
| farms | ✅ farm-dialog.tsx | ✅ farms/new.tsx | None |
| sales | ✅ sale-dialog.tsx | ✅ sales/new.tsx | customerId, paymentStatus, paymentMethod, unitType, ageWeeks, averageWeightKg |
| eggs | ✅ egg-dialog.tsx | ✅ eggs/new.tsx | None |
| expenses | ✅ expense-dialog.tsx | ✅ expenses/new.tsx | supplierId, isRecurring |
| feed | ✅ feed-dialog.tsx | ✅ feed/new.tsx | None |

**Features with ONLY /new route (need new dialog):**
| Feature | Fields Required |
|---------|----------------|
| customers | name, phone, email, location, customerType |
| suppliers | name, phone, email, location, products[], supplierType |
| invoices | customerId, items[], dueDate, notes |
| vaccinations | batchId, vaccineName/medicationName, date, dosage, nextDueDate/withdrawalDays, type (vaccination/treatment) |
| water-quality | batchId, date, ph, temperatureCelsius, dissolvedOxygenMgL, ammoniaMgL |
| weight | batchId, date, sampleSize, averageWeightKg, minWeightKg, maxWeightKg, notes |

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

**Dialog Pattern Reference:**

- `app/components/dialogs/batch-dialog.tsx` (lines 1-80) - Full dialog pattern with collapsible sections
- `app/components/dialogs/sale-dialog.tsx` (lines 1-100) - Dialog with server function for loading data
- `app/components/dialogs/farm-dialog.tsx` - Simple dialog pattern

**Routes to Remove:**

- `app/routes/_auth/batches/new.tsx`
- `app/routes/_auth/customers/new.tsx`
- `app/routes/_auth/eggs/new.tsx`
- `app/routes/_auth/expenses/new.tsx`
- `app/routes/_auth/farms/new.tsx`
- `app/routes/_auth/feed/new.tsx`
- `app/routes/_auth/invoices/new.tsx`
- `app/routes/_auth/sales/new.tsx`
- `app/routes/_auth/suppliers/new.tsx`
- `app/routes/_auth/vaccinations/new.tsx`
- `app/routes/_auth/water-quality/new.tsx`
- `app/routes/_auth/weight/new.tsx`

**Index Pages Using Dialogs (reference for pattern):**

- `app/routes/_auth/batches/index.tsx` - Uses inline dialog state
- `app/routes/_auth/farms/index.tsx` (line 107) - Uses FarmDialog
- `app/routes/_auth/dashboard/index.tsx` (line 851) - Uses BatchDialog

**Index Pages Needing Dialog Integration:**

- `app/routes/_auth/customers/index.tsx` - Has inline create form, convert to dialog
- `app/routes/_auth/suppliers/index.tsx` - Has inline create form, convert to dialog
- `app/routes/_auth/invoices/index.tsx` (line 249) - Links to /invoices/new
- `app/routes/_auth/vaccinations/index.tsx` - Needs dialog
- `app/routes/_auth/water-quality/index.tsx` - Needs dialog
- `app/routes/_auth/weight/index.tsx` - Needs dialog

**Server Functions (for dialog imports):**

- `app/features/customers/server.ts` - createCustomer
- `app/features/suppliers/server.ts` - createSupplier
- `app/features/invoices/server.ts` - createInvoice
- `app/features/vaccinations/server.ts` - createVaccination, createTreatment
- `app/features/water-quality/server.ts` - createWaterQualityRecord
- `app/features/weight/server.ts` - createWeightSample

### Patterns to Follow

**Dialog Component Pattern:**

```typescript
interface XxxDialogProps {
  farmId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  // Optional: data needed for dropdowns
  batches?: Array<Batch>
}

export function XxxDialog({ farmId, open, onOpenChange }: XxxDialogProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({...})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await createXxxFn({ data: { farmId, ...formData } })
      onOpenChange(false)
      router.invalidate() // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Xxx</DialogTitle>
          <DialogDescription>...</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Index Page Dialog Integration Pattern:**

```typescript
// In index page component
const [createDialogOpen, setCreateDialogOpen] = useState(false)

// In JSX
<Button onClick={() => setCreateDialogOpen(true)}>
  <Plus className="h-4 w-4 mr-2" />
  Add New
</Button>

<XxxDialog
  farmId={selectedFarmId}
  open={createDialogOpen}
  onOpenChange={setCreateDialogOpen}
/>
```

---

## IMPLEMENTATION PLAN

### Phase 1: Enhance Existing Dialogs

Add missing fields to sale-dialog and expense-dialog.

### Phase 2: Create Missing Dialogs

Create 6 new dialog components for features without them.

### Phase 3: Update Index Pages

Integrate dialogs into index pages, replacing /new links.

### Phase 4: Remove /new Routes

Delete all 12 /new route files.

### Phase 5: Cleanup

Update routeTree, remove dead imports.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/components/dialogs/sale-dialog.tsx`

- **ADD**: Customer selection dropdown
- **ADD**: Payment status select (paid/pending/partial)
- **ADD**: Payment method select (cash/transfer/credit)
- **ADD**: Collapsible advanced section with unitType, ageWeeks, averageWeightKg
- **PATTERN**: Follow batch-dialog.tsx collapsible pattern (lines 27-28)
- **IMPORTS**: Add getCustomersFn from ~/features/customers/server
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep sale-dialog`

### Task 2: UPDATE `app/components/dialogs/expense-dialog.tsx`

- **ADD**: Supplier selection dropdown (optional)
- **ADD**: isRecurring checkbox
- **IMPORTS**: Add getSuppliersFn from ~/features/suppliers/server
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep expense-dialog`

### Task 3: CREATE `app/components/dialogs/customer-dialog.tsx`

- **IMPLEMENT**: Dialog with fields: name*, phone*, email, location, customerType
- **PATTERN**: Mirror farm-dialog.tsx structure (simple form)
- **IMPORTS**: createCustomer from ~/features/customers/server
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep customer-dialog`

### Task 4: CREATE `app/components/dialogs/supplier-dialog.tsx`

- **IMPLEMENT**: Dialog with fields: name*, phone*, email, location, products[] (multi-select or tags), supplierType
- **PATTERN**: Mirror farm-dialog.tsx structure
- **IMPORTS**: createSupplier from ~/features/suppliers/server
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep supplier-dialog`

### Task 5: CREATE `app/components/dialogs/vaccination-dialog.tsx`

- **IMPLEMENT**: Dialog with type toggle (vaccination/treatment), batch select, name, date, dosage, nextDueDate/withdrawalDays
- **PATTERN**: Mirror vaccinations/new.tsx form logic with type toggle
- **IMPORTS**: createVaccination, createTreatment from ~/features/vaccinations/server
- **PROPS**: farmId, batches (passed from parent)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep vaccination-dialog`

### Task 6: CREATE `app/components/dialogs/water-quality-dialog.tsx`

- **IMPLEMENT**: Dialog with batch select, date, ph, temperature, dissolvedOxygen, ammonia
- **ADD**: Warning indicators when values outside safe range (copy from water-quality/new.tsx)
- **PATTERN**: Mirror water-quality/new.tsx form with threshold warnings
- **IMPORTS**: createWaterQualityRecord, WATER_QUALITY_THRESHOLDS from ~/features/water-quality/server
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep water-quality-dialog`

### Task 7: CREATE `app/components/dialogs/weight-dialog.tsx`

- **IMPLEMENT**: Dialog with batch select, date, sampleSize, averageWeightKg
- **ADD**: Collapsible section for minWeightKg, maxWeightKg, notes
- **PATTERN**: Mirror weight/new.tsx with estimated totals calculation
- **IMPORTS**: createWeightSample from ~/features/weight/server
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep weight-dialog`

### Task 8: CREATE `app/components/dialogs/invoice-dialog.tsx`

- **IMPLEMENT**: Dialog with customer select, line items (dynamic add/remove), dueDate, notes
- **PATTERN**: More complex - needs item management state
- **IMPORTS**: createInvoice, getCustomersFn from respective servers
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep invoice-dialog`

### Task 9: UPDATE `app/routes/_auth/customers/index.tsx`

- **REMOVE**: Inline create form/dialog if exists
- **ADD**: Import CustomerDialog
- **ADD**: createDialogOpen state
- **UPDATE**: "Add Customer" button to open dialog
- **ADD**: CustomerDialog component at end of JSX
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep customers/index`

### Task 10: UPDATE `app/routes/_auth/suppliers/index.tsx`

- **REMOVE**: Inline create form if exists
- **ADD**: Import SupplierDialog
- **ADD**: createDialogOpen state
- **UPDATE**: "Add Supplier" button to open dialog
- **ADD**: SupplierDialog component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep suppliers/index`

### Task 11: UPDATE `app/routes/_auth/vaccinations/index.tsx`

- **ADD**: Import VaccinationDialog
- **ADD**: createDialogOpen state
- **UPDATE**: "Add Record" button to open dialog
- **ADD**: VaccinationDialog with batches prop
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep vaccinations/index`

### Task 12: UPDATE `app/routes/_auth/water-quality/index.tsx`

- **ADD**: Import WaterQualityDialog
- **ADD**: createDialogOpen state
- **UPDATE**: "Add Reading" button to open dialog
- **ADD**: WaterQualityDialog with batches prop
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep water-quality/index`

### Task 13: UPDATE `app/routes/_auth/weight/index.tsx`

- **ADD**: Import WeightDialog
- **ADD**: createDialogOpen state
- **UPDATE**: "Add Sample" button to open dialog
- **ADD**: WeightDialog with batches prop
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep weight/index`

### Task 14: UPDATE `app/routes/_auth/invoices/index.tsx`

- **REMOVE**: Link to /invoices/new (line 249)
- **ADD**: Import InvoiceDialog
- **ADD**: createDialogOpen state
- **UPDATE**: Button to open dialog
- **ADD**: InvoiceDialog component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep invoices/index`

### Task 15: UPDATE `app/routes/_auth/farms/$farmId/index.tsx`

- **REMOVE**: Links to /sales/new and /expenses/new (lines 811, 821)
- **ADD**: SaleDialog and ExpenseDialog imports (if not present)
- **ADD**: Dialog state for each
- **UPDATE**: Buttons to open dialogs
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep 'farms/\$farmId'`

### Task 16: UPDATE `app/routes/_auth/dashboard/index.tsx`

- **REMOVE**: Link to /batches/new (line 316)
- **VERIFY**: BatchDialog already integrated
- **UPDATE**: Button to use dialog instead of link
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep dashboard/index`

### Task 17: REMOVE all /new route files

- **DELETE**: `app/routes/_auth/batches/new.tsx`
- **DELETE**: `app/routes/_auth/customers/new.tsx`
- **DELETE**: `app/routes/_auth/eggs/new.tsx`
- **DELETE**: `app/routes/_auth/expenses/new.tsx`
- **DELETE**: `app/routes/_auth/farms/new.tsx`
- **DELETE**: `app/routes/_auth/feed/new.tsx`
- **DELETE**: `app/routes/_auth/invoices/new.tsx`
- **DELETE**: `app/routes/_auth/sales/new.tsx`
- **DELETE**: `app/routes/_auth/suppliers/new.tsx`
- **DELETE**: `app/routes/_auth/vaccinations/new.tsx`
- **DELETE**: `app/routes/_auth/water-quality/new.tsx`
- **DELETE**: `app/routes/_auth/weight/new.tsx`
- **VALIDATE**: `ls app/routes/_auth/*/new.tsx 2>&1` (should show "No such file")

### Task 18: Regenerate route tree

- **RUN**: `bun dev` briefly to regenerate routeTree.gen.ts
- **VALIDATE**: `grep -c "new" app/routeTree.gen.ts` (should be 0 or minimal)

### Task 19: Final validation

- **VALIDATE**: `npx tsc --noEmit`
- **VALIDATE**: `bun run lint`
- **VALIDATE**: `bun test`

---

## TESTING STRATEGY

### Unit Tests

No new unit tests required - this is a UI refactor. Existing tests should continue to pass.

### Manual Testing

For each feature, verify:

1. Dialog opens from index page button
2. Form validates required fields
3. Submit creates record successfully
4. Dialog closes and list refreshes
5. Error states display correctly

### Integration Tests

Verify no broken links:

```bash
grep -rn '"/.*new"' app/routes/ --include="*.tsx"
```

Should return 0 results after completion.

---

## VALIDATION COMMANDS

### Level 1: TypeScript

```bash
npx tsc --noEmit
```

### Level 2: Lint

```bash
bun run lint
```

### Level 3: Tests

```bash
bun test
```

### Level 4: No /new routes remain

```bash
ls app/routes/_auth/*/new.tsx 2>&1
# Should show: No such file or directory
```

### Level 5: No links to /new routes

```bash
grep -rn 'to="/.*new"' app/routes/ --include="*.tsx" | wc -l
# Should be 0
```

---

## ACCEPTANCE CRITERIA

- [ ] All 6 new dialogs created and functional
- [ ] Sale dialog enhanced with customer/payment fields
- [ ] Expense dialog enhanced with supplier/recurring fields
- [ ] All 12 /new routes removed
- [ ] All index pages use dialogs for creation
- [ ] No links to /new routes remain
- [ ] TypeScript passes with 0 errors
- [ ] ESLint passes with 0 errors
- [ ] All tests pass
- [ ] Manual testing confirms all dialogs work

---

## COMPLETION CHECKLIST

- [ ] Tasks 1-2: Enhance existing dialogs
- [ ] Tasks 3-8: Create 6 new dialogs
- [ ] Tasks 9-16: Update 8 index pages
- [ ] Task 17: Remove 12 /new routes
- [ ] Task 18: Regenerate route tree
- [ ] Task 19: Final validation
- [ ] All validation commands pass

---

## NOTES

### Design Decisions

1. **Dialogs over routes** - Keeps user in context, faster workflow
2. **Pass batches as prop** - Parent loads batches once, passes to dialog (avoids duplicate fetches)
3. **Collapsible advanced sections** - Keep dialogs clean, hide rarely-used fields
4. **router.invalidate()** - Refresh list data after creation without full page reload

### Estimated Time

- Tasks 1-2 (enhance dialogs): 30 min
- Tasks 3-8 (create dialogs): 2 hours
- Tasks 9-16 (update pages): 1 hour
- Tasks 17-19 (cleanup): 30 min

**Total: ~4 hours**

### Risk Assessment

**Low Risk** - Mostly moving existing form logic into dialog components. Server functions unchanged.

### Future Considerations

- Could add "quick create" vs "full create" modes to dialogs
- Could add keyboard shortcuts to open dialogs (Cmd+N)
- Could persist draft form data in localStorage
