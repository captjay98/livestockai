# Requirements Document

## Introduction

This document specifies requirements for improving system integration, automation, and fixing UI/UX issues in the JayFarms application. The goal is to create a highly connected system where data flows automatically between related entities.

## Glossary

- **System**: The JayFarms farm management application
- **Feed_Inventory**: Stock levels of feed available on a farm
- **Feed_Record**: A record of feed given to a specific batch
- **Batch**: A group of livestock (poultry or fish) being raised together
- **Structure**: A physical location (house, pond, pen) where batches are kept
- **Customer**: A buyer of farm products
- **Supplier**: A vendor who provides farm inputs
- **Invoice**: A billing document for sales to customers

## Requirements

### Requirement 1: Automated Feed Inventory Deduction

**User Story:** As a farmer, I want feed inventory to automatically decrease when I record feed given to a batch, so that I always know my actual stock levels.

#### Acceptance Criteria

1. WHEN a feed record is created, THE System SHALL deduct the quantity from the corresponding feed inventory
2. WHEN a feed record is deleted, THE System SHALL restore the quantity to the feed inventory
3. IF the feed inventory is insufficient for the recorded amount, THEN THE System SHALL display a warning but allow the record
4. WHEN feed inventory falls below the minimum threshold after a deduction, THE System SHALL flag it as low stock

### Requirement 2: Customer CRUD Operations

**User Story:** As a farmer, I want to view, edit, and delete customer records, so that I can manage my customer relationships.

#### Acceptance Criteria

1. WHEN a user clicks "View" on a customer, THE System SHALL navigate to a customer detail page showing all customer information and purchase history
2. WHEN a user clicks "Edit" on a customer, THE System SHALL open an edit dialog with pre-filled customer data
3. WHEN a user clicks "Delete" on a customer, THE System SHALL show a confirmation dialog before deletion
4. IF a customer has associated sales, THEN THE System SHALL warn the user before deletion

### Requirement 3: Supplier CRUD Operations

**User Story:** As a farmer, I want to view, edit, and delete supplier records, so that I can manage my supplier relationships.

#### Acceptance Criteria

1. WHEN a user clicks "View" on a supplier, THE System SHALL navigate to a supplier detail page showing all supplier information and purchase history
2. WHEN a user clicks "Edit" on a supplier, THE System SHALL open an edit dialog with pre-filled supplier data
3. WHEN a user clicks "Delete" on a supplier, THE System SHALL show a confirmation dialog before deletion
4. IF a supplier has associated expenses or batches, THEN THE System SHALL warn the user before deletion

### Requirement 4: Invoice Management

**User Story:** As a farmer, I want to create, view, edit, and delete invoices, so that I can manage billing for my customers.

#### Acceptance Criteria

1. WHEN a user clicks "Create Invoice", THE System SHALL open a dialog to create a new invoice
2. WHEN a user clicks "View" on an invoice, THE System SHALL navigate to an invoice detail page
3. WHEN a user clicks "Edit" on an invoice, THE System SHALL open an edit dialog with pre-filled invoice data
4. WHEN a user clicks "Delete" on an invoice, THE System SHALL show a confirmation dialog before deletion
5. WHEN an invoice is created from a sale, THE System SHALL link the invoice to the sale record

### Requirement 5: Dark Mode Styling Fixes

**User Story:** As a user, I want all alert components to display correctly in dark mode, so that I can use the application comfortably at night.

#### Acceptance Criteria

1. THE Water_Quality_Alerts component SHALL display with proper contrast in dark mode
2. THE Weight_Growth_Alerts component SHALL display with proper contrast in dark mode
3. THE System SHALL use theme-aware color classes for all alert backgrounds and text

### Requirement 6: Seed Data Completeness

**User Story:** As a developer, I want the seed data to include all entity types, so that I can test all features of the application.

#### Acceptance Criteria

1. THE Seed_Script SHALL create customer records with realistic Nigerian data
2. THE Seed_Script SHALL create invoice records linked to sales
3. THE Seed_Script SHALL create feed inventory records for each farm

### Requirement 7: Feed Type Clarity

**User Story:** As a farmer, I want feed types to be clearly labeled and easy to understand, so that I can quickly select the right feed.

#### Acceptance Criteria

1. THE System SHALL display feed types with human-readable labels (e.g., "Starter Feed" instead of "starter")
2. THE System SHALL group feed types by livestock type (poultry vs fish)
3. WHEN selecting feed type, THE System SHALL show appropriate options based on the batch's livestock type

### Requirement 8: Batch-Structure-Farm Relationship Display

**User Story:** As a farmer, I want to see which structure and farm each batch belongs to, so that I can track where my livestock is located.

#### Acceptance Criteria

1. WHEN viewing a batch, THE System SHALL display the associated structure name
2. WHEN viewing a batch, THE System SHALL display the associated farm name
3. WHEN creating a batch, THE System SHALL require selecting a farm and optionally a structure
4. THE Batch_List SHALL show structure and farm columns
