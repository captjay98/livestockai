# Requirements Document

## Introduction

This document defines requirements for two related features: (1) Admin GUI for managing system reference data (growth standards and market prices), and (2) Enforcing farm-level role permissions throughout the application. Currently, growth standards and market prices can only be modified via database seeding, and farm roles (owner/manager/viewer) exist in the database but are not enforced in server functions.

## Glossary

- **System**: The OpenLivestock Manager application
- **Admin**: A user with the global 'admin' role who can manage all system data
- **Growth_Standards**: Reference data defining expected weight by age for each species
- **Market_Prices**: Reference data defining current market prices by species and size category
- **Farm_Role**: The role a user has within a specific farm (owner, manager, viewer)
- **Permission**: A specific action a user can perform (e.g., batch:create, finance:delete)

## Requirements

### Requirement 1: Growth Standards Management UI

**User Story:** As an admin, I want to view and edit growth standards through the UI, so that I can update expected growth curves without modifying code.

#### Acceptance Criteria

1. THE System SHALL provide a Growth Standards page accessible only to admins
2. WHEN viewing the Growth Standards page, THE System SHALL display a list of species with their growth data
3. WHEN an admin selects a species, THE System SHALL show a table of day/weight entries
4. WHEN an admin edits a weight value, THE System SHALL validate it is a positive number
5. WHEN an admin saves changes, THE System SHALL persist the updated values to the database
6. WHEN an admin adds a new day entry, THE System SHALL insert it in the correct position by day number
7. WHEN an admin deletes a day entry, THE System SHALL remove it after confirmation
8. THE System SHALL display a growth curve chart visualization for each species

### Requirement 2: Market Prices Management UI

**User Story:** As an admin, I want to view and edit market prices through the UI, so that I can keep pricing data current without database access.

#### Acceptance Criteria

1. THE System SHALL provide a Market Prices page accessible only to admins
2. WHEN viewing the Market Prices page, THE System SHALL display prices grouped by species
3. WHEN an admin edits a price, THE System SHALL validate it is a positive number
4. WHEN an admin saves changes, THE System SHALL persist the updated values to the database
5. WHEN an admin adds a new price entry, THE System SHALL require species, size category, and price
6. WHEN an admin deletes a price entry, THE System SHALL remove it after confirmation
7. THE System SHALL display the last updated timestamp for each price entry

### Requirement 3: Permission Enforcement for Batch Operations

**User Story:** As a farm owner, I want only authorized users to modify my farm's batch data, so that viewers cannot accidentally or maliciously change records.

#### Acceptance Criteria

1. WHEN a user with 'viewer' role attempts to create a batch, THE System SHALL reject the request with an error
2. WHEN a user with 'viewer' role attempts to update a batch, THE System SHALL reject the request with an error
3. WHEN a user with 'viewer' role attempts to delete a batch, THE System SHALL reject the request with an error
4. WHEN a user with 'manager' role attempts to delete a batch, THE System SHALL reject the request with an error
5. WHILE a user has 'owner' role, THE System SHALL allow all batch operations
6. WHILE a user has 'manager' role, THE System SHALL allow batch creation and updates only

### Requirement 4: Permission Enforcement for Financial Operations

**User Story:** As a farm owner, I want financial data protected by role, so that only authorized users can record or modify transactions.

#### Acceptance Criteria

1. WHEN a user with 'viewer' role attempts to create a sale, THE System SHALL reject the request
2. WHEN a user with 'viewer' role attempts to create an expense, THE System SHALL reject the request
3. WHEN a user with 'manager' role attempts to delete a sale, THE System SHALL reject the request
4. WHEN a user with 'manager' role attempts to delete an expense, THE System SHALL reject the request
5. WHILE a user has 'owner' role, THE System SHALL allow all financial operations
6. WHILE a user has 'manager' role, THE System SHALL allow creating and updating financial records only

### Requirement 5: Permission Enforcement for Farm Settings

**User Story:** As a farm owner, I want to control who can modify farm settings, so that only owners can make structural changes.

#### Acceptance Criteria

1. WHEN a user with 'viewer' role attempts to update farm details, THE System SHALL reject the request
2. WHEN a user with 'manager' role attempts to delete a farm, THE System SHALL reject the request
3. WHEN a user with 'viewer' role attempts to manage farm members, THE System SHALL reject the request
4. WHEN a user with 'manager' role attempts to manage farm members, THE System SHALL reject the request
5. WHILE a user has 'owner' role, THE System SHALL allow all farm management operations
6. WHILE a user has 'manager' role, THE System SHALL allow updating farm details only

### Requirement 6: Permission Error Feedback

**User Story:** As a user, I want clear feedback when I lack permission, so that I understand why an action was denied.

#### Acceptance Criteria

1. WHEN a permission check fails, THE System SHALL return a 403 status code
2. WHEN a permission check fails, THE System SHALL include a descriptive error message
3. WHEN displaying a permission error, THE System SHALL indicate which permission was required
4. THE System SHALL NOT expose internal permission details that could aid exploitation

### Requirement 7: UI Permission Awareness

**User Story:** As a user, I want the UI to reflect my permissions, so that I don't see actions I cannot perform.

#### Acceptance Criteria

1. WHEN a user lacks 'batch:create' permission, THE System SHALL hide or disable the "Add Batch" button
2. WHEN a user lacks 'batch:delete' permission, THE System SHALL hide or disable delete options
3. WHEN a user lacks 'finance:create' permission, THE System SHALL hide or disable "Add Sale/Expense" buttons
4. WHEN a user lacks 'member:invite' permission, THE System SHALL hide member management options
5. THE System SHALL fetch user permissions on farm selection and cache them for the session
