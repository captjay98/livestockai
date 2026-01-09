# Implementation Plan: Poultry & Fishery Tracker

## Overview

This plan implements a comprehensive business tracking platform for Nigerian poultry and fishery operations using TanStack Start, Kysely, PostgreSQL, and Better Auth. Tasks are organized to build incrementally, with core infrastructure first, then features, and finally integrations.

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - [x] 1.1 Set up PostgreSQL database and Kysely
    - Install kysely, pg, and @types/pg
    - Create database connection configuration
    - Create db.ts with Kysely instance
    - _Requirements: 11.1, 11.2_

  - [x] 1.2 Create database schema and migrations
    - Create all 17 tables as defined in design (users, sessions, farms, user_farms, batches, mortality_records, feed_records, egg_records, weight_samples, vaccinations, treatments, water_quality, sales, expenses, customers, suppliers, invoices, invoice_items)
    - Set up foreign key relationships
    - Create indexes for common queries
    - _Requirements: 11.1_

  - [x] 1.3 Implement currency utility functions
    - Create nairaToKobo, koboToNaira, formatNaira functions in src/lib/currency.ts
    - _Requirements: 8.5_

  - [x]\* 1.4 Write property test for currency formatting
    - Install fast-check for property-based testing
    - **Property 11: Currency Formatting**
    - **Validates: Requirements 8.5**

- [x] 2. Authentication System
  - [x] 2.1 Set up Better Auth with Kysely adapter
    - Install better-auth package
    - Configure auth with PostgreSQL/Kysely
    - Set up session management
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Create authentication API routes
    - Implement /api/auth/[...all] catch-all route
    - Configure email/password authentication
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Create login and registration pages
    - Build login form with email/password
    - Build registration form with name, email, password
    - Handle error states and validation
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.4 Implement role-based access control
    - Add role field to users (admin/staff)
    - Create middleware for role checking
    - Implement farm assignment for staff users
    - _Requirements: 1.5, 1.6, 2.4_

  - [x]\* 2.5 Write property test for authentication round-trip
    - **Property 1: Authentication Round-Trip**
    - **Validates: Requirements 1.2, 1.3**

  - [x]\* 2.6 Write property test for role-based access control
    - **Property 2: Role-Based Access Control**
    - **Validates: Requirements 1.5, 2.4**

- [x] 3. Checkpoint - Core Infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Farm Management
  - [x] 4.1 Create farm server functions
    - Implement CRUD operations for farms
    - Add farm filtering based on user role
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.2 Build farm management UI
    - Create farm list page with create/edit/delete
    - Build farm selector component for header
    - Implement farm context for filtering
    - _Requirements: 2.1, 2.2_

  - [x]\* 4.3 Write property test for farm data isolation
    - **Property 16: Farm Data Isolation**
    - **Validates: Requirements 2.2, 2.3, 10.7**

- [x] 5. Livestock Inventory Management
  - [x] 5.1 Create batch server functions
    - Implement CRUD operations for batches
    - Add inventory calculation logic
    - Support species/breed validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.2 Build batch management UI
    - Create batch list page with filtering
    - Build batch creation form
    - Display batch details with current quantity
    - Show depleted batches separately
    - _Requirements: 3.1, 3.3, 3.4_

  - [x]\* 5.3 Write property test for inventory invariant
    - **Property 4: Inventory Invariant**
    - **Validates: Requirements 3.2, 4.2, 8.2**

- [x] 6. Mortality Tracking
  - [x] 6.1 Create mortality server functions
    - Implement mortality record creation
    - Auto-update batch current_quantity on mortality
    - Calculate mortality rate per batch
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 Build mortality tracking UI
    - Create mortality recording form
    - Display mortality history per batch
    - Show mortality rate statistics
    - _Requirements: 4.1, 4.3_

  - [x]\* 6.3 Write property test for mortality rate calculation
    - **Property 5: Mortality Rate Calculation**
    - **Validates: Requirements 4.3, 4.4**

- [x] 7. Checkpoint - Inventory Core
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Feed Management
  - [x] 8.1 Create feed server functions
    - Implement feed record creation
    - Calculate total feed and cost per batch
    - Calculate FCR when weight data available
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.2 Build feed management UI
    - Create feed recording form with feed type dropdown
    - Display feed history per batch
    - Show feed totals and FCR
    - _Requirements: 5.1, 5.2_

  - [x]\* 8.3 Write property test for FCR calculation
    - **Property 6: Feed Conversion Ratio Calculation**
    - **Validates: Requirements 5.3**

- [x] 9. Egg Production Tracking
  - [x] 9.1 Create egg production server functions
    - Implement egg record creation
    - Calculate laying percentage
    - Track egg inventory
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.2 Build egg production UI
    - Create daily egg recording form
    - Display production history with totals
    - Show laying percentage and inventory
    - _Requirements: 6.1, 6.2_

  - [x]\* 9.3 Write property test for laying percentage calculation
    - **Property 7: Laying Percentage Calculation**
    - **Validates: Requirements 6.3**

  - [x]\* 9.4 Write property test for egg inventory calculation
    - **Property 8: Egg Inventory Calculation**
    - **Validates: Requirements 6.4**

- [x] 10. Weight Tracking
  - [x] 10.1 Create weight sample server functions
    - Implement weight sample creation
    - Calculate average daily gain (ADG)
    - Implement growth rate alerts
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 10.2 Build weight tracking UI
    - Create weight sample recording form
    - Display weight progression chart
    - Show ADG and growth alerts
    - _Requirements: 7.1, 7.2, 7.4_

  - [x]\* 10.3 Write property test for ADG calculation
    - **Property 9: Average Daily Gain Calculation**
    - **Validates: Requirements 7.3**

- [x] 11. Checkpoint - Production Tracking
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Customer Management
  - [x] 12.1 Create customer server functions
    - Implement CRUD operations for customers
    - Calculate total spent per customer
    - Get top customers by revenue
    - _Requirements: 15.1, 15.3, 15.4_

  - [x] 12.2 Build customer management UI
    - Create customer list and detail pages
    - Display purchase history per customer
    - _Requirements: 15.1, 15.3_

  - [x]\* 12.3 Write property test for customer revenue aggregation
    - **Property 15: Customer Revenue Aggregation**
    - **Validates: Requirements 15.3, 15.4**

- [x] 13. Sales Tracking
  - [x] 13.1 Create sales server functions
    - Implement sale creation with inventory update
    - Support customer selection/creation
    - Calculate revenue totals with filtering
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 15.2_

  - [x] 13.2 Build sales UI
    - Create sale recording form with customer selector
    - Display sales history with filters
    - Show revenue totals
    - _Requirements: 8.1, 8.3, 8.4_

- [x] 14. Supplier Management
  - [x] 14.1 Create supplier server functions
    - Implement CRUD operations for suppliers
    - Track purchase history and price history
    - _Requirements: 16.1, 16.3, 16.4_

  - [x] 14.2 Build supplier management UI
    - Create supplier list and detail pages
    - Display purchase history and price trends
    - _Requirements: 16.1, 16.3_

- [x] 15. Expense Tracking
  - [x] 15.1 Create expense server functions
    - Implement expense creation with supplier link
    - Support recurring expenses
    - Calculate expense totals with filtering
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 16.2_

  - [x] 15.2 Build expense UI
    - Create expense recording form with supplier selector
    - Display expense history with filters
    - Show expense totals by category
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 16. Checkpoint - Financial Tracking
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Vaccination and Treatment Tracking
  - [x] 17.1 Create vaccination/treatment server functions
    - Implement vaccination and treatment record creation
    - Calculate upcoming and overdue vaccinations
    - Maintain vaccination history per batch
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 17.2 Build vaccination/treatment UI
    - Create vaccination and treatment recording forms
    - Display vaccination schedule and history
    - Show alerts for upcoming/overdue vaccinations
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x]\* 17.3 Write property test for vaccination due date alerts
    - **Property 14: Vaccination Due Date Alerts**
    - **Validates: Requirements 14.3, 14.4**

- [x] 18. Water Quality Tracking (Fishery)
  - [x] 18.1 Create water quality server functions
    - Implement water quality record creation
    - Implement threshold validation and alerts
    - _Requirements: 17.1, 17.2, 17.4_

  - [x] 18.2 Build water quality UI
    - Create water quality recording form
    - Display water quality trends chart
    - Show alerts for out-of-range parameters
    - _Requirements: 17.1, 17.2, 17.3_

  - [x]\* 18.3 Write property test for water quality threshold alerts
    - **Property 12: Water Quality Threshold Alerts**
    - **Validates: Requirements 17.2, 17.4**

- [x] 19. Business Dashboard
  - [x] 19.1 Create dashboard server functions
    - Aggregate inventory summary across farms
    - Calculate monthly revenue, expenses, profit
    - Get recent transactions
    - Get mortality alerts and vaccination alerts
    - Get egg production summary
    - Get top customers
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 15.4_

  - [x] 19.2 Build dashboard UI
    - Create stat cards for key metrics
    - Build charts for trends (revenue, expenses, production)
    - Display alerts section
    - Add farm filter selector
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x]\* 19.3 Write property test for profit calculation
    - **Property 10: Profit Calculation**
    - **Validates: Requirements 10.2, 12.1**

- [x] 20. Checkpoint - Dashboard Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Invoice Generation
  - [x] 21.1 Create invoice server functions
    - Implement invoice creation with auto-numbering
    - Generate invoice items from sales
    - Track payment status
    - _Requirements: 18.1, 18.2, 18.4_

  - [x] 21.2 Build invoice UI
    - Create invoice list and detail pages
    - Display invoice with all required fields
    - Add payment status management
    - _Requirements: 18.1, 18.4_

  - [x] 21.3 Implement PDF invoice generation
    - Install jsPDF library
    - Create invoice PDF template
    - Add download functionality
    - _Requirements: 18.3_

  - [x]\* 21.4 Write property test for invoice number sequencing
    - **Property 13: Invoice Number Sequencing**
    - **Validates: Requirements 18.2**

- [x] 22. Reporting System
  - [x] 22.1 Create report server functions
    - Implement profit/loss report calculation
    - Implement inventory report with mortality rates
    - Implement sales report by livestock type
    - Implement feed report with FCR
    - Implement egg production report
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 22.2 Build reports UI
    - Create report selection page
    - Build report display components
    - Add date range and farm filters
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 23. Data Export
  - [x] 23.1 Implement Excel export
    - Install xlsx library
    - Create export functions for each report type
    - _Requirements: 19.1, 19.2_

  - [x] 23.2 Implement PDF export
    - Create PDF templates for reports
    - Add export buttons to report pages
    - _Requirements: 19.1, 19.2_

  - [x] 23.3 Add export filtering
    - Support date range filtering in exports
    - Support farm filtering in exports
    - _Requirements: 19.3, 19.4_

- [x] 24. Mobile Responsiveness
  - [x] 24.1 Implement responsive layouts
    - Add mobile navigation drawer
    - Make all forms mobile-friendly
    - Ensure tables scroll horizontally on mobile
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 24.2 Optimize touch interactions
    - ~~Increase button/input sizes for touch~~ (completed - UI components updated with larger sizing)
    - Add swipe gestures where appropriate
    - _Requirements: 13.2_

- [x] 25. Data Persistence Testing
  - [x]\* 25.1 Write property test for data persistence round-trip
    - **Property 3: Data Persistence Round-Trip**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 26. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented
  - Review error handling across all features

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All monetary values use kobo internally, formatted as Naira for display

## Pre-existing Setup

The following are already configured in the project:

- TanStack Start (full-stack React framework)
- shadcn/ui with Base UI components
- TailwindCSS 4 with custom teal-green theme
- Vitest for testing
- Lucide React icons
- Inter Variable font
- UI components with spacious styling (h-10 inputs, text-sm base, rounded-md)
