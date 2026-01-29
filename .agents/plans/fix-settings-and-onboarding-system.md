# Feature: Fix Settings System & Onboarding Flow

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Fix the settings system so user preferences (currency, date format, units) are actually used throughout the app. Fix the onboarding flow so it works for new users and can be re-triggered. Make the system usable across different types of users globally.

## User Story

As a farm manager in any country
I want my currency, date format, and unit preferences to be respected throughout the app
So that I can work with familiar formats and make accurate financial decisions

As a new user
I want to be guided through setting up my farm
So that I can start using the app effectively

## Problem Statement

1. **Currency not using settings**: `formatCurrency()` in `currency.ts` is hardcoded to NGN (₦), ignoring user preferences stored in settings
2. **Onboarding broken**: Only checks if user has farms - seeded users skip onboarding entirely
3. **Settings not persisted properly**: `onboardingCompleted` flag in DB not being used
4. **No way to restart onboarding**: Users can't re-trigger the setup flow

## Solution Statement

1. Create a settings-aware `formatCurrency` that uses context OR accepts settings parameter
2. Fix onboarding to check `onboardingCompleted` flag in user_settings table
3. Add "Restart Onboarding" functionality
4. Ensure all 18 files using `formatCurrency` use the settings-aware version

## Feature Metadata

**Feature Type**: Bug Fix / Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Settings, Onboarding, Currency Formatting
**Dependencies**: None (all infrastructure exists)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

**Currency System:**

- `app/features/settings/currency.ts` (lines 57-66) - PROBLEM: Hardcoded NGN formatting
- `app/features/settings/currency-formatter.ts` (lines 48-65) - SOLUTION: Settings-aware formatter exists but unused
- `app/features/settings/hooks.ts` (lines 35-55) - `useFormatCurrency` hook exists but unused
- `app/features/settings/context.tsx` - SettingsProvider and useSettings hook

**Onboarding System:**

- `app/features/onboarding/server.ts` - Server functions for onboarding state
- `app/features/onboarding/context.tsx` - Client-side onboarding state (localStorage)
- `app/features/onboarding/types.ts` - Step definitions
- `app/routes/_auth.tsx` (lines 31-40) - Onboarding redirect logic
- `app/routes/_auth/onboarding/index.tsx` - Onboarding UI

**Files Using formatCurrency (18 files to update):**

- `app/routes/_auth/dashboard/index.tsx`
- `app/routes/_auth/batches/index.tsx`
- `app/routes/_auth/batches/$batchId/index.tsx`
- `app/routes/_auth/sales/index.tsx`
- `app/routes/_auth/expenses/index.tsx`
- `app/routes/_auth/customers/index.tsx`
- `app/routes/_auth/customers/$customerId.tsx`
- `app/routes/_auth/suppliers/index.tsx`
- `app/routes/_auth/suppliers/$supplierId.tsx`
- `app/routes/_auth/invoices/index.tsx`
- `app/routes/_auth/invoices/$invoiceId.tsx`
- `app/routes/_auth/farms/$farmId/index.tsx`
- `app/routes/_auth/feed/index.tsx`
- `app/routes/_auth/reports/index.tsx`
- `app/components/dialogs/invoice-dialog.tsx`
- `app/features/export/pdf.ts`

**Database Schema:**

- `app/lib/db/types.ts` (lines 77-79) - `onboardingCompleted` and `onboardingStep` fields exist

### Patterns to Follow

**Hook Usage Pattern (from existing codebase):**

```typescript
// In React components, use the hook
import { useFormatCurrency } from '~/features/settings'

function MyComponent() {
  const { format } = useFormatCurrency()
  return <span>{format(1234.56)}</span>
}
```

**Settings-Aware Formatter (for non-React contexts):**

```typescript
// In server functions or utilities, pass settings explicitly
import { formatCurrency } from '~/features/settings/currency-formatter'
import { LEGACY_NGN_SETTINGS } from '~/features/settings/currency-presets'

// Use with explicit settings
formatCurrency(amount, settings)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Fix Currency Formatting

Update `currency.ts` to use settings-aware formatting by default, with fallback to NGN for backward compatibility.

### Phase 2: Update All Currency Usages

Replace hardcoded `formatCurrency` imports with `useFormatCurrency` hook in React components.

### Phase 3: Fix Onboarding Detection

Update onboarding check to use `onboardingCompleted` flag from database.

### Phase 4: Add Restart Onboarding

Add ability to restart onboarding from settings page.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/features/settings/currency.ts`

- **IMPLEMENT**: Make `formatCurrency` use settings from context when available, fallback to NGN
- **APPROACH**: Export a new `formatCurrencyWithSettings` that takes settings, keep `formatCurrency` as NGN fallback for server-side
- **ADD**: Re-export from currency-formatter for convenience

```typescript
// Add at end of currency.ts
export { formatCurrency as formatCurrencyWithSettings } from './currency-formatter'

// Keep existing formatCurrency as formatNaira for backward compat
export { formatCurrency as formatNaira }
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep currency`

### Task 2: CREATE `app/components/currency.tsx`

- **IMPLEMENT**: Simple wrapper component for formatted currency
- **PATTERN**: Similar to how Badge component works

```typescript
import { useFormatCurrency } from '~/features/settings'
import type { MoneyInput } from '~/features/settings/currency'

interface CurrencyProps {
  amount: MoneyInput
  compact?: boolean
}

export function Currency({ amount, compact }: CurrencyProps) {
  const { format, formatCompact } = useFormatCurrency()
  return <>{compact ? formatCompact(amount) : format(amount)}</>
}
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep currency.tsx`

### Task 3: UPDATE `app/routes/_auth/dashboard/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep dashboard`

### Task 4: UPDATE `app/routes/_auth/batches/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep batches/index`

### Task 5: UPDATE `app/routes/_auth/batches/$batchId/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep batchId`

### Task 6: UPDATE `app/routes/_auth/sales/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep sales/index`

### Task 7: UPDATE `app/routes/_auth/expenses/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep expenses/index`

### Task 8: UPDATE `app/routes/_auth/customers/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep customers/index`

### Task 9: UPDATE `app/routes/_auth/customers/$customerId.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep customerId`

### Task 10: UPDATE `app/routes/_auth/suppliers/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep suppliers/index`

### Task 11: UPDATE `app/routes/_auth/suppliers/$supplierId.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep supplierId`

### Task 12: UPDATE `app/routes/_auth/invoices/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep invoices/index`

### Task 13: UPDATE `app/routes/_auth/invoices/$invoiceId.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep invoiceId`

### Task 14: UPDATE `app/routes/_auth/farms/$farmId/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep farmId`

### Task 15: UPDATE `app/routes/_auth/feed/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep feed/index`

### Task 16: UPDATE `app/routes/_auth/reports/index.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep reports/index`

### Task 17: UPDATE `app/components/dialogs/invoice-dialog.tsx`

- **REPLACE**: `import { formatCurrency } from '~/features/settings/currency'`
- **WITH**: `import { useFormatCurrency } from '~/features/settings'`
- **ADD**: `const { format: formatCurrency } = useFormatCurrency()` inside component
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep invoice-dialog`

### Task 18: UPDATE `app/features/export/pdf.ts`

- **KEEP**: This is server-side, needs explicit settings
- **IMPORT**: `import { LEGACY_NGN_SETTINGS } from '~/features/settings/currency-presets'`
- **IMPORT**: `import { formatCurrency } from '~/features/settings/currency-formatter'`
- **UPDATE**: Pass `LEGACY_NGN_SETTINGS` to formatCurrency calls (or accept settings as parameter)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep pdf.ts`

### Task 19: UPDATE `app/features/onboarding/server.ts`

- **IMPLEMENT**: Check `onboardingCompleted` flag from user_settings table
- **UPDATE**: `checkNeedsOnboardingFn` to query user_settings

```typescript
// In checkNeedsOnboardingFn
const userSettings = await db
  .selectFrom('user_settings')
  .select(['onboardingCompleted'])
  .where('userId', '=', session.user.id)
  .executeTakeFirst()

// If settings exist and onboarding completed, don't need onboarding
if (userSettings?.onboardingCompleted) {
  return { needsOnboarding: false, hasFarms: true }
}
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep onboarding/server`

### Task 20: UPDATE `app/features/onboarding/server.ts` - Add complete function

- **IMPLEMENT**: `markOnboardingCompleteFn` to set flag in database

```typescript
export const markOnboardingCompleteFn = createServerFn({
  method: 'POST',
}).handler(async () => {
  const { requireAuth } = await import('../auth/server-middleware')
  const session = await requireAuth()
  const { db } = await import('~/lib/db')

  await db
    .updateTable('user_settings')
    .set({ onboardingCompleted: true })
    .where('userId', '=', session.user.id)
    .execute()

  return { success: true }
})
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep onboarding/server`

### Task 21: UPDATE `app/features/onboarding/server.ts` - Add reset function

- **IMPLEMENT**: `resetOnboardingFn` to allow restarting onboarding

```typescript
export const resetOnboardingFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    const { db } = await import('~/lib/db')

    await db
      .updateTable('user_settings')
      .set({ onboardingCompleted: false, onboardingStep: 0 })
      .where('userId', '=', session.user.id)
      .execute()

    return { success: true }
  },
)
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep onboarding/server`

### Task 22: UPDATE `app/routes/_auth/onboarding/index.tsx`

- **IMPORT**: `markOnboardingCompleteFn` from server
- **UPDATE**: Call `markOnboardingCompleteFn` when onboarding completes (in the 'complete' step)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep onboarding/index`

### Task 23: UPDATE `app/routes/_auth/settings/index.tsx`

- **FIND**: The "Start Tour" button (around line 611)
- **UPDATE**: Make it call `resetOnboardingFn` and navigate to `/onboarding`
- **IMPORT**: `resetOnboardingFn` from onboarding server
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep settings/index`

### Task 24: Final validation

- **RUN**: `npx tsc --noEmit`
- **RUN**: `bun run lint`
- **RUN**: `bun test`

---

## TESTING STRATEGY

### Unit Tests

No new unit tests required - this is primarily a wiring fix. Existing tests should continue to pass.

### Manual Testing

1. **Currency Settings Test:**
   - Go to Settings → Regional
   - Change currency to USD
   - Navigate to Dashboard - verify amounts show $ instead of ₦
   - Navigate to Sales - verify amounts show $
   - Change to EUR - verify € symbol and European formatting (1.234,56)

2. **Onboarding Test (New User):**
   - Create new user account
   - Verify redirected to /onboarding
   - Complete all steps
   - Verify redirected to dashboard
   - Refresh page - should NOT see onboarding again

3. **Restart Onboarding Test:**
   - Go to Settings → Regional
   - Click "Start Tour" / "Restart Onboarding"
   - Verify redirected to /onboarding
   - Can complete or skip

---

## VALIDATION COMMANDS

### Level 1: TypeScript

```bash
npx tsc --noEmit
```

### Level 2: Lint

```bash
bun run lint
```

### Level 3: Tests

```bash
bun test
```

### Level 4: Manual Validation

1. Change currency in settings, verify it updates across all pages
2. Create new user, verify onboarding triggers
3. Complete onboarding, verify it doesn't trigger again
4. Restart onboarding from settings, verify it works

---

## ACCEPTANCE CRITERIA

- [ ] Currency formatting respects user settings (symbol, position, separators)
- [ ] All 18 files using formatCurrency updated to use settings-aware version
- [ ] New users see onboarding flow
- [ ] Completing onboarding sets `onboardingCompleted` flag in database
- [ ] Users with `onboardingCompleted=true` don't see onboarding
- [ ] "Restart Onboarding" button works from settings
- [ ] TypeScript passes with 0 errors
- [ ] ESLint passes with 0 errors
- [ ] All tests pass

---

## COMPLETION CHECKLIST

- [ ] Tasks 1-2: Currency system updates
- [ ] Tasks 3-17: Update all route files to use useFormatCurrency hook
- [ ] Task 18: Update PDF export with explicit settings
- [ ] Tasks 19-21: Fix onboarding server functions
- [ ] Tasks 22-23: Update onboarding UI and settings page
- [ ] Task 24: Final validation
- [ ] Manual testing confirms all features work

---

## NOTES

### Design Decisions

1. **Hook vs Direct Import**: Using `useFormatCurrency` hook in React components ensures settings are always current. The hook reads from SettingsContext which is already provided at root level.

2. **Server-Side Formatting**: For server functions and PDF export, we pass settings explicitly. This is necessary because React context isn't available server-side.

3. **Backward Compatibility**: Keeping `formatCurrency` in `currency.ts` as NGN fallback ensures existing server-side code doesn't break.

4. **Database Flag**: Using `onboardingCompleted` in user_settings table (already exists) rather than localStorage ensures onboarding state persists across devices.

### Estimated Time

- Tasks 1-2 (Currency setup): 15 min
- Tasks 3-17 (Route updates): 45 min (repetitive but straightforward)
- Task 18 (PDF export): 10 min
- Tasks 19-23 (Onboarding fixes): 30 min
- Task 24 (Validation): 15 min

**Total: ~2 hours**

### Risk Assessment

**Low Risk** - All infrastructure exists, this is primarily wiring existing pieces together correctly.

### Future Considerations

- Could add more currency presets
- Could add language/locale setting for full i18n
- Could persist more user preferences (default farm, theme, etc.)
