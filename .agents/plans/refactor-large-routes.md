# Feature: Refactor Large Route Files

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Refactor 14 route files exceeding 500 lines by extracting reusable components. This improves maintainability, reduces cognitive load, and enables better code reuse across the application.

## User Story

As a developer
I want route files to be under 500 lines
So that code is easier to understand, maintain, and test

## Problem Statement

14 route files exceed 500 lines, with the largest (settings) at 1,402 lines. Large files:

- Are harder to navigate and understand
- Have higher cognitive load for developers
- Make code review more difficult
- Increase merge conflict probability
- Hide reusable patterns that could be shared

## Solution Statement

Extract logical sections into standalone components following the established `StructuresCard` pattern. Prioritize by:

1. **Impact**: Largest files first
2. **Reusability**: Components that could be reused
3. **Cohesion**: Logically grouped functionality (tabs, dialogs, cards)

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Routes, Components
**Dependencies**: None (internal refactoring)

---

## CONTEXT REFERENCES

### Current Route Sizes (Lines)

| Route         | Lines | Priority | Extraction Strategy                        |
| ------------- | ----- | -------- | ------------------------------------------ |
| settings      | 1,402 | P1       | Extract 6 tab content components           |
| inventory     | 1,376 | P1       | Extract feed/medication cards with dialogs |
| onboarding    | 1,374 | P1       | Extract 8 step components                  |
| sales         | 1,210 | P2       | Extract summary cards, inline dialogs      |
| expenses      | 1,195 | P2       | Extract summary cards, inline dialogs      |
| vaccinations  | 1,124 | P2       | Extract inline dialogs                     |
| dashboard     | 1,106 | P2       | Extract stat cards, alerts section         |
| mortality     | 979   | P3       | Extract inline dialogs                     |
| feed          | 948   | P3       | Extract inline dialogs                     |
| reports       | 928   | P3       | Extract report type components             |
| water-quality | 839   | P3       | Extract inline dialogs                     |
| eggs          | 833   | P3       | Extract inline dialogs                     |
| batches       | 821   | P3       | Already has BatchDialog extracted          |
| customers     | 773   | P3       | Extract inline dialogs                     |

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/components/farms/structures-card.tsx` (456 lines) - **PATTERN**: Extracted component with CRUD dialogs
- `app/components/dialogs/batch-dialog.tsx` - **PATTERN**: Standalone dialog component
- `app/routes/_auth/settings/index.tsx` - **TARGET**: Lines 1178-1402 are already separate functions
- `app/routes/_auth/inventory/index.tsx` - **TARGET**: Feed and medication sections
- `app/routes/_auth/onboarding/index.tsx` - **TARGET**: 8 step functions (lines 245-1374)

### New Files to Create

**Phase 1 (P1 - Highest Impact)**:

```
app/components/settings/
├── regional-tab.tsx          (~300 lines from settings)
├── preferences-tab.tsx       (~70 lines from settings)
├── notifications-tab.tsx     (~460 lines from settings)
├── business-tab.tsx          (~150 lines from settings)
├── modules-tab.tsx           (~30 lines - wrapper for ModuleSelector)
└── integrations-tab.tsx      (~200 lines from settings)

app/components/inventory/
├── feed-inventory-card.tsx   (~400 lines from inventory)
└── medication-card.tsx       (~400 lines from inventory)

app/components/onboarding/
├── welcome-step.tsx
├── create-farm-step.tsx
├── enable-modules-step.tsx
├── create-structure-step.tsx
├── create-batch-step.tsx
├── preferences-step.tsx
├── tour-step.tsx
└── complete-step.tsx
```

**Phase 2 (P2 - Medium Impact)**:

```
app/components/dashboard/
├── stats-cards.tsx           (~200 lines)
├── alerts-section.tsx        (~150 lines)
└── quick-actions.tsx         (~100 lines)

app/components/sales/
└── sales-summary-cards.tsx   (~150 lines)

app/components/expenses/
└── expenses-summary-cards.tsx (~150 lines)
```

### Patterns to Follow

**Extracted Component Pattern** (from `structures-card.tsx`):

```typescript
// app/components/{feature}/{component-name}.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
// ... other imports

interface ComponentProps {
  // Props passed from parent route
  initialData: Array<DataType>
  farmId: string
  onUpdate?: () => void  // Optional callback for parent refresh
}

export function ComponentName({ initialData, farmId, onUpdate }: ComponentProps) {
  const { t } = useTranslation(['feature', 'common'])

  // Local state for data and dialogs
  const [data, setData] = useState(initialData)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createFn({ data: { ... } })
      await refreshData()
      setDialogOpen(false)
      toast.success(t('created'))
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      {/* Component JSX */}
    </Card>
  )
}
```

**Tab Content Pattern** (for settings):

```typescript
// app/components/settings/regional-tab.tsx
import { useTranslation } from 'react-i18next'
import type { UserSettings } from '~/features/settings'

interface RegionalTabProps {
  settings: UserSettings
  onSettingsChange: (updates: Partial<UserSettings>) => void
  onSave: (updates: Partial<UserSettings>) => Promise<void>
  isSaving: boolean
}

export function RegionalTab({
  settings,
  onSettingsChange,
  onSave,
  isSaving
}: RegionalTabProps) {
  const { t } = useTranslation(['settings', 'common'])

  // Tab-specific logic

  return (
    <div className="space-y-6">
      {/* Tab content */}
    </div>
  )
}
```

**Step Component Pattern** (for onboarding):

```typescript
// app/components/onboarding/welcome-step.tsx
import { useTranslation } from 'react-i18next'
import { useOnboarding } from '~/features/onboarding/context'

export function WelcomeStep() {
  const { t } = useTranslation(['onboarding', 'common'])
  const { completeStep, isAdminAdded } = useOnboarding()

  return (
    <div className="space-y-6">
      {/* Step content */}
      <Button onClick={() => completeStep('welcome')}>
        {t('continue')}
      </Button>
    </div>
  )
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Settings Route (1,402 → ~200 lines)

Extract 6 tab content components. Settings is the largest file and has clear tab boundaries.

**Target reduction**: 1,402 → ~200 lines (86% reduction)

### Phase 2: Inventory Route (1,376 → ~200 lines)

Extract feed and medication cards with their CRUD dialogs.

**Target reduction**: 1,376 → ~200 lines (85% reduction)

### Phase 3: Onboarding Route (1,374 → ~150 lines)

Extract 8 step components to dedicated files.

**Target reduction**: 1,374 → ~150 lines (89% reduction)

### Phase 4: Dashboard Route (1,106 → ~400 lines)

Extract stat cards, alerts section, and quick actions.

**Target reduction**: 1,106 → ~400 lines (64% reduction)

### Phase 5: Sales & Expenses Routes (~1,200 each → ~600 lines)

Extract summary cards and inline edit/delete dialogs.

**Target reduction**: ~50% each

---

## STEP-BY-STEP TASKS

### Phase 1: Settings Route Refactoring

#### Task 1.1: CREATE `app/components/settings/regional-tab.tsx`

- **IMPLEMENT**: Extract lines 201-494 (regional tab content) from settings route
- **PATTERN**: Follow tab content pattern above
- **IMPORTS**:
  ```typescript
  import { useTranslation } from 'react-i18next'
  import { DollarSign, Calendar, Ruler } from 'lucide-react'
  import { Card } from '~/components/ui/card'
  import { Label } from '~/components/ui/label'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '~/components/ui/select'
  import { Button } from '~/components/ui/button'
  import { CURRENCY_PRESETS, getCurrencyPreset } from '~/features/settings'
  import { formatCurrency } from '~/features/settings/currency-formatter'
  import { formatDate, formatTime } from '~/features/settings/date-formatter'
  import type { UserSettings } from '~/features/settings'
  ```
- **PROPS**: `settings`, `onSettingsChange`, `onSave`, `onReset`, `isSaving`
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.2: CREATE `app/components/settings/preferences-tab.tsx`

- **IMPLEMENT**: Extract lines 497-561 (preferences tab) from settings route
- **PATTERN**: Follow tab content pattern
- **IMPORTS**: Theme toggle, language switcher, farm selector
- **PROPS**: `settings`, `onSettingsChange`, `onSave`, `isSaving`, `farms`
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.3: CREATE `app/components/settings/notifications-tab.tsx`

- **IMPLEMENT**: Extract lines 564-1023 (notifications tab) from settings route
- **PATTERN**: Follow tab content pattern
- **IMPORTS**: Switch, Card, notification setting types
- **PROPS**: `settings`, `onSettingsChange`, `onSave`, `isSaving`
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.4: CREATE `app/components/settings/business-tab.tsx`

- **IMPLEMENT**: Extract lines 1026-1175 (business tab) from settings route
- **PATTERN**: Follow tab content pattern
- **IMPORTS**: Input, Label, Select for fiscal year
- **PROPS**: `settings`, `onSettingsChange`, `onSave`, `isSaving`
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.5: CREATE `app/components/settings/integrations-tab.tsx`

- **IMPLEMENT**: Extract `IntegrationsTabContent` function (lines 1209-1402)
- **PATTERN**: Self-contained component with own state
- **IMPORTS**: Integration status types, server functions
- **PROPS**: None (self-contained)
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.6: UPDATE `app/routes/_auth/settings/index.tsx`

- **IMPLEMENT**: Replace inline tab content with imported components
- **IMPORTS**: Add imports for all 5 new tab components
- **REMOVE**: Lines 201-1175 (tab content), lines 1209-1402 (integrations)
- **KEEP**: Route definition, SettingsPage function shell, tabs structure
- **VALIDATE**: `bun run check && bun run lint`

### Phase 2: Inventory Route Refactoring

#### Task 2.1: CREATE `app/components/inventory/feed-inventory-card.tsx`

- **IMPLEMENT**: Extract feed inventory section with create/edit/delete dialogs
- **PATTERN**: Mirror `structures-card.tsx` pattern exactly
- **IMPORTS**:
  ```typescript
  import {
    FEED_TYPES,
    createFeedInventoryFn,
    deleteFeedInventoryFn,
    updateFeedInventoryFn,
  } from '~/features/inventory/feed-server'
  ```
- **PROPS**: `farmId`, `initialFeedInventory`, `onUpdate`
- **GOTCHA**: Include all 3 dialogs (create, edit, delete) in the component
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.2: CREATE `app/components/inventory/medication-card.tsx`

- **IMPLEMENT**: Extract medication inventory section with create/edit/delete dialogs
- **PATTERN**: Mirror `structures-card.tsx` pattern exactly
- **IMPORTS**:
  ```typescript
  import {
    MEDICATION_UNITS,
    createMedicationFn,
    deleteMedicationFn,
    updateMedicationFn,
  } from '~/features/inventory/medication-server'
  ```
- **PROPS**: `farmId`, `initialMedications`, `onUpdate`
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.3: UPDATE `app/routes/_auth/inventory/index.tsx`

- **IMPLEMENT**: Replace inline sections with imported components
- **IMPORTS**: Add FeedInventoryCard, MedicationCard
- **REMOVE**: Feed and medication sections, all inline dialogs
- **KEEP**: Route definition, data loading, tabs structure
- **VALIDATE**: `bun run check && bun run lint`

### Phase 3: Onboarding Route Refactoring

#### Task 3.1: CREATE `app/components/onboarding/` directory and step files

- **IMPLEMENT**: Create 8 step component files:
  - `welcome-step.tsx` (lines 245-339)
  - `create-farm-step.tsx` (lines 341-513)
  - `enable-modules-step.tsx` (lines 516-630)
  - `create-structure-step.tsx` (lines 633-780)
  - `create-batch-step.tsx` (lines 783-950)
  - `preferences-step.tsx` (lines 953-1100)
  - `tour-step.tsx` (lines 1103-1200)
  - `complete-step.tsx` (lines 1203-1374)
- **PATTERN**: Each step uses `useOnboarding()` hook for context
- **IMPORTS**: Each step imports only what it needs
- **VALIDATE**: `npx tsc --noEmit` after each file

#### Task 3.2: CREATE `app/components/onboarding/index.ts` barrel export

- **IMPLEMENT**:
  ```typescript
  export { WelcomeStep } from './welcome-step'
  export { CreateFarmStep } from './create-farm-step'
  // ... etc
  ```
- **VALIDATE**: `npx tsc --noEmit`

#### Task 3.3: UPDATE `app/routes/_auth/onboarding/index.tsx`

- **IMPLEMENT**: Replace inline step functions with imports
- **IMPORTS**: Import all steps from `~/components/onboarding`
- **REMOVE**: All step function definitions (lines 245-1374)
- **KEEP**: Route definition, OnboardingPage, OnboardingContent, StepRenderer
- **VALIDATE**: `bun run check && bun run lint`

### Phase 4: Dashboard Route Refactoring

#### Task 4.1: CREATE `app/components/dashboard/stats-cards.tsx`

- **IMPLEMENT**: Extract revenue, expenses, profit, inventory stat cards
- **PATTERN**: Accept stats data as props, render cards
- **PROPS**: `stats`, `formatCurrency`, `cards` (visibility preferences)
- **VALIDATE**: `npx tsc --noEmit`

#### Task 4.2: CREATE `app/components/dashboard/alerts-section.tsx`

- **IMPLEMENT**: Extract batch alerts section
- **PATTERN**: Accept alerts array, render alert cards
- **PROPS**: `alerts`, `formatDate`
- **VALIDATE**: `npx tsc --noEmit`

#### Task 4.3: CREATE `app/components/dashboard/quick-actions.tsx`

- **IMPLEMENT**: Extract quick action buttons section
- **PATTERN**: Accept dialog state setters as props
- **PROPS**: Dialog open state setters
- **VALIDATE**: `npx tsc --noEmit`

#### Task 4.4: UPDATE `app/routes/_auth/dashboard/index.tsx`

- **IMPLEMENT**: Replace inline sections with imported components
- **IMPORTS**: Add StatsCards, AlertsSection, QuickActions
- **KEEP**: Route definition, data loading, dialog components
- **VALIDATE**: `bun run check && bun run lint`

### Phase 5: Final Validation

#### Task 5.1: Run full validation suite

- **VALIDATE**:
  ```bash
  bun run check && bun run lint && bun run test --run && bun run build
  ```

#### Task 5.2: Verify line counts

- **VALIDATE**:
  ```bash
  wc -l app/routes/_auth/*/index.tsx app/routes/_auth/*/*/index.tsx | sort -rn | head -20
  ```
- **EXPECTED**: All routes under 600 lines, most under 400

---

## TESTING STRATEGY

### Unit Tests

No new tests required - this is a pure refactoring with no behavior changes.

### Regression Testing

- All existing 300+ tests must pass
- Manual verification that each refactored page works identically

### Validation Commands

```bash
# After each task
npx tsc --noEmit

# After each phase
bun run check && bun run lint

# Final validation
bun run check && bun run lint && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All validation commands pass
- [ ] No route file exceeds 600 lines
- [ ] Settings route reduced to ~200 lines
- [ ] Inventory route reduced to ~200 lines
- [ ] Onboarding route reduced to ~150 lines
- [ ] Dashboard route reduced to ~400 lines
- [ ] All 300+ existing tests pass
- [ ] No visual or functional regressions
- [ ] New components follow established patterns
- [ ] Proper TypeScript types on all props

---

## COMPLETION CHECKLIST

- [ ] Phase 1: Settings route refactored (6 components extracted)
- [ ] Phase 2: Inventory route refactored (2 components extracted)
- [ ] Phase 3: Onboarding route refactored (8 components extracted)
- [ ] Phase 4: Dashboard route refactored (3 components extracted)
- [ ] Phase 5: All validations pass
- [ ] Line count verification shows improvement

---

## NOTES

### Prioritization Rationale

1. **Settings (P1)**: Largest file, clear tab boundaries, high developer touchpoint
2. **Inventory (P1)**: Second largest, clear feed/medication split
3. **Onboarding (P1)**: Third largest, 8 discrete steps
4. **Dashboard (P2)**: High visibility, clear card sections

### Deferred Routes (P3)

The following routes are over 500 lines but have lower priority:

- sales, expenses, vaccinations, mortality, feed, reports, water-quality, eggs, customers

These can be addressed in a follow-up refactoring pass using the same patterns established in P1/P2.

### Risk Mitigation

- **No behavior changes**: Pure extraction, no logic modifications
- **Incremental validation**: Type check after each file
- **Full test suite**: Run all tests after each phase
- **Rollback friendly**: Each phase is independent

### Estimated Time

- Phase 1 (Settings): ~2 hours
- Phase 2 (Inventory): ~1.5 hours
- Phase 3 (Onboarding): ~2 hours
- Phase 4 (Dashboard): ~1 hour
- Phase 5 (Validation): ~30 minutes
- **Total**: ~7 hours

### Confidence Score

**8/10** - High confidence due to:

- Clear extraction boundaries (tabs, steps, cards)
- Established pattern to follow (structures-card.tsx)
- No business logic changes
- Comprehensive validation at each step
