# Requirements Document: System Enhancements v2

## Introduction

This spec covers enhancements to the JayFarms platform based on a comprehensive database audit. The audit identified partially used tables, unused features, and opportunities to improve the user experience through better navigation, enhanced data capture, and consolidated inventory management.

## Technical Context

- **Framework**: TanStack Start (full-stack React framework)
- **Database**: PostgreSQL with Kysely (type-safe SQL query builder)
- **Authentication**: Better Auth (self-hosted, session-based)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Currency**: Nigerian Naira (₦)

## Audit Summary

### Tables Fully Used ✅

users, sessions, account, verification, farms, user_farms, batches, mortality_records, feed_records, egg_records, weight_samples, vaccinations, treatments, water_quality, expenses, customers, suppliers, invoices, invoice_items

### Tables Partially Used ⚠️

- **structures**: Only read in batch details, no CRUD UI
- **sales**: Missing UI fields (unitType, ageWeeks, averageWeightKg, paymentStatus, paymentMethod)
- **feed_inventory**: No dedicated management UI

### Tables Not Used 🔴

- **medication_inventory**: Table exists but completely unused

## Requirements

### Requirement 1: Navigation Restructure

**User Story:** As a user, I want clearer navigation that separates livestock batches from inventory management, so that I can quickly access the right section.

#### Acceptance Criteria

1. WHEN a user views the navigation, THE Platform SHALL display "Batches" (renamed from "Inventory") for livestock batch management
2. WHEN a user views the navigation, THE Platform SHALL display a new "Inventory" menu item for feed and medication inventory
3. WHEN a user clicks "Batches", THE Platform SHALL navigate to the existing batch listing page
4. WHEN a user clicks "Inventory", THE Platform SHALL navigate to a new consolidated inventory page

### Requirement 2: Consolidated Inventory Management Page

**User Story:** As a farm manager, I want a single page to manage all inventory (feed and medications), so that I can efficiently track supplies.

#### Acceptance Criteria

1. WHEN a user opens the Inventory page, THE Platform SHALL display tabs for "Feed Inventory" and "Medication Inventory"
2. WHEN viewing Feed Inventory tab, THE Platform SHALL display all feed inventory records with feedType, quantityKg, minThresholdKg, and updatedAt
3. WHEN viewing Medication Inventory tab, THE Platform SHALL display all medication records with medicationName, quantity, unit, expiryDate, minThreshold, and updatedAt
4. THE Platform SHALL allow creating, editing, and deleting feed inventory records
5. THE Platform SHALL allow creating, editing, and deleting medication inventory records
6. THE Platform SHALL display low stock alerts when quantity falls below minThreshold
7. THE Platform SHALL display expiry warnings for medications expiring within 30 days
8. THE Platform SHALL filter inventory by the selected farm

### Requirement 3: Structures Management UI

**User Story:** As a farm manager, I want to manage structures (houses, ponds, pens, cages) within my farm, so that I can organize livestock by location.

#### Acceptance Criteria

1. WHEN a user views a farm, THE Platform SHALL display a "Structures" section or tab
2. WHEN a user views structures, THE Platform SHALL display all structures for that farm with name, type, capacity, areaSqm, status, and notes
3. THE Platform SHALL allow creating new structures with name, type (house, pond, pen, cage), capacity (optional), areaSqm (optional), status (active, empty, maintenance), and notes (optional)
4. THE Platform SHALL allow editing existing structures
5. THE Platform SHALL allow deleting structures (with confirmation if batches are assigned)
6. WHEN a user creates or edits a batch, THE Platform SHALL allow selecting a structure from the farm's structures
7. WHEN viewing a structure, THE Platform SHALL display all batches currently assigned to it

### Requirement 4: Enhanced Sales Recording

**User Story:** As a business owner, I want to capture complete sale details including payment status and livestock metrics, so that I can track receivables and analyze sale performance.

#### Acceptance Criteria

1. WHEN a user records a sale, THE Platform SHALL capture unitType (bird, kg, crate, piece) - optional
2. WHEN a user records a sale, THE Platform SHALL capture ageWeeks (age at sale) - optional
3. WHEN a user records a sale, THE Platform SHALL capture averageWeightKg (weight at sale) - optional
4. WHEN a user records a sale, THE Platform SHALL capture paymentStatus (paid, pending, partial) - defaults to 'paid'
5. WHEN a user records a sale, THE Platform SHALL capture paymentMethod (cash, transfer, credit) - optional
6. WHEN viewing sales list, THE Platform SHALL display paymentStatus with visual indicators (green=paid, yellow=pending, red=partial)
7. THE Platform SHALL allow filtering sales by paymentStatus
8. THE Platform SHALL allow updating paymentStatus on existing sales

### Requirement 5: Enhanced Batch Creation

**User Story:** As a farm manager, I want to capture more details when creating batches, so that I can better track and plan livestock management.

#### Acceptance Criteria

1. WHEN a user creates a batch, THE Platform SHALL allow entering batchName (optional, e.g., "NOV-2024-BR-01")
2. WHEN a user creates a batch, THE Platform SHALL allow selecting sourceSize (day-old, point-of-lay, fingerling, jumbo) - optional
3. WHEN a user creates a batch, THE Platform SHALL allow selecting structureId from farm's structures - optional
4. WHEN a user creates a batch, THE Platform SHALL allow entering targetHarvestDate - optional
5. WHEN viewing batch list, THE Platform SHALL display batchName if set, otherwise show species
6. WHEN viewing batch details, THE Platform SHALL display all enhanced fields including structure name and days until target harvest

### Requirement 6: Enhanced Weight Samples

**User Story:** As a farm manager, I want to record weight ranges in samples, so that I can track uniformity and identify outliers.

#### Acceptance Criteria

1. WHEN a user records a weight sample, THE Platform SHALL allow entering minWeightKg (smallest in sample) - optional
2. WHEN a user records a weight sample, THE Platform SHALL allow entering maxWeightKg (largest in sample) - optional
3. WHEN viewing weight records, THE Platform SHALL display the weight range (min - max) alongside average
4. THE Platform SHALL calculate and display coefficient of variation (CV) when min/max are provided

### Requirement 7: Customer/Supplier Type Filtering

**User Story:** As a business owner, I want to filter customers and suppliers by type, so that I can quickly find the right contacts.

#### Acceptance Criteria

1. WHEN viewing customers list, THE Platform SHALL allow filtering by customerType (individual, restaurant, retailer, wholesaler)
2. WHEN viewing suppliers list, THE Platform SHALL allow filtering by supplierType (hatchery, feed_mill, pharmacy, equipment, fingerlings, other)
3. WHEN creating/editing a customer, THE Platform SHALL require selecting customerType
4. WHEN creating/editing a supplier, THE Platform SHALL require selecting supplierType
5. THE Platform SHALL display type badges on customer/supplier cards

## Migration Requirements

### Database Changes

No schema changes required - all fields already exist in the database. This enhancement focuses on:

1. Building UI for existing but unused tables (medication_inventory)
2. Exposing existing but hidden fields in forms (sales enhanced fields, batch enhanced fields, weight sample enhanced fields)
3. Building CRUD UI for structures table
4. Navigation restructure (frontend only)

## Priority Order

1. **High**: Navigation restructure + Consolidated Inventory page (enables medication_inventory usage)
2. **High**: Structures Management UI (enables structures table usage)
3. **Medium**: Enhanced Sales Recording (exposes existing fields)
4. **Medium**: Enhanced Batch Creation (exposes existing fields)
5. **Low**: Enhanced Weight Samples (exposes existing fields)
6. **Low**: Customer/Supplier Type Filtering (improves UX)
