# Design Document: System Enhancements v2

## Overview

This document outlines the technical design for implementing the system enhancements identified in the database audit. The focus is on exposing existing database capabilities through new UI components and improved navigation.

## Architecture

### Current Structure

```
app/
├── components/
│   ├── dialogs/           # Modal dialogs for CRUD operations
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── auth/              # Authentication logic
│   ├── batches/           # Batch server functions
│   ├── customers/         # Customer server functions
│   ├── db/                # Database connection & types
│   ├── expenses/          # Expense server functions
│   ├── farms/             # Farm server functions
│   ├── feed/              # Feed record server functions
│   ├── invoices/          # Invoice server functions
│   ├── sales/             # Sales server functions
│   ├── suppliers/         # Supplier server functions
│   └── ...
└── routes/
    ├── _auth.batches/     # Batch routes (currently "Inventory")
    ├── _auth.customers/   # Customer routes
    ├── _auth.farms/       # Farm routes
    └── ...
```

### New/Modified Structure

```
app/
├── lib/
│   ├── structures/        # NEW: Structure server functions
│   ├── feed-inventory/    # NEW: Feed inventory server functions
│   └── medication-inventory/ # NEW: Medication inventory server functions
└── routes/
    ├── _auth.batches/     # RENAMED from inventory concept
    ├── _auth.inventory/   # NEW: Consolidated inventory page
    │   ├── index.tsx      # Tabs for feed/medication
    │   └── ...
    └── _auth.farms.$farmId.structures/ # NEW: Structures management
```

## Component Design

### 1. Navigation Changes

**File**: `app/components/navigation.tsx`

Changes:

- Rename "Inventory" label to "Batches" (keep same route `/batches`)
- Add new "Inventory" menu item pointing to `/inventory`
- Icon: Use `Package` for Batches, `Warehouse` for Inventory

### 2. Consolidated Inventory Page

**Route**: `/inventory`
**File**: `app/routes/_auth.inventory.index.tsx`

Components:

- `InventoryTabs` - Tab navigation between Feed and Medication
- `FeedInventoryTable` - DataTable for feed inventory
- `MedicationInventoryTable` - DataTable for medication inventory
- `AddFeedInventoryDialog` - Modal for creating feed inventory
- `AddMedicationDialog` - Modal for creating medication
- `EditFeedInventoryDialog` - Modal for editing feed inventory
- `EditMedicationDialog` - Modal for editing medication

Server Functions (new files):

```typescript
// app/lib/feed-inventory/server.ts
export async function getFeedInventory(userId: string, farmId?: string)
export async function createFeedInventory(
  userId: string,
  input: CreateFeedInventoryInput,
)
export async function updateFeedInventory(
  userId: string,
  id: string,
  input: UpdateFeedInventoryInput,
)
export async function deleteFeedInventory(userId: string, id: string)

// app/lib/medication-inventory/server.ts
export async function getMedicationInventory(userId: string, farmId?: string)
export async function createMedication(
  userId: string,
  input: CreateMedicationInput,
)
export async function updateMedication(
  userId: string,
  id: string,
  input: UpdateMedicationInput,
)
export async function deleteMedication(userId: string, id: string)
export async function useMedication(
  userId: string,
  id: string,
  quantity: number,
) // For treatment integration
```

### 3. Structures Management

**Route**: `/farms/$farmId/structures`
**Files**:

- `app/routes/_auth.farms.$farmId.structures.index.tsx`
- `app/routes/_auth.farms.$farmId.structures.$structureId.tsx`

Components:

- `StructuresTable` - DataTable for structures
- `AddStructureDialog` - Modal for creating structure
- `EditStructureDialog` - Modal for editing structure
- `StructureCard` - Card showing structure details and assigned batches

Server Functions:

```typescript
// app/lib/structures/server.ts
export async function getStructures(userId: string, farmId: string)
export async function getStructure(userId: string, structureId: string)
export async function createStructure(
  userId: string,
  input: CreateStructureInput,
)
export async function updateStructure(
  userId: string,
  id: string,
  input: UpdateStructureInput,
)
export async function deleteStructure(userId: string, id: string)
export async function getStructureBatches(userId: string, structureId: string)
```

### 4. Enhanced Sales Form

**File**: `app/components/dialogs/add-sale-dialog.tsx` (modify existing)

New form fields:

```typescript
interface EnhancedSaleInput {
  // Existing fields...
  unitType?: 'bird' | 'kg' | 'crate' | 'piece'
  ageWeeks?: number
  averageWeightKg?: number
  paymentStatus?: 'paid' | 'pending' | 'partial'
  paymentMethod?: 'cash' | 'transfer' | 'credit'
}
```

UI Changes:

- Add collapsible "Additional Details" section
- Add payment status select with color-coded options
- Add payment method select
- Add unit type select
- Add age and weight number inputs

### 5. Enhanced Batch Form

**File**: `app/components/dialogs/add-batch-dialog.tsx` (modify existing)

New form fields:

```typescript
interface EnhancedBatchInput {
  // Existing fields...
  batchName?: string
  sourceSize?: 'day-old' | 'point-of-lay' | 'fingerling' | 'jumbo'
  structureId?: string
  targetHarvestDate?: Date
}
```

UI Changes:

- Add batch name text input
- Add source size select (contextual based on livestock type)
- Add structure select (populated from farm's structures)
- Add target harvest date picker

### 6. Enhanced Weight Sample Form

**File**: `app/components/dialogs/add-weight-dialog.tsx` (modify existing)

New form fields:

```typescript
interface EnhancedWeightInput {
  // Existing fields...
  minWeightKg?: number
  maxWeightKg?: number
}
```

### 7. Customer/Supplier Type Filtering

**Files**:

- `app/routes/_auth.customers.index.tsx` (modify)
- `app/routes/_auth.suppliers.index.tsx` (modify)

Changes:

- Add type filter dropdown to table toolbar
- Add type badge to table rows
- Make type required in create/edit dialogs

## Data Flow

### Inventory Page Data Flow

```
User selects farm →
  getFeedInventory(userId, farmId) → Feed inventory list
  getMedicationInventory(userId, farmId) → Medication inventory list

User creates feed inventory →
  createFeedInventory(userId, input) → New record
  Invalidate feed inventory query

User creates medication →
  createMedication(userId, input) → New record
  Invalidate medication inventory query
```

### Structures Data Flow

```
User views farm →
  getStructures(userId, farmId) → Structures list

User creates structure →
  createStructure(userId, input) → New record
  Invalidate structures query

User assigns batch to structure →
  updateBatch(userId, batchId, { structureId }) → Updated batch
  Invalidate batch and structure queries
```

## UI/UX Considerations

### Low Stock Alerts

- Feed: Show warning badge when `quantityKg < minThresholdKg`
- Medication: Show warning badge when `quantity < minThreshold`
- Color: Yellow for low, Red for critical (< 50% of threshold)

### Expiry Warnings

- Show warning for medications expiring within 30 days
- Show critical alert for expired medications
- Sort expired/expiring items to top of list

### Payment Status Indicators

- Paid: Green badge/dot
- Pending: Yellow badge/dot
- Partial: Orange badge/dot

### Structure Status Indicators

- Active: Green badge
- Empty: Gray badge
- Maintenance: Yellow badge

## Testing Strategy

### Unit Tests

- Server function tests for all new CRUD operations
- Input validation tests
- Authorization tests (farm access verification)

### Integration Tests

- Inventory page renders with correct data
- CRUD operations update UI correctly
- Filters work as expected

### E2E Tests

- Complete flow: Create structure → Assign batch → View in structure details
- Complete flow: Create medication → Use in treatment → Verify inventory reduced
