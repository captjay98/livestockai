# Error Handling Improvements Plan

## Overview

Improve error handling consistency across dialogs and add domain-specific error codes.

## Tasks

### Task 1: Add Domain-Specific Error Codes

**File**: `app/lib/errors/error-map.ts`

Add these error codes:

```typescript
// Not Found (404xx) - add after BATCH_NOT_FOUND
CUSTOMER_NOT_FOUND: { code: 40403, httpStatus: 404, category: 'NOT_FOUND', message: 'Customer not found' },
SUPPLIER_NOT_FOUND: { code: 40404, httpStatus: 404, category: 'NOT_FOUND', message: 'Supplier not found' },
INVOICE_NOT_FOUND: { code: 40405, httpStatus: 404, category: 'NOT_FOUND', message: 'Invoice not found' },
STRUCTURE_NOT_FOUND: { code: 40406, httpStatus: 404, category: 'NOT_FOUND', message: 'Structure not found' },
SALE_NOT_FOUND: { code: 40407, httpStatus: 404, category: 'NOT_FOUND', message: 'Sale not found' },
```

**Time**: 5 min

### Task 2: Add i18n Translations for New Codes

**Files**: All 15 locale files in `app/features/i18n/locales/`

Add to errors section:

```typescript
CUSTOMER_NOT_FOUND: 'Customer not found',
SUPPLIER_NOT_FOUND: 'Supplier not found',
INVOICE_NOT_FOUND: 'Invoice not found',
STRUCTURE_NOT_FOUND: 'Structure not found',
SALE_NOT_FOUND: 'Sale not found',
```

**Time**: 15 min

### Task 3: Add toast.error to Dialog Components

**Files**: 12 dialog components in `app/components/dialogs/`

Pattern to add in catch blocks:

```typescript
} catch (err) {
  console.error('Operation failed:', err)
  toast.error(t('errors.operationFailed', { defaultValue: 'Operation failed' }))
}
```

**Dialogs to update**:

1. `batch-dialog.tsx`
2. `customer-dialog.tsx`
3. `edit-farm-dialog.tsx`
4. `egg-dialog.tsx`
5. `expense-dialog.tsx`
6. `farm-dialog.tsx`
7. `feed-dialog.tsx`
8. `invoice-dialog.tsx`
9. `sale-dialog.tsx`
10. `supplier-dialog.tsx`
11. `vaccination-dialog.tsx`
12. `water-quality-dialog.tsx`
13. `weight-dialog.tsx`

**Time**: 20 min

### Task 4: Update Server Functions to Use New Codes

**Files**: Replace generic `NOT_FOUND` with specific codes

- `customers/server.ts` → `CUSTOMER_NOT_FOUND`
- `suppliers/server.ts` → `SUPPLIER_NOT_FOUND`
- `invoices/server.ts` → `INVOICE_NOT_FOUND`
- `structures/server.ts` → `STRUCTURE_NOT_FOUND`
- `sales/server.ts` → `SALE_NOT_FOUND`

**Time**: 15 min

## Summary

| Task                       | Files  | Time        |
| -------------------------- | ------ | ----------- |
| Add error codes            | 1      | 5 min       |
| Add i18n translations      | 15     | 15 min      |
| Add toast.error to dialogs | 13     | 20 min      |
| Update server functions    | 5      | 15 min      |
| **Total**                  | **34** | **~55 min** |

## Validation

```bash
npx tsc --noEmit
bun run lint
```
