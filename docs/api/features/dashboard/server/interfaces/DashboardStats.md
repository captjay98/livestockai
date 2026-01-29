[**LivestockAI API Reference**](../../../../README.md)

---

[LivestockAI API Reference](../../../../modules.md) / [features/dashboard/server](../README.md) / DashboardStats

# Interface: DashboardStats

Defined in: features/dashboard/server.ts:7

High-level business and production metrics for the farm dashboard.

## Properties

### alerts

> **alerts**: [`BatchAlert`](../../../monitoring/alerts/interfaces/BatchAlert.md)[]

Defined in: features/dashboard/server.ts:62

Prioritized health, stock, or water quality alerts

---

### feed

> **feed**: `object`

Defined in: features/dashboard/server.ts:53

Feed management summary

#### fcr

> **fcr**: `number`

Average Feed Conversion Ratio

#### totalCost

> **totalCost**: `number`

Total spent on feed in the current month

#### totalKg

> **totalKg**: `number`

Total feed quantity in kilograms

---

### financial

> **financial**: `object`

Defined in: features/dashboard/server.ts:26

Monthly financial performance summary

#### expensesChange

> **expensesChange**: `number`

Percentage change in expenses compared to the previous month

#### monthlyExpenses

> **monthlyExpenses**: `number`

Total expenses for the current month

#### monthlyProfit

> **monthlyProfit**: `number`

Net profit (Revenue - Expenses)

#### monthlyRevenue

> **monthlyRevenue**: `number`

Total revenue for the current month

#### revenueChange

> **revenueChange**: `number`

Percentage change in revenue compared to the previous month

---

### inventory

> **inventory**: `object`

Defined in: features/dashboard/server.ts:9

Aggregated active livestock counts across all species

#### activeBatches

> **activeBatches**: `number`

Number of currently active livestock batches

#### totalBees

> **totalBees**: `number`

Total bee colonies count

#### totalCattle

> **totalCattle**: `number`

Total cattle count

#### totalFish

> **totalFish**: `number`

Total fish count

#### totalGoats

> **totalGoats**: `number`

Total goats count

#### totalPoultry

> **totalPoultry**: `number`

Combined poultry count (layers, broilers, etc.)

#### totalSheep

> **totalSheep**: `number`

Total sheep count

---

### mortality

> **mortality**: `object`

Defined in: features/dashboard/server.ts:46

Livestock health monitoring summary

#### mortalityRate

> **mortalityRate**: `number`

Mortality rate percentage (deaths / initial population)

#### totalDeaths

> **totalDeaths**: `number`

Total combined deaths in the current month

---

### production

> **production**: `object`

Defined in: features/dashboard/server.ts:39

Production metrics for egg-laying species

#### eggsThisMonth

> **eggsThisMonth**: `number`

Total eggs collected during the current month

#### layingPercentage

> **layingPercentage**: `number`

Average laying rate percentage (eggs / possible eggs)

---

### recentTransactions

> **recentTransactions**: `object`[]

Defined in: features/dashboard/server.ts:66

Combined chronological list of recent income and expenditures

#### amount

> **amount**: `number`

#### date

> **date**: `Date`

#### description

> **description**: `string`

#### id

> **id**: `string`

#### type

> **type**: `"sale"` \| `"expense"`

---

### topCustomers

> **topCustomers**: `object`[]

Defined in: features/dashboard/server.ts:64

Highest spend/revenue customers for the farm

#### id

> **id**: `string`

#### name

> **name**: `string`

#### totalSpent

> **totalSpent**: `number`
