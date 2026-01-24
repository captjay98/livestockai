# Slim Remaining Routes - Quick Plan

Refactor 7 routes still over 150 lines to follow the established pattern.

## Routes to Refactor

| Route        | Lines | Issue                                 | Solution                                 |
| ------------ | ----- | ------------------------------------- | ---------------------------------------- |
| vaccinations | 327   | Dual mode (vaccinations + treatments) | Extract treatment logic to separate hook |
| eggs         | 278   | Complex egg collection + sales logic  | Extract to custom hook                   |
| reports      | 270   | Multiple report types + date logic    | Extract report generation to server fn   |
| settings     | 249   | Multiple tabs with complex state      | Extract each tab to separate component   |
| inventory    | 237   | Feed + medication inventory           | Extract to separate hooks per type       |
| tasks        | 224   | Task list + completion logic          | Extract task list to component           |
| farms        | 212   | Farm stats + CRUD operations          | Extract farm list to component           |

## Strategy

For each route:

1. Extract complex logic to custom hooks (`use-*-page.ts`)
2. Extract large components to separate files
3. Move server functions if inline
4. Target: ~120 lines per route

## Quick Wins

- **Vaccinations**: Extract `useTreatmentMode()` hook
- **Eggs**: Extract `useEggPage()` hook
- **Reports**: Extract `useReportFilters()` hook
- **Settings**: Extract tab components to `components/settings/`
- **Inventory**: Extract `useFeedInventory()` and `useMedicationInventory()` hooks
- **Tasks**: Extract `TaskList` component
- **Farms**: Extract `FarmList` component
