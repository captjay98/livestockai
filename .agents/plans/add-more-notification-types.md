# Feature: Add More Notification Types

## Feature Description

Expand notification system to support low stock, invoice due, and batch harvest alerts. Currently only mortality alerts create notifications.

## User Story

As a farm manager
I want notifications for low stock, overdue invoices, and upcoming harvests
So that I can take timely action on critical farm operations

## Problem Statement

Notification preferences exist for 4 types but only mortality is implemented:

- lowStock ✅ Setting exists ❌ Not implemented
- highMortality ✅ Implemented
- invoiceDue ✅ Setting exists ❌ Not implemented
- batchHarvest ✅ Setting exists ❌ Not implemented

## Solution Statement

Wire up the 3 missing notification types:

1. Low stock - Check inventory thresholds daily
2. Invoice due - Check invoices 7 days before due date
3. Batch harvest - Check batches approaching target harvest date

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Notifications, Inventory, Invoices, Batches
**Dependencies**: Existing notification system

---

## CONTEXT REFERENCES

### Relevant Files - MUST READ!

- `app/features/notifications/server.ts` - createNotification function
- `app/features/monitoring/alerts.ts` (lines 40-80) - Pattern for mortality alerts
- `app/routes/_auth/inventory/index.tsx` (lines 360-380) - Low stock calculation
- `app/lib/db/types.ts` - Invoice and Batch table schemas

### New Files to Create

- `app/features/notifications/schedulers.ts` - Background job functions

---

## STEP-BY-STEP TASKS

### Task 1: CREATE low stock notification checker

- **FILE**: `app/features/notifications/schedulers.ts`
- **IMPLEMENT**: `checkLowStockNotifications(userId: string)`
    - Query feed_inventory and medication_inventory
    - Compare quantity vs minThreshold
    - Create notification if below threshold and user preference enabled
- **PATTERN**: Mirror alerts.ts structure
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE invoice due notification checker

- **IMPLEMENT**: `checkInvoiceDueNotifications(userId: string)`
    - Query invoices with status 'unpaid' or 'partial'
    - Check if dueDate is within 7 days
    - Create notification if user preference enabled
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE batch harvest notification checker

- **IMPLEMENT**: `checkBatchHarvestNotifications(userId: string)`
    - Query batches with targetHarvestDate
    - Check if date is within 7 days
    - Create notification if user preference enabled
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: EXPORT scheduler functions

- **FILE**: `app/features/notifications/index.ts`
- **ADD**: Export scheduler functions
- **VALIDATE**: `bun run lint`

---

## VALIDATION COMMANDS

```bash
npx tsc --noEmit
bun run lint
bun test
```

---

## ACCEPTANCE CRITERIA

- [x] Low stock notifications created when inventory below threshold
- [x] Invoice due notifications created 7 days before due date
- [x] Batch harvest notifications created 7 days before target date
- [x] All notifications respect user preferences
- [x] TypeScript compiles without errors
- [x] No ESLint errors

---

## IMPLEMENTATION COMPLETE ✅

**Completed**: 2026-01-14
**Time Taken**: ~15 minutes

### Changes Made

1. **Low Stock Notifications** - Checks feed and medication inventory
2. **Invoice Due Notifications** - Checks unpaid/partial invoices within 7 days
3. **Batch Harvest Notifications** - Checks batches approaching target harvest date

### Features

- All schedulers respect user notification preferences
- Duplicate prevention (checks existing unread notifications)
- Metadata includes relevant IDs for action URLs
- Returns count of notifications created

### Files Created

- `app/features/notifications/schedulers.ts` - 3 scheduler functions

### Files Modified

- `app/features/notifications/index.ts` - Export schedulers

**Note**: Schedulers are callable functions. Cron job/scheduling infrastructure can be added later.

---

## NOTES

**Scheduling**: These functions should be called periodically (daily cron job). For now, they're callable functions - scheduling infrastructure can be added later.

**Notification Deduplication**: Check if notification already exists before creating to avoid spam.
