# Design Document: System Integration v3

## Overview

This design document outlines the implementation of system integration improvements for OpenLivestock, focusing on automated inventory management, complete CRUD operations for customers/suppliers/invoices, dark mode fixes, and improved data relationships.

## Architecture

The system follows a layered architecture:

- **UI Layer**: React components with TanStack Router
- **Server Functions**: TanStack Start server functions for data operations
- **Data Layer**: Kysely ORM with PostgreSQL (Neon)

Key integration points:

1. Feed Records → Feed Inventory (automatic deduction)
2. Sales → Invoices (linkage)
3. Batches → Structures → Farms (hierarchical relationship)

## Components and Interfaces

### 1. Feed Inventory Integration

```typescript
// app/lib/feed/server.ts - Enhanced createFeedRecord
interface CreateFeedRecordInput {
    batchId: string
    feedType: FeedType
    brandName?: string
    bagSizeKg?: number
    numberOfBags?: number
    quantityKg: string
    cost: string
    date: Date
    supplierId?: string
    notes?: string
}

// Automatically deducts from feed_inventory when creating a feed record
async function createFeedRecord(
    input: CreateFeedRecordInput,
): Promise<FeedRecord>

// Automatically restores to feed_inventory when deleting a feed record
async function deleteFeedRecord(id: string): Promise<void>
```

### 2. Customer Detail Page

```typescript
// app/routes/_auth.customers.$customerId.tsx
interface CustomerDetailData {
    customer: Customer
    salesHistory: Sale[]
    totalPurchases: number
    invoices: Invoice[]
}
```

### 3. Supplier Detail Page

```typescript
// app/routes/_auth.suppliers.$supplierId.tsx - Already exists, needs fixing
interface SupplierDetailData {
    supplier: Supplier
    purchaseHistory: Expense[]
    batchesSupplied: Batch[]
    totalSpent: number
}
```

### 4. Invoice Dialog

```typescript
// app/components/dialogs/invoice-dialog.tsx
interface InvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    farmId: string
    customerId?: string
    saleId?: string // Optional: create invoice from sale
    onSuccess?: () => void
}
```

### 5. Feed Type Labels

```typescript
// app/lib/feed/constants.ts
const FEED_TYPE_LABELS: Record<FeedType, string> = {
    starter: 'Starter Feed',
    grower: 'Grower Feed',
    finisher: 'Finisher Feed',
    layer_mash: 'Layer Mash',
    fish_feed: 'Fish Feed',
}

const POULTRY_FEED_TYPES = ['starter', 'grower', 'finisher', 'layer_mash']
const FISH_FEED_TYPES = ['fish_feed', 'starter', 'grower', 'finisher']
```

## Data Models

### Feed Inventory Deduction Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Feed Record    │────▶│  Feed Inventory  │────▶│  Low Stock      │
│  Created        │     │  Deducted        │     │  Alert          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Feed Record    │────▶│  Feed Inventory  │
│  Deleted        │     │  Restored        │
└─────────────────┘     └──────────────────┘
```

### Entity Relationships

```
Farm
 ├── Structures (1:N)
 │    └── Batches (1:N)
 ├── Feed Inventory (1:N)
 ├── Medication Inventory (1:N)
 ├── Sales (1:N)
 │    └── Invoices (1:1)
 └── Expenses (1:N)

Customer
 ├── Sales (1:N)
 └── Invoices (1:N)

Supplier
 ├── Batches (1:N) - source
 ├── Expenses (1:N)
 └── Feed Records (1:N)
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Feed Inventory Deduction Consistency

_For any_ feed record creation with quantity Q and corresponding feed inventory with initial quantity I, the resulting inventory quantity SHALL equal I - Q.

**Validates: Requirements 1.1**

### Property 2: Feed Inventory Restoration on Delete

_For any_ feed record deletion with quantity Q and corresponding feed inventory with current quantity C, the resulting inventory quantity SHALL equal C + Q.

**Validates: Requirements 1.2**

### Property 3: Low Stock Detection

_For any_ feed inventory with quantity Q and threshold T, the inventory SHALL be flagged as low stock if and only if Q < T.

**Validates: Requirements 1.4**

### Property 4: Customer Relationship Detection

_For any_ customer, the system SHALL correctly identify whether they have associated sales by checking the sales table for matching customerId.

**Validates: Requirements 2.4**

### Property 5: Supplier Relationship Detection

_For any_ supplier, the system SHALL correctly identify whether they have associated expenses or batches by checking both tables for matching supplierId.

**Validates: Requirements 3.4**

### Property 6: Invoice-Sale Linkage

_For any_ invoice created from a sale, the invoice's linked sale SHALL have its invoiceId updated to reference the new invoice.

**Validates: Requirements 4.5**

### Property 7: Feed Type Label Completeness

_For any_ valid feed type, the label function SHALL return a non-empty human-readable string.

**Validates: Requirements 7.1**

### Property 8: Feed Type Filtering by Livestock

_For any_ batch with livestockType 'poultry', the available feed types SHALL include starter, grower, finisher, and layer*mash. \_For any* batch with livestockType 'fish', the available feed types SHALL include fish_feed.

**Validates: Requirements 7.3**

## Error Handling

1. **Insufficient Inventory**: When feed record quantity exceeds inventory, show warning toast but allow creation (inventory can go negative to track debt)
2. **Delete with Relationships**: When deleting customer/supplier with relationships, show confirmation with count of related records
3. **Invalid Feed Type**: When feed type doesn't match livestock type, show validation error

## Testing Strategy

### Unit Tests

- Feed type label function returns correct labels
- Feed type filtering returns correct options for livestock type
- Relationship detection functions correctly identify linked records

### Property-Based Tests

- Feed inventory deduction/restoration maintains consistency
- Low stock detection threshold logic
- Invoice-sale linkage integrity

### Integration Tests

- Full flow: Create feed record → inventory deducted → low stock alert
- Full flow: Create invoice from sale → sale updated with invoiceId
