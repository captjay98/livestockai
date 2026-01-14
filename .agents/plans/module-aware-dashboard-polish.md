# Feature: Module-Aware Dashboard Polish

## Feature Description

Complete dashboard customization by adding mortality and feed summary cards that users can show/hide via preferences.

## User Story

As a farm manager
I want to see mortality and feed metrics on my dashboard
So that I can monitor critical farm health indicators at a glance

## Problem Statement

Dashboard customization is incomplete:

- dashboardCards setting has `mortality` and `feed` options
- But no mortality or feed cards exist on dashboard
- Users can toggle these settings but nothing happens

## Solution Statement

Add 2 new dashboard cards:

1. **Mortality Card** - Shows total deaths this month, mortality rate
2. **Feed Card** - Shows total feed consumed, total cost, FCR

Both cards conditional based on `cards.mortality` and `cards.feed` preferences.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Low
**Primary Systems Affected**: Dashboard
**Dependencies**: None (data already in DashboardStats)

---

## CONTEXT REFERENCES

### Relevant Files - MUST READ!

- `app/routes/_auth/dashboard/index.tsx` (lines 385-520) - Existing card structure
  - Why: Pattern to mirror for new cards
- `app/features/dashboard/server.ts` - DashboardStats interface
  - Why: Check if mortality/feed data already returned

---

## STEP-BY-STEP TASKS

### Task 1: ADD mortality data to DashboardStats (if missing)

- **FILE**: `app/features/dashboard/server.ts`
- **CHECK**: Does DashboardStats include mortality data?
- **ADD**: If missing, add mortality summary to stats
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE mortality card

- **FILE**: `app/routes/_auth/dashboard/index.tsx`
- **IMPLEMENT**: Add card after batches card

```typescript
{cards.mortality && (
  <Card>
    <CardContent className="p-3 shadow-none">
      <div className="flex flex-row items-center justify-between space-y-0 pb-1">
        <p className="text-xs font-medium text-muted-foreground">
          Mortality
        </p>
        <AlertTriangle className="h-4 w-4 text-destructive" />
      </div>
      <div>
        <div className="text-lg sm:text-xl font-bold">
          {stats.mortality?.totalDeaths || 0}
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          This month
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

- **VALIDATE**: Visual inspection

### Task 3: CREATE feed card

- **IMPLEMENT**: Add card after mortality card
- **PATTERN**: Same structure, show feed cost and FCR
- **VALIDATE**: Visual inspection

### Task 4: UPDATE empty state condition

- **FILE**: `app/routes/_auth/dashboard/index.tsx`
- **UPDATE**: Include mortality and feed in empty state check

```typescript
{!cards.revenue && !cards.expenses && !cards.profit && !cards.inventory && !cards.mortality && !cards.feed && (
  // Empty state
)}
```

- **VALIDATE**: Hide all cards, verify empty state shows

---

## ACCEPTANCE CRITERIA

- [x] Mortality card shows total deaths and rate
- [x] Feed card shows total cost and FCR
- [x] Both cards respect user preferences
- [x] Empty state includes new cards in check
- [x] TypeScript compiles without errors

---

## IMPLEMENTATION COMPLETE ✅

**Completed**: 2026-01-14
**Time Taken**: ~30 minutes
**Files Modified**: 2

### Changes Made

1. **app/features/dashboard/server.ts**
   - Added `mortality` and `feed` to DashboardStats interface
   - Added mortality query (total deaths, mortality rate)
   - Added feed query (total cost, total kg, FCR)
   - Updated empty stats return

2. **app/routes/\_auth/dashboard/index.tsx**
   - Added mortality card with AlertTriangle icon
   - Added feed card with Wheat icon
   - Updated stats type definition
   - Updated empty state condition

### Validation Results

- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ All cards conditional on user preferences
- ✅ Empty state works correctly

---

## NOTES

**Estimated Time**: 1 hour
**Data Availability**: Check if DashboardStats already includes mortality/feed data from earlier implementations.
