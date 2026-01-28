# Feature: Centralized Error Handling System

## Feature Description

Implement a unified, type-safe error handling system that works across both server functions and client components. The system provides:

- Typed error classes with error codes
- Centralized error dictionary for consistency
- User-friendly error messages with i18n support
- Developer-friendly error details for debugging
- Integration with TanStack Router error boundaries and TanStack Query

## User Story

As a developer
I want a centralized error handling system
So that I can throw consistent, typed errors on the server and display user-friendly messages on the client

## Problem Statement

Current error handling is inconsistent:

- Server functions throw generic `Error` with string messages
- No standardized error codes or categories
- Error messages are hardcoded, not internationalized
- No structured metadata for debugging
- Client has no way to distinguish error types

## Solution Statement

Create a two-part error system:

1. **Server**: `AppError` class with typed reason codes, HTTP status, and metadata
2. **Client**: Error boundary components and toast handlers that display i18n messages

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**: Server functions, error boundaries, toast notifications
**Dependencies**: None (uses existing i18n infrastructure)

---

## CONTEXT REFERENCES

### Relevant Codebase Files

- `app/lib/query-client.ts` - Current QueryClient with basic retry logic
- `app/routes/__root.tsx` (lines 27-28) - Current errorComponent setup
- `app/components/error-page.tsx` - Current error page UI
- `app/features/auth/server-middleware.ts` (lines 15-16) - Current error throwing pattern
- `app/features/batches/server.ts` (lines 139, 197) - Example throw patterns
- `app/features/i18n/locales/en.ts` - i18n locale structure

### New Files to Create

- `app/lib/errors/types.ts` - Error types and interfaces
- `app/lib/errors/error-map.ts` - Central error dictionary
- `app/lib/errors/app-error.ts` - AppError class
- `app/lib/errors/index.ts` - Public exports
- `app/features/i18n/locales/*/errors.ts` - Error messages per locale
- `app/components/error-boundary.tsx` - Enhanced error boundary

### Relevant Documentation

- [TanStack Start Error Boundaries](https://tanstack.com/start/latest/docs/framework/react/guide/error-boundaries)
    - Shows errorComponent pattern for routes
- [TanStack Start Observability](https://tanstack.com/start/latest/docs/framework/react/guide/observability)
    - Shows error logging patterns in server functions
- [Unified Error Handling Pattern](https://hsawana9.com/docs/error)
    - AppError class and ErrorMap pattern reference

### Patterns to Follow

**Current Error Throwing Pattern:**

```typescript
// app/features/batches/server.ts
throw new Error('Access denied to this farm')
throw new Error('Batch not found')
```

**Target Pattern:**

```typescript
import { AppError } from '~/lib/errors'

throw new AppError('ACCESS_DENIED', {
    metadata: { farmId, userId },
})
throw new AppError('NOT_FOUND', {
    metadata: { resourceType: 'batch', resourceId: batchId },
})
```

**i18n Locale Structure:**

```typescript
// app/features/i18n/locales/en.ts
export const en = {
  common: { ... },
  batches: { ... },
  errors: { ... }  // Add this namespace
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Core Error System

**STATUS: COMPLETED**

Create the foundational error types, dictionary, and class.

**Tasks:**

- [x] Define ErrorMetadata interface
- [x] Create ErrorMap with all error codes
- [x] Implement AppError class
- [x] Export public API

### Phase 2: i18n Integration

**STATUS: COMPLETED**

Add error messages to all locale files.

**Tasks:**

- [x] Add errors namespace to English locale
- [x] Add errors namespace to all 15 locales
- [x] Create useErrorMessage hook

### Phase 3: Server Integration

**STATUS: IN PROGRESS**

Update server functions to use AppError.

**Tasks:**

- [x] Update auth middleware to use AppError
- [ ] Create helper for catching and re-throwing errors
- [x] Update key server functions (batches, farms)
- [ ] Update remaining server functions (sales, expenses, etc.)

### Phase 4: Client Integration

**STATUS: COMPLETED**

Integrate with error boundaries and toasts.

**Tasks:**

- [x] Enhance error boundary to handle AppError
- [x] Update QueryClient with global error handler
- [ ] Create useServerAction hook with error handling

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/lib/errors/types.ts`

- **IMPLEMENT**: Error metadata interface and reason code type
- **PATTERN**: Follow TypeScript strict typing
- **VALIDATE**: `npx tsc --noEmit app/lib/errors/types.ts`

```typescript
export interface ErrorMetadata {
    userId?: string
    farmId?: string
    resourceId?: string
    resourceType?: string
    action?: string
    field?: string
    [key: string]: unknown
}

export interface ErrorDefinition {
    code: number
    httpStatus: number
    category: 'AUTH' | 'VALIDATION' | 'NOT_FOUND' | 'FORBIDDEN' | 'SERVER'
    message: string // Developer message (not shown to users)
}
```

### Task 2: CREATE `app/lib/errors/error-map.ts`

- **IMPLEMENT**: Central error dictionary with all error codes
- **PATTERN**: Use `as const` for type inference
- **VALIDATE**: `npx tsc --noEmit app/lib/errors/error-map.ts`

```typescript
export const ErrorMap = {
    // Auth (401xx)
    UNAUTHORIZED: {
        code: 40100,
        httpStatus: 401,
        category: 'AUTH',
        message: 'Not authenticated',
    },
    SESSION_EXPIRED: {
        code: 40101,
        httpStatus: 401,
        category: 'AUTH',
        message: 'Session expired',
    },
    INVALID_CREDENTIALS: {
        code: 40102,
        httpStatus: 401,
        category: 'AUTH',
        message: 'Invalid credentials',
    },

    // Forbidden (403xx)
    ACCESS_DENIED: {
        code: 40300,
        httpStatus: 403,
        category: 'FORBIDDEN',
        message: 'Access denied',
    },
    BANNED: {
        code: 40301,
        httpStatus: 403,
        category: 'FORBIDDEN',
        message: 'User is banned',
    },

    // Not Found (404xx)
    NOT_FOUND: {
        code: 40400,
        httpStatus: 404,
        category: 'NOT_FOUND',
        message: 'Resource not found',
    },
    FARM_NOT_FOUND: {
        code: 40401,
        httpStatus: 404,
        category: 'NOT_FOUND',
        message: 'Farm not found',
    },
    BATCH_NOT_FOUND: {
        code: 40402,
        httpStatus: 404,
        category: 'NOT_FOUND',
        message: 'Batch not found',
    },

    // Validation (400xx)
    VALIDATION_ERROR: {
        code: 40000,
        httpStatus: 400,
        category: 'VALIDATION',
        message: 'Validation failed',
    },
    INVALID_INPUT: {
        code: 40001,
        httpStatus: 400,
        category: 'VALIDATION',
        message: 'Invalid input',
    },
    INSUFFICIENT_STOCK: {
        code: 40002,
        httpStatus: 400,
        category: 'VALIDATION',
        message: 'Insufficient stock',
    },

    // Server (500xx)
    INTERNAL_ERROR: {
        code: 50000,
        httpStatus: 500,
        category: 'SERVER',
        message: 'Internal server error',
    },
    DATABASE_ERROR: {
        code: 50001,
        httpStatus: 500,
        category: 'SERVER',
        message: 'Database error',
    },
} as const

export type ReasonCode = keyof typeof ErrorMap
```

### Task 3: CREATE `app/lib/errors/app-error.ts`

- **IMPLEMENT**: Custom error class with serialization support
- **PATTERN**: Extend Error, add metadata, support JSON serialization
- **GOTCHA**: Must be serializable for server→client transfer
- **VALIDATE**: `npx tsc --noEmit app/lib/errors/app-error.ts`

```typescript
import { ErrorMap, type ReasonCode } from './error-map'
import type { ErrorMetadata } from './types'

export class AppError extends Error {
    public readonly reason: ReasonCode
    public readonly code: number
    public readonly httpStatus: number
    public readonly category: string
    public readonly metadata: ErrorMetadata

    constructor(
        reason: ReasonCode,
        options?: { metadata?: ErrorMetadata; cause?: unknown },
    ) {
        const def = ErrorMap[reason]
        super(def.message)
        this.name = 'AppError'
        this.reason = reason
        this.code = def.code
        this.httpStatus = def.httpStatus
        this.category = def.category
        this.metadata = options?.metadata ?? {}
        this.cause = options?.cause
    }

    toJSON() {
        return {
            name: this.name,
            reason: this.reason,
            code: this.code,
            httpStatus: this.httpStatus,
            category: this.category,
            message: this.message,
            metadata: this.metadata,
        }
    }

    static isAppError(error: unknown): error is AppError {
        return (
            error instanceof AppError ||
            (error instanceof Error && error.name === 'AppError')
        )
    }

    static fromJSON(json: ReturnType<AppError['toJSON']>): AppError {
        const err = new AppError(json.reason as ReasonCode, {
            metadata: json.metadata,
        })
        return err
    }
}
```

### Task 4: CREATE `app/lib/errors/index.ts`

- **IMPLEMENT**: Public exports
- **VALIDATE**: `npx tsc --noEmit app/lib/errors/index.ts`

```typescript
export { AppError } from './app-error'
export { ErrorMap, type ReasonCode } from './error-map'
export type { ErrorMetadata, ErrorDefinition } from './types'
```

### Task 5: UPDATE `app/features/i18n/locales/en.ts`

- **IMPLEMENT**: Add errors namespace with user-friendly messages
- **PATTERN**: Match error codes to i18n keys
- **VALIDATE**: Check locale file loads without errors

Add to the en locale:

```typescript
errors: {
  // Auth
  UNAUTHORIZED: 'Please sign in to continue',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  INVALID_CREDENTIALS: 'Invalid email or password',

  // Forbidden
  ACCESS_DENIED: 'You don\'t have permission to access this resource',
  BANNED: 'Your account has been suspended',

  // Not Found
  NOT_FOUND: 'The requested resource was not found',
  FARM_NOT_FOUND: 'Farm not found',
  BATCH_NOT_FOUND: 'Batch not found',

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_INPUT: 'Invalid input provided',
  INSUFFICIENT_STOCK: 'Not enough stock available',

  // Server
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
  DATABASE_ERROR: 'A database error occurred. Please try again',

  // Generic
  unknown: 'An unexpected error occurred',
}
```

### Task 6: UPDATE other locale files

- **IMPLEMENT**: Add errors namespace to all 14 other locales
- **PATTERN**: Copy structure from en.ts, translate messages
- **VALIDATE**: `bun run lint`

Files to update:

- `app/features/i18n/locales/fr.ts`
- `app/features/i18n/locales/es.ts`
- `app/features/i18n/locales/pt.ts`
- `app/features/i18n/locales/sw.ts`
- `app/features/i18n/locales/ha.ts`
- `app/features/i18n/locales/yo.ts`
- `app/features/i18n/locales/ig.ts`
- `app/features/i18n/locales/hi.ts`
- `app/features/i18n/locales/tr.ts`
- `app/features/i18n/locales/am.ts`
- `app/features/i18n/locales/bn.ts`
- `app/features/i18n/locales/id.ts`
- `app/features/i18n/locales/th.ts`
- `app/features/i18n/locales/vi.ts`

### Task 7: CREATE `app/hooks/useErrorMessage.ts`

- **IMPLEMENT**: Hook to get i18n error message from AppError
- **PATTERN**: Use useTranslation from react-i18next
- **VALIDATE**: `npx tsc --noEmit app/hooks/useErrorMessage.ts`

```typescript
import { useTranslation } from 'react-i18next'
import { AppError } from '~/lib/errors'

export function useErrorMessage() {
    const { t } = useTranslation('common')

    return (error: unknown): string => {
        if (AppError.isAppError(error)) {
            return t(`errors.${error.reason}`, {
                defaultValue: t('errors.unknown'),
            })
        }
        if (error instanceof Error) {
            return error.message
        }
        return t('errors.unknown')
    }
}
```

### Task 8: UPDATE `app/features/auth/server-middleware.ts`

- **IMPLEMENT**: Use AppError instead of plain Error
- **PATTERN**: Import AppError, throw with reason codes
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { AppError } from '~/lib/errors'

// Replace:
throw new Error('UNAUTHORIZED')
// With:
throw new AppError('UNAUTHORIZED')

// Replace:
throw new Error('BANNED')
// With:
throw new AppError('BANNED', { metadata: { userId: session.user.id } })
```

### Task 9: UPDATE `app/lib/query-client.ts`

- **IMPLEMENT**: Add global error handler to QueryClient
- **PATTERN**: Use queryCache.onError for global handling
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { AppError } from '~/lib/errors'

export const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 1000 * 60 * 60 * 24,
                staleTime: 1000 * 60,
                retry: (failureCount, error) => {
                    // Don't retry auth errors
                    if (AppError.isAppError(error)) {
                        if (
                            error.category === 'AUTH' ||
                            error.category === 'FORBIDDEN'
                        ) {
                            return false
                        }
                    }
                    if ((error as any).status === 404) return false
                    return failureCount < 3
                },
            },
        },
    })
}
```

### Task 10: UPDATE `app/components/error-page.tsx`

- **IMPLEMENT**: Handle AppError with i18n messages
- **PATTERN**: Check for AppError, display appropriate message
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { useTranslation } from 'react-i18next'
import { AppError } from '~/lib/errors'

export function ErrorPage({ error, reset }: ErrorPageProps) {
    const { t } = useTranslation('common')

    const errorMessage = AppError.isAppError(error)
        ? t(`errors.${error.reason}`, { defaultValue: t('errors.unknown') })
        : t('errors.unknown')

    // Use errorMessage in the UI
}
```

### Task 11: UPDATE key server functions

- **IMPLEMENT**: Replace throw new Error with throw new AppError
- **FILES**: batches/server.ts, farms/server.ts, sales/server.ts
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

Example replacements:

```typescript
// Before:
throw new Error('Access denied to this farm')
// After:
throw new AppError('ACCESS_DENIED', { metadata: { farmId } })

// Before:
throw new Error('Batch not found')
// After:
throw new AppError('BATCH_NOT_FOUND', { metadata: { batchId } })

// Before:
throw new Error('Quantity exceeds available stock')
// After:
throw new AppError('INSUFFICIENT_STOCK', { metadata: { available, requested } })
```

---

## TESTING STRATEGY

### Unit Tests

- Test AppError construction and serialization
- Test ErrorMap has all required fields
- Test isAppError type guard

### Integration Tests

- Test server function throws AppError
- Test error boundary catches and displays message
- Test toast shows correct i18n message

### Edge Cases

- Unknown error type falls back to generic message
- Missing i18n key falls back to English
- Nested cause errors preserve stack trace

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
bun run lint
```

### Level 2: Unit Tests

```bash
bun test tests/lib/errors
```

### Level 3: Manual Validation

1. Trigger an auth error → should show "Please sign in to continue"
2. Access non-existent batch → should show "Batch not found"
3. Change language → error messages should translate

---

## ACCEPTANCE CRITERIA

- [x] AppError class with typed reason codes
- [x] ErrorMap with 15+ error definitions
- [x] Error messages in all 15 locales
- [x] Auth middleware uses AppError
- [x] Error page displays i18n messages
- [x] QueryClient handles AppError retry logic
- [x] 0 TypeScript errors
- [x] 0 ESLint errors

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Error messages display correctly
- [ ] i18n translations work

---

## NOTES

**Design Decisions:**

- Keep ErrorMap simple (no nested categories) for easy lookup
- Use reason codes as i18n keys for direct mapping
- Metadata is optional to keep simple cases simple
- toJSON/fromJSON for server→client serialization

**Future Enhancements:**

- Add Sentry integration for error tracking
- Add error logging middleware
- Add error analytics dashboard

**References:**

- [TanStack Start Error Boundaries](https://tanstack.com/start/latest/docs/framework/react/guide/error-boundaries)
- [Unified Error Handling Pattern](https://hsawana9.com/docs/error)
