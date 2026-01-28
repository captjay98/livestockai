# Design Document: Dialog Standardization

## Overview

This design standardizes all "Add/Create" actions across the application to use inline dialogs instead of separate page routes. The implementation follows the existing dialog patterns established in `_auth.mortality.tsx`, `_auth.sales.tsx`, `_auth.weight.tsx`, and `_auth.water-quality.tsx`.

## Architecture

### Current State

```
┌─────────────────────────────────────────────────────────────┐
│                    List Page (e.g., /invoices)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Create Invoice] → navigates to /invoices/new      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Separate Page (/invoices/new)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Full page form with back navigation                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────┐
│                    List Page (e.g., /invoices)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Create Invoice] → opens dialog overlay            │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           Dialog (Modal)                    │   │   │
│  │  │  ┌─────────────────────────────────────┐   │   │   │
│  │  │  │  Form fields                        │   │   │   │
│  │  │  │  [Cancel] [Submit]                  │   │   │   │
│  │  │  └─────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Dialog State Management Pattern

Each list page will follow this state management pattern:

```typescript
// Dialog open state
const [dialogOpen, setDialogOpen] = useState(false)

// Form data state
const [formData, setFormData] = useState({
    // entity-specific fields
})

// Submission state
const [isSubmitting, setIsSubmitting] = useState(false)
const [error, setError] = useState('')

// Reset form helper
const resetForm = () => {
    setFormData({
        /* initial values */
    })
    setError('')
}

// Submit handler
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
        await createEntityAction({ data: formData })
        setDialogOpen(false)
        resetForm()
        loadData() // Refresh list
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
        setIsSubmitting(false)
    }
}
```

### Dialog Component Structure

```typescript
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent className="sm:max-w-md"> {/* or sm:max-w-lg for complex forms */}
    <DialogHeader>
      <DialogTitle>Create [Entity]</DialogTitle>
      <DialogDescription>Optional description</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Creating...' : 'Create [Entity]'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Trigger Button Pattern

```typescript
<Button onClick={() => setDialogOpen(true)}>
  <Plus className="h-4 w-4 mr-2" />
  Add [Entity]
</Button>
```

## Data Models

No changes to existing data models. The dialogs will use the same server functions already defined in the `.new.tsx` route files, but will expose additional database fields that were previously unused.

### Enhanced Field Usage

| Entity        | New Fields to Expose                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| Expense       | `batchId` (optional link to batch)                                            |
| Feed          | `brandName`, `bagSizeKg`, `numberOfBags`, `supplierId`, `notes`               |
| Customer      | `customerType` (individual, restaurant, retailer, wholesaler)                 |
| Supplier      | `supplierType` (hatchery, feed_mill, pharmacy, equipment, fingerlings, other) |
| Farm          | `contactPhone`, `notes`                                                       |
| Vaccination   | `notes`                                                                       |
| Water Quality | `notes` (already has dialog, just needs notes field added)                    |

### Server Functions to Reuse

| Entity      | Server Function       | Source File                  |
| ----------- | --------------------- | ---------------------------- |
| Invoice     | `createInvoice`       | `lib/invoices/server.ts`     |
| Batch       | `createBatch`         | `lib/batches/server.ts`      |
| Customer    | `createCustomer`      | `lib/customers/server.ts`    |
| Supplier    | `createSupplier`      | `lib/suppliers/server.ts`    |
| Expense     | `createExpense`       | `lib/expenses/server.ts`     |
| Feed        | `createFeedRecord`    | `lib/feed/server.ts`         |
| Egg         | `createEggCollection` | `lib/eggs/server.ts`         |
| Vaccination | `createVaccination`   | `lib/vaccinations/server.ts` |
| Farm        | `createFarm`          | `lib/farms/server.ts`        |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Invoice Line Items Total Calculation

_For any_ set of invoice line items where each item has a quantity and unit price, the displayed total SHALL equal the sum of (quantity × unitPrice) for all items.

**Validates: Requirements 1.3**

### Property 2: Livestock Type to Species Mapping

_For any_ livestock type selection (poultry or fish), the species dropdown options SHALL only contain species that are valid for that livestock type, and changing the livestock type SHALL update the species options accordingly.

**Validates: Requirements 2.3**

### Property 3: Batch Total Cost Calculation

_For any_ batch creation form where quantity Q and cost per unit C are entered, the displayed total cost SHALL equal Q × C.

**Validates: Requirements 2.4**

### Property 4: Form Validation Prevents Invalid Submission

_For any_ dialog form in an invalid state (missing required fields or invalid field values), the submit button SHALL be disabled and form submission SHALL be prevented.

**Validates: Requirements 11.5**

## Error Handling

### Form Validation Errors

- Required fields must be filled before submission is enabled
- Invalid field values (e.g., negative quantities) should be prevented via input constraints
- Server-side validation errors should be displayed in the error message area

### Network Errors

- Display error message in the dialog's error area
- Keep dialog open so user can retry
- Reset `isSubmitting` state to allow retry

### Error Display Pattern

```typescript
{error && (
  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
    {error}
  </div>
)}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. Dialog opens when trigger button is clicked
2. Form fields render correctly with initial values
3. Cancel button closes dialog without submitting
4. Submit button is disabled when form is invalid
5. Error messages display correctly
6. Loading state shows during submission

### Property-Based Tests

Property tests will verify universal properties using a property-based testing library (e.g., fast-check):

1. **Invoice Total Calculation**: Generate random arrays of line items, verify total equals sum of (qty × price)
2. **Species Filtering**: Generate random livestock types, verify species options are correctly filtered
3. **Batch Cost Calculation**: Generate random quantity/cost pairs, verify total equals qty × cost
4. **Form Validation**: Generate random form states, verify invalid states prevent submission

### Test Configuration

- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: **Feature: dialog-standardization, Property {number}: {property_text}**

## Implementation Notes

### Files to Modify

| List Page                 | Add Dialog               | Remove Route                 |
| ------------------------- | ------------------------ | ---------------------------- |
| `_auth.invoices.tsx`      | Invoice creation dialog  | `_auth.invoices.new.tsx`     |
| `_auth.batches.index.tsx` | Batch creation dialog    | `_auth.batches.new.tsx`      |
| `_auth.customers.tsx`     | Customer creation dialog | `_auth.customers.new.tsx`    |
| `_auth.suppliers.tsx`     | Supplier creation dialog | `_auth.suppliers.new.tsx`    |
| `_auth.expenses.tsx`      | Expense creation dialog  | `_auth.expenses.new.tsx`     |
| `_auth.feed.tsx`          | Feed record dialog       | `_auth.feed.new.tsx`         |
| `_auth.eggs.tsx`          | Egg collection dialog    | `_auth.eggs.new.tsx`         |
| `_auth.vaccinations.tsx`  | Vaccination dialog       | `_auth.vaccinations.new.tsx` |
| `_auth.farms.index.tsx`   | Farm creation dialog     | `_auth.farms.new.tsx`        |

### Dialog Width Guidelines

- Simple forms (4-6 fields): `sm:max-w-md`
- Complex forms (7+ fields or dynamic items): `sm:max-w-lg`
- Invoice form (with line items): `sm:max-w-2xl`

### Import Requirements

Each list page will need these additional imports:

```typescript
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
```
