# Requirements Document

## Introduction

A business tracking platform for managing poultry and fishery operations in Nigeria. The system enables tracking of livestock inventory, sales, expenses, feed consumption, mortality, and overall business performance. Built with TanStack Start and PostgreSQL for a modern, type-safe full-stack experience.

## Technical Context

- **Framework**: TanStack Start (full-stack React framework)
- **Database**: PostgreSQL with Kysely (type-safe SQL query builder)
- **Authentication**: Better Auth (self-hosted, session-based)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Currency**: Nigerian Naira (₦)

## Glossary

- **Platform**: The poultry and fishery business tracking application
- **Livestock**: Animals being raised (poultry birds or fish)
- **Batch**: A group of livestock acquired or hatched together
- **Inventory**: Current count and status of all livestock
- **Transaction**: A financial record of sale, purchase, or expense
- **Dashboard**: The main overview screen showing business metrics
- **Mortality**: Death of livestock, tracked with date and cause
- **Feed_Record**: A record of feed given to a batch including type, quantity, and cost
- **Farm**: A physical farm location where livestock is raised
- **User**: A person with access to the platform (admin or staff)
- **Egg_Record**: Daily egg production record for layer batches
- **Weight_Sample**: A weight measurement taken from a sample of livestock
- **Vaccination**: A preventive treatment administered to livestock
- **Treatment**: Medication given to livestock for illness
- **Customer**: A person or business that purchases livestock or products
- **Supplier**: A vendor that provides feed, livestock, or other supplies
- **Water_Quality_Record**: Measurements of pond water parameters
- **Invoice**: A document detailing a sale transaction for a customer

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a business owner, I want to secure access to my business data, so that only authorized users can view and modify records.

#### Acceptance Criteria

1. WHEN a user visits the platform, THE Platform SHALL require authentication before accessing any data
2. WHEN a user registers, THE Platform SHALL capture email, password, and name
3. WHEN a user logs in with valid credentials, THE Platform SHALL grant access and create a session
4. IF a user provides invalid credentials, THEN THE Platform SHALL deny access and display an error message
5. THE Platform SHALL support two roles: admin (full access) and staff (limited to assigned farms)
6. WHEN an admin creates a staff user, THE Platform SHALL allow assigning the user to specific farms

### Requirement 2: Multi-Farm Management

**User Story:** As a business owner, I want to manage multiple farm locations, so that I can track operations across different sites.

#### Acceptance Criteria

1. WHEN an admin creates a farm, THE Platform SHALL record the farm name, location, and type (poultry, fishery, or mixed)
2. WHEN a user views data, THE Platform SHALL filter by selected farm or show aggregated data across all farms
3. THE Platform SHALL associate all batches, sales, and expenses with a specific farm
4. WHEN a staff user logs in, THE Platform SHALL only show data for farms they are assigned to

### Requirement 3: Livestock Inventory Management

**User Story:** As a business owner, I want to track my livestock inventory, so that I know exactly how many birds and fish I have at any time.

#### Acceptance Criteria

1. WHEN a user adds a new batch of livestock, THE Platform SHALL record the batch with farm, type (poultry/fish), species/breed, quantity, acquisition date, and cost in Naira (₦)
2. WHEN livestock quantity changes due to sales, deaths, or additions, THE Platform SHALL update the inventory count accordingly
3. WHEN a user views inventory, THE Platform SHALL display current counts grouped by farm, livestock type, and species
4. IF a batch quantity becomes zero, THEN THE Platform SHALL mark the batch as depleted but retain historical records
5. THE Platform SHALL support common Nigerian poultry breeds (broilers, layers, cockerels, turkeys) and fish species (catfish, tilapia)

### Requirement 4: Mortality Tracking

**User Story:** As a business owner, I want to track livestock deaths, so that I can identify problems and reduce losses.

#### Acceptance Criteria

1. WHEN a user records a mortality event, THE Platform SHALL capture the batch, quantity lost, date, and cause (disease, predator, weather, unknown, other)
2. WHEN mortality is recorded, THE Platform SHALL automatically reduce the corresponding batch inventory
3. WHEN a user views mortality reports, THE Platform SHALL display mortality rate per batch and overall mortality trends
4. THE Platform SHALL calculate mortality rate as (total deaths / initial stock) × 100

### Requirement 5: Feed Management

**User Story:** As a business owner, I want to track feed consumption and costs, so that I can optimize feeding and control expenses.

#### Acceptance Criteria

1. WHEN a user records feed given, THE Platform SHALL capture the batch, feed type, quantity (kg), cost in Naira, and date
2. WHEN a user views feed records, THE Platform SHALL display total feed consumed and cost per batch
3. THE Platform SHALL calculate feed conversion ratio (FCR) as total feed / total weight gain for meat birds
4. THE Platform SHALL support common feed types (starter, grower, finisher, layer mash, fish feed)

### Requirement 6: Egg Production Tracking

**User Story:** As a business owner with layers, I want to track daily egg production, so that I can monitor productivity and plan sales.

#### Acceptance Criteria

1. WHEN a user records egg production, THE Platform SHALL capture the batch, date, quantity collected, quantity broken, and quantity sold
2. WHEN a user views egg records, THE Platform SHALL display daily, weekly, and monthly production totals
3. THE Platform SHALL calculate laying percentage as (eggs collected / number of birds) × 100
4. THE Platform SHALL track egg inventory (collected minus sold minus broken)

### Requirement 7: Weight Tracking

**User Story:** As a business owner, I want to track the weight of my livestock over time, so that I can monitor growth and determine optimal sale time.

#### Acceptance Criteria

1. WHEN a user records a weight sample, THE Platform SHALL capture the batch, date, sample size, and average weight (kg)
2. WHEN a user views weight records, THE Platform SHALL display weight progression over time as a chart
3. THE Platform SHALL calculate average daily gain (ADG) as (current weight - previous weight) / days between samples
4. THE Platform SHALL alert when growth rate falls below expected targets for the species/breed

### Requirement 8: Sales Tracking

**User Story:** As a business owner, I want to record my sales, so that I can track revenue and understand which products sell best.

#### Acceptance Criteria

1. WHEN a user records a sale, THE Platform SHALL capture the farm, livestock type, quantity sold, unit price in Naira, total amount, customer name (optional), and sale date
2. WHEN a sale is recorded, THE Platform SHALL automatically reduce the corresponding inventory
3. WHEN a user views sales history, THE Platform SHALL display all sales with filtering options by farm, date range, and livestock type
4. THE Platform SHALL calculate and display total revenue in Naira for any selected period
5. THE Platform SHALL format all monetary values with the Naira symbol (₦) and thousand separators

### Requirement 9: Expense Tracking

**User Story:** As a business owner, I want to track my expenses, so that I can understand my costs and calculate profitability.

#### Acceptance Criteria

1. WHEN a user records an expense, THE Platform SHALL capture the farm, category (feed, medicine, equipment, utilities, labor, transport, other), amount in Naira, date, and description
2. WHEN a user views expenses, THE Platform SHALL display all expenses with filtering by farm, category, and date range
3. THE Platform SHALL calculate and display total expenses in Naira for any selected period
4. THE Platform SHALL support recurring expense entries for regular costs like feed purchases

### Requirement 10: Business Dashboard

**User Story:** As a business owner, I want to see an overview of my business performance, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN a user opens the dashboard, THE Platform SHALL display current inventory summary across all farms (or selected farm)
2. WHEN a user opens the dashboard, THE Platform SHALL display revenue, expenses, and profit in Naira for the current month
3. WHEN a user opens the dashboard, THE Platform SHALL display recent transactions (sales and expenses)
4. THE Platform SHALL display mortality rates and alerts for batches with high mortality
5. THE Platform SHALL display egg production summary for layer batches
6. THE Platform SHALL provide visual charts showing revenue, expense, and production trends over time
7. THE Platform SHALL allow filtering dashboard data by farm

### Requirement 11: Data Persistence

**User Story:** As a business owner, I want my data to be saved reliably, so that I don't lose my business records.

#### Acceptance Criteria

1. WHEN any data is created or modified, THE Platform SHALL persist it to the PostgreSQL database immediately
2. WHEN the application starts, THE Platform SHALL load all previously saved data
3. FOR ALL stored data, serializing then deserializing SHALL produce an equivalent record (round-trip property)

### Requirement 12: Reporting

**User Story:** As a business owner, I want to generate reports, so that I can analyze my business performance over time.

#### Acceptance Criteria

1. WHEN a user requests a profit/loss report, THE Platform SHALL calculate total revenue minus total expenses in Naira for the selected period and farm
2. WHEN a user requests an inventory report, THE Platform SHALL show stock levels, batch details, and mortality rates per farm
3. WHEN a user requests a sales report, THE Platform SHALL show sales breakdown by livestock type with quantities and revenue in Naira
4. WHEN a user requests a feed report, THE Platform SHALL show feed consumption, costs, and FCR per batch
5. WHEN a user requests an egg production report, THE Platform SHALL show daily/weekly/monthly production and laying percentages

### Requirement 13: Mobile Responsiveness

**User Story:** As a business owner, I want to access the platform from my phone, so that I can manage my business on the go.

#### Acceptance Criteria

1. THE Platform SHALL display correctly on mobile devices with screen widths from 320px to 768px
2. THE Platform SHALL provide touch-friendly buttons and inputs for mobile users
3. THE Platform SHALL use responsive layouts that adapt to different screen sizes

### Requirement 14: Vaccination and Treatment Tracking

**User Story:** As a business owner, I want to track vaccinations and treatments, so that I can prevent disease outbreaks and maintain healthy livestock.

#### Acceptance Criteria

1. WHEN a user records a vaccination, THE Platform SHALL capture the batch, vaccine name, date administered, dosage, and next due date
2. WHEN a user records a treatment, THE Platform SHALL capture the batch, medication name, reason, date, dosage, and withdrawal period
3. THE Platform SHALL display upcoming vaccinations due within the next 7 days on the dashboard
4. THE Platform SHALL alert when a vaccination is overdue
5. THE Platform SHALL maintain a vaccination history for each batch

### Requirement 15: Customer Management

**User Story:** As a business owner, I want to track my customers, so that I can build relationships and understand buying patterns.

#### Acceptance Criteria

1. WHEN a user adds a customer, THE Platform SHALL capture name, phone number, email (optional), and location
2. WHEN recording a sale, THE Platform SHALL allow selecting an existing customer or adding a new one
3. WHEN a user views a customer, THE Platform SHALL display their purchase history and total amount spent
4. THE Platform SHALL display top customers by revenue on the dashboard

### Requirement 16: Supplier Management

**User Story:** As a business owner, I want to track my suppliers, so that I can manage procurement and compare prices.

#### Acceptance Criteria

1. WHEN a user adds a supplier, THE Platform SHALL capture name, phone number, email (optional), location, and products supplied
2. WHEN recording an expense for feed or livestock purchase, THE Platform SHALL allow selecting a supplier
3. WHEN a user views a supplier, THE Platform SHALL display purchase history and total amount spent
4. THE Platform SHALL track price history for products from each supplier

### Requirement 17: Water Quality Tracking (Fishery)

**User Story:** As a fish farmer, I want to track water quality parameters, so that I can maintain optimal conditions for fish growth.

#### Acceptance Criteria

1. WHEN a user records water quality, THE Platform SHALL capture the pond/batch, date, pH level, temperature, dissolved oxygen, and ammonia level
2. WHEN water parameters are outside safe ranges, THE Platform SHALL display a warning alert
3. THE Platform SHALL display water quality trends over time as charts
4. THE Platform SHALL define safe ranges: pH (6.5-9.0), temperature (25-30°C), dissolved oxygen (>5mg/L), ammonia (<0.02mg/L)

### Requirement 18: Invoice Generation

**User Story:** As a business owner, I want to generate invoices for sales, so that I can provide professional documentation to customers.

#### Acceptance Criteria

1. WHEN a user creates an invoice, THE Platform SHALL generate a document with business name, customer details, items, quantities, prices, and total in Naira
2. THE Platform SHALL auto-generate invoice numbers in sequence
3. THE Platform SHALL allow downloading invoices as PDF
4. THE Platform SHALL track invoice payment status (paid, unpaid, partial)

### Requirement 19: Data Export

**User Story:** As a business owner, I want to export my data, so that I can analyze it in spreadsheets or share with accountants.

#### Acceptance Criteria

1. WHEN a user exports a report, THE Platform SHALL generate the file in Excel (.xlsx) or PDF format
2. THE Platform SHALL support exporting: sales reports, expense reports, inventory reports, and profit/loss statements
3. THE Platform SHALL include date range filtering for exports
4. THE Platform SHALL include farm filtering for exports
