# OpenLivestock Product Map & Information Architecture

## Core Philosophy: "The Batch is the Boss"

In OpenLivestock, the "Batch" (a group of animals) is the atomic unit of the farm.

- **Wrong:** A "Feed Log" page where you select a batch.
- **Right:** A "Batch Dashboard" where you click "Log Feed."

## Navigation Hierarchy (Personas)

### 1. Operations (The "Now")

- **Farm Overview:** The morning coffee view. "What is dying? What needs feed?"
- **Batches:** The active production units.
- **Tasks:** Urgent to-dos (Vaccinations due today).

### 2. Inventory (The "Resources")

- **Feed Store:** Bags of feed in stock.
- **Medicine Cabinet:** Vaccines and drugs.
- **Equipment:** Pumps, aerators, feeders.

### 3. Analysis (The "Business")

- **Credit Passport:** The PDF generator for banks.
- **Financial Reports:** P&L, Cash Flow.
- **Growth Benchmarks:** Comparing my farm vs. regional average.

### 4. Ecosystem (The "Network")

- **Customers:** Who buys my harvest.
- **Suppliers:** Who sells me chicks/feed.
- **Extension Worker:** The government/NGO view.

## The "Command Center" Layout Rule

Every Batch Detail view MUST follow this structure to ensure "Rugged Utility":

1.  **Header (Static):** Batch Name | Age (Weeks) | Species Icon | **Sync Status**
2.  **Health Pulse (Dynamic):** A color-coded card.
    - _Green:_ "On Track"
    - _Amber:_ "Mortality Spike" (Link to Dr. AI)
    - _Red:_ "Critical Failure"
3.  **KPI Strip:** Mortality % | FCR (Feed Conversion) | Current Weight.
4.  **The "Action Grid":** Large, 48px+ buttons for high-frequency tasks.
    - [ 🍗 Feed ] [ 💀 Death ] [ 💰 Sale ]
    - [ ⚖️ Weigh ] [ 💉 Vax ] [ 💧 Water ]

## Extension Worker Mode

When a user has `role: 'EXTENSION_AGENT'`, the hierarchy shifts:

- **Farm View** becomes **District View**.
- **Batch List** becomes **Farm List**.
- **Alerts** become **Epidemic Warnings**.
