# Codebase Audit: Security & Maintainability Remediation Plan

This document outlines the architectural risks and technical debt identified during the system-wide type-safety and linting audit conducted on January 22, 2026.

## 1. Security: SQL Injection via Dynamic Sorting

### Risk

To resolve TypeScript limitations with Kysely's dynamic `orderBy` clauses, the codebase now utilizes `sql.raw()` in several repositories (Weight, Feed, Water Quality, Mortality, Eggs). While this provides type safety at the compiler level, it introduces a **SQL Injection vector** if the sort column string is passed directly from user-provided search parameters without validation.

### Recommendations

- **Strict Validation:** Update all Route `validateSearch` functions and Zod schemas to use `.enum()` for `sortBy` fields instead of generic `.string()`.
- **Repository Allowlisting:** Ensure repository functions only accept valid column names.
- **Priority:** High (Critical Security)

## 2. Maintainability: Route Loader Bloat

### Risk

Primary dashboard and detail routes (notably `app/routes/_auth/farms/$farmId/index.tsx`) have exceeded 1,200 lines of code. The loaders perform heavy parallel data fetching (`Promise.all`) which creates "God Components" that are difficult to debug, test in isolation, and maintain as the feature set grows.

### Recommendations

- **Component-Level Fetching:** Break down massive dashboard views into smaller, atomic components that utilize TanStack Query (`useQuery`) for their specific data needs.
- **Backend Facades:** Move complex `Promise.all` orchestration logic from the Route Loaders into dedicated Facade services within the feature's `server.ts` layer.
- **Priority:** Medium

## 3. Architecture: Type Drift & Source of Truth

### Risk

There are multiple instances where interfaces (e.g., `FarmStats`, `SupplierRecord`) are manually redefined inside route files rather than being imported from their respective feature server/service layers. Additionally, constants like `FEED_TYPES` are sometimes hardcoded in tests.

### Recommendations

- **Single Source of Truth:** Centralize all domain interfaces in `features/[feature]/server.ts` and export them.
- **Automated Type Inference:** Use `Awaited<ReturnType<typeof serverFn>>` in routes to ensure view-layer types automatically stay in sync with backend changes.
- **Priority:** Medium

## 4. Stability: Circular Dependency Management

### Risk

Tight coupling exists between several primary features (e.g., `batches` depending on `feed`, and `feed` calculations depending on `batch` data). This increases the risk of circular dependency errors and makes unit testing individual modules in isolation more complex.

### Recommendations

- **Shared Kernel:** Extract shared logic and shared types into `app/lib/core` or a similar shared kernel directory that features can depend on without depending on each other.
- **Domain Event Pattern:** Consider using a simple internal event system or hooks to decouple modules.
- **Priority:** Low

---

## Immediate Action Items

1. [ ] Audit all `sql.raw` usages in repositories.
2. [ ] Replace `z.string().optional()` with specific `z.enum([...])` for all `sortBy` parameters in route search schemas.
3. [ ] Refactor `FarmDetailsPage` by extracting the activity tabs into standalone components.
4. [ ] Standardize the import of `SupplierRecord` and `FarmStats` across the application.
