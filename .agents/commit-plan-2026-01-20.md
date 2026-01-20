# Commit Plan - Day 20 (January 20, 2026)

## Summary

- 4 commits planned
- 75 files changed (updated count)
- Major refactoring: Centralized error handling system implementation

## Commits

### Commit 1: feat(errors): implement centralized error handling system

**Files**:

- app/lib/errors/ (new directory)
- app/hooks/useErrorMessage.ts (new)
- app/features/settings/currency-core.ts (new)

**Message**:

```
feat(errors): implement centralized error handling system

- Add AppError class with typed error codes and metadata
- Add ErrorMap with 50+ standardized error definitions
- Add useErrorMessage hook for client-side error handling
- Add currency core utilities for error-safe operations

Provides type-safe, i18n-ready error handling across the stack
```

### Commit 2: refactor(server): migrate all server functions to AppError

**Files**:

- app/features/auth/server-middleware.ts
- app/features/auth/server.ts
- app/features/batches/server.ts
- app/features/customers/server.ts
- app/features/dashboard/server.ts
- app/features/eggs/server.ts
- app/features/expenses/server.ts
- app/features/export/server.ts
- app/features/farms/server.ts
- app/features/feed/server.ts
- app/features/integrations/server.ts
- app/features/inventory/feed-server.ts
- app/features/inventory/medication-server.ts
- app/features/invoices/server.ts
- app/features/modules/server.ts
- app/features/mortality/server.ts
- app/features/notifications/server.ts
- app/features/onboarding/server.ts
- app/features/reports/server.ts
- app/features/sales/server.ts
- app/features/settings/server.ts
- app/features/structures/server.ts
- app/features/suppliers/server.ts
- app/features/users/server.ts
- app/features/vaccinations/server.ts
- app/features/water-quality/server.ts
- app/features/weight/server.ts

**Message**:

```
refactor(server): migrate all server functions to AppError

- Replace generic Error throws with typed AppError instances
- Add proper error codes: ACCESS_DENIED, NOT_FOUND, VALIDATION_ERROR, etc.
- Wrap operations in try-catch with AppError re-throwing
- Add metadata for debugging (farmId, batchId, etc.)
- Improve error messages for better user experience

27 server modules updated with consistent error handling
```

### Commit 3: feat(ui): enhance error handling and i18n integration

**Files**:

- app/components/dialogs/batch-dialog.tsx
- app/components/dialogs/customer-dialog.tsx
- app/components/dialogs/edit-farm-dialog.tsx
- app/components/dialogs/egg-dialog.tsx
- app/components/dialogs/expense-dialog.tsx
- app/components/dialogs/farm-dialog.tsx
- app/components/dialogs/feed-dialog.tsx
- app/components/dialogs/invoice-dialog.tsx
- app/components/dialogs/mortality-dialog.tsx
- app/components/dialogs/sale-dialog.tsx
- app/components/dialogs/supplier-dialog.tsx
- app/components/dialogs/weight-dialog.tsx
- app/components/error-page.tsx
- app/components/ui/language-switcher.tsx
- app/features/auth/components/AuthShell.tsx
- app/features/i18n/locales/am.ts
- app/features/i18n/locales/bn.ts
- app/features/i18n/locales/en.ts
- app/features/i18n/locales/es.ts
- app/features/i18n/locales/fr.ts
- app/features/i18n/locales/ha.ts
- app/features/i18n/locales/hi.ts
- app/features/i18n/locales/id.ts
- app/features/i18n/locales/ig.ts
- app/features/i18n/locales/pt.ts
- app/features/i18n/locales/sw.ts
- app/features/i18n/locales/th.ts
- app/features/i18n/locales/tr.ts
- app/features/i18n/locales/vi.ts
- app/features/i18n/locales/yo.ts
- app/features/landing/components/ChangelogList.tsx
- app/features/landing/components/CommunitySection.tsx
- app/features/landing/components/RoadmapTimeline.tsx
- app/features/landing/components/SmartEcosystemSection.tsx
- app/lib/query-client.ts
- app/routes/_auth/sales/index.tsx
- app/routes/login.tsx
- app/routes/register.tsx

**Message**:

```
feat(ui): enhance error handling and i18n integration

- Update all 12 dialogs to use useErrorMessage hook for consistent error display
- Add error translations to all 15 language locales
- Improve language switcher with better error handling
- Update login/register forms with AppError integration
- Enhance query client error handling for better UX
- Update landing page components with i18n integration

38 UI components updated with centralized error handling
```

### Commit 4: chore: update dependencies and configuration

**Files**:

- package.json
- bun.lock
- app/features/settings/currency-presets.ts
- .kiro/agents/i18n-engineer.json
- CONTRIBUTING.md
- DEVLOG.md
- .agents/commit-plan-2026-01-20.md
- .agents/plans/centralized-error-handling.md
- .agents/plans/error-handling-improvements.md
- .agents/plans/fix-i18n-inconsistencies.md
- .agents/plans/i18n-component-migration.md

**Message**:

```
chore: update dependencies and configuration

- Add new dependencies for error handling system
- Update currency presets with error handling
- Update i18n engineer agent configuration
- Add implementation plans for error handling and i18n
- Update CONTRIBUTING.md and DEVLOG.md with latest changes

Configuration and documentation updates for error handling system
```

## Execution

```bash
# Commit 1: Core error handling system
git add app/lib/errors/ app/hooks/useErrorMessage.ts app/features/settings/currency-core.ts
git commit -m "feat(errors): implement centralized error handling system

- Add AppError class with typed error codes and metadata
- Add ErrorMap with 50+ standardized error definitions
- Add useErrorMessage hook for client-side error handling
- Add currency core utilities for error-safe operations

Provides type-safe, i18n-ready error handling across the stack"

# Commit 2: Server function migration
git add app/features/auth/server-middleware.ts app/features/auth/server.ts app/features/batches/server.ts app/features/customers/server.ts app/features/dashboard/server.ts app/features/eggs/server.ts app/features/expenses/server.ts app/features/export/server.ts app/features/farms/server.ts app/features/feed/server.ts app/features/integrations/server.ts app/features/inventory/feed-server.ts app/features/inventory/medication-server.ts app/features/invoices/server.ts app/features/modules/server.ts app/features/mortality/server.ts app/features/notifications/server.ts app/features/onboarding/server.ts app/features/reports/server.ts app/features/sales/server.ts app/features/settings/server.ts app/features/structures/server.ts app/features/suppliers/server.ts app/features/users/server.ts app/features/vaccinations/server.ts app/features/water-quality/server.ts app/features/weight/server.ts
git commit -m "refactor(server): migrate all server functions to AppError

- Replace generic Error throws with typed AppError instances
- Add proper error codes: ACCESS_DENIED, NOT_FOUND, VALIDATION_ERROR, etc.
- Wrap operations in try-catch with AppError re-throwing
- Add metadata for debugging (farmId, batchId, etc.)
- Improve error messages for better user experience

27 server modules updated with consistent error handling"

# Commit 3: UI and i18n updates
git add app/components/dialogs/batch-dialog.tsx app/components/dialogs/customer-dialog.tsx app/components/dialogs/edit-farm-dialog.tsx app/components/dialogs/egg-dialog.tsx app/components/dialogs/expense-dialog.tsx app/components/dialogs/farm-dialog.tsx app/components/dialogs/feed-dialog.tsx app/components/dialogs/invoice-dialog.tsx app/components/dialogs/mortality-dialog.tsx app/components/dialogs/sale-dialog.tsx app/components/dialogs/supplier-dialog.tsx app/components/dialogs/weight-dialog.tsx app/components/error-page.tsx app/components/ui/language-switcher.tsx app/features/auth/components/AuthShell.tsx app/features/i18n/locales/am.ts app/features/i18n/locales/bn.ts app/features/i18n/locales/en.ts app/features/i18n/locales/es.ts app/features/i18n/locales/fr.ts app/features/i18n/locales/ha.ts app/features/i18n/locales/hi.ts app/features/i18n/locales/id.ts app/features/i18n/locales/ig.ts app/features/i18n/locales/pt.ts app/features/i18n/locales/sw.ts app/features/i18n/locales/th.ts app/features/i18n/locales/tr.ts app/features/i18n/locales/vi.ts app/features/i18n/locales/yo.ts app/features/landing/components/ChangelogList.tsx app/features/landing/components/CommunitySection.tsx app/features/landing/components/RoadmapTimeline.tsx app/features/landing/components/SmartEcosystemSection.tsx app/lib/query-client.ts app/routes/_auth/sales/index.tsx app/routes/login.tsx app/routes/register.tsx
git commit -m "feat(ui): enhance error handling and i18n integration

- Update all 12 dialogs to use useErrorMessage hook for consistent error display
- Add error translations to all 15 language locales
- Improve language switcher with better error handling
- Update login/register forms with AppError integration
- Enhance query client error handling for better UX
- Update landing page components with i18n integration

38 UI components updated with centralized error handling"

# Commit 4: Configuration and documentation
git add package.json bun.lock app/features/settings/currency-presets.ts .kiro/agents/i18n-engineer.json CONTRIBUTING.md DEVLOG.md .agents/commit-plan-2026-01-20.md .agents/plans/centralized-error-handling.md .agents/plans/error-handling-improvements.md .agents/plans/fix-i18n-inconsistencies.md .agents/plans/i18n-component-migration.md
git commit -m "chore: update dependencies and configuration

- Add new dependencies for error handling system
- Update currency presets with error handling
- Update i18n engineer agent configuration
- Add implementation plans for error handling and i18n
- Update CONTRIBUTING.md and DEVLOG.md with latest changes

Configuration and documentation updates for error handling system"
```

## Validation

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Tests passing
- [ ] Git status clean

## Impact

This major refactoring implements a centralized error handling system that:

- **Type Safety**: All errors now use typed error codes instead of generic strings
- **Consistency**: Standardized error messages and HTTP status codes across all server functions
- **i18n Ready**: Error messages support internationalization with 15 languages
- **Developer Experience**: Better debugging with structured error metadata
- **User Experience**: More user-friendly error messages in the UI

The system replaces ad-hoc error handling with a structured approach that scales across the entire application.
