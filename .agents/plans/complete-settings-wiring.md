# Feature: Complete Settings System Wiring

The following plan covers the remaining settings implementation tasks. Validate documentation and codebase patterns before implementing.

## Feature Description

Complete the wiring of the 10 new user settings to affect application behavior. This includes auto-selecting default farms, applying theme preferences, using custom alert thresholds for inventory, enabling dashboard customization, and preparing i18n infrastructure.

## User Story

As a farm manager
I want my preference settings to actually affect how the application behaves
So that the app adapts to my workflow and preferences without manual configuration each time

## Problem Statement

While the settings UI and database schema are complete, several settings don't yet affect application behavior:

- Default farm selection doesn't auto-select on app load
- Theme setting doesn't apply dark/light mode
- Low stock threshold is per-item, not using global percentage
- Dashboard cards are always visible regardless of user preference
- Language setting exists but has no i18n infrastructure

## Solution Statement

Wire up each setting to its respective system:

1. FarmProvider reads defaultFarmId and auto-selects on mount
2. ThemeProvider reads theme setting and applies CSS classes
3. Inventory uses lowStockThresholdPercent as multiplier on item thresholds
4. Dashboard conditionally renders cards based on dashboardCards setting
5. Language setting stored (translations deferred to future)

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: FarmProvider, ThemeProvider, Inventory, Dashboard
**Dependencies**: None (all internal)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

**Farm Context:**

- `app/features/farms/context.tsx` (lines 1-100) - FarmProvider implementation, selectedFarmId state
- `app/features/settings/hooks.ts` (lines 200-210) - usePreferences hook with defaultFarmId

**Theme System:**

- `app/components/theme-toggle.tsx` (lines 1-50) - Current theme toggle using localStorage
- `app/features/settings/hooks.ts` (lines 200-210) - usePreferences hook with theme

**Inventory:**

- `app/routes/_auth/inventory/index.tsx` (lines 375-385) - lowStockFeedCount calculation
- `app/features/settings/hooks.ts` (lines 215-225) - useAlertThresholds hook

**Dashboard:**

- `app/routes/_auth/dashboard/index.tsx` (lines 1-500) - Dashboard with summary cards
- `app/features/settings/hooks.ts` (lines 240-250) - useDashboardPreferences hook

**Settings Context:**

- `app/features/settings/context.tsx` - SettingsProvider that wraps app
- `app/features/settings/server.ts` - getUserSettings server function

### New Files to Create

None - all changes are updates to existing files

### Relevant Documentation

- [React Context API](https://react.dev/reference/react/useContext)
    - Why: FarmProvider and ThemeProvider use context
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
    - Why: Settings are loaded via useQuery in SettingsProvider

### Patterns to Follow

**Context Provider Pattern:**

```typescript
// From app/features/farms/context.tsx
export function FarmProvider({ children }: { children: ReactNode }) {
    const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
    // ... provider logic
}
```

**Settings Hook Pattern:**

```typescript
// From app/features/settings/hooks.ts
export function usePreferences() {
    const settings = useSettingsValue()
    return {
        defaultFarmId: settings.defaultFarmId,
        language: settings.language,
        theme: settings.theme,
    }
}
```

**Conditional Rendering Pattern:**

```typescript
// From app/routes/_auth/dashboard/index.tsx
{summary && (
  <Card>
    {/* Card content */}
  </Card>
)}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Auto-select Default Farm)

Wire up FarmProvider to use defaultFarmId from settings when no farm is selected.

**Tasks:**

- Read defaultFarmId from settings context
- Auto-select on mount if no farm selected
- Validate farm exists and user has access

### Phase 2: Theme System

Implement theme switching based on user preference.

**Tasks:**

- Create ThemeProvider that reads from settings
- Apply theme class to document root
- Handle system theme detection
- Update theme-toggle to use settings instead of localStorage

### Phase 3: Inventory Alerts

Apply lowStockThresholdPercent to inventory calculations.

**Tasks:**

- Read lowStockThresholdPercent from settings
- Calculate dynamic threshold as percentage of minThreshold
- Update lowStockFeedCount and lowStockMedCount calculations

### Phase 4: Dashboard Customization

Filter dashboard cards based on user preferences.

**Tasks:**

- Read dashboardCards from settings
- Conditionally render each card type
- Maintain responsive grid layout

### Phase 5: Language Infrastructure

Ensure language setting is stored (translations deferred).

**Tasks:**

- Verify language setting persists correctly
- Add comment for future i18n integration
- Document translation approach

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE app/features/farms/context.tsx

- **IMPLEMENT**: Auto-select defaultFarmId on mount if no farm selected
- **PATTERN**: useEffect with dependency array (existing pattern in file)
- **IMPORTS**: `import { usePreferences } from '~/features/settings'`
- **LOGIC**:

    ```typescript
    const { defaultFarmId } = usePreferences()

    useEffect(() => {
        if (!selectedFarmId && defaultFarmId && farms.length > 0) {
            const farmExists = farms.some((f) => f.id === defaultFarmId)
            if (farmExists) {
                setSelectedFarmId(defaultFarmId)
            }
        }
    }, [defaultFarmId, farms, selectedFarmId])
    ```

- **GOTCHA**: Only auto-select if farm exists in user's accessible farms
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE app/features/theme/provider.tsx

- **IMPLEMENT**: ThemeProvider that reads from settings and applies theme
- **PATTERN**: Context provider pattern from farms/context.tsx
- **IMPORTS**:
    ```typescript
    import { createContext, useContext, useEffect } from 'react'
    import { usePreferences } from '~/features/settings'
    ```
- **LOGIC**:

    ```typescript
    export function ThemeProvider({ children }: { children: ReactNode }) {
      const { theme } = usePreferences()

      useEffect(() => {
        const root = document.documentElement
        root.classList.remove('light', 'dark')

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.add(systemTheme)
        } else {
          root.classList.add(theme)
        }
      }, [theme])

      return <>{children}</>
    }
    ```

- **VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE app/routes/\_\_root.tsx

- **IMPLEMENT**: Wrap app with ThemeProvider
- **PATTERN**: Existing provider wrapping pattern in file
- **IMPORTS**: `import { ThemeProvider } from '~/features/theme/provider'`
- **LOCATION**: Add inside SettingsProvider, before other providers
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE app/components/theme-toggle.tsx

- **IMPLEMENT**: Use settings context instead of localStorage
- **PATTERN**: useSettings hook pattern
- **IMPORTS**: `import { useSettings } from '~/features/settings'`
- **REFACTOR**: Replace localStorage calls with `updateSettings({ theme: newTheme })`
- **GOTCHA**: Remove localStorage.getItem/setItem calls
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

### Task 5: UPDATE app/routes/\_auth/inventory/index.tsx

- **IMPLEMENT**: Use lowStockThresholdPercent in calculations
- **PATTERN**: Existing isLowStock function (line 364)
- **IMPORTS**: `import { useAlertThresholds } from '~/features/settings'`
- **LOGIC**:

    ```typescript
    const { lowStockPercent } = useAlertThresholds()

    const lowStockFeedCount = feedInventory.filter((f) => {
        const qty = parseFloat(f.quantityKg)
        const threshold = parseFloat(f.minThresholdKg) * (lowStockPercent / 100)
        return qty <= threshold
    }).length
    ```

- **VALIDATE**: `npx tsc --noEmit`

### Task 6: UPDATE app/routes/\_auth/dashboard/index.tsx

- **IMPLEMENT**: Conditionally render cards based on dashboardCards setting
- **PATTERN**: Existing conditional rendering with `summary &&`
- **IMPORTS**: `import { useDashboardPreferences } from '~/features/settings'`
- **LOGIC**:

    ```typescript
    const { cards } = useDashboardPreferences()

    // Wrap each card section:
    {cards.inventory && summary && (
      <Card>...</Card>
    )}
    ```

- **CARDS TO WRAP**: inventory, revenue, expenses, profit, mortality, feed
- **VALIDATE**: `npx tsc --noEmit`

### Task 7: ADD app/features/theme/index.ts

- **IMPLEMENT**: Export ThemeProvider
- **CONTENT**:
    ```typescript
    export { ThemeProvider } from './provider'
    ```
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: VERIFY language setting persistence

- **IMPLEMENT**: Add comment in settings UI about future i18n
- **LOCATION**: app/routes/\_auth/settings/index.tsx (Preferences tab)
- **COMMENT**: Already exists - "Interface language (translations coming soon)"
- **VALIDATE**: Visual inspection

---

## TESTING STRATEGY

### Unit Tests

Not required for this wiring work - these are integration-level changes.

### Integration Tests

Manual testing required for each setting:

1. **Default Farm**: Change in settings → reload app → farm auto-selected
2. **Theme**: Change theme → UI updates immediately
3. **Low Stock**: Adjust threshold → inventory alerts update
4. **Dashboard Cards**: Toggle cards → dashboard shows/hides sections
5. **Language**: Change language → setting persists (no UI change yet)

### Edge Cases

- Default farm doesn't exist → no auto-select, no error
- Theme is 'system' → respects OS preference
- Low stock threshold is 100% → all items show as low stock
- All dashboard cards disabled → empty dashboard (graceful)
- Language changes → no errors, ready for future i18n

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions.

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
bun run lint
```

### Level 2: Build

```bash
bun run build
```

### Level 3: Manual Validation

**Default Farm:**

1. Set default farm in settings
2. Reload app
3. Verify farm is auto-selected

**Theme:**

1. Change theme to dark
2. Verify UI switches to dark mode
3. Change to system
4. Verify follows OS preference

**Low Stock:**

1. Set threshold to 50%
2. Check inventory page
3. Verify alerts trigger at 50% of item threshold

**Dashboard:**

1. Disable "Revenue" card in settings
2. Go to dashboard
3. Verify revenue card is hidden

**Language:**

1. Change language to Hausa
2. Reload app
3. Verify setting persists (check settings page)

---

## ACCEPTANCE CRITERIA

- [x] Default farm auto-selects on app load if set in preferences
- [x] Theme setting applies light/dark/system mode correctly
- [x] Low stock alerts use custom percentage threshold
- [x] Dashboard cards show/hide based on user preferences
- [x] Language setting persists (ready for future i18n)
- [x] All validation commands pass with zero errors
- [x] No regressions in existing functionality
- [x] Settings changes take effect immediately (no reload required where possible)

---

## COMPLETION CHECKLIST

- [ ] Task 1: FarmProvider auto-selects default farm
- [ ] Task 2: ThemeProvider created
- [ ] Task 3: ThemeProvider wired into app
- [ ] Task 4: theme-toggle uses settings
- [ ] Task 5: Inventory uses lowStockThresholdPercent
- [ ] Task 6: Dashboard cards conditionally render
- [ ] Task 7: Theme module exports added
- [ ] Task 8: Language persistence verified
- [ ] All validation commands pass
- [ ] Manual testing confirms all features work
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## NOTES

**Design Decisions:**

1. **Default Farm**: Only auto-selects if farm exists and user has access - prevents errors
2. **Theme**: Applied at document root level for global CSS cascade
3. **Low Stock**: Uses percentage multiplier on existing per-item thresholds - best of both worlds
4. **Dashboard**: Cards maintain grid layout even when some are hidden
5. **Language**: Setting stored but no translations yet - infrastructure ready for future

**Trade-offs:**

- Theme requires full page context (document.documentElement) - acceptable for global setting
- Low stock calculation runs on every render - acceptable given small dataset
- Dashboard conditional rendering adds complexity - worth it for customization

**Future Enhancements:**

- Add default farm selector dropdown in settings UI
- Implement full i18n with translation files
- Add dashboard card reordering (drag-and-drop)
- Add per-module alert thresholds (different for poultry vs fish)
