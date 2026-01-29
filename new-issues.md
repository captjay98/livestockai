# Comprehensive Audit Report - New Issues Found

**Date:** 2026-01-29
**Audited By:** Claude Code
**Scope:** Full codebase audit covering financial calculations, database queries, i18n, and security

---

## Executive Summary

| Category                   | Status          | Critical Issues | Notes                                                   |
| -------------------------- | --------------- | --------------- | ------------------------------------------------------- |
| **Financial Calculations** | ⚠️ ISSUES FOUND | 2 HIGH          | Dashboard FCR bug, multiple FCR implementations         |
| **Database Queries**       | ⚠️ ISSUES FOUND | 1 MEDIUM        | Livestock type inconsistency in sales/reports           |
| **i18n Coverage**          | ❌ MAJOR GAPS   | 0 CRITICAL      | 80+ hardcoded strings across 23+ files                  |
| **Security**               | ❌ CRITICAL     | 2 CRITICAL      | Email verification disabled, missing production domains |

---

## 🔴 CRITICAL ISSUES (Must Fix Before Production)

### Issue #1: Dashboard FCR Calculation Bug

**Severity:** 🔴 CRITICAL
**File:** `app/features/dashboard/server.ts`
**Line:** 269

**Current Code:**

```typescript
const feedTotalKg = parseFloat(feedQuery?.totalKg || '0')
const totalQuantity = Number(totalWeightQuery?.totalQuantity || 0)
const fcr = totalQuantity > 0 ? feedTotalKg / totalQuantity : 0
```

**Problem:**
The FCR is calculated as `feedTotalKg / totalQuantity`, where `totalQuantity` is the **total number of birds/livestock**, NOT the **total weight gain**.

**Correct Formula:**
FCR = Total Feed Consumed / Total Weight Gain

**Fix Required:**

```typescript
// Calculate actual weight gain
const initialWeight = Number(initialWeightQuery?.totalWeight || 0)
const currentWeight = Number(currentWeightQuery?.totalWeight || 0)
const totalWeightGain = currentWeight - initialWeight

const fcr = totalWeightGain > 0 ? feedTotalKg / totalWeightGain : 0
```

**Impact:** Displays completely incorrect FCR values to users

---

### Issue #2: Email Verification Disabled

**Severity:** 🔴 CRITICAL
**File:** `app/features/auth/config.ts`
**Line:** 131

**Current Code:**

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false, // Disabled for dev - seeded users work without verification
```

**Problem:**

- Users can register with fake/unowned email addresses
- No verification that email addresses are valid or controlled by the user
- Enables spam account creation and potential abuse

**Fix Required:**

```typescript
requireEmailVerification: process.env.NODE_ENV === 'production' ? true : false,
```

**Impact:** Security vulnerability - spam accounts, fake emails

---

### Issue #3: Production Domains Missing from Trusted Origins

**Severity:** 🔴 CRITICAL
**File:** `app/features/auth/config.ts`
**Lines:** 179-183

**Current Code:**

```typescript
trustedOrigins: [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
],
```

**Problem:**
Production domains are NOT in the trusted origins list. Authentication will fail in production environments.

**Fix Required:**

```typescript
trustedOrigins: [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  // Add production domains
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
],
```

**Impact:** Authentication will fail in production, CORS issues

---

## ⚠️ HIGH PRIORITY ISSUES

### Issue #4: Livestock Type Inconsistency in Sales

**Severity:** ⚠️ HIGH
**Files:**

- `app/features/sales/server.ts` (lines 193, 721, 756)
- `app/features/reports/server.ts` (lines 270, 274)
- `app/features/weight/validation.ts` (line 66)
- `app/features/water-quality/server.ts` (line 74)

**Current Code:**

```typescript
// Sales server
livestockType: z.enum(['poultry', 'fish', 'eggs'])

// Reports server
livestockType?: 'poultry' | 'fish'

// Weight validation
livestockType: z.enum(['poultry', 'fish'])
```

**Problem:**
Missing support for: `cattle`, `goats`, `sheep`, `bees`.
Extra type: `eggs` (should be a product type, not livestock type).

**Fix Required:**

```typescript
// Define shared type
type LivestockType = 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'
type ProductType = 'livestock' | 'eggs' | 'milk' | 'honey' | 'wool'

// Update all files to use LivestockType
```

**Impact:** Cannot create sales for cattle, goats, sheep, bees; database constraints violations

---

### Issue #5: Batch Stats FCR Assumes First Weight = Initial Weight

**Severity:** ⚠️ MEDIUM-HIGH
**File:** `app/features/batches/server/stats.ts`
**Lines:** 52-60

**Current Code:**

```typescript
let fcr = null
if (weightSamples.length > 0) {
  const totalFeedKg = toNumber(String(stats.feed.totalFeedKg || '0'))
  if (totalFeedKg > 0) {
    const avgWeight = toNumber(weightSamples[0].averageWeightKg)
    const totalWeightGain = avgWeight * batch.currentQuantity
    fcr = calculateFeedConversionRatio(totalFeedKg, totalWeightGain)
  }
}
```

**Problem:**
Uses `weightSamples[0]` assuming it's the initial weight, but it's typically the **most recent** weight (ordered descending). Assumes initial weight was 0.

**Fix Required:**

```typescript
if (weightSamples.length >= 2) {
  const firstWeight = toNumber(
    weightSamples[weightSamples.length - 1].averageWeightKg,
  )
  const lastWeight = toNumber(weightSamples[0].averageWeightKg)
  const totalWeightGain = (lastWeight - firstWeight) * batch.currentQuantity
  fcr = calculateFeedConversionRatio(totalFeedKg, totalWeightGain)
}
```

**Impact:** Incorrect FCR values displayed

---

### Issue #6: Multiple FCR Implementations

**Severity:** ⚠️ MEDIUM
**Files:**

- `app/lib/utils/calculations.ts`
- `app/features/feed/service.ts`
- `app/features/batches/service.ts`

**Problem:**
Three different implementations with different signatures:

```typescript
// lib/utils/calculations.ts
export function calculateFCR(
  totalFeedKg: number,
  weightGainKg: number,
): number | null

// feed/service.ts
export function calculateFCR(
  totalFeedKg: number,
  weightGainKg: number,
  initialQuantity: number, // EXTRA PARAMETER
): number | null

// batches/service.ts
// Re-exports from lib/utils/calculations
```

**Fix Required:**
Consolidate to single implementation in shared utility, remove duplication.

**Impact:** Code confusion, potential inconsistencies

---

## 📋 MEDIUM PRIORITY ISSUES

### Issue #7: 80+ Hardcoded i18n Strings

**Severity:** ⚠️ MEDIUM
**Files Affected:** 23+ component files

**Examples:**

#### Skeleton Components (13 files):

```typescript
// weight-skeleton.tsx:12
description =
  'Track growth by recording periodic weight samples. Compare against industry standards.'

// farms-skeleton.tsx:9-10
title = 'Farms'
description = 'Manage your farm locations and livestock operations.'

// feed-skeleton.tsx:10-11
title = 'Feed Records'
description = 'Track feed consumption and costs'

// Plus 10 more skeleton files...
```

#### Digital Foreman Components:

```typescript
// PayrollDashboard.tsx - 25+ hardcoded strings
"Payroll Dashboard", "Export CSV", "Select Period", "Total Wages", etc.

// WorkerPerformanceCard.tsx - 9 hardcoded strings
"Task Completion", "Attendance", "Approval Rate", etc.
```

#### Other Components:

- `command-center.tsx` - 5 hardcoded strings
- `bell-icon.tsx` - 6 hardcoded strings
- `navigation.tsx` - 2 hardcoded strings
- `theme-toggle.tsx` - 2 hardcoded strings

**Fix Required:**
Replace all hardcoded strings with `t()` function calls and add missing translation keys.

**Impact:** Breaks i18n for 15 languages

---

### Issue #8: Type Safety Violations with `as any` Casts

**Severity:** ⚠️ MEDIUM
**Count:** 5+ instances

**Locations:**

1. `app/features/auth/config.ts:222`

```typescript
return (authInstance as any)[prop]
```

2. `app/features/settings/repository.ts:152, 329`

```typescript
return (settings as any) ?? null
return settings as Array<any>
```

3. `app/features/digital-foreman/repository.ts:386`

```typescript
if (status) query = query.where('status', '=', status as any)
```

4. `app/features/batches/server/crud.ts:199`

```typescript
throw createConflictError({ ...batch, updatedAt: batch.updatedAt }, {
  ...data,
  updatedAt: data.expectedUpdatedAt,
} as any)
```

**Fix Required:**
Replace `as any` with proper type guards or Zod validation. Use `unknown` instead of `any` when type is truly unknown.

**Impact:** Bypasses TypeScript type checking, potential runtime errors

---

## ✅ VERIFIED AS WORKING CORRECTLY

| Area                       | Status           | Details                                                   |
| -------------------------- | ---------------- | --------------------------------------------------------- |
| Cost assignment in batches | ✅ FIXED         | `crud.ts:83` correctly uses `data.costPerUnit.toString()` |
| Farm name joins            | ✅ FIXED         | `repository.ts:140` properly joins farms table            |
| Transaction scopes         | ✅ CORRECT       | All operations within transactions use transaction object |
| Soft delete filters        | ✅ CONSISTENT    | All queries properly filter `deletedAt IS NULL`           |
| N+1 query patterns         | ✅ NONE FOUND    | No query patterns inside loops                            |
| Authorization checks       | ✅ COMPREHENSIVE | All server functions use `requireAuth()`                  |
| Cascade validation         | ✅ IMPLEMENTED   | `canDeleteBatch()` + `getRelatedRecords()` working        |
| Password hashing           | ✅ SECURE        | PBKDF2, 100k iterations, SHA-256                          |
| Session management         | ✅ SECURE        | 7-day expiry, secure cookies                              |
| ADG species coverage       | ✅ FIXED         | All 8 species included                                    |

---

## 📈 ISSUE STATISTICS

| Severity     | Count | Categories                              |
| ------------ | ----- | --------------------------------------- |
| **CRITICAL** | 3     | Financial (1), Security (2)             |
| **HIGH**     | 2     | Database type inconsistency             |
| **MEDIUM**   | 3     | FCR duplication, i18n gaps, type safety |
| **LOW**      | 1     | Documentation/comments                  |

---

## 🎯 PRIORITIZED FIX LIST

### Phase 1 - Production Blockers (Must Fix Today)

1. ✅ Add production domains to `trustedOrigins` in `auth/config.ts`
2. ✅ Fix dashboard FCR calculation in `dashboard/server.ts`
3. ✅ Enable email verification conditionally for production

### Phase 2 - High Priority (This Week)

4. ✅ Fix livestock type filters in sales/reports/weight/water-quality
5. ✅ Fix batch stats FCR calculation in `batches/server/stats.ts`
6. ✅ Consolidate FCR calculations to single implementation

### Phase 3 - Medium Priority (Next Sprint)

7. ✅ Replace `as any` casts with proper type guards
8. ✅ Add i18n keys for all hardcoded strings (80+ instances)

---

## 📝 RECOMMENDATIONS

1. **Immediate Actions:**
   - Fix the 3 critical production blockers before any production deployment
   - Add production environment variables to `.env.example`

2. **Short Term:**
   - Standardize livestock types across all features
   - Consolidate duplicate business logic (FCR calculations)
   - Create comprehensive i18n translation coverage

3. **Long Term:**
   - Implement comprehensive testing for financial calculations
   - Add linting rules to prevent `as any` usage
   - Create i18n linting to prevent hardcoded strings
   - Document production deployment checklist

---

## 🔗 RELATED FILES

- `fix.md` - Previously confirmed issues (mostly fixed)
- `CODE_REVIEW_REPORT.md` - Original code review from 3 audits
- `.env.example` - Environment variable template (needs production domains)

---

**Audit Completed:** 2026-01-29
**Next Review:** After critical issues are resolved
