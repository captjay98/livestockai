# Implementation Plan: Cloudflare Hyperdrive Setup

## Overview

This implementation plan covers the migration from `NeonDialect` (HTTP driver) to `PostgresDialect` with Cloudflare Hyperdrive for full transaction support. The migration is designed to be transparent to existing code.

## Tasks

- [x] 1. Update Wrangler Configuration
  - [x] 1.1 Add Hyperdrive binding to wrangler.jsonc
    - Add `hyperdrive` array with binding configuration
    - Include placeholder for Hyperdrive configuration ID
    - Add `localConnectionString` for wrangler dev
    - Ensure `nodejs_compat` flag is present
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Refactor Database Connection Module
  - [x] 2.1 Update app/lib/db/index.ts to use PostgresDialect
    - Import `PostgresDialect` from kysely and `Pool` from pg
    - Create `getConnectionString()` function with environment detection
    - Update `getDb()` to use PostgresDialect with pg Pool
    - Update synchronous `db` export to use PostgresDialect
    - Add TypeScript types for Cloudflare environment with Hyperdrive
    - Add comprehensive inline comments explaining the integration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1_
  - [x] 2.2 Write property test for connection string resolution
    - **Property 1: Connection String Resolution**
    - Test that Hyperdrive connection string is preferred when available
    - Test that process.env.DATABASE_URL is used as fallback
    - **Validates: Requirements 2.1, 2.2, 4.1**
  - [x] 2.3 Write property test for missing configuration error
    - **Property 3: Missing Configuration Error**
    - Test that descriptive error is thrown when no config available
    - **Validates: Requirements 4.4**

- [x] 3. Checkpoint - Verify Local Development Works
  - Ensure all tests pass, ask the user if questions arise.
  - Run `bun dev` and verify database queries work
  - Run existing integration tests

- [x] 4. Update Environment Configuration
  - [x] 4.1 Update .dev.vars with documentation comments
    - Add comments explaining each environment variable
    - Ensure DATABASE_URL is properly configured
    - _Requirements: 4.1, 4.3_

- [x] 5. Update Steering Documentation
  - [x] 5.1 Update neon-database.md steering file
    - Add section on Hyperdrive setup
    - Document the migration from NeonDialect to PostgresDialect
    - Include Cloudflare dashboard setup instructions
    - _Requirements: 6.2, 6.3_

- [x] 6. Integration Testing
  - [x] 6.1 Write integration test for transaction support
    - **Property 2: Transaction Atomicity**
    - Test that transactions commit all operations on success
    - Test that transactions rollback all operations on failure
    - **Validates: Requirements 3.1, 3.3**
  - [x] 6.2 Verify existing transaction code works
    - Run existing integration tests
    - Verify mortality, feed, sales, and expense transactions work
    - **Validates: Requirements 3.2, 5.3**

- [x] 7. Final Checkpoint - Full Verification
  - Ensure all tests pass, ask the user if questions arise.
  - Run `bun run test` for unit tests
  - Run `bun run test:integration` for integration tests
  - Test with `wrangler dev` if Hyperdrive is configured

## Notes

- All tasks are required for comprehensive testing
- The `pg` package is already installed in the project
- No changes to server functions or repositories are required
- The migration is transparent to the application layer
- Hyperdrive configuration ID must be obtained from Cloudflare dashboard before deployment
