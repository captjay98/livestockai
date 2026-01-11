# Implementation Tasks: System Enhancements v2

## Phase 1: Navigation & Inventory Management (High Priority)

### Task 1.1: Update Navigation

- [ ] Modify `app/components/navigation.tsx`
  - Rename "Inventory" label to "Batches"
  - Add new "Inventory" menu item with Warehouse icon
  - Route: `/inventory`

### Task 1.2: Create Feed Inventory Server Functions

- [ ] Create `app/lib/feed-inventory/server.ts`
  - `getFeedInventory(userId, farmId?)` - List feed inventory
  - `getFeedInventoryPaginated(userId, query)` - Paginated list
  - `createFeedInventory(userId, input)` - Create record
  - `updateFeedInventory(userId, id, input)` - Update record
  - `deleteFeedInventory(userId, id)` - Delete record
  - Server function exports for client calls

### Task 1.3: Create Medication Inventory Server Functions

- [ ] Create `app/lib/medication-inventory/server.ts`
  - `getMedicationInventory(userId, farmId?)` - List medications
  - `getMedicationInventoryPaginated(userId, query)` - Paginated list
  - `createMedication(userId, input)` - Create record
  - `updateMedication(userId, id, input)` - Update record
  - `deleteMedication(userId, id)` - Delete record
  - `useMedication(userId, id, quantity)` - Reduce inventory (for treatments)
  - Server function exports for client calls

### Task 1.4: Create Inventory Page Route

- [ ] Create `app/routes/_auth.inventory.index.tsx`
  - Tab component for Feed/Medication toggle
  - Farm selector integration
  - Low stock alerts section

### Task 1.5: Create Feed Inventory UI Components

- [ ] Create `app/components/dialogs/add-feed-inventory-dialog.tsx`
- [ ] Create `app/components/dialogs/edit-feed-inventory-dialog.tsx`
- [ ] Add feed inventory table to inventory page
  - Columns: feedType, quantityKg, minThresholdKg, status, updatedAt, actions
  - Low stock indicator
  - Edit/Delete actions

### Task 1.6: Create Medication Inventory UI Components

- [ ] Create `app/components/dialogs/add-medication-dialog.tsx`
- [ ] Create `app/components/dialogs/edit-medication-dialog.tsx`
- [ ] Add medication table to inventory page
  - Columns: medicationName, quantity, unit, expiryDate, minThreshold, status, actions
  - Low stock indicator
  - Expiry warning indicator
  - Edit/Delete actions

### Task 1.7: Update Route Tree

- [ ] Run route generation to include new inventory routes
- [ ] Verify navigation works correctly

---

## Phase 2: Structures Management (High Priority)

### Task 2.1: Create Structures Server Functions

- [ ] Create `app/lib/structures/server.ts`
  - `getStructures(userId, farmId)` - List structures for farm
  - `getStructure(userId, structureId)` - Get single structure with batches
  - `createStructure(userId, input)` - Create structure
  - `updateStructure(userId, id, input)` - Update structure
  - `deleteStructure(userId, id)` - Delete structure (check for assigned batches)
  - Server function exports for client calls

### Task 2.2: Create Structures Routes

- [ ] Create `app/routes/_auth.farms.$farmId.structures.index.tsx`
  - Structures list/grid view
  - Add structure button
  - Status filters
- [ ] Create `app/routes/_auth.farms.$farmId.structures.$structureId.tsx`
  - Structure details
  - Assigned batches list
  - Edit/Delete actions

### Task 2.3: Create Structures UI Components

- [ ] Create `app/components/dialogs/add-structure-dialog.tsx`
  - Fields: name, type, capacity, areaSqm, status, notes
  - Type options: house, pond, pen, cage
  - Status options: active, empty, maintenance
- [ ] Create `app/components/dialogs/edit-structure-dialog.tsx`
- [ ] Create `app/components/structure-card.tsx` (optional grid view)

### Task 2.4: Add Structures Link to Farm Page

- [ ] Modify `app/routes/_auth.farms.$farmId.index.tsx`
  - Add "Structures" section or tab
  - Link to structures management page

### Task 2.5: Update Batch Form with Structure Selection

- [ ] Modify `app/components/dialogs/add-batch-dialog.tsx`
  - Add structureId select field
  - Populate with farm's structures
- [ ] Modify batch edit dialog similarly

---

## Phase 3: Enhanced Sales (Medium Priority)

### Task 3.1: Update Sales Server Functions

- [ ] Modify `app/lib/sales/server.ts`
  - Update `CreateSaleInput` interface to include new fields
  - Update `createSale` to save new fields
  - Update `updateSale` to handle new fields
  - Add paymentStatus filter to `getSalesPaginated`

### Task 3.2: Update Sales Form

- [ ] Modify `app/components/dialogs/add-sale-dialog.tsx`
  - Add "Additional Details" collapsible section
  - Add unitType select (bird, kg, crate, piece)
  - Add ageWeeks number input
  - Add averageWeightKg number input
  - Add paymentStatus select (paid, pending, partial)
  - Add paymentMethod select (cash, transfer, credit)

### Task 3.3: Update Sales Table

- [ ] Modify sales listing page
  - Add paymentStatus column with color-coded badge
  - Add paymentStatus filter dropdown
  - Show additional fields in expanded row or tooltip

### Task 3.4: Add Payment Status Update

- [ ] Add quick action to update payment status from table
- [ ] Create `app/components/dialogs/update-payment-status-dialog.tsx`

---

## Phase 4: Enhanced Batch Creation (Medium Priority)

### Task 4.1: Update Batch Server Functions

- [ ] Modify `app/lib/batches/server.ts`
  - Update `CreateBatchInput` to include batchName, sourceSize, structureId, targetHarvestDate
  - Update `createBatch` to save new fields
  - Update `updateBatch` to handle new fields

### Task 4.2: Update Batch Form

- [ ] Modify `app/components/dialogs/add-batch-dialog.tsx`
  - Add batchName text input
  - Add sourceSize select (contextual: day-old/point-of-lay for poultry, fingerling/jumbo for fish)
  - Add structureId select (from farm's structures)
  - Add targetHarvestDate date picker

### Task 4.3: Update Batch Display

- [ ] Modify batch listing to show batchName if set
- [ ] Modify batch details page to show:
  - Structure name (linked)
  - Source size
  - Target harvest date with countdown
  - Days until target harvest

---

## Phase 5: Enhanced Weight Samples (Low Priority)

### Task 5.1: Update Weight Server Functions

- [ ] Modify weight sample server functions
  - Update input interface to include minWeightKg, maxWeightKg
  - Update create/update functions

### Task 5.2: Update Weight Form

- [ ] Modify weight sample dialog
  - Add minWeightKg number input
  - Add maxWeightKg number input
  - Validate min <= average <= max

### Task 5.3: Update Weight Display

- [ ] Modify weight records table/list
  - Show weight range (min - max) if available
  - Calculate and show CV% if min/max provided

---

## Phase 6: Customer/Supplier Type Filtering (Low Priority)

### Task 6.1: Update Customer List

- [ ] Modify `app/routes/_auth.customers.index.tsx`
  - Add customerType filter dropdown
  - Add type badge to table rows
- [ ] Modify customer create/edit dialogs
  - Make customerType required

### Task 6.2: Update Supplier List

- [ ] Modify `app/routes/_auth.suppliers.index.tsx`
  - Add supplierType filter dropdown
  - Add type badge to table rows
- [ ] Modify supplier create/edit dialogs
  - Make supplierType required

---

## Testing Tasks

### Unit Tests

- [ ] Test feed inventory CRUD operations
- [ ] Test medication inventory CRUD operations
- [ ] Test structures CRUD operations
- [ ] Test enhanced sales with new fields
- [ ] Test enhanced batch with new fields

### Integration Tests

- [ ] Test inventory page renders correctly
- [ ] Test structures page renders correctly
- [ ] Test navigation changes work

---

## Deployment Checklist

- [ ] All tests pass (`bun run test`)
- [ ] Build succeeds (`bun run build`)
- [ ] Manual testing on local
- [ ] Deploy to Cloudflare (`bun run deploy`)
- [ ] Verify on production
