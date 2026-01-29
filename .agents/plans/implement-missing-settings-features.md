# Feature: Missing Settings Features Implementation

## Feature Description

Implement 4 major features that enable the remaining unwired user settings:

1. **Internationalization (i18n)** - Multi-language support for 7 languages
2. **In-App Notifications** - Real-time alerts for low stock, mortality, invoices, harvest
3. **Fiscal Year Reports** - Annual financial reports respecting fiscal year boundaries
4. **Dashboard Customization** - User-configurable dashboard cards

These features unlock 5 existing settings that are currently unused:

- `language` (en, ha, yo, ig, fr, pt, sw)
- `notifications` (lowStock, highMortality, invoiceDue, batchHarvest)
- `fiscalYearStartMonth` (1-12)
- `dashboardCards` (inventory, revenue, expenses, profit, mortality, feed)
- `lowStockThresholdPercent` (currently inventory uses per-item thresholds)

## User Stories

### Story 1: Multilingual Support

As a Nigerian farmer who speaks Hausa
I want to use the app in my native language
So that I can understand all features without language barriers

### Story 2: Proactive Notifications

As a farm manager
I want to receive alerts for critical events (low stock, high mortality)
So that I can take immediate action before problems escalate

### Story 3: Fiscal Year Reporting

As a farm accountant
I want financial reports aligned with our fiscal year (April-March)
So that I can accurately track annual performance for tax purposes

### Story 4: Personalized Dashboard

As a farm owner focused on financials
I want to hide livestock cards and show only revenue/expenses/profit
So that I can focus on the metrics that matter to me

## Problem Statement

The application has 10 user settings implemented in the database, but 5 are unused because the underlying features don't exist:

- Language setting exists but no translations
- Notification preferences exist but no notification system
- Fiscal year setting exists but reports use calendar year
- Dashboard card preferences exist but all cards always show
- Low stock threshold exists but inventory uses per-item thresholds

This creates a poor UX where users can configure settings that have no effect.

## Solution Statement

Implement the 4 missing features in order of ROI:

1. **Notifications** (High ROI) - Leverage existing alert system, add UI layer
2. **Dashboard Customization** (Medium ROI) - Simple show/hide logic
3. **Fiscal Year Reports** (Medium ROI) - Modify date range calculations
4. **i18n** (Low ROI initially) - Start with English, add translations incrementally

## Feature Metadata

**Feature Type**: New Capability (4 features)
**Estimated Complexity**: High (each feature is Medium complexity)
**Primary Systems Affected**:

- Monitoring/Alerts (notifications)
- Dashboard (customization)
- Reports (fiscal year)
- Entire UI (i18n)

**Dependencies**:

- `sonner` (already installed) - Toast notifications
- `react-i18next` or `next-intl` - i18n library (TBD)
- Existing alert system in `app/features/monitoring/alerts.ts`

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

**Existing Alert System:**

- `app/features/monitoring/alerts.ts` (lines 1-200) - Alert generation logic, types, thresholds
  - Why: Foundation for notification system, already checks mortality/water quality
  - Pattern: Returns `BatchAlert[]` with type, source, message

**Settings Infrastructure:**

- `app/features/settings/hooks.ts` (lines 233-280) - Settings hooks pattern
  - Why: Shows how to create domain-specific hooks (useAlertThresholds, useDashboardPreferences)
- `app/features/settings/context.tsx` (lines 1-100) - Settings context and provider
  - Why: Pattern for accessing user settings throughout app

**Dashboard Structure:**

- `app/routes/_auth/dashboard/index.tsx` (lines 350-520) - Dashboard cards layout
  - Why: Shows 4 top cards (revenue, expenses, profit, batches) that need conditional rendering
  - Pattern: Card components with stats display

**Reports:**

- `app/routes/_auth/reports/index.tsx` (lines 1-300) - Current reporting UI
  - Why: Date range selection that needs fiscal year awareness
- `app/features/reports/server.ts` (lines 1-200) - Report data aggregation
  - Why: Server functions that calculate financial metrics

**Toast Notifications:**

- `app/routes/__root.tsx` (line 89) - Sonner Toaster already mounted
  - Why: Toast infrastructure exists, just need to trigger notifications
- Multiple files using `toast.success()` - Pattern for showing toasts

### New Files to Create

**Notifications:**

- `app/features/notifications/types.ts` - Notification interfaces
- `app/features/notifications/server.ts` - Notification persistence and retrieval
- `app/features/notifications/context.tsx` - Notification state management
- `app/features/notifications/hooks.ts` - useNotifications hook
- `app/components/notifications/bell-icon.tsx` - Notification bell with badge
- `app/components/notifications/notification-list.tsx` - Dropdown notification list
- `tests/features/notifications/notifications.test.ts` - Unit tests

**i18n:**

- `app/features/i18n/config.ts` - i18n configuration
- `app/features/i18n/provider.tsx` - i18n provider component
- `app/features/i18n/hooks.ts` - useTranslation hook
- `public/locales/en/common.json` - English translations
- `public/locales/ha/common.json` - Hausa translations (start with key pages)

**Dashboard Customization:**

- No new files needed - modify existing dashboard

**Fiscal Year:**

- `app/features/reports/fiscal-year.ts` - Fiscal year date utilities

### Relevant Documentation - READ BEFORE IMPLEMENTING!

**Sonner (Toast Notifications):**

- [Sonner Docs](https://sonner.emilkowal.ski/)
  - Already installed and mounted in \_\_root.tsx
  - Why: Shows toast.success/error/info patterns

**react-i18next:**

- [react-i18next Quick Start](https://react.i18next.com/latest/using-with-hooks)
  - Specific section: useTranslation hook
  - Why: Standard i18n solution for React apps
- [i18next Configuration](https://www.i18next.com/overview/configuration-options)
  - Specific section: Language detection
  - Why: Auto-detect user language from settings

**TanStack Query (for notifications):**

- [Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
  - Already used throughout app
  - Why: Pattern for fetching notifications with auto-refresh

### Patterns to Follow

**Settings Hook Pattern:**

```typescript
// From app/features/settings/hooks.ts
export function useDashboardPreferences() {
  const settings = useSettingsValue()
  return {
    cards: settings.dashboardCards,
  }
}
```

**Toast Notification Pattern:**

```typescript
// From multiple files
import { toast } from 'sonner'

toast.success('Batch created')
toast.error('Failed to save')
toast.info('Low stock alert')
```

**Server Function Pattern:**

```typescript
// From app/features/batches/server.ts
export const getBatchesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { farmId?: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    const { db } = await import('~/lib/db')
    // ... query logic
  })
```

**Conditional Rendering Pattern:**

```typescript
// From app/routes/_auth/dashboard/index.tsx
{enabledModules.length > 0 && (
  <div className="grid gap-3">
    {enabledModules.map((moduleKey) => (
      <Card key={moduleKey}>...</Card>
    ))}
  </div>
)}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Notifications System (Highest ROI)

Build on existing alert system to create user-facing notifications.

**Tasks:**

- Create notification data model and database table
- Build notification context and hooks
- Create notification bell UI component
- Wire up alert system to create notifications
- Add notification preferences filtering

### Phase 2: Dashboard Customization (Quick Win)

Simple conditional rendering based on user preferences.

**Tasks:**

- Add useDashboardPreferences hook usage
- Wrap each card section in conditional render
- Add "Customize Dashboard" button in settings
- Test all card combinations

### Phase 3: Fiscal Year Reports (Medium Effort)

Modify date calculations to respect fiscal year boundaries.

**Tasks:**

- Create fiscal year utility functions
- Update report server functions to use fiscal dates
- Add fiscal year selector to reports UI
- Update financial calculations

### Phase 4: Internationalization (Long-term)

Start with infrastructure, add translations incrementally.

**Tasks:**

- Set up i18n library and configuration
- Create translation files for English (baseline)
- Wrap app in i18n provider
- Add useTranslation to key pages
- Add language switcher to settings

---

## DETAILED TASK BREAKDOWN

### FEATURE 1: IN-APP NOTIFICATIONS

#### Task 1.1: CREATE notification database schema

- **IMPLEMENT**: Add `notifications` table to migration
- **PATTERN**: Mirror `audit_logs` table structure (app/lib/db/migrations/2025-01-08-001-initial-schema.ts:500-520)
- **SCHEMA**:
  ```typescript
  .createTable('notifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('farmId', 'uuid', (col) => col.references('farms.id').onDelete('cascade'))
    .addColumn('type', 'varchar(50)', (col) => col.notNull()) // 'lowStock', 'highMortality', 'invoiceDue', 'batchHarvest'
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('message', 'text', (col) => col.notNull())
    .addColumn('read', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('actionUrl', 'text')
    .addColumn('metadata', 'jsonb')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
  ```
- **VALIDATE**: `bun run db:migrate && bun -e "import { db } from './app/lib/db'; console.log(await db.selectFrom('notifications').selectAll().execute())"`

#### Task 1.2: CREATE notification types and interfaces

- **FILE**: `app/features/notifications/types.ts`
- **IMPLEMENT**:

  ```typescript
  export type NotificationType =
    | 'lowStock'
    | 'highMortality'
    | 'invoiceDue'
    | 'batchHarvest'

  export interface Notification {
    id: string
    userId: string
    farmId: string | null
    type: NotificationType
    title: string
    message: string
    read: boolean
    actionUrl: string | null
    metadata: Record<string, any> | null
    createdAt: Date
  }
  ```

- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.3: CREATE notification server functions

- **FILE**: `app/features/notifications/server.ts`
- **PATTERN**: Mirror `app/features/batches/server.ts` server function structure
- **IMPLEMENT**:
  - `createNotification(userId, data)` - Insert notification
  - `getNotifications(userId, { unreadOnly?, limit? })` - Fetch user notifications
  - `markAsRead(notificationId)` - Mark notification read
  - `markAllAsRead(userId)` - Mark all read
  - `deleteNotification(notificationId)` - Delete notification
- **IMPORTS**: `createServerFn`, `requireAuth`, dynamic `db` import
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.4: CREATE notification context and hooks

- **FILE**: `app/features/notifications/context.tsx`
- **PATTERN**: Mirror `app/features/settings/context.tsx` (lines 1-100)
- **IMPLEMENT**:
  - NotificationProvider with TanStack Query
  - useNotifications hook returning { notifications, unreadCount, markAsRead, markAllAsRead, refetch }
  - Auto-refetch every 30 seconds
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.5: CREATE notification bell component

- **FILE**: `app/components/notifications/bell-icon.tsx`
- **PATTERN**: Similar to theme-toggle.tsx button structure
- **IMPLEMENT**:
  - Bell icon with badge showing unread count
  - Dropdown with notification list (max 10 recent)
  - "Mark all as read" button
  - Link to each notification's actionUrl
- **IMPORTS**: `Bell` from lucide-react, `useNotifications`
- **VALIDATE**: Visual inspection in browser

#### Task 1.6: UPDATE navigation to include notification bell

- **FILE**: `app/components/navigation.tsx`
- **IMPLEMENT**: Add `<BellIcon />` next to theme toggle in header
- **PATTERN**: Same placement as theme-toggle
- **VALIDATE**: Visual inspection in browser

#### Task 1.7: WIRE alerts to create notifications

- **FILE**: `app/features/monitoring/alerts.ts`
- **UPDATE**: `getAllBatchAlerts` function to create notifications
- **IMPLEMENT**:

  ```typescript
  // After generating alerts
  const { notifications: notifPrefs } = await getUserSettings(userId)

  for (const alert of alerts) {
    if (alert.source === 'mortality' && notifPrefs.highMortality) {
      await createNotification(userId, {
        type: 'highMortality',
        title: 'High Mortality Alert',
        message: alert.message,
        farmId: batch.farmId,
        actionUrl: `/batches/${alert.batchId}`,
      })
    }
  }
  ```

- **VALIDATE**: Create mortality record, check notifications table

#### Task 1.8: WIRE inventory to create low stock notifications

- **FILE**: `app/features/inventory/server.ts` (if exists) or create it
- **IMPLEMENT**: Check feed/medication inventory against thresholds, create notifications
- **PATTERN**: Similar to alerts.ts pattern
- **VALIDATE**: Set feed below threshold, check notifications

#### Task 1.9: CREATE notification tests

- **FILE**: `tests/features/notifications/notifications.test.ts`
- **IMPLEMENT**: Test notification CRUD, filtering, preferences
- **VALIDATE**: `bun test notifications`

---

### FEATURE 2: DASHBOARD CUSTOMIZATION

#### Task 2.1: UPDATE dashboard to use preferences

- **FILE**: `app/routes/_auth/dashboard/index.tsx`
- **ADD**: `const { cards } = useDashboardPreferences()` at top of component
- **IMPORTS**: `import { useDashboardPreferences } from '~/features/settings'`
- **VALIDATE**: `npx tsc --noEmit`

#### Task 2.2: WRAP revenue card in conditional

- **FILE**: `app/routes/_auth/dashboard/index.tsx` (around line 380)
- **PATTERN**:
  ```typescript
  {cards.revenue && (
    <Card>
      <CardContent className="p-3 shadow-none">
        {/* Revenue card content */}
      </CardContent>
    </Card>
  )}
  ```
- **VALIDATE**: Toggle revenue in settings, verify card hides

#### Task 2.3: WRAP expenses card in conditional

- **FILE**: `app/routes/_auth/dashboard/index.tsx` (around line 420)
- **PATTERN**: Same as Task 2.2 with `cards.expenses`
- **VALIDATE**: Toggle expenses in settings, verify card hides

#### Task 2.4: WRAP profit card in conditional

- **FILE**: `app/routes/_auth/dashboard/index.tsx` (around line 460)
- **PATTERN**: Same as Task 2.2 with `cards.profit`
- **VALIDATE**: Toggle profit in settings, verify card hides

#### Task 2.5: WRAP inventory section in conditional

- **FILE**: `app/routes/_auth/dashboard/index.tsx` (around line 520)
- **PATTERN**: Wrap entire inventory grid with `cards.inventory`
- **VALIDATE**: Toggle inventory in settings, verify section hides

#### Task 2.6: ADD mortality and feed cards (if not exist)

- **FILE**: `app/routes/_auth/dashboard/index.tsx`
- **IMPLEMENT**: Create mortality and feed summary cards if they don't exist
- **PATTERN**: Mirror existing card structure
- **VALIDATE**: Visual inspection

#### Task 2.7: WRAP mortality/feed cards in conditionals

- **PATTERN**: `cards.mortality` and `cards.feed`
- **VALIDATE**: Toggle in settings, verify cards hide

#### Task 2.8: ADD empty state when all cards hidden

- **FILE**: `app/routes/_auth/dashboard/index.tsx`
- **IMPLEMENT**:
  ```typescript
  {!Object.values(cards).some(Boolean) && (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-muted-foreground">
          All dashboard cards are hidden.
          <Link to="/settings" className="text-primary">Customize dashboard</Link>
        </p>
      </CardContent>
    </Card>
  )}
  ```
- **VALIDATE**: Hide all cards, verify empty state shows

---

### FEATURE 3: FISCAL YEAR REPORTS

#### Task 3.1: CREATE fiscal year utilities

- **FILE**: `app/features/reports/fiscal-year.ts`
- **IMPLEMENT**:

  ```typescript
  export function getFiscalYearStart(
    fiscalStartMonth: number,
    date: Date = new Date(),
  ): Date {
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if (month < fiscalStartMonth) {
      return new Date(year - 1, fiscalStartMonth - 1, 1)
    }
    return new Date(year, fiscalStartMonth - 1, 1)
  }

  export function getFiscalYearEnd(
    fiscalStartMonth: number,
    date: Date = new Date(),
  ): Date {
    const start = getFiscalYearStart(fiscalStartMonth, date)
    return new Date(start.getFullYear() + 1, start.getMonth(), 0)
  }

  export function getFiscalYearLabel(
    fiscalStartMonth: number,
    date: Date = new Date(),
  ): string {
    const start = getFiscalYearStart(fiscalStartMonth, date)
    const end = getFiscalYearEnd(fiscalStartMonth, date)
    return `FY ${start.getFullYear()}-${end.getFullYear()}`
  }
  ```

- **VALIDATE**: `bun test fiscal-year`

#### Task 3.2: UPDATE reports server to use fiscal year

- **FILE**: `app/features/reports/server.ts`
- **UPDATE**: Date range calculations to use fiscal year functions
- **IMPLEMENT**: Accept `useFiscalYear: boolean` parameter
- **PATTERN**:
  ```typescript
  const { fiscalYearStartMonth } = await getUserSettings(userId)
  const startDate = useFiscalYear
    ? getFiscalYearStart(fiscalYearStartMonth)
    : new Date(year, 0, 1)
  ```
- **VALIDATE**: `npx tsc --noEmit`

#### Task 3.3: ADD fiscal year toggle to reports UI

- **FILE**: `app/routes/_auth/reports/index.tsx`
- **IMPLEMENT**: Checkbox "Use Fiscal Year" that switches date ranges
- **PATTERN**: Use Switch component from ui/switch.tsx
- **VALIDATE**: Toggle switch, verify date ranges change

#### Task 3.4: CREATE fiscal year tests

- **FILE**: `tests/features/reports/fiscal-year.test.ts`
- **IMPLEMENT**: Test fiscal year calculations for all 12 start months
- **VALIDATE**: `bun test fiscal-year`

---

### FEATURE 4: INTERNATIONALIZATION (i18n)

#### Task 4.1: INSTALL i18n dependencies

- **COMMAND**: `bun add react-i18next i18next`
- **VALIDATE**: Check package.json

#### Task 4.2: CREATE i18n configuration

- **FILE**: `app/features/i18n/config.ts`
- **IMPLEMENT**:

  ```typescript
  import i18n from 'i18next'
  import { initReactI18next } from 'react-i18next'

  i18n.use(initReactI18next).init({
    resources: {
      en: { common: require('../../../public/locales/en/common.json') },
      ha: { common: require('../../../public/locales/ha/common.json') },
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

  export default i18n
  ```

- **VALIDATE**: `npx tsc --noEmit`

#### Task 4.3: CREATE English translation file

- **FILE**: `public/locales/en/common.json`
- **IMPLEMENT**: Start with dashboard and navigation strings
  ```json
  {
    "nav": {
      "dashboard": "Dashboard",
      "batches": "Batches",
      "inventory": "Inventory",
      "sales": "Sales",
      "expenses": "Expenses"
    },
    "dashboard": {
      "title": "Dashboard",
      "revenue": "Revenue",
      "expenses": "Expenses",
      "profit": "Profit"
    }
  }
  ```
- **VALIDATE**: JSON syntax check

#### Task 4.4: CREATE Hausa translation file (partial)

- **FILE**: `public/locales/ha/common.json`
- **IMPLEMENT**: Translate key strings to Hausa
- **GOTCHA**: Get translations from native speaker or translation service
- **VALIDATE**: JSON syntax check

#### Task 4.5: CREATE i18n provider

- **FILE**: `app/features/i18n/provider.tsx`
- **IMPLEMENT**:

  ```typescript
  import { I18nextProvider } from 'react-i18next'
  import i18n from './config'
  import { usePreferences } from '~/features/settings'

  export function I18nProvider({ children }: { children: ReactNode }) {
    const { language } = usePreferences()

    useEffect(() => {
      i18n.changeLanguage(language)
    }, [language])

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  }
  ```

- **VALIDATE**: `npx tsc --noEmit`

#### Task 4.6: WRAP app in i18n provider

- **FILE**: `app/routes/__root.tsx`
- **ADD**: Wrap app content in `<I18nProvider>`
- **PATTERN**: Same level as SettingsProvider
- **VALIDATE**: `npx tsc --noEmit`

#### Task 4.7: UPDATE navigation to use translations

- **FILE**: `app/components/navigation.tsx`
- **ADD**: `const { t } = useTranslation('common')`
- **UPDATE**: Replace hardcoded strings with `t('nav.dashboard')`, etc.
- **VALIDATE**: Change language in settings, verify navigation updates

#### Task 4.8: UPDATE dashboard to use translations

- **FILE**: `app/routes/_auth/dashboard/index.tsx`
- **ADD**: `const { t } = useTranslation('common')`
- **UPDATE**: Replace hardcoded strings with translation keys
- **VALIDATE**: Change language, verify dashboard updates

---

## TESTING STRATEGY

### Unit Tests

**Notifications:**

- Test notification CRUD operations
- Test notification filtering by type
- Test preference-based filtering
- Test mark as read functionality

**Fiscal Year:**

- Test fiscal year calculations for all 12 start months
- Test edge cases (leap years, month boundaries)
- Test fiscal year label generation

**Dashboard:**

- Test card visibility based on preferences
- Test empty state when all cards hidden

**i18n:**

- Test language switching
- Test fallback to English
- Test translation key resolution

### Integration Tests

**Notifications:**

- Create mortality record → notification created
- Set feed below threshold → notification created
- Mark notification as read → unread count decreases

**Dashboard:**

- Toggle card preferences → cards show/hide
- Hide all cards → empty state shows

**Fiscal Year:**

- Generate report with fiscal year → correct date range
- Switch fiscal year start month → date range updates

**i18n:**

- Change language setting → UI updates
- Missing translation → falls back to English

### Edge Cases

- User has no notifications → bell shows 0
- User has 100+ notifications → pagination works
- Fiscal year spans calendar year boundary
- Translation key missing → shows key instead of crashing
- All dashboard cards hidden → empty state shows
- Notification preferences all disabled → no notifications created

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
bun run lint
```

### Level 2: Unit Tests

```bash
bun test notifications
bun test fiscal-year
bun test dashboard
bun test i18n
```

### Level 3: Integration Tests

```bash
bun test --grep "notifications integration"
bun test --grep "dashboard integration"
```

### Level 4: Manual Validation

**Notifications:**

1. Create mortality record with high rate
2. Check notification bell shows badge
3. Click bell, verify notification appears
4. Click notification, verify navigates to batch
5. Mark as read, verify badge count decreases

**Dashboard:**

1. Go to Settings → Dashboard
2. Toggle revenue card off
3. Go to dashboard, verify revenue card hidden
4. Toggle all cards off
5. Verify empty state shows with link to settings

**Fiscal Year:**

1. Go to Settings → Business
2. Set fiscal year start to April (month 4)
3. Go to Reports
4. Toggle "Use Fiscal Year"
5. Verify date range shows April-March

**i18n:**

1. Go to Settings → Preferences
2. Change language to Hausa
3. Verify navigation updates to Hausa
4. Verify dashboard labels update
5. Change back to English, verify updates

---

## ACCEPTANCE CRITERIA

- [ ] Notifications system creates alerts for low stock, high mortality, invoice due, batch harvest
- [ ] Notification bell shows unread count badge
- [ ] Clicking notification navigates to relevant page
- [ ] Notification preferences filter which alerts are shown
- [ ] Dashboard cards show/hide based on user preferences
- [ ] Empty state shows when all dashboard cards hidden
- [ ] Fiscal year reports calculate correct date ranges for all 12 start months
- [ ] Fiscal year toggle switches between calendar and fiscal year
- [ ] i18n system loads and switches between languages
- [ ] Navigation and dashboard translate to selected language
- [ ] All validation commands pass with zero errors
- [ ] Unit test coverage ≥80% for new code
- [ ] Integration tests verify end-to-end workflows
- [ ] No regressions in existing functionality

---

## COMPLETION CHECKLIST

- [ ] All 4 features implemented (notifications, dashboard, fiscal year, i18n)
- [ ] All 5 settings now functional (language, notifications, fiscalYearStartMonth, dashboardCards, lowStockThresholdPercent)
- [ ] Database migration created and run successfully
- [ ] All server functions created with proper auth
- [ ] All UI components created and wired
- [ ] All validation commands pass
- [ ] Full test suite passes (unit + integration)
- [ ] Manual testing confirms all features work
- [ ] No TypeScript or ESLint errors
- [ ] Acceptance criteria all met

---

## NOTES

### Implementation Order Rationale

1. **Notifications first** - Highest ROI, builds on existing alert system
2. **Dashboard second** - Quick win, simple conditional rendering
3. **Fiscal year third** - Medium effort, clear business value
4. **i18n last** - Long-term investment, start with infrastructure

### Design Decisions

**Notifications:**

- Store in database (not just in-memory) for persistence across sessions
- Auto-refetch every 30 seconds for near-real-time updates
- Limit to 10 most recent in dropdown, link to full list page (future)

**Dashboard:**

- Default to all cards visible (current behavior)
- Empty state prevents confusion when all hidden
- Settings UI already exists, just wire up the logic

**Fiscal Year:**

- Support all 12 possible start months
- Toggle between calendar and fiscal year (don't force fiscal year)
- Label format: "FY 2024-2025" for clarity

**i18n:**

- Start with English baseline (extract all strings)
- Add Hausa next (largest non-English user base in Nigeria)
- Incremental translation (start with navigation/dashboard, expand later)
- Use namespaces (common, dashboard, batches) for organization

### Trade-offs

**Notifications:**

- Polling every 30s vs WebSockets: Polling is simpler, works with Cloudflare Workers
- Database storage vs in-memory: Database for persistence, but adds DB load

**Dashboard:**

- Per-card preferences vs layout templates: Per-card is more flexible
- Show/hide vs drag-and-drop: Show/hide is simpler, sufficient for MVP

**Fiscal Year:**

- Global setting vs per-report: Global is simpler, matches accounting practices
- Calendar year default: Most users expect calendar year, fiscal is opt-in

**i18n:**

- react-i18next vs next-intl: react-i18next is more mature, better docs
- JSON files vs database: JSON is simpler, easier for translators
- Full translation vs incremental: Incremental allows faster launch

### Performance Considerations

- Notification polling: 30s interval balances freshness vs server load
- Dashboard: Conditional rendering has zero performance impact
- Fiscal year: Date calculations are fast, no performance concern
- i18n: Translation files loaded on demand, minimal bundle impact

### Security Considerations

- Notifications: User can only see their own notifications (userId filter)
- Dashboard: Preferences are per-user, no cross-user data leakage
- Fiscal year: No security implications
- i18n: No user-generated content in translations, XSS not a concern

---

## ESTIMATED EFFORT

| Feature                 | Complexity | Estimated Time            |
| ----------------------- | ---------- | ------------------------- |
| Notifications           | Medium     | 4-6 hours                 |
| Dashboard Customization | Low        | 1-2 hours                 |
| Fiscal Year Reports     | Medium     | 2-3 hours                 |
| i18n Infrastructure     | Medium     | 3-4 hours                 |
| i18n Translations       | High       | 8-12 hours (per language) |
| Testing                 | Medium     | 3-4 hours                 |
| **Total**               | **High**   | **21-31 hours**           |

**Recommendation:** Implement in 4 sprints:

- Sprint 1: Notifications (1 day)
- Sprint 2: Dashboard + Fiscal Year (1 day)
- Sprint 3: i18n Infrastructure (1 day)
- Sprint 4: Translations + Testing (2-3 days)

---

## CONFIDENCE SCORE

**8/10** for one-pass implementation success

**Reasons for confidence:**

- Clear patterns exist in codebase to follow
- Infrastructure already in place (Sonner, TanStack Query, settings system)
- Well-defined acceptance criteria
- Comprehensive validation commands

**Risks:**

- i18n translations require native speakers (not a coding risk)
- Notification polling might need tuning for performance
- Dashboard empty state UX might need iteration

**Mitigation:**

- Start with English-only i18n, add translations incrementally
- Monitor notification query performance, adjust polling interval if needed
- Get user feedback on dashboard customization UX
