# Design Document: Production Readiness Fixes

## Overview

This design document outlines the technical approach to fix critical bugs, security gaps, form-schema mismatches, and mobile responsiveness issues identified in the production readiness audit. The fixes are organized into four categories: bug fixes, security enhancements, form enhancements, and UI/UX improvements.

## Architecture

The changes follow the existing application architecture:

- **Server Functions**: TanStack Start server functions with Kysely ORM
- **Components**: React components with shadcn/ui
- **Styling**: Tailwind CSS with responsive utilities
- **State Management**: React useState with router invalidation

### Change Categories

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Readiness                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Bug Fixes     │   Security      │   Form Enhancements     │
│                 │                 │                         │
│ • Duplicate     │ • Customer      │ • Sale Dialog           │
│   return stmt   │   auth checks   │ • Expense Dialog        │
│                 │                 │ • Feed Dialog           │
├─────────────────┴─────────────────┴─────────────────────────┤
│                  Mobile Responsiveness                       │
│                                                             │
│ • Dashboard card overflow                                   │
│ • General viewport constraints                              │
│ • Dialog mobile sizing                                      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Bug Fix: Expense Server

**File**: `app/lib/expenses/server.ts`

**Change**: Remove duplicate return statement in `deleteExpenseFn` handler.

```typescript
// BEFORE (lines 130-131)
export const deleteExpenseFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    // ...
    return deleteExpense(session.user.id, data.expenseId)
    return deleteExpense(session.user.id, data.expenseId) // DUPLICATE
  },
)

// AFTER
export const deleteExpenseFn = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    // ...
    return deleteExpense(session.user.id, data.expenseId)
  },
)
```

### 2. Form Enhancement: Sale Dialog

**File**: `app/components/dialogs/sale-dialog.tsx`

**New Form Fields** (in collapsible "Additional Details" section):

```typescript
interface SaleFormData {
  // Existing fields
  livestockType: 'poultry' | 'fish' | 'eggs' | ''
  batchId: string
  quantity: string
  unitPrice: string
  date: string
  notes: string

  // NEW fields
  customerId: string // Optional customer selector
  unitType: string // bird | kg | crate | piece
  ageWeeks: string // For poultry sales
  averageWeightKg: string // Weight at sale
  paymentStatus: string // paid | pending | partial (default: paid)
  paymentMethod: string // cash | transfer | credit
}
```

**UI Layout**:

```
┌─────────────────────────────────────────┐
│ Record Sale                             │
├─────────────────────────────────────────┤
│ What are you selling? [Dropdown]        │
│ Batch (Optional)      [Dropdown]        │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ Quantity    │ │ Price/Unit  │        │
│ └─────────────┘ └─────────────┘        │
│ Sale Date             [Date Picker]     │
│                                         │
│ ▼ Additional Details                    │
│ ┌─────────────────────────────────────┐ │
│ │ Customer (Optional)  [Dropdown]     │ │
│ │ Unit Type           [Dropdown]      │ │
│ │ ┌───────────┐ ┌───────────┐        │ │
│ │ │ Age (wks) │ │ Avg Weight│        │ │
│ │ └───────────┘ └───────────┘        │ │
│ │ ┌───────────┐ ┌───────────┐        │ │
│ │ │ Payment   │ │ Method    │        │ │
│ │ │ Status    │ │           │        │ │
│ │ └───────────┘ └───────────┘        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Notes (Optional)      [Textarea]        │
│                                         │
│ Total: ₦XX,XXX                          │
│                                         │
│         [Cancel]  [Record Sale]         │
└─────────────────────────────────────────┘
```

### 3. Form Enhancement: Expense Dialog

**File**: `app/components/dialogs/expense-dialog.tsx`

**New Form Field**:

```typescript
interface ExpenseFormData {
  // Existing fields
  category: string
  amount: string
  date: string
  description: string
  supplierId: string
  isRecurring: boolean

  // NEW field
  batchId: string // Optional batch selector
}
```

### 4. Form Enhancement: Feed Dialog

**File**: `app/components/dialogs/feed-dialog.tsx`

**New Form Fields** (in collapsible section):

```typescript
interface FeedFormData {
  // Existing fields
  batchId: string
  feedType: string
  quantityKg: string
  cost: string
  date: string

  // NEW fields
  brandName: string // e.g., "Aller Aqua", "Ultima Plus"
  bagSizeKg: string // 15, 25, etc.
  numberOfBags: string // How many bags
  supplierId: string // Supplier selector
  notes: string // Additional notes
}
```

### 5. Customer Route Fix

**File**: `app/routes/_auth.customers.$customerId.tsx`

**Changes**:

- Replace `window.location.reload()` with `router.invalidate()`
- Add proper error page for customer not found

```typescript
// BEFORE
await updateCustomerFn({...})
setEditDialogOpen(false)
window.location.reload()

// AFTER
await updateCustomerFn({...})
setEditDialogOpen(false)
router.invalidate()
```

### 6. Mobile Responsiveness: Dashboard

**File**: `app/routes/_auth.dashboard.tsx` (or equivalent)

**CSS Changes**:

```css
/* Prevent horizontal overflow on mobile */
.dashboard-container {
  @apply overflow-x-hidden;
}

/* Responsive card grid */
.stats-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

/* Constrain card widths */
.stat-card {
  @apply min-w-0 overflow-hidden;
}

/* Table horizontal scroll container */
.table-container {
  @apply overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0;
}
```

**Tailwind Classes to Apply**:

- Add `overflow-x-hidden` to main container
- Add `min-w-0` to flex/grid children to allow shrinking
- Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for responsive grids
- Wrap tables in `overflow-x-auto` container

## Data Models

No new database tables required. All form fields map to existing columns in the database schema.

### Field Mappings

| Dialog  | New Form Field  | DB Column                 | Type           |
| ------- | --------------- | ------------------------- | -------------- |
| Sale    | customerId      | sales.customerId          | string \| null |
| Sale    | unitType        | sales.unitType            | enum           |
| Sale    | ageWeeks        | sales.ageWeeks            | number \| null |
| Sale    | averageWeightKg | sales.averageWeightKg     | decimal        |
| Sale    | paymentStatus   | sales.paymentStatus       | enum           |
| Sale    | paymentMethod   | sales.paymentMethod       | enum           |
| Expense | batchId         | expenses.batchId          | string \| null |
| Feed    | brandName       | feed_records.brandName    | string \| null |
| Feed    | bagSizeKg       | feed_records.bagSizeKg    | number \| null |
| Feed    | numberOfBags    | feed_records.numberOfBags | number \| null |
| Feed    | supplierId      | feed_records.supplierId   | string \| null |
| Feed    | notes           | feed_records.notes        | string \| null |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Sale Form Data Completeness

_For any_ valid sale form submission with all optional fields populated, the createSaleFn server function SHALL receive all field values including customerId, unitType, ageWeeks, averageWeightKg, paymentStatus, and paymentMethod.

**Validates: Requirements 3.7**

### Property 2: Expense Batch Association

_For any_ expense form submission where a batch is selected, the createExpenseFn server function SHALL receive the batchId value.

**Validates: Requirements 4.2**

### Property 3: Feed Record Data Completeness

_For any_ valid feed record form submission with all optional fields populated, the createFeedRecordFn server function SHALL receive all field values including brandName, bagSizeKg, numberOfBags, supplierId, and notes.

**Validates: Requirements 5.6**

## Error Handling

### Authorization Errors

Standard Better Auth handling applies - unauthenticated users are redirected to login.

### Form Validation Errors

- All existing validation remains in place
- New optional fields do not require validation (nullable in DB)
- Numeric fields (ageWeeks, averageWeightKg, bagSizeKg, numberOfBags) validate as positive numbers when provided

### Mobile Layout Errors

- Use CSS `overflow-x-hidden` on containers to prevent accidental horizontal scroll
- Use `min-w-0` on flex/grid children to allow proper shrinking
- Test on actual mobile devices or browser dev tools

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Bug Fix Test**: Verify deleteExpenseFn executes without error
2. **Form Field Test**: Verify new form fields render correctly
3. **Error Page Test**: Verify customer not found shows proper error UI

### Property-Based Tests

Property tests will verify universal properties using fast-check:

1. **Form Data Completeness Properties**: Generate random form data and verify all fields pass to server

### Visual/Manual Tests

Mobile responsiveness requires manual or visual regression testing:

1. Test dashboard on iPhone SE (375px width)
2. Test dashboard on standard mobile (390px width)
3. Verify no horizontal scroll on any page
4. Verify dialogs fit within mobile viewport

### Test Configuration

- Property tests: minimum 100 iterations
- Test framework: Vitest with fast-check
- Tag format: **Feature: production-readiness, Property {number}: {property_text}**
