---
description: 'Reorganize routes and features around the Batch-Centric philosophy'
---

# @plan-structure

Audit and reorganize the OpenLivestock route and feature structure to align with the "Batch is the Boss" philosophy.

## Context

**Project**: OpenLivestock Manager - Multi-species livestock management
**Philosophy**: Batch-Centric design where the Batch is the atomic unit
**Agent**: product-architect

## Objective

Analyze current structure and propose reorganization that:

1. Groups routes by User Intent (Operations, Inventory, Analysis, Ecosystem)
2. Moves "loose forms" into Batch contexts
3. Ensures consistent Command Center layout across batch types

## Step 0: Scope Selection

Ask the user:

> What would you like to audit?
>
> 1. **Full audit** - Routes + Features + Navigation
> 2. **Routes only** - Just app/routes structure
> 3. **Features only** - Just app/features organization
> 4. **Navigation** - Sidebar grouping and flow

## Step 1: Current State Audit

**Audit routes:**

```bash
ls -la app/routes/_auth/
```

**Audit features:**

```bash
ls -la app/features/
```

**Check navigation:**

```bash
cat app/components/navigation.tsx | head -100
```

## Step 2: Map Against Ideal Structure

### Ideal Route Hierarchy

```
app/routes/_auth/
├── dashboard/              # Operations: Morning overview
├── batches/                # Operations: The core
│   ├── index.tsx           # Batch list
│   └── $batchId/
│       ├── index.tsx       # Command Center
│       ├── feed.tsx        # Feed within batch context
│       ├── mortality.tsx   # Deaths within batch context
│       └── health.tsx      # Vaccinations + treatments
├── inventory/              # Resources
│   ├── feed/
│   └── medications/
├── analysis/               # Business
│   ├── reports/
│   └── forecasts/
└── ecosystem/              # Network
    ├── customers/
    └── suppliers/
```

### Ideal Feature Grouping

```
app/features/
├── daily-ops/              # High-frequency actions
│   ├── feed/
│   ├── mortality/
│   └── weight/
├── health/                 # Health incidents
│   ├── vaccinations/
│   └── treatments/
├── finance/                # Money tracking
│   ├── sales/
│   └── expenses/
└── core/                   # Shared
    ├── batches/
    ├── farms/
    └── auth/
```

## Step 3: Identify Gaps

Create a table:

| Current Location       | Ideal Location                       | Action                |
| ---------------------- | ------------------------------------ | --------------------- |
| `routes/_auth/feed/`   | `routes/_auth/batches/$batchId/feed` | Move to batch context |
| `features/monitoring/` | `features/daily-ops/`                | Rename for clarity    |

## Step 4: Propose Migration Plan

For each change:

1. Impact assessment (what breaks?)
2. Migration steps
3. Redirect handling (if routes change)

## Step 5: Navigation Restructure

Propose sidebar grouping:

```typescript
const NAVIGATION_GROUPS = {
  operations: {
    label: 'Operations',
    icon: Activity,
    items: ['dashboard', 'batches', 'tasks'],
  },
  inventory: {
    label: 'Inventory',
    icon: Package,
    items: ['feed', 'medications', 'equipment'],
  },
  analysis: {
    label: 'Analysis',
    icon: BarChart,
    items: ['reports', 'forecasts'],
  },
  ecosystem: {
    label: 'Network',
    icon: Users,
    items: ['customers', 'suppliers'],
  },
}
```

## Validation

After restructure:

```bash
bun run check
bun run lint
bun run build
```

## Success Criteria

- [ ] Routes grouped by User Intent
- [ ] Daily operations accessible from Batch Command Center
- [ ] Navigation reflects persona groupings
- [ ] No broken links or imports
- [ ] Build passes

## Related Prompts

- `@ui-audit` - Verify components meet Rugged Utility standards
- `@plan-feature` - For implementing new features in correct location

## Output Format

Provide:

1. Current state summary table
2. Gap analysis
3. Prioritized migration plan
4. Updated navigation config
