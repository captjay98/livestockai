# Design Document: Poultry & Fishery Tracker

## Overview

A comprehensive business tracking platform for Nigerian poultry and fishery operations. The system provides multi-farm management, livestock tracking, financial management, and reporting capabilities built with modern web technologies.

### Tech Stack
- **Frontend/Backend**: TanStack Start (React 19-based full-stack framework)
- **Database**: PostgreSQL with Kysely (type-safe SQL query builder)
- **Authentication**: Better Auth (self-hosted, session-based)
- **Styling**: TailwindCSS 4 + shadcn/ui (base-lyra theme with teal-green primary)
- **Icons**: Lucide React
- **Font**: Inter Variable
- **Language**: TypeScript
- **Testing**: Vitest + fast-check (property-based testing)
- **Export**: xlsx (Excel), jsPDF (PDF generation)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │ Components  │  │   TanStack Query    │  │
│  │  (Routes)   │  │    (UI)     │  │   (Data Fetching)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TanStack Start Server                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Server    │  │  Better     │  │     Middleware      │  │
│  │  Functions  │  │   Auth      │  │   (Auth Guards)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Kysely ORM                        │    │
│  │         (Type-safe SQL Query Builder)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   PostgreSQL                         │    │
│  │              (Primary Database)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow
1. User interacts with React components
2. TanStack Query manages data fetching/caching
3. Server functions handle business logic
4. Better Auth validates sessions
5. Kysely executes type-safe SQL queries
6. PostgreSQL stores and retrieves data

## Components and Interfaces

### Route Structure

```
app/
├── routes/
│   ├── __root.tsx              # Root layout with auth check
│   ├── index.tsx               # Landing/login page
│   ├── _authenticated/         # Protected routes group
│   │   ├── dashboard.tsx       # Main dashboard
│   │   ├── farms/
│   │   │   ├── index.tsx       # Farm list
│   │   │   └── $farmId.tsx     # Farm details
│   │   ├── batches/
│   │   │   ├── index.tsx       # Batch list
│   │   │   ├── new.tsx         # Create batch
│   │   │   └── $batchId.tsx    # Batch details
│   │   ├── sales/
│   │   │   ├── index.tsx       # Sales list
│   │   │   └── new.tsx         # Record sale
│   │   ├── expenses/
│   │   │   ├── index.tsx       # Expense list
│   │   │   └── new.tsx         # Record expense
│   │   ├── mortality/
│   │   │   └── index.tsx       # Mortality records
│   │   ├── feed/
│   │   │   └── index.tsx       # Feed records
│   │   ├── eggs/
│   │   │   └── index.tsx       # Egg production
│   │   ├── weight/
│   │   │   └── index.tsx       # Weight samples
│   │   ├── vaccinations/
│   │   │   └── index.tsx       # Vaccination records
│   │   ├── water-quality/
│   │   │   └── index.tsx       # Water quality (fish)
│   │   ├── customers/
│   │   │   └── index.tsx       # Customer list
│   │   ├── suppliers/
│   │   │   └── index.tsx       # Supplier list
│   │   ├── invoices/
│   │   │   ├── index.tsx       # Invoice list
│   │   │   └── $invoiceId.tsx  # Invoice detail/PDF
│   │   ├── reports/
│   │   │   └── index.tsx       # Report generation
│   │   └── settings/
│   │       ├── index.tsx       # Settings overview
│   │       └── users.tsx       # User management (admin)
│   └── api/
│       └── auth/
│           └── [...all].ts     # Better Auth API routes
```

### Core UI Components

```typescript
// Layout Components
<AppShell>           // Main app wrapper with sidebar
<Sidebar>            // Navigation sidebar
<Header>             // Top header with farm selector
<MobileNav>          // Mobile navigation drawer

// Data Display
<DataTable>          // Reusable table with sorting/filtering
<StatCard>           // Dashboard metric card
<Chart>              // Recharts wrapper for visualizations
<EmptyState>         // Empty data placeholder

// Forms
<BatchForm>          // Create/edit batch
<SaleForm>           // Record sale
<ExpenseForm>        // Record expense
<MortalityForm>      // Record mortality
<FeedForm>           // Record feed
<EggForm>            // Record egg production
<WeightForm>         // Record weight sample
<VaccinationForm>    // Record vaccination
<WaterQualityForm>   // Record water quality

// Shared
<FarmSelector>       // Dropdown to select active farm
<DateRangePicker>    // Date range selection
<CurrencyInput>      // Naira-formatted input
<ConfirmDialog>      // Confirmation modal
<LoadingSpinner>     // Loading state
<AlertBanner>        // Alerts and notifications
```

### Server Functions

```typescript
// Authentication
createServerFn('POST', '/api/auth/register')
createServerFn('POST', '/api/auth/login')
createServerFn('POST', '/api/auth/logout')
createServerFn('GET', '/api/auth/session')

// Farms
createServerFn('GET', '/api/farms')
createServerFn('POST', '/api/farms')
createServerFn('GET', '/api/farms/:id')
createServerFn('PUT', '/api/farms/:id')
createServerFn('DELETE', '/api/farms/:id')

// Batches
createServerFn('GET', '/api/batches')
createServerFn('POST', '/api/batches')
createServerFn('GET', '/api/batches/:id')
createServerFn('PUT', '/api/batches/:id')

// Sales
createServerFn('GET', '/api/sales')
createServerFn('POST', '/api/sales')

// Expenses
createServerFn('GET', '/api/expenses')
createServerFn('POST', '/api/expenses')

// Mortality
createServerFn('GET', '/api/mortality')
createServerFn('POST', '/api/mortality')

// Feed
createServerFn('GET', '/api/feed')
createServerFn('POST', '/api/feed')

// Eggs
createServerFn('GET', '/api/eggs')
createServerFn('POST', '/api/eggs')

// Weight
createServerFn('GET', '/api/weight')
createServerFn('POST', '/api/weight')

// Vaccinations
createServerFn('GET', '/api/vaccinations')
createServerFn('POST', '/api/vaccinations')

// Water Quality
createServerFn('GET', '/api/water-quality')
createServerFn('POST', '/api/water-quality')

// Customers
createServerFn('GET', '/api/customers')
createServerFn('POST', '/api/customers')

// Suppliers
createServerFn('GET', '/api/suppliers')
createServerFn('POST', '/api/suppliers')

// Invoices
createServerFn('GET', '/api/invoices')
createServerFn('POST', '/api/invoices')
createServerFn('GET', '/api/invoices/:id/pdf')

// Reports
createServerFn('GET', '/api/reports/profit-loss')
createServerFn('GET', '/api/reports/inventory')
createServerFn('GET', '/api/reports/sales')
createServerFn('GET', '/api/reports/feed')
createServerFn('GET', '/api/reports/eggs')

// Dashboard
createServerFn('GET', '/api/dashboard/summary')
createServerFn('GET', '/api/dashboard/alerts')

// Export
createServerFn('GET', '/api/export/:type')
```

## Data Models

### Database Schema (Kysely Types)

```typescript
// Database interface for Kysely
interface Database {
  users: UserTable;
  sessions: SessionTable;
  farms: FarmTable;
  user_farms: UserFarmTable;
  batches: BatchTable;
  mortality_records: MortalityTable;
  feed_records: FeedTable;
  egg_records: EggTable;
  weight_samples: WeightTable;
  vaccinations: VaccinationTable;
  treatments: TreatmentTable;
  water_quality: WaterQualityTable;
  sales: SaleTable;
  expenses: ExpenseTable;
  customers: CustomerTable;
  suppliers: SupplierTable;
  invoices: InvoiceTable;
  invoice_items: InvoiceItemTable;
}

// User & Auth
interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'staff';
  created_at: Generated<Date>;
  updated_at: Date;
}

interface SessionTable {
  id: string;
  user_id: string;
  expires_at: Date;
  created_at: Generated<Date>;
}

// Farm
interface FarmTable {
  id: Generated<string>;
  name: string;
  location: string;
  type: 'poultry' | 'fishery' | 'mixed';
  created_at: Generated<Date>;
  updated_at: Date;
}

interface UserFarmTable {
  user_id: string;
  farm_id: string;
}

// Livestock
interface BatchTable {
  id: Generated<string>;
  farm_id: string;
  livestock_type: 'poultry' | 'fish';
  species: string;  // broiler, layer, catfish, tilapia, etc.
  initial_quantity: number;
  current_quantity: number;
  acquisition_date: Date;
  cost_per_unit: number;  // in kobo (smallest Naira unit)
  total_cost: number;     // in kobo
  status: 'active' | 'depleted' | 'sold';
  created_at: Generated<Date>;
  updated_at: Date;
}

interface MortalityTable {
  id: Generated<string>;
  batch_id: string;
  quantity: number;
  date: Date;
  cause: 'disease' | 'predator' | 'weather' | 'unknown' | 'other';
  notes: string | null;
  created_at: Generated<Date>;
}

interface FeedTable {
  id: Generated<string>;
  batch_id: string;
  feed_type: 'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed';
  quantity_kg: number;
  cost: number;  // in kobo
  date: Date;
  supplier_id: string | null;
  created_at: Generated<Date>;
}

interface EggTable {
  id: Generated<string>;
  batch_id: string;
  date: Date;
  quantity_collected: number;
  quantity_broken: number;
  quantity_sold: number;
  created_at: Generated<Date>;
}

interface WeightTable {
  id: Generated<string>;
  batch_id: string;
  date: Date;
  sample_size: number;
  average_weight_kg: number;
  created_at: Generated<Date>;
}

interface VaccinationTable {
  id: Generated<string>;
  batch_id: string;
  vaccine_name: string;
  date_administered: Date;
  dosage: string;
  next_due_date: Date | null;
  notes: string | null;
  created_at: Generated<Date>;
}

interface TreatmentTable {
  id: Generated<string>;
  batch_id: string;
  medication_name: string;
  reason: string;
  date: Date;
  dosage: string;
  withdrawal_days: number;
  notes: string | null;
  created_at: Generated<Date>;
}

interface WaterQualityTable {
  id: Generated<string>;
  batch_id: string;
  date: Date;
  ph: number;
  temperature_celsius: number;
  dissolved_oxygen_mg_l: number;
  ammonia_mg_l: number;
  notes: string | null;
  created_at: Generated<Date>;
}

// Financial
interface SaleTable {
  id: Generated<string>;
  farm_id: string;
  batch_id: string | null;
  customer_id: string | null;
  livestock_type: 'poultry' | 'fish' | 'eggs';
  quantity: number;
  unit_price: number;   // in kobo
  total_amount: number; // in kobo
  date: Date;
  notes: string | null;
  created_at: Generated<Date>;
}

interface ExpenseTable {
  id: Generated<string>;
  farm_id: string;
  category: 'feed' | 'medicine' | 'equipment' | 'utilities' | 'labor' | 'transport' | 'other';
  amount: number;  // in kobo
  date: Date;
  description: string;
  supplier_id: string | null;
  is_recurring: boolean;
  created_at: Generated<Date>;
}

// Contacts
interface CustomerTable {
  id: Generated<string>;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  created_at: Generated<Date>;
  updated_at: Date;
}

interface SupplierTable {
  id: Generated<string>;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  products: string[];  // what they supply
  created_at: Generated<Date>;
  updated_at: Date;
}

// Invoices
interface InvoiceTable {
  id: Generated<string>;
  invoice_number: string;
  customer_id: string;
  farm_id: string;
  total_amount: number;  // in kobo
  status: 'unpaid' | 'partial' | 'paid';
  date: Date;
  due_date: Date | null;
  notes: string | null;
  created_at: Generated<Date>;
}

interface InvoiceItemTable {
  id: Generated<string>;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;  // in kobo
  total: number;       // in kobo
}
```

### Currency Handling

All monetary values are stored in **kobo** (1 Naira = 100 kobo) to avoid floating-point precision issues:

```typescript
// Utility functions
function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

function koboToNaira(kobo: number): number {
  return kobo / 100;
}

function formatNaira(kobo: number): string {
  const naira = koboToNaira(kobo);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(naira);
}
// Example: formatNaira(150000) => "₦1,500.00"
```

### Entity Relationships

```
User ─────┬───── Session
          │
          └───── UserFarm ───── Farm
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                  Batch        Sale         Expense
                    │             │             │
     ┌──────┬───────┼───────┬─────┘             │
     │      │       │       │                   │
 Mortality Feed   Egg    Weight              Supplier
     │      │       │       │
     │      │       │       │
Vaccination │    Treatment  │
     │      │               │
     └──────┴───────────────┴─── WaterQuality

Customer ───── Sale ───── Invoice ───── InvoiceItem
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Round-Trip

*For any* valid user credentials (email and password), logging in and then checking the session SHALL return the same user identity.

**Validates: Requirements 1.2, 1.3**

### Property 2: Role-Based Access Control

*For any* staff user and *any* farm they are not assigned to, querying data for that farm SHALL return an empty result or access denied error.

**Validates: Requirements 1.5, 2.4**

### Property 3: Data Persistence Round-Trip

*For any* valid entity (batch, sale, expense, mortality record, feed record, egg record, weight sample, vaccination, treatment, water quality record, customer, supplier, invoice), saving to the database and then retrieving by ID SHALL produce an equivalent record.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 4: Inventory Invariant

*For any* batch, the current_quantity SHALL always equal: initial_quantity - sum(mortality quantities) - sum(sale quantities).

**Validates: Requirements 3.2, 4.2, 8.2**

### Property 5: Mortality Rate Calculation

*For any* batch with initial_quantity > 0, the mortality rate SHALL equal: (sum of mortality quantities / initial_quantity) × 100.

**Validates: Requirements 4.3, 4.4**

### Property 6: Feed Conversion Ratio Calculation

*For any* batch with weight gain > 0, the FCR SHALL equal: total_feed_kg / total_weight_gain_kg.

**Validates: Requirements 5.3**

### Property 7: Laying Percentage Calculation

*For any* layer batch with current_quantity > 0, the laying percentage SHALL equal: (eggs_collected / current_quantity) × 100.

**Validates: Requirements 6.3**

### Property 8: Egg Inventory Calculation

*For any* batch, the egg inventory SHALL equal: sum(collected) - sum(sold) - sum(broken).

**Validates: Requirements 6.4**

### Property 9: Average Daily Gain Calculation

*For any* two consecutive weight samples with days_between > 0, the ADG SHALL equal: (later_weight - earlier_weight) / days_between.

**Validates: Requirements 7.3**

### Property 10: Profit Calculation

*For any* date range and farm filter, profit SHALL equal: sum(sales.total_amount) - sum(expenses.amount).

**Validates: Requirements 10.2, 12.1**

### Property 11: Currency Formatting

*For any* amount in kobo, formatNaira(amount) SHALL produce a string starting with "₦" and containing the correct Naira value with thousand separators.

**Validates: Requirements 8.5**

### Property 12: Water Quality Threshold Alerts

*For any* water quality record, an alert SHALL be triggered if and only if: pH < 6.5 OR pH > 9.0 OR temperature < 25 OR temperature > 30 OR dissolved_oxygen < 5 OR ammonia > 0.02.

**Validates: Requirements 17.2, 17.4**

### Property 13: Invoice Number Sequencing

*For any* two invoices created in sequence, the later invoice's number SHALL be greater than the earlier invoice's number.

**Validates: Requirements 18.2**

### Property 14: Vaccination Due Date Alerts

*For any* vaccination record, it SHALL appear in "upcoming vaccinations" if and only if: next_due_date is within 7 days from today. It SHALL appear in "overdue" if and only if: next_due_date < today.

**Validates: Requirements 14.3, 14.4**

### Property 15: Customer Revenue Aggregation

*For any* customer, their total_spent SHALL equal: sum(sales.total_amount) where sales.customer_id = customer.id.

**Validates: Requirements 15.3, 15.4**

### Property 16: Farm Data Isolation

*For any* query with a farm filter, all returned records SHALL have farm_id equal to the filter value (or be associated with a batch that has that farm_id).

**Validates: Requirements 2.2, 2.3, 10.7**

## Error Handling

### Authentication Errors

| Error | Cause | Response |
|-------|-------|----------|
| `INVALID_CREDENTIALS` | Wrong email or password | 401 with message "Invalid email or password" |
| `SESSION_EXPIRED` | Session token expired | 401 with redirect to login |
| `UNAUTHORIZED` | Accessing resource without permission | 403 with message "Access denied" |
| `USER_EXISTS` | Registering with existing email | 400 with message "Email already registered" |

### Validation Errors

| Error | Cause | Response |
|-------|-------|----------|
| `INVALID_INPUT` | Missing or invalid field | 400 with field-specific error messages |
| `QUANTITY_EXCEEDED` | Sale/mortality quantity > available | 400 with message "Quantity exceeds available stock" |
| `INVALID_DATE_RANGE` | End date before start date | 400 with message "End date must be after start date" |
| `NEGATIVE_VALUE` | Negative quantity or amount | 400 with message "Value must be positive" |

### Database Errors

| Error | Cause | Response |
|-------|-------|----------|
| `NOT_FOUND` | Record doesn't exist | 404 with message "Record not found" |
| `FOREIGN_KEY_VIOLATION` | Invalid reference | 400 with message "Referenced record not found" |
| `UNIQUE_VIOLATION` | Duplicate unique field | 400 with message "Record already exists" |
| `CONNECTION_ERROR` | Database unavailable | 500 with message "Service temporarily unavailable" |

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;  // Field-specific errors
  };
}

// Example
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": {
      "quantity": "Must be a positive number",
      "date": "Required field"
    }
  }
}
```

## Testing Strategy

### Testing Approach

This project uses a dual testing approach:
1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties across randomly generated inputs

Both are complementary—unit tests catch concrete bugs while property tests verify general correctness.

### Testing Framework

- **Test Runner**: Vitest
- **Property-Based Testing**: fast-check
- **Database Testing**: Test containers with PostgreSQL or in-memory SQLite

### Property-Based Test Configuration

Each property test MUST:
- Run minimum 100 iterations
- Reference the design document property number
- Use the tag format: `Feature: poultry-fishery-tracker, Property N: [property name]`

### Test Structure

```
tests/
├── unit/
│   ├── utils/
│   │   ├── currency.test.ts      # formatNaira, nairaToKobo, koboToNaira
│   │   └── calculations.test.ts  # mortality rate, FCR, laying %, ADG
│   ├── validators/
│   │   └── water-quality.test.ts # threshold validation
│   └── services/
│       ├── batch.test.ts         # batch CRUD operations
│       ├── sale.test.ts          # sale operations
│       └── invoice.test.ts       # invoice generation
├── property/
│   ├── inventory.property.test.ts    # Property 4: Inventory invariant
│   ├── calculations.property.test.ts # Properties 5-10: All calculations
│   ├── currency.property.test.ts     # Property 11: Currency formatting
│   ├── water-quality.property.test.ts # Property 12: Threshold alerts
│   ├── invoice.property.test.ts      # Property 13: Invoice sequencing
│   ├── vaccination.property.test.ts  # Property 14: Due date alerts
│   ├── aggregation.property.test.ts  # Properties 15-16: Aggregations
│   └── persistence.property.test.ts  # Property 3: Round-trip
└── integration/
    ├── auth.test.ts              # Properties 1-2: Auth and access control
    └── api.test.ts               # API endpoint tests
```

### Example Property Test

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateMortalityRate } from '../src/utils/calculations';

describe('Property 5: Mortality Rate Calculation', () => {
  // Feature: poultry-fishery-tracker, Property 5: Mortality Rate Calculation
  // Validates: Requirements 4.3, 4.4
  
  it('mortality rate equals (deaths / initial) × 100 for all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),  // initial quantity
        fc.integer({ min: 0, max: 100000 }),  // deaths
        (initial, deaths) => {
          // Ensure deaths don't exceed initial
          const validDeaths = Math.min(deaths, initial);
          
          const rate = calculateMortalityRate(initial, validDeaths);
          const expected = (validDeaths / initial) * 100;
          
          expect(rate).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

```typescript
// Currency formatting edge cases
describe('formatNaira', () => {
  it('formats zero correctly', () => {
    expect(formatNaira(0)).toBe('₦0.00');
  });
  
  it('formats small amounts correctly', () => {
    expect(formatNaira(50)).toBe('₦0.50');
  });
  
  it('formats large amounts with separators', () => {
    expect(formatNaira(150000000)).toBe('₦1,500,000.00');
  });
});

// Water quality threshold edge cases
describe('isWaterQualityAlert', () => {
  it('returns false for values exactly at boundaries', () => {
    expect(isWaterQualityAlert({ ph: 6.5, temp: 25, oxygen: 5, ammonia: 0.02 })).toBe(false);
  });
  
  it('returns true for pH just below minimum', () => {
    expect(isWaterQualityAlert({ ph: 6.49, temp: 27, oxygen: 6, ammonia: 0.01 })).toBe(true);
  });
});
```

### Test Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| Utility functions | 100% |
| Calculation functions | 100% |
| Validators | 100% |
| Server functions | 80% |
| UI Components | 60% |

### Running Tests

```bash
# Run all tests
npm test

# Run property tests only
npm test -- --grep "Property"

# Run with coverage
npm test -- --coverage

# Run specific property test
npm test -- property/inventory.property.test.ts
```
